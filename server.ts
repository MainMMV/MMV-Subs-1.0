import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { 
  listApiKeys, 
  generateApiKey, 
  deleteApiKey, 
  validateApiKey, 
  getServerData, 
  saveServerData,
  computeNextRecurrenceDate
} from "./server-store.js";
import { getOpenApiSpec } from "./server-openapi.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing with larger limit for synchronization
  app.use(express.json({ limit: "10mb" }));

  // CORS Middleware for external AI clients (ChatGPT Actions, Gemini agents)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // OPENAPI SPECIFICATION (For ChatGPT Custom GPTs & Gemini Tools)
  // -------------------------------------------------------------
  app.get("/api/v1/openapi.json", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get("host") || `localhost:${PORT}`;
    const baseUrl = `${protocol}://${host}`;
    const spec = getOpenApiSpec(baseUrl);
    res.setHeader("Content-Type", "application/json");
    res.json(spec);
  });

  // -------------------------------------------------------------
  // AUTHENTICATION & API KEY MANAGEMENT
  // -------------------------------------------------------------
  // Public listing & creation for web UI settings
  app.get("/api/v1/auth/keys", (_req, res) => {
    const keys = listApiKeys();
    res.json({ success: true, keys });
  });

  app.post("/api/v1/auth/keys", (req, res) => {
    const { name } = req.body || {};
    const key = generateApiKey(name || "AI Connector Key");
    res.status(201).json({ success: true, key });
  });

  app.delete("/api/v1/auth/keys/:id", (req, res) => {
    const success = deleteApiKey(req.params.id);
    res.json({ success });
  });

  // API Key Protection Middleware for /api/v1 operations
  const requireApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Check x-api-key header or Authorization: Bearer <key>
    const headerKey = req.headers["x-api-key"] as string | undefined;
    const authHeader = req.headers["authorization"] as string | undefined;
    let bearerKey: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      bearerKey = authHeader.slice(7).trim();
    }
    const token = headerKey || bearerKey;

    // Allow requests originating from localhost / internal preview during initial exploration
    const isLocalOrPreview = req.hostname === "localhost" || req.hostname === "127.0.0.1";
    if (validateApiKey(token) || (isLocalOrPreview && !token && listApiKeys().length === 0)) {
      return next();
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid API key required. Provide via 'x-api-key' header or 'Authorization: Bearer <key>'."
    });
  };

  // -------------------------------------------------------------
  // CLIENT BIDIRECTIONAL SYNC
  // -------------------------------------------------------------
  app.post("/api/v1/sync", (req, res) => {
    try {
      const { items, habits, habitLogs, goals, records, exchangeRateUsdToUzs, telegramConfig } = req.body || {};
      const current = getServerData();

      if (Array.isArray(items)) current.items = items;
      if (Array.isArray(habits)) current.habits = habits;
      if (habitLogs && typeof habitLogs === "object") current.habitLogs = habitLogs;
      if (Array.isArray(goals)) current.goals = goals;
      if (Array.isArray(records)) current.records = records;
      if (typeof exchangeRateUsdToUzs === "number") current.exchangeRateUsdToUzs = exchangeRateUsdToUzs;
      if (telegramConfig) current.telegramConfig = telegramConfig;

      saveServerData(current);
      res.json({ success: true, updatedAt: current.updatedAt });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/v1/sync", (_req, res) => {
    const data = getServerData();
    res.json({ success: true, data });
  });

  // -------------------------------------------------------------
  // FINANCIAL SUMMARY & FORECAST
  // -------------------------------------------------------------
  app.get("/api/v1/summary", requireApiKey, (_req, res) => {
    const data = getServerData();
    const items = data.items || [];
    const goals = data.goals || [];
    const habits = data.habits || [];
    const rate = data.exchangeRateUsdToUzs || 12800;
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);
    const currentYearPrefix = String(now.getFullYear());

    let thisMonthUsd = 0;
    let thisYearUsd = 0;

    items.forEach((item) => {
      const usdPrice = item.currency === "USD" ? item.price : item.price / rate;
      if (item.date && item.date.startsWith(currentMonthPrefix)) {
        thisMonthUsd += usdPrice;
      }
      if (item.date && item.date.startsWith(currentYearPrefix)) {
        thisYearUsd += usdPrice;
      }
    });

    const activeSubscriptions = items.filter((i) => i.type === "subscription" && i.manualStatus !== "paid").length;
    const activeBills = items.filter((i) => i.type === "bill" && i.manualStatus !== "paid").length;
    const activePurchases = items.filter((i) => i.type === "purchase" && i.manualStatus !== "paid").length;

    res.json({
      summary: {
        thisMonthSpendingUsd: Number(thisMonthUsd.toFixed(2)),
        thisMonthSpendingUzs: Math.round(thisMonthUsd * rate),
        thisYearSpendingUsd: Number(thisYearUsd.toFixed(2)),
        thisYearSpendingUzs: Math.round(thisYearUsd * rate),
        exchangeRateUsdToUzs: rate,
        counts: {
          activeSubscriptions,
          activeBills,
          activePurchases,
          totalItems: items.length,
          activeGoals: goals.filter((g) => !g.isCompleted).length,
          trackedHabits: habits.filter((h) => !h.isPaused).length
        }
      }
    });
  });

  // -------------------------------------------------------------
  // ITEMS API (Subscriptions, Bills, One-Time Purchases)
  // -------------------------------------------------------------
  app.get("/api/v1/items", requireApiKey, (req, res) => {
    const data = getServerData();
    let items = data.items || [];

    const { type, status } = req.query;
    if (type && typeof type === "string") {
      items = items.filter((i) => i.type === type);
    }
    if (status && typeof status === "string") {
      const todayStr = new Date().toISOString().slice(0, 10);
      items = items.filter((i) => {
        if (status === "paid") return i.manualStatus === "paid";
        if (i.manualStatus === "paid") return false;
        if (status === "due_today") return i.date === todayStr;
        if (status === "overdue") return i.date < todayStr;
        if (status === "upcoming") return i.date > todayStr;
        return true;
      });
    }

    res.json({ items, count: items.length });
  });

  app.post("/api/v1/items", requireApiKey, (req, res) => {
    const { type, name, price, currency, date, time, notes, frequency, reminders } = req.body;
    if (!type || !name || price === undefined || !currency || !date) {
      return res.status(400).json({ error: "Missing required fields: type, name, price, currency, date" });
    }

    const data = getServerData();
    const idPrefix = type === "subscription" ? "sub" : type === "bill" ? "bill" : "purch";
    const newItem = {
      id: `${idPrefix}-${Date.now()}`,
      type,
      name,
      price: Number(price),
      currency,
      date,
      time: time || "09:00",
      notes: notes || "",
      frequency: frequency || (type !== "purchase" ? { interval: 1, unit: "months" } : undefined),
      reminders: reminders || [
        { id: `rem-${Date.now()}`, timing: "before", duration: 1, unit: "days", exactTime: "09:00", channel: "both", enabled: true }
      ],
      status: "upcoming",
      manualStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.items.unshift(newItem);
    saveServerData(data);
    res.status(201).json({ success: true, item: newItem });
  });

  app.get("/api/v1/items/:id", requireApiKey, (req, res) => {
    const data = getServerData();
    const item = (data.items || []).find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ item });
  });

  app.put("/api/v1/items/:id", requireApiKey, (req, res) => {
    const data = getServerData();
    const index = (data.items || []).findIndex((i) => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Item not found" });

    const updated = {
      ...data.items[index],
      ...req.body,
      id: req.params.id, // prevent ID override
      updatedAt: new Date().toISOString()
    };
    data.items[index] = updated;
    saveServerData(data);
    res.json({ success: true, item: updated });
  });

  app.delete("/api/v1/items/:id", requireApiKey, (req, res) => {
    const data = getServerData();
    const initialLen = data.items.length;
    data.items = data.items.filter((i) => i.id !== req.params.id);
    if (data.items.length === initialLen) {
      return res.status(404).json({ error: "Item not found" });
    }
    saveServerData(data);
    res.json({ success: true, message: `Item ${req.params.id} deleted` });
  });

  app.post("/api/v1/items/:id/pay", requireApiKey, (req, res) => {
    const data = getServerData();
    const item = (data.items || []).find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const isRecurring = item.type === "subscription" || item.type === "bill";
    const nextDate = isRecurring ? computeNextRecurrenceDate(item.date, item.frequency) : item.date;

    item.paidAt = new Date().toISOString().slice(0, 10);
    item.updatedAt = new Date().toISOString();

    if (isRecurring) {
      item.date = nextDate;
      item.manualStatus = null;
    } else {
      item.manualStatus = "paid";
    }

    // Add to payment history records
    data.records = data.records || [];
    data.records.unshift({
      id: `hist-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      date: new Date().toISOString().slice(0, 10),
      amount: item.price,
      originalCurrency: item.currency,
      status: "paid",
      notes: "Payment recorded via MMV Hub API"
    });

    saveServerData(data);
    res.json({
      success: true,
      message: `Payment recorded for ${item.name}`,
      nextDueDate: item.date,
      item
    });
  });

  // -------------------------------------------------------------
  // HABITS API
  // -------------------------------------------------------------
  app.get("/api/v1/habits", requireApiKey, (_req, res) => {
    const data = getServerData();
    res.json({ habits: data.habits || [] });
  });

  app.post("/api/v1/habits", requireApiKey, (req, res) => {
    const { name, category, type, unit, targetValue, scheduleType } = req.body;
    if (!name) return res.status(400).json({ error: "Habit name is required" });

    const data = getServerData();
    const newHabit = {
      id: `habit-${Date.now()}`,
      name,
      category: category || "General",
      type: type || "boolean",
      unit: unit || "",
      targetValue: targetValue || 1,
      scheduleType: scheduleType || "daily",
      startDate: new Date().toISOString().slice(0, 10),
      isPaused: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };

    data.habits = data.habits || [];
    data.habits.push(newHabit);
    saveServerData(data);
    res.status(201).json({ success: true, habit: newHabit });
  });

  app.put("/api/v1/habits/:id", requireApiKey, (req, res) => {
    const data = getServerData();
    data.habits = data.habits || [];
    const index = data.habits.findIndex((h) => h.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Habit not found" });

    data.habits[index] = { ...data.habits[index], ...req.body, id: req.params.id };
    saveServerData(data);
    res.json({ success: true, habit: data.habits[index] });
  });

  app.delete("/api/v1/habits/:id", requireApiKey, (req, res) => {
    const data = getServerData();
    data.habits = (data.habits || []).filter((h) => h.id !== req.params.id);
    saveServerData(data);
    res.json({ success: true, message: "Habit deleted" });
  });

  app.post("/api/v1/habits/:id/log", requireApiKey, (req, res) => {
    const { date, completed = true, value = 1 } = req.body;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const data = getServerData();

    data.habitLogs = data.habitLogs || {};
    data.habitLogs[req.params.id] = data.habitLogs[req.params.id] || {};
    data.habitLogs[req.params.id][targetDate] = {
      id: `log-${req.params.id}-${targetDate}`,
      habitId: req.params.id,
      date: targetDate,
      status: completed ? "completed" : "missed",
      completed: Boolean(completed),
      value: Number(value),
      completedAt: new Date().toISOString()
    };

    saveServerData(data);
    res.json({ success: true, log: data.habitLogs[req.params.id][targetDate] });
  });

  // -------------------------------------------------------------
  // GOALS API
  // -------------------------------------------------------------
  app.get("/api/v1/goals", requireApiKey, (_req, res) => {
    const data = getServerData();
    res.json({ goals: data.goals || [] });
  });

  app.post("/api/v1/goals", requireApiKey, (req, res) => {
    const { title, targetAmount, currentAmount, currency, deadline, type, category } = req.body;
    if (!title || targetAmount === undefined) {
      return res.status(400).json({ error: "Missing required fields: title, targetAmount" });
    }

    const data = getServerData();
    const newGoal = {
      id: `goal-${Date.now()}`,
      title,
      type: type || "savings_target",
      category: category || "all",
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount || 0),
      currency: currency || "USD",
      deadline: deadline || "",
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };

    data.goals = data.goals || [];
    data.goals.unshift(newGoal);
    saveServerData(data);
    res.status(201).json({ success: true, goal: newGoal });
  });

  app.put("/api/v1/goals/:id", requireApiKey, (req, res) => {
    const data = getServerData();
    data.goals = data.goals || [];
    const index = data.goals.findIndex((g) => g.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Goal not found" });

    data.goals[index] = { ...data.goals[index], ...req.body, id: req.params.id };
    saveServerData(data);
    res.json({ success: true, goal: data.goals[index] });
  });

  app.delete("/api/v1/goals/:id", requireApiKey, (req, res) => {
    const data = getServerData();
    data.goals = (data.goals || []).filter((g) => g.id !== req.params.id);
    saveServerData(data);
    res.json({ success: true, message: "Goal deleted" });
  });

  app.post("/api/v1/goals/:id/progress", requireApiKey, (req, res) => {
    const { deltaAmount } = req.body;
    if (deltaAmount === undefined) return res.status(400).json({ error: "deltaAmount required" });

    const data = getServerData();
    const goal = (data.goals || []).find((g) => g.id === req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    goal.currentAmount = Math.max(0, (goal.currentAmount || 0) + Number(deltaAmount));
    if (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    goal.updatedAt = new Date().toISOString();

    saveServerData(data);
    res.json({ success: true, goal });
  });

  // -------------------------------------------------------------
  // TELEGRAM BOT EXISTING PROXY ENDPOINTS
  // -------------------------------------------------------------
  app.get("/api/telegram/config", (_req, res) => {
    const hasServerToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const hasServerChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
    res.json({
      configuredOnServer: hasServerToken && hasServerChatId,
      hasServerToken,
      hasServerChatId,
    });
  });

  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { botToken, chatId, text, parse_mode = "HTML" } = req.body;
      const effectiveToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
      const effectiveChatId = chatId || process.env.TELEGRAM_CHAT_ID;

      if (!effectiveToken || !effectiveChatId) {
        return res.status(400).json({
          success: false,
          error: "Telegram Bot Token and Chat ID are required.",
        });
      }

      if (!text) {
        return res.status(400).json({
          success: false,
          error: "Message text is required",
        });
      }

      const telegramUrl = `https://api.telegram.org/bot${effectiveToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: effectiveChatId,
          text,
          parse_mode,
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        return res.status(response.status || 400).json({
          success: false,
          error: data.description || "Failed to send message via Telegram Bot API",
        });
      }

      return res.json({
        success: true,
        messageId: data.result?.message_id,
        sentAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Error sending Telegram message:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Internal server error dispatching Telegram notification",
      });
    }
  });

  app.post("/api/telegram/test", async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      const effectiveToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
      const effectiveChatId = chatId || process.env.TELEGRAM_CHAT_ID;

      if (!effectiveToken || !effectiveChatId) {
        return res.status(400).json({
          success: false,
          error: "Please provide both Bot Token and Chat ID to run the test.",
        });
      }

      const meRes = await fetch(`https://api.telegram.org/bot${effectiveToken}/getMe`);
      const meData = await meRes.json();

      if (!meRes.ok || !meData.ok) {
        return res.status(400).json({
          success: false,
          error: `Invalid Bot Token: ${meData.description || "Unauthorized"}`,
        });
      }

      const botUsername = meData.result?.username;
      const greeting = `👋 <b>MMV Hub Bot Connected!</b>\n\n` +
        `✅ Your Telegram bot <b>@${botUsername}</b> is linked to <b>MMV Hub</b>.\n` +
        `🔔 Reminders, payment tracking, and bot commands are active.\n\n` +
        `<i>Sent on ${new Date().toLocaleString()}</i>`;

      const sendRes = await fetch(`https://api.telegram.org/bot${effectiveToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: effectiveChatId,
          text: greeting,
          parse_mode: "HTML",
        }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok || !sendData.ok) {
        return res.status(400).json({
          success: false,
          error: `Bot is valid (@${botUsername}), but failed sending to Chat ID ${effectiveChatId}: ${sendData.description}. Make sure you started the bot by pressing /start in Telegram!`,
          botUsername,
        });
      }

      return res.json({
        success: true,
        botUsername,
        chatId: effectiveChatId,
        message: `Test message sent successfully from @${botUsername}!`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to test Telegram bot",
      });
    }
  });

  // -------------------------------------------------------------
  // VITE OR STATIC FRONTEND
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MMV Hub server running on http://0.0.0.0:${PORT}`);
    console.log(`OpenAPI specification available at http://0.0.0.0:${PORT}/api/v1/openapi.json`);
  });
}

startServer();

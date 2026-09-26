import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { startCronJobs } from "./server-cron.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Telegram Config check
  app.get("/api/telegram/config", (_req, res) => {
    const hasServerToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const hasServerChatId = Boolean(process.env.TELEGRAM_CHAT_ID);
    res.json({
      configuredOnServer: hasServerToken && hasServerChatId,
      hasServerToken,
      hasServerChatId,
    });
  });

  // Send Telegram Message
  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { botToken, chatId, text, parse_mode = "HTML" } = req.body;

      const effectiveToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
      const effectiveChatId = chatId || process.env.TELEGRAM_CHAT_ID;

      if (!effectiveToken || !effectiveChatId) {
        return res.status(400).json({
          success: false,
          error: "Telegram Bot Token and Chat ID are required. Please configure them in Settings.",
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

  // Test Telegram Bot connection
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

      // First check getMe
      const meRes = await fetch(`https://api.telegram.org/bot${effectiveToken}/getMe`);
      const meData = await meRes.json();

      if (!meRes.ok || !meData.ok) {
        return res.status(400).json({
          success: false,
          error: `Invalid Bot Token: ${meData.description || "Unauthorized"}`,
        });
      }

      const botUsername = meData.result?.username;

      // Send a greeting test message
      const greeting = `👋 <b>MMV Subs Bot Connected!</b>\n\n` +
        `✅ Your Telegram bot <b>@${botUsername}</b> is linked to <b>MMV Subs</b>.\n` +
        `🔔 You will receive upcoming due date reminders and past-due alerts here.\n\n` +
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

  // Vite middleware for development vs static build in production
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
    console.log(`MMV Subs server running on http://0.0.0.0:${PORT}`);
    startCronJobs();
  });
}

startServer();

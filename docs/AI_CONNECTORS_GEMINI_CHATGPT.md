# MMV Subs — AI Connectors Guide (Google Gemini & ChatGPT)

This guide provides the complete architectural schema, REST API documentation, OpenAPI 3.0 specification, and tool calling definitions to connect **Google Gemini** models and **ChatGPT Custom GPTs** to your MMV Subs application.

With this integration, AI assistants can view your expenses, create subscriptions, modify bills, delete entries, mark payments as paid, track habits, and update financial goals automatically via natural language.

---

## 1. Web Application Structural Schema

The application manages three core domains: **Payments & Cash Flow**, **Habits**, and **Goals**:

### A. Payment Item (`/api/v1/items`)
Represents an outflow item.
- `id` (string): Unique identifier (e.g. `sub-1`, `bill-1`, `purch-1`).
- `type` ("subscription" | "bill" | "purchase"):
  - `subscription`: Recurring software, digital service, streaming, etc.
  - `bill`: Rent, electricity, utilities, insurance, recurrent physical expenses.
  - `purchase`: One-time planned purchase (gadgets, courses, hardware).
- `name` (string): Title of the service/item.
- `price` (number): Cost in specified currency.
- `currency` ("USD" | "UZS"): Currency denomination.
- `date` (string, `YYYY-MM-DD`): Next due date.
- `time` (string, `HH:mm`): Time of charge/reminder (e.g. `09:00`).
- `frequency` (object): Recurrence rule for subscriptions and bills (`{ interval: 1, unit: "months" }`).
- `manualStatus` ("paid" | "skipped" | null): Current cycle status.

### B. Habit (`/api/v1/habits`)
Represents daily/weekly routines.
- `id` (string): e.g. `habit-water`.
- `name` (string): Habit title.
- `category` (string): Category (e.g. Health, Study, Finance).
- `type` ("boolean" | "quantity"): Simple checkmark vs target quantity.
- `targetValue` (number): e.g. `2.5` for liters or `25` for pages.
- `unit` (string): Units of measurement (e.g. `L`, `pages`, `minutes`).
- `scheduleType` ("daily" | "weekdays" | "custom_interval"): Repetition rule.

### C. Goal (`/api/v1/goals`)
Represents financial budget limits or savings targets.
- `id` (string): e.g. `goal-1`.
- `title` (string): Goal title.
- `type` ("category_cap" | "bill_reserve" | "savings_target" | "budget_limit").
- `targetAmount` (number): Goal target amount.
- `currentAmount` (number): Current saved or spent amount.
- `currency` ("USD" | "UZS"): Currency.
- `deadline` (string, optional `YYYY-MM-DD`).
- `isCompleted` (boolean): Whether goal is achieved.

---

## 2. Authentication & Base URL

All requests from external AI agents to the REST API must include an API key:
- **Header format**: `x-api-key: mmv_live_...` or `Authorization: Bearer mmv_live_...`
- **Key Generation**: In the web app, go to **Settings → Integrations Hub → API Keys for AI & Connectors**, click **Generate New API Key**, and copy the token.
- **Base Endpoint**:
  ```
  https://<YOUR_APP_DOMAIN>/api/v1
  ```
  *(Example: `https://ais-dev-2s5vsn4lwwb3k4firra7je-213490170517.asia-southeast1.run.app/api/v1`)*

---

## 3. ChatGPT Integration (Custom GPT Actions)

You can create a Custom GPT in ChatGPT that has direct tool access to your MMV Subs app:

### Step 1: Create a Custom GPT
1. In ChatGPT, navigate to **Explore GPTs → Create**.
2. Go to the **Configure** tab.
3. Under **Actions**, click **Create new action**.

### Step 2: Import the OpenAPI Schema
1. Click **Import from URL** and enter:
   ```
   https://<YOUR_APP_DOMAIN>/api/v1/openapi.json
   ```
   *(Or copy and paste the raw JSON schema directly into the Schema box).*

### Step 3: Configure Authentication
1. Under **Authentication**, select **API Key**.
2. **Auth Type**: Custom.
3. **Custom Header Name**: `x-api-key`.
4. **API Key**: Paste your generated key from MMV Subs Settings.

### Step 4: Custom GPT System Prompt Instructions
Add the following system instructions to your GPT:
```markdown
You are MMV Host, an intelligent personal finance manager and habit tracking assistant.
You have direct API access to the user's MMV Subs account.

Capabilities:
1. View payments: Call `listItems` or `getFinancialSummary` when the user asks about upcoming bills, total monthly spending, or financial forecasts.
2. Add new expenses: When the user says "Add my Spotify subscription for $11.99 due on the 20th", call `createItem` with type="subscription", currency="USD", price=11.99, and appropriate frequency.
3. Record payments: When the user says "I just paid rent", find the item and call `markItemPaid`.
4. Track habits: Call `listHabits` and record completed days with `logHabitStatus`.
5. Update goals: Adjust goal savings with `updateGoalProgress` or create targets with `createGoal`.

Always confirm before executing destructive deletions (`deleteItem`).
```

---

## 4. Google Gemini Integration (Function Calling)

When building an agent using the `@google/genai` TypeScript/Python SDK, declare the following function declarations in your model configuration:

### Function Declarations (JSON Schema)

```json
[
  {
    "name": "getFinancialSummary",
    "description": "Get current month and year spending totals in USD and UZS, active item counts, and cash flow forecast.",
    "parameters": {
      "type": "OBJECT",
      "properties": {}
    }
  },
  {
    "name": "listItems",
    "description": "List subscriptions, recurring bills, and one-time purchases with optional filters.",
    "parameters": {
      "type": "OBJECT",
      "properties": {
        "type": {
          "type": "STRING",
          "enum": ["subscription", "bill", "purchase"],
          "description": "Optional category filter"
        },
        "status": {
          "type": "STRING",
          "enum": ["upcoming", "due_today", "overdue", "paid"],
          "description": "Optional status filter"
        }
      }
    }
  },
  {
    "name": "createItem",
    "description": "Create a new subscription, bill, or one-time purchase.",
    "parameters": {
      "type": "OBJECT",
      "required": ["type", "name", "price", "currency", "date"],
      "properties": {
        "type": { "type": "STRING", "enum": ["subscription", "bill", "purchase"] },
        "name": { "type": "STRING", "description": "Title of the item, e.g., Netflix" },
        "price": { "type": "NUMBER", "description": "Numerical price" },
        "currency": { "type": "STRING", "enum": ["USD", "UZS"] },
        "date": { "type": "STRING", "description": "Date in YYYY-MM-DD format" },
        "time": { "type": "STRING", "description": "HH:mm format (default 09:00)" },
        "notes": { "type": "STRING", "description": "Optional notes or plan details" }
      }
    }
  },
  {
    "name": "markItemPaid",
    "description": "Record a payment for an item and automatically calculate the next recurring billing date.",
    "parameters": {
      "type": "OBJECT",
      "required": ["id"],
      "properties": {
        "id": { "type": "STRING", "description": "The item ID (e.g., sub-1, bill-2)" }
      }
    }
  },
  {
    "name": "deleteItem",
    "description": "Delete a subscription, bill, or purchase entry.",
    "parameters": {
      "type": "OBJECT",
      "required": ["id"],
      "properties": {
        "id": { "type": "STRING", "description": "The item ID to delete" }
      }
    }
  },
  {
    "name": "logHabitStatus",
    "description": "Record habit completion or progress value for a specific date.",
    "parameters": {
      "type": "OBJECT",
      "required": ["id"],
      "properties": {
        "id": { "type": "STRING", "description": "Habit ID (e.g., habit-water)" },
        "date": { "type": "STRING", "description": "Date in YYYY-MM-DD format (defaults to today)" },
        "completed": { "type": "BOOLEAN", "description": "Whether habit was completed" },
        "value": { "type": "NUMBER", "description": "Quantity achieved (e.g. 2.5 for liters)" }
      }
    }
  }
]
```

### TypeScript SDK Implementation Example
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI();
const API_BASE = "https://<YOUR_APP_DOMAIN>/api/v1";
const API_KEY = "mmv_live_...";

async function executeApiCall(endpoint: string, method = "GET", body?: any) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// In your tool call dispatcher:
switch (call.name) {
  case "getFinancialSummary":
    return await executeApiCall("/summary");
  case "listItems":
    return await executeApiCall(`/items?${new URLSearchParams(call.args)}`);
  case "createItem":
    return await executeApiCall("/items", "POST", call.args);
  case "markItemPaid":
    return await executeApiCall(`/items/${call.args.id}/pay`, "POST");
  case "deleteItem":
    return await executeApiCall(`/items/${call.args.id}`, "DELETE");
}
```

---

## 5. Security & Isolation

- **Scoped Access**: All API operations are authenticated with revocable API keys.
- **Cycle Safety**: Calling `/api/v1/items/:id/pay` ensures recurring payments are moved forward to their next cycle without corrupting history records.
- **Client Cache Sync**: Any updates made by AI or Telegram are synced into the server store and picked up by the web interface.

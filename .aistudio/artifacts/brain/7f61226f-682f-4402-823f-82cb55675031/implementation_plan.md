# Implementation Plan: Telegram Integration & AI Connectors (Gemini & ChatGPT)

This plan outlines the architecture and execution steps for turning MMV Subs into a fully integrated platform with a unified REST API, connector authentication, Telegram reminder & command integration, AI tool calling (Gemini & ChatGPT), and two comprehensive markdown documentation guides.

---

## 1. Architectural Overview

```
                        ┌─────────────────────────────────────┐
                        │        MMV Subs Core App            │
                        │  (Express + React + Firestore DB)   │
                        └──────────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│   Telegram Bot   │             │   ChatGPT (GPTs) │             │    Gemini API    │
│  Commands/Alerts │             │  Custom Actions  │             │ Function Calling │
│  (Read & Refresh)│             │ (Full CRUD & AI) │             │ (Full CRUD & AI) │
└──────────────────┘             └──────────────────┘             └──────────────────┘
```

1. **Unified REST API (`/api/v1/*`)**:
   - Clean, secure REST endpoints in `server.ts` that interact with the user's synced database records.
   - Supports listing, filtering, detail retrieval, creation, updating, deletion, and status toggling (e.g. marking recurring items paid).
   - Dynamic OpenAPI 3.0 specification served at `/api/v1/openapi.json` for ChatGPT Custom GPT Actions and Gemini Function Declarations.

2. **Connector Authentication & Registration (`/api/connect/*`)**:
   - Secure API token authentication (`x-api-key` header or `Authorization: Bearer <key>`).
   - One-click token generation in Settings so users can link ChatGPT, Gemini scripts, and Telegram without complex setup.
   - Dual storage: Synchronizes state in Firestore (`users/{uid}/sync/data`) with server-side validation.

3. **Telegram Bot Enhancements (`telegram-bot/`)**:
   - Clean command set:
     - `/start`: Welcome, shows user's Chat ID, links account.
     - `/today`: Daily digest (due today, overdue bills, open habits).
     - `/payments`: Active upcoming subscriptions, bills, purchases.
     - `/refresh`: Instant cache & reminder status refresh.
     - `/help`: Command guide and documentation summary.
   - Inline keyboard status refresh button.

4. **In-App Connectors UI (`src/views/SettingsView.tsx`)**:
   - Dedicated "Integrations & AI Connectors" section:
     - **Telegram Bot**: Easy chat ID binding, connection status, test ping.
     - **API Key Management**: Generate, view, and copy your persistent Connector Token.
     - **AI Setup Helper**: One-click copy for ChatGPT OpenAPI Action URL and Gemini Tool Calling instructions.

5. **Two Markdown Documentation Guides (`docs/`)**:
   - `docs/TELEGRAM_INTEGRATION.md`: Step-by-step setup with @BotFather, Chat ID linking, reminder scheduling rules, command reference, and Render/always-on deployment.
   - `docs/AI_CONNECTORS_GEMINI_CHATGPT.md`: Data schemas (`PaymentItem`, `Habit`, `SpendingGoal`), OpenAPI 3.0 specification for ChatGPT Actions, Gemini Function Calling definitions, prompt templates, and best practices for automated creation, editing, and deletion.

---

## 2. User Review Required

> [!IMPORTANT]
> - **API Key Security**: The API key is stored securely alongside the user's sync data and validated on every `/api/v1/*` request.
> - **Telegram Scope**: As requested, Telegram will provide clear read-only command digests and status refresh, while full creation, editing, and deletion are handled via the AI connectors (Gemini and ChatGPT) and the Web UI.

---

## 3. Proposed Changes & Implementation Steps

### Step 1: REST API & OpenAPI Schema in `server.ts`
- Implement `/api/v1/openapi.json`: Standard OpenAPI 3.0 document describing all endpoints, schemas, parameters, and responses.
- Implement `/api/v1/auth/token`: Generate or retrieve the connector API token.
- Implement `/api/v1/summary`: Financial health, due today, overdue, 7-day upcoming outflow, open habits, and active goals.
- Implement `/api/v1/items`:
  - `GET /api/v1/items`: Filter by type (`subscription`, `bill`, `purchase`) and status (`upcoming`, `due_today`, `overdue`, `paid`).
  - `POST /api/v1/items`: Create item (with date, price, currency, frequency, reminders).
  - `GET /api/v1/items/:id`: Item details and schedule.
  - `PATCH /api/v1/items/:id`: Update item fields.
  - `DELETE /api/v1/items/:id`: Delete item.
  - `POST /api/v1/items/:id/pay`: Mark paid and automatically calculate the next recurring billing cycle.
- Implement `/api/v1/habits` & `/api/v1/goals`: Read and update logs/progress.

### Step 2: In-App Integrations Hub (`src/views/SettingsView.tsx`)
- Add an "Integrations & AI Connectors" tab/card in Settings.
- Display the API Key generator with a copy button.
- Provide direct URLs for ChatGPT Custom GPT Action configuration.
- Provide quick instructions and connection diagnostics for Telegram.

### Step 3: Telegram Bot Enhancements (`telegram-bot/`)
- Update `telegram-bot/src/index.ts` to support all slash commands (`/start`, `/today`, `/payments`, `/refresh`, `/help`).
- Ensure inline buttons have immediate responses with informative notifications.

### Step 4: Documentation Guides in `docs/`
- **File 1**: `docs/TELEGRAM_INTEGRATION.md`
  - Bot registration with `@BotFather`.
  - Chat ID linking and permissions.
  - Command reference with payload descriptions.
  - Reminder scheduling rules (before, on-date, overdue).
  - 24/7 Hosting guide (Render, Railway, VPS).
- **File 2**: `docs/AI_CONNECTORS_GEMINI_CHATGPT.md`
  - Overview of MMV Subs structure & entity models.
  - ChatGPT Custom GPT Action instructions with OpenAPI JSON spec.
  - Gemini API Function Calling integration with `@google/genai` TypeScript/Python schemas.
  - Sample agent prompts for creating, editing, rescheduling, and querying subscriptions.

---

## 4. Verification Plan

1. **API Verification**:
   - Query `/api/v1/summary`, `/api/v1/items`, `/api/v1/openapi.json` via local curl commands.
   - Test item creation, update, payment recording, and deletion via API token.
2. **Build & Lint**:
   - Run `compile_applet` and `lint_applet` to ensure TypeScript compliance across the frontend and server.
3. **Docs Verification**:
   - Verify both `docs/TELEGRAM_INTEGRATION.md` and `docs/AI_CONNECTORS_GEMINI_CHATGPT.md` exist and contain verified OpenAPI schemas and curl examples.

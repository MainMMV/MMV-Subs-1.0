# Automated Due Date Alerts, Google Calendar Sync & Cash Flow Forecasting

An architectural and product roadmap for MMV Subs introducing automated due-date notifications, an in-app notification center, native browser push alerts, Google Calendar synchronization, and recurring cash flow forecasting.

## User Review & Critical Decisions

> [!IMPORTANT]
> The roadmap below directly incorporates the priorities established during Phase 1 clarification:
> - **Primary Functional Priority**: Calendar sync and automated due date alerts.
> - **Notification Channels**: Multi-channel delivery including an in-app notification center, browser Web Push notifications, and Google Calendar event sync.
> - **Financial Scope**: No budget limits or category caps—scope is strictly focused on granular tracking and predictive cash flow forecasting.

- **Confirmed Decision 1 (Notification Channels)**: In-app notification popover with read/unread statuses, combined with browser Notification API (push permissions) and Google Calendar event publishing for upcoming bill due dates.
- **Confirmed Decision 2 (Google Calendar Integration)**: Client-side OAuth 2.0 with minimal required scope (`https://www.googleapis.com/auth/calendar.events`) to create and update dedicated MMV Subs payment events without accessing private personal events.
- **Confirmed Decision 3 (Pure Tracking & Forecasting)**: Forecasting engine projects rolling 30/60/90-day cash outflow based on recurring subscriptions and bills, omitting budget warning gates and spending caps as requested.

---

## 1. Overview & Core Concept

### What It Does
This expansion equips MMV Subs with proactive time-and-cash awareness:
1. **Due Date Alert Engine**: Scans active subscriptions and recurring bills to notify users 1, 3, or 7 days ahead of charges, preventing unexpected account debits and forgotten renewals.
2. **In-App Notification Center**: A header-accessible, compact feed displaying pending renewals, past due items, and successful calendar sync records with actionable quick-buttons ("Mark Paid", "Snooze 2 Days").
3. **Browser Web Push Notifications**: Native desktop and mobile browser notifications for due payments even when MMV Subs is running in a background tab.
4. **Google Calendar Sync**: Generates and syncs dedicated all-day or timed calendar events with reminders into the user's primary or secondary Google Calendar.
5. **Cash Flow & Burn Forecaster**: Visualizes projected outflow day-by-day for the upcoming 30 to 90 days with tabular numeric precision and renewal spike highlights.

### Target Audience & Persona
Individuals managing multiple software subscriptions, household utilities, streaming services, and annual memberships who want automated peace of mind without having to manually inspect the app every morning.

### Key Value
- **Zero Surprise Charges**: Advance warnings delivered through the user's preferred channels (app, browser, Google Calendar).
- **Proactive Liquidity Planning**: Clear visibility into exact cash needs across the next 30, 60, and 90 days.
- **Frictionless Action**: Mark payments completed directly from alert items.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Viewing & Interacting with In-App Alerts**:
   - The user notices a subtle numeric indicator on the bell icon in the top navigation bar.
   - Clicking the bell opens a compact, single-elevation dropdown listing upcoming due dates sorted chronologically.
   - Each item shows the service name, amount with tabular numerals, due date distance ("Due in 2 days"), and two actions: `Mark Paid` or `Dismiss`.

2. **Connecting & Syncing Google Calendar**:
   - In Settings or the Calendar tab, the user clicks "Connect Google Calendar".
   - The streamlined Google OAuth consent flow opens (requesting minimal `calendar.events` access).
   - Once authorized, MMV Subs creates a dedicated calendar or events tagged `[MMV Subs] <Subscription Name>` with reminder notifications set 24 hours prior.
   - A toggle allows users to choose: "Sync All Recurring Items" or "Sync High-Value (> $20) Only".

3. **Enabling Browser Web Push**:
   - In the Notification Center or Settings, a prompt banner offers: "Enable Browser Alerts".
   - Granting browser notification permissions enables local scheduled background notification dispatches.

4. **Exploring the Cash Flow Forecaster**:
   - On the Home and Calendar tabs, a "Cash Flow Projection" panel displays projected cumulative outflow and daily payment markers over the next 1–3 months.
   - Clicking any upcoming date shows an itemized breakdown of expected charges on that specific day.

### Visual Identity & Theme (Personal Design System Strict Adherence)

- **Aesthetic Direction**: Minimal, calm, utilitarian, compact, professional. Low visual noise.
- **Typography**: Google Sans exclusively (`font-normal` and `font-medium`). No bold, no italic. Financial figures use `tabular-nums font-mono` for decimal alignment.
- **Color Foundation**: Neutral gray scale (`bg-neutral-50` / `bg-neutral-900`, `border-neutral-200` / `border-neutral-800`, text `text-neutral-800` / `text-neutral-200`). Single calm accent color for primary actions.
- **No Decorations**: Strictly no background gradients, no glowing effects, no glassmorphism, no pill capsules on static metadata.
- **Corners & Spacing**: Soft 8–12px radius (`rounded-lg`), compact padding (`p-3` / `p-4`), subtle 1px solid borders (`border border-neutral-200 dark:border-neutral-800`).
- **Icons**: Lucide outline SVG icons (`Bell`, `CalendarCheck`, `CalendarSync`, `TrendingUp`, `Check`, `X`).
- **Button States**: Solid accent primary buttons, outline secondary buttons, ghost minor buttons. No hover scale transformations.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Google Calendar Integration Strategy
- **Chosen Approach**: Client-side OAuth 2.0 flow using the `workspace-integration` skill with scope `https://www.googleapis.com/auth/calendar.events`. Events are created/updated with idempotent IDs (`mmv_sub_<id>_<cycle>`) to prevent duplicate calendar entries.
- **Why**: Keeps authentication secure, directly uses user credentials via client-side Bearer tokens, and avoids complex external server cron authorization keys.
- **Alternative Considered**: Server-side batch sync via service account. Rejected because service accounts cannot write to personal user calendars without domain-wide delegation.

### Decision 2: Notification Center & Push Architecture
- **Chosen Approach**: Dual-layer architecture:
  1. *In-app notification ledger* stored in Firestore under `/users/{uid}/notifications` for cross-device consistency and read tracking.
  2. *Client-side Notification API* for instant OS-level banners when the browser is active.
- **Why**: Guarantees zero missed alerts whether the user prefers in-app browsing or OS notifications.
- **Alternative Considered**: External third-party SMS/email providers (Twilio/SendGrid). Rejected to prevent external cost, credential exposure, and setup friction.

### Decision 3: Cash Flow Forecaster Scope
- **Chosen Approach**: Pure predictive timeline (30, 60, 90 days) projecting scheduled renewals and bills from existing database recurrence intervals.
- **Why**: Aligns directly with user preference ("No budget limits or category caps, focus solely on tracking and forecasting"). Prevents annoying false-positive budget breach warnings.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                               MMV Subs UI                              │
├────────────────────┬────────────────────┬──────────────────────────────┤
│  Top Navigation    │   Calendar View    │     Settings View            │
│  ┌──────────────┐  │  ┌──────────────┐  │  ┌────────────────────────┐  │
│  │ Notification │  │  │ Google Cal   │  │  │ Notification Settings  │  │
│  │ Popover Bell │  │  │ Sync Panel   │  │  │ & Calendar OAuth Toggle│  │
│  └──────┬───────┘  │  └──────┬───────┘  │  └───────────┬────────────┘  │
└─────────┼────────────────────┼─────────────────────────┼───────────────┘
          │                    │                         │
          ▼                    ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Core Feature Modules                          │
├─────────────────────────┬─────────────────────────┬────────────────────┤
│   Notification Service  │   Google Calendar Sync  │ Outflow Forecaster │
│ ┌─────────────────────┐ │ ┌─────────────────────┐ │ ┌────────────────┐ │
│ │ • Due date scanner  │ │ │ • OAuth Bearer auth │ │ │ • 30/60/90-day │ │
│ │ • In-app read/done  │ │ │ • Idempotent event  │ │ │   projection   │ │
│ │ • Browser Push API  │ │ │   upsert/delete     │ │ │ • Tabular sums │ │
│ └──────────┬──────────┘ │ └──────────┬──────────┘ │ └───────┬────────┘ │
└────────────┼─────────────────────────┼──────────────────────┼──────────┘
             │                         │                      │
             ▼                         ▼                      ▼
┌───────────────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│    Cloud Firestore DB     │ │ Google Calendar  │ │ Subscriptions &     │
│  /users/{uid}/            │ │ REST API (v3)    │ │ Recurring Bills     │
│  notifications            │ │ /calendars/      │ │ collections         │
│  & sync_settings          │ │ primary/events   │ │                     │
└───────────────────────────┘ └──────────────────┘ └─────────────────────┘
```

### Data Entities & Schema Additions

1. **`NotificationItem`** (Firestore: `/users/{uid}/notifications/{notificationId}`):
   ```typescript
   export interface NotificationItem {
     id: string;
     userId: string;
     sourceType: 'subscription' | 'recurring_bill';
     sourceId: string;
     title: string;
     amount: number;
     currency: string;
     dueDate: string; // ISO date string (YYYY-MM-DD)
     daysUntilDue: number;
     status: 'unread' | 'read' | 'dismissed' | 'actioned';
     createdAt: string;
   }
   ```

2. **`CalendarSyncRecord`** (Firestore: `/users/{uid}/calendar_sync/{sourceId}`):
   ```typescript
   export interface CalendarSyncRecord {
     sourceId: string;
     googleEventId: string;
     calendarId: string;
     lastSyncedAt: string;
     nextCycleDate: string;
     summary: string;
   }
   ```

3. **`ForecastSummary`** (Client computation model):
   ```typescript
   export interface ForecastDay {
     date: string;
     dayOfWeek: string;
     totalOutflow: number;
     items: { id: string; name: string; amount: number; category: string }[];
   }

   export interface CashFlowForecast {
     rangeDays: 30 | 60 | 90;
     totalProjectedOutflow: number;
     highestDay: { date: string; amount: number };
     dailyTimeline: ForecastDay[];
   }
   ```

### Implementation Sequence Plan

1. **Phase A: Notification Store & Due Date Scanner Engine**
   - Implement client-side due-date evaluation logic that detects bills coming due within configurable thresholds (default: 1, 3, 7 days).
   - Create the in-app Notification Center popover component in the top bar with unread count badge, read toggling, and fast "Mark Paid" actions.
   - Wire browser `Notification.requestPermission()` and local notification triggers.

2. **Phase B: Google Calendar Synchronization**
   - Initialize OAuth client via `set_up_oauth` tool requesting `https://www.googleapis.com/auth/calendar.events`.
   - Build client-side Google Calendar service:
     - Check existing sync mappings to prevent duplicates.
     - Insert recurring reminders with color-coded event metadata and 24-hour alert popups.
     - Provide one-click "Sync to Google Calendar" button and status indicator in `CalendarView`.

3. **Phase C: Cash Flow & Outflow Forecaster**
   - Build date-math calculation engine projecting all recurrence cycles (monthly, annual, quarterly, bi-weekly) over 30/60/90 days.
   - Render clean, tabular forecast dashboard in `HomeView` and `CalendarView` with daily liquidity demand and peak payment days.

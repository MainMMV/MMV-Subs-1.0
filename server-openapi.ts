export function getOpenApiSpec(baseUrl = "https://ais-dev-2s5vsn4lwwb3k4firra7je-213490170517.asia-southeast1.run.app") {
  return {
    openapi: "3.0.3",
    info: {
      title: "MMV Subs Finance & Habits API",
      description: "Complete REST API for managing subscriptions, recurring bills, one-time purchases, habits, and financial goals. Fully compatible with ChatGPT Custom GPT Actions and Google Gemini Function Calling.",
      version: "1.0.0"
    },
    servers: [
      {
        url: baseUrl,
        description: "Primary MMV Subs Application Server"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API Key obtained from Settings -> Integrations Hub in MMV Subs"
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API_KEY"
        }
      },
      schemas: {
        PaymentItem: {
          type: "object",
          required: ["id", "type", "name", "price", "currency", "date"],
          properties: {
            id: { type: "string", description: "Unique identifier (e.g. sub-1, bill-1)" },
            type: { type: "string", enum: ["subscription", "bill", "purchase"] },
            name: { type: "string", description: "Service or payment name (e.g. Netflix, Rent)" },
            price: { type: "number", description: "Amount in stated currency" },
            currency: { type: "string", enum: ["USD", "UZS"] },
            date: { type: "string", format: "date", description: "Next due date (YYYY-MM-DD)" },
            time: { type: "string", description: "Time of day in HH:mm format" },
            notes: { type: "string", description: "Additional details or notes" },
            manualStatus: { type: "string", enum: ["paid", "skipped", null], nullable: true },
            frequency: {
              type: "object",
              properties: {
                interval: { type: "integer", default: 1 },
                unit: { type: "string", enum: ["days", "weeks", "months", "years"] }
              }
            }
          }
        },
        CreateItemPayload: {
          type: "object",
          required: ["type", "name", "price", "currency", "date"],
          properties: {
            type: { type: "string", enum: ["subscription", "bill", "purchase"] },
            name: { type: "string", description: "Name of the subscription or bill" },
            price: { type: "number" },
            currency: { type: "string", enum: ["USD", "UZS"] },
            date: { type: "string", format: "date" },
            time: { type: "string", example: "09:00" },
            notes: { type: "string" },
            frequency: {
              type: "object",
              properties: {
                interval: { type: "integer", default: 1 },
                unit: { type: "string", enum: ["days", "weeks", "months", "years"] }
              }
            }
          }
        },
        Habit: {
          type: "object",
          required: ["id", "name", "type", "scheduleType", "startDate"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            category: { type: "string" },
            type: { type: "string", enum: ["boolean", "quantity"] },
            unit: { type: "string" },
            targetValue: { type: "number" },
            scheduleType: { type: "string", enum: ["daily", "weekdays", "custom_interval"] },
            startDate: { type: "string", format: "date" },
            isPaused: { type: "boolean" }
          }
        },
        Goal: {
          type: "object",
          required: ["id", "title", "targetAmount", "currentAmount", "currency"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            type: { type: "string", enum: ["category_cap", "bill_reserve", "savings_target", "budget_limit"] },
            targetAmount: { type: "number" },
            currentAmount: { type: "number" },
            currency: { type: "string", enum: ["USD", "UZS"] },
            deadline: { type: "string", format: "date" },
            isCompleted: { type: "boolean" }
          }
        }
      }
    },
    security: [
      { ApiKeyAuth: [] },
      { BearerAuth: [] }
    ],
    paths: {
      "/api/v1/summary": {
        get: {
          operationId: "getFinancialSummary",
          summary: "Get overall financial summary and active item counts",
          responses: {
            "200": {
              description: "Summary data including this month/year spending and 30-day forecast",
              content: { "application/json": { schema: { type: "object" } } }
            }
          }
        }
      },
      "/api/v1/items": {
        get: {
          operationId: "listItems",
          summary: "List all subscriptions, bills, and one-time purchases",
          parameters: [
            { name: "type", in: "query", schema: { type: "string", enum: ["subscription", "bill", "purchase"] }, description: "Filter by item type" },
            { name: "status", in: "query", schema: { type: "string", enum: ["upcoming", "due_today", "overdue", "paid"] }, description: "Filter by status" }
          ],
          responses: {
            "200": {
              description: "Array of payment items",
              content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/PaymentItem" } } } }
            }
          }
        },
        post: {
          operationId: "createItem",
          summary: "Create a new subscription, recurring bill, or purchase",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { "$ref": "#/components/schemas/CreateItemPayload" } } }
          },
          responses: {
            "201": {
              description: "Created item",
              content: { "application/json": { schema: { "$ref": "#/components/schemas/PaymentItem" } } }
            }
          }
        }
      },
      "/api/v1/items/{id}": {
        get: {
          operationId: "getItemById",
          summary: "Get single payment item details",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            "200": {
              description: "Payment item object",
              content: { "application/json": { schema: { "$ref": "#/components/schemas/PaymentItem" } } }
            },
            "404": { description: "Item not found" }
          }
        },
        put: {
          operationId: "updateItem",
          summary: "Update existing payment item fields",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } }
          },
          responses: {
            "200": {
              description: "Updated payment item",
              content: { "application/json": { schema: { "$ref": "#/components/schemas/PaymentItem" } } }
            }
          }
        },
        delete: {
          operationId: "deleteItem",
          summary: "Delete a payment item",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Item deleted successfully" }
          }
        }
      },
      "/api/v1/items/{id}/pay": {
        post: {
          operationId: "markItemPaid",
          summary: "Mark payment item as paid and advance next recurrence date",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            "200": {
              description: "Payment status recorded and next due date updated",
              content: { "application/json": { schema: { type: "object" } } }
            }
          }
        }
      },
      "/api/v1/habits": {
        get: {
          operationId: "listHabits",
          summary: "List all tracked habits",
          responses: {
            "200": {
              description: "Array of habits",
              content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Habit" } } } }
            }
          }
        },
        post: {
          operationId: "createHabit",
          summary: "Create a new habit",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } }
          },
          responses: {
            "201": { description: "Habit created" }
          }
        }
      },
      "/api/v1/habits/{id}/log": {
        post: {
          operationId: "logHabitStatus",
          summary: "Mark habit completed or record numerical value for a specific date",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    date: { type: "string", format: "date", description: "Date YYYY-MM-DD (defaults to today)" },
                    completed: { type: "boolean", default: true },
                    value: { type: "number" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Habit progress recorded" }
          }
        }
      },
      "/api/v1/goals": {
        get: {
          operationId: "listGoals",
          summary: "List financial spending & savings goals",
          responses: {
            "200": {
              description: "Array of goals",
              content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Goal" } } } }
            }
          }
        },
        post: {
          operationId: "createGoal",
          summary: "Create a new financial goal",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } }
          },
          responses: {
            "201": { description: "Goal created" }
          }
        }
      },
      "/api/v1/goals/{id}/progress": {
        post: {
          operationId: "updateGoalProgress",
          summary: "Add or adjust current savings towards a goal",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["deltaAmount"],
                  properties: {
                    deltaAmount: { type: "number", description: "Amount to add (or subtract if negative)" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Goal progress updated" }
          }
        }
      }
    }
  };
}

export interface ColumnInfo {
  readonly name: string;
  readonly type: string;
  readonly note?: string;
}

export interface TableInfo {
  readonly name: string;
  readonly columns: readonly ColumnInfo[];
}

export interface SchemaReference {
  readonly tables: readonly TableInfo[];
}

export const SCHEMA_REFERENCE: SchemaReference = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "email", type: "text", note: "unique" },
        { name: "name", type: "text" },
        { name: "plan", type: "text", note: "free|starter|pro|enterprise" },
        { name: "country", type: "text" },
        { name: "created_at", type: "timestamptz" },
        { name: "churned_at", type: "timestamptz", note: "nullable" },
      ],
    },
    {
      name: "products",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "category", type: "text", note: "analytics|integrations|storage|support" },
        { name: "price_cents", type: "integer" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "subscriptions",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "user_id", type: "integer", note: "FK\u2192users" },
        { name: "product_id", type: "integer", note: "FK\u2192products" },
        { name: "status", type: "text", note: "active|cancelled|past_due|trialing" },
        { name: "started_at", type: "timestamptz" },
        { name: "cancelled_at", type: "timestamptz", note: "nullable" },
        { name: "mrr_cents", type: "integer" },
      ],
    },
    {
      name: "orders",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "user_id", type: "integer", note: "FK\u2192users" },
        { name: "total_cents", type: "integer" },
        { name: "status", type: "text", note: "completed|refunded|pending" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "order_items",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "order_id", type: "integer", note: "FK\u2192orders" },
        { name: "product_id", type: "integer", note: "FK\u2192products" },
        { name: "quantity", type: "integer" },
        { name: "unit_price_cents", type: "integer" },
      ],
    },
    {
      name: "events",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "user_id", type: "integer", note: "FK\u2192users" },
        { name: "event_type", type: "text", note: "login|feature_used|export|api_call|upgrade_prompt_shown" },
        { name: "properties", type: "jsonb", note: "nullable" },
        { name: "occurred_at", type: "timestamptz" },
      ],
    },
  ],
};

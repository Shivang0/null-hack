// src/lib/api/mock/datasets.ts
import type { Dataset, DatasetColumn, DatasetPreviewRow } from "../types";

const now = new Date().toISOString();
const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

function makeColumns(
  defs: Array<[string, DatasetColumn["type"], boolean, string]>,
): DatasetColumn[] {
  return defs.map(([name, type, nullable, description]) => ({
    name,
    type,
    nullable,
    description,
  }));
}

let _datasets: Dataset[] = [
  {
    id: "ds-customer-interactions",
    workspace_id: "ws-1",
    created_by_agent_id: "agent-1",
    name: "Customer Interactions",
    slug: "customer-interactions",
    description:
      "Agent-generated log of all customer touchpoints, sentiment scores, and resolution outcomes across support channels.",
    source_type: "agent_generated",
    format: "json",
    schema_definition: {
      columns: makeColumns([
        ["interaction_id", "string", false, "Unique interaction identifier"],
        ["customer_id", "string", false, "Customer UUID"],
        [
          "channel",
          "string",
          false,
          "Contact channel: email, chat, phone, social",
        ],
        ["sentiment_score", "float", true, "NLP sentiment score -1.0 to 1.0"],
        ["resolution_time_s", "integer", true, "Time to resolution in seconds"],
        ["resolved", "boolean", false, "Whether the issue was resolved"],
        ["agent_id", "string", true, "Handling agent identifier"],
        ["created_at", "timestamp", false, "Interaction timestamp"],
      ]),
    },
    row_count: 12450,
    size_bytes: 2_411_520,
    status: "active",
    refresh_schedule: "0 * * * *",
    last_refreshed_at: hourAgo,
    tags: ["customer", "support", "sentiment", "agent-generated"],
    access_agents: ["agent-1", "agent-2", "agent-3"],
    inserted_at: weekAgo,
    updated_at: hourAgo,
  },
  {
    id: "ds-product-catalog",
    workspace_id: "ws-1",
    created_by_agent_id: null,
    name: "Product Catalog",
    slug: "product-catalog",
    description:
      "Uploaded product master data including SKUs, pricing tiers, inventory levels, and category taxonomy.",
    source_type: "upload",
    format: "csv",
    schema_definition: {
      columns: makeColumns([
        ["sku", "string", false, "Stock keeping unit"],
        ["name", "string", false, "Product display name"],
        ["category", "string", false, "Category path (slash-delimited)"],
        ["price_cents", "integer", false, "Price in cents USD"],
        ["inventory", "integer", true, "Current stock count"],
        ["is_active", "boolean", false, "Whether product is listed"],
      ]),
    },
    row_count: 3200,
    size_bytes: 460_800,
    status: "active",
    refresh_schedule: null,
    last_refreshed_at: dayAgo,
    tags: ["products", "catalog", "inventory"],
    access_agents: ["agent-1", "agent-4"],
    inserted_at: weekAgo,
    updated_at: dayAgo,
  },
  {
    id: "ds-sales-pipeline",
    workspace_id: "ws-1",
    created_by_agent_id: null,
    name: "Sales Pipeline",
    slug: "sales-pipeline",
    description:
      "Live CRM data synced from PostgreSQL — opportunities, deal stages, ARR projections, and close probability scores.",
    source_type: "database",
    format: "sql",
    schema_definition: {
      columns: makeColumns([
        ["opportunity_id", "string", false, "CRM opportunity ID"],
        ["account_name", "string", false, "Company or account name"],
        [
          "stage",
          "string",
          false,
          "Deal stage: prospecting, qualification, proposal, closed_won, closed_lost",
        ],
        ["arr_usd", "float", false, "Annual recurring revenue in USD"],
        ["close_probability", "float", true, "0-1 probability score"],
        ["expected_close_date", "date", true, "Expected close date"],
        ["owner_id", "string", true, "Sales rep identifier"],
      ]),
    },
    row_count: 8900,
    size_bytes: 1_843_200,
    status: "active",
    refresh_schedule: "*/15 * * * *",
    last_refreshed_at: new Date(Date.now() - 900_000).toISOString(),
    tags: ["sales", "crm", "pipeline", "revenue"],
    access_agents: ["agent-1", "agent-2"],
    inserted_at: weekAgo,
    updated_at: new Date(Date.now() - 900_000).toISOString(),
  },
  {
    id: "ds-support-tickets",
    workspace_id: "ws-1",
    created_by_agent_id: null,
    name: "Support Tickets",
    slug: "support-tickets",
    description:
      "Pulls from Zendesk API — full ticket history with tags, priority, CSAT scores, and escalation flags.",
    source_type: "api",
    format: "json",
    schema_definition: {
      columns: makeColumns([
        ["ticket_id", "integer", false, "Zendesk ticket number"],
        ["subject", "string", false, "Ticket subject line"],
        ["status", "string", false, "open, pending, solved, closed"],
        ["priority", "string", true, "low, normal, high, urgent"],
        ["csat_score", "integer", true, "1-5 CSAT rating"],
        ["escalated", "boolean", false, "Whether ticket was escalated"],
        ["created_at", "timestamp", false, "Ticket creation time"],
        ["solved_at", "timestamp", true, "Resolution timestamp"],
      ]),
    },
    row_count: 25000,
    size_bytes: 5_242_880,
    status: "active",
    refresh_schedule: "0 */2 * * *",
    last_refreshed_at: new Date(Date.now() - 7_200_000).toISOString(),
    tags: ["support", "tickets", "zendesk", "csat"],
    access_agents: ["agent-1", "agent-2", "agent-3", "agent-5"],
    inserted_at: weekAgo,
    updated_at: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: "ds-content-performance",
    workspace_id: "ws-1",
    created_by_agent_id: "agent-2",
    name: "Content Performance",
    slug: "content-performance",
    description:
      "Agent-curated dataset of published content assets with engagement metrics, conversion attribution, and SEO signals.",
    source_type: "agent_generated",
    format: "json",
    schema_definition: {
      columns: makeColumns([
        ["content_id", "string", false, "Content asset identifier"],
        ["title", "string", false, "Content title"],
        ["type", "string", false, "blog, video, email, social, whitepaper"],
        ["views", "integer", false, "Total view count"],
        ["conversion_rate", "float", true, "0-1 conversion rate"],
        [
          "avg_time_on_page_s",
          "integer",
          true,
          "Average time on page in seconds",
        ],
      ]),
    },
    row_count: 1800,
    size_bytes: 327_680,
    status: "active",
    refresh_schedule: "0 6 * * *",
    last_refreshed_at: dayAgo,
    tags: ["content", "marketing", "seo", "engagement"],
    access_agents: ["agent-2", "agent-4"],
    inserted_at: weekAgo,
    updated_at: dayAgo,
  },
  {
    id: "ds-market-research",
    workspace_id: "ws-1",
    created_by_agent_id: null,
    name: "Market Research",
    slug: "market-research",
    description:
      "Uploaded competitive analysis survey data — segment sizing, buyer personas, and JTBD interview transcripts coded to themes.",
    source_type: "upload",
    format: "csv",
    schema_definition: {
      columns: makeColumns([
        ["respondent_id", "string", false, "Anonymous respondent ID"],
        ["segment", "string", false, "Market segment label"],
        ["company_size", "string", true, "SMB, mid-market, enterprise"],
        ["budget_range", "string", true, "Annual budget range"],
        ["top_pain_theme", "string", false, "Primary coded pain theme"],
        ["nps_score", "integer", true, "Net Promoter Score"],
      ]),
    },
    row_count: 500,
    size_bytes: 91_136,
    status: "stale",
    refresh_schedule: null,
    last_refreshed_at: weekAgo,
    tags: ["market-research", "surveys", "competitive", "personas"],
    access_agents: ["agent-2"],
    inserted_at: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    updated_at: weekAgo,
  },
  {
    id: "ds-system-metrics",
    workspace_id: "ws-1",
    created_by_agent_id: null,
    name: "System Metrics",
    slug: "system-metrics",
    description:
      "High-frequency telemetry stream from OSA infrastructure — CPU, memory, latency percentiles, and error rates per service.",
    source_type: "stream",
    format: "json",
    schema_definition: {
      columns: makeColumns([
        ["ts", "timestamp", false, "Metric timestamp (second precision)"],
        ["service", "string", false, "Service name"],
        ["cpu_pct", "float", false, "CPU utilization 0-100"],
        ["mem_mb", "integer", false, "Memory usage in MB"],
        ["p99_latency_ms", "float", true, "p99 request latency in ms"],
        ["error_rate", "float", false, "Errors per second"],
        ["instance_id", "string", false, "Node or container identifier"],
      ]),
    },
    row_count: 100000,
    size_bytes: 47_185_920,
    status: "active",
    refresh_schedule: "* * * * * *",
    last_refreshed_at: new Date(Date.now() - 60_000).toISOString(),
    tags: ["infrastructure", "metrics", "telemetry", "streaming"],
    access_agents: ["agent-1", "agent-3"],
    inserted_at: weekAgo,
    updated_at: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: "ds-email-campaigns",
    workspace_id: "ws-1",
    created_by_agent_id: null,
    name: "Email Campaigns",
    slug: "email-campaigns",
    description:
      "Campaign performance pulled from HubSpot API — send stats, open/click rates, unsubscribes, and revenue attribution.",
    source_type: "api",
    format: "json",
    schema_definition: {
      columns: makeColumns([
        ["campaign_id", "string", false, "HubSpot campaign ID"],
        ["campaign_name", "string", false, "Campaign display name"],
        ["sent_count", "integer", false, "Emails sent"],
        ["open_rate", "float", true, "Unique open rate 0-1"],
        ["click_rate", "float", true, "Unique click rate 0-1"],
        ["unsubscribe_count", "integer", false, "Unsubscribe count"],
        ["revenue_attributed_usd", "float", true, "Attributed revenue USD"],
        ["sent_at", "timestamp", false, "Send timestamp"],
      ]),
    },
    row_count: 4500,
    size_bytes: 798_720,
    status: "active",
    refresh_schedule: "0 8 * * *",
    last_refreshed_at: dayAgo,
    tags: ["email", "campaigns", "hubspot", "marketing"],
    access_agents: ["agent-2", "agent-4"],
    inserted_at: weekAgo,
    updated_at: dayAgo,
  },
];

export function mockDatasets(
  workspaceId?: string,
  sourceType?: string,
): Dataset[] {
  let result = [..._datasets];
  if (workspaceId)
    result = result.filter((d) => d.workspace_id === workspaceId);
  if (sourceType) result = result.filter((d) => d.source_type === sourceType);
  return result;
}

export function mockDatasetById(id: string): Dataset | undefined {
  return _datasets.find((d) => d.id === id);
}

export function addMockDataset(dataset: Dataset): void {
  _datasets = [dataset, ..._datasets];
}

export function updateMockDataset(
  id: string,
  patch: Partial<Dataset>,
): Dataset | undefined {
  const idx = _datasets.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;
  _datasets[idx] = { ..._datasets[idx], ...patch, updated_at: now };
  return _datasets[idx];
}

export function deleteMockDataset(id: string): void {
  _datasets = _datasets.filter((d) => d.id !== id);
}

export function mockDatasetPreview(
  id: string,
  limit = 50,
): DatasetPreviewRow[] {
  const dataset = mockDatasetById(id);
  if (!dataset?.schema_definition?.columns) return [];

  const columns = dataset.schema_definition.columns;
  const count = Math.min(limit, dataset.row_count);

  return Array.from({ length: count }, (_, i) => {
    const row: DatasetPreviewRow = {};
    for (const col of columns) {
      row[col.name] = generateSampleValue(col.type, i + 1);
    }
    return row;
  });
}

function generateSampleValue(
  type: DatasetColumn["type"],
  i: number,
): string | number | boolean | null {
  switch (type) {
    case "integer":
      return i * 10 + Math.floor(Math.random() * 5);
    case "float":
      return Math.round((i * 3.14 + Math.random()) * 100) / 100;
    case "boolean":
      return i % 2 === 0;
    case "timestamp":
      return new Date(Date.now() - i * 60_000).toISOString();
    case "date":
      return new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    default:
      return `sample_value_${i}`;
  }
}

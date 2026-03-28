import type { Webhook } from "../types";

let mockWebhookData: Webhook[] = [
  {
    id: "wh-1",
    name: "GitHub Push Events",
    direction: "incoming",
    url: "https://nullhack.local/webhooks/github",
    events: ["push", "pull_request"],
    secret: null,
    enabled: true,
    last_triggered_at: new Date(Date.now() - 3_600_000).toISOString(),
    failure_count: 0,
    created_at: "2026-03-01T00:00:00Z",
  },
];

export function mockWebhooks(): Webhook[] {
  return mockWebhookData;
}

export function getWebhookById(id: string): Webhook | undefined {
  return mockWebhookData.find((w) => w.id === id);
}

export function addWebhook(webhook: Webhook): void {
  mockWebhookData = [webhook, ...mockWebhookData];
}

export function updateWebhook(
  id: string,
  data: Partial<Webhook>,
): Webhook | undefined {
  const idx = mockWebhookData.findIndex((w) => w.id === id);
  if (idx === -1) return undefined;
  mockWebhookData[idx] = {
    ...mockWebhookData[idx],
    ...data,
  };
  return mockWebhookData[idx];
}

export function deleteWebhook(id: string): boolean {
  const len = mockWebhookData.length;
  mockWebhookData = mockWebhookData.filter((w) => w.id !== id);
  return mockWebhookData.length < len;
}

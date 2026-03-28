import type { AlertRule } from "../types";

let mockAlertRuleData: AlertRule[] = [
  {
    id: "ar-1",
    name: "Agent error rate high",
    entity_type: "agent",
    field: "error_rate",
    operator: "gt",
    value: "0.05",
    action: "notify",
    enabled: true,
    triggered_count: 2,
    last_triggered_at: new Date(Date.now() - 86_400_000).toISOString(),
    created_at: "2026-03-01T00:00:00Z",
  },
];

export function mockAlertRules(): AlertRule[] {
  return mockAlertRuleData;
}

export function getAlertRuleById(id: string): AlertRule | undefined {
  return mockAlertRuleData.find((r) => r.id === id);
}

export function addAlertRule(rule: AlertRule): void {
  mockAlertRuleData = [rule, ...mockAlertRuleData];
}

export function deleteAlertRule(id: string): boolean {
  const len = mockAlertRuleData.length;
  mockAlertRuleData = mockAlertRuleData.filter((r) => r.id !== id);
  return mockAlertRuleData.length < len;
}

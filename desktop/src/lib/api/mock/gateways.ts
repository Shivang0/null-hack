import type { Gateway } from "../types";

let mockGatewayData: Gateway[] = [
  {
    id: "gw-1",
    name: "Anthropic",
    provider: "anthropic",
    endpoint: "https://api.anthropic.com",
    api_key_set: true,
    is_primary: true,
    status: "healthy",
    latency_ms: 142,
    last_probe_at: new Date(Date.now() - 60_000).toISOString(),
    models: [
      "claude-sonnet-4-6",
      "claude-opus-4-6",
      "claude-haiku-4-5-20251001",
    ],
    created_at: "2026-03-01T00:00:00Z",
  },
];

export function mockGateways(): Gateway[] {
  return mockGatewayData;
}

export function getGatewayById(id: string): Gateway | undefined {
  return mockGatewayData.find((g) => g.id === id);
}

export function addGateway(gateway: Gateway): void {
  mockGatewayData = [gateway, ...mockGatewayData];
}

export function updateGateway(
  id: string,
  data: Partial<Gateway>,
): Gateway | undefined {
  const idx = mockGatewayData.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  mockGatewayData[idx] = {
    ...mockGatewayData[idx],
    ...data,
  };
  return mockGatewayData[idx];
}

export function deleteGateway(id: string): boolean {
  const len = mockGatewayData.length;
  mockGatewayData = mockGatewayData.filter((g) => g.id !== id);
  return mockGatewayData.length < len;
}

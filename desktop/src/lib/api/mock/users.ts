import type { User } from "../types";

// Mock data for offline/demo mode. These are NOT real credentials —
// they only exist to populate the UI when the backend is unreachable.
// Corresponding seed users are created by seeds.exs (CANOPY_SEED_DEMO=true).
const MOCK_USERS: User[] = [
  {
    id: "user-admin",
    email: "admin@nullhack.dev",
    name: "Admin User",
    role: "admin",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "user-dev",
    email: "dev@nullhack.dev",
    name: "Dev User",
    role: "member",
    created_at: "2026-01-01T00:00:00Z",
  },
];

export function mockUsers(): User[] {
  return MOCK_USERS;
}

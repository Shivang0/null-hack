// Deterministic enrichment helpers — hash-based metadata generation

import type {
  LibraryAgent,
  LibrarySkill,
  LibraryOperation,
  LibraryTemplate,
  Visibility,
} from "./types";

const TAG_POOL = [
  "automation",
  "analysis",
  "generation",
  "optimization",
  "monitoring",
  "security",
  "testing",
  "deployment",
  "integration",
  "reporting",
  "ai-native",
  "real-time",
  "batch",
  "streaming",
  "composable",
  "enterprise",
  "starter",
  "advanced",
  "lightweight",
  "full-stack",
] as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function deriveFavorites(id: string, isOfficial: boolean): number {
  const h = hashId(id);
  if (isOfficial) return 500 + (h % 4501);
  return 50 + (h % 451);
}

function deriveForks(id: string, isOfficial: boolean): number {
  const h = hashId(id + "forks");
  if (isOfficial) return 100 + (h % 901);
  return 10 + (h % 91);
}

function deriveDownloads(id: string, isOfficial: boolean): number {
  const h = hashId(id + "dl");
  if (isOfficial) return 1000 + (h % 49001);
  return 100 + (h % 4901);
}

function deriveTags(id: string, category: string): string[] {
  const h = hashId(id);
  const count = 2 + (h % 3);
  const result: string[] = [];
  const catTag = category.replace("-", " ");
  const poolTags: string[] = [];
  for (let i = 0; i < TAG_POOL.length; i++) {
    poolTags.push(TAG_POOL[(h + i * 7) % TAG_POOL.length]);
  }
  const seen = new Set<string>([catTag]);
  result.push(catTag);
  for (const t of poolTags) {
    if (!seen.has(t)) {
      seen.add(t);
      result.push(t);
    }
    if (result.length >= count) break;
  }
  return result;
}

function derivePotency(id: string): number {
  const h = hashId(id + "potency");
  return 40 + (h % 61);
}

function deriveRating(id: string): number {
  const h = hashId(id + "rating");
  const steps = h % 16;
  return Math.round((3.5 + steps * 0.1) * 10) / 10;
}

function deriveAddedAt(id: string): string {
  const h = hashId(id);
  const dayOffset = h % 90;
  const base = new Date("2026-01-01T00:00:00.000Z");
  base.setUTCDate(base.getUTCDate() + dayOffset);
  return base.toISOString();
}

function deriveVersion(id: string): string {
  const h = hashId(id + "ver");
  const major = 1 + (h % 3);
  const minor = h % 10;
  const patch = (h >> 4) % 10;
  return `${major}.${minor}.${patch}`;
}

// ── Raw input types (before enrichment) ──────────────────────────────────────

export type RawAgent = Omit<
  LibraryAgent,
  | "downloads"
  | "favorites"
  | "forks"
  | "tags"
  | "visibility"
  | "potency"
  | "rating"
  | "version"
  | "added_at"
  | "isOfficial"
>;

export type RawSkill = Omit<
  LibrarySkill,
  | "enabled"
  | "downloads"
  | "favorites"
  | "forks"
  | "tags"
  | "visibility"
  | "version"
  | "added_at"
  | "isOfficial"
>;

export type RawOperation = Omit<
  LibraryOperation,
  | "emoji"
  | "downloads"
  | "favorites"
  | "forks"
  | "tags"
  | "version"
  | "isOfficial"
> & { emoji?: string };

export type RawTemplate = Omit<
  LibraryTemplate,
  | "emoji"
  | "downloads"
  | "favorites"
  | "forks"
  | "tags"
  | "version"
  | "isOfficial"
> & { emoji?: string };

// ── Enrichment functions ─────────────────────────────────────────────────────

export function enrichAgent(a: RawAgent): LibraryAgent {
  const isOfficial = a.adapter === "osa";
  return {
    ...a,
    isOfficial,
    downloads: deriveDownloads(a.id, isOfficial),
    favorites: deriveFavorites(a.id, isOfficial),
    forks: deriveForks(a.id, isOfficial),
    tags: deriveTags(a.id, a.category),
    visibility: "public" as Visibility,
    potency: derivePotency(a.id),
    rating: deriveRating(a.id),
    version: deriveVersion(a.id),
    added_at: deriveAddedAt(a.id),
  };
}

export function enrichSkill(s: RawSkill): LibrarySkill {
  const isOfficial = true;
  return {
    ...s,
    enabled: false,
    isOfficial,
    downloads: deriveDownloads(s.id, isOfficial),
    favorites: deriveFavorites(s.id, isOfficial),
    forks: deriveForks(s.id, isOfficial),
    tags: deriveTags(s.id, s.category),
    visibility: "public" as Visibility,
    version: deriveVersion(s.id),
    added_at: deriveAddedAt(s.id),
  };
}

export function enrichOperation(o: RawOperation): LibraryOperation {
  const isOfficial = true;
  return {
    ...o,
    emoji: o.emoji ?? "🏢",
    isOfficial,
    downloads: deriveDownloads(o.id, isOfficial),
    favorites: deriveFavorites(o.id, isOfficial),
    forks: deriveForks(o.id, isOfficial),
    tags: deriveTags(o.id, o.category),
    version: deriveVersion(o.id),
  };
}

export function enrichTemplate(t: RawTemplate): LibraryTemplate {
  const isOfficial = true;
  return {
    ...t,
    emoji: t.emoji ?? "📋",
    isOfficial,
    downloads: deriveDownloads(t.id, isOfficial),
    favorites: deriveFavorites(t.id, isOfficial),
    forks: deriveForks(t.id, isOfficial),
    tags: deriveTags(t.id, t.size),
    version: deriveVersion(t.id),
  };
}

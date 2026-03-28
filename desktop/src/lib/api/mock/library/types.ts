// Library type definitions

export type Visibility = "public" | "unlisted" | "private";

export interface LibraryAgent {
  id: string;
  name: string;
  emoji: string;
  category: string;
  role: string;
  adapter: string;
  budget: number;
  description: string;
  downloads: number;
  favorites: number;
  forks: number;
  tags: string[];
  visibility: Visibility;
  potency: number;
  rating: number;
  version: string;
  added_at: string;
  isOfficial: boolean;
}

export interface LibrarySkill {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  downloads: number;
  favorites: number;
  forks: number;
  tags: string[];
  visibility: Visibility;
  version: string;
  added_at: string;
  isOfficial: boolean;
}

export interface LibraryOperation {
  id: string;
  name: string;
  description: string;
  agent_count: number;
  skill_count: number;
  category: string;
  emoji: string;
  downloads: number;
  favorites: number;
  forks: number;
  tags: string[];
  version: string;
  isOfficial: boolean;
}

export interface LibraryTemplate {
  id: string;
  name: string;
  description: string;
  size: string;
  agent_count: number;
  emoji: string;
  downloads: number;
  favorites: number;
  forks: number;
  tags: string[];
  version: string;
  isOfficial: boolean;
}

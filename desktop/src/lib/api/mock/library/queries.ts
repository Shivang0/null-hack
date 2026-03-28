// Library query functions — the public API consumed by UI routes

import type {
  LibraryAgent,
  LibrarySkill,
  LibraryOperation,
  LibraryTemplate,
} from "./types";
import { AGENTS } from "./agents";
import { SKILLS } from "./skills";
import { OPERATIONS } from "./operations";
import { TEMPLATES } from "./templates";

export function getLibraryAgents(): LibraryAgent[] {
  return AGENTS;
}

export function getLibraryAgentsByCategory(): Map<string, LibraryAgent[]> {
  const map = new Map<string, LibraryAgent[]>();
  for (const agent of AGENTS) {
    const list = map.get(agent.category) ?? [];
    list.push(agent);
    map.set(agent.category, list);
  }
  return map;
}

export function getLibrarySkills(): LibrarySkill[] {
  return SKILLS;
}

export function getLibrarySkillsByCategory(): Map<string, LibrarySkill[]> {
  const map = new Map<string, LibrarySkill[]>();
  for (const skill of SKILLS) {
    const list = map.get(skill.category) ?? [];
    list.push(skill);
    map.set(skill.category, list);
  }
  return map;
}

export function getLibraryOperations(): LibraryOperation[] {
  return OPERATIONS;
}

export function getLibraryTemplates(): LibraryTemplate[] {
  return TEMPLATES;
}

export function getLibraryCategoryCounts(): {
  agents: Map<string, number>;
  skills: Map<string, number>;
} {
  const agents = new Map<string, number>();
  for (const agent of AGENTS) {
    agents.set(agent.category, (agents.get(agent.category) ?? 0) + 1);
  }

  const skills = new Map<string, number>();
  for (const skill of SKILLS) {
    skills.set(skill.category, (skills.get(skill.category) ?? 0) + 1);
  }

  return { agents, skills };
}

export function getLibraryAgentDetail(id: string): LibraryAgent | null {
  return AGENTS.find((a) => a.id === id) ?? null;
}

export function getLibrarySkillDetail(id: string): LibrarySkill | null {
  return SKILLS.find((s) => s.id === id) ?? null;
}

export function getLibraryTeamDetail(id: string): LibraryTemplate | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

export function getLibraryCompanyDetail(id: string): LibraryOperation | null {
  return OPERATIONS.find((o) => o.id === id) ?? null;
}

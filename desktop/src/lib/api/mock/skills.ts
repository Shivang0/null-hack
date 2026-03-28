import type { Skill } from "../types";

let mockSkillData: Skill[] = [
  {
    id: "skill-codegen",
    name: "Code Generation",
    description:
      "Generate, refactor, and review source code across multiple languages.",
    category: "core",
    source: "builtin",
    enabled: true,
    triggers: ["implement", "write", "refactor", "generate code"],
    version: "1.0.0",
    author: "MIOSA",
    downloads: 0,
    rating: 0,
  },
  {
    id: "skill-search",
    name: "Web Search",
    description:
      "Search the web for documentation, research papers, and technical references.",
    category: "utility",
    source: "builtin",
    enabled: true,
    triggers: ["search", "find", "look up", "research"],
    version: "1.0.0",
    author: "MIOSA",
    downloads: 0,
    rating: 0,
  },
  {
    id: "skill-review",
    name: "PR Review",
    description:
      "Review pull requests for correctness, security, and style adherence.",
    category: "core",
    source: "builtin",
    enabled: true,
    triggers: ["review", "PR", "pull request", "LGTM"],
    version: "1.0.0",
    author: "MIOSA",
    downloads: 0,
    rating: 0,
  },
  {
    id: "skill-deploy",
    name: "Deployment",
    description:
      "Deploy services to staging and production via automated pipelines.",
    category: "automation",
    source: "builtin",
    enabled: false,
    triggers: ["deploy", "release", "rollout", "ship"],
    version: "1.0.0",
    author: "MIOSA",
    downloads: 0,
    rating: 0,
  },
];

export function mockSkills(): Skill[] {
  return mockSkillData;
}

export function getSkillById(id: string): Skill | undefined {
  return mockSkillData.find((s) => s.id === id);
}

export function toggleSkill(id: string): Skill | undefined {
  const idx = mockSkillData.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  mockSkillData[idx] = {
    ...mockSkillData[idx],
    enabled: !mockSkillData[idx].enabled,
  };
  return mockSkillData[idx];
}

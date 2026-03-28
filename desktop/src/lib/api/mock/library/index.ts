// Library mock API — barrel module
// Replaces the old 3,055-line library.ts god file

// Types
export type {
  Visibility,
  LibraryAgent,
  LibrarySkill,
  LibraryOperation,
  LibraryTemplate,
} from "./types";

// Categories
export { AGENT_CATEGORIES, SKILL_CATEGORIES } from "./categories";

export type { AgentCategory, SkillCategory } from "./categories";

// Query functions (public API)
export {
  getLibraryAgents,
  getLibraryAgentsByCategory,
  getLibrarySkills,
  getLibrarySkillsByCategory,
  getLibraryOperations,
  getLibraryTemplates,
  getLibraryCategoryCounts,
  getLibraryAgentDetail,
  getLibrarySkillDetail,
  getLibraryTeamDetail,
  getLibraryCompanyDetail,
} from "./queries";

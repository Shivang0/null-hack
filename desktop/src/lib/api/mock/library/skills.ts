// Skill data — 109 skills across 18 categories

import type { LibrarySkill } from "./types";
import type { RawSkill } from "./enrichment";
import { enrichSkill } from "./enrichment";

const RAW_SKILLS: RawSkill[] = [
  // ai-patterns (13)
  {
    id: "learning-engine",
    name: "Learning Engine",
    category: "ai-patterns",
    description:
      "Captures patterns from interactions and updates agent behavior over time.",
  },
  {
    id: "lats",
    name: "LATS",
    category: "ai-patterns",
    description:
      "Language Agent Tree Search — uses MCTS-style exploration for complex reasoning tasks.",
  },
  {
    id: "skeleton-of-thought",
    name: "Skeleton of Thought",
    category: "ai-patterns",
    description:
      "Generates an answer skeleton first, then fills in details in parallel.",
  },
  {
    id: "tree-of-thoughts",
    name: "Tree of Thoughts",
    category: "ai-patterns",
    description:
      "Explores multiple reasoning branches simultaneously to find optimal solutions.",
  },
  {
    id: "self-consistency",
    name: "Self Consistency",
    category: "ai-patterns",
    description:
      "Samples multiple reasoning paths and selects the most consistent answer.",
  },
  {
    id: "meta-prompting",
    name: "Meta Prompting",
    category: "ai-patterns",
    description:
      "Generates and refines prompts dynamically to improve task performance.",
  },
  {
    id: "prompt-cache-optimizer",
    name: "Prompt Cache Optimizer",
    category: "ai-patterns",
    description:
      "Structures prompts to maximize cache hit rates and reduce token costs.",
  },
  {
    id: "react-pattern",
    name: "ReAct Pattern",
    category: "ai-patterns",
    description:
      "Interleaves reasoning and action steps for grounded, tool-augmented decisions.",
  },
  {
    id: "reflection",
    name: "Reflection",
    category: "ai-patterns",
    description:
      "Critiques and iteratively refines outputs through self-evaluation loops.",
  },
  {
    id: "judge-prompt",
    name: "Judge Prompt",
    category: "ai-patterns",
    description:
      "Uses an LLM-as-judge to score and select among candidate outputs.",
  },
  {
    id: "synthetic-data",
    name: "Synthetic Data",
    category: "ai-patterns",
    description:
      "Generates synthetic training and evaluation data from specifications.",
  },
  {
    id: "validate-evaluator",
    name: "Validate Evaluator",
    category: "ai-patterns",
    description:
      "Validates agent outputs against defined criteria before surfacing results.",
  },
  {
    id: "eval-rag",
    name: "Eval RAG",
    category: "ai-patterns",
    description:
      "Evaluates retrieval-augmented generation quality across faithfulness and relevance.",
  },

  // development (14)
  {
    id: "build",
    name: "Build",
    category: "development",
    description: "Compiles and builds project artifacts from source code.",
  },
  {
    id: "code-review",
    name: "Code Review",
    category: "development",
    description:
      "Reviews code changes for correctness, style, and security issues.",
  },
  {
    id: "debug",
    name: "Debug",
    category: "development",
    description:
      "Diagnoses and resolves bugs using systematic debugging techniques.",
  },
  {
    id: "deploy",
    name: "Deploy",
    category: "development",
    description: "Deploys application versions to target environments.",
  },
  {
    id: "lint",
    name: "Lint",
    category: "development",
    description:
      "Runs linters and static analysis tools to enforce code quality standards.",
  },
  {
    id: "test",
    name: "Test",
    category: "development",
    description: "Executes test suites and reports pass/fail status.",
  },
  {
    id: "refactor",
    name: "Refactor",
    category: "development",
    description:
      "Restructures code to improve readability and reduce complexity without changing behavior.",
  },
  {
    id: "commit",
    name: "Commit",
    category: "development",
    description:
      "Stages and commits changes with well-structured commit messages.",
  },
  {
    id: "create-pr",
    name: "Create PR",
    category: "development",
    description:
      "Creates pull requests with summary, context, and testing notes.",
  },
  {
    id: "review-pr",
    name: "Review PR",
    category: "development",
    description: "Reviews open pull requests and posts structured feedback.",
  },
  {
    id: "tdd",
    name: "TDD",
    category: "development",
    description:
      "Drives implementation through the red-green-refactor test-driven cycle.",
  },
  {
    id: "simplify",
    name: "Simplify",
    category: "development",
    description:
      "Reduces code complexity and eliminates unnecessary abstraction.",
  },
  {
    id: "fix",
    name: "Fix",
    category: "development",
    description:
      "Applies targeted fixes to failing tests, bugs, or broken builds.",
  },
  {
    id: "explain",
    name: "Explain",
    category: "development",
    description:
      "Produces plain-language explanations of code, algorithms, or system behavior.",
  },

  // paid-media (17)
  {
    id: "ads-google",
    name: "Google Ads",
    category: "paid-media",
    description:
      "Creates and manages Google Search, Display, and Performance Max campaigns.",
  },
  {
    id: "ads-meta",
    name: "Meta Ads",
    category: "paid-media",
    description: "Builds and optimizes Meta (Facebook/Instagram) ad campaigns.",
  },
  {
    id: "ads-tiktok",
    name: "TikTok Ads",
    category: "paid-media",
    description:
      "Manages TikTok paid campaigns including TopView and In-Feed formats.",
  },
  {
    id: "ads-linkedin",
    name: "LinkedIn Ads",
    category: "paid-media",
    description:
      "Runs LinkedIn Sponsored Content and Message Ads for B2B targeting.",
  },
  {
    id: "ads-youtube",
    name: "YouTube Ads",
    category: "paid-media",
    description:
      "Plans and executes YouTube video ad campaigns for reach and conversion.",
  },
  {
    id: "ads-apple",
    name: "Apple Search Ads",
    category: "paid-media",
    description: "Manages Apple Search Ads campaigns for App Store discovery.",
  },
  {
    id: "ads-microsoft",
    name: "Microsoft Ads",
    category: "paid-media",
    description:
      "Sets up and optimizes Microsoft/Bing search advertising campaigns.",
  },
  {
    id: "ads-creative",
    name: "Ad Creative",
    category: "paid-media",
    description:
      "Produces ad creative concepts, copy, and briefs for paid campaigns.",
  },
  {
    id: "ads-budget",
    name: "Budget Management",
    category: "paid-media",
    description:
      "Allocates and paces ad budgets across channels to hit spend and ROAS targets.",
  },
  {
    id: "ads-audit",
    name: "Campaign Audit",
    category: "paid-media",
    description:
      "Audits ad accounts for structural issues, waste, and performance gaps.",
  },
  {
    id: "ads-competitor",
    name: "Competitor Analysis",
    category: "paid-media",
    description:
      "Analyzes competitor ad strategies, creative, and spend positioning.",
  },
  {
    id: "ads-landing",
    name: "Landing Page Optimization",
    category: "paid-media",
    description:
      "Optimizes landing pages for paid traffic to maximize conversion rates.",
  },
  {
    id: "ads-dna",
    name: "Ad DNA",
    category: "paid-media",
    description:
      "Extracts and replicates the winning elements from top-performing ads.",
  },
  {
    id: "ads-photoshoot",
    name: "Photoshoot Brief",
    category: "paid-media",
    description:
      "Creates photoshoot briefs aligned to paid media creative requirements.",
  },
  {
    id: "ads-create",
    name: "Ad Creation",
    category: "paid-media",
    description:
      "Generates complete ad units from brief through final copy and visual direction.",
  },
  {
    id: "ads-plan",
    name: "Media Plan",
    category: "paid-media",
    description:
      "Builds comprehensive media plans with channel mix, budget, and timeline.",
  },
  {
    id: "ads-generate",
    name: "Ad Generation",
    category: "paid-media",
    description:
      "Generates ad variations at scale using templates and AI-assisted copywriting.",
  },

  // coordination (7)
  {
    id: "inbox",
    name: "Inbox",
    category: "coordination",
    description:
      "Processes and routes incoming messages, tasks, and notifications.",
  },
  {
    id: "board",
    name: "Board",
    category: "coordination",
    description:
      "Manages task boards and tracks work item status across teams.",
  },
  {
    id: "delegate",
    name: "Delegate",
    category: "coordination",
    description:
      "Assigns tasks to appropriate agents or team members based on capacity and skill.",
  },
  {
    id: "checkout",
    name: "Checkout",
    category: "coordination",
    description:
      "Reserves and locks resources or tasks to prevent concurrent conflicts.",
  },
  {
    id: "heartbeat",
    name: "Heartbeat",
    category: "coordination",
    description:
      "Monitors agent and service health with periodic liveness checks.",
  },
  {
    id: "spawn",
    name: "Spawn",
    category: "coordination",
    description:
      "Launches new agent instances dynamically to handle parallel workloads.",
  },
  {
    id: "pay",
    name: "Pay",
    category: "coordination",
    description:
      "Processes payments and budget disbursements within workflow automations.",
  },

  // content (5)
  {
    id: "blog",
    name: "Blog Post",
    category: "content",
    description:
      "Researches and writes SEO-optimized blog posts from brief to published draft.",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    category: "content",
    description:
      "Composes email newsletter editions with curated content and original writing.",
  },
  {
    id: "social-post",
    name: "Social Post",
    category: "content",
    description:
      "Creates platform-tailored social media posts with copy and hashtag strategy.",
  },
  {
    id: "video-script",
    name: "Video Script",
    category: "content",
    description:
      "Writes structured video scripts with hooks, body, and calls to action.",
  },
  {
    id: "press-release",
    name: "Press Release",
    category: "content",
    description:
      "Drafts press releases in AP style for product launches and announcements.",
  },

  // knowledge (8)
  {
    id: "research",
    name: "Research",
    category: "knowledge",
    description:
      "Conducts deep research on a topic using web and internal sources.",
  },
  {
    id: "summarize",
    name: "Summarize",
    category: "knowledge",
    description: "Distills long documents into concise, accurate summaries.",
  },
  {
    id: "extract",
    name: "Extract",
    category: "knowledge",
    description:
      "Extracts structured data and key facts from unstructured text.",
  },
  {
    id: "classify",
    name: "Classify",
    category: "knowledge",
    description:
      "Categorizes content, entities, or records into defined taxonomies.",
  },
  {
    id: "compare",
    name: "Compare",
    category: "knowledge",
    description:
      "Produces structured comparisons of options, products, or approaches.",
  },
  {
    id: "synthesize",
    name: "Synthesize",
    category: "knowledge",
    description:
      "Combines insights from multiple sources into a unified analysis.",
  },
  {
    id: "cite",
    name: "Cite",
    category: "knowledge",
    description: "Identifies and formats citations from source material.",
  },
  {
    id: "index",
    name: "Index",
    category: "knowledge",
    description:
      "Builds searchable indexes from document collections and knowledge bases.",
  },

  // analysis (6)
  {
    id: "error-analysis",
    name: "Error Analysis",
    category: "analysis",
    description:
      "Analyzes error logs and failure patterns to identify root causes.",
  },
  {
    id: "health",
    name: "Health Check",
    category: "analysis",
    description:
      "Assesses system and operation health against defined metrics and thresholds.",
  },
  {
    id: "graph",
    name: "Graph Analysis",
    category: "analysis",
    description:
      "Analyzes graph data structures for patterns, clusters, and relationships.",
  },
  {
    id: "audit",
    name: "Audit",
    category: "analysis",
    description:
      "Performs structured audits against checklists and compliance frameworks.",
  },
  {
    id: "eval-audit",
    name: "Eval Audit",
    category: "analysis",
    description:
      "Audits AI evaluation pipelines for bias, coverage, and scoring validity.",
  },
  {
    id: "stats",
    name: "Statistical Analysis",
    category: "analysis",
    description:
      "Applies statistical methods to datasets to surface trends and significance.",
  },

  // security (4)
  {
    id: "secret-scan",
    name: "Secret Scan",
    category: "security",
    description:
      "Scans codebases and configs for exposed secrets, tokens, and credentials.",
  },
  {
    id: "security-scan",
    name: "Security Scan",
    category: "security",
    description:
      "Runs automated security scans for known vulnerabilities and misconfigurations.",
  },
  {
    id: "harden",
    name: "Harden",
    category: "security",
    description: "Applies security hardening to systems, configs, and code.",
  },
  {
    id: "auditor",
    name: "Security Auditor",
    category: "security",
    description:
      "Conducts manual security audits and penetration testing reviews.",
  },

  // processing (6)
  {
    id: "pipeline",
    name: "Pipeline",
    category: "processing",
    description:
      "Executes multi-step data processing pipelines with error handling and retry.",
  },
  {
    id: "reweave",
    name: "Reweave",
    category: "processing",
    description:
      "Restructures and re-sequences data streams for downstream consumption.",
  },
  {
    id: "seed",
    name: "Seed",
    category: "processing",
    description:
      "Populates data stores with initial or test data from seed files.",
  },
  {
    id: "transform",
    name: "Transform",
    category: "processing",
    description: "Converts data between formats, schemas, or representations.",
  },
  {
    id: "validate",
    name: "Validate",
    category: "processing",
    description:
      "Validates data against schemas, business rules, and integrity constraints.",
  },
  {
    id: "clean",
    name: "Clean",
    category: "processing",
    description:
      "Removes duplicates, nulls, and malformed records from datasets.",
  },

  // search (3)
  {
    id: "web-search",
    name: "Web Search",
    category: "search",
    description:
      "Executes web searches and retrieves relevant results for agent tasks.",
  },
  {
    id: "code-search",
    name: "Code Search",
    category: "search",
    description:
      "Searches codebases for patterns, symbols, and usage examples.",
  },
  {
    id: "doc-search",
    name: "Doc Search",
    category: "search",
    description:
      "Searches documentation corpora for relevant answers and references.",
  },

  // strategy (4)
  {
    id: "roadmap",
    name: "Roadmap",
    category: "strategy",
    description:
      "Builds strategic roadmaps with milestones, priorities, and dependencies.",
  },
  {
    id: "competitive-analysis",
    name: "Competitive Analysis",
    category: "strategy",
    description:
      "Analyzes competitor positioning, features, and market strategies.",
  },
  {
    id: "swot",
    name: "SWOT",
    category: "strategy",
    description: "Produces structured SWOT analyses for strategic planning.",
  },
  {
    id: "okr",
    name: "OKR",
    category: "strategy",
    description:
      "Defines and tracks Objectives and Key Results for teams and operations.",
  },

  // workflow (4)
  {
    id: "standup",
    name: "Standup",
    category: "workflow",
    description:
      "Runs automated standup check-ins and compiles team status updates.",
  },
  {
    id: "retrospective",
    name: "Retrospective",
    category: "workflow",
    description: "Facilitates sprint retrospectives and captures action items.",
  },
  {
    id: "sprint-planning",
    name: "Sprint Planning",
    category: "workflow",
    description: "Plans sprint scope, estimates, and capacity allocation.",
  },
  {
    id: "release",
    name: "Release",
    category: "workflow",
    description:
      "Coordinates software releases including changelogs, tagging, and deployment.",
  },

  // workspace (5)
  {
    id: "init",
    name: "Init",
    category: "workspace",
    description:
      "Initializes new workspace environments with config and dependencies.",
  },
  {
    id: "configure",
    name: "Configure",
    category: "workspace",
    description:
      "Applies configuration settings to workspace components and integrations.",
  },
  {
    id: "backup",
    name: "Backup",
    category: "workspace",
    description:
      "Creates and verifies backups of workspace data and configurations.",
  },
  {
    id: "migrate",
    name: "Migrate",
    category: "workspace",
    description:
      "Executes workspace or data migrations between versions or environments.",
  },
  {
    id: "validate-workspace",
    name: "Validate Workspace",
    category: "workspace",
    description: "Checks workspace integrity and configuration completeness.",
  },

  // governance (3)
  {
    id: "budget-check",
    name: "Budget Check",
    category: "governance",
    description:
      "Verifies that spending or resource usage stays within approved budget limits.",
  },
  {
    id: "approval",
    name: "Approval",
    category: "governance",
    description:
      "Routes decisions through defined approval chains and records outcomes.",
  },
  {
    id: "compliance",
    name: "Compliance",
    category: "governance",
    description:
      "Enforces compliance policies across agent actions and workflow outputs.",
  },

  // learning (6)
  {
    id: "pattern-capture",
    name: "Pattern Capture",
    category: "learning",
    description:
      "Identifies and saves recurring patterns from agent interactions to memory.",
  },
  {
    id: "skill-generate",
    name: "Skill Generate",
    category: "learning",
    description:
      "Synthesizes new skills from observed workflows and task executions.",
  },
  {
    id: "memory-consolidate",
    name: "Memory Consolidate",
    category: "learning",
    description:
      "Consolidates episodic memories into durable semantic knowledge.",
  },
  {
    id: "error-recovery",
    name: "Error Recovery",
    category: "learning",
    description:
      "Detects failure states and applies learned recovery strategies.",
  },
  {
    id: "context-inject",
    name: "Context Inject",
    category: "learning",
    description:
      "Injects relevant context from memory into agent prompts at runtime.",
  },
  {
    id: "adaptive-strategy",
    name: "Adaptive Strategy",
    category: "learning",
    description:
      "Adjusts agent strategy dynamically based on feedback and performance data.",
  },

  // agent (4)
  {
    id: "hire",
    name: "Hire",
    category: "agent",
    description:
      "Adds a new agent to the workspace from the library or a custom definition.",
  },
  {
    id: "fire",
    name: "Fire",
    category: "agent",
    description:
      "Removes an agent from the workspace and cleans up associated resources.",
  },
  {
    id: "promote",
    name: "Promote",
    category: "agent",
    description:
      "Elevates an agent role or permission level within the workspace.",
  },
  {
    id: "reassign",
    name: "Reassign",
    category: "agent",
    description:
      "Moves an agent to a different team, operation, or reporting structure.",
  },
];

export const SKILLS: LibrarySkill[] = RAW_SKILLS.map(enrichSkill);

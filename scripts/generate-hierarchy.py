#!/usr/bin/env python3
"""
generate-hierarchy.py
Generates divisions, departments, and teams for the Canopy organizational hierarchy,
and normalizes frontmatter across all 168 agent files.

Usage:
    python generate-hierarchy.py [--dry-run] [-v|--verbose]
"""

import argparse
import os
import sys
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# HIERARCHY DATA
# ─────────────────────────────────────────────────────────────────────────────

HIERARCHY = {
    "technology": {
        "name": "Technology",
        "description": "Builds, maintains, and assures every technical system",
        "budget": 50000,
        "signal": "S=(data, report, inform, markdown, division-status)",
        "departments": {
            "software-engineering": {
                "name": "Software Engineering",
                "head": "software-architect",
                "budget": 25000,
                "signal": "S=(code, report, inform, markdown, engineering-status)",
                "teams": {
                    "core-architecture": {
                        "name": "Core Architecture",
                        "manager": "software-architect",
                        "members": ["software-architect", "backend-architect", "autonomous-optimization-architect", "data-engineer", "database-optimizer"],
                        "budget": 8000,
                        "signal": "S=(code, spec, commit, markdown, system-architecture)",
                        "mission": "Core Architecture designs and maintains the foundational systems that all other engineering teams build upon. We are accountable for system coherence, performance baselines, and architectural decision quality.",
                    },
                    "application-development": {
                        "name": "Application Development",
                        "manager": "senior-developer",
                        "members": ["senior-developer", "frontend-developer", "mobile-app-builder", "rapid-prototyper", "code-reviewer"],
                        "budget": 7000,
                        "signal": "S=(code, spec, commit, markdown, implementation-plan)",
                        "mission": "Application Development ships production-quality features across web, mobile, and desktop surfaces. We are accountable for implementation velocity, code quality, and user-facing reliability.",
                    },
                    "emerging-tech": {
                        "name": "Emerging Tech",
                        "manager": "ai-engineer",
                        "members": ["ai-engineer", "ai-data-remediation-engineer", "solidity-smart-contract-engineer", "embedded-firmware-engineer"],
                        "budget": 5000,
                        "signal": "S=(code, spec, commit, markdown, research-implementation)",
                        "mission": "Emerging Tech evaluates, prototypes, and integrates new technologies — AI/ML, blockchain, embedded systems — into production. We are accountable for technical viability assessment and safe integration.",
                    },
                    "platform-integration": {
                        "name": "Platform Integration",
                        "manager": "feishu-integration-developer",
                        "members": ["feishu-integration-developer", "wechat-mini-program-developer", "git-workflow-master", "technical-writer"],
                        "budget": 5000,
                        "signal": "S=(code, spec, commit, markdown, integration-architecture)",
                        "mission": "Platform Integration builds and maintains connectors between our systems and external platforms. We are accountable for integration reliability, API compatibility, and developer documentation.",
                    },
                },
            },
            "platform-infrastructure": {
                "name": "Platform & Infrastructure",
                "head": "devops-automator",
                "budget": 8000,
                "signal": "S=(code, report, inform, markdown, infrastructure-status)",
                "teams": {
                    "devops-reliability": {
                        "name": "DevOps & Reliability",
                        "manager": "devops-automator",
                        "members": ["devops-automator", "sre", "incident-response-commander"],
                        "budget": 5000,
                        "signal": "S=(code, spec, commit, yaml, infrastructure-config)",
                        "mission": "DevOps & Reliability ensures systems are deployable, observable, and recoverable. We are accountable for uptime, deployment frequency, and mean time to recovery.",
                    },
                    "security-engineering": {
                        "name": "Security Engineering",
                        "manager": "security-engineer",
                        "members": ["security-engineer", "threat-detection-engineer"],
                        "budget": 3000,
                        "signal": "S=(linguistic, report, inform, markdown, threat-model)",
                        "mission": "Security Engineering protects systems from threats through defensive architecture, threat detection, and security testing. We are accountable for vulnerability count, detection coverage, and incident response time.",
                    },
                },
            },
            "quality-assurance": {
                "name": "Quality Assurance",
                "head": "api-tester",
                "budget": 6000,
                "signal": "S=(data, report, inform, markdown, qa-status)",
                "teams": {
                    "test-engineering": {
                        "name": "Test Engineering",
                        "manager": "api-tester",
                        "members": ["api-tester", "performance-benchmarker", "accessibility-auditor", "workflow-optimizer"],
                        "budget": 3000,
                        "signal": "S=(data, report, inform, markdown, test-results)",
                        "mission": "Test Engineering validates system behavior through automated testing, performance benchmarking, and accessibility auditing. We are accountable for test coverage, defect detection rate, and quality gate reliability.",
                    },
                    "insights-evidence": {
                        "name": "Insights & Evidence",
                        "manager": "test-results-analyzer",
                        "members": ["test-results-analyzer", "evidence-collector", "reality-checker", "tool-evaluator"],
                        "budget": 3000,
                        "signal": "S=(data, report, inform, markdown, evidence-report)",
                        "mission": "Insights & Evidence transforms raw test data into actionable intelligence. We are accountable for analysis accuracy, evidence completeness, and recommendation quality.",
                    },
                },
            },
            "product": {
                "name": "Product",
                "head": "product-manager",
                "budget": 5000,
                "signal": "S=(linguistic, spec, decide, markdown, product-status)",
                "teams": {
                    "product-strategy": {
                        "name": "Product Strategy",
                        "manager": "product-manager",
                        "members": ["product-manager", "sprint-prioritizer", "feedback-synthesizer", "trend-researcher", "behavioral-nudge-engine"],
                        "budget": 5000,
                        "signal": "S=(linguistic, spec, decide, markdown, product-requirement)",
                        "mission": "Product Strategy translates user needs and market signals into prioritized requirements. We are accountable for feature-market fit, sprint velocity, and user satisfaction metrics.",
                    },
                },
            },
            "spatial-computing": {
                "name": "Spatial Computing",
                "head": "xr-interface-architect",
                "budget": 6000,
                "signal": "S=(code, spec, commit, swift, spatial-architecture)",
                "teams": {
                    "xr-immersive": {
                        "name": "XR & Immersive",
                        "manager": "xr-interface-architect",
                        "members": ["xr-interface-architect", "xr-immersive-developer", "xr-cockpit-interaction-specialist"],
                        "budget": 3000,
                        "signal": "S=(code, spec, commit, swift, xr-interface-design)",
                        "mission": "XR & Immersive builds cross-platform spatial experiences. We are accountable for interaction quality, spatial coherence, and cross-device compatibility.",
                    },
                    "apple-platform": {
                        "name": "Apple Platform",
                        "manager": "visionos-spatial-engineer",
                        "members": ["visionos-spatial-engineer", "macos-spatial-metal-engineer", "terminal-integration-specialist"],
                        "budget": 3000,
                        "signal": "S=(code, spec, commit, swift, spatial-architecture)",
                        "mission": "Apple Platform specializes in visionOS, macOS spatial, and Metal pipeline development. We are accountable for platform compliance, rendering performance, and Apple design guideline adherence.",
                    },
                },
            },
        },
    },
    "creative-content": {
        "name": "Creative & Content",
        "description": "Creates visual, narrative, and experiential content across all media",
        "budget": 35000,
        "signal": "S=(visual, report, inform, markdown, division-status)",
        "departments": {
            "design": {
                "name": "Design",
                "head": "ux-architect",
                "budget": 10000,
                "signal": "S=(visual, spec, direct, markdown, design-status)",
                "teams": {
                    "ux-research": {
                        "name": "UX & Research",
                        "manager": "ux-architect",
                        "members": ["ux-architect", "ux-researcher", "inclusive-visuals-specialist", "ui-designer"],
                        "budget": 5000,
                        "signal": "S=(linguistic, report, inform, markdown, ux-architecture)",
                        "mission": "UX & Research ensures every interface is usable, accessible, and grounded in user evidence. We are accountable for usability scores, accessibility compliance, and research-backed design decisions.",
                    },
                    "visual-brand": {
                        "name": "Visual & Brand",
                        "manager": "brand-guardian",
                        "members": ["brand-guardian", "visual-storyteller", "image-prompt-engineer", "whimsy-injector"],
                        "budget": 5000,
                        "signal": "S=(visual, brief, direct, markdown, visual-narrative)",
                        "mission": "Visual & Brand maintains brand coherence across all visual touchpoints. We are accountable for brand consistency scores, visual quality, and creative differentiation.",
                    },
                },
            },
            "game-development": {
                "name": "Game Development",
                "head": "game-designer",
                "budget": 20000,
                "signal": "S=(code, spec, commit, markdown, game-development-status)",
                "teams": {
                    "game-design-narrative": {
                        "name": "Game Design & Narrative",
                        "manager": "game-designer",
                        "members": ["game-designer", "narrative-designer", "level-designer", "game-audio-engineer", "technical-artist"],
                        "budget": 5000,
                        "signal": "S=(linguistic, spec, inform, markdown, game-design-document)",
                        "mission": "Game Design & Narrative defines gameplay systems, world-building, and player experience. We are accountable for design document quality, narrative coherence, and playtest-validated fun.",
                    },
                    "unity-studio": {
                        "name": "Unity Studio",
                        "manager": "unity-architect",
                        "members": ["unity-architect", "unity-editor-tool-developer", "unity-multiplayer-engineer", "unity-shader-graph-artist"],
                        "budget": 4000,
                        "signal": "S=(code, spec, commit, csharp, unity-architecture)",
                        "mission": "Unity Studio builds scalable, performant Unity applications. We are accountable for frame rate targets, architecture cleanliness, and multiplayer stability.",
                    },
                    "unreal-studio": {
                        "name": "Unreal Studio",
                        "manager": "unreal-multiplayer-architect",
                        "members": ["unreal-multiplayer-architect", "unreal-systems-engineer", "unreal-technical-artist", "unreal-world-builder"],
                        "budget": 4000,
                        "signal": "S=(code, spec, commit, cpp, unreal-systems-architecture)",
                        "mission": "Unreal Studio builds high-fidelity experiences on Unreal Engine. We are accountable for visual quality, systems performance, and world-building coherence.",
                    },
                    "godot-blender": {
                        "name": "Godot & Blender",
                        "manager": "godot-gameplay-scripter",
                        "members": ["godot-gameplay-scripter", "godot-multiplayer-engineer", "godot-shader-developer", "blender-addon-engineer"],
                        "budget": 3500,
                        "signal": "S=(code, spec, commit, gdscript, godot-gameplay)",
                        "mission": "Godot & Blender develops open-source game and 3D tooling. We are accountable for gameplay feel, shader quality, and tool extensibility.",
                    },
                    "roblox-studio": {
                        "name": "Roblox Studio",
                        "manager": "roblox-experience-designer",
                        "members": ["roblox-experience-designer", "roblox-avatar-creator", "roblox-systems-scripter"],
                        "budget": 3500,
                        "signal": "S=(code, spec, commit, lua, roblox-experience-design)",
                        "mission": "Roblox Studio creates engaging Roblox experiences. We are accountable for player retention, experience quality, and monetization design.",
                    },
                },
            },
            "academic-research": {
                "name": "Academic Research",
                "head": "anthropologist",
                "budget": 5000,
                "signal": "S=(linguistic, report, inform, markdown, research-status)",
                "teams": {
                    "human-cultural-research": {
                        "name": "Human & Cultural Research",
                        "manager": "anthropologist",
                        "members": ["anthropologist", "psychologist", "geographer", "historian", "narratologist"],
                        "budget": 5000,
                        "signal": "S=(linguistic, report, inform, markdown, ethnographic-analysis)",
                        "mission": "Human & Cultural Research provides evidence-based insights on human behavior, cultural dynamics, and historical context. We are accountable for research rigor, citation quality, and actionable interdisciplinary synthesis.",
                    },
                },
            },
        },
    },
    "growth": {
        "name": "Growth",
        "description": "Drives organic and paid acquisition across all channels and markets",
        "budget": 45000,
        "signal": "S=(data, report, inform, markdown, division-status)",
        "departments": {
            "content-social-marketing": {
                "name": "Content & Social Marketing",
                "head": "social-media-strategist",
                "budget": 12000,
                "signal": "S=(linguistic, plan, direct, markdown, marketing-status)",
                "teams": {
                    "social-content": {
                        "name": "Social Content",
                        "manager": "social-media-strategist",
                        "members": ["social-media-strategist", "content-creator", "instagram-curator", "twitter-engager", "linkedin-content-creator"],
                        "budget": 5000,
                        "signal": "S=(linguistic, plan, direct, markdown, social-strategy)",
                        "mission": "Social Content creates and distributes engaging content across social platforms. We are accountable for engagement rates, follower growth, and brand voice consistency.",
                    },
                    "video-audio": {
                        "name": "Video & Audio",
                        "manager": "tiktok-strategist",
                        "members": ["tiktok-strategist", "short-video-editing-coach", "podcast-strategist", "carousel-growth-engine"],
                        "budget": 4000,
                        "signal": "S=(linguistic, plan, direct, markdown, tiktok-strategy)",
                        "mission": "Video & Audio produces short-form video, podcast, and visual carousel content. We are accountable for view completion rates, audio audience growth, and format innovation.",
                    },
                    "community-longform": {
                        "name": "Community & Long-form",
                        "manager": "reddit-community-builder",
                        "members": ["reddit-community-builder", "book-co-author", "app-store-optimizer", "ai-citation-strategist"],
                        "budget": 3000,
                        "signal": "S=(linguistic, brief, direct, markdown, community-playbook)",
                        "mission": "Community & Long-form builds audience through deep content, community engagement, and discovery optimization. We are accountable for organic traffic, community health metrics, and citation visibility.",
                    },
                },
            },
            "seo-discovery": {
                "name": "SEO & Discovery",
                "head": "seo-specialist",
                "budget": 3000,
                "signal": "S=(linguistic, report, inform, markdown, seo-status)",
                "teams": {
                    "search-growth": {
                        "name": "Search & Growth",
                        "manager": "seo-specialist",
                        "members": ["seo-specialist", "growth-hacker"],
                        "budget": 3000,
                        "signal": "S=(linguistic, report, inform, markdown, seo-audit)",
                        "mission": "Search & Growth maximizes organic discovery through technical SEO, growth experiments, and search intent optimization. We are accountable for organic traffic volume, keyword rankings, and experiment velocity.",
                    },
                },
            },
            "china-market": {
                "name": "China Market",
                "head": "wechat-official-account",
                "budget": 10000,
                "signal": "S=(linguistic, plan, direct, markdown, china-market-status)",
                "teams": {
                    "wechat-private-domain": {
                        "name": "WeChat & Private Domain",
                        "manager": "wechat-official-account",
                        "members": ["wechat-official-account", "private-domain-operator", "bilibili-content-strategist", "douyin-strategist"],
                        "budget": 5000,
                        "signal": "S=(linguistic, plan, direct, markdown, wechat-strategy)",
                        "mission": "WeChat & Private Domain builds private traffic pools and content presence on China's core platforms. We are accountable for follower acquisition, private domain conversion, and platform compliance.",
                    },
                    "chinese-platforms": {
                        "name": "Chinese Platforms",
                        "manager": "xiaohongshu-specialist",
                        "members": ["xiaohongshu-specialist", "kuaishou-strategist", "weibo-strategist", "zhihu-strategist", "baidu-seo-specialist", "livestream-commerce-coach"],
                        "budget": 5000,
                        "signal": "S=(linguistic, plan, direct, markdown, xiaohongshu-strategy)",
                        "mission": "Chinese Platforms executes platform-specific strategies across Xiaohongshu, Kuaishou, Weibo, Zhihu, Baidu, and livestream commerce. We are accountable for per-platform GMV, engagement metrics, and localized content quality.",
                    },
                },
            },
            "paid-media": {
                "name": "Paid Media",
                "head": "ppc-strategist",
                "budget": 12000,
                "signal": "S=(data, report, inform, markdown, paid-media-status)",
                "teams": {
                    "ppc-search": {
                        "name": "PPC & Search",
                        "manager": "ppc-strategist",
                        "members": ["ppc-strategist", "search-query-analyst", "programmatic-buyer"],
                        "budget": 4000,
                        "signal": "S=(linguistic, plan, direct, markdown, ppc-strategy)",
                        "mission": "PPC & Search manages search advertising and programmatic buying. We are accountable for ROAS targets, impression share, and budget utilization efficiency.",
                    },
                    "social-ads-creative": {
                        "name": "Social Ads & Creative",
                        "manager": "paid-social-strategist",
                        "members": ["paid-social-strategist", "creative-strategist", "copy-writer", "visual-designer", "format-adapter"],
                        "budget": 5000,
                        "signal": "S=(visual, brief, direct, markdown, creative-brief)",
                        "mission": "Social Ads & Creative produces and optimizes paid social campaigns. We are accountable for creative performance scores, CTR targets, and ad fatigue management.",
                    },
                    "tracking-attribution": {
                        "name": "Tracking & Attribution",
                        "manager": "tracking-specialist",
                        "members": ["tracking-specialist"],
                        "budget": 3000,
                        "signal": "S=(code, spec, commit, markdown, tracking-implementation)",
                        "mission": "Tracking & Attribution ensures accurate measurement across all paid channels. We are accountable for tracking coverage, attribution accuracy, and data integrity.",
                    },
                },
            },
            "paid-media-audit": {
                "name": "Paid Media Audit",
                "head": "auditor",
                "budget": 8000,
                "signal": "S=(data, report, inform, markdown, audit-status)",
                "teams": {
                    "campaign-audit": {
                        "name": "Campaign Audit",
                        "manager": "auditor",
                        "members": ["auditor", "audit-google", "audit-meta", "audit-budget", "audit-compliance", "audit-creative", "audit-tracking"],
                        "budget": 8000,
                        "signal": "S=(data, report, inform, markdown, paid-media-audit)",
                        "mission": "Campaign Audit provides independent assessment of paid media performance, compliance, and spend efficiency. We are accountable for audit thoroughness, finding accuracy, and actionable recommendation quality.",
                    },
                },
            },
        },
    },
    "revenue": {
        "name": "Revenue",
        "description": "Generates and expands revenue through direct sales and enterprise relationships",
        "budget": 25000,
        "signal": "S=(linguistic, report, decide, markdown, division-status)",
        "departments": {
            "sales": {
                "name": "Sales",
                "head": "deal-strategist",
                "budget": 12000,
                "signal": "S=(linguistic, report, decide, markdown, sales-status)",
                "teams": {
                    "outbound-prospecting": {
                        "name": "Outbound & Prospecting",
                        "manager": "outbound-strategist",
                        "members": ["outbound-strategist", "outbound-prospector", "discovery-coach"],
                        "budget": 3000,
                        "signal": "S=(linguistic, brief, direct, markdown, outbound-sequence)",
                        "mission": "Outbound & Prospecting generates qualified pipeline through targeted outreach. We are accountable for meetings booked, response rates, and pipeline generation targets.",
                    },
                    "deal-account": {
                        "name": "Deal & Account",
                        "manager": "deal-strategist",
                        "members": ["deal-strategist", "account-strategist", "proposal-strategist", "proposal-writer"],
                        "budget": 5000,
                        "signal": "S=(linguistic, report, decide, markdown, meddpicc-scorecard)",
                        "mission": "Deal & Account converts qualified pipeline into closed revenue and expands existing accounts. We are accountable for win rate, deal velocity, and net revenue retention.",
                    },
                    "sales-enablement": {
                        "name": "Sales Enablement",
                        "manager": "sales-coach",
                        "members": ["sales-coach", "sales-engineer", "pipeline-analyst"],
                        "budget": 4000,
                        "signal": "S=(linguistic, report, inform, markdown, coaching-framework)",
                        "mission": "Sales Enablement arms the sales organization with tools, training, and technical support. We are accountable for ramp time, rep productivity, and technical win rate.",
                    },
                },
            },
            "enterprise-market-intelligence": {
                "name": "Enterprise & Market Intelligence",
                "head": "salesforce-architect",
                "budget": 13000,
                "signal": "S=(data, report, inform, markdown, enterprise-status)",
                "teams": {
                    "crm-revenue-ops": {
                        "name": "CRM & Revenue Ops",
                        "manager": "salesforce-architect",
                        "members": ["salesforce-architect", "sales-data-extraction-agent", "identity-graph-operator"],
                        "budget": 4000,
                        "signal": "S=(code, spec, commit, markdown, salesforce-architecture)",
                        "mission": "CRM & Revenue Ops maintains the revenue technology stack and data infrastructure. We are accountable for CRM data quality, pipeline visibility, and revenue reporting accuracy.",
                    },
                    "market-intelligence": {
                        "name": "Market Intelligence",
                        "manager": "cultural-intelligence-strategist",
                        "members": ["cultural-intelligence-strategist", "french-consulting-market", "korean-business-navigator", "government-digital-presales-consultant", "cross-border-ecommerce"],
                        "budget": 5000,
                        "signal": "S=(linguistic, report, inform, markdown, cultural-analysis)",
                        "mission": "Market Intelligence provides localized market analysis and go-to-market guidance for international expansion. We are accountable for market sizing accuracy, cultural alignment, and opportunity identification.",
                    },
                    "developer-community-gtm": {
                        "name": "Developer & Community GTM",
                        "manager": "developer-advocate",
                        "members": ["developer-advocate", "supply-chain-strategist", "study-abroad-advisor", "china-ecommerce-operator"],
                        "budget": 4000,
                        "signal": "S=(linguistic, brief, inform, markdown, developer-guide)",
                        "mission": "Developer & Community GTM builds developer adoption and community-driven growth channels. We are accountable for developer engagement, community growth, and partner ecosystem health.",
                    },
                },
            },
        },
    },
    "operations": {
        "name": "Operations",
        "description": "Coordinates delivery, governance, compliance, data operations, and people processes",
        "budget": 30000,
        "signal": "S=(linguistic, report, inform, markdown, division-status)",
        "departments": {
            "project-management": {
                "name": "Project Management",
                "head": "senior-project-manager",
                "budget": 6000,
                "signal": "S=(linguistic, plan, direct, markdown, pm-status)",
                "teams": {
                    "delivery-studio-ops": {
                        "name": "Delivery & Studio Ops",
                        "manager": "senior-project-manager",
                        "members": ["senior-project-manager", "project-shepherd", "studio-producer", "studio-operations", "jira-workflow-steward", "experiment-tracker"],
                        "budget": 6000,
                        "signal": "S=(linguistic, plan, direct, markdown, project-plan)",
                        "mission": "Delivery & Studio Ops ensures projects ship on time with predictable quality. We are accountable for on-time delivery rate, scope management, and workflow efficiency.",
                    },
                },
            },
            "business-operations": {
                "name": "Business Operations",
                "head": "executive-summary-generator",
                "budget": 8000,
                "signal": "S=(data, report, inform, markdown, business-ops-status)",
                "teams": {
                    "executive-intelligence": {
                        "name": "Executive Intelligence",
                        "manager": "executive-summary-generator",
                        "members": ["executive-summary-generator", "executive-summary", "analytics-reporter"],
                        "budget": 3000,
                        "signal": "S=(linguistic, brief, inform, markdown, executive-summary)",
                        "mission": "Executive Intelligence distills operational data into actionable leadership briefs. We are accountable for summary accuracy, insight relevance, and decision support quality.",
                    },
                    "finance-infrastructure": {
                        "name": "Finance & Infrastructure",
                        "manager": "finance-tracker",
                        "members": ["finance-tracker", "infrastructure-maintainer", "accounts-payable-agent"],
                        "budget": 3000,
                        "signal": "S=(data, report, inform, markdown, financial-report)",
                        "mission": "Finance & Infrastructure manages financial tracking and system maintenance. We are accountable for financial accuracy, infrastructure uptime, and cost efficiency.",
                    },
                    "customer-legal-support": {
                        "name": "Customer & Legal Support",
                        "manager": "support-responder",
                        "members": ["support-responder", "legal-compliance-checker"],
                        "budget": 2000,
                        "signal": "S=(linguistic, brief, direct, markdown, support-response)",
                        "mission": "Customer & Legal Support handles external inquiries and legal compliance checks. We are accountable for response time, resolution rate, and compliance accuracy.",
                    },
                },
            },
            "governance-compliance": {
                "name": "Governance & Compliance",
                "head": "automation-governance-architect",
                "budget": 8000,
                "signal": "S=(linguistic, spec, decide, markdown, governance-status)",
                "teams": {
                    "ai-governance": {
                        "name": "AI Governance",
                        "manager": "automation-governance-architect",
                        "members": ["automation-governance-architect", "agents-orchestrator", "agentic-identity-trust", "workflow-architect", "mcp-builder"],
                        "budget": 5000,
                        "signal": "S=(linguistic, spec, decide, markdown, governance-verdict)",
                        "mission": "AI Governance sets and enforces standards for AI agent behavior, identity, and orchestration. We are accountable for governance coverage, compliance rate, and incident prevention.",
                    },
                    "compliance-audit": {
                        "name": "Compliance & Audit",
                        "manager": "compliance-auditor",
                        "members": ["compliance-auditor", "blockchain-security-auditor", "healthcare-marketing-compliance", "zk-steward"],
                        "budget": 3000,
                        "signal": "S=(linguistic, report, inform, markdown, compliance-report)",
                        "mission": "Compliance & Audit ensures regulatory and industry compliance across all operations. We are accountable for audit coverage, finding remediation rate, and zero critical compliance violations.",
                    },
                },
            },
            "data-automation": {
                "name": "Data & Automation",
                "head": "lsp-index-engineer",
                "budget": 5000,
                "signal": "S=(data, report, inform, markdown, data-ops-status)",
                "teams": {
                    "data-operations": {
                        "name": "Data Operations",
                        "manager": "lsp-index-engineer",
                        "members": ["lsp-index-engineer", "data-consolidation-agent", "report-distribution-agent", "document-generator", "model-qa"],
                        "budget": 5000,
                        "signal": "S=(data, report, inform, markdown, data-consolidation)",
                        "mission": "Data Operations processes, consolidates, and distributes organizational data. We are accountable for data freshness, report accuracy, and distribution reliability.",
                    },
                },
            },
            "people-culture": {
                "name": "People & Culture",
                "head": "recruitment-specialist",
                "budget": 3000,
                "signal": "S=(linguistic, report, inform, markdown, people-status)",
                "teams": {
                    "talent-learning": {
                        "name": "Talent & Learning",
                        "manager": "recruitment-specialist",
                        "members": ["recruitment-specialist", "corporate-training-designer"],
                        "budget": 3000,
                        "signal": "S=(linguistic, report, inform, markdown, candidate-assessment)",
                        "mission": "Talent & Learning acquires talent and develops organizational capability. We are accountable for hiring quality, ramp time, and training effectiveness.",
                    },
                },
            },
        },
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# TOOL CASING NORMALIZATION
# ─────────────────────────────────────────────────────────────────────────────

TOOL_NORMALIZE = {
    "Read": "read", "Write": "write", "Edit": "edit", "Bash": "bash",
    "Grep": "grep", "Glob": "glob", "WebFetch": "web-fetch", "WebSearch": "web-search",
    "Search": "search",
    "read": "read", "write": "write", "edit": "edit", "bash": "bash",
    "grep": "grep", "glob": "glob", "web-fetch": "web-fetch", "web-search": "web-search",
    "search": "search",
}

# ─────────────────────────────────────────────────────────────────────────────
# COORDINATION PATTERNS
# ─────────────────────────────────────────────────────────────────────────────

COORDINATION_PATTERNS = {
    "core-architecture": """\
## Pattern: Architecture Decision
**Trigger**: A new system component or cross-team technical decision is required
**Flow**:
1. `software-architect` scopes the decision and drafts an ADR skeleton
2. `backend-architect` and `autonomous-optimization-architect` provide domain input in parallel
3. `data-engineer` and `database-optimizer` validate data layer implications
4. `software-architect` consolidates input, finalizes the ADR, and publishes to the library

## Pattern: Performance Baseline Review
**Trigger**: Monthly or after any major deployment
**Flow**:
1. `database-optimizer` produces query performance report
2. `data-engineer` provides pipeline throughput metrics
3. `software-architect` synthesizes findings into a baseline delta report""",

    "application-development": """\
## Pattern: Feature Implementation
**Trigger**: A task with `type: feature` enters `status: active`
**Flow**:
1. `senior-developer` reviews spec and assigns to `frontend-developer` or `mobile-app-builder`
2. `rapid-prototyper` produces a proof-of-concept if the spec is ambiguous
3. Assigned developer implements; hands off to `code-reviewer` on completion
4. `code-reviewer` returns PASS or FAIL with specific corrections
5. On PASS: `senior-developer` merges and marks task complete

## Pattern: Code Review Cycle
**Trigger**: Any implementation task reaches completion
**Flow**:
1. Developer submits diff and self-review checklist to `code-reviewer`
2. `code-reviewer` evaluates correctness, security, and style
3. PASS -> merge; FAIL -> developer corrects and resubmits (max 3 cycles)""",

    "emerging-tech": """\
## Pattern: Technology Evaluation
**Trigger**: A new technology candidate is identified for potential adoption
**Flow**:
1. `ai-engineer` scopes evaluation criteria and produces an evaluation brief
2. Relevant specialist builds a proof of concept
3. `ai-data-remediation-engineer` assesses data integrity implications
4. `ai-engineer` synthesizes results into a go/no-go recommendation""",

    "platform-integration": """\
## Pattern: New Integration Build
**Trigger**: A platform integration task enters `status: active`
**Flow**:
1. `feishu-integration-developer` produces the integration architecture document
2. `wechat-mini-program-developer` implements platform-side components if applicable
3. `git-workflow-master` sets up version control and CI pipeline
4. `technical-writer` produces integration documentation before the handoff gate

## Pattern: Integration Health Check
**Trigger**: Weekly or after any platform API change notice
**Flow**:
1. `feishu-integration-developer` runs connectivity and contract tests
2. Failures are triaged and assigned within 4 hours""",

    "devops-reliability": """\
## Pattern: Deployment
**Trigger**: A task with `type: deployment` enters `status: active`
**Flow**:
1. `devops-automator` runs pre-deployment checklist and stages the release
2. `sre` validates observability coverage (metrics, alerts, dashboards)
3. `devops-automator` executes deployment; `sre` monitors for 30 minutes post-deploy
4. `incident-response-commander` is on standby; auto-paged on P1 alert

## Pattern: Incident Response
**Trigger**: A P1 or P2 alert fires in production
**Flow**:
1. `incident-response-commander` declares incident and takes command
2. `sre` begins diagnosis; `devops-automator` prepares rollback if needed
3. `incident-response-commander` produces post-mortem within 24 hours""",

    "security-engineering": """\
## Pattern: Threat Assessment
**Trigger**: New feature or system change enters security review queue
**Flow**:
1. `security-engineer` runs threat model against the change surface
2. `threat-detection-engineer` validates that detection rules cover new attack vectors
3. `security-engineer` produces a risk-rated finding report
4. Findings with severity HIGH or CRITICAL block release until remediated""",

    "test-engineering": """\
## Pattern: Test Coverage Gate
**Trigger**: Any implementation task reaches code-complete status
**Flow**:
1. `api-tester` runs the automated test suite and produces a coverage report
2. `performance-benchmarker` runs benchmark suite; flags regressions >5%
3. `accessibility-auditor` validates WCAG compliance for any UI changes
4. `workflow-optimizer` reviews test pipeline efficiency and flags bottlenecks
5. All gates must pass before the task proceeds to deployment""",

    "insights-evidence": """\
## Pattern: Evidence Synthesis
**Trigger**: Test cycle completes or QA sprint closes
**Flow**:
1. `test-results-analyzer` aggregates all test output into a structured evidence package
2. `evidence-collector` audits completeness against the test scenario matrix
3. `reality-checker` validates that reported results match observable system behavior
4. `tool-evaluator` assesses whether current tooling is producing reliable signal
5. `test-results-analyzer` publishes the final evidence report""",

    "product-strategy": """\
## Pattern: Feature Prioritization
**Trigger**: Sprint planning or backlog grooming session
**Flow**:
1. `feedback-synthesizer` compiles user feedback and support signals
2. `trend-researcher` provides market context for candidate features
3. `behavioral-nudge-engine` assesses adoption risk for each candidate
4. `sprint-prioritizer` scores and ranks backlog items using RICE framework
5. `product-manager` finalizes sprint scope and publishes the sprint brief""",

    "xr-immersive": """\
## Pattern: XR Feature Build
**Trigger**: An XR interface task enters `status: active`
**Flow**:
1. `xr-interface-architect` produces interaction design spec and spatial layout
2. `xr-immersive-developer` implements the experience per the spec
3. `xr-cockpit-interaction-specialist` validates cockpit and control mapping
4. `xr-interface-architect` signs off before handoff to platform teams""",

    "apple-platform": """\
## Pattern: Platform Release
**Trigger**: A visionOS or macOS spatial feature reaches implementation-complete
**Flow**:
1. `visionos-spatial-engineer` validates platform compliance and submission requirements
2. `macos-spatial-metal-engineer` confirms Metal pipeline performance targets are met
3. `terminal-integration-specialist` verifies developer tooling and build scripts
4. `visionos-spatial-engineer` prepares App Store submission package""",

    "ux-research": """\
## Pattern: Design Validation
**Trigger**: A UI or interaction design proposal is submitted for review
**Flow**:
1. `ux-researcher` runs usability evaluation (heuristic or user test)
2. `inclusive-visuals-specialist` checks accessibility and visual inclusion standards
3. `ui-designer` refines the design based on findings
4. `ux-architect` issues final design approval or requests another iteration""",

    "visual-brand": """\
## Pattern: Asset Production
**Trigger**: A new campaign, feature, or brand touchpoint requires visual assets
**Flow**:
1. `brand-guardian` issues a brand brief with constraints and guidelines
2. `visual-storyteller` produces narrative-aligned visual concepts
3. `image-prompt-engineer` generates AI-assisted imagery if applicable
4. `whimsy-injector` reviews for creative differentiation and brand personality
5. `brand-guardian` approves final assets for distribution""",

    "game-design-narrative": """\
## Pattern: Game Design Document Review
**Trigger**: A new game system or level is proposed
**Flow**:
1. `game-designer` authors the GDD skeleton
2. `narrative-designer` integrates story and world-building elements
3. `level-designer` validates spatial flow and progression logic
4. `game-audio-engineer` flags audio design requirements
5. `technical-artist` assesses technical art feasibility
6. `game-designer` consolidates feedback and publishes the approved GDD""",

    "unity-studio": """\
## Pattern: Unity Feature Build
**Trigger**: A Unity implementation task enters `status: active`
**Flow**:
1. `unity-architect` reviews the feature spec and produces an architecture note
2. `unity-editor-tool-developer` builds any required custom editor tooling first
3. `unity-multiplayer-engineer` implements network-aware components if applicable
4. `unity-shader-graph-artist` delivers visual shaders per technical art spec
5. `unity-architect` reviews completed build for architecture compliance""",

    "unreal-studio": """\
## Pattern: Unreal Build Cycle
**Trigger**: An Unreal Engine task enters `status: active`
**Flow**:
1. `unreal-multiplayer-architect` produces systems architecture and networking plan
2. `unreal-systems-engineer` implements core gameplay systems
3. `unreal-world-builder` constructs world geometry and layout
4. `unreal-technical-artist` delivers materials, shaders, and visual polish
5. `unreal-multiplayer-architect` validates build against performance targets""",

    "godot-blender": """\
## Pattern: Godot Feature Cycle
**Trigger**: A Godot or Blender task enters `status: active`
**Flow**:
1. `godot-gameplay-scripter` implements core GDScript logic
2. `godot-multiplayer-engineer` integrates networking if applicable
3. `godot-shader-developer` delivers visual shaders
4. `blender-addon-engineer` produces any required Blender pipeline tooling
5. `godot-gameplay-scripter` runs integration test and closes the task""",

    "roblox-studio": """\
## Pattern: Roblox Experience Build
**Trigger**: A Roblox experience task enters `status: active`
**Flow**:
1. `roblox-experience-designer` produces the experience design document
2. `roblox-systems-scripter` implements Lua game logic
3. `roblox-avatar-creator` delivers avatar and cosmetic assets
4. `roblox-experience-designer` runs playtesting and collects retention data before launch""",

    "human-cultural-research": """\
## Pattern: Research Synthesis
**Trigger**: A research request with defined scope enters the queue
**Flow**:
1. `anthropologist` defines the research frame and distributes sub-questions
2. Specialists (`psychologist`, `geographer`, `historian`, `narratologist`) research in parallel
3. Each specialist produces a domain brief within the agreed timeframe
4. `anthropologist` synthesizes all briefs into an interdisciplinary analysis report""",

    "social-content": """\
## Pattern: Content Calendar Execution
**Trigger**: Weekly content calendar is published
**Flow**:
1. `social-media-strategist` assigns content briefs per platform
2. `content-creator` produces copy and creative assets
3. `instagram-curator`, `twitter-engager`, and `linkedin-content-creator` adapt content for their platforms
4. `social-media-strategist` reviews all posts before scheduling and tracks engagement within 48 hours""",

    "video-audio": """\
## Pattern: Video Production Cycle
**Trigger**: A video or podcast brief is approved
**Flow**:
1. `tiktok-strategist` produces the format brief and hook strategy
2. `short-video-editing-coach` guides editing and pacing
3. `podcast-strategist` handles audio-first adaptation if applicable
4. `carousel-growth-engine` produces carousel variant if the content warrants it
5. `tiktok-strategist` reviews final assets before publication""",

    "community-longform": """\
## Pattern: Long-form Content Production
**Trigger**: A long-form content task enters the queue
**Flow**:
1. `reddit-community-builder` assesses community relevance and distribution angle
2. `book-co-author` produces the long-form draft
3. `app-store-optimizer` reviews discoverability keywords if applicable
4. `ai-citation-strategist` ensures content is structured for AI citation and indexing
5. `reddit-community-builder` distributes and monitors community response""",

    "search-growth": """\
## Pattern: SEO Audit Cycle
**Trigger**: Monthly or after any significant content or architecture change
**Flow**:
1. `seo-specialist` runs technical SEO audit and keyword gap analysis
2. `growth-hacker` identifies quick-win growth experiments from audit findings
3. `seo-specialist` produces a prioritized action plan with projected impact
4. Both agents track results against baseline for the next 30 days""",

    "wechat-private-domain": """\
## Pattern: Private Domain Campaign
**Trigger**: A China market campaign brief is approved
**Flow**:
1. `wechat-official-account` publishes anchor content to the Official Account
2. `private-domain-operator` activates distribution through private groups
3. `bilibili-content-strategist` produces long-form video support content
4. `douyin-strategist` creates short-form video amplification
5. `wechat-official-account` reports on funnel metrics within 7 days""",

    "chinese-platforms": """\
## Pattern: Platform-specific Campaign
**Trigger**: A platform-specific brief enters `status: active`
**Flow**:
1. `xiaohongshu-specialist` leads UGC and lifestyle content strategy
2. `kuaishou-strategist` and `weibo-strategist` adapt content for their platforms in parallel
3. `zhihu-strategist` produces thought-leadership content for discovery
4. `baidu-seo-specialist` optimizes for Baidu search placement
5. `livestream-commerce-coach` designs commerce-linked livestream components
6. `xiaohongshu-specialist` consolidates performance data into a unified platform report""",

    "ppc-search": """\
## Pattern: Campaign Optimization Cycle
**Trigger**: Weekly performance review or budget pacing alert
**Flow**:
1. `search-query-analyst` audits search term reports and identifies waste and opportunity
2. `ppc-strategist` adjusts bids, match types, and budget allocation
3. `programmatic-buyer` optimizes display and programmatic placements
4. `ppc-strategist` produces a weekly ROAS summary and forecast""",

    "social-ads-creative": """\
## Pattern: Creative Testing Cycle
**Trigger**: Ad creative fatigue detected or new campaign launches
**Flow**:
1. `creative-strategist` develops testing hypothesis and new creative angles
2. `copy-writer` produces ad copy variants
3. `visual-designer` produces visual variants
4. `format-adapter` adapts assets to all required platform formats
5. `paid-social-strategist` launches A/B test and evaluates results after 7 days""",

    "tracking-attribution": """\
## Pattern: Tracking Implementation
**Trigger**: New campaign, channel, or conversion event requires tracking
**Flow**:
1. `tracking-specialist` documents the tracking requirement and data schema
2. `tracking-specialist` implements tags, events, and attribution parameters
3. `tracking-specialist` validates data parity between platform and analytics within 48 hours of launch""",

    "campaign-audit": """\
## Pattern: Full Account Audit
**Trigger**: Scheduled quarterly audit or new account onboarding
**Flow**:
1. `auditor` scopes the audit and assigns platform workstreams
2. `audit-google`, `audit-meta` conduct platform-specific audits in parallel
3. `audit-budget` reviews spend efficiency and pacing
4. `audit-tracking` validates tracking completeness and attribution accuracy
5. `audit-creative` scores creative quality and fatigue levels
6. `audit-compliance` checks for policy and regulatory violations
7. `auditor` consolidates all findings into a single prioritized audit report""",

    "outbound-prospecting": """\
## Pattern: Outbound Sequence Execution
**Trigger**: A new prospect list is approved for outreach
**Flow**:
1. `outbound-strategist` designs the sequence structure and messaging framework
2. `outbound-prospector` executes personalized outreach at each touch
3. `discovery-coach` guides discovery call preparation for any responses
4. `outbound-strategist` reviews response rates weekly and updates messaging""",

    "deal-account": """\
## Pattern: Deal Pursuit
**Trigger**: A qualified opportunity enters `status: active`
**Flow**:
1. `deal-strategist` produces a MEDDPICC scorecard for the opportunity
2. `account-strategist` maps stakeholders and identifies expansion paths
3. `proposal-strategist` develops the commercial and solution strategy
4. `proposal-writer` produces the formal proposal document
5. `deal-strategist` leads negotiation and issues final close plan""",

    "sales-enablement": """\
## Pattern: Rep Onboarding
**Trigger**: New sales team member joins or completes first week
**Flow**:
1. `sales-coach` produces the onboarding playbook and schedules coaching sessions
2. `sales-engineer` delivers technical product training
3. `pipeline-analyst` provides pipeline health data and key account context
4. `sales-coach` assesses readiness and signs off on solo-selling authorization""",

    "crm-revenue-ops": """\
## Pattern: CRM Data Quality Cycle
**Trigger**: Monthly or after any major deal or pipeline event
**Flow**:
1. `salesforce-architect` runs data quality audit across all pipeline stages
2. `sales-data-extraction-agent` extracts and validates opportunity data
3. `identity-graph-operator` resolves duplicate and mis-attributed records
4. `salesforce-architect` publishes data quality scorecard to revenue leadership""",

    "market-intelligence": """\
## Pattern: Market Entry Assessment
**Trigger**: A new geography or segment is proposed for expansion
**Flow**:
1. `cultural-intelligence-strategist` scopes the market assessment framework
2. Regional specialists produce country briefs in parallel
3. `government-digital-presales-consultant` assesses public sector opportunity
4. `cross-border-ecommerce` evaluates commerce infrastructure requirements
5. `cultural-intelligence-strategist` synthesizes all briefs into a market entry recommendation""",

    "developer-community-gtm": """\
## Pattern: Developer Launch
**Trigger**: A new developer-facing feature or SDK is ready for release
**Flow**:
1. `developer-advocate` produces launch messaging and developer guide
2. `supply-chain-strategist` assesses distribution and partner channel readiness
3. `china-ecommerce-operator` prepares China-specific distribution if applicable
4. `study-abroad-advisor` advises on international academic community angle
5. `developer-advocate` executes launch and monitors community uptake""",

    "delivery-studio-ops": """\
## Pattern: Project Kickoff
**Trigger**: A new project is approved and enters planning
**Flow**:
1. `senior-project-manager` produces the project plan with milestones and owners
2. `studio-producer` sets up production workflows and tools
3. `jira-workflow-steward` configures task tracking and automation rules
4. `studio-operations` allocates resources and resolves scheduling conflicts
5. `project-shepherd` monitors daily progress and surfaces blockers

## Pattern: Sprint Retrospective
**Trigger**: End of each sprint
**Flow**:
1. `experiment-tracker` produces a sprint data summary
2. `senior-project-manager` facilitates retrospective and captures action items
3. Action items are tracked as tasks with owners and due dates""",

    "executive-intelligence": """\
## Pattern: Weekly Leadership Brief
**Trigger**: Every Monday morning
**Flow**:
1. `analytics-reporter` aggregates KPI data from all divisions
2. `executive-summary` drafts the narrative summary
3. `executive-summary-generator` reviews for accuracy, signal strength, and decision relevance
4. Final brief is distributed to leadership within 2 hours of data availability""",

    "finance-infrastructure": """\
## Pattern: Monthly Financial Close
**Trigger**: End of each calendar month
**Flow**:
1. `accounts-payable-agent` reconciles all outstanding invoices and payments
2. `finance-tracker` produces the month-end financial summary with actuals vs. budget
3. `infrastructure-maintainer` provides infrastructure cost breakdown
4. `finance-tracker` publishes the consolidated financial report""",

    "customer-legal-support": """\
## Pattern: Support Request Resolution
**Trigger**: An external support request or legal query arrives
**Flow**:
1. `support-responder` triages and classifies the request within 2 hours
2. If legal implications exist, `legal-compliance-checker` reviews before any response is sent
3. `support-responder` delivers the approved response
4. Unresolved cases are logged for manager review within 24 hours""",

    "ai-governance": """\
## Pattern: Agent Compliance Review
**Trigger**: New agent is proposed for deployment or existing agent is modified
**Flow**:
1. `automation-governance-architect` reviews the agent definition against governance standards
2. `agentic-identity-trust` validates identity and trust model
3. `agents-orchestrator` assesses orchestration compatibility
4. `workflow-architect` checks workflow integration points
5. `mcp-builder` validates tool and MCP configuration
6. `automation-governance-architect` issues a governance verdict (APPROVED / CONDITIONAL / BLOCKED)""",

    "compliance-audit": """\
## Pattern: Compliance Audit Cycle
**Trigger**: Quarterly or triggered by regulatory change
**Flow**:
1. `compliance-auditor` defines audit scope and assigns domain workstreams
2. `blockchain-security-auditor` audits any on-chain contracts or integrations
3. `healthcare-marketing-compliance` reviews health-adjacent marketing materials
4. `zk-steward` validates zero-knowledge proof implementations if applicable
5. `compliance-auditor` consolidates findings and produces the compliance report""",

    "data-operations": """\
## Pattern: Data Consolidation Run
**Trigger**: Daily scheduled run or triggered by source data update
**Flow**:
1. `lsp-index-engineer` validates index integrity and triggers the consolidation pipeline
2. `data-consolidation-agent` ingests and normalizes data from all sources
3. `model-qa` runs quality checks on model outputs within the pipeline
4. `document-generator` produces any required downstream documents
5. `report-distribution-agent` distributes outputs to designated recipients
6. `lsp-index-engineer` logs run status and flags any anomalies""",

    "talent-learning": """\
## Pattern: Talent Acquisition
**Trigger**: An open role is approved for hiring
**Flow**:
1. `recruitment-specialist` produces the role brief and sourcing strategy
2. `recruitment-specialist` screens candidates and produces shortlist with assessments
3. `corporate-training-designer` prepares onboarding curriculum for the role
4. On hire: `corporate-training-designer` executes the onboarding program
5. `recruitment-specialist` reports on time-to-hire and quality metrics""",
}

# ─────────────────────────────────────────────────────────────────────────────
# ESCALATION RULES
# ─────────────────────────────────────────────────────────────────────────────

ESCALATION_RULES = {
    "core-architecture": """\
- ESCALATE TO MANAGER when: An architectural decision has cross-division impact
- ESCALATE TO MANAGER when: Two or more team members hold conflicting architectural positions after one discussion cycle
- ESCALATE OUTSIDE TEAM when: Budget ceiling is within 15% of exhaustion mid-period
- ESCALATE OUTSIDE TEAM when: A proposed architecture change requires deprecating a system owned by another team
- BLOCK AND WAIT FOR HUMAN when: Any change to shared infrastructure schema affects production data""",

    "application-development": """\
- ESCALATE TO MANAGER when: A code review cycle exceeds 3 retries on any single task
- ESCALATE TO MANAGER when: A task has been blocked for more than 24 hours
- ESCALATE OUTSIDE TEAM when: Implementation requires architectural changes outside the team's scope
- ESCALATE OUTSIDE TEAM when: Budget ceiling is within 20% of exhaustion mid-period
- BLOCK AND WAIT FOR HUMAN when: A release targets production and automated test coverage falls below 80%""",

    "emerging-tech": """\
- ESCALATE TO MANAGER when: A proof of concept fails viability assessment and the timeline is at risk
- ESCALATE TO MANAGER when: An evaluated technology has unresolved security implications
- ESCALATE OUTSIDE TEAM when: A technology requires new infrastructure provisioning
- ESCALATE OUTSIDE TEAM when: Smart contract deployment requires external audit
- BLOCK AND WAIT FOR HUMAN when: Any code interacts with financial transactions or on-chain assets""",

    "platform-integration": """\
- ESCALATE TO MANAGER when: A platform API breaks compatibility and no workaround exists
- ESCALATE TO MANAGER when: Integration certification is blocked by a third-party platform
- ESCALATE OUTSIDE TEAM when: API changes require renegotiation of platform partnership terms
- BLOCK AND WAIT FOR HUMAN when: An integration change affects user authentication or data access scope""",

    "devops-reliability": """\
- ESCALATE TO MANAGER when: A production deployment results in an error rate above 1%
- ESCALATE TO MANAGER when: MTTR for any incident exceeds 4 hours
- ESCALATE OUTSIDE TEAM when: A production incident affects external customer SLAs
- ESCALATE OUTSIDE TEAM when: Infrastructure cost variance exceeds 20% month-over-month
- BLOCK AND WAIT FOR HUMAN when: A rollback would cause irreversible data loss""",

    "security-engineering": """\
- ESCALATE TO MANAGER when: A CRITICAL severity finding is not remediated within 24 hours
- ESCALATE TO MANAGER when: Threat detection coverage drops below 90%
- ESCALATE OUTSIDE TEAM when: A confirmed breach or active exploit is detected
- ESCALATE OUTSIDE TEAM when: A finding implicates third-party vendor security practices
- BLOCK AND WAIT FOR HUMAN when: Any response action could impact production system availability""",

    "test-engineering": """\
- ESCALATE TO MANAGER when: Test coverage drops below 75% on any critical path
- ESCALATE TO MANAGER when: Performance regression exceeds 10% on core flows
- ESCALATE OUTSIDE TEAM when: A systematic quality failure implicates upstream design or architecture
- BLOCK AND WAIT FOR HUMAN when: A failing accessibility audit would require delaying a committed release date""",

    "insights-evidence": """\
- ESCALATE TO MANAGER when: Evidence package is incomplete and the release gate is approaching
- ESCALATE TO MANAGER when: Analysis reveals a pattern of recurring defects in a specific subsystem
- ESCALATE OUTSIDE TEAM when: Findings indicate a systemic process failure beyond QA scope
- BLOCK AND WAIT FOR HUMAN when: Evidence conflicts with previously published release notes or external commitments""",

    "product-strategy": """\
- ESCALATE TO MANAGER when: A sprint scope change would exceed the committed delivery date by more than one sprint
- ESCALATE TO MANAGER when: User feedback signals a feature has failed product-market fit post-launch
- ESCALATE OUTSIDE TEAM when: A product decision requires cross-division resource commitment
- BLOCK AND WAIT FOR HUMAN when: A feature scope change affects contractual obligations or partner commitments""",

    "xr-immersive": """\
- ESCALATE TO MANAGER when: Interaction quality fails usability threshold in testing
- ESCALATE TO MANAGER when: Cross-device compatibility issue cannot be resolved within the sprint
- ESCALATE OUTSIDE TEAM when: A spatial design decision requires platform certification review
- BLOCK AND WAIT FOR HUMAN when: Any XR interaction involves user physiological data or safety-critical controls""",

    "apple-platform": """\
- ESCALATE TO MANAGER when: App Store submission is rejected and the resolution path is unclear
- ESCALATE TO MANAGER when: Metal pipeline performance falls below frame rate target after optimization
- ESCALATE OUTSIDE TEAM when: A platform policy change requires architectural redesign
- BLOCK AND WAIT FOR HUMAN when: Any change affects user privacy entitlements or HealthKit integration""",

    "ux-research": """\
- ESCALATE TO MANAGER when: Usability testing reveals a critical flow failure with no clear design resolution
- ESCALATE TO MANAGER when: Accessibility audit identifies WCAG AA violations in a committed release
- ESCALATE OUTSIDE TEAM when: Research findings contradict product strategy assumptions
- BLOCK AND WAIT FOR HUMAN when: A design decision involves collection of new user behavioral data""",

    "visual-brand": """\
- ESCALATE TO MANAGER when: Brand guidelines conflict with a campaign creative direction
- ESCALATE TO MANAGER when: AI-generated imagery presents brand or legal risk
- ESCALATE OUTSIDE TEAM when: A visual identity decision requires executive approval
- BLOCK AND WAIT FOR HUMAN when: Any asset uses third-party IP or licensed imagery""",

    "game-design-narrative": """\
- ESCALATE TO MANAGER when: A GDD conflict between game systems and narrative cannot be resolved within the team
- ESCALATE TO MANAGER when: Playtest data shows core loop fails engagement threshold
- ESCALATE OUTSIDE TEAM when: Narrative content requires legal review (licensed IP, real-world references)
- BLOCK AND WAIT FOR HUMAN when: Any content decision involves sensitive cultural representation""",

    "unity-studio": """\
- ESCALATE TO MANAGER when: Frame rate target is unmet after two optimization cycles
- ESCALATE TO MANAGER when: Multiplayer stability falls below acceptable thresholds in load testing
- ESCALATE OUTSIDE TEAM when: A Unity upgrade breaks game-design-narrative team's asset pipeline
- BLOCK AND WAIT FOR HUMAN when: Any change affects Unity asset store submission or licensing""",

    "unreal-studio": """\
- ESCALATE TO MANAGER when: Visual quality falls below accepted standard after two iteration cycles
- ESCALATE TO MANAGER when: Network architecture cannot support the design-specified player count
- ESCALATE OUTSIDE TEAM when: Unreal Engine upgrade breaks shared asset pipeline dependencies
- BLOCK AND WAIT FOR HUMAN when: Any change involves Epic Games marketplace or licensing obligations""",

    "godot-blender": """\
- ESCALATE TO MANAGER when: A Godot or Blender version conflict blocks the pipeline
- ESCALATE TO MANAGER when: Gameplay feel misses design spec after two playtest iterations
- ESCALATE OUTSIDE TEAM when: An open-source contribution requires legal review
- BLOCK AND WAIT FOR HUMAN when: Any tool change affects other teams' Blender-dependent pipelines""",

    "roblox-studio": """\
- ESCALATE TO MANAGER when: Player retention falls below target in the first 3 sessions
- ESCALATE TO MANAGER when: A Roblox platform policy change requires experience redesign
- ESCALATE OUTSIDE TEAM when: Monetization design requires legal or compliance review
- BLOCK AND WAIT FOR HUMAN when: Any change involves Robux pricing or in-experience purchases""",

    "human-cultural-research": """\
- ESCALATE TO MANAGER when: Research findings are contested between two domain specialists
- ESCALATE TO MANAGER when: A research request requires primary fieldwork beyond available resources
- ESCALATE OUTSIDE TEAM when: Findings have direct implications for product or marketing strategy
- BLOCK AND WAIT FOR HUMAN when: Research involves sensitive cultural communities or requires IRB-equivalent review""",

    "social-content": """\
- ESCALATE TO MANAGER when: Engagement rates fall below platform baseline for two consecutive weeks
- ESCALATE TO MANAGER when: A content piece generates significant negative community response
- ESCALATE OUTSIDE TEAM when: A crisis communication response is needed
- BLOCK AND WAIT FOR HUMAN when: Content touches legally sensitive topics or makes product claims""",

    "video-audio": """\
- ESCALATE TO MANAGER when: View completion rate falls below 40% for two consecutive videos
- ESCALATE TO MANAGER when: Audio production quality falls below brand standard
- ESCALATE OUTSIDE TEAM when: A video requires spokesperson or executive approval
- BLOCK AND WAIT FOR HUMAN when: Any content uses licensed music or third-party footage""",

    "community-longform": """\
- ESCALATE TO MANAGER when: A community discussion escalates into a brand reputation issue
- ESCALATE TO MANAGER when: Long-form content produces below-target organic traffic for 30 days
- ESCALATE OUTSIDE TEAM when: Community feedback reveals a product issue requiring cross-division response
- BLOCK AND WAIT FOR HUMAN when: Content makes specific product performance claims or regulatory representations""",

    "search-growth": """\
- ESCALATE TO MANAGER when: Core keyword rankings drop by more than 20% week-over-week
- ESCALATE TO MANAGER when: A growth experiment produces statistically inconclusive results after 30 days
- ESCALATE OUTSIDE TEAM when: SEO findings reveal a structural technical issue requiring engineering changes
- BLOCK AND WAIT FOR HUMAN when: An SEO change would affect canonical URLs or site architecture""",

    "wechat-private-domain": """\
- ESCALATE TO MANAGER when: WeChat Official Account is flagged or restricted by Tencent
- ESCALATE TO MANAGER when: Private domain conversion rate falls below 5% for two consecutive campaigns
- ESCALATE OUTSIDE TEAM when: Content requires legal review for China regulatory compliance
- BLOCK AND WAIT FOR HUMAN when: Any campaign involves financial promotions or investment-related content""",

    "chinese-platforms": """\
- ESCALATE TO MANAGER when: A platform account is flagged, restricted, or shadowbanned
- ESCALATE TO MANAGER when: GMV target is missed by more than 20% for a campaign
- ESCALATE OUTSIDE TEAM when: Platform policy changes require legal review
- BLOCK AND WAIT FOR HUMAN when: Any content involves sensitive political, social, or regulatory topics in China""",

    "ppc-search": """\
- ESCALATE TO MANAGER when: ROAS falls below the target threshold for two consecutive weeks
- ESCALATE TO MANAGER when: Budget pacing is more than 15% off target mid-period
- ESCALATE OUTSIDE TEAM when: A platform policy violation results in account suspension
- BLOCK AND WAIT FOR HUMAN when: Any bid change would increase daily spend by more than 50%""",

    "social-ads-creative": """\
- ESCALATE TO MANAGER when: All creative variants in an A/B test underperform control after 7 days
- ESCALATE TO MANAGER when: Ad fatigue is detected across all active creative sets simultaneously
- ESCALATE OUTSIDE TEAM when: Creative direction conflicts with brand guidelines from visual-brand team
- BLOCK AND WAIT FOR HUMAN when: Any ad makes health, legal, or financial performance claims""",

    "tracking-attribution": """\
- ESCALATE TO MANAGER when: Tracking data parity falls below 95% between platform and analytics
- ESCALATE TO MANAGER when: A new channel cannot be attributed with acceptable accuracy
- ESCALATE OUTSIDE TEAM when: Tracking implementation requires consent management changes
- BLOCK AND WAIT FOR HUMAN when: Any change affects GDPR or CCPA consent tracking mechanisms""",

    "campaign-audit": """\
- ESCALATE TO MANAGER when: An audit finding reveals budget waste exceeding 15% of monthly spend
- ESCALATE TO MANAGER when: A compliance violation with regulatory risk is found
- ESCALATE OUTSIDE TEAM when: Audit findings require changes to another team's tracking or creative workflow
- BLOCK AND WAIT FOR HUMAN when: Findings involve potential legal liability or financial misrepresentation""",

    "outbound-prospecting": """\
- ESCALATE TO MANAGER when: Response rate falls below 5% after two sequence iterations
- ESCALATE TO MANAGER when: A prospect explicitly requests removal and any team member continues contact
- ESCALATE OUTSIDE TEAM when: Outreach to a target account conflicts with an existing enterprise relationship
- BLOCK AND WAIT FOR HUMAN when: Any message makes specific product performance commitments""",

    "deal-account": """\
- ESCALATE TO MANAGER when: A deal stalls in negotiation for more than 14 days with no movement
- ESCALATE TO MANAGER when: Win probability drops below 30% on a strategic opportunity
- ESCALATE OUTSIDE TEAM when: Closing requires custom contract terms beyond standard template authority
- BLOCK AND WAIT FOR HUMAN when: A deal involves pricing below the approved discount floor""",

    "sales-enablement": """\
- ESCALATE TO MANAGER when: A rep's ramp exceeds 90 days without hitting the productivity threshold
- ESCALATE TO MANAGER when: Technical win rate falls below 60% across the team
- ESCALATE OUTSIDE TEAM when: A product capability gap is consistently losing deals
- BLOCK AND WAIT FOR HUMAN when: Training materials make product claims requiring legal review""",

    "crm-revenue-ops": """\
- ESCALATE TO MANAGER when: CRM data quality score falls below 85%
- ESCALATE TO MANAGER when: Pipeline reporting discrepancy exceeds 10% of total pipeline value
- ESCALATE OUTSIDE TEAM when: A data quality issue originates from a broken integration with another team's system
- BLOCK AND WAIT FOR HUMAN when: Any CRM change affects revenue recognition reporting""",

    "market-intelligence": """\
- ESCALATE TO MANAGER when: Market assessment reveals regulatory barriers that block entry
- ESCALATE TO MANAGER when: Intelligence findings contradict an active go-to-market investment
- ESCALATE OUTSIDE TEAM when: Market entry recommendation requires executive approval
- BLOCK AND WAIT FOR HUMAN when: Intelligence work requires engagement with government or regulatory bodies""",

    "developer-community-gtm": """\
- ESCALATE TO MANAGER when: Developer adoption falls below 50% of launch target at 30 days
- ESCALATE TO MANAGER when: Community sentiment turns negative after a release
- ESCALATE OUTSIDE TEAM when: Partner ecosystem decisions require executive sign-off
- BLOCK AND WAIT FOR HUMAN when: Any GTM commitment involves contractual partner obligations""",

    "delivery-studio-ops": """\
- ESCALATE TO MANAGER when: A project milestone is at risk of slipping by more than one sprint
- ESCALATE TO MANAGER when: Scope creep exceeds 20% of original project estimate
- ESCALATE OUTSIDE TEAM when: Resource constraints require cross-division reallocation
- BLOCK AND WAIT FOR HUMAN when: A delivery commitment has been made to an external partner or client""",

    "executive-intelligence": """\
- ESCALATE TO MANAGER when: A KPI deviation cannot be explained with available data
- ESCALATE TO MANAGER when: Leadership brief data conflicts with another authoritative source
- ESCALATE OUTSIDE TEAM when: Analysis reveals a cross-division performance issue requiring executive intervention
- BLOCK AND WAIT FOR HUMAN when: A brief contains forward-looking financial projections for external use""",

    "finance-infrastructure": """\
- ESCALATE TO MANAGER when: Actual spend deviates from budget by more than 10% in any period
- ESCALATE TO MANAGER when: An infrastructure cost anomaly cannot be explained within 48 hours
- ESCALATE OUTSIDE TEAM when: Budget variance requires executive approval to resolve
- BLOCK AND WAIT FOR HUMAN when: Any financial transaction or commitment exceeds approved authority limits""",

    "customer-legal-support": """\
- ESCALATE TO MANAGER when: A support case cannot be resolved within 48 hours
- ESCALATE TO MANAGER when: A legal query involves potential litigation risk
- ESCALATE OUTSIDE TEAM when: A compliance issue implicates product, engineering, or finance
- BLOCK AND WAIT FOR HUMAN when: Any response constitutes legal advice or creates a binding commitment""",

    "ai-governance": """\
- ESCALATE TO MANAGER when: An agent deployment fails governance review and the deploying team disputes the verdict
- ESCALATE TO MANAGER when: A governance standard conflicts with operational requirements
- ESCALATE OUTSIDE TEAM when: An agent incident requires cross-division investigation
- BLOCK AND WAIT FOR HUMAN when: Any governance decision would disable a production agent handling live user requests""",

    "compliance-audit": """\
- ESCALATE TO MANAGER when: A critical compliance finding has not been remediated within the agreed timeline
- ESCALATE TO MANAGER when: A new regulation requires immediate policy changes
- ESCALATE OUTSIDE TEAM when: A compliance finding implicates executive decision-making
- BLOCK AND WAIT FOR HUMAN when: Any finding could trigger regulatory reporting obligations""",

    "data-operations": """\
- ESCALATE TO MANAGER when: A data pipeline failure causes downstream report delivery to miss SLA
- ESCALATE TO MANAGER when: Data quality check failure rate exceeds 5% of total records
- ESCALATE OUTSIDE TEAM when: A data source failure originates in another team's system
- BLOCK AND WAIT FOR HUMAN when: Any pipeline change affects personally identifiable information (PII) handling""",

    "talent-learning": """\
- ESCALATE TO MANAGER when: A hiring process exceeds 60 days without a qualified candidate
- ESCALATE TO MANAGER when: Training completion rate falls below 80% for a required program
- ESCALATE OUTSIDE TEAM when: A talent gap requires emergency cross-division resource sharing
- BLOCK AND WAIT FOR HUMAN when: Any hiring or termination decision requires HR policy review""",
}

# ─────────────────────────────────────────────────────────────────────────────
# HANDOFF PROTOCOLS
# ─────────────────────────────────────────────────────────────────────────────

HANDOFF_PROTOCOLS = {
    "core-architecture": """\
## software-architect -> backend-architect
**Trigger**: Architecture Decision Record is drafted and ready for domain review
**Required artifacts**: ADR draft, list of affected systems, open questions
**Format**: `S=(linguistic, spec, decide, markdown, adr-template)`
**Gate**: backend-architect confirms all affected backend systems are accounted for

## any-member -> software-architect (escalation)
**Trigger**: Any escalation condition is met
**Required artifacts**: Description of the blocker, what was attempted, recommended path forward
**Format**: `S=(linguistic, brief, direct, markdown, escalation-brief)`
**Gate**: software-architect must acknowledge within 2 hours""",

    "application-development": """\
## senior-developer -> code-reviewer
**Trigger**: Implementation is complete and self-review checklist is done
**Required artifacts**: Implementation diff, test results, self-review checklist
**Format**: `S=(code, spec, commit, markdown, review-request)`
**Gate**: code-reviewer confirms test suite is green before beginning review

## code-reviewer -> senior-developer
**Trigger**: Review cycle completes with PASS or FAIL verdict
**Required artifacts**: Review summary with line-level feedback, PASS/FAIL verdict
**Format**: `S=(data, report, decide, markdown, review-summary)`
**Gate**: senior-developer acknowledges all FAIL items before resubmitting""",

    "emerging-tech": """\
## ai-engineer -> core-architecture team
**Trigger**: Technology evaluation produces a go recommendation
**Required artifacts**: Evaluation report, proof-of-concept code, integration requirements
**Format**: `S=(linguistic, spec, inform, markdown, tech-evaluation)`
**Gate**: core-architecture team confirms integration scope is feasible before adoption commitment""",

    "platform-integration": """\
## feishu-integration-developer -> technical-writer
**Trigger**: Integration build is complete and passing contract tests
**Required artifacts**: API reference, authentication flow diagram, error code reference
**Format**: `S=(linguistic, spec, inform, markdown, integration-guide)`
**Gate**: technical-writer confirms documentation covers all public integration surfaces""",

    "devops-reliability": """\
## devops-automator -> sre
**Trigger**: Deployment is staged and ready for production
**Required artifacts**: Deployment checklist, change log, rollback plan
**Format**: `S=(data, report, inform, yaml, deployment-manifest)`
**Gate**: sre confirms observability coverage before deployment proceeds

## incident-response-commander -> devops-automator
**Trigger**: Incident declared and triage complete
**Required artifacts**: Incident brief, affected systems list, severity classification
**Format**: `S=(linguistic, brief, direct, markdown, incident-brief)`
**Gate**: devops-automator confirms rollback readiness before any remediation action""",

    "security-engineering": """\
## threat-detection-engineer -> security-engineer
**Trigger**: A new threat signal or detection gap is identified
**Required artifacts**: Threat signal description, affected systems, detection coverage analysis
**Format**: `S=(data, report, inform, markdown, threat-signal)`
**Gate**: security-engineer confirms the signal is actionable before creating a finding""",

    "test-engineering": """\
## api-tester -> performance-benchmarker
**Trigger**: Functional test suite passes and performance validation is needed
**Required artifacts**: Test pass report, list of performance-critical paths
**Format**: `S=(data, report, inform, markdown, test-pass-summary)`
**Gate**: performance-benchmarker confirms baseline metrics exist for all critical paths

## test-engineering -> deployment pipeline (gate)
**Trigger**: All quality gates pass
**Required artifacts**: Coverage report, benchmark results, accessibility audit, workflow analysis
**Format**: `S=(data, report, decide, markdown, qa-gate-summary)`
**Gate**: All four gate checks must be GREEN; any RED blocks deployment""",

    "insights-evidence": """\
## test-results-analyzer -> evidence-collector
**Trigger**: Raw test output is aggregated and ready for completeness check
**Required artifacts**: Aggregated test data, scenario coverage matrix
**Format**: `S=(data, report, inform, markdown, evidence-package)`
**Gate**: evidence-collector confirms all defined test scenarios have a result before proceeding""",

    "product-strategy": """\
## feedback-synthesizer -> sprint-prioritizer
**Trigger**: Feedback synthesis is complete ahead of sprint planning
**Required artifacts**: Synthesized feedback report, top user pain points, feature requests ranked by frequency
**Format**: `S=(linguistic, brief, inform, markdown, feedback-synthesis)`
**Gate**: sprint-prioritizer confirms feedback data covers the last full cycle before scoring""",

    "xr-immersive": """\
## xr-interface-architect -> xr-immersive-developer
**Trigger**: Interaction design spec is approved
**Required artifacts**: Interaction design spec, spatial layout diagram, accepted device matrix
**Format**: `S=(linguistic, spec, direct, markdown, xr-design-spec)`
**Gate**: xr-immersive-developer confirms spec has sufficient detail to begin implementation""",

    "apple-platform": """\
## visionos-spatial-engineer -> macos-spatial-metal-engineer
**Trigger**: visionOS layer is complete and macOS spatial alignment is needed
**Required artifacts**: visionOS implementation summary, shared asset list, performance targets
**Format**: `S=(code, spec, commit, swift, platform-handoff)`
**Gate**: macos-spatial-metal-engineer confirms Metal pipeline compatibility before proceeding""",

    "ux-research": """\
## ux-researcher -> ui-designer
**Trigger**: Usability research cycle is complete and validated
**Required artifacts**: Research findings report, prioritized design recommendations
**Format**: `S=(linguistic, report, inform, markdown, ux-findings)`
**Gate**: ui-designer confirms all critical findings are addressed in the next iteration

## ui-designer -> ux-architect
**Trigger**: Design iteration is complete and ready for final approval
**Required artifacts**: Updated design files, changelog vs. previous iteration
**Format**: `S=(visual, spec, decide, markdown, design-iteration)`
**Gate**: ux-architect checks all research recommendations are addressed before approving""",

    "visual-brand": """\
## brand-guardian -> visual-storyteller
**Trigger**: Brand brief is published for a new campaign or touchpoint
**Required artifacts**: Brand brief, visual constraints, target audience profile
**Format**: `S=(visual, brief, direct, markdown, brand-brief)`
**Gate**: visual-storyteller confirms brief has sufficient direction before beginning concept work""",

    "game-design-narrative": """\
## game-designer -> narrative-designer
**Trigger**: Core game system design is approved and narrative integration is needed
**Required artifacts**: GDD core systems section, world-building constraints
**Format**: `S=(linguistic, spec, inform, markdown, gdd-systems)`
**Gate**: narrative-designer confirms narrative can integrate without breaking mechanical constraints

## game-design-narrative -> implementation teams
**Trigger**: GDD is fully approved and implementation is ready to begin
**Required artifacts**: Approved GDD, asset list, technical constraints
**Format**: `S=(linguistic, spec, decide, markdown, approved-gdd)`
**Gate**: Receiving team confirms scope is implementable within sprint capacity""",

    "unity-studio": """\
## unity-architect -> unity-editor-tool-developer
**Trigger**: Feature requires custom editor tooling before implementation begins
**Required artifacts**: Architecture note, required editor tool specification
**Format**: `S=(code, spec, commit, csharp, tool-spec)`
**Gate**: unity-editor-tool-developer confirms tool specification is complete before building""",

    "unreal-studio": """\
## unreal-multiplayer-architect -> unreal-systems-engineer
**Trigger**: Network architecture is approved and systems implementation begins
**Required artifacts**: Network architecture document, session management spec
**Format**: `S=(code, spec, commit, cpp, network-architecture)`
**Gate**: unreal-systems-engineer confirms architecture is implementable before starting""",

    "godot-blender": """\
## godot-gameplay-scripter -> godot-shader-developer
**Trigger**: Gameplay logic is complete and visual layer implementation is needed
**Required artifacts**: Completed gameplay scripts, shader requirements specification
**Format**: `S=(code, spec, commit, gdscript, gameplay-complete)`
**Gate**: godot-shader-developer confirms shader requirements are specific enough to implement""",

    "roblox-studio": """\
## roblox-experience-designer -> roblox-systems-scripter
**Trigger**: Experience design document is approved
**Required artifacts**: Experience design document, Lua scripting requirements
**Format**: `S=(linguistic, spec, inform, markdown, experience-design-doc)`
**Gate**: roblox-systems-scripter confirms all scripting requirements are implementable in Roblox""",

    "human-cultural-research": """\
## anthropologist -> domain specialists
**Trigger**: Research request is scoped and sub-questions are defined
**Required artifacts**: Research brief with scope, timeline, and output format expectations
**Format**: `S=(linguistic, brief, direct, markdown, research-brief)`
**Gate**: Each specialist confirms they can answer their assigned sub-questions within the timeline

## domain specialists -> anthropologist
**Trigger**: Individual domain brief is complete
**Required artifacts**: Domain brief with citations and key findings
**Format**: `S=(linguistic, report, inform, markdown, domain-brief)`
**Gate**: anthropologist checks citation quality before incorporating into synthesis""",

    "social-content": """\
## social-media-strategist -> content-creator
**Trigger**: Content calendar is published and content briefs are assigned
**Required artifacts**: Content brief with platform, topic, format, tone, and deadline
**Format**: `S=(linguistic, brief, direct, markdown, content-brief)`
**Gate**: content-creator confirms brief is actionable before beginning production""",

    "video-audio": """\
## tiktok-strategist -> short-video-editing-coach
**Trigger**: Video concept is approved and editing guidance is needed
**Required artifacts**: Video brief, hook strategy, raw footage or script
**Format**: `S=(linguistic, brief, direct, markdown, video-brief)`
**Gate**: short-video-editing-coach confirms editing plan before post-production begins""",

    "community-longform": """\
## reddit-community-builder -> book-co-author
**Trigger**: Long-form content topic is validated against community interest signals
**Required artifacts**: Community interest report, topic brief, target keywords
**Format**: `S=(linguistic, brief, direct, markdown, longform-brief)`
**Gate**: book-co-author confirms topic scope is achievable within the production timeline""",

    "search-growth": """\
## seo-specialist -> growth-hacker
**Trigger**: SEO audit is complete and experiment candidates are identified
**Required artifacts**: SEO audit report, prioritized experiment list
**Format**: `S=(linguistic, report, inform, markdown, seo-audit)`
**Gate**: growth-hacker confirms experiment hypotheses are testable and metrics are defined""",

    "wechat-private-domain": """\
## wechat-official-account -> private-domain-operator
**Trigger**: Official Account post is published and private domain amplification begins
**Required artifacts**: Published post link, distribution brief, target audience segments
**Format**: `S=(linguistic, brief, direct, markdown, distribution-brief)`
**Gate**: private-domain-operator confirms distribution list is current and compliant before sending""",

    "chinese-platforms": """\
## xiaohongshu-specialist -> platform specialists
**Trigger**: Campaign brief is approved and platform-specific adaptation begins
**Required artifacts**: Campaign brief, creative assets, platform-specific requirements
**Format**: `S=(linguistic, brief, direct, markdown, campaign-brief)`
**Gate**: Each specialist confirms platform compliance before publishing""",

    "ppc-search": """\
## search-query-analyst -> ppc-strategist
**Trigger**: Weekly search term audit is complete
**Required artifacts**: Search term report with waste analysis and opportunity flags
**Format**: `S=(data, report, inform, markdown, search-term-audit)`
**Gate**: ppc-strategist confirms recommended changes before implementing""",

    "social-ads-creative": """\
## creative-strategist -> copy-writer and visual-designer
**Trigger**: Creative test hypothesis is approved
**Required artifacts**: Creative brief, test hypothesis, audience targeting spec
**Format**: `S=(visual, brief, direct, markdown, creative-brief)`
**Gate**: Both copy-writer and visual-designer confirm brief is sufficient before beginning production""",

    "tracking-attribution": """\
## tracking-specialist -> paid-media teams (gate)
**Trigger**: New tracking implementation is complete and validated
**Required artifacts**: Tracking spec, validation report, data parity confirmation
**Format**: `S=(code, spec, commit, markdown, tracking-validation)`
**Gate**: Receiving team confirms data is flowing correctly before launching campaigns""",

    "campaign-audit": """\
## auditor -> platform auditors
**Trigger**: Audit scope is defined and workstreams are assigned
**Required artifacts**: Audit scope document, platform access confirmation
**Format**: `S=(linguistic, brief, direct, markdown, audit-brief)`
**Gate**: Each platform auditor confirms access and scope before beginning

## platform auditors -> auditor
**Trigger**: Platform-specific audit is complete
**Required artifacts**: Platform audit report with findings, severity ratings, and recommendations
**Format**: `S=(data, report, inform, markdown, platform-audit)`
**Gate**: auditor reviews for completeness before consolidating""",

    "outbound-prospecting": """\
## outbound-prospector -> discovery-coach
**Trigger**: A prospect responds positively and a discovery call is scheduled
**Required artifacts**: Prospect profile, conversation history, identified pain points
**Format**: `S=(linguistic, brief, inform, markdown, prospect-brief)`
**Gate**: discovery-coach confirms call preparation is complete before the meeting""",

    "deal-account": """\
## deal-strategist -> proposal-writer
**Trigger**: MEDDPICC scorecard reaches qualification threshold and proposal is approved
**Required artifacts**: MEDDPICC scorecard, solution scope, commercial parameters
**Format**: `S=(linguistic, spec, decide, markdown, meddpicc-scorecard)`
**Gate**: proposal-writer confirms all required inputs are present before drafting""",

    "sales-enablement": """\
## sales-coach -> sales-engineer
**Trigger**: A rep requires technical product training or deal support
**Required artifacts**: Rep profile, deal context, specific technical questions
**Format**: `S=(linguistic, brief, direct, markdown, enablement-request)`
**Gate**: sales-engineer confirms availability and scope before scheduling""",

    "crm-revenue-ops": """\
## sales-data-extraction-agent -> identity-graph-operator
**Trigger**: Data extraction is complete and deduplication is required
**Required artifacts**: Extracted data set, known duplicate signals, matching criteria
**Format**: `S=(data, report, inform, markdown, extraction-report)`
**Gate**: identity-graph-operator confirms matching criteria before running deduplication""",

    "market-intelligence": """\
## regional specialists -> cultural-intelligence-strategist
**Trigger**: Country brief is complete
**Required artifacts**: Country brief with market sizing, competitive landscape, and cultural considerations
**Format**: `S=(linguistic, report, inform, markdown, country-brief)`
**Gate**: cultural-intelligence-strategist confirms brief addresses all synthesis dimensions before accepting""",

    "developer-community-gtm": """\
## developer-advocate -> supply-chain-strategist
**Trigger**: Developer launch plan is approved and distribution channels are being confirmed
**Required artifacts**: Launch plan, developer guide, distribution requirements
**Format**: `S=(linguistic, brief, inform, markdown, launch-plan)`
**Gate**: supply-chain-strategist confirms distribution channel availability before launch date is locked""",

    "delivery-studio-ops": """\
## senior-project-manager -> studio-producer
**Trigger**: Project plan is approved and production setup is needed
**Required artifacts**: Approved project plan, resource list, tool requirements
**Format**: `S=(linguistic, plan, direct, markdown, project-plan)`
**Gate**: studio-producer confirms production environment is ready before team kickoff

## project-shepherd -> senior-project-manager
**Trigger**: A daily blocker or risk is identified
**Required artifacts**: Blocker description, impact assessment, proposed resolution
**Format**: `S=(linguistic, brief, direct, markdown, daily-status)`
**Gate**: senior-project-manager acknowledges and assigns resolution ownership within 2 hours""",

    "executive-intelligence": """\
## analytics-reporter -> executive-summary
**Trigger**: KPI data is aggregated and validated
**Required artifacts**: KPI data package, variance explanations, period comparison
**Format**: `S=(data, report, inform, markdown, kpi-package)`
**Gate**: executive-summary confirms all required metrics are present before drafting

## executive-summary -> executive-summary-generator
**Trigger**: Narrative draft is complete
**Required artifacts**: Draft brief with all supporting data references
**Format**: `S=(linguistic, brief, inform, markdown, brief-draft)`
**Gate**: executive-summary-generator checks accuracy and signal strength before publishing""",

    "finance-infrastructure": """\
## accounts-payable-agent -> finance-tracker
**Trigger**: Monthly payment cycle is complete
**Required artifacts**: Reconciled payment log, outstanding invoice list
**Format**: `S=(data, report, inform, markdown, ap-reconciliation)`
**Gate**: finance-tracker confirms all transactions are categorized before producing the monthly report""",

    "customer-legal-support": """\
## support-responder -> legal-compliance-checker
**Trigger**: A support case contains legal implications or compliance risk
**Required artifacts**: Case summary, proposed response draft, risk flags
**Format**: `S=(linguistic, brief, direct, markdown, legal-review-request)`
**Gate**: legal-compliance-checker confirms the response is legally sound before it is sent""",

    "ai-governance": """\
## agents-orchestrator -> automation-governance-architect
**Trigger**: Orchestration configuration change is proposed
**Required artifacts**: Proposed change description, affected agents, risk assessment
**Format**: `S=(linguistic, spec, decide, markdown, governance-review-request)`
**Gate**: automation-governance-architect issues a governance verdict before any change is applied

## automation-governance-architect -> deploying team
**Trigger**: Governance review is complete
**Required artifacts**: Governance verdict (APPROVED / CONDITIONAL / BLOCKED), conditions if applicable
**Format**: `S=(linguistic, spec, decide, markdown, governance-verdict)`
**Gate**: Deploying team acknowledges all conditions before proceeding""",

    "compliance-audit": """\
## domain auditors -> compliance-auditor
**Trigger**: Domain audit workstream is complete
**Required artifacts**: Domain audit report with findings, severity ratings, and remediation recommendations
**Format**: `S=(linguistic, report, inform, markdown, domain-compliance-report)`
**Gate**: compliance-auditor confirms all audit criteria are addressed before consolidating""",

    "data-operations": """\
## data-consolidation-agent -> model-qa
**Trigger**: Data consolidation run is complete and model outputs need validation
**Required artifacts**: Consolidated data set, expected output schema, quality thresholds
**Format**: `S=(data, report, inform, markdown, consolidation-output)`
**Gate**: model-qa confirms quality thresholds are met before downstream distribution proceeds

## model-qa -> report-distribution-agent
**Trigger**: Quality checks pass
**Required artifacts**: QA report, validated output set, distribution list
**Format**: `S=(data, report, decide, markdown, qa-clearance)`
**Gate**: report-distribution-agent confirms distribution list is current before sending""",

    "talent-learning": """\
## recruitment-specialist -> corporate-training-designer
**Trigger**: Hire is confirmed and onboarding preparation begins
**Required artifacts**: New hire profile, role description, start date, required certifications
**Format**: `S=(linguistic, brief, direct, markdown, onboarding-brief)`
**Gate**: corporate-training-designer confirms onboarding curriculum is ready before the start date""",
}

# ─────────────────────────────────────────────────────────────────────────────
# DIVISION BODY CONTENT
# ─────────────────────────────────────────────────────────────────────────────

DIVISION_BODY = {
    "technology": {
        "mission": "Technology exists to build, maintain, and assure every technical system that powers the organization. We are accountable for system reliability, engineering quality, product delivery, and technical security. We measure success by uptime, deployment frequency, defect rate, and architectural coherence.",
        "operating_model": "Technology operates as five coordinated departments: Software Engineering owns the application and platform layer; Platform & Infrastructure owns deployment, reliability, and security; Quality Assurance validates all system behavior before release; Product translates user needs into engineering priorities; and Spatial Computing builds immersive experiences on XR and Apple platforms.",
        "cross_dept": "- Software Engineering and Platform & Infrastructure coordinate on every deployment: SE produces the release candidate; P&I validates infrastructure readiness and executes deployment\n- Quality Assurance gates all releases from Software Engineering and Spatial Computing before they reach production\n- Product feeds prioritized requirements to Software Engineering and Spatial Computing\n- Spatial Computing consults Platform & Infrastructure for any XR backend services or cloud infrastructure needs",
        "escalation": "- ESCALATE TO DIVISION HEAD when: A cross-department conflict cannot be resolved at the department level within 48 hours\n- ESCALATE TO DIVISION HEAD when: A production incident affects more than one department's systems simultaneously\n- ESCALATE OUTSIDE DIVISION when: A technical decision requires budget approval above division authority\n- ESCALATE OUTSIDE DIVISION when: A security incident has potential external or regulatory impact\n- BLOCK AND WAIT FOR HUMAN when: Any irreversible action affects production data or external customer commitments",
    },
    "creative-content": {
        "mission": "Creative & Content exists to create visual, narrative, and experiential content across all media. We are accountable for brand coherence, content quality, and creative differentiation. We measure success by audience engagement, brand consistency scores, and the quality of shipped creative work.",
        "operating_model": "Creative & Content operates as three departments: Design owns user experience, visual identity, and brand standards; Game Development builds interactive experiences across Unity, Unreal, Godot, and Roblox; and Academic Research provides the human, cultural, and narrative intelligence that grounds all creative work in reality.",
        "cross_dept": "- Design provides UX and visual standards that all Game Development teams must follow for any player-facing UI\n- Academic Research informs narrative and world-building decisions in Game Development through research briefs\n- Game Design & Narrative initiates cross-department research requests to Academic Research\n- Design reviews all final visual assets from Game Development before external release",
        "escalation": "- ESCALATE TO DIVISION HEAD when: Brand standards conflict with a creative direction from Game Development\n- ESCALATE TO DIVISION HEAD when: Academic Research findings require significant revision of a committed creative direction\n- ESCALATE OUTSIDE DIVISION when: Any creative work involves licensed IP, legal review, or external partnership approval\n- BLOCK AND WAIT FOR HUMAN when: Any content involves sensitive cultural representation or makes real-world factual claims",
    },
    "growth": {
        "mission": "Growth exists to drive organic and paid acquisition across all channels and markets. We are accountable for pipeline volume, customer acquisition cost, and channel-level ROI. We measure success by qualified leads generated, organic traffic growth, and paid media ROAS.",
        "operating_model": "Growth operates as five departments: Content & Social Marketing owns organic social, video, audio, and community channels; SEO & Discovery owns search optimization and growth experimentation; China Market specializes in all China-specific platforms and private domain strategy; Paid Media executes paid search, social advertising, and tracking; and Paid Media Audit provides independent quality assurance across all paid channels.",
        "cross_dept": "- Content & Social Marketing and Paid Media coordinate on creative assets: organic content is evaluated for paid amplification potential before each campaign\n- SEO & Discovery informs Content & Social Marketing on topic prioritization based on search intent data\n- China Market operates semi-independently but coordinates with Paid Media on any China-specific paid campaigns\n- Paid Media Audit has independent access to all paid media accounts and reports directly to the division head",
        "escalation": "- ESCALATE TO DIVISION HEAD when: A channel's performance falls below acceptable threshold for two consecutive months\n- ESCALATE TO DIVISION HEAD when: Paid Media Audit surfaces a material compliance or budget waste finding\n- ESCALATE OUTSIDE DIVISION when: A platform account suspension requires executive intervention\n- BLOCK AND WAIT FOR HUMAN when: Any campaign or content piece carries legal, regulatory, or reputational risk",
    },
    "revenue": {
        "mission": "Revenue exists to generate and expand revenue through direct sales and enterprise relationships. We are accountable for new revenue generation, net revenue retention, and pipeline health. We measure success by ARR growth, win rate, and average contract value.",
        "operating_model": "Revenue operates as two departments: Sales owns the full sales cycle from outbound prospecting through deal close and enablement; Enterprise & Market Intelligence owns CRM, revenue operations, international market intelligence, and developer community go-to-market. Both departments share pipeline visibility through the CRM & Revenue Ops team.",
        "cross_dept": "- Sales and Enterprise & Market Intelligence share pipeline data through the CRM; all opportunity data is maintained in Salesforce by CRM & Revenue Ops\n- Market Intelligence provides Sales with localized competitive and cultural context for international opportunities\n- Developer & Community GTM generates inbound pipeline that Sales qualifies through the standard prospecting process\n- Sales enablement content is reviewed by Market Intelligence for accuracy on international deals",
        "escalation": "- ESCALATE TO DIVISION HEAD when: Pipeline coverage falls below 3x of quarterly target\n- ESCALATE TO DIVISION HEAD when: A strategic deal is at risk of loss and requires executive involvement\n- ESCALATE OUTSIDE DIVISION when: A deal requires custom commercial terms beyond standard authority\n- BLOCK AND WAIT FOR HUMAN when: Any commitment involves pricing below the approved floor or creates a legal obligation",
    },
    "operations": {
        "mission": "Operations exists to coordinate delivery, governance, compliance, data operations, and people processes. We are accountable for operational efficiency, organizational compliance, and the infrastructure that keeps every other division functioning. We measure success by on-time delivery rate, compliance coverage, and data reliability.",
        "operating_model": "Operations runs five departments: Project Management owns delivery and studio workflows; Business Operations provides executive intelligence, financial tracking, and support; Governance & Compliance sets and enforces AI governance and regulatory compliance standards; Data & Automation processes and distributes organizational data; and People & Culture manages talent acquisition and organizational learning.",
        "cross_dept": "- Project Management coordinates with every division on active project timelines; critical path changes escalate to the division head\n- Governance & Compliance reviews all AI agent deployments across the organization before they go live\n- Data & Automation serves all divisions with data consolidation and report distribution\n- Business Operations produces the weekly leadership brief that synthesizes data from all divisions\n- People & Culture coordinates cross-division hiring and onboarding",
        "escalation": "- ESCALATE TO DIVISION HEAD when: A cross-division operational conflict cannot be resolved at the department level\n- ESCALATE TO DIVISION HEAD when: Governance & Compliance issues a BLOCKED verdict on a high-priority deployment\n- ESCALATE OUTSIDE DIVISION when: A compliance finding has regulatory or legal implications requiring executive response\n- BLOCK AND WAIT FOR HUMAN when: Any process change affects organization-wide data governance or agent authorization",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def log(msg, verbose, force=False):
    if verbose or force:
        print(msg)


def derive_role(name):
    words = name.strip().split()
    if not words:
        return "agent"
    return words[-1].lower()


def normalize_tools(raw_tools):
    raw = raw_tools.strip()
    if raw.startswith("[") and raw.endswith("]"):
        raw = raw[1:-1]
    items = [t.strip().strip('"').strip("'") for t in raw.split(",") if t.strip()]
    normalized = []
    for item in items:
        n = TOOL_NORMALIZE.get(item)
        if n is None:
            n = item.lower().replace("websearch", "web-search").replace("webfetch", "web-fetch")
        normalized.append(n)
    return normalized


def parse_frontmatter(content):
    lines = content.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, content

    fm_lines = []
    end_idx = -1
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = i
            break
        fm_lines.append(line)

    if end_idx == -1:
        return {}, content

    body = "\n".join(lines[end_idx + 1:])
    fm = {}
    current_key = None
    current_val_lines = []

    def flush():
        if current_key is not None:
            fm[current_key] = "\n".join(current_val_lines).strip()

    for line in fm_lines:
        if not line.startswith(" ") and not line.startswith("\t") and ":" in line:
            flush()
            key, _, val = line.partition(":")
            current_key = key.strip()
            current_val_lines = [val.strip()]
        else:
            if current_key:
                current_val_lines.append(line)

    flush()
    return fm, body


def build_frontmatter_str(fm):
    lines = ["---"]
    for key, val in fm.items():
        if val == "" or val is None:
            lines.append(f"{key}:")
        else:
            lines.append(f"{key}: {val}")
    lines.append("---")
    return "\n".join(lines)


def scan_agents(agents_root):
    mapping = {}
    for p in Path(agents_root).rglob("*.md"):
        mapping[p.stem] = p
    return mapping


def members_list_str(members):
    return "[" + ", ".join(members) + "]"


# ─────────────────────────────────────────────────────────────────────────────
# FILE BUILDERS
# ─────────────────────────────────────────────────────────────────────────────

def build_team_file(team_id, team, dept_id, div_id):
    members_yaml = members_list_str(team["members"])
    coord = COORDINATION_PATTERNS.get(team_id, f"""\
## Pattern: Standard Workflow
**Trigger**: A task enters `status: active`
**Flow**:
1. `{team["manager"]}` reviews and assigns the task
2. Assigned member implements and hands off to manager on completion
3. Manager reviews and approves or returns with corrections""")

    esc = ESCALATION_RULES.get(team_id, """\
- ESCALATE TO MANAGER when: A task is blocked for more than 24 hours with no resolution path
- ESCALATE TO MANAGER when: Quality does not meet acceptance criteria after two iteration cycles
- ESCALATE OUTSIDE TEAM when: Budget ceiling is within 20% of exhaustion mid-period
- BLOCK AND WAIT FOR HUMAN when: Any irreversible action requires authorization above team authority""")

    handoff = HANDOFF_PROTOCOLS.get(team_id, f"""\
## member -> {team["manager"]}
**Trigger**: Task implementation is complete
**Required artifacts**: Completed work product, self-review checklist
**Format**: Team signal format
**Gate**: `{team["manager"]}` confirms all acceptance criteria are met before closing the task""")

    return f"""---
name: {team["name"]}
id: {team_id}
department: {dept_id}
division: {div_id}
manager: {team["manager"]}
members: {members_yaml}
budget: {team["budget"]}
signal: {team["signal"]}
---

# Mission

{team["mission"]}

# Coordination Patterns

{coord}

# Escalation Rules

{esc}

# Handoff Protocols

{handoff}
"""


def build_department_file(dept_id, dept, div_id):
    teams_list = "[" + ", ".join(dept["teams"].keys()) + "]"
    team_summaries = "\n".join(
        f"- **{t['name']}** (`{tid}`): {t['mission'].split('.')[0]}."
        for tid, t in dept["teams"].items()
    )
    return f"""---
name: {dept["name"]}
id: {dept_id}
division: {div_id}
head: {dept["head"]}
teams: {teams_list}
budget: {dept["budget"]}
signal: {dept["signal"]}
---

# Mission

{dept["name"]} is accountable for delivering the full scope of its teams' missions within the {div_id.replace("-", " ").title()} division. The department head coordinates resource allocation, cross-team dependencies, and escalation handling.

# Teams Overview

{team_summaries}

# Cross-Team Coordination

- All teams within {dept["name"]} share a common budget envelope managed by `{dept["head"]}`
- Cross-team dependencies are surfaced in weekly department syncs; blockers are resolved within 48 hours
- Any decision that affects more than one team's scope requires department head sign-off before proceeding
- Teams hand off work through explicit artifact packages as defined in each team's Handoff Protocols section

# Escalation Rules

- ESCALATE TO DEPARTMENT HEAD when: A cross-team conflict cannot be resolved at the team level
- ESCALATE TO DEPARTMENT HEAD when: A team's budget is within 15% of exhaustion before period end
- ESCALATE OUTSIDE DEPARTMENT when: A decision requires division-level resource reallocation
- ESCALATE OUTSIDE DEPARTMENT when: A team deliverable has cross-division implications
- BLOCK AND WAIT FOR HUMAN when: Any action commits the department to external obligations without executive approval
"""


def build_division_file(div_id, div):
    dept_ids = list(div["departments"].keys())
    first_dept = list(div["departments"].values())[0]
    head = first_dept["head"]
    depts_list = "[" + ", ".join(dept_ids) + "]"
    body = DIVISION_BODY[div_id]

    return f"""---
name: {div["name"]}
id: {div_id}
description: {div["description"]}
head: {head}
departments: {depts_list}
budget: {div["budget"]}
signal: {div["signal"]}
---

# Mission

{body["mission"]}

# Operating Model

{body["operating_model"]}

# Cross-Department Coordination

{body["cross_dept"]}

# Escalation Rules

{body["escalation"]}
"""


def normalize_agent(agent_path, agent_id, team_id, dept_id, div_id, manager, dry_run, verbose):
    content = agent_path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(content)

    if not fm:
        log(f"  [WARN] Could not parse frontmatter: {agent_path}", verbose=True, force=True)
        return []

    changes = []

    if "id" not in fm:
        fm["id"] = agent_id
        changes.append(f"add id={agent_id}")

    if "role" not in fm:
        name = fm.get("name", agent_id)
        role = derive_role(name)
        fm["role"] = role
        changes.append(f"add role={role}")

    if "title" not in fm:
        fm["title"] = fm.get("name", agent_id)
        changes.append(f"add title={fm['title']}")

    if "context_tier" not in fm:
        fm["context_tier"] = "l1"
        changes.append("add context_tier=l1")

    if "tools" not in fm:
        fm["tools"] = "[]"
        changes.append("add tools=[]")
    else:
        raw = fm["tools"]
        normalized = normalize_tools(raw)
        new_val = "[" + ", ".join(normalized) + "]"
        if new_val != raw:
            fm["tools"] = new_val
            changes.append(f"normalize tools")

    # reportsTo: point non-managers to their manager
    if agent_id != manager:
        current = fm.get("reportsTo", "")
        if current != manager:
            fm["reportsTo"] = manager
            changes.append(f"update reportsTo={manager}")

    if fm.get("team") != team_id:
        fm["team"] = team_id
        changes.append(f"set team={team_id}")

    if fm.get("department") != dept_id:
        fm["department"] = dept_id
        changes.append(f"set department={dept_id}")

    if fm.get("division") != div_id:
        fm["division"] = div_id
        changes.append(f"set division={div_id}")

    if changes and not dry_run:
        new_content = build_frontmatter_str(fm) + "\n" + body
        agent_path.write_text(new_content, encoding="utf-8")

    return changes


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Canopy organizational hierarchy files")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be created without writing")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    dry_run = args.dry_run
    verbose = args.verbose

    if dry_run:
        print("[DRY RUN] No files will be written.\n")

    script_dir = Path(__file__).parent.resolve()
    repo_root = script_dir.parent
    library_root = repo_root / "library"
    agents_root = library_root / "agents"
    divisions_root = library_root / "divisions"
    departments_root = library_root / "departments"
    teams_root = library_root / "teams"

    agent_map = scan_agents(agents_root)
    log(f"Scanned {len(agent_map)} agent files under {agents_root}", verbose, force=True)

    # Build agent -> (team, dept, div, manager) mapping
    agent_assignments = {}
    for div_id, div in HIERARCHY.items():
        for dept_id, dept in div["departments"].items():
            for team_id, team in dept["teams"].items():
                for member in team["members"]:
                    agent_assignments[member] = (team_id, dept_id, div_id, team["manager"])

    # Verify
    missing_agents = [a for a in agent_assignments if a not in agent_map]
    if missing_agents:
        print(f"\n[WARN] {len(missing_agents)} agent(s) in HIERARCHY not found in library/agents/:")
        for a in sorted(missing_agents):
            print(f"  - {a}")

    unassigned = [a for a in agent_map if a not in agent_assignments]
    if unassigned:
        print(f"\n[INFO] {len(unassigned)} agent(s) not assigned to any team:")
        for a in sorted(unassigned):
            print(f"  - {a}")

    divisions_created = departments_created = teams_created = agents_modified = 0

    # ── Divisions
    print("\n=== Generating Divisions ===")
    if not dry_run:
        divisions_root.mkdir(parents=True, exist_ok=True)
    for div_id, div in HIERARCHY.items():
        path = divisions_root / f"{div_id}.md"
        content = build_division_file(div_id, div)
        if dry_run:
            log(f"  [DRY-RUN] Would write: {path}", verbose, force=True)
        else:
            path.write_text(content, encoding="utf-8")
            log(f"  Created: {path}", verbose)
        divisions_created += 1

    # ── Departments
    print("\n=== Generating Departments ===")
    for div_id, div in HIERARCHY.items():
        dept_dir = departments_root / div_id
        if not dry_run:
            dept_dir.mkdir(parents=True, exist_ok=True)
        for dept_id, dept in div["departments"].items():
            path = dept_dir / f"{dept_id}.md"
            content = build_department_file(dept_id, dept, div_id)
            if dry_run:
                log(f"  [DRY-RUN] Would write: {path}", verbose, force=True)
            else:
                path.write_text(content, encoding="utf-8")
                log(f"  Created: {path}", verbose)
            departments_created += 1

    # ── Teams
    print("\n=== Generating Teams ===")
    for div_id, div in HIERARCHY.items():
        for dept_id, dept in div["departments"].items():
            team_dir = teams_root / dept_id
            if not dry_run:
                team_dir.mkdir(parents=True, exist_ok=True)
            for team_id, team in dept["teams"].items():
                path = team_dir / f"{team_id}.md"
                content = build_team_file(team_id, team, dept_id, div_id)
                if dry_run:
                    log(f"  [DRY-RUN] Would write: {path}", verbose, force=True)
                else:
                    path.write_text(content, encoding="utf-8")
                    log(f"  Created: {path}", verbose)
                teams_created += 1

    # ── Agent frontmatter normalization
    print("\n=== Normalizing Agent Frontmatter ===")
    for agent_id, (team_id, dept_id, div_id, manager) in agent_assignments.items():
        if agent_id not in agent_map:
            continue
        agent_path = agent_map[agent_id]
        changes = normalize_agent(
            agent_path=agent_path,
            agent_id=agent_id,
            team_id=team_id,
            dept_id=dept_id,
            div_id=div_id,
            manager=manager,
            dry_run=dry_run,
            verbose=verbose,
        )
        if changes:
            agents_modified += 1
            action = "[DRY-RUN]" if dry_run else "Updated"
            log(f"  {action} {agent_id}: {', '.join(changes)}", verbose, force=dry_run)

    # ── Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"  Divisions created   : {divisions_created}")
    print(f"  Departments created : {departments_created}")
    print(f"  Teams created       : {teams_created}")
    print(f"  Agents modified     : {agents_modified}")
    print(f"  Missing agents      : {len(missing_agents)}")
    print(f"  Unassigned agents   : {len(unassigned)}")
    if dry_run:
        print("\n  [DRY RUN] No files were written.")
    else:
        print("\n  All files written successfully.")


if __name__ == "__main__":
    main()

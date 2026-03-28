#!/usr/bin/env python3
"""
Differentiate generic S=(linguistic, spec, inform, markdown, structured) signals
into agent-specific signal encodings based on role, category, and capabilities.

Each agent's signal field should encode its PRIMARY output pattern:
  S=(Mode, Genre, Type, Format, Structure)
"""

import re
import sys
import yaml
from pathlib import Path

AGENTS_DIR = Path("/Users/rhl/Desktop/MIOSA/code/canopy/library/agents")
GENERIC_SIGNAL = 'S=(linguistic, spec, inform, markdown, structured)'

# ── Signal Mappings by Agent ID/Name ────────────────────────────────────────
# Hand-crafted for each agent based on what they actually produce.
# Format: agent_filename (without .md) -> "S=(M, G, T, F, W)"

SIGNAL_MAP = {
    # ── Academic ──
    "anthropologist": "S=(linguistic, report, inform, markdown, ethnographic-analysis)",
    "geographer": "S=(linguistic, report, inform, markdown, spatial-analysis)",
    "historian": "S=(linguistic, report, inform, markdown, historical-analysis)",
    "narratologist": "S=(linguistic, report, inform, markdown, narrative-analysis)",
    "psychologist": "S=(linguistic, report, inform, markdown, behavioral-analysis)",

    # ── Design ──
    "brand-guardian": "S=(linguistic, report, decide, markdown, brand-audit)",
    "image-prompt-engineer": "S=(linguistic, spec, direct, markdown, prompt-template)",
    "inclusive-visuals-specialist": "S=(visual, report, inform, markdown, accessibility-audit)",
    "ui-designer": "S=(visual, spec, direct, markdown, ui-specification)",
    "ux-architect": "S=(linguistic, spec, commit, markdown, ux-architecture)",
    "ux-researcher": "S=(linguistic, report, inform, markdown, research-findings)",
    "visual-storyteller": "S=(visual, brief, direct, markdown, visual-narrative)",
    "whimsy-injector": "S=(linguistic, brief, express, markdown, creative-direction)",

    # ── Engineering ──
    "ai-data-remediation-engineer": "S=(code, spec, commit, markdown, remediation-plan)",
    "autonomous-optimization-architect": "S=(code, spec, commit, markdown, optimization-architecture)",
    "data-engineer": "S=(code, spec, commit, sql, data-pipeline)",
    "devops-automator": "S=(code, spec, commit, yaml, infrastructure-config)",
    "embedded-firmware-engineer": "S=(code, spec, commit, c, firmware-architecture)",
    "feishu-integration-developer": "S=(code, spec, commit, typescript, integration-architecture)",
    "frontend-developer": "S=(code, spec, commit, typescript, component-architecture)",
    "git-workflow-master": "S=(linguistic, spec, direct, markdown, git-workflow)",
    "incident-response-commander": "S=(linguistic, report, direct, markdown, incident-report)",
    "mobile-app-builder": "S=(code, spec, commit, typescript, mobile-architecture)",
    "rapid-prototyper": "S=(code, spec, commit, markdown, prototype-spec)",
    "senior-developer": "S=(code, spec, commit, markdown, implementation-plan)",
    "solidity-smart-contract-engineer": "S=(code, spec, commit, solidity, contract-architecture)",
    "threat-detection-engineer": "S=(data, report, inform, markdown, threat-detection-rules)",
    "wechat-mini-program-developer": "S=(code, spec, commit, typescript, miniprogram-architecture)",

    # ── Game Development ──
    "game-audio-engineer": "S=(code, spec, commit, markdown, audio-system-design)",
    "game-designer": "S=(linguistic, spec, inform, markdown, game-design-document)",
    "level-designer": "S=(linguistic, spec, direct, markdown, level-design-document)",
    "narrative-designer": "S=(linguistic, spec, inform, markdown, narrative-design)",
    "technical-artist": "S=(code, spec, commit, markdown, shader-pipeline)",

    # ── Marketing ──
    "ai-citation-strategist": "S=(linguistic, plan, direct, markdown, citation-strategy)",
    "app-store-optimizer": "S=(linguistic, report, inform, markdown, aso-analysis)",
    "baidu-seo-specialist": "S=(linguistic, plan, direct, markdown, seo-strategy)",
    "bilibili-content-strategist": "S=(linguistic, plan, direct, markdown, content-calendar)",
    "book-co-author": "S=(linguistic, spec, commit, markdown, manuscript-draft)",
    "carousel-growth-engine": "S=(visual, spec, direct, markdown, carousel-template)",
    "china-ecommerce-operator": "S=(linguistic, plan, direct, markdown, ecommerce-strategy)",
    "cross-border-ecommerce": "S=(linguistic, plan, direct, markdown, cross-border-strategy)",
    "douyin-strategist": "S=(linguistic, plan, direct, markdown, short-video-strategy)",
    "instagram-curator": "S=(visual, plan, direct, markdown, content-calendar)",
    "kuaishou-strategist": "S=(linguistic, plan, direct, markdown, short-video-strategy)",
    "linkedin-content-creator": "S=(linguistic, brief, direct, markdown, linkedin-post)",
    "livestream-commerce-coach": "S=(linguistic, plan, direct, markdown, livestream-playbook)",
    "podcast-strategist": "S=(linguistic, plan, direct, markdown, podcast-strategy)",
    "private-domain-operator": "S=(linguistic, plan, direct, markdown, community-strategy)",
    "reddit-community-builder": "S=(linguistic, brief, direct, markdown, community-playbook)",
    "seo-specialist": "S=(linguistic, report, inform, markdown, seo-audit)",
    "short-video-editing-coach": "S=(linguistic, spec, direct, markdown, editing-guide)",
    "tiktok-strategist": "S=(linguistic, plan, direct, markdown, tiktok-strategy)",
    "twitter-engager": "S=(linguistic, brief, direct, markdown, tweet-strategy)",
    "wechat-official-account": "S=(linguistic, plan, direct, markdown, wechat-strategy)",
    "weibo-strategist": "S=(linguistic, plan, direct, markdown, weibo-strategy)",
    "xiaohongshu-specialist": "S=(linguistic, plan, direct, markdown, xiaohongshu-strategy)",
    "zhihu-strategist": "S=(linguistic, plan, direct, markdown, zhihu-strategy)",

    # ── Paid Media ──
    "audit-budget": "S=(data, report, inform, markdown, budget-audit)",
    "audit-compliance": "S=(linguistic, report, inform, markdown, compliance-audit)",
    "audit-creative": "S=(visual, report, inform, markdown, creative-audit)",
    "audit-google": "S=(data, report, inform, markdown, google-ads-audit)",
    "audit-meta": "S=(data, report, inform, markdown, meta-ads-audit)",
    "audit-tracking": "S=(data, report, inform, markdown, tracking-audit)",
    "auditor": "S=(data, report, inform, markdown, paid-media-audit)",
    "copy-writer": "S=(linguistic, brief, direct, markdown, ad-copy)",
    "creative-strategist": "S=(visual, brief, direct, markdown, creative-brief)",
    "format-adapter": "S=(linguistic, spec, direct, markdown, format-specification)",
    "paid-social-strategist": "S=(linguistic, plan, direct, markdown, social-ads-strategy)",
    "ppc-strategist": "S=(linguistic, plan, direct, markdown, ppc-strategy)",
    "programmatic-buyer": "S=(data, plan, direct, markdown, programmatic-plan)",
    "search-query-analyst": "S=(data, report, inform, markdown, search-query-analysis)",
    "tracking-specialist": "S=(code, spec, commit, markdown, tracking-implementation)",
    "visual-designer": "S=(visual, spec, direct, markdown, ad-design-spec)",

    # ── Product ──
    "behavioral-nudge-engine": "S=(linguistic, spec, direct, markdown, nudge-framework)",
    "product-manager": "S=(linguistic, spec, decide, markdown, product-requirement)",

    # ── Project Management ──
    "experiment-tracker": "S=(data, report, inform, markdown, experiment-results)",
    "jira-workflow-steward": "S=(linguistic, spec, direct, markdown, workflow-configuration)",
    "project-shepherd": "S=(linguistic, report, inform, markdown, project-status)",
    "senior-project-manager": "S=(linguistic, plan, direct, markdown, project-plan)",
    "studio-operations": "S=(linguistic, report, inform, markdown, operations-dashboard)",
    "studio-producer": "S=(linguistic, plan, direct, markdown, production-schedule)",

    # ── Sales ──
    "sales-coach": "S=(linguistic, report, inform, markdown, coaching-framework)",
    "sales-engineer": "S=(mixed, spec, inform, markdown, technical-validation)",

    # ── Spatial Computing ──
    "macos-spatial-metal-engineer": "S=(code, spec, commit, swift, metal-pipeline)",
    "terminal-integration-specialist": "S=(code, spec, commit, swift, terminal-integration)",
    "visionos-spatial-engineer": "S=(code, spec, commit, swift, spatial-architecture)",
    "xr-cockpit-interaction-specialist": "S=(code, spec, commit, swift, xr-interaction-design)",
    "xr-immersive-developer": "S=(code, spec, commit, swift, xr-architecture)",
    "xr-interface-architect": "S=(code, spec, commit, swift, xr-interface-design)",

    # ── Specialized ──
    "accounts-payable-agent": "S=(data, report, inform, markdown, ap-reconciliation)",
    "agentic-identity-trust": "S=(linguistic, spec, commit, markdown, identity-architecture)",
    "agents-orchestrator": "S=(linguistic, plan, direct, markdown, orchestration-plan)",
    "automation-governance-architect": "S=(linguistic, spec, decide, markdown, governance-verdict)",
    "blockchain-security-auditor": "S=(code, report, inform, markdown, security-audit)",
    "compliance-auditor": "S=(linguistic, report, inform, markdown, compliance-report)",
    "corporate-training-designer": "S=(linguistic, spec, direct, markdown, training-curriculum)",
    "cultural-intelligence-strategist": "S=(linguistic, report, inform, markdown, cultural-analysis)",
    "data-consolidation-agent": "S=(data, report, inform, markdown, data-consolidation)",
    "developer-advocate": "S=(linguistic, brief, inform, markdown, developer-guide)",
    "document-generator": "S=(linguistic, spec, commit, markdown, document-template)",
    "french-consulting-market": "S=(linguistic, report, inform, markdown, market-analysis)",
    "government-digital-presales-consultant": "S=(linguistic, proposal, direct, markdown, government-proposal)",
    "healthcare-marketing-compliance": "S=(linguistic, report, inform, markdown, compliance-review)",
    "identity-graph-operator": "S=(data, spec, commit, markdown, identity-graph)",
    "korean-business-navigator": "S=(linguistic, report, inform, markdown, market-analysis)",
    "lsp-index-engineer": "S=(code, spec, commit, typescript, lsp-architecture)",
    "mcp-builder": "S=(code, spec, commit, typescript, mcp-server)",
    "model-qa": "S=(data, report, inform, markdown, model-evaluation)",
    "recruitment-specialist": "S=(linguistic, report, inform, markdown, candidate-assessment)",
    "report-distribution-agent": "S=(linguistic, plan, direct, markdown, distribution-schedule)",
    "sales-data-extraction-agent": "S=(data, report, inform, markdown, sales-extraction)",
    "salesforce-architect": "S=(code, spec, commit, markdown, salesforce-architecture)",
    "study-abroad-advisor": "S=(linguistic, plan, inform, markdown, study-plan)",
    "supply-chain-strategist": "S=(data, plan, direct, markdown, supply-chain-plan)",
    "workflow-architect": "S=(linguistic, spec, commit, markdown, workflow-architecture)",
    "zk-steward": "S=(linguistic, spec, commit, markdown, knowledge-graph)",

    # ── Support ──
    "analytics-reporter": "S=(data, report, inform, markdown, analytics-dashboard)",
    "executive-summary-generator": "S=(linguistic, brief, inform, markdown, executive-summary)",
    "executive-summary": "S=(linguistic, brief, inform, markdown, executive-summary)",
    "finance-tracker": "S=(data, report, inform, markdown, financial-report)",
    "infrastructure-maintainer": "S=(code, report, inform, markdown, infrastructure-status)",
    "legal-compliance-checker": "S=(linguistic, report, inform, markdown, legal-review)",
    "support-responder": "S=(linguistic, brief, direct, markdown, support-response)",

    # ── Testing ──
    "accessibility-auditor": "S=(linguistic, report, inform, markdown, accessibility-audit)",
    "api-tester": "S=(data, report, inform, markdown, test-results)",
    "evidence-collector": "S=(data, report, inform, markdown, evidence-report)",
    "performance-benchmarker": "S=(data, report, inform, markdown, benchmark-results)",
    "reality-checker": "S=(linguistic, report, decide, markdown, validation-report)",
    "test-results-analyzer": "S=(data, report, inform, markdown, test-analysis)",
    "tool-evaluator": "S=(linguistic, report, decide, markdown, tool-evaluation)",
    "workflow-optimizer": "S=(linguistic, spec, direct, markdown, workflow-optimization)",
}


def process_file(filepath, dry_run=False):
    """Update a single agent's signal field."""
    stem = filepath.stem  # filename without .md

    if stem not in SIGNAL_MAP:
        return "skip", "no mapping"

    content = filepath.read_text()

    # Check if it has the generic signal
    if GENERIC_SIGNAL not in content:
        return "skip", "not generic"

    new_signal = SIGNAL_MAP[stem]
    new_content = content.replace(
        f'signal: "{GENERIC_SIGNAL}"',
        f'signal: "{new_signal}"'
    ).replace(
        f'signal: {GENERIC_SIGNAL}',
        f'signal: {new_signal}'
    )

    if new_content == content:
        return "skip", "no change"

    # Also update the Signal Network Transmits line if present
    # Parse old and new signal for transmit descriptions
    old_transmit = "text-based spec signals (informational) in markdown format using structured structure"
    new_sig = parse_signal(new_signal)
    if new_sig:
        new_transmit = describe_transmit(new_sig)
        new_content = new_content.replace(old_transmit, new_transmit)

    # Also update the SNF line's transmit description
    old_snf_transmit = "transmits text-based spec signals (informational) in markdown format using structured structure"
    if new_sig:
        new_snf_transmit = f"transmits {new_transmit}"
        new_content = new_content.replace(old_snf_transmit, new_snf_transmit)

    # Update "Primary transcoding: domain input → spec output"
    if new_sig and new_sig["genre"] != "spec":
        new_content = new_content.replace(
            "Primary transcoding: domain input → spec output",
            f"Primary transcoding: domain input → {new_sig['genre']} output"
        )

    if not dry_run:
        filepath.write_text(new_content)

    return "updated", new_signal


def parse_signal(signal_str):
    match = re.search(r'S=\(([^)]+)\)', signal_str or "")
    if not match:
        return None
    parts = [p.strip() for p in match.group(1).split(",")]
    if len(parts) != 5:
        return None
    return {"mode": parts[0], "genre": parts[1], "type": parts[2], "format": parts[3], "structure": parts[4]}


def describe_transmit(sig):
    if not sig:
        return "linguistic signals in markdown format"
    mode_desc = {"linguistic": "text-based", "code": "code-based", "data": "data-structured", "visual": "visual", "mixed": "multimodal"}
    type_desc = {"inform": "informational", "direct": "directive (action-compelling)", "commit": "commitment (delivery promises)", "decide": "decision-oriented", "express": "perspective-sharing"}
    m = mode_desc.get(sig["mode"], sig["mode"])
    t = type_desc.get(sig["type"], sig["type"])
    return f"{m} {sig['genre']} signals ({t}) in {sig['format']} format using {sig['structure']} structure"


def main():
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv or "-v" in sys.argv

    if dry_run:
        print("=== DRY RUN ===\n")

    stats = {"updated": 0, "skipped": 0, "errors": 0}

    for agent_file in sorted(AGENTS_DIR.rglob("*.md")):
        relative = agent_file.relative_to(AGENTS_DIR)
        try:
            status, detail = process_file(agent_file, dry_run)
            if status == "updated":
                stats["updated"] += 1
                if verbose:
                    print(f"  + {relative} → {detail}")
            elif verbose:
                print(f"  . {relative} ({detail})")
        except Exception as e:
            stats["errors"] += 1
            print(f"  X {relative}: {e}")

    print(f"\n{'DRY RUN ' if dry_run else ''}Results:")
    print(f"  Updated: {stats['updated']}")
    print(f"  Skipped: {stats['skipped']}")
    print(f"  Errors:  {stats['errors']}")


if __name__ == "__main__":
    main()

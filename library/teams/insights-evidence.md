---
name: "Insights & Evidence"
id: insights-evidence
manager: test-results-analyzer
members:
  - test-results-analyzer
  - evidence-collector
  - reality-checker
  - tool-evaluator
budget: 2000
signal: S=(data, report, inform, markdown, evidence-digest)
---

## Mission

Analyzes test results, collects production evidence, and provides reality-checked quality assessments. Ensures shipping decisions are based on data, not assumptions.

## Coordination Patterns

Test Results Analyzer synthesizes raw test data into actionable reports. Evidence Collector gathers production metrics and user-reported issues. Reality Checker validates claims against evidence. Tool Evaluator assesses testing tools and methodologies for team adoption.

## Escalation Rules

- Quality assessments contradicting engineering confidence escalate to department head for resolution.
- Production evidence indicating unreported defects escalates to Test Engineering and engineering teams immediately.
- Tool evaluation recommending major infrastructure change requires department head approval.

## Handoff Protocols

- **Inbound**: Receives raw test results from Test Engineering and production metrics from DevOps & Reliability.
- **Outbound**: Publishes quality reports and shipping recommendations to department head and Product Strategy.

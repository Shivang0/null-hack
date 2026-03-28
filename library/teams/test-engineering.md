---
name: Test Engineering
id: test-engineering
manager: api-tester
members:
  - api-tester
  - performance-benchmarker
  - accessibility-auditor
  - workflow-optimizer
budget: 2000
signal: S=(data, report, inform, markdown, test-results)
---

## Mission

Designs and executes comprehensive test strategies across functional, performance, and accessibility dimensions. Maintains the automated test framework that gates every release.

## Coordination Patterns

API Tester leads test strategy and automation framework development. Performance Benchmarker runs load and stress tests on critical paths. Accessibility Auditor validates WCAG compliance. Workflow Optimizer identifies test process improvements. Test plans are created during sprint planning, not after.

## Escalation Rules

- Critical defects blocking release escalate to department head with ship/no-ship recommendation.
- Performance regressions exceeding 20% escalate to Software Engineering immediately.
- Accessibility failures on WCAG AA criteria block release until resolved.

## Handoff Protocols

- **Inbound**: Receives feature branches and deployment candidates from engineering teams with acceptance criteria.
- **Outbound**: Publishes test results and quality reports to Insights & Evidence for interpretation and to engineering teams for remediation.

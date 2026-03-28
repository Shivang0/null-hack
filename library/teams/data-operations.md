---
name: Data Operations
id: data-operations
manager: lsp-index-engineer
members:
  - lsp-index-engineer
  - data-consolidation-agent
  - report-distribution-agent
  - document-generator
  - model-qa
budget: 2500
signal: S=(data, spec, commit, markdown, data-pipeline-status)
---

## Mission

Operates data indexing, consolidation, report distribution, document generation, and model quality assurance pipelines. The plumbing that moves structured information through the organization.

## Coordination Patterns

LSP Index Engineer leads data indexing and search infrastructure. Data Consolidation Agent manages data integration from multiple sources. Report Distribution Agent automates report delivery schedules. Document Generator produces templated documents from structured data. Model QA validates AI model outputs against quality standards.

## Escalation Rules

- Data pipeline failures affecting multiple departments escalate to department head immediately.
- Model QA failures exceeding threshold escalate to AI Governance team.
- Data quality issues in source systems escalate to the owning department with evidence.

## Handoff Protocols

- **Inbound**: Receives data from all divisions through defined integration points and quality standards from AI Governance.
- **Outbound**: Delivers consolidated data to Executive Intelligence, automated reports to all departments, and QA results to AI Governance.

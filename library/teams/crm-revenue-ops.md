---
name: "CRM & Revenue Ops"
id: crm-revenue-ops
manager: salesforce-architect
members:
  - salesforce-architect
  - sales-data-extraction-agent
  - identity-graph-operator
budget: 2000
signal: S=(data, report, inform, markdown, revenue-ops-metrics)
---

## Mission

Maintains the Salesforce architecture, sales data extraction pipelines, and identity graph that serve as the single source of truth for all revenue operations.

## Coordination Patterns

Salesforce Architect owns CRM architecture and data model. Sales Data Extraction Agent builds and maintains data pipelines from CRM to analytics. Identity Graph Operator manages entity resolution and customer identity across systems.

## Escalation Rules

- CRM data integrity issues escalate to team manager immediately.
- Salesforce architecture changes affecting multiple teams require department head approval.
- Identity graph accuracy issues escalate with impact assessment.

## Handoff Protocols

- **Inbound**: Receives data requirements from all Revenue teams and integration requests from Data Operations.
- **Outbound**: Provides clean revenue data to all Revenue teams, Executive Intelligence, and Pipeline Analyst.

---
name: "Finance & Infrastructure"
id: finance-infrastructure
manager: finance-tracker
members:
  - finance-tracker
  - infrastructure-maintainer
  - accounts-payable-agent
budget: 1500
signal: S=(data, report, inform, markdown, financial-status)
---

## Mission

Manages financial tracking, accounts payable, and infrastructure maintenance. Ensures fiscal accountability and operational reliability of business systems.

## Coordination Patterns

Finance Tracker leads budget monitoring and financial reporting. Infrastructure Maintainer manages business system uptime and maintenance. Accounts Payable Agent handles payment processing and vendor management.

## Escalation Rules

- Financial discrepancies exceeding 5% escalate to department head.
- Infrastructure failures affecting business operations escalate immediately.
- Payment delays affecting vendor relationships escalate to team manager.

## Handoff Protocols

- **Inbound**: Receives budget data from all departments and infrastructure alerts from DevOps & Reliability.
- **Outbound**: Provides financial data to Executive Intelligence for reporting. Publishes budget status to department heads.

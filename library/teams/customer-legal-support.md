---
name: "Customer & Legal Support"
id: customer-legal-support
manager: support-responder
members:
  - support-responder
  - legal-compliance-checker
budget: 1000
signal: S=(linguistic, report, inform, markdown, support-metrics)
---

## Mission

Handles customer support operations and legal compliance checking. First line of response for customer issues and legal review for organizational activities.

## Coordination Patterns

Support Responder manages customer inquiries and issue resolution. Legal Compliance Checker reviews activities and communications for legal and regulatory compliance.

## Escalation Rules

- Customer issues with legal implications escalate to department head and Governance & Compliance simultaneously.
- Support volume spikes exceeding 2x average escalate to department head for resource allocation.
- Legal compliance concerns escalate immediately to Governance & Compliance department.

## Handoff Protocols

- **Inbound**: Receives customer inquiries from all channels and compliance review requests from departments.
- **Outbound**: Publishes support metrics to department head. Escalates legal findings to Governance & Compliance.

---
name: "DevOps & Reliability"
id: devops-reliability
manager: devops-automator
members:
  - devops-automator
  - sre
  - incident-response-commander
budget: 3000
signal: S=(data, report, inform, markdown, infrastructure-status)
---

## Mission

Manages CI/CD pipelines, infrastructure automation, and incident response. Ensures production systems maintain target uptime through automated deployment, monitoring, and rapid recovery.

## Coordination Patterns

DevOps Automator leads infrastructure planning and on-call scheduling. SRE defines reliability targets and error budgets. Incident Response Commander manages the incident lifecycle. On-call rotation ensures 24/7 coverage with clear runbooks.

## Escalation Rules

- P1 incidents escalate to department head within 15 minutes if not mitigated.
- Infrastructure cost anomalies exceeding 15% trigger immediate investigation.
- Deployment pipeline failures blocking all teams escalate to team manager immediately.

## Handoff Protocols

- **Inbound**: Receives deployment artifacts from engineering teams and security requirements from Security Engineering.
- **Outbound**: Provides deployment status, uptime metrics, and incident reports to all dependent teams and department head.

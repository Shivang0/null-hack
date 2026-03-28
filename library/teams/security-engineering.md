---
name: Security Engineering
id: security-engineering
manager: security-engineer
members:
  - security-engineer
  - threat-detection-engineer
budget: 2000
signal: S=(data, report, inform, markdown, security-posture)
---

## Mission

Implements threat detection, vulnerability management, and security architecture. Guards the organization's technical perimeter and ensures compliance with security standards.

## Coordination Patterns

Security Engineer leads architecture reviews and vulnerability triage. Threat Detection Engineer operates monitoring and alerting systems. Both collaborate on incident investigation when security events occur.

## Escalation Rules

- Critical vulnerabilities bypass normal processes — immediate patching authorized.
- Suspected data breaches escalate to department head and division head simultaneously.
- Third-party dependency vulnerabilities escalate with patch timeline to affected teams.

## Handoff Protocols

- **Inbound**: Receives architecture proposals from Core Architecture for security review, and incident alerts from DevOps & Reliability.
- **Outbound**: Publishes security advisories, vulnerability reports, and remediation directives to all engineering teams.

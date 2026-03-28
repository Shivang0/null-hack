---
name: Core Architecture
id: core-architecture
manager: software-architect
members:
  - software-architect
  - backend-architect
  - autonomous-optimization-architect
  - data-engineer
  - database-optimizer
budget: 3000
signal: S=(code, spec, commit, markdown, architecture-design)
---

## Mission

Defines and maintains the foundational system architecture — data models, service boundaries, and integration patterns that every other team builds on. Ensures the technical estate composes cleanly and evolves without rewrites.

## Coordination Patterns

The architect leads weekly design reviews where team members present ADRs and system proposals. Backend Architect and Data Engineer collaborate on data layer decisions while Database Optimizer validates query performance impacts. Autonomous Optimization Architect feeds performance insights back into architectural decisions.

## Escalation Rules

- Architectural decisions affecting multiple departments escalate to Software Engineering department head.
- Schema changes impacting more than two services require full team review before merge.
- Performance regression detected by Database Optimizer triggers immediate architecture review.

## Handoff Protocols

- **Inbound**: Receives requirements from Product Strategy, constraint signals from Platform & Infrastructure, and performance data from Quality Assurance.
- **Outbound**: Publishes ADRs, system diagrams, and API contracts consumed by Application Development, Emerging Tech, and Platform Integration.

---
name: Application Development
id: application-development
manager: senior-developer
members:
  - senior-developer
  - frontend-developer
  - mobile-app-builder
  - rapid-prototyper
  - code-reviewer
budget: 3000
signal: S=(code, spec, commit, markdown, feature-delivery)
---

## Mission

Ships user-facing features across web and mobile platforms. Owns the build-review-deploy cycle from feature branch to production, ensuring code quality and delivery velocity.

## Coordination Patterns

Senior Developer leads sprint planning and code review assignments. Frontend Developer and Mobile App Builder divide platform responsibilities. Rapid Prototyper builds proof-of-concept implementations for uncertain features. Code Reviewer provides systematic review coverage across all PRs.

## Escalation Rules

- Feature delivery delays exceeding two days escalate to team manager with blocker details.
- Code review disagreements unresolved after one round escalate to Core Architecture for architectural ruling.
- Cross-platform inconsistencies escalate to team manager for design alignment.

## Handoff Protocols

- **Inbound**: Receives prioritized feature specs from Product Strategy and architectural constraints from Core Architecture.
- **Outbound**: Delivers deployable features to DevOps & Reliability pipeline. Hands off completed features to Test Engineering for validation.

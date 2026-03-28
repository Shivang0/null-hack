---
name: Technology
id: technology
description: Builds, maintains, and assures every technical system
head: software-architect
departments: [software-engineering, platform-infrastructure, quality-assurance, product, spatial-computing]
budget: 50000
signal: S=(data, report, inform, markdown, division-status)
---

# Mission

Technology exists to build, maintain, and assure every technical system that powers the organization. We are accountable for system reliability, engineering quality, product delivery, and technical security. We measure success by uptime, deployment frequency, defect rate, and architectural coherence.

# Operating Model

Technology operates as five coordinated departments: Software Engineering owns the application and platform layer; Platform & Infrastructure owns deployment, reliability, and security; Quality Assurance validates all system behavior before release; Product translates user needs into engineering priorities; and Spatial Computing builds immersive experiences on XR and Apple platforms.

# Cross-Department Coordination

- Software Engineering and Platform & Infrastructure coordinate on every deployment: SE produces the release candidate; P&I validates infrastructure readiness and executes deployment
- Quality Assurance gates all releases from Software Engineering and Spatial Computing before they reach production
- Product feeds prioritized requirements to Software Engineering and Spatial Computing
- Spatial Computing consults Platform & Infrastructure for any XR backend services or cloud infrastructure needs

# Escalation Rules

- ESCALATE TO DIVISION HEAD when: A cross-department conflict cannot be resolved at the department level within 48 hours
- ESCALATE TO DIVISION HEAD when: A production incident affects more than one department's systems simultaneously
- ESCALATE OUTSIDE DIVISION when: A technical decision requires budget approval above division authority
- ESCALATE OUTSIDE DIVISION when: A security incident has potential external or regulatory impact
- BLOCK AND WAIT FOR HUMAN when: Any irreversible action affects production data or external customer commitments

---
name: Unity Studio
id: unity-studio
manager: unity-architect
members:
  - unity-architect
  - unity-editor-tool-developer
  - unity-multiplayer-engineer
  - unity-shader-graph-artist
budget: 2500
signal: S=(code, spec, commit, csharp, unity-delivery)
---

## Mission

Implements interactive experiences in Unity with focus on clean architecture, editor tooling, multiplayer systems, and shader development.

## Coordination Patterns

Unity Architect defines the technical architecture and code standards. Unity Editor Tool Developer builds custom editor workflows. Unity Multiplayer Engineer handles networking and synchronization. Unity Shader Graph Artist creates visual effects and rendering systems.

## Escalation Rules

- Unity version upgrade decisions escalate to department head for cross-studio impact assessment.
- Multiplayer architecture changes require department head coordination if affecting other studios.
- Performance issues on target platforms escalate with profiling data.

## Handoff Protocols

- **Inbound**: Receives GDDs and art specs from Game Design & Narrative. Consumes shared assets from Godot & Blender Studio.
- **Outbound**: Delivers built Unity experiences to DevOps & Reliability for deployment. Shares reusable patterns with other engine studios.

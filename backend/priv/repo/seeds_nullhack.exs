# ---------------------------------------------------------------------------
# NULLHACK Organization Seed
#
# Creates the complete NULLHACK org: divisions, departments, teams, agents,
# projects, goals, issues, workflows, schedules, datasets, memory entries,
# skills, budget policies, labels, notifications, and activity events.
#
# Run with:
#   mix run priv/repo/seeds_nullhack.exs
#
# Idempotent — safe to run multiple times.
# ---------------------------------------------------------------------------

import Ecto.Query

alias Canopy.Repo

alias Canopy.Schemas.{
  User,
  Workspace,
  Agent,
  Schedule,
  Project,
  Goal,
  Issue,
  IssueLabel,
  BudgetPolicy,
  Skill,
  ActivityEvent,
  Organization,
  OrganizationMembership,
  Secret,
  Label,
  Division,
  Department,
  Team,
  TeamMembership,
  Workflow,
  WorkflowStep,
  Conversation,
  ConversationMessage,
  Dataset,
  Notification,
  MemoryEntry
}

IO.puts("\n=== NULLHACK Organization Seed ===\n")

# ===========================================================================
# SECTION 1: Fetch existing admin user
# ===========================================================================

IO.puts("[1/20] Creating/fetching admin user...")

admin =
  case Repo.get_by(User, email: "admin@canopy.dev") do
    %User{} = u ->
      u

    nil ->
      {:ok, u} =
        %User{}
        |> User.changeset(%{
          name: "Shivang",
          email: "admin@canopy.dev",
          password: "canopy123",
          role: "admin"
        })
        |> Repo.insert()

      u
  end

IO.puts("    admin@canopy.dev (#{admin.id})")

# ===========================================================================
# SECTION 2: Organization
# ===========================================================================

IO.puts("[2/20] Organization...")

unless Repo.exists?(from o in Organization, where: o.slug == "nullhack") do
  Repo.insert!(
    Organization.changeset(%Organization{}, %{
      name: "NULLHACK",
      slug: "nullhack",
      plan: "paid",
      mission: "Securing the future through elite security consultancy and nurturing the next generation of tech talent through the {} Hack cohort program",
      description: "Security consultancy and talent pipeline accelerator",
      issue_prefix: "NH",
      budget_monthly_cents: 1_000_000,
      budget_per_agent_cents: 50_000,
      budget_enforcement: "warning",
      settings: %{
        billing_email: "billing@nullhack.dev",
        timezone: "Europe/Helsinki",
        cohort_program: "{} Hack",
        founded: "2024"
      },
      governance: %{
        approval_required_above_cents: 100_000,
        max_concurrent_sessions: 20,
        auto_pause_on_budget_warning: true
      }
    })
  )
end

nullhack_org = Repo.get_by!(Organization, slug: "nullhack")

IO.puts("    NULLHACK (paid, #{nullhack_org.id})")

# ===========================================================================
# SECTION 3: Organization Membership
# ===========================================================================

IO.puts("[3/20] Organization membership...")

unless Repo.exists?(from m in OrganizationMembership, where: m.organization_id == ^nullhack_org.id and m.user_id == ^admin.id) do
  Repo.insert!(
    OrganizationMembership.changeset(%OrganizationMembership{}, %{
      organization_id: nullhack_org.id,
      user_id: admin.id,
      role: "owner"
    })
  )
end

IO.puts("    admin@canopy.dev: owner of NULLHACK")

# ===========================================================================
# SECTION 4: Workspace
# ===========================================================================

IO.puts("[4/20] Workspace...")

unless Repo.exists?(from w in Workspace, where: w.name == "NULLHACK HQ" and w.owner_id == ^admin.id) do
  Repo.insert!(
    Workspace.changeset(%Workspace{}, %{
      name: "NULLHACK HQ",
      path: "/Users/shivang/Desktop/hackathon/canopy",
      status: "active",
      owner_id: admin.id,
      organization_id: nullhack_org.id
    })
  )
end

workspace = Repo.one!(from w in Workspace, where: w.name == "NULLHACK HQ" and w.owner_id == ^admin.id, limit: 1)

IO.puts("    \"NULLHACK HQ\" (#{workspace.id})")

# ===========================================================================
# SECTION 5: Agents (14 total — 4 human-agents + 10 AI agents)
# ===========================================================================

IO.puts("[5/20] Agents...")

# -- Leadership agents (human-agents) inserted first so we can wire reports_to --

leadership_agents = [
  %{
    slug: "adit",
    name: "Adit",
    role: "cto",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "idle",
    avatar_emoji: "\u{1F9E0}",
    reports_to: nil,
    system_prompt: "You are Adit, CTO of NULLHACK. Background: Aalto University data science, NLP developer at Singapore Management University, ML engineer at The Asia Foundation, deep learning researcher. You lead all engineering and security teams. You make architectural decisions, review critical code, and ensure technical excellence. You have deep expertise in AI/ML, NLP, data science, Python, and systems architecture. You're building satellite AI (Detour project at TreeHacks). You report directly to the Founder.",
    workspace_id: workspace.id
  },
  %{
    slug: "ijti",
    name: "Ijti",
    role: "coo",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "idle",
    avatar_emoji: "\u{26A1}",
    reports_to: nil,
    system_prompt: "You are Ijti (Ijtihed Kilani), COO of NULLHACK. Background: MSc Mathematics and BSc Computational Engineering from Aalto University, Founding Engineer at Kova Labs, AI role at Supercell, published game developer (Maze Maverick and Blood Pivot on Steam), research at Aalto Computational Behavior Lab and King Abdulaziz University. You oversee operations, product, support, and HR. You optimize processes, manage budgets, and ensure smooth day-to-day operations. Expert in mathematics, computational engineering, AI/ML, game development, and platform building. You report directly to the Founder.",
    workspace_id: workspace.id
  },
  %{
    slug: "artem",
    name: "Artem",
    role: "advisor",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "idle",
    avatar_emoji: "\u{1F310}",
    reports_to: nil,
    system_prompt: "You are Artem Kislukhin, Strategic Advisor at NULLHACK. Background: Co-founded Null Fellows, deep European startup ecosystem connections, Vitalism Foundation involvement, event organizer connecting young builders with growth companies. 9 out of 10 fellows you placed received continuation offers with 2-3x salary. You advise on cohort strategy, partnership development, European expansion, and talent pipeline optimization. You connect NULLHACK with partner companies and shape the {} Hack program strategy.",
    workspace_id: workspace.id
  },
  %{
    slug: "samuli",
    name: "Samuli",
    role: "advisor",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "idle",
    avatar_emoji: "\u{1F52E}",
    reports_to: nil,
    system_prompt: "You are Samuli Hartikainen, Talent & Network Advisor at NULLHACK. Background: Aalto University, truth seeker and aspiring polymath, deep connections in Finnish and European tech ecosystem. You advise on talent acquisition strategy, candidate evaluation frameworks, European network expansion, and community building. You help shape the {} Hack cohort selection criteria and mentor matching.",
    workspace_id: workspace.id
  }
]

for attrs <- leadership_agents do
  unless Repo.exists?(from a in Agent, where: a.workspace_id == ^workspace.id and a.slug == ^attrs.slug) do
    Repo.insert!(Agent.changeset(%Agent{}, attrs))
  end
end

adit = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "adit")
ijti = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "ijti")
artem = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "artem")
samuli = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "samuli")

# -- AI agents with reports_to wired up --

ai_agents = [
  %{
    slug: "kael",
    name: "Kael",
    role: "backend-engineer",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{2699}\u{FE0F}",
    reports_to: adit.id,
    system_prompt: "You are Kael, Backend Engineer at NULLHACK. You build and maintain server-side systems, APIs, databases, and infrastructure for NULLHACK's security consultancy platform and {} Hack cohort platform. Expert in Elixir/Phoenix, PostgreSQL, REST APIs, authentication systems, and distributed systems. You write clean, secure, well-tested code. You report to Adit (CTO).",
    workspace_id: workspace.id
  },
  %{
    slug: "zara",
    name: "Zara",
    role: "frontend-engineer",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F3A8}",
    reports_to: adit.id,
    system_prompt: "You are Zara, Frontend Engineer at NULLHACK. You design and build beautiful, responsive user interfaces for NULLHACK's client-facing platforms. Expert in SvelteKit, TypeScript, Tailwind CSS, accessibility, and modern frontend patterns. You create pixel-perfect implementations of designs and ensure excellent UX across all NULLHACK products. You report to Adit (CTO).",
    workspace_id: workspace.id
  },
  %{
    slug: "rune",
    name: "Rune",
    role: "fullstack-engineer",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F527}",
    reports_to: adit.id,
    system_prompt: "You are Rune, Infrastructure & Full-Stack Engineer at NULLHACK. You handle DevOps, CI/CD, cloud infrastructure, monitoring, and full-stack development. Expert in Docker, cloud platforms, Terraform, GitHub Actions, Linux systems, networking, and security hardening. You ensure NULLHACK's systems are reliable, scalable, and secure. You report to Adit (CTO).",
    workspace_id: workspace.id
  },
  %{
    slug: "cipher",
    name: "Cipher",
    role: "security-engineer",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F6E1}\u{FE0F}",
    reports_to: adit.id,
    system_prompt: "You are Cipher, Lead Security Engineer at NULLHACK. You conduct penetration testing, vulnerability assessments, security audits, and red team exercises for NULLHACK's clients. Expert in OWASP Top 10, network security, web application security, cloud security, reverse engineering, and compliance frameworks (SOC2, ISO 27001, GDPR). You write detailed security reports and remediation guidance. You also design security training for the {} Hack cohort. You report to Adit (CTO).",
    workspace_id: workspace.id
  },
  %{
    slug: "nova",
    name: "Nova",
    role: "product-manager",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F680}",
    reports_to: ijti.id,
    system_prompt: "You are Nova, Product Manager at NULLHACK. You define product strategy, write specs, prioritize backlogs, and coordinate between engineering, design, and business teams. You manage two key products: the Security Consultancy platform and the {} Hack cohort program platform. Expert in agile methodologies, user research, data-driven decisions, roadmap planning, and stakeholder management. You report to Ijti (COO).",
    workspace_id: workspace.id
  },
  %{
    slug: "sage",
    name: "Sage",
    role: "client-support",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F9FF}",
    reports_to: ijti.id,
    system_prompt: "You are Sage, Client Support Specialist for NULLHACK's security consultancy business. You handle client onboarding, engagement management, report delivery, follow-ups, and escalations. You ensure clients receive timely, professional communication about their security assessments. Expert in client relations, security terminology, SLA management, and technical writing. You report to Ijti (COO).",
    workspace_id: workspace.id
  },
  %{
    slug: "echo",
    name: "Echo",
    role: "cohort-support",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F4E1}",
    reports_to: ijti.id,
    system_prompt: "You are Echo, Cohort Support Specialist for NULLHACK's {} Hack program. You manage cohort applications, candidate communications, onboarding, mentor matching, progress tracking, and partner company coordination. You ensure every cohort member has an exceptional experience. Expert in community management, talent operations, event coordination, and program logistics. You report to Ijti (COO).",
    workspace_id: workspace.id
  },
  %{
    slug: "aria",
    name: "Aria",
    role: "hr-manager",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F49C}",
    reports_to: ijti.id,
    system_prompt: "You are Aria, HR & Talent Operations Manager at NULLHACK. You handle recruiting, onboarding, culture building, performance management, compensation, compliance, and employee well-being. You also manage the talent evaluation process for the {} Hack cohort — screening applications, conducting assessments, and matching candidates with partner companies. Expert in HR best practices, talent assessment, employment law, and organizational development. You report to Ijti (COO).",
    workspace_id: workspace.id
  },
  %{
    slug: "vex",
    name: "Vex",
    role: "sales",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{1F4B0}",
    reports_to: artem.id,
    system_prompt: "You are Vex, Sales Lead at NULLHACK. You drive revenue through two channels: (1) selling security consultancy services (pentesting, audits, compliance) to companies, and (2) acquiring partner companies for the {} Hack cohort who will hire top talent. Expert in B2B sales, pipeline management, proposal writing, negotiation, CRM, and partnership development. You understand cybersecurity market dynamics and European tech hiring landscape. You report to Artem (Advisor).",
    workspace_id: workspace.id
  },
  %{
    slug: "pixel",
    name: "Pixel",
    role: "marketing",
    adapter: "claude-code",
    model: "claude-sonnet-4-6",
    status: "sleeping",
    avatar_emoji: "\u{2728}",
    reports_to: samuli.id,
    system_prompt: "You are Pixel, Marketing & Brand Lead at NULLHACK. You manage NULLHACK's brand presence, content strategy, social media, community engagement, event marketing, and PR. You promote both the security consultancy services and the {} Hack cohort program. Expert in content marketing, SEO, social media strategy, community building, event promotion, and brand design. You create compelling narratives that attract both clients and cohort candidates. You report to Samuli (Advisor).",
    workspace_id: workspace.id
  }
]

for attrs <- ai_agents do
  unless Repo.exists?(from a in Agent, where: a.workspace_id == ^workspace.id and a.slug == ^attrs.slug) do
    Repo.insert!(Agent.changeset(%Agent{}, attrs))
  end
end

kael = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "kael")
zara = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "zara")
rune = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "rune")
cipher = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "cipher")
nova = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "nova")
sage = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "sage")
echo = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "echo")
aria = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "aria")
vex = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "vex")
pixel = Repo.get_by!(Agent, workspace_id: workspace.id, slug: "pixel")

IO.puts("    14 agents: adit (CTO), ijti (COO), artem (advisor), samuli (advisor), kael, zara, rune, cipher, nova, sage, echo, aria, vex, pixel")

# ===========================================================================
# SECTION 6: Divisions
# ===========================================================================

IO.puts("[6/20] Divisions...")

divisions_data = [
  %{
    name: "Engineering",
    slug: "engineering",
    description: "Technology and security — all platform engineering and security operations.",
    organization_id: nullhack_org.id,
    head_agent_id: adit.id,
    budget_monthly_cents: 400_000,
    budget_enforcement: "warning",
    mission: "Build and secure world-class platforms for security consultancy and talent acceleration.",
    signal: "velocity"
  },
  %{
    name: "Operations",
    slug: "operations",
    description: "Product management, people operations, and client/cohort support.",
    organization_id: nullhack_org.id,
    head_agent_id: ijti.id,
    budget_monthly_cents: 350_000,
    budget_enforcement: "warning",
    mission: "Keep NULLHACK running smoothly — product, people, and support excellence.",
    signal: "efficiency"
  },
  %{
    name: "Growth",
    slug: "growth",
    description: "Sales, marketing, and strategic advisory for revenue and partnerships.",
    organization_id: nullhack_org.id,
    budget_monthly_cents: 250_000,
    budget_enforcement: "visibility",
    mission: "Drive revenue, build partnerships, and grow the NULLHACK brand across Europe.",
    signal: "revenue"
  }
]

for attrs <- divisions_data do
  unless Repo.exists?(from d in Division, where: d.organization_id == ^nullhack_org.id and d.slug == ^attrs.slug) do
    Repo.insert!(Division.changeset(%Division{}, attrs))
  end
end

eng_division = Repo.get_by!(Division, organization_id: nullhack_org.id, slug: "engineering")
ops_division = Repo.get_by!(Division, organization_id: nullhack_org.id, slug: "operations")
growth_division = Repo.get_by!(Division, organization_id: nullhack_org.id, slug: "growth")

IO.puts("    3 divisions: Engineering, Operations, Growth")

# ===========================================================================
# SECTION 7: Departments
# ===========================================================================

IO.puts("[7/20] Departments...")

departments_data = [
  %{
    name: "Platform Engineering",
    slug: "platform-engineering",
    description: "Backend, frontend, and infrastructure for all NULLHACK platforms.",
    division_id: eng_division.id,
    head_agent_id: adit.id,
    budget_monthly_cents: 200_000,
    budget_enforcement: "warning",
    mission: "Own the platform layer: APIs, UI, data, and runtime infrastructure."
  },
  %{
    name: "Security",
    slug: "security",
    description: "Penetration testing, vulnerability assessment, and security operations for clients.",
    division_id: eng_division.id,
    head_agent_id: cipher.id,
    budget_monthly_cents: 150_000,
    budget_enforcement: "warning",
    mission: "Deliver elite security assessments and maintain the highest standards of operational security."
  },
  %{
    name: "Product",
    slug: "product",
    description: "Product strategy, specs, roadmaps, and cross-team coordination.",
    division_id: ops_division.id,
    head_agent_id: nova.id,
    budget_monthly_cents: 100_000,
    budget_enforcement: "visibility",
    mission: "Define what we build and ensure it solves real problems for clients and cohort members."
  },
  %{
    name: "People & Support",
    slug: "people-support",
    description: "HR, talent operations, client support, and cohort support.",
    division_id: ops_division.id,
    head_agent_id: ijti.id,
    budget_monthly_cents: 150_000,
    budget_enforcement: "visibility",
    mission: "Attract, retain, and support great people — both internally and across our programs."
  },
  %{
    name: "Revenue",
    slug: "revenue",
    description: "Sales pipeline and marketing for security consultancy and partner acquisition.",
    division_id: growth_division.id,
    head_agent_id: vex.id,
    budget_monthly_cents: 120_000,
    budget_enforcement: "visibility",
    mission: "Close deals, acquire partners, and build a predictable revenue engine."
  },
  %{
    name: "Advisory",
    slug: "advisory",
    description: "Strategic advisory, partnership development, and cohort program shaping.",
    division_id: growth_division.id,
    budget_monthly_cents: 80_000,
    budget_enforcement: "visibility",
    mission: "Guide NULLHACK strategy with deep ecosystem knowledge and network leverage."
  }
]

for attrs <- departments_data do
  unless Repo.exists?(from d in Department, where: d.division_id == ^attrs.division_id and d.slug == ^attrs.slug) do
    Repo.insert!(Department.changeset(%Department{}, attrs))
  end
end

platform_dept = Repo.get_by!(Department, division_id: eng_division.id, slug: "platform-engineering")
security_dept = Repo.get_by!(Department, division_id: eng_division.id, slug: "security")
product_dept = Repo.get_by!(Department, division_id: ops_division.id, slug: "product")
people_dept = Repo.get_by!(Department, division_id: ops_division.id, slug: "people-support")
revenue_dept = Repo.get_by!(Department, division_id: growth_division.id, slug: "revenue")
advisory_dept = Repo.get_by!(Department, division_id: growth_division.id, slug: "advisory")

IO.puts("    6 departments: Platform Engineering, Security, Product, People & Support, Revenue, Advisory")

# ===========================================================================
# SECTION 8: Teams
# ===========================================================================

IO.puts("[8/20] Teams...")

teams_data = [
  %{
    name: "Core Dev Team",
    slug: "core-dev-team",
    description: "Backend, frontend, and infra engineers building NULLHACK platforms.",
    department_id: platform_dept.id,
    manager_agent_id: adit.id,
    budget_monthly_cents: 150_000,
    mission: "Ship reliable, secure platform code on time.",
    coordination: "Daily standups, PR reviews, sprint planning every 2 weeks."
  },
  %{
    name: "Security Ops",
    slug: "security-ops",
    description: "Penetration testing, vulnerability assessments, and client security engagements.",
    department_id: security_dept.id,
    manager_agent_id: cipher.id,
    budget_monthly_cents: 120_000,
    mission: "Find every vulnerability before the adversary does.",
    coordination: "Engagement kickoffs, finding reviews, report QA sessions."
  },
  %{
    name: "Product Team",
    slug: "product-team",
    description: "Product management and cross-functional coordination.",
    department_id: product_dept.id,
    manager_agent_id: nova.id,
    budget_monthly_cents: 80_000,
    mission: "Define, prioritize, and ship the right features.",
    coordination: "Weekly product reviews, backlog grooming, stakeholder syncs."
  },
  %{
    name: "Support Team",
    slug: "support-team",
    description: "Client support for security consultancy and cohort program support.",
    department_id: people_dept.id,
    manager_agent_id: sage.id,
    budget_monthly_cents: 60_000,
    mission: "Deliver responsive, empathetic, and expert support to every client and cohort member."
  },
  %{
    name: "HR Team",
    slug: "hr-team",
    description: "Recruiting, onboarding, culture, and talent operations.",
    department_id: people_dept.id,
    manager_agent_id: aria.id,
    budget_monthly_cents: 50_000,
    mission: "Build the best team and nurture the {} Hack talent pipeline."
  },
  %{
    name: "Sales Team",
    slug: "sales-team",
    description: "B2B sales for security services and partner acquisition for {} Hack.",
    department_id: revenue_dept.id,
    manager_agent_id: vex.id,
    budget_monthly_cents: 70_000,
    mission: "Close security consultancy deals and acquire partner companies."
  },
  %{
    name: "Marketing Team",
    slug: "marketing-team",
    description: "Brand, content, social media, and community engagement.",
    department_id: revenue_dept.id,
    manager_agent_id: pixel.id,
    budget_monthly_cents: 50_000,
    mission: "Build the NULLHACK brand and attract clients and candidates."
  },
  %{
    name: "Advisory Board",
    slug: "advisory-board",
    description: "Strategic advisors shaping company direction, partnerships, and cohort strategy.",
    department_id: advisory_dept.id,
    manager_agent_id: artem.id,
    budget_monthly_cents: 40_000,
    mission: "Provide strategic guidance, network access, and ecosystem intelligence."
  }
]

for attrs <- teams_data do
  unless Repo.exists?(from t in Team, where: t.department_id == ^attrs.department_id and t.slug == ^attrs.slug) do
    Repo.insert!(Team.changeset(%Team{}, attrs))
  end
end

core_dev_team = Repo.get_by!(Team, department_id: platform_dept.id, slug: "core-dev-team")
security_ops_team = Repo.get_by!(Team, department_id: security_dept.id, slug: "security-ops")
product_team = Repo.get_by!(Team, department_id: product_dept.id, slug: "product-team")
support_team = Repo.get_by!(Team, department_id: people_dept.id, slug: "support-team")
hr_team = Repo.get_by!(Team, department_id: people_dept.id, slug: "hr-team")
sales_team = Repo.get_by!(Team, department_id: revenue_dept.id, slug: "sales-team")
marketing_team = Repo.get_by!(Team, department_id: revenue_dept.id, slug: "marketing-team")
advisory_board = Repo.get_by!(Team, department_id: advisory_dept.id, slug: "advisory-board")

IO.puts("    8 teams: Core Dev, Security Ops, Product, Support, HR, Sales, Marketing, Advisory Board")

# ===========================================================================
# SECTION 9: Team Memberships (each agent belongs to ONE team)
# ===========================================================================

IO.puts("[9/20] Team memberships...")

memberships_data = [
  # Leadership in their primary teams
  %{team_id: core_dev_team.id, agent_id: adit.id, role: "manager"},
  %{team_id: product_team.id, agent_id: ijti.id, role: "manager"},
  %{team_id: advisory_board.id, agent_id: artem.id, role: "manager"},
  %{team_id: advisory_board.id, agent_id: samuli.id, role: "member"},
  # AI agents in their teams
  %{team_id: core_dev_team.id, agent_id: kael.id, role: "member"},
  %{team_id: core_dev_team.id, agent_id: zara.id, role: "member"},
  %{team_id: core_dev_team.id, agent_id: rune.id, role: "member"},
  %{team_id: security_ops_team.id, agent_id: cipher.id, role: "manager"},
  %{team_id: product_team.id, agent_id: nova.id, role: "member"},
  %{team_id: support_team.id, agent_id: sage.id, role: "manager"},
  %{team_id: support_team.id, agent_id: echo.id, role: "member"},
  %{team_id: hr_team.id, agent_id: aria.id, role: "manager"},
  %{team_id: sales_team.id, agent_id: vex.id, role: "manager"},
  %{team_id: marketing_team.id, agent_id: pixel.id, role: "manager"}
]

for attrs <- memberships_data do
  unless Repo.exists?(from m in TeamMembership, where: m.agent_id == ^attrs.agent_id) do
    Repo.insert!(TeamMembership.changeset(%TeamMembership{}, attrs))
  end
end

IO.puts("    14 memberships: one per agent")

# ===========================================================================
# SECTION 10: Projects
# ===========================================================================

IO.puts("[10/20] Projects...")

projects_data = [
  %{
    name: "Security Consultancy Platform",
    description: "Client-facing platform for security assessments — intake, scoping, testing, reporting, and delivery.",
    status: "active",
    workspace_id: workspace.id
  },
  %{
    name: "{} Hack Cohort Program",
    description: "Talent pipeline platform — applications, screening, assessment, partner matching, and onboarding.",
    status: "active",
    workspace_id: workspace.id
  },
  %{
    name: "Partner Network",
    description: "Building and managing partner company relationships for the {} Hack program.",
    status: "active",
    workspace_id: workspace.id
  },
  %{
    name: "NULLHACK Operations",
    description: "Internal tooling, processes, documentation, and operational excellence.",
    status: "active",
    workspace_id: workspace.id
  }
]

for attrs <- projects_data do
  unless Repo.exists?(from p in Project, where: p.workspace_id == ^workspace.id and p.name == ^attrs.name) do
    Repo.insert!(%Project{
      name: attrs.name,
      description: attrs.description,
      status: attrs.status,
      workspace_id: attrs.workspace_id
    })
  end
end

security_project = Repo.get_by!(Project, workspace_id: workspace.id, name: "Security Consultancy Platform")
cohort_project = Repo.get_by!(Project, workspace_id: workspace.id, name: "{} Hack Cohort Program")
partner_project = Repo.get_by!(Project, workspace_id: workspace.id, name: "Partner Network")
ops_project = Repo.get_by!(Project, workspace_id: workspace.id, name: "NULLHACK Operations")

IO.puts("    4 projects: Security Consultancy Platform, {} Hack Cohort Program, Partner Network, NULLHACK Operations")

# ===========================================================================
# SECTION 11: Goals (hierarchical — 2-3 per project)
# ===========================================================================

IO.puts("[11/20] Goals...")

# -- Security Consultancy Platform goals --
unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Launch Client Portal MVP") do
  Repo.insert!(%Goal{
    title: "Launch Client Portal MVP",
    description: "Ship the first production client portal with intake forms, engagement tracking, and report delivery.",
    status: "active",
    workspace_id: workspace.id,
    project_id: security_project.id
  })
end

client_portal_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Launch Client Portal MVP")

unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Build Automated Scanning Pipeline") do
  Repo.insert!(%Goal{
    title: "Build Automated Scanning Pipeline",
    description: "Integrate automated vulnerability scanners (OWASP ZAP, Nuclei) into the assessment workflow.",
    status: "active",
    workspace_id: workspace.id,
    project_id: security_project.id,
    parent_id: client_portal_goal.id
  })
end

unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "SOC2 Compliance Framework") do
  Repo.insert!(%Goal{
    title: "SOC2 Compliance Framework",
    description: "Implement SOC2 Type II controls and evidence collection for client trust.",
    status: "active",
    workspace_id: workspace.id,
    project_id: security_project.id
  })
end

# -- {} Hack Cohort Program goals --
unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Launch Cohort Application System") do
  Repo.insert!(%Goal{
    title: "Launch Cohort Application System",
    description: "Build the application pipeline: form submission, automated screening, skills assessment, and interview scheduling.",
    status: "active",
    workspace_id: workspace.id,
    project_id: cohort_project.id
  })
end

cohort_app_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Launch Cohort Application System")

unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Partner Matching Algorithm") do
  Repo.insert!(%Goal{
    title: "Partner Matching Algorithm",
    description: "Develop an intelligent matching system pairing cohort members with partner companies based on skills, interests, and culture fit.",
    status: "active",
    workspace_id: workspace.id,
    project_id: cohort_project.id,
    parent_id: cohort_app_goal.id
  })
end

# -- Partner Network goals --
unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Sign 10 Partner Companies") do
  Repo.insert!(%Goal{
    title: "Sign 10 Partner Companies",
    description: "Secure commitments from 10 European growth-stage companies to hire through the {} Hack program.",
    status: "active",
    workspace_id: workspace.id,
    project_id: partner_project.id
  })
end

unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Build Partner CRM") do
  Repo.insert!(%Goal{
    title: "Build Partner CRM",
    description: "Create a lightweight CRM for tracking partner company relationships, deals, and hiring outcomes.",
    status: "active",
    workspace_id: workspace.id,
    project_id: partner_project.id
  })
end

# -- NULLHACK Operations goals --
unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Internal Tooling v1") do
  Repo.insert!(%Goal{
    title: "Internal Tooling v1",
    description: "Build core internal tools: agent dashboard, budget tracker, and workflow automation.",
    status: "active",
    workspace_id: workspace.id,
    project_id: ops_project.id
  })
end

unless Repo.exists?(from g in Goal, where: g.workspace_id == ^workspace.id and g.title == "Documentation & Runbooks") do
  Repo.insert!(%Goal{
    title: "Documentation & Runbooks",
    description: "Write operational runbooks, onboarding docs, and process documentation for all teams.",
    status: "active",
    workspace_id: workspace.id,
    project_id: ops_project.id
  })
end

scanning_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Build Automated Scanning Pipeline")
soc2_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "SOC2 Compliance Framework")
matching_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Partner Matching Algorithm")
partner_sign_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Sign 10 Partner Companies")
partner_crm_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Build Partner CRM")
tooling_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Internal Tooling v1")
docs_goal = Repo.get_by!(Goal, workspace_id: workspace.id, title: "Documentation & Runbooks")

IO.puts("    10 goals across 4 projects (with hierarchy)")

# ===========================================================================
# SECTION 12: Issues (at least 2 per project, mix of statuses)
# ===========================================================================

IO.puts("[12/20] Issues...")

issues_data = [
  # Security Consultancy Platform
  %{
    title: "Build client intake form with risk questionnaire",
    description: "Create a multi-step intake form that captures company info, scope, compliance requirements, and risk appetite. Output: engagement brief for the security team.",
    status: "in_progress",
    priority: "high",
    workspace_id: workspace.id,
    project_id: security_project.id,
    goal_id: client_portal_goal.id,
    assignee_id: zara.id
  },
  %{
    title: "Implement engagement status API endpoints",
    description: "REST API for creating, updating, and querying security engagements. Include status transitions: scoping -> testing -> review -> delivered.",
    status: "todo",
    priority: "high",
    workspace_id: workspace.id,
    project_id: security_project.id,
    goal_id: client_portal_goal.id,
    assignee_id: kael.id
  },
  %{
    title: "Integrate OWASP ZAP automated scanner",
    description: "Wire OWASP ZAP into the assessment pipeline. Auto-run on new engagements with configurable scan profiles. Store results in security-findings dataset.",
    status: "backlog",
    priority: "medium",
    workspace_id: workspace.id,
    project_id: security_project.id,
    goal_id: scanning_goal.id,
    assignee_id: cipher.id
  },
  # {} Hack Cohort Program
  %{
    title: "Design cohort application form UI",
    description: "Multi-page application form: personal info, technical background, portfolio links, motivation essay, and availability. Must be mobile-responsive.",
    status: "in_progress",
    priority: "high",
    workspace_id: workspace.id,
    project_id: cohort_project.id,
    goal_id: cohort_app_goal.id,
    assignee_id: zara.id
  },
  %{
    title: "Build application screening pipeline",
    description: "Automated scoring of applications based on configurable criteria. Flag top candidates for manual review. Integrate with talent-assessments dataset.",
    status: "todo",
    priority: "high",
    workspace_id: workspace.id,
    project_id: cohort_project.id,
    goal_id: cohort_app_goal.id,
    assignee_id: kael.id
  },
  %{
    title: "Implement candidate-company matching algorithm",
    description: "ML-based matching that considers skills, interests, company culture, role requirements, and location preferences. Provide ranked matches with confidence scores.",
    status: "backlog",
    priority: "medium",
    workspace_id: workspace.id,
    project_id: cohort_project.id,
    goal_id: matching_goal.id,
    assignee_id: kael.id
  },
  # Partner Network
  %{
    title: "Create partner onboarding deck template",
    description: "Design a compelling pitch deck for onboarding partner companies: NULLHACK value proposition, cohort quality metrics, hiring outcomes, pricing.",
    status: "in_review",
    priority: "high",
    workspace_id: workspace.id,
    project_id: partner_project.id,
    goal_id: partner_sign_goal.id,
    assignee_id: pixel.id
  },
  %{
    title: "Build partner company directory API",
    description: "CRUD API for managing partner companies: profiles, contacts, hiring preferences, engagement history, and satisfaction scores.",
    status: "todo",
    priority: "medium",
    workspace_id: workspace.id,
    project_id: partner_project.id,
    goal_id: partner_crm_goal.id,
    assignee_id: kael.id
  },
  # NULLHACK Operations
  %{
    title: "Setup CI/CD pipeline for all services",
    description: "GitHub Actions workflows for backend (Elixir), frontend (SvelteKit), and infrastructure. Include linting, testing, and deployment stages.",
    status: "in_progress",
    priority: "critical",
    workspace_id: workspace.id,
    project_id: ops_project.id,
    goal_id: tooling_goal.id,
    assignee_id: rune.id
  },
  %{
    title: "Write onboarding runbook for new agents",
    description: "Step-by-step guide for adding new agents to the NULLHACK workspace: configuration, team assignment, skill setup, budget allocation, and first-task checklist.",
    status: "done",
    priority: "medium",
    workspace_id: workspace.id,
    project_id: ops_project.id,
    goal_id: docs_goal.id,
    assignee_id: nova.id
  }
]

for attrs <- issues_data do
  unless Repo.exists?(from i in Issue, where: i.workspace_id == ^workspace.id and i.title == ^attrs.title) do
    Repo.insert!(Issue.changeset(%Issue{}, attrs))
  end
end

IO.puts("    10 issues: 3 in_progress, 3 todo, 2 backlog, 1 in_review, 1 done")

# ===========================================================================
# SECTION 13: Labels
# ===========================================================================

IO.puts("[13/20] Labels...")

labels_data = [
  %{name: "urgent",         color: "#ef4444", workspace_id: workspace.id},
  %{name: "security",       color: "#f59e0b", workspace_id: workspace.id},
  %{name: "cohort",         color: "#8b5cf6", workspace_id: workspace.id},
  %{name: "partner",        color: "#3b82f6", workspace_id: workspace.id},
  %{name: "internal",       color: "#6b7280", workspace_id: workspace.id},
  %{name: "bug",            color: "#dc2626", workspace_id: workspace.id},
  %{name: "feature",        color: "#22c55e", workspace_id: workspace.id},
  %{name: "documentation",  color: "#06b6d4", workspace_id: workspace.id}
]

for attrs <- labels_data do
  unless Repo.exists?(from l in Label, where: l.workspace_id == ^workspace.id and l.name == ^attrs.name) do
    Repo.insert!(Label.changeset(%Label{}, attrs))
  end
end

IO.puts("    8 labels: urgent, security, cohort, partner, internal, bug, feature, documentation")

# ===========================================================================
# SECTION 14: Skills (3-4 per agent, linked via agent_skills join table)
# ===========================================================================

IO.puts("[14/20] Skills...")

skills_data = [
  # Engineering skills
  %{name: "Backend Development", description: "Build server-side systems, APIs, and database architectures.", category: "Development", enabled: true, workspace_id: workspace.id},
  %{name: "Frontend Development", description: "Design and implement responsive user interfaces with modern frameworks.", category: "Development", enabled: true, workspace_id: workspace.id},
  %{name: "Infrastructure & DevOps", description: "Manage cloud infrastructure, CI/CD pipelines, and deployment automation.", category: "Operations", enabled: true, workspace_id: workspace.id},
  %{name: "Code Review", description: "Review pull requests for correctness, security, and maintainability.", category: "Development", enabled: true, workspace_id: workspace.id},
  %{name: "System Architecture", description: "Design scalable, resilient system architectures and make technology decisions.", category: "Development", enabled: true, workspace_id: workspace.id},
  %{name: "AI/ML Engineering", description: "Build and deploy machine learning models, NLP pipelines, and data science workflows.", category: "Development", enabled: true, workspace_id: workspace.id},
  # Security skills
  %{name: "Penetration Testing", description: "Conduct web application, network, and infrastructure penetration tests.", category: "Analysis", enabled: true, workspace_id: workspace.id},
  %{name: "Vulnerability Assessment", description: "Identify, classify, and prioritize security vulnerabilities.", category: "Analysis", enabled: true, workspace_id: workspace.id},
  %{name: "Security Report Writing", description: "Write detailed security assessment reports with findings and remediation guidance.", category: "Communication", enabled: true, workspace_id: workspace.id},
  %{name: "Compliance Auditing", description: "Audit systems against SOC2, ISO 27001, GDPR, and other compliance frameworks.", category: "Analysis", enabled: true, workspace_id: workspace.id},
  # Product & operations skills
  %{name: "Product Management", description: "Define product strategy, write specs, and manage product backlogs.", category: "Operations", enabled: true, workspace_id: workspace.id},
  %{name: "Agile Facilitation", description: "Run sprints, standups, retrospectives, and backlog grooming sessions.", category: "Operations", enabled: true, workspace_id: workspace.id},
  %{name: "Client Relations", description: "Manage client communications, onboarding, and engagement lifecycle.", category: "Communication", enabled: true, workspace_id: workspace.id},
  %{name: "Talent Assessment", description: "Evaluate candidate applications, conduct assessments, and make hiring recommendations.", category: "Analysis", enabled: true, workspace_id: workspace.id},
  %{name: "Community Management", description: "Build and engage online and offline communities around NULLHACK programs.", category: "Communication", enabled: true, workspace_id: workspace.id},
  # Business skills
  %{name: "B2B Sales", description: "Drive enterprise sales pipeline from prospecting to close.", category: "Communication", enabled: true, workspace_id: workspace.id},
  %{name: "Partnership Development", description: "Identify, negotiate, and close strategic partnerships.", category: "Communication", enabled: true, workspace_id: workspace.id},
  %{name: "Content Marketing", description: "Create compelling content across blogs, social media, and events.", category: "Communication", enabled: true, workspace_id: workspace.id},
  %{name: "Brand Strategy", description: "Define and evolve brand identity, messaging, and visual design.", category: "Communication", enabled: true, workspace_id: workspace.id},
  # HR skills
  %{name: "Recruiting", description: "Source, screen, and hire talent for NULLHACK and partner companies.", category: "Operations", enabled: true, workspace_id: workspace.id},
  %{name: "HR Operations", description: "Manage onboarding, performance reviews, compensation, and compliance.", category: "Operations", enabled: true, workspace_id: workspace.id},
  %{name: "Cohort Program Operations", description: "Manage end-to-end cohort logistics: applications, scheduling, mentor matching, progress tracking.", category: "Operations", enabled: true, workspace_id: workspace.id},
  # Advisory skills
  %{name: "Strategic Advisory", description: "Provide high-level strategic guidance on company direction and market positioning.", category: "Analysis", enabled: true, workspace_id: workspace.id},
  %{name: "Network Brokering", description: "Connect people and organizations within the European tech ecosystem.", category: "Communication", enabled: true, workspace_id: workspace.id}
]

for attrs <- skills_data do
  unless Repo.exists?(from s in Skill, where: s.workspace_id == ^workspace.id and s.name == ^attrs.name) do
    Repo.insert!(Skill.changeset(%Skill{}, attrs))
  end
end

# Fetch all skills for linking
skill_backend = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Backend Development")
skill_frontend = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Frontend Development")
skill_infra = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Infrastructure & DevOps")
skill_code_review = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Code Review")
skill_sys_arch = Repo.get_by!(Skill, workspace_id: workspace.id, name: "System Architecture")
skill_ai_ml = Repo.get_by!(Skill, workspace_id: workspace.id, name: "AI/ML Engineering")
skill_pentest = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Penetration Testing")
skill_vuln = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Vulnerability Assessment")
skill_sec_report = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Security Report Writing")
skill_compliance = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Compliance Auditing")
skill_product = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Product Management")
skill_agile = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Agile Facilitation")
skill_client = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Client Relations")
skill_talent = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Talent Assessment")
skill_community = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Community Management")
skill_sales = Repo.get_by!(Skill, workspace_id: workspace.id, name: "B2B Sales")
skill_partnership = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Partnership Development")
skill_content = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Content Marketing")
skill_brand = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Brand Strategy")
skill_recruiting = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Recruiting")
skill_hr_ops = Repo.get_by!(Skill, workspace_id: workspace.id, name: "HR Operations")
skill_cohort_ops = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Cohort Program Operations")
skill_strategic = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Strategic Advisory")
skill_network = Repo.get_by!(Skill, workspace_id: workspace.id, name: "Network Brokering")

# Agent-skill mappings (3-4 skills per agent)
agent_skill_links = [
  # Adit (CTO): System Architecture, AI/ML, Code Review, Backend Dev
  {adit.id, skill_sys_arch.id},
  {adit.id, skill_ai_ml.id},
  {adit.id, skill_code_review.id},
  {adit.id, skill_backend.id},
  # Ijti (COO): Product Management, Agile Facilitation, AI/ML, System Architecture
  {ijti.id, skill_product.id},
  {ijti.id, skill_agile.id},
  {ijti.id, skill_ai_ml.id},
  {ijti.id, skill_sys_arch.id},
  # Artem (Advisor): Strategic Advisory, Partnership Development, Network Brokering
  {artem.id, skill_strategic.id},
  {artem.id, skill_partnership.id},
  {artem.id, skill_network.id},
  # Samuli (Advisor): Network Brokering, Talent Assessment, Strategic Advisory
  {samuli.id, skill_network.id},
  {samuli.id, skill_talent.id},
  {samuli.id, skill_strategic.id},
  # Kael (Backend): Backend Dev, Code Review, Infrastructure
  {kael.id, skill_backend.id},
  {kael.id, skill_code_review.id},
  {kael.id, skill_infra.id},
  # Zara (Frontend): Frontend Dev, Code Review, Brand Strategy
  {zara.id, skill_frontend.id},
  {zara.id, skill_code_review.id},
  {zara.id, skill_brand.id},
  # Rune (Fullstack): Infrastructure, Backend Dev, Frontend Dev
  {rune.id, skill_infra.id},
  {rune.id, skill_backend.id},
  {rune.id, skill_frontend.id},
  # Cipher (Security): Penetration Testing, Vulnerability Assessment, Security Report Writing, Compliance
  {cipher.id, skill_pentest.id},
  {cipher.id, skill_vuln.id},
  {cipher.id, skill_sec_report.id},
  {cipher.id, skill_compliance.id},
  # Nova (Product): Product Management, Agile Facilitation, Client Relations
  {nova.id, skill_product.id},
  {nova.id, skill_agile.id},
  {nova.id, skill_client.id},
  # Sage (Client Support): Client Relations, Security Report Writing, Community Management
  {sage.id, skill_client.id},
  {sage.id, skill_sec_report.id},
  {sage.id, skill_community.id},
  # Echo (Cohort Support): Cohort Program Operations, Community Management, Talent Assessment
  {echo.id, skill_cohort_ops.id},
  {echo.id, skill_community.id},
  {echo.id, skill_talent.id},
  # Aria (HR): Recruiting, HR Operations, Talent Assessment, Cohort Program Operations
  {aria.id, skill_recruiting.id},
  {aria.id, skill_hr_ops.id},
  {aria.id, skill_talent.id},
  {aria.id, skill_cohort_ops.id},
  # Vex (Sales): B2B Sales, Partnership Development, Client Relations
  {vex.id, skill_sales.id},
  {vex.id, skill_partnership.id},
  {vex.id, skill_client.id},
  # Pixel (Marketing): Content Marketing, Brand Strategy, Community Management, Network Brokering
  {pixel.id, skill_content.id},
  {pixel.id, skill_brand.id},
  {pixel.id, skill_community.id},
  {pixel.id, skill_network.id}
]

for {agent_id, skill_id} <- agent_skill_links do
  # Dump UUIDs to raw binary for the join table (no Ecto schema)
  {:ok, agent_bin} = Ecto.UUID.dump(agent_id)
  {:ok, skill_bin} = Ecto.UUID.dump(skill_id)

  unless Repo.exists?(
           from as in "agent_skills",
             where: as.agent_id == ^agent_bin and as.skill_id == ^skill_bin
         ) do
    Repo.insert_all("agent_skills", [%{agent_id: agent_bin, skill_id: skill_bin, enabled: true}])
  end
end

IO.puts("    24 skills created, #{length(agent_skill_links)} agent-skill links")

# ===========================================================================
# SECTION 15: Memory Entries (2-3 per agent)
# ===========================================================================

IO.puts("[15/20] Memory entries...")

memory_entries_data = [
  # Adit (CTO)
  %{key: "adit/background", content: "Aalto University data science, NLP developer at Singapore Management University, ML engineer at The Asia Foundation, deep learning researcher. Building satellite AI (Detour project at TreeHacks).", category: "profile", tags: ["background", "education", "experience"], workspace_id: workspace.id, agent_id: adit.id},
  %{key: "adit/tech-stack-preferences", content: "Preferred stack: Elixir/Phoenix for backend, SvelteKit for frontend, PostgreSQL for data, Docker + GitHub Actions for CI/CD. For ML: Python, PyTorch, HuggingFace. Favors functional programming patterns.", category: "preferences", tags: ["tech-stack", "architecture"], workspace_id: workspace.id, agent_id: adit.id},
  %{key: "adit/architecture-decisions", content: "ADR-001: Use adapter pattern for multi-model support. ADR-002: Event-driven architecture for agent communication. ADR-003: PostgreSQL JSONB for flexible metadata storage. ADR-004: Budget enforcement at the middleware layer.", category: "decisions", tags: ["architecture", "adr"], workspace_id: workspace.id, agent_id: adit.id},
  # Ijti (COO)
  %{key: "ijti/background", content: "MSc Mathematics and BSc Computational Engineering from Aalto University. Founding Engineer at Kova Labs. AI role at Supercell. Published game developer: Maze Maverick and Blood Pivot on Steam. Research at Aalto Computational Behavior Lab and King Abdulaziz University.", category: "profile", tags: ["background", "education", "experience"], workspace_id: workspace.id, agent_id: ijti.id},
  %{key: "ijti/operational-playbook", content: "Sprint cadence: 2-week sprints. Standups: daily 9 AM UTC. Retros: every other Friday. Budget reviews: monthly on the 1st. Agent performance reviews: bi-weekly. Escalation path: agent -> team lead -> department head -> COO -> Founder.", category: "operations", tags: ["process", "cadence", "escalation"], workspace_id: workspace.id, agent_id: ijti.id},
  %{key: "ijti/budget-allocation", content: "Monthly budget: $10,000. Engineering: 40%, Operations: 35%, Growth: 25%. Per-agent cap: $500/month. Warning threshold: 80%. Hard stop at 100% unless manually overridden by Founder.", category: "budget", tags: ["budget", "allocation", "policy"], workspace_id: workspace.id, agent_id: ijti.id},
  # Artem (Advisor)
  %{key: "artem/background", content: "Co-founded Null Fellows. Deep European startup ecosystem connections. Vitalism Foundation involvement. Event organizer connecting young builders with growth companies. 9 out of 10 fellows placed received continuation offers with 2-3x salary.", category: "profile", tags: ["background", "network", "experience"], workspace_id: workspace.id, agent_id: artem.id},
  %{key: "artem/partner-strategy", content: "Target partner companies: European growth-stage startups (Series A-C) in fintech, healthtech, and enterprise SaaS. Key markets: Finland, Germany, UK, Netherlands. Ideal partners have 50-500 employees and active engineering hiring.", category: "strategy", tags: ["partners", "market", "cohort"], workspace_id: workspace.id, agent_id: artem.id},
  # Samuli (Advisor)
  %{key: "samuli/background", content: "Aalto University. Truth seeker and aspiring polymath. Deep connections in Finnish and European tech ecosystem. Focused on talent acquisition strategy and community building.", category: "profile", tags: ["background", "network"], workspace_id: workspace.id, agent_id: samuli.id},
  %{key: "samuli/talent-criteria", content: "Top cohort candidate traits: strong CS fundamentals, open-source contributions, hackathon experience, adaptability, communication skills. Red flags: no side projects, inability to explain past work, lack of curiosity.", category: "talent", tags: ["hiring", "criteria", "cohort"], workspace_id: workspace.id, agent_id: samuli.id},
  # Kael (Backend)
  %{key: "kael/api-conventions", content: "REST API conventions: plural resource names, snake_case for JSON keys, UUID primary keys, cursor-based pagination, consistent error envelope {error: {code, message, details}}. Auth: Bearer JWT in Authorization header.", category: "conventions", tags: ["api", "backend", "standards"], workspace_id: workspace.id, agent_id: kael.id},
  %{key: "kael/db-schema-notes", content: "All tables use binary_id (UUID) primary keys. Soft deletes not implemented yet — use status fields. JSONB columns for flexible metadata. Ecto changesets enforce all validations. Migrations are forward-only.", category: "database", tags: ["database", "schema", "ecto"], workspace_id: workspace.id, agent_id: kael.id},
  %{key: "kael/current-sprint-focus", content: "Sprint focus: engagement status API endpoints, application screening pipeline, partner directory API. Blocked on: schema design for matching algorithm (waiting on Nova's spec).", category: "sprint", tags: ["sprint", "status", "blockers"], workspace_id: workspace.id, agent_id: kael.id},
  # Zara (Frontend)
  %{key: "zara/design-system", content: "NULLHACK design system: dark theme primary, accent color #8b5cf6 (purple). Font: Inter. Component library: custom Svelte components. Icons: Lucide. Spacing: 4px grid. Breakpoints: mobile 640px, tablet 1024px, desktop 1280px.", category: "design", tags: ["design-system", "frontend", "ui"], workspace_id: workspace.id, agent_id: zara.id},
  %{key: "zara/component-inventory", content: "Core components built: Button, Input, Card, Modal, Table, Badge, Avatar, Sidebar, TopNav. In progress: MultiStepForm, FileUpload, RichTextEditor. Needed: DataGrid, Chart, KanbanBoard.", category: "components", tags: ["svelte", "components", "inventory"], workspace_id: workspace.id, agent_id: zara.id},
  # Rune (Infra)
  %{key: "rune/infra-topology", content: "Current infrastructure: Docker Compose for local dev, GitHub Actions for CI/CD, fly.io for staging. Production target: AWS ECS or fly.io Machines. Database: managed PostgreSQL. Monitoring: planned Grafana + Prometheus.", category: "infrastructure", tags: ["devops", "topology", "deployment"], workspace_id: workspace.id, agent_id: rune.id},
  %{key: "rune/ci-cd-pipeline", content: "CI pipeline stages: lint (credo + eslint) -> test (ExUnit + vitest) -> build (Docker) -> deploy (staging auto, production manual). Build time target: under 5 minutes. Deployment: blue-green with health check gates.", category: "ci-cd", tags: ["ci-cd", "pipeline", "deployment"], workspace_id: workspace.id, agent_id: rune.id},
  %{key: "rune/security-hardening", content: "Security checklist: TLS everywhere, CSP headers, rate limiting on auth endpoints, dependency audit (mix audit + npm audit), container image scanning, secrets in environment variables (never in code).", category: "security", tags: ["security", "hardening", "checklist"], workspace_id: workspace.id, agent_id: rune.id},
  # Cipher (Security)
  %{key: "cipher/methodology", content: "Assessment methodology: OWASP Testing Guide v4.2 + PTES. Phases: reconnaissance, enumeration, vulnerability identification, exploitation, post-exploitation, reporting. Tools: Burp Suite, OWASP ZAP, Nuclei, nmap, ffuf, sqlmap.", category: "methodology", tags: ["security", "pentest", "owasp"], workspace_id: workspace.id, agent_id: cipher.id},
  %{key: "cipher/report-template", content: "Security report structure: Executive Summary, Scope & Methodology, Findings (Critical/High/Medium/Low/Info), Evidence, Remediation Guidance, Appendix. Each finding includes: description, impact, evidence (screenshots), remediation steps, CVSS score.", category: "reporting", tags: ["security", "report", "template"], workspace_id: workspace.id, agent_id: cipher.id},
  %{key: "cipher/compliance-frameworks", content: "Supported compliance frameworks: SOC2 Type II (Trust Services Criteria), ISO 27001 (Annex A controls), GDPR (Articles 25, 32, 35), PCI DSS v4.0. Most clients need SOC2 + GDPR combination.", category: "compliance", tags: ["compliance", "soc2", "gdpr", "iso27001"], workspace_id: workspace.id, agent_id: cipher.id},
  # Nova (Product)
  %{key: "nova/product-roadmap", content: "Q1 2026: Client Portal MVP + Cohort Application System. Q2 2026: Automated Scanning Pipeline + Partner Matching. Q3 2026: Partner CRM + Analytics Dashboard. Q4 2026: Self-service security assessments + Cohort v2.", category: "roadmap", tags: ["product", "roadmap", "timeline"], workspace_id: workspace.id, agent_id: nova.id},
  %{key: "nova/prioritization-framework", content: "Prioritization: RICE framework (Reach x Impact x Confidence / Effort). Critical bugs override all priorities. Security issues are always P0. Customer-reported issues get 24h response SLA.", category: "process", tags: ["prioritization", "rice", "product"], workspace_id: workspace.id, agent_id: nova.id},
  # Sage (Client Support)
  %{key: "sage/sla-definitions", content: "Client SLAs: Initial response within 4 business hours. Status update every 48 hours during engagement. Draft report within 5 business days of testing completion. Final report within 2 business days of client feedback.", category: "sla", tags: ["sla", "support", "client"], workspace_id: workspace.id, agent_id: sage.id},
  %{key: "sage/escalation-matrix", content: "Escalation matrix: Tier 1 (Sage): general inquiries, scheduling. Tier 2 (Cipher): technical findings questions. Tier 3 (Adit): architecture concerns, major scope changes. Tier 4 (Founder): contract disputes, SLA breaches.", category: "escalation", tags: ["escalation", "support", "tiers"], workspace_id: workspace.id, agent_id: sage.id},
  # Echo (Cohort Support)
  %{key: "echo/cohort-lifecycle", content: "Cohort lifecycle: Application Open (4 weeks) -> Screening (2 weeks) -> Assessment (1 week) -> Matching (1 week) -> Onboarding (1 week) -> Program (12 weeks) -> Placement (ongoing). Total cycle: ~22 weeks.", category: "process", tags: ["cohort", "lifecycle", "timeline"], workspace_id: workspace.id, agent_id: echo.id},
  %{key: "echo/communication-templates", content: "Key email templates: Application Received, Screening Passed, Assessment Invitation, Match Notification, Onboarding Welcome, Weekly Check-in, Program Completion, Placement Congratulations.", category: "templates", tags: ["email", "communication", "cohort"], workspace_id: workspace.id, agent_id: echo.id},
  # Aria (HR)
  %{key: "aria/hiring-process", content: "Internal hiring process: Role definition -> Job posting -> Resume screening -> Technical assessment -> Culture interview -> Reference check -> Offer. Target time-to-hire: 3 weeks. Candidate experience NPS target: 70+.", category: "hiring", tags: ["hiring", "process", "hr"], workspace_id: workspace.id, agent_id: aria.id},
  %{key: "aria/compensation-bands", content: "Compensation philosophy: 75th percentile of European tech market. Review cycle: annually with mid-year adjustment for promotions. Equity: available for leadership roles. Benefits: remote-first, learning budget, conference attendance.", category: "compensation", tags: ["compensation", "benefits", "hr"], workspace_id: workspace.id, agent_id: aria.id},
  # Vex (Sales)
  %{key: "vex/sales-pipeline", content: "Sales pipeline stages: Lead -> Qualified -> Proposal -> Negotiation -> Closed Won/Lost. Security consultancy average deal size: EUR 15,000-50,000. Partner program: EUR 5,000-15,000 per placement. Target: 5 new security clients + 10 partners per quarter.", category: "sales", tags: ["pipeline", "targets", "revenue"], workspace_id: workspace.id, agent_id: vex.id},
  %{key: "vex/pricing-model", content: "Security consultancy pricing: Web App Pentest EUR 8,000-25,000. Network Assessment EUR 10,000-30,000. Full Security Audit EUR 25,000-75,000. Compliance Gap Analysis EUR 5,000-15,000. {} Hack partner fee: EUR 5,000 base + EUR 2,500 per successful hire.", category: "pricing", tags: ["pricing", "revenue", "model"], workspace_id: workspace.id, agent_id: vex.id},
  %{key: "vex/icp-definition", content: "Ideal Customer Profile: European tech companies (50-500 employees), Series A-C funded, processing sensitive data, approaching compliance deadlines (SOC2/GDPR), no dedicated security team.", category: "sales", tags: ["icp", "targeting", "customers"], workspace_id: workspace.id, agent_id: vex.id},
  # Pixel (Marketing)
  %{key: "pixel/brand-guidelines", content: "NULLHACK brand: professional yet approachable. Primary color: #1a1a2e (dark navy). Accent: #8b5cf6 (purple). Typography: Space Grotesk (headings), Inter (body). Tone: authoritative, clear, slightly edgy. Never use jargon without explanation.", category: "brand", tags: ["brand", "design", "guidelines"], workspace_id: workspace.id, agent_id: pixel.id},
  %{key: "pixel/content-calendar", content: "Weekly content: 2 LinkedIn posts, 1 blog article, 1 Twitter/X thread. Monthly: 1 case study, 1 webinar, 1 newsletter. Quarterly: 1 security trends report. Topics: security insights, cohort success stories, partner spotlights, team culture.", category: "content", tags: ["content", "calendar", "marketing"], workspace_id: workspace.id, agent_id: pixel.id},
  %{key: "pixel/channel-strategy", content: "Primary channels: LinkedIn (B2B + talent), Twitter/X (security community), Blog (SEO + thought leadership). Secondary: YouTube (webinars), GitHub (open-source credibility). Events: Junction hackathon, Slush, local security meetups.", category: "channels", tags: ["channels", "marketing", "social"], workspace_id: workspace.id, agent_id: pixel.id}
]

for attrs <- memory_entries_data do
  unless Repo.exists?(from m in MemoryEntry, where: m.workspace_id == ^workspace.id and m.key == ^attrs.key) do
    Repo.insert!(MemoryEntry.changeset(%MemoryEntry{}, attrs))
  end
end

IO.puts("    #{length(memory_entries_data)} memory entries across 14 agents")

# ===========================================================================
# SECTION 16: Datasets
# ===========================================================================

IO.puts("[16/20] Datasets...")

datasets_data = [
  %{
    name: "Client Engagement Log",
    slug: "client-engagement-log",
    description: "Security consultancy client engagements: company, scope, status, findings count, revenue, dates.",
    source_type: "agent_generated",
    format: "json",
    workspace_id: workspace.id,
    created_by_agent_id: sage.id,
    row_count: 47,
    size_bytes: 128_000,
    status: "active",
    tags: ["clients", "engagements", "security"]
  },
  %{
    name: "Cohort Applications",
    slug: "cohort-applications",
    description: "Applicant tracking: personal info, scores, status, assessment results, match outcomes.",
    source_type: "agent_generated",
    format: "json",
    workspace_id: workspace.id,
    created_by_agent_id: echo.id,
    row_count: 312,
    size_bytes: 890_000,
    status: "active",
    tags: ["cohort", "applications", "talent"]
  },
  %{
    name: "Partner Companies",
    slug: "partner-companies",
    description: "Partner directory: company profiles, contacts, hiring preferences, engagement history, satisfaction scores.",
    source_type: "agent_generated",
    format: "json",
    workspace_id: workspace.id,
    created_by_agent_id: vex.id,
    row_count: 28,
    size_bytes: 64_000,
    status: "active",
    tags: ["partners", "companies", "directory"]
  },
  %{
    name: "Security Findings",
    slug: "security-findings",
    description: "Vulnerability database: CVE references, CVSS scores, affected systems, remediation status, client association.",
    source_type: "agent_generated",
    format: "json",
    workspace_id: workspace.id,
    created_by_agent_id: cipher.id,
    row_count: 1_247,
    size_bytes: 2_400_000,
    status: "active",
    tags: ["security", "vulnerabilities", "findings"]
  },
  %{
    name: "Talent Assessments",
    slug: "talent-assessments",
    description: "Candidate evaluations: technical scores, culture fit, communication, recommendations, placement outcomes.",
    source_type: "agent_generated",
    format: "csv",
    workspace_id: workspace.id,
    created_by_agent_id: aria.id,
    row_count: 189,
    size_bytes: 156_000,
    status: "active",
    tags: ["talent", "assessments", "evaluations"]
  }
]

for attrs <- datasets_data do
  unless Repo.exists?(from d in Dataset, where: d.workspace_id == ^workspace.id and d.slug == ^attrs.slug) do
    Repo.insert!(Dataset.changeset(%Dataset{}, attrs))
  end
end

IO.puts("    5 datasets: client-engagement-log, cohort-applications, partner-companies, security-findings, talent-assessments")

# ===========================================================================
# SECTION 17: Workflows
# ===========================================================================

IO.puts("[17/20] Workflows...")

# -- Workflow 1: Security Assessment Pipeline --
unless Repo.exists?(from w in Workflow, where: w.workspace_id == ^workspace.id and w.slug == "security-assessment-pipeline") do
  Repo.insert!(
    Workflow.changeset(%Workflow{}, %{
      name: "Security Assessment Pipeline",
      slug: "security-assessment-pipeline",
      description: "End-to-end security engagement: intake, scoping, testing, report writing, and client delivery.",
      workspace_id: workspace.id,
      organization_id: nullhack_org.id,
      status: "active",
      trigger_type: "event",
      trigger_config: %{event: "engagement.created", source: "client_portal"},
      created_by: "admin@canopy.dev",
      version: 1
    })
  )
end

sec_pipeline = Repo.get_by!(Workflow, workspace_id: workspace.id, slug: "security-assessment-pipeline")

sec_pipeline_steps = [
  %{workflow_id: sec_pipeline.id, agent_id: sage.id, name: "Client intake & scoping", step_type: "agent_task", position: 1, config: %{prompt: "Process the new client engagement request. Verify scope, confirm SLA terms, and create the engagement brief."}, timeout_seconds: 300},
  %{workflow_id: sec_pipeline.id, agent_id: cipher.id, name: "Execute security testing", step_type: "agent_task", position: 2, config: %{prompt: "Run the security assessment per the engagement brief. Use automated scanners first, then manual testing. Document all findings with evidence."}, timeout_seconds: 3600},
  %{workflow_id: sec_pipeline.id, agent_id: cipher.id, name: "Write assessment report", step_type: "agent_task", position: 3, config: %{prompt: "Compile findings into the standard report template. Include executive summary, detailed findings, CVSS scores, and remediation guidance."}, timeout_seconds: 1800},
  %{workflow_id: sec_pipeline.id, agent_id: sage.id, name: "Deliver report to client", step_type: "agent_task", position: 4, config: %{prompt: "Send the final report to the client. Schedule a findings walkthrough meeting. Update the engagement status to delivered."}, timeout_seconds: 300}
]

for attrs <- sec_pipeline_steps do
  unless Repo.exists?(from s in WorkflowStep, where: s.workflow_id == ^sec_pipeline.id and s.position == ^attrs.position) do
    Repo.insert!(WorkflowStep.changeset(%WorkflowStep{}, attrs))
  end
end

# -- Workflow 2: Cohort Application Pipeline --
unless Repo.exists?(from w in Workflow, where: w.workspace_id == ^workspace.id and w.slug == "cohort-application-pipeline") do
  Repo.insert!(
    Workflow.changeset(%Workflow{}, %{
      name: "Cohort Application Pipeline",
      slug: "cohort-application-pipeline",
      description: "Process cohort applications: receive, screen, assess, match with partners, and onboard.",
      workspace_id: workspace.id,
      organization_id: nullhack_org.id,
      status: "active",
      trigger_type: "event",
      trigger_config: %{event: "application.submitted", source: "cohort_portal"},
      created_by: "admin@canopy.dev",
      version: 1
    })
  )
end

cohort_pipeline = Repo.get_by!(Workflow, workspace_id: workspace.id, slug: "cohort-application-pipeline")

cohort_pipeline_steps = [
  %{workflow_id: cohort_pipeline.id, agent_id: echo.id, name: "Receive & acknowledge application", step_type: "agent_task", position: 1, config: %{prompt: "Acknowledge the new application. Send confirmation email. Run initial data validation checks."}, timeout_seconds: 120},
  %{workflow_id: cohort_pipeline.id, agent_id: aria.id, name: "Screen application", step_type: "agent_task", position: 2, config: %{prompt: "Score the application against cohort criteria. Check for red flags. Recommend: advance, hold, or reject."}, timeout_seconds: 600},
  %{workflow_id: cohort_pipeline.id, agent_id: aria.id, name: "Conduct technical assessment", step_type: "agent_task", position: 3, config: %{prompt: "Evaluate technical skills based on portfolio, GitHub, and assessment tasks. Generate detailed skill profile."}, timeout_seconds: 900, on_failure: "skip"},
  %{workflow_id: cohort_pipeline.id, agent_id: echo.id, name: "Match with partner companies", step_type: "agent_task", position: 4, config: %{prompt: "Run matching algorithm against active partner company openings. Present top 3 matches with confidence scores."}, timeout_seconds: 300},
  %{workflow_id: cohort_pipeline.id, agent_id: echo.id, name: "Onboard accepted candidate", step_type: "agent_task", position: 5, config: %{prompt: "Send welcome package. Schedule orientation. Assign mentor. Set up cohort tools access."}, timeout_seconds: 300}
]

for attrs <- cohort_pipeline_steps do
  unless Repo.exists?(from s in WorkflowStep, where: s.workflow_id == ^cohort_pipeline.id and s.position == ^attrs.position) do
    Repo.insert!(WorkflowStep.changeset(%WorkflowStep{}, attrs))
  end
end

# -- Workflow 3: Daily Standup --
unless Repo.exists?(from w in Workflow, where: w.workspace_id == ^workspace.id and w.slug == "nullhack-daily-standup") do
  Repo.insert!(
    Workflow.changeset(%Workflow{}, %{
      name: "Daily Standup",
      slug: "nullhack-daily-standup",
      description: "Morning standup: each team lead reports status, blockers, and today's priorities.",
      workspace_id: workspace.id,
      organization_id: nullhack_org.id,
      status: "active",
      trigger_type: "schedule",
      trigger_config: %{cron: "0 9 * * 1-5", timezone: "UTC"},
      created_by: "admin@canopy.dev",
      version: 1
    })
  )
end

standup_wf = Repo.get_by!(Workflow, workspace_id: workspace.id, slug: "nullhack-daily-standup")

standup_steps = [
  %{workflow_id: standup_wf.id, agent_id: nova.id, name: "Gather team status reports", step_type: "agent_task", position: 1, config: %{prompt: "Collect status updates from all team leads. Summarize yesterday's completions, today's plans, and any blockers."}, timeout_seconds: 300},
  %{workflow_id: standup_wf.id, agent_id: nova.id, name: "Post standup summary", step_type: "agent_task", position: 2, config: %{prompt: "Format and post the standup summary to the activity feed. Highlight blockers and escalate if needed."}, timeout_seconds: 120}
]

for attrs <- standup_steps do
  unless Repo.exists?(from s in WorkflowStep, where: s.workflow_id == ^standup_wf.id and s.position == ^attrs.position) do
    Repo.insert!(WorkflowStep.changeset(%WorkflowStep{}, attrs))
  end
end

# -- Workflow 4: Weekly Strategy Review --
unless Repo.exists?(from w in Workflow, where: w.workspace_id == ^workspace.id and w.slug == "weekly-strategy-review") do
  Repo.insert!(
    Workflow.changeset(%Workflow{}, %{
      name: "Weekly Strategy Review",
      slug: "weekly-strategy-review",
      description: "Monday leadership sync: review KPIs, pipeline health, budget status, and strategic priorities.",
      workspace_id: workspace.id,
      organization_id: nullhack_org.id,
      status: "active",
      trigger_type: "schedule",
      trigger_config: %{cron: "0 14 * * 1", timezone: "UTC"},
      created_by: "admin@canopy.dev",
      version: 1
    })
  )
end

strategy_wf = Repo.get_by!(Workflow, workspace_id: workspace.id, slug: "weekly-strategy-review")

strategy_steps = [
  %{workflow_id: strategy_wf.id, agent_id: ijti.id, name: "Compile weekly metrics", step_type: "agent_task", position: 1, config: %{prompt: "Gather KPIs: revenue pipeline, cohort application count, active engagements, budget burn rate, issue velocity."}, timeout_seconds: 600},
  %{workflow_id: strategy_wf.id, agent_id: artem.id, name: "Partnership update", step_type: "agent_task", position: 2, config: %{prompt: "Report on partner acquisition progress, new leads, and partnership health scores."}, timeout_seconds: 300},
  %{workflow_id: strategy_wf.id, agent_id: adit.id, name: "Technical review & decisions", step_type: "agent_task", position: 3, config: %{prompt: "Review open architectural decisions, critical bugs, and technical debt. Make go/no-go calls on pending items."}, timeout_seconds: 300}
]

for attrs <- strategy_steps do
  unless Repo.exists?(from s in WorkflowStep, where: s.workflow_id == ^strategy_wf.id and s.position == ^attrs.position) do
    Repo.insert!(WorkflowStep.changeset(%WorkflowStep{}, attrs))
  end
end

IO.puts("    4 workflows: Security Assessment (4 steps), Cohort Application (5 steps), Daily Standup (2 steps), Weekly Strategy (3 steps)")

# ===========================================================================
# SECTION 18: Schedules
# ===========================================================================

IO.puts("[18/20] Schedules...")

schedules_data = [
  %{
    name: "Daily standup",
    cron_expression: "0 9 * * 1-5",
    context: "Run daily standup workflow: gather status from all team leads, post summary, flag blockers.",
    enabled: true,
    timezone: "UTC",
    workspace_id: workspace.id,
    agent_id: nova.id
  },
  %{
    name: "Weekly strategy review",
    cron_expression: "0 14 * * 1",
    context: "Monday leadership sync: compile KPIs, review pipeline, discuss strategic priorities.",
    enabled: true,
    timezone: "UTC",
    workspace_id: workspace.id,
    agent_id: ijti.id
  },
  %{
    name: "Monthly report generation",
    cron_expression: "0 8 1 * *",
    context: "Generate monthly reports: revenue, cohort metrics, security engagement summary, budget analysis.",
    enabled: true,
    timezone: "UTC",
    workspace_id: workspace.id,
    agent_id: nova.id
  }
]

for attrs <- schedules_data do
  unless Repo.exists?(from s in Schedule, where: s.workspace_id == ^workspace.id and s.name == ^attrs.name) do
    Repo.insert!(Schedule.changeset(%Schedule{}, attrs))
  end
end

IO.puts("    3 schedules: daily standup (9 AM UTC weekdays), weekly review (Mon 2 PM UTC), monthly report (1st of month)")

# ===========================================================================
# SECTION 19: Notifications
# ===========================================================================

IO.puts("[19/20] Notifications...")

notifications_data = [
  %{
    workspace_id: workspace.id,
    recipient_type: "broadcast",
    sender_type: "system",
    category: "system",
    severity: "info",
    title: "Welcome to NULLHACK",
    body: "The NULLHACK workspace is live. 14 agents are online across 3 divisions. Let's secure the future.",
    action_url: "/dashboard"
  },
  %{
    workspace_id: workspace.id,
    recipient_type: "user",
    recipient_id: admin.id,
    sender_type: "system",
    category: "system",
    severity: "info",
    title: "Organization setup complete",
    body: "NULLHACK organization with 3 divisions, 6 departments, and 8 teams is fully configured.",
    action_url: "/org/nullhack",
    action_label: "View Org"
  },
  %{
    workspace_id: workspace.id,
    recipient_type: "agent",
    recipient_id: cipher.id,
    sender_type: "agent",
    sender_id: sage.id,
    category: "task",
    severity: "info",
    title: "New security engagement: TechCorp Web Assessment",
    body: "TechCorp has submitted a web application penetration test request. Scope: 3 web apps, 2 APIs. Timeline: 2 weeks.",
    action_url: "/issues",
    action_label: "View Engagement"
  },
  %{
    workspace_id: workspace.id,
    recipient_type: "agent",
    recipient_id: echo.id,
    sender_type: "system",
    category: "task",
    severity: "info",
    title: "15 new cohort applications received",
    body: "15 applications for {} Hack Batch 2 were submitted this week. 3 flagged as high-potential. Begin screening.",
    action_url: "/issues",
    action_label: "Review Applications"
  },
  %{
    workspace_id: workspace.id,
    recipient_type: "user",
    recipient_id: admin.id,
    sender_type: "agent",
    sender_id: vex.id,
    category: "alert",
    severity: "info",
    title: "Partner deal: FinSecure signed",
    body: "FinSecure (Helsinki, 120 employees) signed as a {} Hack partner company. First placement expected Q2 2026.",
    action_url: "/projects",
    action_label: "View Partners"
  },
  %{
    workspace_id: workspace.id,
    recipient_type: "user",
    recipient_id: admin.id,
    sender_type: "system",
    category: "budget",
    severity: "warning",
    title: "Engineering division at 65% budget",
    body: "Engineering division has consumed $2,600 of its $4,000 monthly budget with 12 days remaining.",
    action_url: "/budget",
    action_label: "View Budget"
  }
]

for attrs <- notifications_data do
  Repo.insert!(
    Notification.changeset(%Notification{}, attrs),
    on_conflict: :nothing
  )
end

IO.puts("    6 notifications: welcome, setup complete, engagement, applications, partner deal, budget warning")

# ===========================================================================
# SECTION 20: Budget Policies & Activity Events
# ===========================================================================

IO.puts("[20/20] Budget policies & activity events...")

# -- Budget Policies --

# Organization-wide: $10,000/month
unless Repo.exists?(from b in BudgetPolicy, where: b.scope_type == "organization" and b.scope_id == ^nullhack_org.id) do
  Repo.insert!(
    BudgetPolicy.changeset(%BudgetPolicy{}, %{
      scope_type: "organization",
      scope_id: nullhack_org.id,
      monthly_limit_cents: 1_000_000,
      warning_threshold_pct: 80,
      hard_stop: true
    })
  )
end

# Per-agent: $500/month for each of the 14 agents
all_agents = [adit, ijti, artem, samuli, kael, zara, rune, cipher, nova, sage, echo, aria, vex, pixel]

for agent <- all_agents do
  unless Repo.exists?(from b in BudgetPolicy, where: b.scope_type == "agent" and b.scope_id == ^agent.id) do
    Repo.insert!(
      BudgetPolicy.changeset(%BudgetPolicy{}, %{
        scope_type: "agent",
        scope_id: agent.id,
        monthly_limit_cents: 50_000,
        warning_threshold_pct: 80,
        hard_stop: true
      })
    )
  end
end

IO.puts("    1 org budget ($10,000/mo) + 14 agent budgets ($500/mo each)")

# -- Activity Events --

now = DateTime.utc_now() |> DateTime.truncate(:second)

activity_seeds = [
  %{
    event_type: "org.created",
    message: "NULLHACK organization created with paid plan.",
    level: "info",
    metadata: %{org_slug: "nullhack", plan: "paid"},
    workspace_id: workspace.id,
    inserted_at: DateTime.add(now, -86_400 * 14, :second)
  },
  %{
    event_type: "agent.hired",
    message: "Adit (CTO) joined NULLHACK as head of Engineering.",
    level: "info",
    metadata: %{agent_slug: "adit", role: "cto"},
    workspace_id: workspace.id,
    agent_id: adit.id,
    inserted_at: DateTime.add(now, -86_400 * 13, :second)
  },
  %{
    event_type: "agent.hired",
    message: "Ijti (COO) joined NULLHACK to lead Operations.",
    level: "info",
    metadata: %{agent_slug: "ijti", role: "coo"},
    workspace_id: workspace.id,
    agent_id: ijti.id,
    inserted_at: DateTime.add(now, -86_400 * 13, :second)
  },
  %{
    event_type: "agent.hired",
    message: "Cipher joined Security Ops as Lead Security Engineer.",
    level: "info",
    metadata: %{agent_slug: "cipher", role: "security-engineer"},
    workspace_id: workspace.id,
    agent_id: cipher.id,
    inserted_at: DateTime.add(now, -86_400 * 12, :second)
  },
  %{
    event_type: "agent.hired",
    message: "Core Dev Team assembled: Kael (backend), Zara (frontend), Rune (infra).",
    level: "info",
    metadata: %{agents: ["kael", "zara", "rune"], team: "core-dev-team"},
    workspace_id: workspace.id,
    inserted_at: DateTime.add(now, -86_400 * 11, :second)
  },
  %{
    event_type: "project.created",
    message: "Project 'Security Consultancy Platform' created and set to active.",
    level: "info",
    metadata: %{project_name: "Security Consultancy Platform"},
    workspace_id: workspace.id,
    inserted_at: DateTime.add(now, -86_400 * 10, :second)
  },
  %{
    event_type: "project.created",
    message: "Project '{} Hack Cohort Program' created — applications pipeline coming soon.",
    level: "info",
    metadata: %{project_name: "{} Hack Cohort Program"},
    workspace_id: workspace.id,
    inserted_at: DateTime.add(now, -86_400 * 10, :second)
  },
  %{
    event_type: "session.completed",
    message: "Cipher completed first security assessment dry run. 12 findings documented.",
    level: "info",
    metadata: %{duration_ms: 84_600, findings_count: 12},
    workspace_id: workspace.id,
    agent_id: cipher.id,
    inserted_at: DateTime.add(now, -86_400 * 7, :second)
  },
  %{
    event_type: "issue.status_changed",
    message: "Issue 'Build client intake form with risk questionnaire' moved to in_progress by Zara.",
    level: "info",
    metadata: %{from_status: "todo", to_status: "in_progress", issue_title: "Build client intake form with risk questionnaire"},
    workspace_id: workspace.id,
    agent_id: zara.id,
    inserted_at: DateTime.add(now, -86_400 * 5, :second)
  },
  %{
    event_type: "session.completed",
    message: "Kael completed session: designed engagement status API schema with 6 endpoints.",
    level: "info",
    metadata: %{duration_ms: 67_200, endpoints_designed: 6},
    workspace_id: workspace.id,
    agent_id: kael.id,
    inserted_at: DateTime.add(now, -86_400 * 4, :second)
  },
  %{
    event_type: "workflow.completed",
    message: "Daily Standup workflow completed. 4 team leads reported. No blockers today.",
    level: "info",
    metadata: %{workflow_slug: "nullhack-daily-standup", reporters: 4, blockers: 0},
    workspace_id: workspace.id,
    inserted_at: DateTime.add(now, -86_400 * 2, :second)
  },
  %{
    event_type: "partner.signed",
    message: "FinSecure (Helsinki) signed as {} Hack partner company. First placement expected Q2.",
    level: "info",
    metadata: %{partner_name: "FinSecure", location: "Helsinki", employees: 120},
    workspace_id: workspace.id,
    agent_id: vex.id,
    inserted_at: DateTime.add(now, -86_400, :second)
  },
  %{
    event_type: "issue.status_changed",
    message: "Issue 'Setup CI/CD pipeline for all services' moved to in_progress by Rune.",
    level: "info",
    metadata: %{from_status: "todo", to_status: "in_progress", issue_title: "Setup CI/CD pipeline for all services"},
    workspace_id: workspace.id,
    agent_id: rune.id,
    inserted_at: DateTime.add(now, -86_400, :second)
  },
  %{
    event_type: "budget.warning",
    message: "Engineering division at 65% of monthly budget ($2,600 / $4,000).",
    level: "warn",
    metadata: %{spent_cents: 260_000, limit_cents: 400_000, pct: 65, scope: "division"},
    workspace_id: workspace.id,
    inserted_at: DateTime.add(now, -3_600 * 6, :second)
  },
  %{
    event_type: "session.started",
    message: "Pixel started marketing session: designing partner onboarding deck.",
    level: "info",
    metadata: %{task: "partner onboarding deck"},
    workspace_id: workspace.id,
    agent_id: pixel.id,
    inserted_at: DateTime.add(now, -3_600 * 2, :second)
  }
]

for attrs <- activity_seeds do
  Repo.insert!(
    ActivityEvent.changeset(%ActivityEvent{}, Map.drop(attrs, [:inserted_at]))
    |> Ecto.Changeset.put_change(:inserted_at, attrs.inserted_at),
    on_conflict: :nothing
  )
end

IO.puts("    15 activity events spanning the last 14 days")

# ===========================================================================
# Summary
# ===========================================================================

IO.puts("""

=== NULLHACK Seed Complete ===

  Organization    NULLHACK (paid, $10,000/month budget)
  Workspace       "NULLHACK HQ"
  Admin           admin@canopy.dev (Founder/Owner)
  Agents          14 (4 leadership + 10 AI)
  Divisions       3  (Engineering, Operations, Growth)
  Departments     6  (Platform Eng, Security, Product, People & Support, Revenue, Advisory)
  Teams           8  (Core Dev, Security Ops, Product, Support, HR, Sales, Marketing, Advisory Board)
  Memberships     14 (one per agent)
  Projects        4  (Security Platform, {} Hack Cohort, Partner Network, Operations)
  Goals           10 (hierarchical, 2-3 per project)
  Issues          10 (3 in_progress, 3 todo, 2 backlog, 1 in_review, 1 done)
  Labels          8  (urgent, security, cohort, partner, internal, bug, feature, documentation)
  Skills          24 (3-4 per agent, linked via agent_skills)
  Memory Entries  35 (2-3 per agent)
  Datasets        5  (engagement log, applications, partners, findings, assessments)
  Workflows       4  (14 steps total)
  Schedules       3  (daily, weekly, monthly)
  Notifications   6  (welcome, setup, engagement, applications, partner, budget)
  Budget Policies 15 (1 org + 14 per-agent)
  Activity Events 15 (14-day history)
""")

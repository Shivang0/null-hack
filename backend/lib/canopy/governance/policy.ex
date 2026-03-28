defmodule Canopy.Governance.Policy do
  @moduledoc """
  Governance policy configuration.

  Defines which actions require approval per workspace/organization.
  Policy is loaded from the organization's `governance` field in the DB,
  falling back to safe defaults when no configuration is present.

  Policy shape (stored as JSON in organizations.governance):
    %{
      "spawn_agent"         => %{"require_approval" => true,  "auto_approve_roles" => ["admin"]},
      "delete_agent"        => %{"require_approval" => true},
      "budget_override"     => %{"require_approval" => true,  "threshold_pct" => 100},
      "strategy_proposal"   => %{"require_approval" => true},
      "workflow_creation"   => %{"require_approval" => false},
      "integration_connect" => %{"require_approval" => false}
    }
  """

  alias Canopy.Repo
  alias Canopy.Schemas.{Workspace, Organization}
  import Ecto.Query, only: [from: 2]

  @default_policy %{
    "spawn_agent" => %{
      "require_approval" => true,
      "auto_approve_roles" => ["admin"]
    },
    "delete_agent" => %{
      "require_approval" => true
    },
    "budget_override" => %{
      "require_approval" => true,
      "threshold_pct" => 100
    },
    "strategy_proposal" => %{
      "require_approval" => true
    },
    "workflow_creation" => %{
      "require_approval" => false
    },
    "integration_connect" => %{
      "require_approval" => false
    }
  }

  @doc """
  Load the governance policy for a workspace.

  Walks workspace → organization.governance, merging org overrides on top of
  default policy. Returns a plain map keyed by action string.
  """
  def for_workspace(workspace_id) when is_binary(workspace_id) do
    org_governance =
      Repo.one(
        from w in Workspace,
          join: o in Organization,
          on: o.id == w.organization_id,
          where: w.id == ^workspace_id,
          select: o.governance
      )

    case org_governance do
      %{} = overrides when map_size(overrides) > 0 ->
        Map.merge(@default_policy, overrides)

      _ ->
        @default_policy
    end
  end

  def for_workspace(_), do: @default_policy

  @doc "Returns true if the given action_type requires approval under this policy."
  def requires_approval?(policy, action_type) do
    action_config = Map.get(policy, to_string(action_type), %{})
    Map.get(action_config, "require_approval", false)
  end

  @doc """
  Returns true if the requester's role bypasses the approval gate.
  Roles in `auto_approve_roles` skip approval creation entirely.
  """
  def auto_approved?(policy, action_type, requester_role) when is_binary(requester_role) do
    action_config = Map.get(policy, to_string(action_type), %{})
    auto_roles = Map.get(action_config, "auto_approve_roles", [])
    requester_role in auto_roles
  end

  def auto_approved?(_policy, _action_type, _role), do: false

  @doc "Expose the default policy (useful for tests and documentation)."
  def defaults, do: @default_policy
end

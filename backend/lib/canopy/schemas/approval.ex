defmodule Canopy.Schemas.Approval do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "approvals" do
    field :title, :string
    field :description, :string
    field :status, :string, default: "pending"
    field :decision, :string
    field :decision_comment, :string
    field :context, :map
    field :expires_at, :utc_datetime

    # Governance gate fields — populated when an action is blocked pending approval
    field :action_type, :string
    field :action_params, :map, default: %{}
    field :auto_execute, :boolean, default: false

    belongs_to :requested_by_agent, Canopy.Schemas.Agent, foreign_key: :requested_by
    belongs_to :reviewer, Canopy.Schemas.User
    belongs_to :workspace, Canopy.Schemas.Workspace
    has_many :approval_comments, Canopy.Schemas.ApprovalComment

    timestamps()
  end

  def changeset(approval, attrs) do
    approval
    |> cast(attrs, [
      :title,
      :description,
      :status,
      :decision,
      :decision_comment,
      :context,
      :expires_at,
      :requested_by,
      :reviewer_id,
      :workspace_id,
      :action_type,
      :action_params,
      :auto_execute
    ])
    |> validate_required([:title, :status])
    |> validate_inclusion(:status, ~w(pending approved rejected cancelled))
  end

  @doc """
  Changeset used by Governance.Gate when creating a gate-triggered approval.
  Requires action_type and sets status to pending.
  """
  def governance_changeset(approval, attrs) do
    approval
    |> cast(attrs, [
      :title,
      :description,
      :action_type,
      :action_params,
      :auto_execute,
      :requested_by,
      :workspace_id,
      :expires_at
    ])
    |> put_change(:status, "pending")
    |> validate_required([:title, :action_type])
  end
end

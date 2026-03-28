defmodule Canopy.Schemas.Session do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "sessions" do
    field :model, :string
    field :status, :string, default: "active"
    field :tokens_input, :integer, default: 0
    field :tokens_output, :integer, default: 0
    field :tokens_cache, :integer, default: 0
    field :cost_cents, :integer, default: 0
    field :workspace_path, :string
    field :workspace_branch, :string
    field :started_at, :utc_datetime
    field :completed_at, :utc_datetime

    # Session continuity fields
    field :context_summary, :string
    field :handoff_notes, :string
    field :continuation_data, :map
    field :compaction_reason, :string
    field :sequence_number, :integer, default: 1

    belongs_to :agent, Canopy.Schemas.Agent
    belongs_to :schedule, Canopy.Schemas.Schedule
    belongs_to :issue, Canopy.Schemas.Issue
    belongs_to :workspace, Canopy.Schemas.Workspace
    belongs_to :parent_session, Canopy.Schemas.Session
    has_one :child_session, Canopy.Schemas.Session, foreign_key: :parent_session_id
    has_many :events, Canopy.Schemas.SessionEvent

    timestamps()
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [
      :model,
      :status,
      :tokens_input,
      :tokens_output,
      :tokens_cache,
      :cost_cents,
      :workspace_path,
      :workspace_branch,
      :started_at,
      :completed_at,
      :agent_id,
      :schedule_id,
      :issue_id,
      :workspace_id,
      :context_summary,
      :handoff_notes,
      :continuation_data,
      :compaction_reason,
      :parent_session_id,
      :sequence_number
    ])
    |> validate_required([:model, :started_at, :agent_id])
    |> validate_inclusion(:status, ~w(active idle completed failed cancelled))
  end
end

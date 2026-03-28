defmodule Canopy.Repo.Migrations.AddSessionContinuity do
  use Ecto.Migration

  def change do
    # Add session continuity fields to sessions
    alter table(:sessions) do
      add :context_summary, :text
      add :handoff_notes, :text
      add :continuation_data, :map
      add :compaction_reason, :string
      add :parent_session_id, references(:sessions, type: :binary_id, on_delete: :nilify_all)
      add :sequence_number, :integer, default: 1
    end

    create index(:sessions, [:parent_session_id])
    create index(:sessions, [:agent_id, :sequence_number])

    # Add session continuity fields to agents
    alter table(:agents) do
      add :last_session_summary, :text
      add :session_continuity, :map, default: %{}
    end
  end
end

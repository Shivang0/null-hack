defmodule Canopy.Schemas.WorkflowRun do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "workflow_runs" do
    field :status, :string, default: "pending"
    field :trigger_event, :string
    field :input, :map, default: %{}
    field :output, :map, default: %{}
    field :started_at, :utc_datetime_usec
    field :completed_at, :utc_datetime_usec
    field :error, :string
    field :step_results, :map, default: %{}

    belongs_to :workflow, Canopy.Schemas.Workflow

    timestamps()
  end

  def changeset(run, attrs) do
    run
    |> cast(attrs, [
      :status,
      :trigger_event,
      :input,
      :output,
      :started_at,
      :completed_at,
      :error,
      :step_results,
      :workflow_id
    ])
    |> validate_required([:workflow_id])
    |> validate_inclusion(:status, ~w(pending running completed failed cancelled paused))
  end
end

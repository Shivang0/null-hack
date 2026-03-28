defmodule Canopy.Schemas.WorkflowStep do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "workflow_steps" do
    field :name, :string
    field :step_type, :string, default: "agent_task"
    field :position, :integer
    field :config, :map, default: %{}
    field :depends_on, {:array, :binary_id}, default: []
    field :timeout_seconds, :integer, default: 300
    field :retry_count, :integer, default: 0
    field :on_failure, :string, default: "stop"

    belongs_to :workflow, Canopy.Schemas.Workflow
    belongs_to :agent, Canopy.Schemas.Agent

    timestamps()
  end

  def changeset(step, attrs) do
    step
    |> cast(attrs, [
      :name,
      :step_type,
      :position,
      :config,
      :depends_on,
      :timeout_seconds,
      :retry_count,
      :on_failure,
      :workflow_id,
      :agent_id
    ])
    |> validate_required([:name, :position, :workflow_id])
    |> validate_inclusion(:step_type, ~w(agent_task condition delay webhook transform))
    |> validate_inclusion(:on_failure, ~w(stop skip retry fallback))
    |> validate_number(:timeout_seconds, greater_than: 0)
    |> validate_number(:retry_count, greater_than_or_equal_to: 0)
  end
end

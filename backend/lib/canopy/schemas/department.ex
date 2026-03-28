defmodule Canopy.Schemas.Department do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "departments" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :budget_monthly_cents, :integer
    field :budget_enforcement, :string, default: "visibility"
    field :signal, :string
    field :mission, :string
    field :teams_overview, :string
    field :coordination, :string
    field :escalation_rules, :string

    belongs_to :division, Canopy.Schemas.Division
    belongs_to :head_agent, Canopy.Schemas.Agent, foreign_key: :head_agent_id
    has_many :teams, Canopy.Schemas.Team

    timestamps()
  end

  def changeset(department, attrs) do
    department
    |> cast(attrs, [
      :name,
      :slug,
      :description,
      :division_id,
      :head_agent_id,
      :budget_monthly_cents,
      :budget_enforcement,
      :signal,
      :mission,
      :teams_overview,
      :coordination,
      :escalation_rules
    ])
    |> validate_required([:name, :slug, :division_id])
    |> validate_format(:slug, ~r/^[a-z0-9-]+$/)
    |> validate_inclusion(:budget_enforcement, ~w(visibility warning stop))
    |> unique_constraint([:division_id, :slug])
    |> foreign_key_constraint(:division_id)
  end
end

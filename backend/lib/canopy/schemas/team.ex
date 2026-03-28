defmodule Canopy.Schemas.Team do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "teams" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :budget_monthly_cents, :integer
    field :budget_enforcement, :string, default: "visibility"
    field :signal, :string
    field :mission, :string
    field :coordination, :string
    field :escalation_rules, :string
    field :handoff_protocols, :string

    belongs_to :department, Canopy.Schemas.Department
    belongs_to :manager_agent, Canopy.Schemas.Agent, foreign_key: :manager_agent_id
    has_many :team_memberships, Canopy.Schemas.TeamMembership
    has_many :agents, through: [:team_memberships, :agent]

    timestamps()
  end

  def changeset(team, attrs) do
    team
    |> cast(attrs, [
      :name,
      :slug,
      :description,
      :department_id,
      :manager_agent_id,
      :budget_monthly_cents,
      :budget_enforcement,
      :signal,
      :mission,
      :coordination,
      :escalation_rules,
      :handoff_protocols
    ])
    |> validate_required([:name, :slug, :department_id])
    |> validate_format(:slug, ~r/^[a-z0-9-]+$/)
    |> validate_inclusion(:budget_enforcement, ~w(visibility warning stop))
    |> unique_constraint([:department_id, :slug])
    |> foreign_key_constraint(:department_id)
  end
end

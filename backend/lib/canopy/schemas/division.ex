defmodule Canopy.Schemas.Division do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "divisions" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :budget_monthly_cents, :integer
    field :budget_enforcement, :string, default: "visibility"
    field :signal, :string
    field :mission, :string
    field :operating_model, :string
    field :coordination, :string
    field :escalation_rules, :string

    belongs_to :organization, Canopy.Schemas.Organization
    belongs_to :head_agent, Canopy.Schemas.Agent, foreign_key: :head_agent_id
    has_many :departments, Canopy.Schemas.Department

    timestamps()
  end

  def changeset(division, attrs) do
    division
    |> cast(attrs, [
      :name,
      :slug,
      :description,
      :organization_id,
      :head_agent_id,
      :budget_monthly_cents,
      :budget_enforcement,
      :signal,
      :mission,
      :operating_model,
      :coordination,
      :escalation_rules
    ])
    |> validate_required([:name, :slug, :organization_id])
    |> validate_format(:slug, ~r/^[a-z0-9-]+$/)
    |> validate_inclusion(:budget_enforcement, ~w(visibility warning stop))
    |> unique_constraint([:organization_id, :slug])
    |> foreign_key_constraint(:organization_id)
  end
end

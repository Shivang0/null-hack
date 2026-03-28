defmodule Canopy.Schemas.TeamMembership do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "team_memberships" do
    field :role, :string, default: "member"

    belongs_to :team, Canopy.Schemas.Team
    belongs_to :agent, Canopy.Schemas.Agent

    timestamps()
  end

  def changeset(membership, attrs) do
    membership
    |> cast(attrs, [:team_id, :agent_id, :role])
    |> validate_required([:team_id, :agent_id])
    |> validate_inclusion(:role, ~w(member manager))
    |> unique_constraint(:agent_id)
    |> foreign_key_constraint(:team_id)
    |> foreign_key_constraint(:agent_id)
  end
end

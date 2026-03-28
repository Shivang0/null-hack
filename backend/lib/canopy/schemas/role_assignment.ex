defmodule Canopy.Schemas.RoleAssignment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "role_assignments" do
    field :role, :string
    field :resource_type, :string
    field :resource_id, :binary_id

    belongs_to :user, Canopy.Schemas.User

    timestamps()
  end

  def changeset(role_assignment, attrs) do
    role_assignment
    |> cast(attrs, [:role, :resource_type, :resource_id, :user_id])
    |> validate_required([:role, :resource_type, :resource_id, :user_id])
    |> unique_constraint([:user_id, :resource_type, :resource_id])
  end
end

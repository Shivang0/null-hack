defmodule Canopy.Schemas.Label do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "labels" do
    field :name, :string
    field :color, :string, default: "#6366f1"

    belongs_to :workspace, Canopy.Schemas.Workspace
    has_many :issue_labels, Canopy.Schemas.IssueLabel

    timestamps()
  end

  def changeset(label, attrs) do
    label
    |> cast(attrs, [:name, :color, :workspace_id])
    |> validate_required([:name, :workspace_id])
    |> unique_constraint([:name, :workspace_id])
  end
end

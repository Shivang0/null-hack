defmodule Canopy.Schemas.LibraryInstall do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_statuses ~w(active disabled pending_update)

  schema "library_installs" do
    field :installed_version, :string
    field :config_overrides, :map, default: %{}
    field :status, :string, default: "active"
    field :installed_by_id, :binary_id

    belongs_to :library_item, Canopy.Schemas.LibraryItem
    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps()
  end

  def changeset(install, attrs) do
    install
    |> cast(attrs, [
      :library_item_id,
      :workspace_id,
      :installed_by_id,
      :installed_version,
      :config_overrides,
      :status
    ])
    |> validate_required([:library_item_id, :workspace_id])
    |> validate_inclusion(:status, @valid_statuses)
    |> unique_constraint([:library_item_id, :workspace_id])
  end
end

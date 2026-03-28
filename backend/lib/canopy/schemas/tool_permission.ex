defmodule Canopy.Schemas.ToolPermission do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_tools ~w(computer_use file_system shell web_fetch knowledge code_execution)

  schema "tool_permissions" do
    field :tool_name, :string
    field :enabled, :boolean, default: true
    field :config, :map, default: %{}

    belongs_to :agent, Canopy.Schemas.Agent

    timestamps()
  end

  def changeset(permission, attrs) do
    permission
    |> cast(attrs, [:agent_id, :tool_name, :enabled, :config])
    |> validate_required([:agent_id, :tool_name])
    |> validate_inclusion(:tool_name, @valid_tools)
    |> unique_constraint([:agent_id, :tool_name])
  end
end

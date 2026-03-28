defmodule Canopy.Schemas.Conversation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "conversations" do
    field :title, :string
    field :user_id, :string
    field :status, :string, default: "active"
    field :last_message_at, :utc_datetime_usec
    field :message_count, :integer, default: 0
    field :metadata, :map, default: %{}

    belongs_to :agent, Canopy.Schemas.Agent
    belongs_to :workspace, Canopy.Schemas.Workspace
    has_many :messages, Canopy.Schemas.ConversationMessage

    timestamps()
  end

  def changeset(conversation, attrs) do
    conversation
    |> cast(attrs, [
      :title,
      :user_id,
      :status,
      :last_message_at,
      :message_count,
      :metadata,
      :agent_id,
      :workspace_id
    ])
    |> validate_required([:agent_id])
    |> validate_inclusion(:status, ~w(active archived closed))
    |> foreign_key_constraint(:agent_id)
    |> foreign_key_constraint(:workspace_id)
  end
end

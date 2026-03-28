defmodule Canopy.Schemas.ConversationMessage do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "messages" do
    field :role, :string
    field :content, :string
    field :content_type, :string, default: "text"
    field :metadata, :map, default: %{}
    field :token_count, :integer
    field :cost_cents, :integer

    belongs_to :conversation, Canopy.Schemas.Conversation

    timestamps()
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [
      :role,
      :content,
      :content_type,
      :metadata,
      :token_count,
      :cost_cents,
      :conversation_id
    ])
    |> validate_required([:role, :content, :conversation_id])
    |> validate_inclusion(:role, ~w(user agent system))
    |> validate_inclusion(:content_type, ~w(text markdown code image tool_result))
    |> foreign_key_constraint(:conversation_id)
  end
end

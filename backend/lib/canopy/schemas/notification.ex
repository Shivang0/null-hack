defmodule Canopy.Schemas.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @recipient_types ~w(user agent team broadcast)
  @sender_types ~w(system agent user workflow)
  @categories ~w(task approval alert mention system budget workflow)
  @severities ~w(info warning error critical)

  schema "notifications" do
    field :recipient_type, :string
    field :recipient_id, :binary_id
    field :sender_type, :string
    field :sender_id, :binary_id
    field :category, :string
    field :severity, :string, default: "info"
    field :title, :string
    field :body, :string
    field :action_url, :string
    field :action_label, :string
    field :metadata, :map, default: %{}
    field :read_at, :utc_datetime
    field :dismissed_at, :utc_datetime
    field :expires_at, :utc_datetime

    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps()
  end

  def changeset(notification, attrs) do
    notification
    |> cast(attrs, [
      :workspace_id,
      :recipient_type,
      :recipient_id,
      :sender_type,
      :sender_id,
      :category,
      :severity,
      :title,
      :body,
      :action_url,
      :action_label,
      :metadata,
      :read_at,
      :dismissed_at,
      :expires_at
    ])
    |> validate_required([:recipient_type, :category, :title])
    |> validate_inclusion(:recipient_type, @recipient_types)
    |> validate_inclusion(:category, @categories)
    |> validate_inclusion(:severity, @severities)
    |> validate_sender_type()
  end

  defp validate_sender_type(changeset) do
    case get_field(changeset, :sender_type) do
      nil -> changeset
      _type -> validate_inclusion(changeset, :sender_type, @sender_types)
    end
  end
end

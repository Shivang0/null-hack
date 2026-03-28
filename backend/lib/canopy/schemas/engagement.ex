defmodule Canopy.Schemas.Engagement do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_statuses ~w(pending scoping in_progress reporting delivered closed)
  @valid_types ~w(pentest audit compliance incident_response)
  @valid_risk_levels ~w(low medium high critical)

  schema "engagements" do
    field :client_name, :string
    field :client_email, :string
    field :engagement_type, :string
    field :status, :string, default: "pending"
    field :scope, :string
    field :findings_count, :integer, default: 0
    field :risk_level, :string
    field :started_at, :utc_datetime
    field :completed_at, :utc_datetime

    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps()
  end

  def changeset(engagement, attrs) do
    engagement
    |> cast(attrs, [
      :client_name,
      :client_email,
      :engagement_type,
      :status,
      :scope,
      :findings_count,
      :risk_level,
      :started_at,
      :completed_at,
      :workspace_id
    ])
    |> validate_required([:client_name, :engagement_type, :workspace_id])
    |> validate_inclusion(:status, @valid_statuses)
    |> validate_inclusion(:engagement_type, @valid_types)
    |> validate_inclusion(:risk_level, @valid_risk_levels ++ [nil])
    |> validate_format(:client_email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_number(:findings_count, greater_than_or_equal_to: 0)
  end

  def status_changeset(engagement, new_status) do
    engagement
    |> cast(%{status: new_status}, [:status])
    |> validate_inclusion(:status, @valid_statuses)
  end
end

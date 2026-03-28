defmodule Canopy.Schemas.Report do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_report_types ~w(agent_performance cost_analysis task_summary workflow_audit custom)
  @valid_formats ~w(table chart pdf csv)
  @valid_statuses ~w(active generating archived)

  schema "reports" do
    field :name, :string
    field :description, :string
    field :report_type, :string
    field :config, :map
    field :schedule, :string
    field :last_generated_at, :utc_datetime
    field :format, :string, default: "table"
    field :status, :string, default: "active"
    field :cached_result, :map
    field :tags, {:array, :string}, default: []
    field :created_by_id, :binary_id

    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps()
  end

  def changeset(report, attrs) do
    report
    |> cast(attrs, [
      :name,
      :description,
      :report_type,
      :config,
      :schedule,
      :last_generated_at,
      :format,
      :status,
      :cached_result,
      :tags,
      :workspace_id,
      :created_by_id
    ])
    |> validate_required([:name, :report_type, :config])
    |> validate_inclusion(:report_type, @valid_report_types,
      message: "must be one of: #{Enum.join(@valid_report_types, ", ")}"
    )
    |> validate_inclusion(:format, @valid_formats,
      message: "must be one of: #{Enum.join(@valid_formats, ", ")}"
    )
    |> validate_inclusion(:status, @valid_statuses,
      message: "must be one of: #{Enum.join(@valid_statuses, ", ")}"
    )
  end
end

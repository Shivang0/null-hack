defmodule CanopyWeb.EngagementController do
  use CanopyWeb, :controller

  alias Canopy.Engagements
  alias Canopy.Schemas.Engagement

  def index(conn, params) do
    workspace_ids = conn.assigns[:user_workspace_ids] || []
    status_filter = params["status"]

    engagements =
      workspace_ids
      |> Enum.flat_map(&Engagements.list_engagements/1)
      |> then(fn list ->
        if status_filter, do: Enum.filter(list, &(&1.status == status_filter)), else: list
      end)

    json(conn, %{engagements: Enum.map(engagements, &serialize/1), count: length(engagements)})
  end

  def show(conn, %{"id" => id}) do
    case Engagements.get_engagement(id) do
      nil -> conn |> put_status(404) |> json(%{error: "not_found"})
      engagement -> json(conn, %{engagement: serialize(engagement)})
    end
  end

  def create(conn, params) do
    workspace_id =
      params["workspace_id"] ||
        (conn.assigns[:user_workspace_ids] || []) |> List.first()

    attrs = Map.put(params, "workspace_id", workspace_id)

    case Engagements.create_engagement(attrs) do
      {:ok, engagement} ->
        conn |> put_status(201) |> json(%{engagement: serialize(engagement)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{ error: "validation_failed", details: format_errors(changeset)})
    end
  end

  def update_status(conn, %{"engagement_id" => id, "status" => new_status}) do
    case Engagements.update_status(id, new_status) do
      {:ok, engagement} ->
        json(conn, %{engagement: serialize(engagement)})

      {:error, :not_found} ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{ error: "validation_failed", details: format_errors(changeset)})
    end
  end

  def update_status(conn, %{"engagement_id" => _id}) do
    conn |> put_status(422) |> json(%{error: "missing_param", details: %{status: ["is required"]}})
  end

  defp serialize(%Engagement{} = e) do
    %{
      id: e.id,
      client_name: e.client_name,
      client_email: e.client_email,
      engagement_type: e.engagement_type,
      status: e.status,
      scope: e.scope,
      findings_count: e.findings_count,
      risk_level: e.risk_level,
      started_at: e.started_at,
      completed_at: e.completed_at,
      workspace_id: e.workspace_id,
      inserted_at: e.inserted_at,
      updated_at: e.updated_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{\w+}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end

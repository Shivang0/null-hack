defmodule CanopyWeb.DatasetController do
  use CanopyWeb, :controller
  require Logger

  alias Canopy.Repo
  alias Canopy.Schemas.Dataset
  import Ecto.Query

  def index(conn, params) do
    workspace_id = params["workspace_id"]
    source_type = params["source_type"]

    query =
      from d in Dataset,
        order_by: [asc: d.name]

    query =
      if workspace_id,
        do: where(query, [d], d.workspace_id == ^workspace_id),
        else: query

    query =
      if source_type,
        do: where(query, [d], d.source_type == ^source_type),
        else: query

    datasets = Repo.all(query)
    json(conn, %{datasets: Enum.map(datasets, &serialize/1)})
  end

  def show(conn, %{"id" => id}) do
    case Repo.get(Dataset, id) do
      nil -> conn |> put_status(404) |> json(%{error: "not_found"})
      dataset -> json(conn, %{dataset: serialize(dataset)})
    end
  end

  def create(conn, params) do
    changeset = Dataset.changeset(%Dataset{}, params)

    case Repo.insert(changeset) do
      {:ok, dataset} ->
        conn |> put_status(201) |> json(%{dataset: serialize(dataset)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(changeset)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    case Repo.get(Dataset, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      dataset ->
        changeset = Dataset.changeset(dataset, params)

        case Repo.update(changeset) do
          {:ok, updated} ->
            json(conn, %{dataset: serialize(updated)})

          {:error, changeset} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(changeset)})
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    case Repo.get(Dataset, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      dataset ->
        Repo.delete!(dataset)
        json(conn, %{ok: true})
    end
  end

  def preview(conn, %{"dataset_id" => id}) do
    case Repo.get(Dataset, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      dataset ->
        # Return mock preview rows — real implementation would query the data source
        rows = generate_preview_rows(dataset, 50)
        json(conn, %{rows: rows, total: dataset.row_count, preview_limit: 50})
    end
  end

  def refresh(conn, %{"dataset_id" => id}) do
    case Repo.get(Dataset, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      dataset ->
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        changeset =
          Dataset.changeset(dataset, %{
            status: "processing",
            last_refreshed_at: now
          })

        case Repo.update(changeset) do
          {:ok, updated} ->
            Logger.info("Dataset refresh triggered: #{updated.id}")
            json(conn, %{dataset: serialize(updated), message: "Refresh triggered"})

          {:error, changeset} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(changeset)})
        end
    end
  end

  def grant_access(conn, %{"dataset_id" => id} = params) do
    agent_id = params["agent_id"]

    with {:dataset, %Dataset{} = dataset} <- {:dataset, Repo.get(Dataset, id)},
         true <- is_binary(agent_id) do
      current = dataset.access_agents || []

      unless agent_id in current do
        changeset = Dataset.changeset(dataset, %{access_agents: [agent_id | current]})

        case Repo.update(changeset) do
          {:ok, updated} ->
            json(conn, %{dataset: serialize(updated)})

          {:error, cs} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(cs)})
        end
      else
        json(conn, %{dataset: serialize(dataset)})
      end
    else
      {:dataset, nil} -> conn |> put_status(404) |> json(%{error: "not_found"})
      false -> conn |> put_status(422) |> json(%{error: "agent_id required"})
    end
  end

  def revoke_access(conn, %{"dataset_id" => id} = params) do
    agent_id = params["agent_id"]

    with {:dataset, %Dataset{} = dataset} <- {:dataset, Repo.get(Dataset, id)},
         true <- is_binary(agent_id) do
      current = dataset.access_agents || []
      updated_agents = Enum.reject(current, &(&1 == agent_id))
      changeset = Dataset.changeset(dataset, %{access_agents: updated_agents})

      case Repo.update(changeset) do
        {:ok, updated} ->
          json(conn, %{dataset: serialize(updated)})

        {:error, cs} ->
          conn
          |> put_status(422)
          |> json(%{error: "validation_failed", details: format_errors(cs)})
      end
    else
      {:dataset, nil} -> conn |> put_status(404) |> json(%{error: "not_found"})
      false -> conn |> put_status(422) |> json(%{error: "agent_id required"})
    end
  end

  # ── Private helpers ──────────────────────────────────────────────────────────

  defp serialize(%Dataset{} = d) do
    %{
      id: d.id,
      workspace_id: d.workspace_id,
      created_by_agent_id: d.created_by_agent_id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      source_type: d.source_type,
      format: d.format,
      schema_definition: d.schema_definition,
      row_count: d.row_count,
      size_bytes: d.size_bytes,
      status: d.status,
      refresh_schedule: d.refresh_schedule,
      last_refreshed_at: d.last_refreshed_at,
      tags: d.tags,
      access_agents: d.access_agents,
      inserted_at: d.inserted_at,
      updated_at: d.updated_at
    }
  end

  # Generates mock preview rows based on dataset schema_definition
  defp generate_preview_rows(%Dataset{schema_definition: schema} = _dataset, limit)
       when is_map(schema) do
    columns = Map.get(schema, "columns", [])

    if Enum.empty?(columns) do
      []
    else
      Enum.map(1..limit, fn i ->
        Enum.reduce(columns, %{}, fn col, acc ->
          col_name = col["name"] || "col_#{i}"
          Map.put(acc, col_name, generate_sample_value(col["type"] || "string", i))
        end)
      end)
    end
  end

  defp generate_preview_rows(_dataset, _limit), do: []

  defp generate_sample_value("string", i), do: "value_#{i}"
  defp generate_sample_value("integer", i), do: i * 10
  defp generate_sample_value("float", i), do: Float.round(i * 3.14, 2)
  defp generate_sample_value("boolean", i), do: rem(i, 2) == 0
  defp generate_sample_value("timestamp", _i), do: DateTime.to_iso8601(DateTime.utc_now())
  defp generate_sample_value("date", _i), do: Date.to_iso8601(Date.utc_today())
  defp generate_sample_value(_, i), do: "sample_#{i}"

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end

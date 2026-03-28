defmodule CanopyWeb.WorkProductController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{WorkProduct, Issue}
  import Ecto.Query

  # GET /work-products?workspace_id=&agent_id=&type=&status=
  # GET /issues/:issue_id/work-products
  def index(conn, params) do
    query =
      from w in WorkProduct,
        left_join: a in assoc(w, :agent),
        order_by: [desc: w.inserted_at],
        preload: [agent: a]

    query =
      cond do
        issue_id = params["issue_id"] ->
          case Repo.get(Issue, issue_id) do
            nil -> :not_found
            _issue -> where(query, [w], w.issue_id == ^issue_id)
          end

        workspace_id = params["workspace_id"] ->
          where(query, [w], w.workspace_id == ^workspace_id)

        true ->
          query
      end

    case query do
      :not_found ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      q ->
        q = if params["agent_id"], do: where(q, [w], w.agent_id == ^params["agent_id"]), else: q
        q = if params["type"], do: where(q, [w], w.type == ^params["type"]), else: q
        q = if params["status"], do: where(q, [w], w.status == ^params["status"]), else: q

        work_products = Repo.all(q)
        json(conn, %{work_products: Enum.map(work_products, &serialize/1)})
    end
  end

  # GET /work-products/:id
  def show(conn, %{"id" => id}) do
    case Repo.get(WorkProduct, id) |> Repo.preload([:agent, :session, :project, :workspace]) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      work_product ->
        json(conn, %{work_product: serialize(work_product)})
    end
  end

  # POST /work-products
  def create(conn, params) do
    changeset = WorkProduct.changeset(%WorkProduct{}, params)

    case Repo.insert(changeset) do
      {:ok, work_product} ->
        work_product = Repo.preload(work_product, [:agent, :session, :project, :workspace])
        conn |> put_status(201) |> json(%{work_product: serialize(work_product)})

      {:error, cs} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(cs)})
    end
  end

  # PUT/PATCH /work-products/:id
  def update(conn, %{"id" => id} = params) do
    case Repo.get(WorkProduct, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      work_product ->
        changeset = WorkProduct.changeset(work_product, params)

        case Repo.update(changeset) do
          {:ok, updated} ->
            updated = Repo.preload(updated, [:agent, :session, :project, :workspace])
            json(conn, %{work_product: serialize(updated)})

          {:error, cs} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(cs)})
        end
    end
  end

  # DELETE /work-products/:id
  def delete(conn, %{"id" => id}) do
    case Repo.get(WorkProduct, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      work_product ->
        Repo.delete!(work_product)
        conn |> put_status(204) |> json(%{})
    end
  end

  # POST /work-products/:id/archive
  def archive(conn, %{"id" => id}) do
    case Repo.get(WorkProduct, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      work_product ->
        case work_product
             |> Ecto.Changeset.change(status: "archived")
             |> Repo.update() do
          {:ok, updated} ->
            updated = Repo.preload(updated, [:agent, :session, :project, :workspace])
            json(conn, %{work_product: serialize(updated)})

          {:error, _cs} ->
            conn |> put_status(500) |> json(%{error: "update_failed"})
        end
    end
  end

  # --- Private helpers ---

  defp serialize(%WorkProduct{} = w) do
    agent_name =
      case w.agent do
        %Canopy.Schemas.Agent{name: name} -> name
        _ -> nil
      end

    %{
      id: w.id,
      title: w.title,
      type: w.type || w.product_type,
      content_preview: w.content_preview,
      content: w.content,
      file_path: w.file_path,
      file_size_bytes: w.file_size_bytes,
      status: w.status,
      quality_score: w.quality_score,
      metadata: w.metadata,
      agent_id: w.agent_id,
      agent_name: agent_name,
      session_id: w.session_id,
      project_id: w.project_id,
      workspace_id: w.workspace_id,
      issue_id: w.issue_id,
      created_at: w.inserted_at,
      updated_at: w.updated_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end

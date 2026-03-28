defmodule CanopyWeb.DocumentController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{Workspace, DocumentRevision}
  import Ecto.Query

  def index(conn, params) do
    with {:ok, ref_dir} <- resolve_reference_dir(params) do
      all_files = list_files_recursive(ref_dir, ref_dir)

      # Build documents list (flat) and tree (nested)
      documents =
        Enum.map(all_files, fn %{path: path, size: size} ->
          %{
            path: path,
            title: path |> Path.basename() |> String.replace(~r/\.\w+$/, "") |> String.replace(~r/[-_]/, " "),
            format: if(String.ends_with?(path, ".md"), do: "markdown", else: "text"),
            size: size,
            created_at: DateTime.utc_now() |> DateTime.to_iso8601(),
            updated_at: DateTime.utc_now() |> DateTime.to_iso8601()
          }
        end)

      tree = build_tree(all_files)

      json(conn, %{documents: documents, tree: tree, files: all_files})
    else
      {:error, reason} ->
        conn |> put_status(404) |> json(%{error: reason})
    end
  end

  def show(conn, %{"path" => path_parts} = params) do
    with {:ok, ref_dir} <- resolve_reference_dir(params),
         file_path = Path.join([ref_dir | path_parts]),
         true <- safe_path?(ref_dir, file_path) do
      case File.read(file_path) do
        {:ok, content} ->
          json(conn, %{
            path: Path.join(path_parts),
            content: content,
            size: byte_size(content)
          })

        {:error, :enoent} ->
          conn |> put_status(404) |> json(%{error: "not_found"})

        {:error, reason} ->
          conn |> put_status(500) |> json(%{error: friendly_error(reason)})
      end
    else
      false ->
        conn |> put_status(400) |> json(%{error: "invalid_path"})

      {:error, reason} ->
        conn |> put_status(404) |> json(%{error: reason})
    end
  end

  def create(conn, %{"path" => relative_path, "content" => content} = params) do
    with {:ok, ref_dir} <- resolve_reference_dir(params),
         file_path = Path.join(ref_dir, relative_path),
         true <- safe_path?(ref_dir, file_path) do
      dir = Path.dirname(file_path)

      with :ok <- File.mkdir_p(dir),
           :ok <- File.write(file_path, content) do
        conn |> put_status(201) |> json(%{ok: true, path: relative_path})
      else
        {:error, reason} ->
          conn |> put_status(500) |> json(%{error: friendly_error(reason)})
      end
    else
      false ->
        conn |> put_status(400) |> json(%{error: "invalid_path"})

      {:error, reason} ->
        conn |> put_status(404) |> json(%{error: reason})
    end
  end

  def update(conn, %{"path" => path_parts, "content" => content} = params) do
    with {:ok, ref_dir} <- resolve_reference_dir(params),
         file_path = Path.join([ref_dir | path_parts]),
         true <- safe_path?(ref_dir, file_path) do
      dir = Path.dirname(file_path)
      relative_path = Path.join(path_parts)

      with :ok <- File.mkdir_p(dir),
           :ok <- File.write(file_path, content) do
        # Create a DocumentRevision record for history tracking
        workspace_id = params["workspace_id"] || conn.assigns[:workspace_id]
        user_id = conn.assigns[:current_user] && conn.assigns[:current_user].id

        if workspace_id do
          %DocumentRevision{}
          |> DocumentRevision.changeset(%{
            path: relative_path,
            content: content,
            message: params["message"] || "Updated via API",
            author_type: if(user_id, do: "user", else: "agent"),
            author_id: user_id || params["agent_id"],
            workspace_id: workspace_id
          })
          |> Repo.insert()
        end

        json(conn, %{ok: true, path: relative_path})
      else
        {:error, reason} ->
          conn |> put_status(500) |> json(%{error: friendly_error(reason)})
      end
    else
      false ->
        conn |> put_status(400) |> json(%{error: "invalid_path"})

      {:error, reason} ->
        conn |> put_status(404) |> json(%{error: reason})
    end
  end

  def delete(conn, %{"path" => path_parts} = params) do
    with {:ok, ref_dir} <- resolve_reference_dir(params),
         file_path = Path.join([ref_dir | path_parts]),
         true <- safe_path?(ref_dir, file_path) do
      case File.rm(file_path) do
        :ok ->
          json(conn, %{ok: true})

        {:error, :enoent} ->
          conn |> put_status(404) |> json(%{error: "not_found"})

        {:error, reason} ->
          conn |> put_status(500) |> json(%{error: friendly_error(reason)})
      end
    else
      false ->
        conn |> put_status(400) |> json(%{error: "invalid_path"})

      {:error, reason} ->
        conn |> put_status(404) |> json(%{error: reason})
    end
  end

  # GET /document-revisions?path=some/doc.md&workspace_id=...
  # Lists DocumentRevision entries. Path filter is optional — omit to list all revisions.
  def revisions(conn, params) do
    limit = min(String.to_integer(params["limit"] || "50"), 200)

    query =
      from r in DocumentRevision,
        order_by: [desc: r.inserted_at],
        limit: ^limit

    query =
      if params["path"],
        do: where(query, [r], r.path == ^params["path"]),
        else: query

    query =
      if params["workspace_id"],
        do: where(query, [r], r.workspace_id == ^params["workspace_id"]),
        else: query

    revisions = Repo.all(query)

    json(conn, %{
      revisions:
        Enum.map(revisions, fn r ->
          %{
            id: r.id,
            path: r.path,
            content: r.content,
            message: r.message,
            author_type: r.author_type,
            author_id: r.author_id,
            workspace_id: r.workspace_id,
            inserted_at: r.inserted_at
          }
        end)
    })
  end

  # --- Private helpers ---

  defp friendly_error(:enoent), do: "File not found"
  defp friendly_error(:eacces), do: "Permission denied"
  defp friendly_error(:eisdir), do: "Path is a directory"
  defp friendly_error(:enospc), do: "No space left on device"
  defp friendly_error(_other), do: "Operation failed"

  defp resolve_reference_dir(%{"workspace_id" => workspace_id}) when is_binary(workspace_id) do
    case Repo.get(Workspace, workspace_id) do
      nil ->
        {:error, "workspace_not_found"}

      workspace ->
        dir = Path.join([workspace.path, ".canopy", "reference"])
        File.mkdir_p!(dir)
        {:ok, dir}
    end
  end

  defp resolve_reference_dir(_params) do
    # Fall back to the active workspace (status = "active")
    case Repo.one(from w in Workspace, where: w.status == "active", limit: 1) do
      nil ->
        {:error, "no_active_workspace"}

      workspace ->
        dir = Path.join([workspace.path, ".canopy", "reference"])
        File.mkdir_p!(dir)
        {:ok, dir}
    end
  end

  # Validate that a resolved path doesn't escape the reference directory via ".." traversal
  defp safe_path?(ref_dir, file_path) do
    expanded = Path.expand(file_path)
    expanded_ref = Path.expand(ref_dir)
    String.starts_with?(expanded, expanded_ref <> "/") or expanded == expanded_ref
  end

  # Recursively list all files under ref_dir, returning relative paths
  defp list_files_recursive(dir, root) do
    case File.ls(dir) do
      {:ok, names} ->
        names
        |> Enum.filter(&(not String.starts_with?(&1, ".")))
        |> Enum.flat_map(fn name ->
          full = Path.join(dir, name)
          relative = Path.relative_to(full, root)

          case File.stat(full) do
            {:ok, %{type: :directory}} ->
              list_files_recursive(full, root)

            {:ok, %{type: :regular, size: size}} ->
              [%{name: name, path: relative, type: "file", size: size}]

            _ ->
              []
          end
        end)

      {:error, _} ->
        []
    end
  end

  # Build a nested tree from flat file list
  defp build_tree(files) do
    files
    |> Enum.reduce(%{}, fn %{path: path, name: name, size: size}, acc ->
      parts = Path.split(path)

      case parts do
        [_single] ->
          Map.update(acc, :root, [%{name: name, path: path, type: "file", children: []}], fn items ->
            [%{name: name, path: path, type: "file", children: []} | items]
          end)

        [dir | _rest] ->
          Map.update(acc, dir, [%{name: name, path: path, type: "file", children: []}], fn items ->
            [%{name: name, path: path, type: "file", children: []} | items]
          end)
      end
    end)
    |> Enum.map(fn
      {:root, items} -> items
      {dir_name, items} -> [%{name: dir_name, path: dir_name, type: "directory", children: Enum.reverse(items)}]
    end)
    |> List.flatten()
    |> Enum.sort_by(fn node -> {if(node.type == "directory", do: 0, else: 1), node.name} end)
  end
end

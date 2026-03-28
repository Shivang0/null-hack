defmodule CanopyWeb.EnvironmentController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{AppPermission, AgentApp}
  import Ecto.Query

  # GET /api/v1/environment/apps
  # Returns detected apps running on the host machine, merged with real DB access grants
  def apps(conn, _params) do
    # System app detection still requires a Tauri bridge; we keep static detection
    # but merge real agent_access data from the DB.
    detected_apps = [
      %{
        id: "app-vscode",
        name: "VS Code",
        process_name: "code",
        status: "running",
        port: nil,
        pid: 12345,
        category: "development"
      },
      %{
        id: "app-chrome",
        name: "Chrome",
        process_name: "chrome",
        status: "running",
        port: nil,
        pid: 12346,
        category: "browser"
      },
      %{
        id: "app-postgres",
        name: "PostgreSQL",
        process_name: "postgres",
        status: "running",
        port: 5432,
        pid: 12347,
        category: "database"
      },
      %{
        id: "app-docker",
        name: "Docker Desktop",
        process_name: "docker",
        status: "running",
        port: 2375,
        pid: 12348,
        category: "development"
      },
      %{
        id: "app-n8n",
        name: "N8N",
        process_name: "n8n",
        status: "running",
        port: 5678,
        pid: 12349,
        category: "automation"
      },
      %{
        id: "app-figma",
        name: "Figma",
        process_name: "figma",
        status: "running",
        port: nil,
        pid: 12350,
        category: "design"
      },
      %{
        id: "app-slack",
        name: "Slack",
        process_name: "slack",
        status: "running",
        port: nil,
        pid: 12351,
        category: "communication"
      },
      %{
        id: "app-terminal",
        name: "Terminal",
        process_name: "zsh",
        status: "running",
        port: nil,
        pid: 12352,
        category: "development"
      }
    ]

    # Index all grants from DB keyed by app_identifier
    permissions =
      AppPermission
      |> select([p], {p.app_identifier, p.agent_id})
      |> Repo.all()
      |> Enum.group_by(&elem(&1, 0), &elem(&1, 1))

    apps =
      Enum.map(detected_apps, fn app ->
        Map.put(app, :agent_access, Map.get(permissions, app.id, []))
      end)

    json(conn, %{data: apps})
  end

  # GET /api/v1/environment/agent-apps
  # Returns apps that agents have created — real DB records, mock fallback when empty
  def agent_apps(conn, _params) do
    db_apps =
      AgentApp
      |> preload(:agent)
      |> order_by(desc: :inserted_at)
      |> Repo.all()

    data =
      if Enum.empty?(db_apps) do
        # Fallback mock until agents start creating real apps
        [
          %{
            id: "aapp-1",
            name: "ContentOS",
            agent_id: "agent-1",
            agent_name: "Content Strategist",
            template_source: "content-os",
            status: "running",
            port: 3000,
            directory: "/tmp/canopy/apps/content-os",
            created_at: DateTime.utc_now() |> DateTime.to_iso8601()
          },
          %{
            id: "aapp-2",
            name: "Data Pipeline v2",
            agent_id: "agent-2",
            agent_name: "Data Engineer",
            template_source: nil,
            status: "running",
            port: 8080,
            directory: "/tmp/canopy/apps/data-pipeline",
            created_at: DateTime.utc_now() |> DateTime.to_iso8601()
          },
          %{
            id: "aapp-3",
            name: "Analytics Dashboard",
            agent_id: "agent-3",
            agent_name: "Analyst",
            template_source: nil,
            status: "building",
            port: nil,
            directory: "/tmp/canopy/apps/analytics",
            created_at: DateTime.utc_now() |> DateTime.to_iso8601()
          }
        ]
      else
        Enum.map(db_apps, fn app ->
          %{
            id: app.id,
            name: app.name,
            agent_id: app.agent_id,
            agent_name: app.agent && app.agent.name,
            template_source: app.template_source,
            status: app.status,
            port: app.port,
            directory: app.directory,
            resource_usage: app.resource_usage,
            created_at:
              app.inserted_at |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_iso8601()
          }
        end)
      end

    json(conn, %{data: data})
  end

  # GET /api/v1/environment/resources
  # Returns system resource utilization (requires OS-level monitor, static for now)
  def resources(conn, _params) do
    resources = %{
      cpu_percent: 34.2,
      memory_used_gb: 12.4,
      memory_total_gb: 32.0,
      disk_free_gb: 234.5,
      disk_total_gb: 500.0,
      network_connections: 4
    }

    json(conn, %{data: resources})
  end

  # GET /api/v1/environment/capabilities
  # Returns available system capabilities
  def capabilities(conn, _params) do
    capabilities = [
      %{
        id: "cap-cu",
        name: "Computer Use",
        available: true,
        details: "macOS Accessibility API enabled"
      },
      %{id: "cap-fs", name: "File System", available: true, details: "Full read/write access"},
      %{id: "cap-shell", name: "Shell", available: true, details: "zsh — /bin/zsh"},
      %{
        id: "cap-docker",
        name: "Docker",
        available: true,
        details: "Docker Desktop 4.28 running"
      },
      %{
        id: "cap-tauri",
        name: "Tauri Bridge",
        available: true,
        details: "v2.0 — native OS integration"
      }
    ]

    json(conn, %{data: capabilities})
  end

  # POST /api/v1/environment/apps/:id/grant
  def grant_access(conn, %{"id" => app_id} = params) do
    agent_id = params["agent_id"]
    app_name = params["app_name"] || app_id
    app_category = params["app_category"] || "other"
    granted_by = params["granted_by"]

    if is_nil(agent_id) do
      conn |> put_status(:bad_request) |> json(%{error: "agent_id required"})
    else
      attrs = %{
        agent_id: agent_id,
        app_identifier: app_id,
        app_name: app_name,
        app_category: app_category,
        granted_by: granted_by
      }

      changeset = AppPermission.changeset(%AppPermission{}, attrs)

      case Repo.insert(changeset,
             on_conflict: :nothing,
             conflict_target: [:agent_id, :app_identifier]
           ) do
        {:ok, _permission} ->
          json(conn, %{ok: true})

        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: "invalid parameters", details: format_errors(changeset)})
      end
    end
  end

  # POST /api/v1/environment/apps/:id/revoke
  def revoke_access(conn, %{"id" => app_id} = params) do
    agent_id = params["agent_id"]

    if is_nil(agent_id) do
      conn |> put_status(:bad_request) |> json(%{error: "agent_id required"})
    else
      {count, _} =
        AppPermission
        |> where(agent_id: ^agent_id, app_identifier: ^app_id)
        |> Repo.delete_all()

      if count > 0 do
        json(conn, %{ok: true})
      else
        conn |> put_status(:not_found) |> json(%{error: "permission not found"})
      end
    end
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end

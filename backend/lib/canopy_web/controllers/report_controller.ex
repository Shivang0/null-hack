defmodule CanopyWeb.ReportController do
  use CanopyWeb, :controller
  require Logger

  alias Canopy.Repo
  alias Canopy.Schemas.Report
  import Ecto.Query

  def index(conn, params) do
    report_type = params["report_type"]

    query =
      from r in Report,
        order_by: [desc: r.inserted_at]

    query =
      if report_type,
        do: where(query, [r], r.report_type == ^report_type),
        else: query

    reports = Repo.all(query)
    json(conn, %{reports: Enum.map(reports, &serialize/1), count: length(reports)})
  end

  def show(conn, %{"id" => id}) do
    case Repo.get(Report, id) do
      nil -> conn |> put_status(404) |> json(%{error: "not_found"})
      report -> json(conn, %{report: serialize(report)})
    end
  end

  def create(conn, params) do
    workspace_id = get_in(conn.assigns, [:current_workspace, :id])

    attrs =
      params
      |> Map.put("workspace_id", workspace_id)
      |> Map.put("config", params["config"] || %{})

    changeset = Report.changeset(%Report{}, attrs)

    case Repo.insert(changeset) do
      {:ok, report} ->
        conn |> put_status(201) |> json(%{report: serialize(report)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(changeset)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    case Repo.get(Report, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      report ->
        changeset = Report.changeset(report, params)

        case Repo.update(changeset) do
          {:ok, updated} ->
            json(conn, %{report: serialize(updated)})

          {:error, changeset} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(changeset)})
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    case Repo.get(Report, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      report ->
        Repo.delete!(report)
        send_resp(conn, 204, "")
    end
  end

  def generate(conn, %{"report_id" => id}) do
    case Repo.get(Report, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      report ->
        # Mark as generating
        {:ok, generating} =
          report
          |> Report.changeset(%{status: "generating"})
          |> Repo.update()

        # Build sample result data based on report_type
        cached_result = build_sample_result(generating)
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        case generating
             |> Report.changeset(%{
               status: "active",
               cached_result: cached_result,
               last_generated_at: now
             })
             |> Repo.update() do
          {:ok, updated} ->
            json(conn, %{report: serialize(updated), generated: true})

          {:error, _changeset} ->
            conn |> put_status(500) |> json(%{error: "generation_failed"})
        end
    end
  end

  def export(conn, %{"report_id" => id} = params) do
    case Repo.get(Report, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      report ->
        format = params["format"] || report.format || "csv"
        result = report.cached_result || %{}

        case format do
          "csv" ->
            csv_data = build_csv(result)

            conn
            |> put_resp_content_type("text/csv")
            |> put_resp_header(
              "content-disposition",
              ~s(attachment; filename="#{report.name}.csv")
            )
            |> send_resp(200, csv_data)

          _ ->
            json(conn, %{report: serialize(report), data: result, format: format})
        end
    end
  end

  # ── Private helpers ─────────────────────────────────────────────────────────

  defp serialize(%Report{} = r) do
    %{
      id: r.id,
      name: r.name,
      description: r.description,
      report_type: r.report_type,
      config: r.config,
      schedule: r.schedule,
      last_generated_at: r.last_generated_at,
      format: r.format,
      status: r.status,
      cached_result: r.cached_result,
      tags: r.tags || [],
      workspace_id: r.workspace_id,
      created_by_id: r.created_by_id,
      inserted_at: r.inserted_at,
      updated_at: r.updated_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end

  defp build_sample_result(%Report{report_type: "agent_performance"}) do
    %{
      summary: %{
        total_agents: 8,
        avg_success_rate: 0.92,
        total_tasks: 1240,
        period: "last_30d"
      },
      columns: ["Agent", "Tasks", "Success Rate", "Avg Duration", "Cost"],
      rows: [
        ["Orchestrator Prime", 312, "97.4%", "2m 14s", "$4.21"],
        ["Research Agent", 287, "94.1%", "3m 48s", "$6.89"],
        ["Code Writer", 241, "91.3%", "5m 12s", "$9.14"],
        ["Data Analyst", 198, "89.7%", "4m 01s", "$7.32"],
        ["Content Agent", 202, "88.2%", "2m 55s", "$3.67"]
      ]
    }
  end

  defp build_sample_result(%Report{report_type: "cost_analysis"}) do
    %{
      summary: %{
        total_cost_cents: 412_890,
        avg_daily_cost_cents: 13_763,
        top_consumer: "Code Writer",
        period: "last_30d"
      },
      columns: ["Date", "Agent", "Model", "Tokens", "Cost"],
      rows: [
        ["2026-03-01", "Code Writer", "claude-opus-4", "142_000", "$2.84"],
        ["2026-03-02", "Research Agent", "claude-sonnet-4", "98_000", "$1.47"],
        ["2026-03-03", "Orchestrator Prime", "claude-opus-4", "67_000", "$1.34"],
        ["2026-03-04", "Data Analyst", "claude-sonnet-4", "89_000", "$1.34"],
        ["2026-03-05", "Content Agent", "claude-haiku-4", "201_000", "$0.60"]
      ]
    }
  end

  defp build_sample_result(%Report{report_type: "task_summary"}) do
    %{
      summary: %{
        total_tasks: 1240,
        completed: 1142,
        failed: 58,
        pending: 40,
        completion_rate: 0.921
      },
      columns: ["Task", "Agent", "Status", "Duration", "Created"],
      rows: [
        ["Generate report draft", "Content Agent", "completed", "1m 42s", "2026-03-20"],
        ["Analyze sales data", "Data Analyst", "completed", "4m 18s", "2026-03-20"],
        ["Review code PR #142", "Code Writer", "completed", "6m 55s", "2026-03-19"],
        ["Research competitors", "Research Agent", "failed", "—", "2026-03-19"],
        ["Update documentation", "Code Writer", "pending", "—", "2026-03-24"]
      ]
    }
  end

  defp build_sample_result(%Report{report_type: "workflow_audit"}) do
    %{
      summary: %{
        total_runs: 89,
        successful: 82,
        failed: 7,
        avg_duration_seconds: 142
      },
      columns: ["Workflow", "Trigger", "Status", "Duration", "Ran At"],
      rows: [
        ["Daily Digest", "schedule", "success", "2m 18s", "2026-03-24 06:00"],
        ["Code Review Pipeline", "manual", "success", "8m 42s", "2026-03-23 14:22"],
        ["Alert Escalation", "event", "success", "0m 34s", "2026-03-23 09:15"],
        ["Data Sync", "schedule", "failed", "—", "2026-03-22 00:00"],
        ["Monthly Report Gen", "schedule", "success", "12m 07s", "2026-03-01 00:00"]
      ]
    }
  end

  defp build_sample_result(%Report{}) do
    %{
      summary: %{note: "Custom report — configure metrics in report settings"},
      columns: ["Metric", "Value", "Change", "Period"],
      rows: [
        ["ROI", "342%", "+12%", "Q1 2026"],
        ["Automation Rate", "78%", "+5%", "Q1 2026"],
        ["Cost per Task", "$0.33", "-8%", "Q1 2026"],
        ["Error Rate", "2.1%", "-0.4%", "Q1 2026"]
      ]
    }
  end

  defp build_csv(%{columns: columns, rows: rows}) when is_list(columns) and is_list(rows) do
    header = Enum.join(columns, ",")

    body =
      rows
      |> Enum.map(fn row ->
        row
        |> Enum.map(&to_string/1)
        |> Enum.map(fn v ->
          if String.contains?(v, [",", "\""]),
            do: ~s("#{String.replace(v, ~s("), ~s(""))}"),
            else: v
        end)
        |> Enum.join(",")
      end)
      |> Enum.join("\n")

    "#{header}\n#{body}\n"
  end

  defp build_csv(result) do
    "data\n#{Jason.encode!(result)}\n"
  end
end

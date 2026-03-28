defmodule CanopyWeb.HealthController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.Agent
  import Ecto.Query

  @start_time System.monotonic_time(:second)

  def show(conn, _params) do
    agents_active =
      Repo.aggregate(from(a in Agent, where: a.status in ["active", "working"]), :count)

    uptime_seconds = System.monotonic_time(:second) - @start_time

    json(conn, %{
      status: "ok",
      version: "1.0.0",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      context_window: 200_000,
      uptime_seconds: uptime_seconds,
      agents_active: agents_active,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    })
  end
end

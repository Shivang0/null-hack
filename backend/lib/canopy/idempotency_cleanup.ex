defmodule Canopy.IdempotencyCleanup do
  @moduledoc "Periodic cleanup of expired idempotency cache entries."
  use GenServer

  @cleanup_interval :timer.hours(1)

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    schedule()
    {:ok, %{}}
  end

  def handle_info(:cleanup, state) do
    CanopyWeb.Plugs.Idempotency.cleanup_expired()
    schedule()
    {:noreply, state}
  end

  defp schedule, do: Process.send_after(self(), :cleanup, @cleanup_interval)
end

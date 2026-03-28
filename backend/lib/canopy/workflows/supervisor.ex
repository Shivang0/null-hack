defmodule Canopy.Workflows.Supervisor do
  @moduledoc """
  Supervision tree for the workflow subsystem.

  Children:
    - `Canopy.Workflows.Scheduler` — cron/interval workflow trigger
  """

  use Supervisor

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    children = [
      Canopy.Workflows.Scheduler
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end

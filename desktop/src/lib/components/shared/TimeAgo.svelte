<script lang="ts">
  interface Props {
    date: string | Date;
    live?: boolean;
    short?: boolean;
  }

  let { date, live = true, short = false }: Props = $props();

  function toDate(d: string | Date): Date {
    return d instanceof Date ? d : new Date(d);
  }

  function compute(d: string | Date): string {
    const now = Date.now();
    const then = toDate(d).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffWk = Math.floor(diffDay / 7);
    const diffMo = Math.floor(diffDay / 30);
    const diffYr = Math.floor(diffDay / 365);

    if (diffSec < 60) return short ? 'now' : 'just now';
    if (diffMin < 60) return short ? `${diffMin}m` : `${diffMin}m ago`;
    if (diffHr < 24)  return short ? `${diffHr}h`  : `${diffHr}h ago`;
    if (diffDay < 7)  return short ? `${diffDay}d` : `${diffDay}d ago`;
    if (diffWk < 5)   return short ? `${diffWk}w`  : `${diffWk}w ago`;
    if (diffMo < 12)  return short ? `${diffMo}mo` : `${diffMo}mo ago`;
    return short ? `${diffYr}y` : `${diffYr}y ago`;
  }

  function isoTitle(d: string | Date): string {
    return toDate(d).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }

  function intervalFor(d: string | Date): number {
    const diffSec = Math.floor((Date.now() - toDate(d).getTime()) / 1000);
    return diffSec < 3600 ? 30_000 : 60_000;
  }

  let display = $state('');
  let titleText = $derived(isoTitle(date));

  let timer: ReturnType<typeof setInterval> | null = null;

  function stopTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  $effect(() => {
    // Runs on mount and whenever date/live/short change.
    // Also covers cleanup on unmount.
    display = compute(date);

    if (!live) return stopTimer;

    stopTimer();
    const ms = intervalFor(date);
    timer = setInterval(() => {
      display = compute(date);
    }, ms);

    return () => stopTimer();
  });
</script>

<time
  class="ta-time"
  datetime={toDate(date).toISOString()}
  title={titleText}
>
  {display}
</time>

<style>
  .ta-time {
    font-family: inherit;
    font-size: 12px;
    color: var(--text-tertiary);
    white-space: nowrap;
    cursor: default;
  }
</style>

<!-- src/routes/app/podcast/+page.svelte -->
<!-- NULLHACK Daily Podcast — Player-focused layout -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';

  interface Episode {
    date: string;
    title: string;
    duration_seconds: number;
    audio_file: string;
    audio_url: string;
    transcript: string;
    segment_count: number;
    generated_at: string;
  }

  let episodes = $state<Episode[]>([]);
  let current = $state<Episode | null>(null);
  let loading = $state(true);
  let audioEl = $state<HTMLAudioElement | null>(null);
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let playbackRate = $state(1);
  let showTranscript = $state(false);

  const API = 'http://127.0.0.1:9089';

  onMount(async () => {
    try {
      // Try to fetch episodes for the last 30 days
      const eps: Episode[] = [];
      const now = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const slug = d.toISOString().slice(0, 10);
        try {
          const r = await fetch(`${API}/podcasts/episode_${slug}.json`);
          if (r.ok) eps.push(await r.json());
        } catch { /* skip */ }
      }
      episodes = eps;
      if (eps.length > 0) current = eps[0];
    } catch {
      // No episodes yet
    } finally {
      loading = false;
    }
  });

  function togglePlay() {
    if (!audioEl) return;
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
    isPlaying = !isPlaying;
  }

  function seek(e: MouseEvent) {
    if (!audioEl) return;
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioEl.currentTime = pct * duration;
  }

  function setSpeed(rate: number) {
    playbackRate = rate;
    if (audioEl) audioEl.playbackRate = rate;
  }

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function selectEpisode(ep: Episode) {
    current = ep;
    isPlaying = false;
    currentTime = 0;
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
  }
</script>

<PageShell title="Podcast" subtitle="NULLHACK Daily">
  {#snippet children()}
    <div class="pod-layout">
      {#if loading}
        <div class="pod-loading">Loading episodes...</div>
      {:else if !current}
        <div class="pod-empty">
          <div class="pod-empty-icon">🎙️</div>
          <h3>No episodes yet</h3>
          <p>Your first NULLHACK Daily episode will appear here once generated.</p>
          <p class="pod-empty-hint">Episodes are generated daily at 6:00 AM UTC</p>
        </div>
      {:else}
        <!-- Player -->
        <div class="pod-player">
          <div class="pod-player-header">
            <div class="pod-cover">
              <span class="pod-cover-icon">🎙️</span>
            </div>
            <div class="pod-meta">
              <h2 class="pod-title">{current.title}</h2>
              <div class="pod-info">
                <span class="pod-date">{current.date}</span>
                <span class="pod-dot">·</span>
                <span class="pod-duration">{formatTime(current.duration_seconds)}</span>
                <span class="pod-dot">·</span>
                <span class="pod-segments">{current.segment_count} segments</span>
              </div>
            </div>
          </div>

          <!-- Audio element -->
          <audio
            bind:this={audioEl}
            src="{API}/podcasts/{current.audio_file}"
            ontimeupdate={() => { if (audioEl) currentTime = audioEl.currentTime; }}
            onloadedmetadata={() => { if (audioEl) duration = audioEl.duration; }}
            onended={() => { isPlaying = false; }}
            preload="metadata"
          />

          <!-- Progress bar -->
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div class="pod-progress" onclick={seek}>
            <div class="pod-progress-fill" style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"></div>
          </div>
          <div class="pod-times">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || current.duration_seconds)}</span>
          </div>

          <!-- Controls -->
          <div class="pod-controls">
            <button class="pod-btn pod-btn-skip" onclick={() => { if (audioEl) audioEl.currentTime = Math.max(0, audioEl.currentTime - 15); }}>
              -15s
            </button>
            <button class="pod-btn pod-btn-play" onclick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button class="pod-btn pod-btn-skip" onclick={() => { if (audioEl) audioEl.currentTime = Math.min(duration, audioEl.currentTime + 30); }}>
              +30s
            </button>
            <div class="pod-speed">
              {#each [1, 1.25, 1.5, 2] as rate}
                <button
                  class="pod-speed-btn"
                  class:active={playbackRate === rate}
                  onclick={() => setSpeed(rate)}
                >{rate}x</button>
              {/each}
            </div>
          </div>

          <!-- Transcript toggle -->
          <button class="pod-transcript-toggle" onclick={() => showTranscript = !showTranscript}>
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </button>

          {#if showTranscript}
            <div class="pod-transcript">
              {#each (current.transcript ?? '').split(/<\/?Person[12]>/).filter(Boolean) as segment, i}
                {#if segment.trim()}
                  <div class="pod-segment" class:pod-segment-kai={i % 2 === 0} class:pod-segment-lex={i % 2 !== 0}>
                    <span class="pod-speaker">{i % 2 === 0 ? 'Kai' : 'Lex'}</span>
                    <p>{segment.trim()}</p>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>

        <!-- Episode list -->
        {#if episodes.length > 1}
          <div class="pod-archive">
            <h3 class="pod-archive-title">Past Episodes</h3>
            {#each episodes as ep (ep.date)}
              <button
                class="pod-ep-card"
                class:active={current.date === ep.date}
                onclick={() => selectEpisode(ep)}
              >
                <span class="pod-ep-date">{ep.date}</span>
                <span class="pod-ep-duration">{formatTime(ep.duration_seconds)}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/snippet}
</PageShell>

<style>
  .pod-layout { padding: 24px; max-width: 720px; margin: 0 auto; }
  .pod-loading { text-align: center; padding: 60px 0; color: var(--text-secondary); }

  .pod-empty {
    text-align: center; padding: 80px 24px;
    color: var(--text-secondary);
  }
  .pod-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .pod-empty h3 { color: var(--text-primary); font-size: 18px; margin-bottom: 8px; }
  .pod-empty p { font-size: 14px; margin-bottom: 4px; }
  .pod-empty-hint { opacity: 0.5; font-size: 12px; margin-top: 12px; }

  .pod-player {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl, 16px);
    padding: 24px;
  }
  .pod-player-header { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
  .pod-cover {
    width: 72px; height: 72px; border-radius: var(--radius-lg, 12px);
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pod-cover-icon { font-size: 32px; }
  .pod-meta { flex: 1; min-width: 0; }
  .pod-title { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0 0 6px; }
  .pod-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
  .pod-dot { opacity: 0.4; }

  .pod-progress {
    height: 6px; background: var(--bg-elevated); border-radius: 3px;
    cursor: pointer; margin-bottom: 6px; overflow: hidden;
  }
  .pod-progress-fill {
    height: 100%; background: #6366f1; border-radius: 3px;
    transition: width 0.1s linear;
  }
  .pod-times { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 16px; }

  .pod-controls { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px; }
  .pod-btn {
    border: 1px solid var(--border-default); background: var(--bg-surface);
    color: var(--text-primary); border-radius: var(--radius-md, 8px);
    padding: 8px 14px; cursor: pointer; font-size: 13px;
    transition: background 0.15s;
  }
  .pod-btn:hover { background: var(--bg-elevated); }
  .pod-btn-play {
    width: 52px; height: 52px; border-radius: 50%; font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    background: #6366f1; border-color: #6366f1; color: #fff;
  }
  .pod-btn-play:hover { background: #5558e6; }
  .pod-btn-skip { font-size: 12px; padding: 6px 10px; }

  .pod-speed { display: flex; gap: 4px; margin-left: 12px; }
  .pod-speed-btn {
    font-size: 11px; padding: 4px 8px; border-radius: var(--radius-sm, 4px);
    border: 1px solid var(--border-default); background: transparent;
    color: var(--text-secondary); cursor: pointer;
  }
  .pod-speed-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }

  .pod-transcript-toggle {
    display: block; width: 100%; text-align: center; padding: 10px;
    background: transparent; border: 1px solid var(--border-default);
    border-radius: var(--radius-md, 8px); color: var(--text-secondary);
    cursor: pointer; font-size: 13px;
    transition: color 0.15s;
  }
  .pod-transcript-toggle:hover { color: var(--text-primary); }

  .pod-transcript {
    margin-top: 16px; max-height: 400px; overflow-y: auto;
    border: 1px solid var(--border-default); border-radius: var(--radius-md, 8px);
    padding: 16px;
  }
  .pod-segment { margin-bottom: 12px; }
  .pod-speaker {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; margin-bottom: 2px; display: block;
  }
  .pod-segment-kai .pod-speaker { color: #6366f1; }
  .pod-segment-lex .pod-speaker { color: #ec4899; }
  .pod-segment p { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5; }

  .pod-archive { margin-top: 24px; }
  .pod-archive-title { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }
  .pod-ep-card {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; padding: 12px 16px; margin-bottom: 8px;
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-md, 8px); cursor: pointer;
    color: var(--text-primary); font-size: 13px;
    transition: border-color 0.15s;
  }
  .pod-ep-card:hover { border-color: #6366f1; }
  .pod-ep-card.active { border-color: #6366f1; background: rgba(99, 102, 241, 0.08); }
  .pod-ep-duration { color: var(--text-secondary); font-size: 12px; }
</style>

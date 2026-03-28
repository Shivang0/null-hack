/**
 * Ambient audio manager for NULLHACK.
 *
 * - Lofi beats when most agents are idle/sleeping
 * - Sonic track when most agents are actively working
 * - Beep tone when an agent finishes a run
 *
 * Audio only starts after the first user interaction (browser autoplay policy).
 */

import { agentsStore } from './agents.svelte';

class AmbientStore {
  enabled = $state(true);
  volume = $state(0.25);
  currentTrack = $state<'lofi' | 'sonic' | null>(null);
  muted = $state(false);

  #lofi: HTMLAudioElement | null = null;
  #sonic: HTMLAudioElement | null = null;
  #initialized = false;
  #unlocked = false;
  #pollInterval: ReturnType<typeof setInterval> | null = null;

  init() {
    if (this.#initialized || typeof window === 'undefined') return;
    this.#initialized = true;

    // Create audio elements
    this.#lofi = new Audio('/lofibeats.mp3');
    this.#lofi.loop = true;
    this.#lofi.volume = this.volume;
    this.#lofi.preload = 'auto';

    this.#sonic = new Audio('/sonican.mp3');
    this.#sonic.loop = true;
    this.#sonic.volume = this.volume;
    this.#sonic.preload = 'auto';

    // Wait for first user interaction to unlock audio
    const unlock = () => {
      if (this.#unlocked) return;
      this.#unlocked = true;
      // Start playing immediately on first click
      this.#update();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });

    // Poll agent status every 5 seconds
    this.#pollInterval = setInterval(() => {
      if (this.#unlocked) this.#update();
    }, 5000);
  }

  playBeep() {
    if (this.muted || !this.enabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      // Second higher beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);
      setTimeout(() => ctx.close(), 1000);
    } catch { /* AudioContext not available */ }
  }

  #update() {
    if (!this.enabled || this.muted || !this.#unlocked) {
      this.#pauseAll();
      return;
    }

    const agents = agentsStore.agents;
    if (agents.length === 0) {
      // No agents loaded yet — play lofi by default
      this.#playTrack('lofi');
      return;
    }

    const working = agents.filter(a =>
      a.status === 'running' || a.status === 'working' || a.status === 'active'
    ).length;
    const total = agents.length;

    // More than 30% actively working → sonic, otherwise lofi
    this.#playTrack(working / total > 0.3 ? 'sonic' : 'lofi');
  }

  #playTrack(track: 'lofi' | 'sonic') {
    if (this.currentTrack === track) return;

    // Pause the other track
    const other = track === 'lofi' ? this.#sonic : this.#lofi;
    const target = track === 'lofi' ? this.#lofi : this.#sonic;

    if (other) {
      other.pause();
      other.currentTime = 0;
    }

    if (target) {
      target.volume = this.volume;
      target.play().catch(() => {
        // Autoplay still blocked — will retry on next poll
      });
    }

    this.currentTrack = track;
  }

  #pauseAll() {
    this.#lofi?.pause();
    this.#sonic?.pause();
    this.currentTrack = null;
  }

  toggle() {
    this.muted = !this.muted;
    if (this.muted) {
      this.#pauseAll();
    } else if (this.#unlocked) {
      this.#update();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.#lofi && this.currentTrack === 'lofi') this.#lofi.volume = this.volume;
    if (this.#sonic && this.currentTrack === 'sonic') this.#sonic.volume = this.volume;
  }

  onAgentCompleted(_agentName: string) {
    this.playBeep();
    if (this.#unlocked) this.#update();
  }

  destroy() {
    if (this.#pollInterval) clearInterval(this.#pollInterval);
    this.#pauseAll();
    this.#initialized = false;
    this.#unlocked = false;
  }
}

export const ambientStore = new AmbientStore();

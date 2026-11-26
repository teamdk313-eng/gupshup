// Lightweight Web Audio API helper for realistic voice-note playback of both
// recorded audio Blobs and seeded sample voice notes.

export class VoicePlaybackController {
  private audioEl: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private intervalId: number | null = null;
  private activeId: string | null = null;

  stop(): void {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      this.audioEl = null;
    }
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.activeId = null;
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  play(params: {
    id: string;
    audioUrl?: string;
    durationSec: number;
    playbackRate: number;
    onProgress: (elapsedSec: number) => void;
    onEnded: () => void;
  }): void {
    this.stop();
    this.activeId = params.id;

    if (params.audioUrl) {
      const audio = new Audio(params.audioUrl);
      audio.playbackRate = params.playbackRate;
      this.audioEl = audio;
      audio.ontimeupdate = () => {
        params.onProgress(audio.currentTime);
      };
      audio.onended = () => {
        this.stop();
        params.onEnded();
      };
      audio.play().catch(() => {
        this.simulatePlayback(params);
      });
      return;
    }

    this.simulatePlayback(params);
  }

  private simulatePlayback(params: {
    durationSec: number;
    playbackRate: number;
    onProgress: (elapsedSec: number) => void;
    onEnded: () => void;
  }): void {
    // Subtle soft chime at start if AudioContext is available
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        this.audioCtx = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // Ignore if autoplay blocked
    }

    let elapsed = 0;
    const stepMs = 200;
    this.intervalId = window.setInterval(() => {
      elapsed += (stepMs / 1000) * params.playbackRate;
      if (elapsed >= params.durationSec) {
        this.stop();
        params.onEnded();
      } else {
        params.onProgress(elapsed);
      }
    }, stepMs);
  }
}

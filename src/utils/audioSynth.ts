class PianoSynth {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playMidi(midi: number, velocity: number = 80) {
    try {
      const ctx = this.getContext();
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const now = ctx.currentTime;

      // Primary tone (triangle)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      // Warm harmonic overtone (sine)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);

      const gainNorm = Math.min(1, Math.max(0.1, velocity / 127));
      const peakVol = 0.25 * gainNorm;

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(peakVol, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(peakVol * 0.3, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.95);
      osc2.stop(now + 0.65);
    } catch {
      // Audio fallback silent
    }
  }
}

export const pianoSynth = new PianoSynth();

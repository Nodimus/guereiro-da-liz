/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio Engine for Afro-Brazilian Mythological Hack & Slash

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private drumTimer: number | null = null;
  private drumBeat: number = 0;
  private comboIntensity: number = 0;

  constructor() {
    // Initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.45;
      this.musicGain.connect(this.masterGain);

      this.startPercussionTrack();
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setIntensity(intensity: number) {
    this.comboIntensity = Math.min(Math.max(intensity, 0), 1);
    if (this.musicGain && this.ctx) {
      const targetVol = 0.35 + this.comboIntensity * 0.35;
      this.musicGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.2);
    }
  }

  // --- Dynamic Procedural Afro Atabaque & Batá Percussion ---
  private startPercussionTrack() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const tempoBpm = 118;
    const stepDuration = 60 / (tempoBpm * 4); // 16th notes

    const tick = () => {
      if (!this.ctx || this.isMuted) {
        this.drumTimer = window.setTimeout(tick, stepDuration * 1000);
        return;
      }

      const beat = this.drumBeat % 16;

      // Rum (deep bass atabaque) on beats 0, 6, 10
      if (beat === 0 || beat === 6 || beat === 10) {
        this.playAtabaque(75, 0.4, 0.4);
      }
      // Lé / Pi (medium/high resonant slap)
      if (beat === 3 || beat === 8 || beat === 12 || beat === 14) {
        this.playAtabaque(170, 0.15, 0.25);
      }
      // Agogô iron bell rhythm (high sacred bells)
      if (beat === 0 || beat === 3 || beat === 6 || beat === 9 || beat === 11 || beat === 14) {
        const pitch = beat % 6 === 0 ? 880 : 1320;
        this.playAgogo(pitch, 0.12, 0.15);
      }

      // If in high combo fury, add rushing tribal shakers and thunder drone
      if (this.comboIntensity > 0.4 && (beat % 2 === 0)) {
        this.playShaker(0.08, 0.15);
      }
      if (this.comboIntensity > 0.7 && beat === 0) {
        this.playBassDrone(48, 1.2, 0.3);
      }

      this.drumBeat++;
      this.drumTimer = window.setTimeout(tick, stepDuration * 1000);
    };

    tick();
  }

  // Bass Atabaque Drum
  private playAtabaque(freq: number, duration: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + duration);

    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // Agogô Double Metal Bell
  private playAgogo(freq: number, duration: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc1.type = 'sine';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 1.48, t); // Metallic dissonance

    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  // Sacred Shaker
  private playShaker(duration: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3500;

    const gain = this.ctx.createGain();
    gain.gain.value = gainVal;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start();
  }

  // Low Rumble Drone
  private playBassDrone(freq: number, duration: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // ==================== COMBAT SOUND FX ====================

  // Fast Blade Slash (Ogum / Light Attack)
  public playSlash(pitchMod = 1) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(120 * pitchMod, t + 0.14);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Steel Clash / Impact
  public playClash() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(1800, t);
    osc1.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    osc2.frequency.setValueAtTime(2450, t);
    osc2.frequency.exponentialRampToValueAtTime(600, t + 0.25);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  // Heavy Axe Slam (Xangô Heavy Attack)
  public playHeavyImpact() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Sub-bass hit
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);

    // Crunch noise
    this.playNoiseBurst(0.2, 0.6, 600);
  }

  // Noise burst for explosions/thuds
  private playNoiseBurst(duration: number, volume: number, cutoff: number) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // Xangô: Thunder and Fire Burst
  public playXangoThunder() {
    if (!this.ctx || !this.sfxGain) return;
    this.playHeavyImpact();
    this.playNoiseBurst(0.6, 0.8, 1200);

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.5);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Iansã: Wind Vortex & Lightning Dash
  public playIansaWind() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(1100, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.35);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);

    this.playNoiseBurst(0.25, 0.4, 2800);
  }

  // Oxóssi: Spirit Bow Arrow Shot
  public playOxossiArrow() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Bowstring twang
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(240, t);
    osc1.frequency.exponentialRampToValueAtTime(90, t + 0.12);
    gain1.gain.setValueAtTime(0.6, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // Arrow whistle
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(950, t);
    osc2.frequency.exponentialRampToValueAtTime(2200, t + 0.22);
    gain2.gain.setValueAtTime(0.35, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t);
    osc2.stop(t + 0.22);
  }

  // Oxum: Healing Waters & Golden Axé
  public playOxumHeal() {
    if (!this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // Ultimate: Axé Supremo (All Deities Combined Call)
  public playUltimateBurst() {
    if (!this.ctx || !this.sfxGain) return;
    this.playHeavyImpact();
    this.playXangoThunder();
    this.playIansaWind();
    this.playClash();
  }

  // Brutal Finisher Execution
  public playFinisher() {
    if (!this.ctx || !this.sfxGain) return;
    this.playHeavyImpact();
    this.playClash();
    this.playNoiseBurst(0.7, 0.9, 1500);
  }

  // Monster Roar (Mapinguari / Boss)
  public playMonsterRoar() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.7, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  // Boitatá Fire Hiss
  public playBoitataHiss() {
    if (!this.ctx || !this.sfxGain) return;
    this.playNoiseBurst(0.4, 0.5, 3000);
  }

  // Dodge Roll Swoosh
  public playDodge() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Parry Success
  public playParry() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2600, t + 0.08);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Level Up / Skill Unlock
  public playSkillUnlock() {
    if (!this.ctx || !this.sfxGain) return;
    const chords = [440, 554.37, 659.25, 880];
    chords.forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public dispose() {
    if (this.drumTimer) {
      window.clearTimeout(this.drumTimer);
      this.drumTimer = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundManager();

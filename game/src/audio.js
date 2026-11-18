// VELMARA HEAT — sound: everything is synthesized with WebAudio, no audio files.
// Engine hum, police siren, radio station jingles, cash blips and punches are all
// oscillators and filtered noise, so the game ships zero audio assets.

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.radioTimer = null;
  }

  ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
    } catch {
      return false;
    }
    return true;
  }

  resume() {
    if (this.ensure() && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, seconds, type, volume, when) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume || 0.12, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  noise(seconds, volume, filterFreq) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 900;
    const gain = this.ctx.createGain();
    gain.gain.value = volume || 0.15;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  blip() {
    this.tone(880, 0.09, 'square', 0.08);
    this.tone(1318, 0.12, 'square', 0.06, 0.07);
  }

  cash() {
    this.tone(1046, 0.1, 'triangle', 0.14);
    this.tone(1568, 0.16, 'triangle', 0.12, 0.09);
    this.tone(2093, 0.22, 'triangle', 0.1, 0.18);
  }

  punch() {
    this.noise(0.12, 0.3, 500);
    this.tone(90, 0.12, 'sine', 0.25);
  }

  jingle(stationId) {
    const lines = [
      [523, 659, 784, 1046],
      [440, 554, 659, 880],
      [392, 494, 587, 784],
    ];
    const notes = lines[stationId % 3];
    for (let i = 0; i < notes.length; i += 1) this.tone(notes[i], 0.22, 'triangle', 0.1, i * 0.11);
  }

  setEngine(rpm, on) {
    if (!this.ensure() || this.muted) return;
    if (on && !this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;
      this.engineGain.gain.value = 0.0;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      this.engineOsc.connect(filter).connect(this.engineGain).connect(this.ctx.destination);
      this.engineOsc.start();
    }
    if (this.engineOsc) {
      const target = on ? 0.05 + rpm * 0.06 : 0.0;
      this.engineGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
      this.engineOsc.frequency.setTargetAtTime(55 + rpm * 140, this.ctx.currentTime, 0.08);
    }
    if (!on && this.engineOsc) {
      const osc = this.engineOsc;
      const gain = this.engineGain;
      setTimeout(() => {
        try { osc.stop(); } catch { /* already stopped */ }
        gain.disconnect();
      }, 400);
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  setSiren(on) {
    if (!this.ensure() || this.muted) return;
    if (on && !this.sirenOsc) {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = 'sine';
      this.sirenOsc.frequency.value = 700;
      this.sirenGain.gain.value = 0.035;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.55;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 260;
      lfo.connect(lfoGain).connect(this.sirenOsc.frequency);
      this.sirenOsc.connect(this.sirenGain).connect(this.ctx.destination);
      this.sirenOsc.start();
      lfo.start();
      this.sirenLfo = lfo;
    } else if (!on && this.sirenOsc) {
      try { this.sirenOsc.stop(); } catch { /* already stopped */ }
      try { this.sirenLfo.stop(); } catch { /* already stopped */ }
      this.sirenGain.disconnect();
      this.sirenOsc = null;
      this.sirenGain = null;
      this.sirenLfo = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.engineGain) this.engineGain.gain.value = 0;
      if (this.sirenGain) this.sirenGain.gain.value = 0;
    }
    return this.muted;
  }
}

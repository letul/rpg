// ===== Web Audio API 기반 오디오 엔진 (효과음 & 프로시저럴 BGM) =====
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterVolume = 0.5;
    this.sfxVolume = 0.6;
    this.bgmVolume = 0.35;
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.bgmOscs = [];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 기본 단일 음 생성
  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.3) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal * this.sfxVolume * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  // 검 휘두르기 / 물리 타격
  playSlash() {
    if (!this.ctx) return;
    try {
      const node = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
      }
      node.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      node.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      node.start();
    } catch (e) {}
  }

  // 타격 성공 (쿵!)
  playHit(isCrit = false) {
    if (!this.ctx) return;
    const freq = isCrit ? 110 : 80;
    this.playTone(freq, 'triangle', isCrit ? 0.25 : 0.15, isCrit ? 0.6 : 0.4);
    if (isCrit) {
      setTimeout(() => this.playTone(440, 'sawtooth', 0.2, 0.4), 30);
    }
  }

  // 화염 / 폭발 사운드
  playExplosion() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  // 마법 시전 / 발사 (얼음, 번개, 마법구)
  playMagicSpell(type = 'fire') {
    if (!this.ctx) return;
    if (type === 'fire') {
      this.playTone(320, 'sawtooth', 0.2, 0.3);
      setTimeout(() => this.playTone(220, 'sine', 0.15, 0.4), 60);
    } else if (type === 'ice') {
      this.playTone(880, 'sine', 0.18, 0.3);
      setTimeout(() => this.playTone(1200, 'triangle', 0.2, 0.25), 50);
    } else if (type === 'lightning') {
      this.playTone(150, 'sawtooth', 0.1, 0.5);
      setTimeout(() => this.playTone(600, 'square', 0.15, 0.3), 30);
    } else {
      this.playTone(400, 'sine', 0.2, 0.3);
    }
  }

  // 골드 획득 짤랑
  playCoin() {
    this.playTone(987, 'sine', 0.08, 0.25);
    setTimeout(() => this.playTone(1318, 'sine', 0.12, 0.25), 60);
  }

  // 포션 마시기
  playPotion() {
    this.playTone(300, 'sine', 0.08, 0.3);
    setTimeout(() => this.playTone(450, 'sine', 0.09, 0.3), 70);
    setTimeout(() => this.playTone(600, 'sine', 0.12, 0.35), 140);
  }

  // 레벨업 팡파레
  playLevelUp() {
    const notes = [261.6, 329.6, 392.0, 523.2];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.25, 0.4);
      }, idx * 90);
    });
  }

  // 상자 열기
  playChestOpen() {
    this.playTone(220, 'square', 0.15, 0.3);
    setTimeout(() => this.playTone(440, 'triangle', 0.25, 0.35), 100);
  }

  // 버튼 클릭음
  playClick() {
    this.playTone(400, 'sine', 0.04, 0.2);
  }

  // 던전 배경 앰비언트 BGM 루프
  startBGM(isBoss = false) {
    if (this.bgmPlaying) this.stopBGM();
    this.init();
    if (!this.ctx) return;
    this.bgmPlaying = true;

    const baseChords = isBoss
      ? [[110, 138.6, 164.8], [98, 123.5, 146.8], [82.4, 103.8, 123.5], [110, 146.8, 174.6]]
      : [[130.8, 164.8, 196.0], [116.5, 146.8, 174.6], [98.0, 123.5, 146.8], [110.0, 130.8, 164.8]];

    let step = 0;
    const tempo = isBoss ? 600 : 1200;

    const playStep = () => {
      if (!this.bgmPlaying || !this.ctx) return;
      const chord = baseChords[step % baseChords.length];
      chord.forEach((freq, idx) => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = isBoss ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 1), this.ctx.currentTime);
          
          const maxGain = 0.08 * this.bgmVolume * this.masterVolume;
          gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(maxGain, this.ctx.currentTime + (tempo / 2000));
          gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + (tempo / 1000));
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + (tempo / 1000));
        } catch (e) {}
      });
      step++;
    };

    playStep();
    this.bgmInterval = setInterval(playStep, tempo);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const Sound = new SoundEngine();
window.Sound = Sound;

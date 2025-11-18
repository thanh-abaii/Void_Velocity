
// Web Audio API implementation for synthesized sound effects
// avoiding external assets for reliability

let audioCtx: AudioContext | null = null;
let thrusterSource: AudioBufferSourceNode | null = null;
let thrusterGain: GainNode | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.error("Audio resume failed", e));
  }
};

// Helper to create noise buffer (White/Brown noise)
const createNoiseBuffer = () => {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds loop
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Simple white noise
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const startThruster = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  if (thrusterSource) return; // Already playing

  const buffer = createNoiseBuffer();
  if (!buffer) return;

  thrusterSource = audioCtx.createBufferSource();
  thrusterSource.buffer = buffer;
  thrusterSource.loop = true;

  // Lowpass filter to make it sound like a deep rumble (Brown noise approx)
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;

  thrusterGain = audioCtx.createGain();
  thrusterGain.gain.value = 0.0; // Start silent

  thrusterSource.connect(filter);
  filter.connect(thrusterGain);
  thrusterGain.connect(audioCtx.destination);

  thrusterSource.start();
  // Fade in
  thrusterGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.5);
};

export const stopThruster = () => {
  if (thrusterGain && audioCtx) {
    // Fade out
    thrusterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
  }
  
  // Cleanup after fade
  setTimeout(() => {
    if (thrusterSource) {
      try {
        thrusterSource.stop();
        thrusterSource.disconnect();
      } catch (e) { /* ignore if already stopped */ }
      thrusterSource = null;
    }
    if (thrusterGain) {
      thrusterGain.disconnect();
      thrusterGain = null;
    }
  }, 250);
};

export const playExplosion = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  
  // 1. Low frequency boom (Oscillator)
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, t);
  osc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
  
  oscGain.gain.setValueAtTime(0.3, t);
  oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
  
  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  osc.start();
  osc.stop(t + 0.5);

  // 2. Noise crash
  const noiseBuffer = createNoiseBuffer();
  if (noiseBuffer) {
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    
    noise.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start();
    noise.stop(t + 0.3);
  }
};

export const playDamage = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const noiseBuffer = createNoiseBuffer();
  if (noiseBuffer) {
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.value = 500;

    noise.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start();
    noise.stop(t + 0.2);
  }
};

export const playPowerUp = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t); // A4
  osc.frequency.setValueAtTime(554, t + 0.1); // C#5
  osc.frequency.setValueAtTime(659, t + 0.2); // E5
  osc.frequency.linearRampToValueAtTime(880, t + 0.4); // A5

  gain.gain.setValueAtTime(0.1, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.3);
  gain.gain.linearRampToValueAtTime(0, t + 0.5);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(t + 0.5);
};

export const playShoot = () => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.1);

  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(t + 0.1);
};

export const playShieldBreak = () => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.linearRampToValueAtTime(100, t + 0.2);

  gain.gain.setValueAtTime(0.3, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.3);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(t + 0.3);
};

let ctx = null;
let masterGain = null;
let enabled = true;

let currentVolume = 0.35;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = currentVolume;
    masterGain.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

export function setAudioEnabled(on) {
  enabled = !!on;
}

export function setMasterVolume(v) {
  const clamped = Math.max(0, Math.min(1, v));
  currentVolume = clamped;
  if (masterGain) masterGain.gain.value = clamped;
  enabled = clamped > 0.001;
}

export function getMasterVolume() {
  return currentVolume;
}

export function isAudioEnabled() {
  return enabled;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === "suspended") c.resume();
}

function tone({
  freq = 440,
  duration = 0.12,
  type = "square",
  vol = 0.2,
  attack = 0.005,
  release = 0.06,
  freqEnd = null,
  detune = 0,
}) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (detune) osc.detune.setValueAtTime(detune, now);
  if (freqEnd !== null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, freqEnd),
      now + duration,
    );
  }
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + attack);
  g.gain.linearRampToValueAtTime(0.0001, now + duration + release);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + release + 0.02);
}

function noiseBurst({ duration = 0.18, vol = 0.16, filterFreq = 1200 }) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime;
  const buffer = c.createBuffer(
    1,
    Math.max(1, Math.floor(c.sampleRate * duration)),
    c.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.2);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.linearRampToValueAtTime(0.0001, now + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start(now);
  src.stop(now + duration + 0.02);
}

export const sfx = {
  uiClick: () =>
    tone({ freq: 880, duration: 0.04, type: "square", vol: 0.12 }),
  uiHover: () =>
    tone({ freq: 660, duration: 0.03, type: "triangle", vol: 0.06 }),
  uiBack: () =>
    tone({ freq: 320, duration: 0.06, type: "square", vol: 0.12 }),
  place: () => {
    tone({ freq: 380, duration: 0.08, type: "square", vol: 0.16 });
    tone({ freq: 520, duration: 0.1, type: "triangle", vol: 0.14, freqEnd: 700 });
  },
  upgrade: () => {
    tone({ freq: 500, duration: 0.07, type: "square", vol: 0.16 });
    tone({ freq: 760, duration: 0.07, type: "square", vol: 0.16, detune: 5 });
    tone({ freq: 1040, duration: 0.1, type: "triangle", vol: 0.14 });
  },
  sell: () =>
    tone({ freq: 240, duration: 0.18, type: "sawtooth", vol: 0.14, freqEnd: 120 }),
  plunger: () => {
    tone({ freq: 220, duration: 0.06, type: "square", vol: 0.13 });
    noiseBurst({ duration: 0.06, vol: 0.08, filterFreq: 600 });
  },
  suction: () =>
    tone({ freq: 1200, duration: 0.08, type: "sawtooth", vol: 0.1, freqEnd: 220 }),
  chemical: () => {
    tone({ freq: 1300, duration: 0.16, type: "triangle", vol: 0.06, freqEnd: 800 });
    noiseBurst({ duration: 0.18, vol: 0.06, filterFreq: 2000 });
  },
  barracksSpawn: () => {
    tone({ freq: 320, duration: 0.07, type: "square", vol: 0.14 });
    tone({ freq: 420, duration: 0.07, type: "square", vol: 0.13, freqEnd: 280 });
  },
  enemyHit: () =>
    tone({ freq: 180, duration: 0.04, type: "square", vol: 0.08 }),
  enemyDie: () => {
    tone({ freq: 240, duration: 0.08, type: "square", vol: 0.1, freqEnd: 90 });
    noiseBurst({ duration: 0.06, vol: 0.06, filterFreq: 500 });
  },
  enemyEscape: () => {
    tone({ freq: 90, duration: 0.18, type: "sawtooth", vol: 0.16 });
    tone({ freq: 60, duration: 0.22, type: "sawtooth", vol: 0.14, freqEnd: 40 });
  },
  waveStart: () => {
    tone({ freq: 200, duration: 0.12, type: "square", vol: 0.16, freqEnd: 800 });
    noiseBurst({ duration: 0.32, vol: 0.08, filterFreq: 1200 });
  },
  waveClear: () => {
    tone({ freq: 520, duration: 0.08, type: "square", vol: 0.16 });
    tone({ freq: 720, duration: 0.08, type: "square", vol: 0.16, detune: 5 });
    tone({ freq: 960, duration: 0.12, type: "triangle", vol: 0.16 });
  },
  invoice: () => {
    tone({ freq: 90, duration: 0.5, type: "sawtooth", vol: 0.2, freqEnd: 50 });
    noiseBurst({ duration: 0.5, vol: 0.12, filterFreq: 600 });
  },
  victory: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(
        () => tone({ freq: f, duration: 0.16, type: "triangle", vol: 0.18 }),
        i * 110,
      ),
    );
  },
  cheat: () => {
    [330, 440, 550, 660, 880].forEach((f, i) =>
      setTimeout(
        () => tone({ freq: f, duration: 0.06, type: "square", vol: 0.16 }),
        i * 40,
      ),
    );
  },
  hero: () =>
    tone({ freq: 660, duration: 0.18, type: "triangle", vol: 0.2, freqEnd: 1100 }),
  boss: () => {
    tone({ freq: 60, duration: 0.6, type: "sawtooth", vol: 0.22, freqEnd: 30 });
    noiseBurst({ duration: 0.6, vol: 0.16, filterFreq: 400 });
  },
  waveFanfare: () => {
    [392, 494, 588, 740].forEach((f, i) =>
      setTimeout(
        () => tone({ freq: f, duration: 0.1, type: "triangle", vol: 0.16 }),
        i * 70,
      ),
    );
  },
  moneyChime: () => {
    tone({ freq: 1320, duration: 0.04, type: "triangle", vol: 0.1 });
    tone({ freq: 1760, duration: 0.06, type: "triangle", vol: 0.08, detune: 5 });
  },
  lowLivesAlarm: () => {
    tone({ freq: 380, duration: 0.1, type: "sawtooth", vol: 0.16 });
    setTimeout(() => tone({ freq: 380, duration: 0.1, type: "sawtooth", vol: 0.16 }), 130);
  },
  bossDrone: () => {
    tone({ freq: 55, duration: 1.2, type: "sawtooth", vol: 0.18, freqEnd: 75 });
    tone({ freq: 95, duration: 1.2, type: "sine", vol: 0.1, freqEnd: 110 });
    noiseBurst({ duration: 1.0, vol: 0.05, filterFreq: 300 });
  },
  milestone: () => {
    [659, 784, 988, 1175].forEach((f, i) =>
      setTimeout(
        () => tone({ freq: f, duration: 0.12, type: "triangle", vol: 0.16 }),
        i * 90,
      ),
    );
  },
  kitchenAlert: () => {
    tone({ freq: 880, duration: 0.07, type: "square", vol: 0.16 });
    setTimeout(() => tone({ freq: 880, duration: 0.07, type: "square", vol: 0.16 }), 90);
    setTimeout(() => tone({ freq: 1100, duration: 0.12, type: "square", vol: 0.18 }), 180);
  },
};

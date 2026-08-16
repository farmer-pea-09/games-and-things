const MUTE_KEY = 'chameleon-mute';

let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

let musicOn = false;
let musicStep = 0;
let nextNoteTime = 0;
let scheduler = null;
let master = null;
let musicGain = null;
let noiseBuf = null;

// Original sunny synth-pop loop. Not a cover of any song.
const BPM = 126;
const STEP = 60 / BPM / 2;
const LEAD = [
  659, 0, 784, 659, 880, 784, 659, 0,
  587, 659, 784, 0, 659, 587, 523, 0,
  523, 659, 784, 880, 784, 0, 659, 587,
  523, 0, 587, 659, 784, 659, 523, 0,
  784, 880, 1047, 880, 784, 659, 784, 0,
  698, 784, 880, 0, 784, 698, 659, 587,
  523, 659, 784, 659, 587, 0, 523, 494,
  523, 587, 659, 784, 659, 523, 392, 0,
];
const BASS = [
  131, 131, 196, 131, 110, 110, 165, 110,
  87, 87, 131, 87, 98, 98, 147, 98,
];
const CHORDS = [
  [262, 330, 392],
  [220, 262, 330],
  [175, 220, 262],
  [196, 247, 294],
];

function ac() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.9;
    musicGain.connect(master);
    noiseBuf = makeNoise(ctx);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function makeNoise(audio) {
  const buffer = audio.createBuffer(1, audio.sampleRate * 0.4, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function bus() {
  ac();
  return master;
}

function tone(freq, dur, type = 'square', vol = 0.07) {
  if (muted) return;
  const audio = ac();
  const out = bus();
  if (!audio || !out || !freq) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(out);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  osc.stop(audio.currentTime + dur);
}

function envGain(audio, dest, time, vol, dur, attack = 0.01) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(vol, time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  gain.connect(dest);
  return gain;
}

function blip(freq, time, dur, type, vol) {
  const audio = ac();
  if (!audio || !musicGain || !freq) return;
  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  osc.connect(envGain(audio, musicGain, time, vol, dur));
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function kick(time) {
  const audio = ac();
  if (!audio || !musicGain) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(time);
  osc.stop(time + 0.18);
}

function hat(time, open = false) {
  const audio = ac();
  if (!audio || !musicGain || !noiseBuf) return;
  const src = audio.createBufferSource();
  src.buffer = noiseBuf;
  const filter = audio.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  const gain = audio.createGain();
  const dur = open ? 0.12 : 0.04;
  gain.gain.setValueAtTime(open ? 0.045 : 0.03, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(musicGain);
  src.start(time);
  src.stop(time + dur);
}

function clap(time) {
  const audio = ac();
  if (!audio || !musicGain || !noiseBuf) return;
  const src = audio.createBufferSource();
  src.buffer = noiseBuf;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.09, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(musicGain);
  src.start(time);
  src.stop(time + 0.14);
}

function tickMusic() {
  const audio = ac();
  if (!audio || !musicOn || muted) return;
  while (nextNoteTime < audio.currentTime + 0.45) {
    const step = musicStep % LEAD.length;
    const beat = musicStep % 8;

    if (beat === 0 || beat === 4) kick(nextNoteTime);
    if (beat === 2 || beat === 6) clap(nextNoteTime);
    hat(nextNoteTime, beat === 7);
    if (beat === 1 || beat === 3 || beat === 5) hat(nextNoteTime + STEP * 0.5, false);

    const bass = BASS[Math.floor(step / 2) % BASS.length];
    if (musicStep % 2 === 0) blip(bass, nextNoteTime, 0.22, 'triangle', 0.07);

    if (beat === 0) {
      const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
      for (const note of chord) blip(note, nextNoteTime, 0.55, 'sine', 0.028);
    }

    const lead = LEAD[step];
    if (lead) blip(lead, nextNoteTime, 0.15, 'square', 0.045);

    musicStep += 1;
    nextNoteTime += STEP;
  }
}

export function sfx(name) {
  if (muted) return;
  switch (name) {
    case 'jump':
      tone(420, 0.12, 'square', 0.05);
      break;
    case 'super':
      tone(330, 0.08, 'square', 0.06);
      setTimeout(() => tone(523, 0.1, 'square', 0.06), 60);
      setTimeout(() => tone(784, 0.16, 'square', 0.06), 130);
      break;
    case 'stomp':
      tone(180, 0.1, 'triangle', 0.08);
      break;
    case 'coin':
      tone(880, 0.08, 'square', 0.05);
      setTimeout(() => tone(1180, 0.1, 'square', 0.05), 50);
      break;
    case 'power':
      tone(330, 0.08);
      setTimeout(() => tone(440, 0.08), 70);
      setTimeout(() => tone(554, 0.12), 140);
      break;
    case 'tongue':
      tone(620, 0.06, 'sawtooth', 0.04);
      break;
    case 'hurt':
      tone(140, 0.22, 'sawtooth', 0.07);
      break;
    case 'clear':
      tone(523, 0.12);
      setTimeout(() => tone(659, 0.12), 120);
      setTimeout(() => tone(784, 0.12), 240);
      setTimeout(() => tone(1046, 0.28), 360);
      break;
    case 'bump':
      tone(200, 0.07, 'triangle', 0.05);
      break;
    case 'life':
      tone(660, 0.1);
      setTimeout(() => tone(880, 0.18), 100);
      break;
    default:
      break;
  }
}

export function isMuted() {
  return muted;
}

export function startMusic() {
  const audio = ac();
  if (!audio || musicOn) return;
  musicOn = true;
  musicStep = 0;
  nextNoteTime = audio.currentTime + 0.05;
  if (master) master.gain.value = muted ? 0 : 1;
  if (!scheduler) scheduler = setInterval(tickMusic, 70);
  tickMusic();
}

export function stopMusic() {
  musicOn = false;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  const audio = ac();
  if (master) master.gain.setValueAtTime(muted ? 0 : 1, audio ? audio.currentTime : 0);
  if (!muted) startMusic();
  return muted;
}

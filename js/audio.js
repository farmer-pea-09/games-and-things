let ctx = null;

function ac() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.07) {
  const audio = ac();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  osc.stop(audio.currentTime + dur);
}

export function sfx(name) {
  switch (name) {
    case 'jump':
      tone(420, 0.12, 'square', 0.05);
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

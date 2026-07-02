let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Pleasant two-tone notification chime (no audio file needed) */
export function playNotificationSound() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});

  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.18;
  master.connect(ac.destination);

  // Two soft bell tones: E6 then A6
  [[1318.5, 0], [1760, 0.12]].forEach(([freq, delay]) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(1, now + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.45);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + delay);
    osc.stop(now + delay + 0.5);
  });
}

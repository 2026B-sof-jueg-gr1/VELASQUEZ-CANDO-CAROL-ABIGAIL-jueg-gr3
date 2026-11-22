// Sonidos con WebAudio y estilos de texto compartidos
// Sonidos generados con WebAudio, sin archivos de audio
function beep(scene, freq, duration, type = 'square', slideTo = null) {
  const ctx = scene.sound.context;
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) { /* sin audio */ }
}

const TEXT = { fontFamily: FONT_BODY, color: PAL.text };
const TITLE = { fontFamily: FONT_TITLE, color: CSS.gold, fontStyle: '900' };
const HUD_STYLE = { ...TEXT, fontSize: '18px', backgroundColor: 'rgba(11,20,16,0.78)', padding: { x: 10, y: 4 } };


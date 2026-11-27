// Sonidos con WebAudio y estilos de texto compartidos
// Sonidos generados con WebAudio, sin archivos de audio
// Interruptor de sonido: se recuerda entre partidas (localStorage)
const SOUND = { muted: (() => { try { return localStorage.getItem('amaru-muted') === '1'; } catch (e) { return false; } })() };
function setMuted(m) {
  SOUND.muted = m;
  try { localStorage.setItem('amaru-muted', m ? '1' : '0'); } catch (e) { /* sin storage */ }
}

function beep(scene, freq, duration, type = 'square', slideTo = null) {
  if (SOUND.muted) return;
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


// ---------- Botones redondos para tocar (pausa y sonido) ----------

// Radio de diseño para que el botón mida al menos 44 px reales con la escala actual de la pantalla
// (en un celular vertical de 360 px el lienzo se escala ~0,43: sale de ~104 px de diseño). `min` es el radio en escritorio.
function touchRadius(scene, min = 20) {
  const ds = scene.scale.displaySize.width / scene.scale.gameSize.width || 1;
  return Phaser.Math.Clamp(Math.ceil(46 / ds / 2), min, 52);
}

// ¿Hay pantalla táctil? (en debug, ?touch=1 lo simula para poder verlo en el escritorio)
const FORCE_TOUCH = DEBUG && new URLSearchParams(window.location.search).get('touch') === '1';
function isTouch(scene) {
  return FORCE_TOUCH || !!(scene.sys.game.device.input && scene.sys.game.device.input.touch);
}

// Dibuja el ícono de un botón en (0,0) con tamaño de radio 20 (se escala con `k`)
function drawButtonIcon(g, kind) {
  g.fillStyle(PAL.goldLight);
  g.lineStyle(3, PAL.goldLight);
  if (kind === 'pause') {
    g.fillRoundedRect(-8, -9, 5, 18, 1.5); g.fillRoundedRect(3, -9, 5, 18, 1.5);
  } else if (kind === 'play') {
    g.fillTriangle(-6, -10, -6, 10, 10, 0);
  } else {                                   // altavoz; con 'mute' lleva una cruz en lugar de ondas
    g.fillRect(-10, -4, 5, 8);
    g.fillTriangle(-5, -4, -5, 4, 1, 9); g.fillTriangle(-5, -4, 1, -9, 1, 9); g.fillTriangle(-5, 4, 1, 9, 1, -9);
    if (kind === 'sound') {
      g.beginPath(); g.arc(2, 0, 6, -0.9, 0.9); g.strokePath();
      g.beginPath(); g.arc(2, 0, 11, -0.9, 0.9); g.strokePath();
    } else {
      g.lineStyle(3, 0xff8a7a);
      g.lineBetween(5, -6, 13, 6); g.lineBetween(13, -6, 5, 6);
    }
  }
}

// Botón redondo con ícono. `icon()` devuelve 'pause' | 'play' | 'sound' | 'mute'; `onTap` se llama al tocarlo.
// Devuelve { g, zone, setPos(x, y, r), redraw(), destroy() }.
function makeRoundButton(scene, x, y, r, depth, icon, onTap) {
  const g = scene.add.graphics().setDepth(depth);
  const zone = scene.add.zone(x, y, 2 * r, 2 * r).setInteractive({ useHandCursor: true }).setDepth(depth);
  const b = { g, zone, x, y, r, redraw() {
    g.clear();
    g.setPosition(b.x, b.y);
    g.fillStyle(PAL.bg, 0.62); g.fillCircle(0, 0, b.r + 2);
    g.fillStyle(PAL.surface, 0.78); g.fillCircle(0, 0, b.r);
    g.lineStyle(3, PAL.gold, 0.95); g.strokeCircle(0, 0, b.r);
    g.save(); g.scaleCanvas(b.r / 20, b.r / 20); drawButtonIcon(g, icon()); g.restore();
  }, setPos(nx, ny, nr) { b.x = nx; b.y = ny; b.r = nr; zone.setPosition(nx, ny).setSize(2 * nr, 2 * nr); b.redraw(); },
  destroy() { g.destroy(); zone.destroy(); } };
  zone.on('pointerdown', (p, lx, ly, ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); onTap(); b.redraw(); });
  b.redraw();
  return b;
}

// Interruptor de sonido (altavoz): cambia SOUND.muted y lo guarda
function makeSoundButton(scene, x, y, r, depth) {
  return makeRoundButton(scene, x, y, r, depth, () => (SOUND.muted ? 'mute' : 'sound'), () => {
    setMuted(!SOUND.muted);
    if (!SOUND.muted) beep(scene, 660, 0.08, 'triangle', 880);
  });
}

// Contador de cuadros por segundo (tecla T en modo debug): sirve para mirar el rendimiento en un celular
function toggleFps(scene) {
  if (scene._fps) {
    scene._fps.timer.remove(); scene._fps.text.destroy(); scene._fps = null;
    return;
  }
  const text = scene.add.text(400, 600, '', { fontFamily: FONT_BODY, fontSize: '16px', color: '#1a1204', backgroundColor: '#7dff9a', padding: { x: 6, y: 2 } })
    .setOrigin(0.5, 1).setDepth(DEPTH.overlay + 5);
  const update = () => {
    const fps = Math.round(scene.game.loop.actualFps);
    scene._fpsMin = scene._fpsMin === undefined ? fps : Math.min(scene._fpsMin, fps);
    text.setText('FPS ' + fps + ' · mínimo ' + scene._fpsMin + ' · ' + (scene.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'));
  };
  scene._fpsMin = undefined;
  scene._fps = { text, timer: scene.time.addEvent({ delay: 500, loop: true, callback: update }) };
  update();
}

// Las escenas se diseñaron en 800 x 600. El lienzo mide 840 x 640 (con el anillo del marco),
// así que se corre la cámara una celda: las coordenadas de siempre siguen valiendo.
function frameCamera(scene) {
  scene.cameras.main.setScroll(-MARGIN, -MARGIN);
}

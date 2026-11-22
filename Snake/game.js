const CELL = 20;
const COLS = 40; // 800 / 20
const ROWS = 30; // 600 / 20

// Paleta de Amaru: la misma que usa la landing page (styles.css)
const PAL = {
  bg: 0x0b1410, surface: 0x15231c, line: 0x2b4034,
  text: '#efe6d2', muted: '#bdb6a2',
  gold: 0xf2b33d, goldDark: 0xb97f12, goldLight: 0xffe9a8,
  scale: 0x3fae6a, red: 0xd8433a
};
const CSS = { gold: '#f2b33d', goldLight: '#ffe9a8', scale: '#74d695', dark: '#0b1410' };
const FONT_TITLE = '"Cinzel Decorative", Georgia, serif';
const FONT_BODY = 'Outfit, system-ui, sans-serif';

const HEAD_COLOR = 0x74d695;  // verde claro de la cabeza
const TAIL_COLOR = 0x1f6e43;  // verde profundo de la cola
const BONUS_EVERY = 5;      // cada cuántas manzanas aparece la Fruta del Origen
const BONUS_TIME = 8000;    // ms que dura la Fruta del Origen (igual que en la landing: 8 segundos)
const LEVEL_POINTS = 100;   // puntos para pasar al siguiente escenario
const POWER_TIME = 7000;    // ms que un poder se queda en el tablero
const SLOW_FACTOR = 1.6;    // cuánto más lento va la serpiente con el poder Lento

// Capas de dibujo (mayor = encima)
const DEPTH = { bg: 0, ambient: 1, items: 2, snake: 3, fx: 4, hud: 10, banner: 15, overlay: 20 };

const DIRS = {
  ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 }
};

const POWERS = {
  slow: { label: 'Lento', color: 0x3d5bd9, time: 6000 },
  double: { label: 'Puntos x2', color: 0xf2b33d, time: 10000 },
  shield: { label: 'Escudo', color: 0x3fae6a },
  cut: { label: 'Tijeras', color: 0xe2512f }
};

function loadBest() {
  try { return Number(localStorage.getItem('snake-best')) || 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('snake-best', String(v)); } catch (e) { /* sin storage */ }
}

// ---------- Utilidades de color ----------

// amt > 0 aclara hacia blanco, amt < 0 oscurece hacia negro
function shade(color, amt) {
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return (Math.round(r + (t - r) * p) << 16) | (Math.round(g + (t - g) * p) << 8) | Math.round(b + (t - b) * p);
}

// Degradado de la cabeza (verde claro) a la cola (verde oscuro)
function segmentColor(i, len) {
  const C = Phaser.Display.Color;
  const c = C.Interpolate.ColorWithColor(C.ValueToColor(HEAD_COLOR), C.ValueToColor(TAIL_COLOR), Math.max(len - 1, 1), i);
  return C.GetColor(c.r, c.g, c.b);
}

// ---------- Dibujo con relieve ----------

function drawSegmentShadow(g, cell) {
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(cell.x * CELL + 3, cell.y * CELL + 5, CELL - 2, CELL - 3, 6);
}

// Cada bloque tiene un lado oscuro (grosor), una cara superior y un brillo
function drawSegment(g, cell, color, i) {
  const x = cell.x * CELL + 1, y = cell.y * CELL + 1, s = CELL - 2;
  g.fillStyle(shade(color, -0.4));
  g.fillRoundedRect(x, y, s, s, 6);
  g.fillStyle(color);
  g.fillRoundedRect(x, y, s, s - 4, 6);
  g.fillStyle(shade(color, 0.5), 0.8);
  g.fillRoundedRect(x + 3, y + 2, s - 8, 4, 2);
  // Rombo dorado en la espalda, uno sí y uno no (como el dibujo de las escamas de la landing)
  if (i > 0 && i % 2 === 0) {
    const cx = x + s / 2, cy = y + (s - 4) / 2;
    g.fillStyle(PAL.gold, 0.7);
    g.fillPoints([{ x: cx, y: cy - 4 }, { x: cx + 3.5, y: cy }, { x: cx, y: cy + 4 }, { x: cx - 3.5, y: cy }], true);
  }
}

function drawSnake(g, snake, dir, shield) {
  snake.forEach((s) => drawSegmentShadow(g, s));
  for (let i = snake.length - 1; i >= 0; i--) drawSegment(g, snake[i], segmentColor(i, snake.length), i);

  const h = snake[0];
  const cx = h.x * CELL + CELL / 2;
  const cy = h.y * CELL + CELL / 2 - 2;

  // Contorno dorado fino en la cabeza
  g.lineStyle(1.5, PAL.gold, 0.7);
  g.strokeRoundedRect(h.x * CELL + 1, h.y * CELL + 1, CELL - 2, CELL - 6, 6);

  if (shield) {
    g.lineStyle(2, PAL.gold, 0.9);
    g.strokeCircle(cx, cy + 2, 13);
  }

  // Ojos dorados con pupila vertical de serpiente, mirando hacia donde avanza
  for (const side of [-1, 1]) {
    const ex = cx + dir.x * 3 - dir.y * side * 4;
    const ey = cy + dir.y * 3 + dir.x * side * 4;
    g.fillStyle(0xf2c14e);
    g.fillCircle(ex, ey, 3.2);
    g.fillStyle(PAL.bg);
    if (dir.x !== 0) g.fillEllipse(ex + dir.x * 0.5, ey, 3.2, 1.2); else g.fillEllipse(ex, ey + dir.y * 0.5, 1.2, 3.2);
  }
}

// Los objetos se dibujan alrededor de (0,0) para poder moverlos y escalarlos
function drawApple(g) {
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(2, 9, 16, 6);
  g.fillStyle(0x992a23);
  g.fillCircle(0, 1, 8);
  g.fillStyle(PAL.red);
  g.fillCircle(-1, 0, 7);
  g.fillStyle(0xff9f93, 0.8);
  g.fillCircle(-3, -3, 2.5);
  g.fillStyle(0x5a3a0a);
  g.fillRect(-1, -9, 2, 4);
  g.fillStyle(PAL.scale);
  g.fillEllipse(4, -7, 7, 4);
}

// La Fruta del Origen: dorada y con halo, igual que la de la landing
function drawOriginFruit(g) {
  g.fillStyle(PAL.gold, 0.14);
  g.fillCircle(0, 0, 18);
  g.fillStyle(PAL.gold, 0.2);
  g.fillCircle(0, 0, 14);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(2, 8, 16, 6);
  g.fillStyle(PAL.goldDark);
  g.fillCircle(0, 1, 9);
  g.fillStyle(PAL.gold);
  g.fillCircle(-0.5, 0, 8);
  g.fillStyle(PAL.goldLight, 0.9);
  g.fillCircle(-3, -3, 3);
  g.fillStyle(0x5a3a0a);
  g.fillRect(-1, -10, 2, 4);
  g.fillStyle(PAL.scale);
  g.fillEllipse(4, -8, 7, 4);
}

// Iconos de los poderes dibujados con formas (sin emojis), igual que los iconos de la landing
function drawPowerIcon(g, type) {
  g.fillStyle(0xffffff);
  g.lineStyle(2, 0xffffff);
  if (type === 'slow') { // reloj de arena
    g.fillTriangle(-4, -5, 4, -5, 0, 0);
    g.fillTriangle(-4, 5, 4, 5, 0, 0);
  } else if (type === 'shield') {
    g.fillPoints([{ x: -5, y: -5 }, { x: 5, y: -5 }, { x: 5, y: 1 }, { x: 0, y: 6 }, { x: -5, y: 1 }], true);
  } else if (type === 'cut') { // tijeras
    g.lineBetween(-4, -5, 4, 5);
    g.lineBetween(4, -5, -4, 5);
  }
}

function drawOrb(g, color) {
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(2, 10, 18, 6);
  g.fillStyle(shade(color, -0.35));
  g.fillCircle(0, 1, 9.5);
  g.fillStyle(color);
  g.fillCircle(0, 0, 8.5);
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(-2, -4, 9, 4);
}

// ---------- Escenarios ----------

function drawGround(g, tiles) {
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      g.fillStyle((x + y) % 2 ? tiles[0] : tiles[1]);
      g.fillRect(x * CELL, y * CELL, CELL, CELL);
      // Borde iluminado arriba y sombra abajo: da sensación de baldosa
      g.fillStyle(0xffffff, 0.05);
      g.fillRect(x * CELL, y * CELL, CELL, 2);
      g.fillStyle(0x000000, 0.08);
      g.fillRect(x * CELL, y * CELL + CELL - 2, CELL, 2);
    }
  }
}

function drawPatches(g, rnd, color, alpha, count) {
  for (let i = 0; i < count; i++) {
    g.fillStyle(color, alpha);
    g.fillEllipse(rnd.between(0, 800), rnd.between(0, 600), rnd.between(80, 200), rnd.between(50, 120));
  }
}

function drawRock(g, x, y, color, cap) {
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(x + 2, y + 4, 14, 6);
  g.fillStyle(shade(color, -0.3));
  g.fillEllipse(x, y + 1, 12, 8);
  g.fillStyle(color);
  g.fillEllipse(x, y, 11, 6);
  if (cap) {
    g.fillStyle(cap);
    g.fillEllipse(x, y - 2, 9, 3);
  }
}

function drawVignette(g) {
  for (let i = 0; i < 10; i++) {
    g.lineStyle(8, 0x000000, 0.035 * (10 - i));
    g.strokeRect(i * 8 + 4, i * 8 + 4, 800 - i * 16 - 8, 600 - i * 16 - 8);
  }
}

function decorForest(g, rnd) {
  drawPatches(g, rnd, 0x1b3a17, 0.25, 10);
  for (let i = 0; i < 90; i++) {
    const x = rnd.between(0, 800), y = rnd.between(0, 600);
    g.fillStyle(rnd.pick([0x4f8f3a, 0x5fa346, 0x3d7a2e]));
    g.fillTriangle(x, y, x + 2, y - 7, x + 4, y);
    g.fillTriangle(x + 3, y, x + 6, y - 5, x + 8, y);
  }
  for (let i = 0; i < 30; i++) {
    const x = rnd.between(0, 800), y = rnd.between(0, 600);
    g.fillStyle(rnd.pick([0xffffff, 0xf1c40f, 0xfd79a8]));
    g.fillCircle(x, y, 2.2);
    g.fillStyle(0xf39c12);
    g.fillCircle(x, y, 0.9);
  }
  for (let i = 0; i < 9; i++) {
    const x = rnd.between(10, 790), y = rnd.between(10, 590);
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(x + 2, y + 4, 12, 4);
    g.fillStyle(0xf5e6c8);
    g.fillRect(x - 2, y - 2, 4, 5);
    g.fillStyle(0xc0392b);
    g.fillEllipse(x, y - 3, 12, 7);
    g.fillStyle(0xffffff);
    g.fillCircle(x - 2, y - 4, 1);
    g.fillCircle(x + 2, y - 3, 1);
  }
  for (let i = 0; i < 12; i++) drawRock(g, rnd.between(0, 800), rnd.between(0, 600), 0x8e9a8c);
  for (let i = 0; i < 25; i++) {
    g.fillStyle(rnd.pick([0xd35400, 0xe67e22, 0xb7950b]), 0.7);
    g.fillEllipse(rnd.between(0, 800), rnd.between(0, 600), 7, 4);
  }
}

function decorDesert(g, rnd) {
  drawPatches(g, rnd, 0xb8925a, 0.18, 10);
  for (let i = 0; i < 16; i++) {
    const x = rnd.between(0, 800), y = rnd.between(0, 600), r = rnd.between(40, 90);
    g.lineStyle(2, 0xb8925a, 0.5);
    g.beginPath();
    g.arc(x, y, r, Math.PI * 1.15, Math.PI * 1.85);
    g.strokePath();
  }
  for (let i = 0; i < 9; i++) {
    const x = rnd.between(10, 790), y = rnd.between(15, 590);
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(x + 4, y + 6, 14, 5);
    g.fillStyle(0x1e8449);
    g.fillRoundedRect(x - 3, y - 12, 6, 18, 3);
    g.fillRoundedRect(x - 9, y - 6, 4, 8, 2);
    g.fillRoundedRect(x + 5, y - 9, 4, 8, 2);
    g.fillStyle(0x58d68d, 0.6);
    g.fillRect(x - 1, y - 10, 1.5, 14);
  }
  for (let i = 0; i < 35; i++) drawRock(g, rnd.between(0, 800), rnd.between(0, 600), 0xa0826d);
}

function decorSnow(g, rnd) {
  drawPatches(g, rnd, 0xbfd6ea, 0.35, 10);
  for (let i = 0; i < 8; i++) {
    const x = rnd.between(0, 800), y = rnd.between(0, 600);
    g.fillStyle(0xbfe3f5, 0.7);
    g.fillEllipse(x, y, rnd.between(40, 90), rnd.between(20, 40));
    g.lineStyle(2, 0xffffff, 0.8);
    g.lineBetween(x - 12, y - 4, x + 6, y - 8);
  }
  for (let i = 0; i < 10; i++) {
    const x = rnd.between(10, 790), y = rnd.between(20, 590);
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(x + 4, y + 3, 16, 5);
    g.fillStyle(0x6d4c41);
    g.fillRect(x - 1.5, y - 2, 3, 4);
    for (let k = 0; k < 3; k++) {
      const w = 14 - k * 4, top = y - 6 - k * 6;
      g.fillStyle(0x1e5631);
      g.fillTriangle(x - w / 2, top + 6, x, top - 4, x + w / 2, top + 6);
      g.fillStyle(0xffffff);
      g.fillTriangle(x - w / 4, top + 1, x, top - 4, x + w / 4, top + 1);
    }
  }
  for (let i = 0; i < 15; i++) drawRock(g, rnd.between(0, 800), rnd.between(0, 600), 0x7f8c8d, 0xffffff);
}

function decorVolcano(g, rnd) {
  drawPatches(g, rnd, 0x000000, 0.2, 10);
  for (let i = 0; i < 3; i++) {
    const x = rnd.between(60, 740), y = rnd.between(60, 540);
    g.fillStyle(0xff4500, 0.25);
    g.fillEllipse(x, y, 90, 50);
    g.fillStyle(0xe74c3c);
    g.fillEllipse(x, y, 70, 36);
    g.fillStyle(0xf39c12);
    g.fillEllipse(x - 4, y - 3, 44, 20);
    g.fillStyle(0xffeaa7, 0.8);
    g.fillEllipse(x - 8, y - 5, 16, 6);
  }
  for (let i = 0; i < 16; i++) {
    const pts = [{ x: rnd.between(0, 800), y: rnd.between(0, 600) }];
    for (let k = 0; k < 6; k++) {
      const p = pts[pts.length - 1];
      pts.push({ x: p.x + rnd.between(-25, 25), y: p.y + rnd.between(-25, 25) });
    }
    g.lineStyle(6, 0xff4500, 0.25);
    g.strokePoints(pts);
    g.lineStyle(2, 0xffa502, 0.9);
    g.strokePoints(pts);
  }
  for (let i = 0; i < 25; i++) drawRock(g, rnd.between(0, 800), rnd.between(0, 600), 0x4a3b3b);
}

function decorNight(g, rnd) {
  drawPatches(g, rnd, 0x000000, 0.25, 10);
  for (let i = 0; i < 80; i++) {
    const x = rnd.between(0, 800), y = rnd.between(0, 600);
    g.fillStyle(rnd.pick([0x24493a, 0x2c5545]));
    g.fillTriangle(x, y, x + 2, y - 7, x + 4, y);
  }
  for (let i = 0; i < 12; i++) {
    const x = rnd.between(10, 790), y = rnd.between(10, 590);
    g.fillStyle(0x74f2ff, 0.15);
    g.fillCircle(x, y - 2, 14);
    g.fillStyle(0xdfe6e9);
    g.fillRect(x - 1.5, y - 2, 3, 5);
    g.fillStyle(0x00cec9);
    g.fillEllipse(x, y - 3, 10, 6);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(x - 2, y - 4, 1);
  }
  for (let i = 0; i < 12; i++) drawRock(g, rnd.between(0, 800), rnd.between(0, 600), 0x4b5d67);
}

const SCENARIOS = [
  { name: 'Bosque', tiles: [0x2e5e2a, 0x346a2f], decor: decorForest, ambient: 'leaves' },
  { name: 'Desierto', tiles: [0xd8b26e, 0xdcb874], decor: decorDesert, ambient: 'sand' },
  { name: 'Nieve', tiles: [0xdde8f2, 0xe6eef7], decor: decorSnow, ambient: 'snow' },
  { name: 'Volcán', tiles: [0x3a2a2a, 0x412f2f], decor: decorVolcano, ambient: 'embers' },
  { name: 'Noche', tiles: [0x14261f, 0x172b23], decor: decorNight, ambient: 'fireflies' }
];

// Partículas de ambiente de cada escenario
const AMBIENT = {
  leaves: {
    texture: 'leaf', x: { min: 0, max: 800 }, y: -10, speedY: { min: 25, max: 55 }, speedX: { min: -30, max: 30 },
    rotate: { start: 0, end: 360 }, lifespan: 14000, frequency: 450, alpha: 0.85,
    tint: 0xe67e22
  },
  sand: {
    texture: 'dot', x: -10, y: { min: 0, max: 600 }, speedX: { min: 90, max: 170 }, speedY: { min: -10, max: 10 },
    scale: { min: 0.25, max: 0.55 }, lifespan: 7000, frequency: 90, alpha: { start: 0.7, end: 0 }, tint: 0xfff3d6
  },
  snow: {
    texture: 'dot', x: { min: 0, max: 800 }, y: -10, speedY: { min: 35, max: 75 }, speedX: { min: -15, max: 15 },
    scale: { min: 0.3, max: 0.8 }, lifespan: 12000, frequency: 70, tint: 0xffffff
  },
  embers: {
    texture: 'dot', x: { min: 0, max: 800 }, y: 610, speedY: { min: -70, max: -30 }, speedX: { min: -15, max: 15 },
    scale: { start: 0.7, end: 0 }, lifespan: 8000, frequency: 140, blendMode: 'ADD',
    tint: 0xff8c00
  },
  fireflies: {
    texture: 'dot', x: { min: 0, max: 800 }, y: { min: 0, max: 600 }, speed: { min: 5, max: 20 },
    scale: 0.5, lifespan: 3000, frequency: 180, alpha: { start: 1, end: 0 }, blendMode: 'ADD', tint: 0xd4ff6b
  }
};

function makeTextures(scene) {
  if (scene.textures.exists('dot')) return;
  const t = scene.make.graphics({ add: false });
  t.fillStyle(0xffffff);
  t.fillCircle(4, 4, 4);
  t.generateTexture('dot', 8, 8);
  t.clear();
  t.fillStyle(0xffffff); // clear() deja el relleno en negro
  t.fillEllipse(5, 3, 10, 5);
  t.generateTexture('leaf', 10, 6);
  t.destroy();
}

// Dibuja el escenario una sola vez en una textura y devuelve imagen + partículas
function createScenario(scene, index) {
  const sc = SCENARIOS[index];
  const key = 'bg-' + sc.name;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ add: false });
    const rnd = new Phaser.Math.RandomDataGenerator([sc.name]);
    drawGround(g, sc.tiles);
    sc.decor(g, rnd);
    drawVignette(g);
    g.generateTexture(key, 800, 600);
    g.destroy();
  }
  const image = scene.add.image(400, 300, key).setDepth(DEPTH.bg);
  const { texture, ...cfg } = AMBIENT[sc.ambient];
  const ambient = scene.add.particles(0, 0, texture, cfg).setDepth(DEPTH.ambient);
  if (ambient.fastForward) ambient.fastForward(6000);
  return { image, ambient, name: sc.name };
}

// ---------- Sonido ----------

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

// ---------- Escenas ----------

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    makeTextures(this);
    createScenario(this, 0);

    // Serpiente decorativa persiguiendo una manzana
    const snake = [];
    for (let i = 0; i < 12; i++) snake.push({ x: 25 - i, y: 2 });
    drawSnake(this.add.graphics().setDepth(DEPTH.snake), snake, { x: 1, y: 0 }, false);
    const apple = this.add.graphics().setDepth(DEPTH.items);
    drawApple(apple);
    apple.setPosition(29 * CELL + CELL / 2, 2 * CELL + CELL / 2);
    this.tweens.add({ targets: apple, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });

    const front = (obj) => obj.setOrigin(0.5).setDepth(DEPTH.hud);
    front(this.add.text(400, 135, 'AMARU', {
      ...TITLE, fontSize: '92px',
      stroke: '#3a2504', strokeThickness: 8, shadow: { offsetX: 3, offsetY: 5, color: '#000', blur: 8, fill: true, stroke: true }
    }));
    front(this.add.text(400, 205, 'la Fruta del Origen', {
      ...TITLE, fontSize: '24px', fontStyle: '700', color: PAL.text, stroke: '#0b1410', strokeThickness: 5
    }));
    front(this.add.text(400, 243, 'Fase inicial · Come, crece y muda tu piel', {
      ...TEXT, fontSize: '19px', stroke: '#0b1410', strokeThickness: 4
    }));

    this.add.rectangle(400, 346, 560, 140, PAL.bg, 0.85).setStrokeStyle(2, PAL.gold, 0.55).setDepth(DEPTH.hud);
    front(this.add.text(400, 346, [
      'Flechas / WASD / deslizar: moverte   ·   P o Esc: pausa',
      'La Fruta del Origen dorada da +50 y solo dura 8 segundos',
      'Poderes: Lento · Puntos x2 · Escudo · Tijeras',
      'Cada 100 puntos viajas a una nueva tierra'
    ], { ...TEXT, fontSize: '17px', lineSpacing: 9, align: 'center' }));

    // Las cinco tierras, con los mismos colores de la landing
    const worlds = [['Bosque', '#6fd197'], ['Desierto', '#e0b469'], ['Nieve', '#cfe6f2'], ['Volcán', '#f0704d'], ['Noche', '#8fa4ff']];
    worlds.forEach(([name, color], i) => front(this.add.text(176 + i * 112, 432, name, {
      ...TEXT, fontSize: '16px', fontStyle: '700', color, backgroundColor: 'rgba(11,20,16,0.85)', padding: { x: 8, y: 3 }
    })));

    front(this.add.text(400, 478, 'Récord: ' + loadBest(), HUD_STYLE).setColor(CSS.gold));
    front(this.add.text(400, 535, 'Presiona ESPACIO o toca la pantalla para jugar', {
      ...TEXT, fontSize: '19px', stroke: '#0b1410', strokeThickness: 5
    }));

    const start = () => {
      beep(this, 440, 0.12, 'square', 880);
      this.scene.start('SnakeScene');
    };
    this.input.keyboard.addCapture('SPACE');
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}

class SnakeScene extends Phaser.Scene {
  constructor() {
    super('SnakeScene');
  }

  create() {
    this.snake = [{ x: 20, y: 15 }, { x: 19, y: 15 }, { x: 18, y: 15 }];
    this.dir = { x: 1, y: 0 };
    this.queue = [];
    this.score = 0;
    this.best = loadBest();
    this.stepDelay = 120; // ms entre pasos, baja al comer
    this.acc = 0;
    this.dead = false;
    this.paused = false;
    this.applesEaten = 0;
    this.bonus = null;
    this.level = 0;
    this.power = null;               // poder que está en el tablero
    this.powerCooldown = 5000;       // ms hasta intentar sacar otro poder
    this.effects = { slow: 0, double: 0, shield: false };

    makeTextures(this);
    this.scenario = createScenario(this, 0);

    this.foodGfx = this.add.graphics().setDepth(DEPTH.items);
    drawApple(this.foodGfx);
    this.tweens.add({ targets: this.foodGfx, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });

    this.bonusGfx = this.add.graphics().setVisible(false).setDepth(DEPTH.items);
    drawOriginFruit(this.bonusGfx);
    this.tweens.add({ targets: this.bonusGfx, scale: 1.12, duration: 600, yoyo: true, repeat: -1 });

    this.gfx = this.add.graphics().setDepth(DEPTH.snake);
    const burst = (tint, speed, lifespan) => this.add.particles(0, 0, 'dot', {
      speed, lifespan, scale: { start: 1, end: 0 }, tint, emitting: false
    }).setDepth(DEPTH.fx);
    this.appleBurst = burst(PAL.red, { min: 60, max: 200 }, 450);
    this.starBurst = burst(PAL.gold, { min: 80, max: 260 }, 600);
    this.powerBurst = burst(0xffffff, { min: 80, max: 220 }, 500);
    this.cutBurst = burst(PAL.scale, { min: 40, max: 140 }, 400);

    this.food = this.spawnFood();
    this.placeAt(this.foodGfx, this.food);

    this.scoreText = this.add.text(10, 8, 'Puntos: 0', HUD_STYLE).setDepth(DEPTH.hud);
    this.levelText = this.add.text(400, 8, '', HUD_STYLE).setOrigin(0.5, 0).setDepth(DEPTH.hud);
    this.bestText = this.add.text(790, 8, 'Récord: ' + this.best, HUD_STYLE).setOrigin(1, 0).setDepth(DEPTH.hud);
    this.effectsText = this.add.text(10, 592, '', HUD_STYLE).setOrigin(0, 1).setDepth(DEPTH.hud).setVisible(false);
    this.updateLevelText();

    this.pauseLayer = this.add.container(0, 0, [
      this.add.rectangle(400, 300, 800, 600, PAL.bg, 0.65),
      this.add.text(400, 280, 'Pausa', { ...TITLE, fontSize: '48px' }).setOrigin(0.5),
      this.add.text(400, 335, 'P o Esc para continuar', { ...TEXT, fontSize: '18px', color: PAL.muted }).setOrigin(0.5)
    ]).setVisible(false).setDepth(DEPTH.overlay);

    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    this.input.keyboard.on('keydown', (e) => this.handleKey(e.code));

    // Deslizar el dedo en pantallas táctiles
    this.input.on('pointerup', (p) => {
      const dx = p.upX - p.downX;
      const dy = p.upY - p.downY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      this.turn(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
    });

    this.draw();
  }

  handleKey(code) {
    if (code === 'KeyP' || code === 'Escape') return this.togglePause();
    const d = DIRS[code];
    if (d) this.turn(d);
  }

  turn(d) {
    if (this.dead || this.paused) return;
    // Comparar con la última dirección encolada para no dar media vuelta
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (this.queue.length < 2) this.queue.push(d);
  }

  togglePause() {
    if (this.dead) return;
    this.paused = !this.paused;
    this.pauseLayer.setVisible(this.paused);
    // Detiene también el temporizador de la estrella y las animaciones
    this.time.paused = this.paused;
    if (this.paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
  }

  update(time, delta) {
    if (this.dead || this.paused) return;
    this.updatePowers(delta);
    this.acc += delta;
    // Con el poder 🐢 cada paso tarda más
    const delay = this.effects.slow > 0 ? this.stepDelay * SLOW_FACTOR : this.stepDelay;
    while (this.acc >= delay && !this.dead) {
      this.acc -= delay;
      this.step();
    }
  }

  step() {
    if (this.queue.length) this.dir = this.queue.shift();

    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      if (!this.useShield()) return this.gameOver();
      // Con escudo atraviesa la pared y sale por el lado contrario
      head.x = (head.x + COLS) % COLS;
      head.y = (head.y + ROWS) % ROWS;
    }

    const eatsApple = this.food && head.x === this.food.x && head.y === this.food.y;
    const eatsBonus = this.bonus && head.x === this.bonus.x && head.y === this.bonus.y;
    const takesPower = this.power && head.x === this.power.x && head.y === this.power.y;
    const growing = eatsApple || eatsBonus;
    // Si no come, la cola se mueve, así que esa celda queda libre
    const body = growing ? this.snake : this.snake.slice(0, -1);
    if (body.some((s) => s.x === head.x && s.y === head.y)) {
      if (!this.useShield()) return this.gameOver();
    }

    this.snake.unshift(head);

    if (takesPower) this.collectPower();

    if (eatsBonus) {
      this.addPoints(50, this.bonus, this.starBurst, CSS.gold);
      beep(this, 520, 0.25, 'triangle', 1560);
      this.removeBonus();
    }

    if (eatsApple) {
      this.addPoints(10, this.food, this.appleBurst, '#ff7675');
      beep(this, 660, 0.08, 'square', 990);
      this.stepDelay = Math.max(60, this.stepDelay - 3);
      this.applesEaten++;
      this.food = this.spawnFood();
      if (!this.food) return this.gameOver(true);
      this.placeAt(this.foodGfx, this.food);
      if (this.applesEaten % BONUS_EVERY === 0) this.spawnBonus();
    }

    if (!growing) this.snake.pop();

    this.draw();
  }

  addPoints(points, cell, burst, color) {
    const gained = this.effects.double > 0 ? points * 2 : points;
    this.score += gained;
    this.scoreText.setText('Puntos: ' + this.score);
    this.tweens.add({ targets: this.scoreText, scale: 1.2, duration: 80, yoyo: true });

    const x = cell.x * CELL + CELL / 2;
    const y = cell.y * CELL + CELL / 2;
    burst.explode(14, x, y);
    this.floatText(x, y, '+' + gained, this.effects.double > 0 ? CSS.goldLight : color);
    this.checkLevel();
  }

  floatText(x, y, text, color) {
    const label = this.add.text(x, y, text, {
      ...TEXT, fontSize: '18px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(DEPTH.fx);
    this.tweens.add({ targets: label, y: y - 40, alpha: 0, duration: 800, onComplete: () => label.destroy() });
  }

  // ---------- Niveles y escenarios ----------

  checkLevel() {
    const level = Math.floor(this.score / LEVEL_POINTS);
    if (level === this.level) return;
    this.level = level;
    this.changeScenario(level % SCENARIOS.length);
  }

  changeScenario(index) {
    const old = this.scenario;
    this.scenario = createScenario(this, index);
    // El nuevo fondo aparece poco a poco encima del anterior
    this.scenario.image.setAlpha(0);
    this.tweens.add({ targets: this.scenario.image, alpha: 1, duration: 1000, onComplete: () => old.image.destroy() });
    old.ambient.stop();
    this.time.delayedCall(4000, () => old.ambient.destroy());

    this.updateLevelText();
    this.showBanner('Nivel ' + (this.level + 1) + ' · ' + this.scenario.name);
    [523, 659, 784].forEach((f, i) => this.time.delayedCall(i * 90, () => beep(this, f, 0.15, 'triangle')));
  }

  updateLevelText() {
    this.levelText.setText('Nivel ' + (this.level + 1) + ' · ' + this.scenario.name);
  }

  showBanner(text) {
    const t = this.add.text(400, 300, text, {
      ...TITLE, fontSize: '40px', fontStyle: '700', stroke: '#0b1410', strokeThickness: 8
    }).setOrigin(0.5).setDepth(DEPTH.banner).setAlpha(0).setScale(0.6);
    this.tweens.add({
      targets: t, alpha: 1, scale: 1, duration: 300, ease: 'Back.Out',
      yoyo: true, hold: 1200, onComplete: () => t.destroy()
    });
  }

  // ---------- Poderes ----------

  updatePowers(delta) {
    const fx = this.effects;
    fx.slow = Math.max(0, fx.slow - delta);
    fx.double = Math.max(0, fx.double - delta);

    if (this.power) {
      this.power.life -= delta;
      // Se desvanece en los últimos 2 segundos para avisar que se va
      this.power.obj.setAlpha(Math.min(1, 0.3 + this.power.life / 2000));
      if (this.power.life <= 0) this.removePower();
    } else {
      this.powerCooldown -= delta;
      if (this.powerCooldown <= 0) this.spawnPower();
    }

    const parts = [];
    if (fx.slow > 0) parts.push('Lento ' + Math.ceil(fx.slow / 1000) + 's');
    if (fx.double > 0) parts.push('x2 ' + Math.ceil(fx.double / 1000) + 's');
    if (fx.shield) parts.push('Escudo');
    const text = parts.join('   ·   ');
    if (text !== this.effectsText.text) this.effectsText.setText(text).setVisible(text !== '');
    this.scoreText.setColor(fx.double > 0 ? CSS.gold : PAL.text);
  }

  spawnPower() {
    this.powerCooldown = Phaser.Math.Between(6000, 10000);
    const types = Object.keys(POWERS).filter((t) =>
      !(t === 'cut' && this.snake.length < 8) && !(t === 'shield' && this.effects.shield));
    const free = this.freeCells();
    if (!free.length) return;
    const cell = Phaser.Utils.Array.GetRandom(free);
    const type = Phaser.Utils.Array.GetRandom(types);
    const def = POWERS[type];

    const g = this.add.graphics();
    drawOrb(g, def.color);
    // El poder x2 lleva texto; los demás, un icono dibujado con formas
    const icon = type === 'double'
      ? this.add.text(0, 0, 'x2', { ...TEXT, fontSize: '12px', fontStyle: '800', color: '#1a1204' }).setOrigin(0.5)
      : this.add.graphics();
    if (type !== 'double') drawPowerIcon(icon, type);
    const obj = this.add.container(0, 0, [g, icon]).setDepth(DEPTH.items);
    this.placeAt(obj, cell);
    this.tweens.add({ targets: obj, scale: 1.12, duration: 350, yoyo: true, repeat: -1 });

    this.power = { ...cell, type, life: POWER_TIME, obj };
  }

  removePower() {
    if (!this.power) return;
    this.power.obj.destroy();
    this.power = null;
  }

  collectPower() {
    const { type, x, y } = this.power;
    const def = POWERS[type];
    const px = x * CELL + CELL / 2, py = y * CELL + CELL / 2;
    this.powerBurst.setParticleTint(def.color);
    this.powerBurst.explode(16, px, py);
    this.removePower();
    beep(this, 330, 0.2, 'triangle', 990);

    if (type === 'slow') this.effects.slow = def.time;
    if (type === 'double') this.effects.double = def.time;
    if (type === 'shield') this.effects.shield = true;
    if (type === 'cut') {
      const keep = Math.max(3, Math.ceil(this.snake.length * 0.6));
      this.snake.splice(keep).forEach((s) => this.cutBurst.explode(5, s.x * CELL + CELL / 2, s.y * CELL + CELL / 2));
    }
    this.floatText(px, py, def.label + '!', '#' + def.color.toString(16).padStart(6, '0'));
  }

  useShield() {
    if (!this.effects.shield) return false;
    this.effects.shield = false;
    this.cameras.main.shake(120, 0.005);
    beep(this, 880, 0.2, 'sine', 220);
    const h = this.snake[0];
    this.floatText(h.x * CELL + CELL / 2, h.y * CELL, '¡Escudo!', CSS.gold);
    return true;
  }

  // ---------- Comida ----------

  freeCells() {
    const at = (c, x, y) => c && c.x === x && c.y === y;
    const free = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (this.snake.some((s) => s.x === x && s.y === y)) continue;
        if (at(this.food, x, y) || at(this.bonus, x, y) || at(this.power, x, y)) continue;
        free.push({ x, y });
      }
    }
    return free;
  }

  spawnFood() {
    this.food = null;
    const free = this.freeCells();
    return free.length ? Phaser.Utils.Array.GetRandom(free) : null;
  }

  placeAt(obj, cell) {
    obj.setPosition(cell.x * CELL + CELL / 2, cell.y * CELL + CELL / 2);
  }

  spawnBonus() {
    if (this.bonus) return;
    const free = this.freeCells();
    if (!free.length) return;
    this.bonus = Phaser.Utils.Array.GetRandom(free);
    this.placeAt(this.bonusGfx, this.bonus);
    this.bonusGfx.setVisible(true).setAlpha(1);
    this.floatText(this.bonus.x * CELL + CELL / 2, this.bonus.y * CELL, '¡Fruta del Origen!', CSS.gold);
    // Se desvanece en los últimos 2 segundos para avisar que se va
    this.bonusFade = this.tweens.add({ targets: this.bonusGfx, alpha: 0.25, delay: BONUS_TIME - 2000, duration: 2000 });
    this.bonusTimer = this.time.delayedCall(BONUS_TIME, () => this.removeBonus());
  }

  removeBonus() {
    this.bonus = null;
    this.bonusGfx.setVisible(false);
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.bonusFade) this.bonusFade.stop();
  }

  draw() {
    this.gfx.clear();
    drawSnake(this.gfx, this.snake, this.dir, this.effects.shield);
  }

  gameOver(won = false) {
    this.dead = true;
    this.removeBonus();
    this.removePower();
    this.draw();

    const newRecord = this.score > this.best;
    if (newRecord) {
      this.best = this.score;
      saveBest(this.best);
      this.bestText.setText('Récord: ' + this.best);
    }

    if (won) {
      beep(this, 523, 0.4, 'triangle', 1046);
    } else {
      this.cameras.main.shake(250, 0.01);
      beep(this, 300, 0.5, 'sawtooth', 60);
    }

    const over = (obj) => obj.setDepth(DEPTH.overlay);
    over(this.add.rectangle(400, 300, 800, 600, PAL.bg, 0.78));
    over(this.add.text(400, 230, won ? '¡Ganaste!' : 'Game Over', {
      ...TITLE, fontSize: '56px'
    }).setOrigin(0.5));
    over(this.add.text(400, 300, 'Puntos: ' + this.score + '   ·   Nivel ' + (this.level + 1), {
      ...TEXT, fontSize: '24px', color: CSS.scale
    }).setOrigin(0.5));
    if (newRecord && this.score > 0) {
      const rec = over(this.add.text(400, 345, '¡Nuevo récord!', {
        ...TEXT, fontSize: '22px', fontStyle: '700', color: CSS.goldLight
      }).setOrigin(0.5).setScale(0));
      this.tweens.add({ targets: rec, scale: 1, duration: 400, ease: 'Back.Out' });
    }
    over(this.add.text(400, 410, 'ESPACIO o toca: reintentar   ·   M: menú', {
      ...TEXT, fontSize: '18px', color: PAL.muted
    }).setOrigin(0.5));

    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));
    this.input.once('pointerdown', () => this.scene.restart());
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#0b1410',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, SnakeScene]
};

// Espera a que carguen las tipografías de Amaru para que el canvas no dibuje con otra letra.
// Si tardan o fallan, el juego arranca igual con la letra de respaldo.
const fontsReady = document.fonts
  ? Promise.all([document.fonts.load('900 40px "Cinzel Decorative"'), document.fonts.load('700 40px "Cinzel Decorative"'),
    document.fonts.load('400 16px Outfit'), document.fonts.load('700 16px Outfit'), document.fonts.load('800 16px Outfit')])
  : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))])
  .catch(() => {})
  .then(() => { new Phaser.Game(config); });

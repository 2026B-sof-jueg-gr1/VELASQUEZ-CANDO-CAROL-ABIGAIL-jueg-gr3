// Dibujo con formas: serpiente, objetos y los cinco escenarios (sin imágenes)
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


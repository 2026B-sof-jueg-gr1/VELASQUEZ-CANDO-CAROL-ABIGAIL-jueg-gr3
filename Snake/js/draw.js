// Dibujo con formas: serpiente, objetos y los cinco escenarios (sin imágenes)
// ---------- Utilidades de color ----------

// amt > 0 aclara hacia blanco, amt < 0 oscurece hacia negro
function shade(color, amt) {
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return (Math.round(r + (t - r) * p) << 16) | (Math.round(g + (t - g) * p) << 8) | Math.round(b + (t - b) * p);
}

// Colores de la serpiente en cada nivel: [cabeza, cola]. Va cambiando de serpiente a persona.
const SKIN = [0xe3b48c, 0xa87c58];
const STAGE_COLORS = {
  1: [HEAD_COLOR, TAIL_COLOR],   // verde normal
  2: [0xb7e3c4, 0x6aa985],       // escamas más pálidas
  3: [0xb7e3c4, 0x6aa985],       // (más las manos)
  4: [0xb7e3c4, 0x6aa985],       // (la cabeza ya es una cara)
  5: SKIN                         // cuerpo color piel
};

// Degradado de la cabeza a la cola según el nivel (stage de 1 a 5)
function segmentColor(i, len, stage = 1) {
  const C = Phaser.Display.Color;
  const [head, tail] = STAGE_COLORS[stage] || STAGE_COLORS[1];
  const c = C.Interpolate.ColorWithColor(C.ValueToColor(head), C.ValueToColor(tail), Math.max(len - 1, 1), i);
  return C.GetColor(c.r, c.g, c.b);
}

// ---------- Dibujo con relieve ----------

function drawSegmentShadow(g, cell) {
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(cell.x * CELL + 3, cell.y * CELL + 5, CELL - 2, CELL - 3, 6);
}

// Cada bloque tiene un lado oscuro (grosor), una cara superior y un brillo
function drawSegment(g, cell, color, i, stage = 1) {
  const x = cell.x * CELL + 1, y = cell.y * CELL + 1, s = CELL - 2;
  g.fillStyle(shade(color, -0.4));
  g.fillRoundedRect(x, y, s, s, 6);
  g.fillStyle(color);
  g.fillRoundedRect(x, y, s, s - 4, 6);
  g.fillStyle(shade(color, 0.5), 0.8);
  g.fillRoundedRect(x + 3, y + 2, s - 8, 4, 2);
  // Rombo dorado en la espalda (como el dibujo de las escamas de la landing).
  // En el nivel 5 casi no quedan escamas.
  const every = stage >= 5 ? 4 : 2;
  if (i > 0 && i % every === 0) {
    const cx = x + s / 2, cy = y + (s - 4) / 2;
    g.fillStyle(PAL.gold, stage >= 5 ? 0.4 : 0.7);
    g.fillPoints([{ x: cx, y: cy - 4 }, { x: cx + 3.5, y: cy }, { x: cx, y: cy + 4 }, { x: cx - 3.5, y: cy }], true);
  }
}

function drawSnake(g, snake, dir, shield, stage = 1) {
  snake.forEach((s) => drawSegmentShadow(g, s));
  for (let i = snake.length - 1; i >= 0; i--) {
    // Desde el nivel 4 la cabeza es de piel (una cara)
    const color = i === 0 && stage >= 4 ? SKIN[0] : segmentColor(i, snake.length, stage);
    drawSegment(g, snake[i], color, i, stage);
  }

  const h = snake[0];
  const cx = h.x * CELL + CELL / 2;
  const cy = h.y * CELL + CELL / 2 - 2;

  // Contorno fino en la cabeza
  g.lineStyle(1.5, stage >= 4 ? 0x7a5338 : PAL.gold, 0.7);
  g.strokeRoundedRect(h.x * CELL + 1, h.y * CELL + 1, CELL - 2, CELL - 6, 6);

  // Nivel 3 en adelante: dos manitas en los costados de la cabeza
  if (stage >= 3) {
    for (const side of [-1, 1]) {
      const hx = cx - dir.y * side * 11 + dir.x * 1, hy = cy + dir.x * side * 11 + dir.y * 1 + 2;
      g.fillStyle(SKIN[0]);
      g.fillCircle(hx, hy, 3.6);
      g.lineStyle(1, 0x7a5338, 0.8);
      g.strokeCircle(hx, hy, 3.6);
      g.fillStyle(0x7a5338, 0.8); // deditos
      g.fillCircle(hx + dir.x * 3, hy + dir.y * 3, 1);
    }
  }

  if (shield) {
    g.lineStyle(2, PAL.gold, 0.9);
    g.strokeCircle(cx, cy + 2, 13);
  }

  for (const side of [-1, 1]) {
    const ex = cx + dir.x * 3 - dir.y * side * 4;
    const ey = cy + dir.y * 3 + dir.x * side * 4;
    if (stage >= 4) {
      // Ojos humanos: blanco, iris café y pupila
      g.fillStyle(0xffffff);
      g.fillCircle(ex, ey, 3.4);
      g.fillStyle(0x6b4423);
      g.fillCircle(ex + dir.x * 0.8, ey + dir.y * 0.8, 1.9);
      g.fillStyle(PAL.bg);
      g.fillCircle(ex + dir.x * 0.9, ey + dir.y * 0.9, 0.9);
    } else {
      // Ojos dorados con pupila vertical de serpiente, mirando hacia donde avanza
      g.fillStyle(0xf2c14e);
      g.fillCircle(ex, ey, 3.2);
      g.fillStyle(PAL.bg);
      if (dir.x !== 0) g.fillEllipse(ex + dir.x * 0.5, ey, 3.2, 1.2); else g.fillEllipse(ex, ey + dir.y * 0.5, 1.2, 3.2);
    }
  }
  // Boquita de la cara
  if (stage >= 4) {
    g.lineStyle(1.2, 0x7a3a2a, 0.9);
    const mx = cx + dir.x * 6, my = cy + dir.y * 6 + 2;
    g.lineBetween(mx - dir.y * 2.5, my + dir.x * 2.5, mx + dir.y * 2.5, my - dir.x * 2.5);
  }
}

// ---------- Materiales de cada tierra ----------

// Cada forma se dibuja alrededor de (0,0), de unos 9 px de radio, con un halo suave para que se vea
function drawMaterial(g, shape, color) {
  const dark = shade(color, -0.45), light = shade(color, 0.6);
  g.fillStyle(0xffffff, 0.16);
  g.fillCircle(0, 0, 12);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(1.5, 8, 14, 5);
  if (shape === 'seed') {
    g.fillStyle(dark); g.fillEllipse(0, 1, 11, 15);
    g.fillStyle(color); g.fillEllipse(0, 0, 9, 13);
    g.fillStyle(light, 0.8); g.fillEllipse(-2, -3, 3, 5);
  } else if (shape === 'drop') {
    g.fillStyle(dark); g.fillCircle(0, 3.5, 7);
    g.fillStyle(color); g.fillCircle(0, 3, 6); g.fillTriangle(-5.3, 1.5, 5.3, 1.5, 0, -9);
    g.fillStyle(light, 0.85); g.fillCircle(-2, 2, 1.8);
  } else if (shape === 'leaf') {
    const pts = [{ x: 0, y: -9 }, { x: 6, y: -2 }, { x: 5, y: 5 }, { x: 0, y: 9 }, { x: -5, y: 5 }, { x: -6, y: -2 }];
    g.fillStyle(color); g.fillPoints(pts, true);
    g.lineStyle(1.3, dark); g.lineBetween(0, -7, 0, 9);
  } else if (shape === 'crystal') {
    const pts = [{ x: 0, y: -9 }, { x: 6, y: -3 }, { x: 4, y: 8 }, { x: -4, y: 8 }, { x: -6, y: -3 }];
    g.fillStyle(dark); g.fillPoints(pts, true);
    g.fillStyle(color); g.fillPoints([{ x: 0, y: -8 }, { x: 5, y: -3 }, { x: 3, y: 6 }, { x: -3, y: 6 }, { x: -5, y: -3 }], true);
    g.fillStyle(light, 0.7); g.fillTriangle(-4, -3, 0, -8, 0, 2);
  } else if (shape === 'feather') {
    g.fillStyle(color);
    g.fillPoints([{ x: -2, y: -9 }, { x: 5, y: -3 }, { x: 4, y: 5 }, { x: -1, y: 9 }, { x: -4, y: 2 }, { x: -5, y: -4 }], true);
    g.lineStyle(1.3, light); g.lineBetween(-3, 8, 2, -7);
  } else if (shape === 'flower') {
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      g.fillStyle(color); g.fillCircle(Math.cos(a) * 5, Math.sin(a) * 5, 3.6);
    }
    g.fillStyle(PAL.goldLight); g.fillCircle(0, 0, 2.6);
  } else if (shape === 'wool') {
    g.fillStyle(dark); g.fillCircle(0, 4, 6);
    g.fillStyle(color); g.fillCircle(-3.5, -1, 5); g.fillCircle(3.5, -1, 5); g.fillCircle(0, 3, 5.5);
    g.fillStyle(light, 0.8); g.fillCircle(-3, -3, 1.8); g.fillCircle(3, -3, 1.8);
  } else if (shape === 'rock') {
    g.fillStyle(dark);
    g.fillPoints([{ x: -7, y: 3 }, { x: -4, y: -6 }, { x: 3, y: -7 }, { x: 7, y: 0 }, { x: 4, y: 8 }, { x: -4, y: 7 }], true);
    g.fillStyle(color);
    g.fillPoints([{ x: -6, y: 1 }, { x: -3, y: -6 }, { x: 3, y: -6 }, { x: 6, y: 0 }, { x: 3, y: 5 }, { x: -4, y: 5 }], true);
  } else if (shape === 'shards') {
    g.fillStyle(dark); g.fillTriangle(-8, 7, -2, 7, -5, -4);
    g.fillStyle(color);
    g.fillTriangle(-8, 7, -2, 7, -5, -3); g.fillTriangle(-3, 7, 5, 7, 1, -9); g.fillTriangle(3, 7, 9, 7, 6, -1);
    g.fillStyle(light, 0.7); g.fillTriangle(-1, 6, 1, 6, 0, -5);
  } else if (shape === 'orb') {
    g.fillStyle(color, 0.35); g.fillCircle(0, 0, 11);
    g.fillStyle(color); g.fillCircle(0, 0, 5.5);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(-1.5, -1.5, 2);
  }
}

// ---------- El espejo de la muda ----------

// Reflejo de la serpiente en el espejo (centrado en 0,0, dentro de un óvalo de 240 x 320)
function drawMirrorSnake(g, stage) {
  const [head, tail] = STAGE_COLORS[stage] || STAGE_COLORS[1];
  const C = Phaser.Display.Color;
  const mix = (t) => { const c = C.Interpolate.ColorWithColor(C.ValueToColor(head), C.ValueToColor(tail), 100, t * 100); return C.GetColor(c.r, c.g, c.b); };
  // Cuerpo en S, de la cola hacia la cabeza
  for (let k = 0; k <= 26; k++) {
    const t = k / 26;
    const x = Math.sin(t * 5.2) * 36 * (1 - t * 0.35), y = 128 - t * 118, r = 21 - t * 3;
    g.fillStyle(shade(mix(1 - t), -0.35)); g.fillCircle(x + 1, y + 2, r);
    g.fillStyle(mix(1 - t)); g.fillCircle(x, y, r);
    if (k % 3 === 0 && stage < 5) { g.fillStyle(PAL.gold, 0.6); g.fillCircle(x, y - 2, 3.2); }
  }
  // Cabeza
  const faceColor = stage >= 4 ? SKIN[0] : head;
  g.fillStyle(shade(faceColor, -0.35)); g.fillEllipse(1, -14, 78, 62);
  g.fillStyle(faceColor); g.fillEllipse(0, -17, 74, 58);
  g.fillStyle(shade(faceColor, 0.5), 0.5); g.fillEllipse(-8, -30, 34, 12);
  if (stage >= 3) {
    for (const s of [-1, 1]) { g.fillStyle(SKIN[0]); g.fillCircle(s * 44, -6, 8); g.lineStyle(1.5, 0x7a5338, 0.8); g.strokeCircle(s * 44, -6, 8); }
  }
  for (const s of [-1, 1]) {
    const ex = s * 17, ey = -22;
    if (stage >= 4) {
      g.fillStyle(0xffffff); g.fillCircle(ex, ey, 9);
      g.fillStyle(0x6b4423); g.fillCircle(ex, ey + 1, 5);
      g.fillStyle(PAL.bg); g.fillCircle(ex, ey + 1, 2.4);
    } else {
      g.fillStyle(0xf2c14e); g.fillCircle(ex, ey, 9);
      g.fillStyle(PAL.bg); g.fillEllipse(ex, ey, 3, 12);
    }
  }
  if (stage >= 4) { g.lineStyle(2, 0x7a3a2a, 0.9); g.lineBetween(-10, 2, 10, 2); }
  else { g.lineStyle(2, 0xd8433a); g.lineBetween(0, 4, 0, 20); g.lineBetween(0, 20, -6, 28); g.lineBetween(0, 20, 6, 28); }
}

// Silueta humana que aparece un instante en el reflejo (la cabeza queda sobre la de la serpiente)
function drawMirrorHuman(g) {
  g.fillStyle(0xefe6d2);
  g.fillEllipse(0, -24, 58, 70);
  g.fillPoints([
    { x: -14, y: 4 }, { x: 14, y: 4 }, { x: 24, y: 20 }, { x: 72, y: 36 }, { x: 112, y: 72 },
    { x: 126, y: 175 }, { x: -126, y: 175 }, { x: -112, y: 72 }, { x: -72, y: 36 }, { x: -24, y: 20 }
  ], true);
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


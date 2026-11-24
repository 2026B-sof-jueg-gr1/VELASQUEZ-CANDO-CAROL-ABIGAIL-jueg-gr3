// Enemigos de las cinco tierras. Un enemigo mata solo cuando toca la CABEZA de la serpiente.
// Reglas de movimiento (las mismas del mundo, ver world.js):
//   - cruzan los bordes abiertos y los huecos; rebotan o se dan la vuelta en los bordes cerrados
//   - hormigas, escorpiones y bloques de hielo tratan las piedras Y el cuerpo de la serpiente como piedra
//   - los murciélagos vuelan por encima de piedras y cuerpo (pero respetan los bordes)
//   - las culebras de lava no se mueven: salen en una casilla libre, avisan 1 s y se esconden
// Los datos (velocidades, máximos) están en ENEMIES (data.js).

const ORTHO = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

// ---------- Dibujo (con relieve, como la serpiente) ----------

// Anillo rojizo bajo todo enemigo: así se distingue de un vistazo de las piedras y de los materiales
function enemyRing(g, cx, cy, alpha = 1) {
  g.fillStyle(PAL.red, 0.26 * alpha);
  g.fillCircle(cx, cy, 10.5);
  g.lineStyle(1.5, PAL.red, 0.6 * alpha);
  g.strokeCircle(cx, cy, 10.5);
}

// Una esfera con relieve: sombra, lado oscuro, color y brillo
function bead(g, x, y, r, color) {
  g.fillStyle(shade(color, -0.35));
  g.fillCircle(x + 0.6, y + 0.9, r);
  g.fillStyle(color);
  g.fillCircle(x, y, r - 0.6);
  g.fillStyle(shade(color, 0.45), 0.8);
  g.fillCircle(x - r * 0.3, y - r * 0.35, r * 0.35);
}

function drawAnt(g, cx, cy, d) {
  enemyRing(g, cx, cy);
  const P = (u, v) => [cx + d.x * u - d.y * v, cy + d.y * u + d.x * v];
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx + 1, cy + 5, 15, 5);
  g.lineStyle(1.2, 0x2a1306);
  [-4, 0, 4].forEach((u) => {
    const a = P(u, -6), b = P(u, 6);
    g.lineBetween(a[0], a[1], b[0], b[1]);
  });
  const abd = P(-5, 0), th = P(0, 0), hd = P(5, 0);
  bead(g, abd[0], abd[1], 4.2, 0x7a3b18);
  bead(g, th[0], th[1], 3.2, 0x8f4a20);
  bead(g, hd[0], hd[1], 3.6, 0x5a2a10);
  const e = P(6.5, -1.8), f = P(6.5, 1.8);
  g.fillStyle(0xf2b33d);
  g.fillCircle(e[0], e[1], 0.9);
  g.fillCircle(f[0], f[1], 0.9);
}

function drawScorpion(g, cx, cy, d) {
  enemyRing(g, cx, cy);
  const P = (u, v) => [cx + d.x * u - d.y * v, cy + d.y * u + d.x * v];
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx + 1, cy + 5, 16, 5);
  // cola curvada hacia atrás con aguijón
  const t1 = P(-5, 0), t2 = P(-8, 0), t3 = P(-9, 0);
  bead(g, t1[0], t1[1], 2.8, 0xb5561a);
  bead(g, t2[0], t2[1], 2.3, 0xb5561a);
  bead(g, t3[0], t3[1], 2, 0xb5561a);
  const st = P(-11.5, 0);
  g.fillStyle(0xffd27a);
  g.fillCircle(st[0], st[1], 1.4);
  const b = P(0, 0);
  bead(g, b[0], b[1], 4.8, 0xc2651f);
  [[6, -4.5], [6, 4.5]].forEach(([u, v]) => {
    const c = P(u, v);
    bead(g, c[0], c[1], 2.6, 0xa84d14);
  });
}

// Bloque de hielo enemigo: cristal en punta (los obstáculos de hielo son cuadrados)
function drawIceBlock(g, cx, cy) {
  enemyRing(g, cx, cy);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx + 1, cy + 6, 14, 5);
  g.fillStyle(0x7fb9d8);
  g.fillPoints([{ x: cx, y: cy - 9 }, { x: cx + 7.5, y: cy }, { x: cx, y: cy + 9 }, { x: cx - 7.5, y: cy }], true);
  g.fillStyle(0xcdeefb);
  g.fillPoints([{ x: cx, y: cy - 9 }, { x: cx, y: cy + 9 }, { x: cx - 7.5, y: cy }], true);
  g.fillStyle(0xffffff, 0.85);
  g.fillPoints([{ x: cx - 1.5, y: cy - 6 }, { x: cx - 5, y: cy - 0.5 }, { x: cx - 1.5, y: cy - 1 }], true);
  g.lineStyle(1.2, 0x2f78a3, 0.9);
  g.strokePoints([{ x: cx, y: cy - 9 }, { x: cx + 7.5, y: cy }, { x: cx, y: cy + 9 }, { x: cx - 7.5, y: cy }], true);
}

// Culebra de lava: `rise` de 0 a 1 es cuánto ha salido del suelo
function drawLavaSnake(g, cx, cy, rise) {
  g.fillStyle(0x140808);
  g.fillEllipse(cx, cy + 4, 20, 9);
  g.lineStyle(2, 0xff6a1a, 0.9);
  g.strokeEllipse(cx, cy + 4, 20, 9);
  const h = 13 * rise;
  [0, 0.35, 0.7].forEach((k, i) => {
    const y = cy + 3 - h * k;
    const x = cx + (i === 1 ? 2.5 : i === 2 ? -1 : 0);
    bead(g, x, y, 4.6 - i * 0.4, i % 2 ? 0xff8a2a : 0xe2512f);
  });
  const hy = cy + 3 - h;
  bead(g, cx - 1, hy, 5, 0xf0652a);
  g.fillStyle(0xffe27a);
  g.fillCircle(cx - 3, hy - 1, 1.1);
  g.fillCircle(cx + 1, hy - 1, 1.1);
  g.fillStyle(0x1a0a05);
  g.fillCircle(cx - 3, hy - 1, 0.5);
  g.fillCircle(cx + 1, hy - 1, 0.5);
}

// Aviso de la culebra de lava: un anillo que brilla suave (sin destellos)
function drawLavaWarning(g, cx, cy, t) {
  const a = 0.35 + 0.3 * Math.sin(t * 0.006);
  g.fillStyle(0xff6a1a, a * 0.6);
  g.fillCircle(cx, cy, 11);
  g.lineStyle(2, 0xffb347, a + 0.2);
  g.strokeCircle(cx, cy, 11);
  g.lineStyle(1.5, 0xff4500, a);
  g.strokeCircle(cx, cy, 6);
}

function drawBat(g, cx, cy, flap) {
  enemyRing(g, cx, cy, 0.8);
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(cx + 1, cy + 8, 12, 4);
  const w = flap ? 4 : -3;
  g.fillStyle(0x2a1d45);
  g.fillTriangle(cx - 2, cy, cx - 12, cy - 4 - w, cx - 8, cy + 5);
  g.fillTriangle(cx + 2, cy, cx + 12, cy - 4 - w, cx + 8, cy + 5);
  g.fillStyle(0x4a3678);
  g.fillTriangle(cx - 2, cy, cx - 10, cy - 3 - w, cx - 7, cy + 3);
  g.fillTriangle(cx + 2, cy, cx + 10, cy - 3 - w, cx + 7, cy + 3);
  bead(g, cx, cy, 4.6, 0x3b2a5a);
  g.fillStyle(0x3b2a5a);
  g.fillTriangle(cx - 3.5, cy - 3, cx - 2, cy - 7, cx - 0.5, cy - 3.5);
  g.fillTriangle(cx + 3.5, cy - 3, cx + 2, cy - 7, cx + 0.5, cy - 3.5);
  g.fillStyle(0xff5a5a);
  g.fillCircle(cx - 1.6, cy - 0.5, 0.9);
  g.fillCircle(cx + 1.6, cy - 0.5, 0.9);
}

// ---------- Enemigos ----------

class Enemy {
  constructor(dir, depth) {
    this.dir = dir;
    this.scene = dir.scene;
    this.world = dir.world;
    this.g = this.scene.add.graphics().setDepth(depth);
    this.acc = 0;
  }
  cells() { return []; }
  lethal(x, y) { return this.cells().some((c) => c.x === x && c.y === y); }
  px(c) { return [c.x * CELL + CELL / 2, c.y * CELL + CELL / 2]; }
  destroy() { this.g.destroy(); }
}

// Hormigas: una fila de 4 que cruza en horizontal. Si topa con piedra, borde cerrado o el cuerpo, la fila se da la vuelta.
class AntFile extends Enemy {
  constructor(dir, cells, d) {
    super(dir, DEPTH.items + 0.5);
    this.body = cells;           // [cabeza, ..., cola]
    this.d = d;
    this.draw();
  }
  static create(dir) {
    const len = ENEMIES.hormigas.len;
    for (const c of Phaser.Utils.Array.Shuffle(dir.world.spawnable.slice())) {
      const d = { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
      const cells = [];
      for (let k = 0; k < len; k++) cells.push({ x: c.x - d.x * k, y: c.y });
      if (cells.every((q) => dir.okSpawn(q.x, q.y))) return new AntFile(dir, cells, d);
    }
    return null;
  }
  cells() { return this.body; }
  update(delta) {
    this.acc += delta;
    if (this.acc < ENEMIES.hormigas.step) return;
    this.acc -= ENEMIES.hormigas.step;
    const h = this.body[0];
    const next = this.dir.groundStep(h, this.d);
    if (!next) {
      this.body.reverse();                 // se da la vuelta: la cola pasa a ser la cabeza
      this.d = { x: -this.d.x, y: -this.d.y };
    } else {
      this.body.unshift(next);
      this.body.pop();
    }
    this.draw();
  }
  draw() {
    this.g.clear();
    this.body.forEach((c) => { const [x, y] = this.px(c); drawAnt(this.g, x, y, this.d); });
  }
}

// Escorpión: una celda en línea recta; rebota (da la vuelta) con piedra, borde cerrado o cuerpo.
class Scorpion extends Enemy {
  constructor(dir, cell, d) {
    super(dir, DEPTH.items + 0.5);
    this.cell = cell;
    this.d = d;
    this.draw();
  }
  static create(dir) {
    for (const c of Phaser.Utils.Array.Shuffle(dir.world.spawnable.slice())) {
      if (!dir.okSpawn(c.x, c.y)) continue;
      const ds = Phaser.Utils.Array.Shuffle(ORTHO.slice());
      const d = ds.find((q) => dir.world.freeRun(c.x, c.y, q.x, q.y, 8) >= 8);
      if (d) return new Scorpion(dir, { x: c.x, y: c.y }, d);
    }
    return null;
  }
  cells() { return [this.cell]; }
  update(delta) {
    this.acc += delta;
    if (this.acc < ENEMIES.escorpiones.step) return;
    this.acc -= ENEMIES.escorpiones.step;
    const next = this.dir.groundStep(this.cell, this.d);
    if (!next) this.d = { x: -this.d.x, y: -this.d.y };
    else this.cell = next;
    this.draw();
  }
  draw() {
    this.g.clear();
    const [x, y] = this.px(this.cell);
    drawScorpion(this.g, x, y, this.d);
  }
}

// Bloque de hielo: desliza rápido hasta chocar (o 25 celdas), descansa 1 s y elige otra dirección.
class IceBlock extends Enemy {
  constructor(dir, cell, d) {
    super(dir, DEPTH.items + 0.5);
    this.cell = cell;
    this.d = d;
    this.state = 'rest';
    this.timer = 700;      // un momento quieto al aparecer, para que se vea
    this.slid = 0;
    this.draw();
  }
  static create(dir) {
    for (const c of Phaser.Utils.Array.Shuffle(dir.world.spawnable.slice())) {
      if (!dir.okSpawn(c.x, c.y)) continue;
      const d = Phaser.Utils.Array.Shuffle(ORTHO.slice()).find((q) => dir.world.freeRun(c.x, c.y, q.x, q.y, 6) >= 6);
      if (d) return new IceBlock(dir, { x: c.x, y: c.y }, d);
    }
    return null;
  }
  cells() { return [this.cell]; }
  update(delta) {
    const def = ENEMIES.hielo;
    if (this.state === 'rest') {
      this.timer -= delta;
      if (this.timer > 0) return;
      // elige una dirección con paso libre (si no hay, espera otro rato)
      const options = Phaser.Utils.Array.Shuffle(ORTHO.slice()).filter((q) => this.dir.groundStep(this.cell, q));
      if (!options.length) { this.timer = 400; return; }
      this.d = options.find((q) => q.x !== -this.d.x || q.y !== -this.d.y) || options[0];
      this.state = 'slide';
      this.slid = 0;
      this.acc = 0;
      return;
    }
    this.acc += delta;
    while (this.acc >= def.slide && this.state === 'slide') {
      this.acc -= def.slide;
      const next = this.dir.groundStep(this.cell, this.d);
      if (!next || this.slid >= def.maxSlide) { this.state = 'rest'; this.timer = def.rest; break; }
      this.cell = next;
      this.slid++;
    }
    this.draw();
  }
  draw() {
    this.g.clear();
    const [x, y] = this.px(this.cell);
    drawIceBlock(this.g, x, y);
  }
}

// Culebra de lava: no se mueve. Descansa, avisa 1 s, sale 2 s (aquí mata) y se esconde.
class LavaSnake extends Enemy {
  constructor(dir) {
    super(dir, DEPTH.items + 0.5);
    this.state = 'rest';
    this.timer = Phaser.Math.Between(300, 900);
    this.cell = null;
    this.t = 0;
  }
  static create(dir) { return new LavaSnake(dir); }
  cells() { return this.state === 'up' && this.cell ? [this.cell] : []; }
  warning() { return this.state === 'warn' ? this.cell : null; }
  pick() {
    for (const c of Phaser.Utils.Array.Shuffle(this.world.spawnable.slice())) {
      if (!this.dir.okSpawn(c.x, c.y)) continue;
      if (this.dir.list.some((e) => e !== this && e.cell && Math.max(Math.abs(e.cell.x - c.x), Math.abs(e.cell.y - c.y)) < 3)) continue;
      return { x: c.x, y: c.y };
    }
    return null;
  }
  update(delta) {
    const def = ENEMIES.lava;
    this.t += delta;
    this.timer -= delta;
    if (this.state === 'rest' && this.timer <= 0) {
      const c = this.pick();
      if (c) { this.cell = c; this.state = 'warn'; this.timer = def.warn; } else this.timer = 500;
    } else if (this.state === 'warn' && this.timer <= 0) {
      // si en este momento hay cuerpo de serpiente en la casilla, no sale
      if (this.dir.snakeBody(this.cell.x, this.cell.y) || this.dir.isHead(this.cell.x, this.cell.y)) {
        this.state = 'rest'; this.timer = 600; this.cell = null;
      } else { this.state = 'up'; this.timer = def.up; this.upT = 0; }
    } else if (this.state === 'up') {
      this.upT += delta;
      if (this.timer <= 0) { this.state = 'rest'; this.timer = Phaser.Math.Between(def.restMin, def.restMax); this.cell = null; }
    }
    this.draw();
  }
  draw() {
    this.g.clear();
    if (!this.cell || this.state === 'rest') return;
    const [x, y] = this.px(this.cell);
    if (this.state === 'warn') drawLavaWarning(this.g, x, y, this.t);
    else drawLavaSnake(this.g, x, y, Math.min(1, this.upT / 300));
  }
}

// Murciélago: zigzag diagonal. Vuela por encima de piedras y cuerpo; cruza los bordes abiertos y rebota en los cerrados.
class Bat extends Enemy {
  constructor(dir, cell) {
    super(dir, DEPTH.fx + 0.5);   // siempre por encima de las piedras
    this.cell = cell;
    this.dx = Math.random() < 0.5 ? 1 : -1;
    this.dy = Math.random() < 0.5 ? 1 : -1;
    this.stepsInLeg = 0;
    this.flap = false;
    this.draw();
  }
  static create(dir) {
    for (const c of Phaser.Utils.Array.Shuffle(dir.world.spawnable.slice())) {
      if (dir.okSpawn(c.x, c.y)) return new Bat(dir, { x: c.x, y: c.y });
    }
    return null;
  }
  cells() { return [this.cell]; }
  update(delta) {
    this.acc += delta;
    if (this.acc < ENEMIES.murcielagos.step) return;
    this.acc -= ENEMIES.murcielagos.step;
    const w = this.world;
    let nx = this.cell.x + this.dx, ny = this.cell.y + this.dy;
    // eje x: cruza si el borde se puede cruzar; si es pared, rebota
    if (nx < 0 || nx >= COLS) {
      if (w.crossable(nx < 0 ? 'L' : 'R', this.cell.y)) nx = (nx + COLS) % COLS;
      else { this.dx = -this.dx; nx = this.cell.x + this.dx; }
    }
    if (ny < 0 || ny >= ROWS) {
      if (w.crossable(ny < 0 ? 'T' : 'B', nx)) ny = (ny + ROWS) % ROWS;
      else { this.dy = -this.dy; ny = this.cell.y + this.dy; }
    }
    this.cell = { x: nx, y: ny };
    // zigzag: cada ENEMIES.murcielagos.zig pasos cambia el sentido vertical
    if (++this.stepsInLeg >= ENEMIES.murcielagos.zig) { this.stepsInLeg = 0; this.dy = -this.dy; }
    this.flap = !this.flap;
    this.draw();
  }
  draw() {
    this.g.clear();
    const [x, y] = this.px(this.cell);
    drawBat(this.g, x, y, this.flap);
  }
}

const ENEMY_CLASSES = { hormigas: AntFile, escorpiones: Scorpion, hielo: IceBlock, lava: LavaSnake, murcielagos: Bat };

// ---------- Director: cuántos enemigos hay, dónde aparecen y si tocan la cabeza ----------

class EnemyDirector {
  constructor(scene) {
    this.scene = scene;
    this.world = scene.world;
    this.type = GameState.current().enemy;
    this.def = ENEMIES[this.type];
    this.list = [];
    this.delay = ENEMY_START_DELAY;
  }

  // Máximo a la vez: 1, luego 2 y luego 3 según las manzanas, sin pasar del tope de la tierra
  cap() {
    const a = this.scene.applesLevel;
    return Math.min(this.def.cap, 1 + ENEMY_AT.filter((n) => a >= n).length);
  }

  update(delta) {
    const sc = this.scene;
    if (sc.dead || sc.busy) return;
    // Con la Fruta del Origen en el tablero no sale ninguno nuevo
    this.delay -= delta;
    if (this.delay <= 0 && this.list.length < this.cap() && !sc.fruit) {
      this.delay = this.spawn() ? 1500 : 500;
    }
    this.list.forEach((e) => e.update(delta));
    // Un enemigo que entra en la celda de la cabeza también cuenta
    const h = sc.snake[0];
    if (this.hitAt(h.x, h.y) && !sc.enemyHit()) sc.gameOver();
  }

  // ignoreCap: para el atajo de debug
  spawn(ignoreCap = false) {
    if (!ignoreCap && this.list.length >= this.cap()) return false;
    const e = ENEMY_CLASSES[this.type].create(this);
    if (!e) return false;
    this.list.push(e);
    return true;
  }

  // Una casilla de aparición válida: fuera de pista de aterrizaje, zona de salida y trampas (spawnable),
  // lejos de la cabeza y no de frente, y sin nada encima
  okSpawn(x, y) {
    const sc = this.scene;
    if (!this.world.spawnSet.has(x + ',' + y)) return false;
    const h = sc.snake[0];
    if (Math.max(Math.abs(x - h.x), Math.abs(y - h.y)) < ENEMY_MIN_DIST) return false;
    for (let k = 1; k <= ENEMY_MIN_DIST; k++) {
      if ((h.x + sc.dir.x * k + COLS * 2) % COLS === x && (h.y + sc.dir.y * k + ROWS * 2) % ROWS === y) return false;
    }
    if (sc.snake.some((s) => s.x === x && s.y === y)) return false;
    const at = (c) => c && c.x === x && c.y === y;
    if (at(sc.food) || at(sc.material) || at(sc.fruit) || at(sc.power)) return false;
    if (this.hitAt(x, y)) return false;
    return true;
  }

  snakeBody(x, y) { return this.scene.snake.some((s, i) => i > 0 && s.x === x && s.y === y); }
  isHead(x, y) { const h = this.scene.snake[0]; return h.x === x && h.y === y; }

  // Un paso por el suelo: null si hay piedra, borde cerrado o cuerpo de la serpiente
  groundStep(from, d) {
    const r = this.world.resolve(from.x + d.x, from.y + d.y);
    if (r.hit || !r.cell) return null;
    if (this.snakeBody(r.cell.x, r.cell.y)) return null;
    return r.cell;
  }

  hitAt(x, y) { return this.list.some((e) => e.lethal(x, y)); }

  // ¿Hay algún enemigo (o aviso de lava) a `r` celdas o menos?
  near(x, y, r) {
    return this.list.some((e) => {
      const cs = e.cells().concat(e.warning && e.warning() ? [e.warning()] : []);
      return cs.some((c) => Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) <= r);
    });
  }

  occupied(x, y) { return this.near(x, y, 0); }

  clear() {
    this.list.forEach((e) => e.destroy());
    this.list = [];
  }
}

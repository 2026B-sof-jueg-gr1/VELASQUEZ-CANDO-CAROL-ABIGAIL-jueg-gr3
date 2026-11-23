// El mundo de cada tierra: bordes que se cruzan o son pared de piedras, piedras en el tablero,
// el validador del mapa y el dibujo del marco. Regla visual del juego:
//   si es piedra, te mata; si brilla dorado, lo cruzas.
// Los datos (edges, gapsX, gapsY, rocks) viven en LEVELS (js/data.js).

const SPAWN = { x: 20, y: 15 };      // cabeza de la serpiente al empezar
const LANDING_MIN = 10;              // celdas libres en línea recta después de cruzar un borde
const cellKey = (x, y) => x + ',' + y;

class World {
  constructor(levelIdx) {
    this.levelIdx = levelIdx;
    const lv = LEVELS[levelIdx];
    this.name = lv.name;
    this.edges = lv.edges;
    this.gapsX = lv.gapsX || [];
    this.gapsY = lv.gapsY || [];
    this.rocks = new Set(lv.rocks.map(([x, y]) => cellKey(x, y)));
    // El informe se hace con el mapa tal como lo escribí a mano; después se tapan los huecos aislados
    this.report = this.validate();
    this.filled = this.sealUnreachable();
    this.traps = this.findTraps();
    this.fruitCells = this.findFruitCells();
  }

  // ---------- Consultas ----------

  isRock(x, y) { return this.rocks.has(cellKey(x, y)); }

  // ¿Se puede cruzar el borde `side` ('T','B','L','R') en la columna o fila `i`?
  crossable(side, i) {
    const mode = this.edges[side];
    if (mode === 'open') return true;
    if (mode !== 'gap') return false;
    const ranges = side === 'T' || side === 'B' ? this.gapsX : this.gapsY;
    return ranges.some(([a, b]) => i >= a && i <= b);
  }

  // Para una celda fuera del tablero: la celda por la que sale del lado opuesto, o null si es pared
  crossing(x, y) {
    if (x < 0) return this.crossable('L', y) ? { x: COLS - 1, y } : null;
    if (x >= COLS) return this.crossable('R', y) ? { x: 0, y } : null;
    if (y < 0) return this.crossable('T', x) ? { x, y: ROWS - 1 } : null;
    if (y >= ROWS) return this.crossable('B', x) ? { x, y: 0 } : null;
    return { x, y };
  }

  // Lo que hay en una celda de destino: { cell } si se puede entrar, { hit: 'rock' | 'border' } si no
  resolve(x, y) {
    const out = x < 0 || x >= COLS || y < 0 || y >= ROWS;
    if (out) {
      const c = this.crossing(x, y);
      if (!c) return { hit: 'border' };
      return this.isRock(c.x, c.y) ? { hit: 'rock', cell: c } : { cell: c, crossed: true };
    }
    return this.isRock(x, y) ? { hit: 'rock', cell: { x, y } } : { cell: { x, y } };
  }

  // Celdas vecinas por las que se puede pasar (con cruce de bordes)
  neighbors(x, y) {
    const res = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r = this.resolve(x + dx, y + dy);
      if (r.cell && !r.hit) res.push(r.cell);
    }
    return res;
  }

  // Todas las celdas a las que se llega desde `from`
  reach(from) {
    const seen = new Set([cellKey(from.x, from.y)]);
    const queue = [from];
    while (queue.length) {
      const c = queue.shift();
      for (const n of this.neighbors(c.x, c.y)) {
        const k = cellKey(n.x, n.y);
        if (!seen.has(k)) { seen.add(k); queue.push(n); }
      }
    }
    return seen;
  }

  freeKeys() {
    const out = [];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!this.isRock(x, y)) out.push({ x, y });
    return out;
  }

  // Celdas libres que no se alcanzan desde la salida
  unreachable() {
    const seen = this.reach(SPAWN);
    return this.freeKeys().filter((c) => !seen.has(cellKey(c.x, c.y)));
  }

  // Red de seguridad: los bolsillos aislados se rellenan con piedra
  sealUnreachable() {
    const cells = this.unreachable();
    cells.forEach((c) => this.rocks.add(cellKey(c.x, c.y)));
    return cells;
  }

  // Celdas con una sola salida: la serpiente no puede dar media vuelta, así que nada aparece ahí
  findTraps() {
    const traps = new Set();
    this.freeKeys().forEach((c) => { if (this.neighbors(c.x, c.y).length <= 1) traps.add(cellKey(c.x, c.y)); });
    return traps;
  }

  isTrap(x, y) { return this.traps.has(cellKey(x, y)); }

  // Distancia (en celdas, en cuadrado) a la piedra o al marco más cercano
  featureDistance(x, y) {
    let d = Math.min(x + 1, COLS - x, y + 1, ROWS - y);
    this.rocks.forEach((k) => {
      const [rx, ry] = k.split(',').map(Number);
      d = Math.min(d, Math.max(Math.abs(rx - x), Math.abs(ry - y)));
    });
    return d;
  }

  // La Fruta del Origen aparece a 1 o 2 celdas libres de una piedra o de un borde
  findFruitCells() {
    return this.freeKeys().filter((c) => {
      if (this.isTrap(c.x, c.y)) return false;
      const d = this.featureDistance(c.x, c.y);
      return d >= 2 && d <= 3;
    });
  }

  // ---------- Validador ----------

  // Celdas libres seguidas desde la entrada de un borde hacia adentro
  landingRun(side, i) {
    const dir = { T: [0, 1], B: [0, -1], L: [1, 0], R: [-1, 0] }[side];
    let x = side === 'L' ? 0 : side === 'R' ? COLS - 1 : i;
    let y = side === 'T' ? 0 : side === 'B' ? ROWS - 1 : i;
    let n = 0;
    while (x >= 0 && x < COLS && y >= 0 && y < ROWS && !this.isRock(x, y)) { n++; x += dir[0]; y += dir[1]; }
    return { dist: n, rock: n < (side === 'T' || side === 'B' ? ROWS : COLS) ? { x, y } : null };
  }

  validate() {
    const rep = { name: this.name, rocks: this.rocks.size, problems: [] };
    const free = this.freeKeys();
    rep.free = free.length;

    rep.unreachable = this.unreachable();
    if (rep.unreachable.length) rep.problems.push('sin alcanzar: ' + rep.unreachable.length + ' celdas ' + JSON.stringify(rep.unreachable.slice(0, 12)));

    rep.traps = this.findTraps();
    const traps = [...rep.traps];
    if (traps.length) rep.problems.push('zonas trampa: ' + traps.join(' '));

    // Zona de salida: radio 3 libre y nada de piedras en las 5 celdas de adelante
    rep.spawnOk = true;
    for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) if (this.isRock(SPAWN.x + dx, SPAWN.y + dy)) rep.spawnOk = false;
    for (let dx = 1; dx <= 5; dx++) if (this.isRock(SPAWN.x + dx, SPAWN.y)) rep.spawnOk = false;
    if (!rep.spawnOk) rep.problems.push('la zona de salida tiene piedras');

    // Pista de aterrizaje: al cruzar un borde hay que tener LANDING_MIN celdas libres de frente
    rep.landing = [];
    for (const side of ['T', 'B', 'L', 'R']) {
      const count = side === 'T' || side === 'B' ? COLS : ROWS;
      for (let i = 0; i < count; i++) {
        if (!this.crossable(side, i)) continue;
        const r = this.landingRun(side, i);
        if (r.dist < LANDING_MIN) {
          rep.landing.push({ side, index: i, dist: r.dist, rock: r.rock });
          const lado = { T: 'arriba', B: 'abajo', L: 'izquierda', R: 'derecha' }[side];
          const pos = (side === 'T' || side === 'B' ? 'columna ' : 'fila ') + i;
          rep.problems.push('aterrizaje: hueco de ' + lado + ' (' + pos + ') tiene la piedra a ' + r.dist + ' celdas (en ' + (r.rock ? r.rock.x + ',' + r.rock.y : '?') + ')');
        }
      }
    }

    // Pasillos de 1 celda de ancho (solo aviso)
    rep.narrow = [];
    const blocked = (x, y) => { const r = this.resolve(x, y); return !!r.hit; };
    free.forEach((c) => {
      const h = blocked(c.x - 1, c.y) && blocked(c.x + 1, c.y);
      const v = blocked(c.x, c.y - 1) && blocked(c.x, c.y + 1);
      if (h || v) rep.narrow.push({ x: c.x, y: c.y });
    });
    if (rep.narrow.length) rep.problems.push('pasillos de 1 celda: ' + rep.narrow.length + ' ' + JSON.stringify(rep.narrow.slice(0, 12)));

    rep.ok = rep.problems.length === 0;
    return rep;
  }
}

// Revisa las cinco tierras y lo escribe en la consola (tecla V del modo debug). Devuelve true si todo pasa.
function validateAllWorlds() {
  const rows = [];
  let ok = true;
  LEVELS.forEach((lv, i) => {
    const r = new World(i).report;
    rows.push({
      nivel: i + 1, tierra: r.name, piedras: r.rocks, libres: r.free, sinAlcanzar: r.unreachable.length,
      trampas: r.traps.size, salidaLibre: r.spawnOk, aterrizajeFallos: r.landing.length, pasillos1: r.narrow.length
    });
    if (r.problems.length) { ok = false; r.problems.forEach((p) => console.warn('[Nivel ' + (i + 1) + ' ' + r.name + '] ' + p)); }
  });
  console.table(rows);
  console.log(ok ? 'Validador: los 5 niveles pasan.' : 'Validador: hay avisos (ver arriba).');
  return ok;
}

// ---------- Dibujo: piedras y marco ----------

// Aspecto de la piedra de cada tierra (base, luz, sombra, detalle)
const STONE_STYLES = [
  { base: 0x7d8a78, light: 0xb4bfae, dark: 0x4a5547, accent: 0x5fa346 },   // bosque: roca con musgo
  { base: 0x9a6b43, light: 0xcf9d6b, dark: 0x64401f, accent: 0x7a5232 },   // desierto: roca de arenisca
  { base: 0xa6dbf2, light: 0xf0fbff, dark: 0x4f98c2, accent: 0xffffff },   // nieve: bloque de hielo
  { base: 0x2b2020, light: 0x6b5252, dark: 0x0a0606, accent: 0xff6a1a },   // volcán: roca volcánica con grietas
  { base: 0x2d3e4a, light: 0x62798a, dark: 0x0b1319, accent: 0x4aa8ff }    // noche: roca oscura con brillo azul
];

// Una piedra en la celda cuyo borde superior izquierdo es (px, py). La misma función dibuja
// los obstáculos del tablero y las piedras del marco, así siempre se ven iguales.
function drawStone(g, px, py, style) {
  const st = STONE_STYLES[style];
  const h = (px * 73856093 ^ py * 19349663) >>> 0;          // variación fija por celda (sin azar en cada dibujo)
  const v = (n) => ((h >> n) & 7) / 7;
  const x = px + 0.5, y = py + 0.5, s = CELL - 1;

  g.fillStyle(0x000000, 0.35);                              // sombra
  g.fillRoundedRect(x + 1.5, y + 2.5, s, s, 4);
  g.fillStyle(st.base);                                     // cuerpo
  g.fillRoundedRect(x, y, s, s, 4);
  g.fillStyle(st.dark);                                     // relieve: abajo y derecha oscuros
  g.fillRoundedRect(x + 2, y + s - 5, s - 3, 5, 3);
  g.fillRoundedRect(x + s - 5, y + 2, 5, s - 3, 3);
  g.fillStyle(st.base);
  g.fillRoundedRect(x + 2, y + 2, s - 6, s - 6, 3);
  g.fillStyle(st.light, 0.85);                              // relieve: arriba e izquierda claros
  g.fillRoundedRect(x + 1.5, y + 1.5, s - 7, 3.5, 2);
  g.fillRoundedRect(x + 1.5, y + 1.5, 3.5, s - 7, 2);
  g.fillStyle(st.light, 0.22);                              // faceta
  g.fillTriangle(x + 4, y + 4, x + s - 6, y + 4, x + 4, y + s - 6);

  if (style === 0) {                                        // musgo
    g.fillStyle(st.accent, 0.85);
    g.fillEllipse(x + 5 + v(0) * 4, y + 4, 8, 4);
    g.fillEllipse(x + 12, y + 3 + v(3) * 2, 5, 3);
  } else if (style === 1) {                                 // grietas de arenisca
    g.lineStyle(1.2, st.accent, 0.9);
    g.lineBetween(x + 5 + v(0) * 4, y + 6, x + 11, y + 12 + v(3) * 3);
    g.lineBetween(x + 11, y + 12, x + 15, y + 14);
  } else if (style === 2) {                                 // vetas del hielo
    g.lineStyle(1.5, st.accent, 0.9);
    g.lineBetween(x + 5, y + 14, x + 12 + v(0) * 3, y + 5);
    g.lineStyle(1, st.accent, 0.6);
    g.lineBetween(x + 10, y + 15, x + 15, y + 10);
  } else if (style === 3) {                                 // grietas de lava
    g.lineStyle(2, st.accent, 0.95);
    g.lineBetween(x + 4 + v(0) * 3, y + 14, x + 9, y + 9);
    g.lineBetween(x + 9, y + 9, x + 14, y + 11 + v(3) * 3);
    g.lineStyle(1, 0xffd27a, 0.9);
    g.lineBetween(x + 9, y + 9, x + 12, y + 6);
  } else {                                                  // brillo azul tenue
    g.fillStyle(st.accent, 0.28);
    g.fillCircle(x + s / 2, y + s / 2, 6);
    g.lineStyle(1.5, st.accent, 0.55);
    g.strokeRoundedRect(x + 2, y + 2, s - 4, s - 4, 3);
  }
  g.lineStyle(1, 0x000000, 0.55);                           // contorno para que se distinga del suelo
  g.strokeRoundedRect(x, y, s, s, 4);
}

// Dibuja las piedras del tablero y el marco de la tierra. Devuelve { stones, glow }
// (`glow` es la franja dorada que respira en los bordes que se cruzan).
function createWorldVisuals(scene, world) {
  const style = LEVELS[world.levelIdx].scenario;
  const stones = scene.add.graphics().setDepth(1.5);

  // Piedras del tablero (las que se rellenaron como red de seguridad también)
  world.rocks.forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    drawStone(stones, x * CELL, y * CELL, style);
  });

  // Marco: piedras en lados cerrados y fuera de los huecos
  const wall = (side, i) => !world.crossable(side, i);
  for (let x = 0; x < COLS; x++) {
    if (wall('T', x)) drawStone(stones, x * CELL, -CELL, style);
    if (wall('B', x)) drawStone(stones, x * CELL, ROWS * CELL, style);
  }
  for (let y = 0; y < ROWS; y++) {
    if (wall('L', y)) drawStone(stones, -CELL, y * CELL, style);
    if (wall('R', y)) drawStone(stones, COLS * CELL, y * CELL, style);
  }
  // Esquinas: piedra si alguno de sus dos lados no es del todo abierto
  const e = world.edges;
  [[-1, -1, 'T', 'L'], [COLS, -1, 'T', 'R'], [-1, ROWS, 'B', 'L'], [COLS, ROWS, 'B', 'R']].forEach(([cx, cy, a, b]) => {
    if (e[a] !== 'open' || e[b] !== 'open') drawStone(stones, cx * CELL, cy * CELL, style);
  });

  // Franja dorada en los bordes que se cruzan: más fuerte pegada al tablero, se apaga hacia afuera
  const glow = scene.add.graphics().setDepth(1.6);
  const layers = 10;
  const strip = (x0, y0, x1, y1, horizontal, outward) => {
    // horizontal: franja a lo largo de x; outward = -1 (arriba/izquierda) o +1 (abajo/derecha)
    for (let k = 0; k < layers; k++) {
      const a = 0.5 * Math.pow(1 - k / layers, 1.6) + 0.02;
      glow.fillStyle(PAL.gold, a);
      const off = k * 2;
      if (horizontal) {
        const yy = outward < 0 ? y0 - off - 2 : y1 + off;
        glow.fillRect(x0, yy, x1 - x0, 2);
      } else {
        const xx = outward < 0 ? x0 - off - 2 : x1 + off;
        glow.fillRect(xx, y0, 2, y1 - y0);
      }
    }
    // un poco de luz hacia adentro del tablero
    for (let k = 0; k < 4; k++) {
      glow.fillStyle(PAL.goldLight, 0.18 - k * 0.04);
      if (horizontal) glow.fillRect(x0, outward < 0 ? y0 + k * 2 : y1 - k * 2 - 2, x1 - x0, 2);
      else glow.fillRect(outward < 0 ? x0 + k * 2 : x1 - k * 2 - 2, y0, 2, y1 - y0);
    }
  };
  // Se agrupa en tramos seguidos de celdas que se cruzan
  const runs = (side, count) => {
    const out = [];
    let start = -1;
    for (let i = 0; i <= count; i++) {
      const on = i < count && world.crossable(side, i);
      if (on && start < 0) start = i;
      if (!on && start >= 0) { out.push([start, i]); start = -1; }
    }
    return out;
  };
  runs('T', COLS).forEach(([a, b]) => strip(a * CELL, 0, b * CELL, 0, true, -1));
  runs('B', COLS).forEach(([a, b]) => strip(a * CELL, 0, b * CELL, ROWS * CELL, true, 1));
  runs('L', ROWS).forEach(([a, b]) => strip(0, a * CELL, 0, b * CELL, false, -1));
  runs('R', ROWS).forEach(([a, b]) => strip(0, a * CELL, COLS * CELL, b * CELL, false, 1));
  // Respira despacio, sin parpadeos
  scene.tweens.add({ targets: glow, alpha: { from: 0.55, to: 1 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

  return { stones, glow };
}

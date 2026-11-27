// Reglas de la batalla final, sin dibujo, para poder probarlas aparte (ver BossScene.js y BOSS en data.js).
// La arena tiene los 4 bordes abiertos y ninguna piedra: el tablero "da la vuelta" por todos lados.

const BOSS_DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

// Celda a la que se llega desde `c` en dirección `d`, cruzando los bordes
function wrapStep(c, d) {
  return { x: (c.x + d.x + COLS) % COLS, y: (c.y + d.y + ROWS) % ROWS };
}

// Distancia en pasos entre dos celdas contando que los bordes se cruzan
function wrapDist(a, b) {
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  return Math.min(dx, COLS - dx) + Math.min(dy, ROWS - dy);
}

const sameCell = (a, b) => a.x === b.x && a.y === b.y;

// Direcciones que la mega serpiente puede tomar: nunca da media vuelta y, si hay otra salida, evita su propio cuerpo
function bossOptions(boss, dir) {
  const head = boss[0];
  const body = boss.slice(0, -1);               // la cola se mueve, así que esa celda queda libre
  const options = BOSS_DIRS.filter((d) => !(d.x === -dir.x && d.y === -dir.y));
  const safe = options.filter((d) => { const n = wrapStep(head, d); return !body.some((c) => sameCell(c, n)); });
  return safe.length ? safe : options;
}

// Elige la dirección del paso: la que más acerca la cabeza a `target` (o la que más aleja con flee),
// y con probabilidad BOSS.randomTurn, otra dirección válida. `rnd` devuelve un número entre 0 y 1.
function bossChooseDir(boss, dir, target, rnd, opts = {}) {
  const options = bossOptions(boss, dir);
  if (!opts.noRandom && rnd() < BOSS.randomTurn) return options[Math.floor(rnd() * options.length)];
  const sign = opts.flee ? -1 : 1;
  let best = Infinity, picks = [];
  options.forEach((d) => {
    const score = sign * wrapDist(wrapStep(boss[0], d), target);
    if (score < best) { best = score; picks = [d]; } else if (score === best) picks.push(d);
  });
  return picks[Math.floor(rnd() * picks.length)];
}

// Las próximas `n` celdas por las que pasaría la mega serpiente (sin azar), suponiendo que el objetivo no se mueve.
// Es lo que marca el poder de Luna.
function bossPredict(boss, dir, target, n) {
  const cells = boss.map((c) => ({ ...c }));
  let d = dir;
  const out = [];
  for (let i = 0; i < n; i++) {
    d = bossChooseDir(cells, d, target, () => 0.5, { noRandom: true });
    const next = wrapStep(cells[0], d);
    cells.unshift(next);
    cells.pop();
    out.push(next);
  }
  return out;
}

// Qué choca la super serpiente (jugador) al entrar en `next`: 'boss-head', 'boss-body', 'self' o null
function classifyPlayerMove(next, player, boss) {
  if (sameCell(next, boss[0])) return 'boss-head';
  if (boss.some((c) => sameCell(c, next))) return 'boss-body';
  if (player.slice(0, -1).some((c) => sameCell(c, next))) return 'self';
  return null;
}

// Qué choca la mega serpiente al entrar en `next`: 'player-head' (choque de frente), 'player-body', 'self' o null
function classifyBossMove(next, boss, player) {
  if (sameCell(next, player[0])) return 'player-head';
  if (player.slice(1).some((c) => sameCell(c, next))) return 'player-body';
  if (boss.slice(0, -1).some((c) => sameCell(c, next))) return 'self';
  return null;
}

// Un golpe a la mega serpiente: suma golpes (2 con el golpe doble de Duna) y le quita BOSS.hitCut de sus segmentos (mínimo 3)
function bossTakeHit(len, hits, amount = 1) {
  return {
    len: Math.max(3, Math.ceil(len * (1 - BOSS.hitCut))),
    hits: hits + amount,
    dead: hits + amount >= BOSS.hits
  };
}

// Comprobación para la tecla V del modo debug: devuelve { ok, problems }
function validateBoss() {
  const problems = [];
  const A = BOSS.arena;
  if (A.rocks.length) problems.push('batalla: la arena tiene piedras');
  if (!['T', 'B', 'L', 'R'].every((s) => A.edges[s] === 'open')) problems.push('batalla: la arena no tiene los 4 bordes abiertos');

  // salidas: dentro del tablero, separadas y sin que los cuerpos iniciales se pisen (con las 5 amigas)
  const p = BOSS.player, b = BOSS.boss;
  const inside = (c) => c.x >= 0 && c.x < COLS && c.y >= 0 && c.y < ROWS;
  if (!inside(p) || !inside(b)) problems.push('batalla: una salida está fuera del tablero');
  if (wrapDist(p, b) < BOSS.minStartDist) problems.push('batalla: las cabezas salen a menos de ' + BOSS.minStartDist + ' celdas');
  const body = (h, dir, n) => Array.from({ length: n }, (_, i) => ({ x: ((h.x - dir.x * i) % COLS + COLS) % COLS, y: ((h.y - dir.y * i) % ROWS + ROWS) % ROWS }));
  const pb = body(p, p.dir, BOSS.playerLen + Object.keys(FRIENDS).length), bb = body(b, b.dir, BOSS.bossLen);
  if (pb.some((c) => bb.some((q) => sameCell(c, q)))) problems.push('batalla: los cuerpos iniciales se pisan');
  if (pb.some((c, i) => pb.findIndex((q) => sameCell(q, c)) !== i)) problems.push('batalla: la super serpiente se pisa a sí misma al salir');
  if (bb.some((c, i) => bb.findIndex((q) => sameCell(q, c)) !== i)) problems.push('batalla: la mega serpiente se pisa a sí misma al salir');

  // poderes: uno por amiga, con teclas 1 a 5 distintas
  const ids = Object.keys(FRIENDS);
  if (ids.some((id) => !BOSS_POWERS[id])) problems.push('batalla: falta el poder de una amiga');
  if (ids.map((id) => BOSS_POWERS[id] && BOSS_POWERS[id].key).sort().join() !== '1,2,3,4,5') problems.push('batalla: las teclas de los poderes no son 1 a 5 sin repetir');

  // la inteligencia de la mega serpiente: miles de situaciones al azar
  let bad = 0;
  for (let t = 0; t < 2000; t++) {
    const dir = BOSS_DIRS[Math.floor(Math.random() * 4)];
    const len = 3 + Math.floor(Math.random() * 25);
    const head = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    // cuerpo en línea hacia atrás, con una vuelta al azar
    const boss = [head];
    let c = head, d = { x: -dir.x, y: -dir.y };
    for (let i = 1; i < len; i++) {
      if (Math.random() < 0.3) d = BOSS_DIRS[Math.floor(Math.random() * 4)];
      c = wrapStep(c, d);
      if (boss.some((q) => sameCell(q, c))) break;
      boss.push(c);
    }
    const target = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    const options = bossOptions(boss, dir);
    for (const rnd of [() => 0.0, () => 0.99, Math.random]) {
      const pick = bossChooseDir(boss, dir, target, rnd);
      if (pick.x === -dir.x && pick.y === -dir.y) bad++;                                 // nunca media vuelta
      if (!options.some((o) => o.x === pick.x && o.y === pick.y)) bad++;                 // siempre una opción válida
    }
    // sin azar elige la que más la acerca
    const pick = bossChooseDir(boss, dir, target, () => 0.99);
    const best = Math.min(...options.map((o) => wrapDist(wrapStep(head, o), target)));
    if (wrapDist(wrapStep(head, pick), target) !== best) bad++;
    // si hay una salida que no es su cuerpo, la elegida no lo es
    const safe = BOSS_DIRS.filter((o) => !(o.x === -dir.x && o.y === -dir.y) && !boss.slice(0, -1).some((q) => sameCell(q, wrapStep(head, o))));
    if (safe.length && !safe.some((o) => o.x === pick.x && o.y === pick.y)) bad++;
  }
  if (bad) problems.push('batalla: la mega serpiente tomó ' + bad + ' decisiones inválidas');

  // golpes: 4 golpes la deshacen, el golpe doble cuenta por dos y siempre quedan 3 segmentos como mínimo
  let r = { len: BOSS.bossLen, hits: 0, dead: false };
  for (let i = 0; i < BOSS.hits - 1; i++) { r = bossTakeHit(r.len, r.hits); if (r.dead) problems.push('batalla: murió antes del golpe ' + BOSS.hits); if (r.len < 3) problems.push('batalla: quedó con menos de 3 segmentos'); }
  if (!bossTakeHit(r.len, r.hits).dead) problems.push('batalla: no muere con ' + BOSS.hits + ' golpes');
  if (!bossTakeHit(10, BOSS.hits - 2, 2).dead) problems.push('batalla: el golpe doble no cuenta por dos');
  if (bossTakeHit(4, 0).len < 3) problems.push('batalla: un golpe deja menos de 3 segmentos');
  return { ok: problems.length === 0, problems };
}

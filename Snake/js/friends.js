// Las miniserpientes amigas. Cada tierra tiene una: aparece tras la manzana FRIEND_AFTER con un reto opcional.
// Si lo cumples se une como un segmento de su color al final de la cola (se queda para siempre y las Tijeras no lo cortan)
// y se abre la cámara del recuerdo con su recuerdo. Si no, el nivel sigue normal.
// Sus casillas respetan lo mismo que los enemigos: alcanzables, sin trampas, fuera de la zona de salida y de la pista de aterrizaje.
// Datos de los retos en FRIEND_RULES y FRIENDS (data.js).

// Una miniserpiente enroscada de 20 px, con relieve. `look` pone el detalle de cada amiga.
function drawFriendSnake(g, cx, cy, color, look, t) {
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx + 1, cy + 6, 16, 5);
  if (look === 'musgo') {                       // atrapada entre hojas
    [[-7, 3, 0.5], [7, 4, -0.5], [-5, -5, -0.3], [6, -4, 0.4]].forEach(([dx, dy, r]) => {
      g.fillStyle(0x1f6e43);
      g.fillEllipse(cx + dx, cy + dy, 9, 4.5);
      g.fillStyle(0x3fae6a, 0.9);
      g.fillEllipse(cx + dx - 0.5, cy + dy - 0.6, 7, 3);
    });
  }
  bead(g, cx - 5, cy + 3, 3.4, color);
  bead(g, cx + 1, cy + 5, 3.4, color);
  bead(g, cx + 5, cy + 1, 3.4, color);
  bead(g, cx + 1, cy - 3, 4.2, color);
  g.fillStyle(0xf2c14e);
  g.fillCircle(cx - 0.5, cy - 4, 1.1);
  g.fillCircle(cx + 3, cy - 4, 1.1);
  if (look === 'duna') {                        // gota de sudor: tiene sed
    g.fillStyle(0x7fd6ff);
    g.fillTriangle(cx + 8, cy - 9, cx + 6, cy - 5, cx + 10, cy - 5);
    g.fillCircle(cx + 8, cy - 4.5, 2);
  }
  if (look === 'luna') {                        // brilla suave en la oscuridad
    const a = 0.2 + 0.1 * Math.sin(t * 0.003);
    g.fillStyle(0x7da0ff, a);
    g.fillCircle(cx, cy, 14);
  }
}

// Capa de hielo de Escarcha; cada pasada agrega una grieta
function drawIceShell(g, cx, cy, cracks) {
  g.fillStyle(0xcdeefb, 0.55);
  g.fillRoundedRect(cx - 10, cy - 10, 20, 20, 4);
  g.lineStyle(1.5, 0x4f98c2, 0.9);
  g.strokeRoundedRect(cx - 10, cy - 10, 20, 20, 4);
  g.fillStyle(0xffffff, 0.6);
  g.fillRoundedRect(cx - 8, cy - 8, 8, 3, 1);
  g.lineStyle(1.3, 0xffffff, 0.95);
  if (cracks >= 1) g.lineBetween(cx - 4, cy - 8, cx + 1, cy);
  if (cracks >= 2) g.lineBetween(cx + 1, cy, cx + 8, cy + 3);
  if (cracks >= 3) g.lineBetween(cx + 1, cy, cx - 6, cy + 7);
}

// Brasa: empieza como culebra de lava. Mientras no cambia de bando, mata cuando sale (como las demás).
class BrasaSnake extends LavaSnake {
  constructor(dir, cell) {
    super(dir);
    this.cell = cell;
    this.isFriend = true;
    this.timer = 1200;
    this.counted = false;
    this.dodges = 0;
  }
  cells() { return this.state === 'up' ? [this.cell] : []; }
  warning() { return this.state === 'warn' ? this.cell : null; }
  update(delta) {
    const def = ENEMIES.lava, rule = FRIEND_RULES.brasa;
    const h = this.scene.snake[0];
    this.t += delta;
    this.timer -= delta;
    if (this.state === 'rest' && this.timer <= 0) {
      this.state = 'warn'; this.timer = def.warn;
    } else if (this.state === 'warn' && this.timer <= 0) {
      if (this.dir.snakeBody(this.cell.x, this.cell.y) || this.dir.isHead(this.cell.x, this.cell.y)) {
        this.state = 'rest'; this.timer = 600;
      } else { this.state = 'up'; this.timer = def.up; this.upT = 0; this.counted = false; }
    } else if (this.state === 'up') {
      this.upT += delta;
      // una esquiva: la cabeza pasó cerca mientras ella estaba fuera, y sigue viva
      if (Math.max(Math.abs(h.x - this.cell.x), Math.abs(h.y - this.cell.y)) <= rule.near) this.counted = true;
      if (this.timer <= 0) {
        this.state = 'rest';
        this.timer = Phaser.Math.Between(def.restMin, def.restMax);
        if (this.counted) { this.dodges++; this.scene.friends.onDodge(this.dodges); }
      }
    }
    this.draw();
  }
  draw() {
    this.g.clear();
    const [x, y] = this.px(this.cell);
    if (this.state === 'warn') drawLavaWarning(this.g, x, y, this.t);
    else if (this.state === 'up') drawLavaSnake(this.g, x, y, Math.min(1, this.upT / 300));
    else {
      // en reposo se ve su cráter apagado, para saber dónde está
      this.g.fillStyle(0x140808);
      this.g.fillEllipse(x, y + 4, 20, 9);
      this.g.lineStyle(2, 0xff6a1a, 0.5);
      this.g.strokeEllipse(x, y + 4, 20, 9);
    }
  }
}

class FriendDirector {
  constructor(scene) {
    this.scene = scene;
    this.world = scene.world;
    this.id = GameState.current().friend;
    this.def = FRIENDS[this.id];
    this.rule = FRIEND_RULES[this.id];
    const mine = GameState.friends.includes(this.id) || GameState.lost.includes(this.id);
    this.state = mine ? 'off' : 'waiting';       // waiting -> present -> joined | lost
    this.cell = null;
    this.retry = 0;
    this.g = null;
    this.label = null;
    this.hint = scene.add.text(400, 36, '', { ...TEXT, fontSize: '15px', color: CSS.goldLight, backgroundColor: 'rgba(11,20,16,0.78)', padding: { x: 10, y: 3 } })
      .setOrigin(0.5, 0).setDepth(DEPTH.hud).setVisible(false);
    this.t = 0;
    this.timeLeft = 0;
    this.near = false;
    this.passes = 0;
    this.dodges = 0;
    this.fireflies = [];
    this.lastThirst = 0;
  }

  occupies(x, y) { return this.state === 'present' && this.id !== 'brasa' && this.cell && this.cell.x === x && this.cell.y === y; }

  update(delta) {
    const sc = this.scene;
    if (this.state === 'off' || this.state === 'joined' || this.state === 'lost' || sc.dead || sc.busy) return;
    this.t += delta;
    if (this.state === 'waiting') {
      this.retry -= delta;
      if (sc.applesLevel >= FRIEND_AFTER && !sc.fruit && this.retry <= 0) { if (!this.appear()) this.retry = 600; }
      return;
    }
    this['tick_' + this.id](delta);
  }

  // Elige una casilla válida vista desde la cabeza actual y deja a la amiga ahí
  appear(force = false) {
    const sc = this.scene, w = this.world, h = sc.snake[0];
    const dist = w.distFrom(h);
    const ok = (c) => {
      const d = dist.get(c.x + ',' + c.y);
      if (d === undefined || d < this.rule.minDist || d > this.rule.maxDist) return false;
      if (this.id === 'escarcha' || this.id === 'brasa') { if (!w.openNeighborhood(c.x, c.y)) return false; }
      if (sc.snake.some((s) => s.x === c.x && s.y === c.y)) return false;
      const at = (q) => q && q.x === c.x && q.y === c.y;
      if (at(sc.food) || at(sc.material) || at(sc.fruit) || at(sc.power)) return false;
      if (sc.enemies.near(c.x, c.y, 2)) return false;
      return true;
    };
    const options = w.spawnable.filter(ok);
    if (!options.length) return false;
    const c = Phaser.Utils.Array.GetRandom(options);
    this.cell = { x: c.x, y: c.y };
    this.state = 'present';
    this.g = sc.add.graphics().setDepth(DEPTH.items + 0.6);
    this.label = sc.add.text(0, 0, this.def.name, { ...TEXT, fontSize: '13px', fontStyle: '700', color: CSS.goldLight, stroke: '#0b1410', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(DEPTH.fx);
    const [px, py] = this.px();
    this.label.setPosition(px, py - 17);
    this.near = false; this.passes = 0; this.dodges = 0;
    if (this.id === 'musgo') this.timeLeft = this.rule.time;
    if (this.id === 'brasa') {
      this.brasa = new BrasaSnake(sc.enemies, this.cell);
      sc.enemies.list.push(this.brasa);
    }
    if (this.id === 'luna') this.makeTrail(h);
    this.setHint();
    sc.floatText(px, py - 30, '¡' + this.def.name + '!', CSS.goldLight);
    beep(sc, 700, 0.15, 'sine', 900);
    return true;
  }

  px() { return [this.cell.x * CELL + CELL / 2, this.cell.y * CELL + CELL / 2]; }
  headNear(r) {
    const h = this.scene.snake[0];
    return Math.max(Math.abs(h.x - this.cell.x), Math.abs(h.y - this.cell.y)) <= r;
  }

  setHint(n) {
    const text = this.def.hint.replace('{n}', n === undefined ? '' : n);
    this.hint.setText(text).setVisible(true);
  }

  drawFriend(extra) {
    this.g.clear();
    const [x, y] = this.px();
    if (this.id === 'luna') {
      // Luna se ve tenue hasta que la cabeza se acerca
      this.g.setAlpha(this.headNear(7) ? 1 : 0.35);
    }
    drawFriendSnake(this.g, x, y, this.def.color, this.id, this.t);
    if (extra) extra(this.g, x, y);
  }

  // ----- Retos -----

  // Musgo: llegar a ella antes de 10 s
  tick_musgo(delta) {
    this.timeLeft -= delta;
    this.setHint(Math.max(0, Math.ceil(this.timeLeft / 1000)));
    this.drawFriend();
    if (this.headNear(0)) return this.join();
    if (this.timeLeft <= 0) this.lose('Musgo se escondió entre las hojas');
  }

  // Duna: llevarle el agua de oasis (el 2.º material)
  tick_duna() {
    this.drawFriend();
    const hasWater = GameState.materials >= 2;
    this.hint.setText(hasWater ? 'Duna: ¡llévale el agua que juntaste!' : this.def.hint);
    if (this.headNear(0)) {
      if (hasWater) return this.join();
      if (this.t - this.lastThirst > 2500) {
        this.lastThirst = this.t;
        const [px, py] = this.px();
        this.scene.floatText(px, py - 24, 'Tiene sed… busca el agua de oasis', CSS.goldLight);
      }
    }
  }

  // Escarcha: pasar 3 veces a su lado para romper el hielo
  tick_escarcha() {
    const close = this.headNear(1);
    if (close) this.near = true;
    else if (this.near && this.headNear(2) === false) { this.near = false; this.passes++; beep(this.scene, 500 + this.passes * 120, 0.12, 'triangle'); }
    this.setHint(this.passes);
    this.drawFriend((g, x, y) => drawIceShell(g, x, y, this.passes));
    if (this.passes >= this.rule.passes) this.join();
  }

  // Brasa: esquivarla 3 veces (la cuenta la lleva BrasaSnake)
  tick_brasa() {
    this.setHint(this.dodges);
    this.t += 0;
  }
  onDodge(n) {
    this.dodges = n;
    const [px, py] = this.px();
    this.scene.floatText(px, py - 24, '¡Esquivada! ' + n + '/' + this.rule.dodges, CSS.goldLight);
    beep(this.scene, 520 + n * 100, 0.12, 'triangle');
    if (n >= this.rule.dodges) this.join();
  }

  // Luna: seguir el rastro de 5 luciérnagas hasta ella
  makeTrail(from) {
    const path = this.world.pathTo(from, this.cell);
    const n = this.rule.fireflies;
    this.fireflies = [];
    for (let k = 1; k <= n; k++) {
      const c = path[Math.min(path.length - 1, Math.floor(path.length * k / (n + 1)))];
      this.fireflies.push({ x: c.x, y: c.y, taken: false });
    }
    this.trailG = this.scene.add.graphics().setDepth(DEPTH.items + 0.7).setBlendMode(Phaser.BlendModes.ADD);
  }
  tick_luna() {
    const h = this.scene.snake[0];
    let got = 0;
    this.fireflies.forEach((f) => {
      if (!f.taken && Math.max(Math.abs(h.x - f.x), Math.abs(h.y - f.y)) <= 1) { f.taken = true; beep(this.scene, 800, 0.08, 'sine', 1200); }
      if (f.taken) got++;
    });
    this.setHint(got);
    this.trailG.clear();
    this.fireflies.forEach((f) => {
      if (f.taken) return;
      const x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2;
      const a = 0.65 + 0.25 * Math.sin(this.t * 0.004 + f.x);
      this.trailG.fillStyle(0xd4ff6b, a * 0.35);
      this.trailG.fillCircle(x, y, 9);
      this.trailG.fillStyle(0xf4ffb0, a);
      this.trailG.fillCircle(x, y, 3.2);
    });
    this.drawFriend();
    if (this.headNear(0)) this.join();
  }

  // ----- Resultado -----

  join() {
    if (this.state !== 'present') return;
    const sc = this.scene;
    this.state = 'joined';
    const [px, py] = this.px();
    sc.floatText(px, py - 24, '¡' + this.def.name + ' se une!', CSS.gold);
    sc.starBurst.explode(18, px, py);
    [523, 659, 784].forEach((f, i) => sc.time.delayedCall(i * 100, () => beep(sc, f, 0.18, 'triangle')));
    GameState.friends.push(this.id);
    GameState.save();
    sc.addFriendSegment();
    this.cleanup();
    sc.busy = true;   // el juego se detiene hasta resolver el recuerdo
    sc.time.delayedCall(800, () => sc.openFriendMemory(this.id));
  }

  lose(text) {
    const [px, py] = this.px();
    this.scene.floatText(px, py - 24, text, '#f0704d');
    beep(this.scene, 260, 0.3, 'sawtooth', 90);
    GameState.lost.push(this.id);
    this.state = 'lost';
    this.cleanup();
  }

  cleanup() {
    this.hint.setVisible(false);
    if (this.g) { this.g.destroy(); this.g = null; }
    if (this.label) { this.label.destroy(); this.label = null; }
    if (this.trailG) { this.trailG.destroy(); this.trailG = null; }
    if (this.brasa) {
      this.scene.enemies.list = this.scene.enemies.list.filter((e) => e !== this.brasa);
      this.brasa.destroy();
      this.brasa = null;
    }
  }

  // Al comer la Fruta del Origen se recoge todo; la amiga que no se consiguió se pierde
  clear() {
    this.cleanup();
    if (this.state === 'present' || this.state === 'waiting') this.state = 'off';
  }

  // Atajos del modo debug
  debugAppear() { if (this.state === 'waiting' || this.state === 'off') { this.state = 'waiting'; return this.appear(true); } return false; }
  debugJoin() { if (this.state === 'present') { this.join(); return true; } return false; }
}

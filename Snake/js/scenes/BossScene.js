// La batalla final: la super serpiente (Inti montado sobre sus amigas) contra la mega serpiente.
// La arena tiene los 4 bordes abiertos y no tiene piedras. Reglas y datos: BOSS y BOSS_POWERS (data.js);
// las decisiones de la mega serpiente y los choques están en js/boss-logic.js.
//   - La mega serpiente persigue la cabeza del jugador (20 % de las veces elige otra dirección válida).
//   - Si choca con el cuerpo de la super serpiente o con su propio cuerpo, recibe un golpe: se aleja 2 s y pierde segmentos.
//   - Con 4 golpes se deshace. Si el jugador choca de frente, con su cuerpo o con su propio cuerpo, pierde (salvo el Escudo de Musgo).
class BossScene extends Phaser.Scene {
  constructor() {
    super('BossScene');
  }

  init(data) {
    this.skipIntro = !!(data && data.skipIntro);
    this.friendIds = GameState.friends.slice();
    // En modo debug sin amigas se prueban los cinco poderes (no se guarda nada)
    this.testRun = DEBUG && this.friendIds.length === 0;
    if (this.testRun) this.friendIds = Object.keys(FRIENDS);
  }

  create() {
    frameCamera(this);
    makeTextures(this);
    this.cameras.main.fadeIn(500, 11, 20, 16);
    createScenario(this, BOSS.arena.scenario);
    this.world = new World(BOSS.arena);
    createWorldVisuals(this, this.world);

    this.bossG = this.add.graphics().setDepth(DEPTH.snake - 0.2);
    this.playerG = this.add.graphics().setDepth(DEPTH.snake);
    this.rider = this.add.graphics().setDepth(DEPTH.snake + 0.1);
    artPerson(this.rider, 0, 9, 38, 0x3d5bd9, true);       // Inti sobre la cabeza
    this.rider.setVisible(false);                         // solo se ve en la batalla
    this.appleG = [];
    this.visionG = this.add.graphics().setDepth(DEPTH.fx - 0.5);
    this.hudG = this.add.graphics().setDepth(DEPTH.hud);
    this.burst = this.add.particles(0, 0, 'dot', { speed: { min: 60, max: 220 }, lifespan: 600, scale: { start: 1, end: 0 }, tint: PAL.red, emitting: false }).setDepth(DEPTH.fx);

    this.friendColors = this.friendIds.map((id) => FRIENDS[id].color);
    this.phase = 'none';
    this.paused = false;
    this.hudLabel = this.add.text(400, 40, 'Mega serpiente', { ...TEXT, fontSize: '14px', color: PAL.muted }).setOrigin(0.5).setDepth(DEPTH.hud);
    this.buildPowerIcons();
    this.pauseLayer = this.add.container(0, 0, [
      this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg, 0.65),
      this.add.text(400, 280, 'Pausa', { ...TITLE, fontSize: '48px' }).setOrigin(0.5),
      this.add.text(400, 335, 'P o Esc para continuar', { ...TEXT, fontSize: '18px', color: PAL.muted }).setOrigin(0.5)
    ]).setVisible(false).setDepth(DEPTH.overlay);

    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    this.input.keyboard.on('keydown', (e) => this.handleKey(e.code));
    this.tapped = false;
    this.input.on('pointerdown', (p) => this.onDown(p.x - MARGIN, p.y - MARGIN));
    this.input.on('pointerup', (p) => this.onUp(p));

    if (this.skipIntro) this.startBattle(); else this.startIntro();
  }

  // ---------- Introducción ----------

  startIntro() {
    this.phase = 'intro';
    this.introT = 0;
    this.introG = this.add.graphics().setDepth(DEPTH.snake + 0.05);
    this.introHuman = this.add.graphics().setDepth(DEPTH.snake + 0.2);
    artPerson(this.introHuman, 0, 0, 110, 0x3d5bd9, true);
    this.introText = this.add.text(400, 536, '', { ...TEXT, fontSize: '22px', fontStyle: '700', color: CSS.goldLight, align: 'center', wordWrap: { width: 700 }, stroke: '#0b1410', strokeThickness: 5 }).setOrigin(0.5).setDepth(DEPTH.overlay);
    this.skipText = this.add.text(400, 586, BOSS_TEXT.skip, { ...TEXT, fontSize: '14px', color: PAL.muted }).setOrigin(0.5).setDepth(DEPTH.overlay);
    this.hudLabel.setVisible(false);
    this.powerIcons.forEach((i) => i.setVisible(false));
  }

  // Cuatro momentos: Inti y la serpiente se separan, la serpiente cruza y crece, llegan las amigas, forman la super serpiente
  updateIntro(delta) {
    this.introT += delta;
    const t = this.introT;
    const A = 2400, B = 5400, C = 8400, D = 10800;
    const g = this.introG;
    g.clear();
    const L = this.friendIds.length;
    const lines = BOSS_TEXT.intro.slice();
    if (!L) lines[2] = BOSS_TEXT.solo;
    this.introText.setText(t < A ? lines[0] : t < B ? lines[1] : t < C ? lines[2] : lines[3]);

    // Inti de pie a la izquierda; al final se sube a la cabeza de la super serpiente
    const startHead = { x: BOSS.player.x * CELL + CELL / 2, y: BOSS.player.y * CELL + CELL / 2 - 4 };
    const ride = Phaser.Math.Clamp((t - (C + 600)) / 1600, 0, 1);
    this.introHuman.setPosition(Phaser.Math.Linear(170, startHead.x, ride), Phaser.Math.Linear(350, startHead.y + 12, ride));
    this.introHuman.setScale(Phaser.Math.Linear(1, 0.36, ride));

    // La mega serpiente: nace pequeña junto a Inti, se aleja y crece hasta BOSS.bossLen segmentos
    const sep = Phaser.Math.Clamp((t - 600) / 1800, 0, 1);
    const grow = Phaser.Math.Clamp((t - A) / (B - A), 0, 1);
    const len = Math.round(Phaser.Math.Linear(4, BOSS.bossLen, grow));
    const ax = Math.round(Phaser.Math.Linear(10, BOSS.boss.x - 16, Math.max(sep, grow)));
    const ay = Math.round(Phaser.Math.Linear(17, BOSS.boss.y, Math.max(sep, grow)));
    const cells = [];
    for (let i = 0; i < len; i++) cells.push({ x: ax + i, y: ay + Math.round(2 * Math.sin(i * 0.6)) });
    this.drawBoss(g, cells, { x: -1, y: 0 }, 0, 0);

    // Las amigas llegan una a una desde abajo
    this.friendColors.forEach((color, k) => {
      const a = Phaser.Math.Clamp((t - B - k * 450) / 500, 0, 1) * (1 - Phaser.Math.Clamp((t - C) / 900, 0, 1));
      if (a <= 0) return;
      const cell = { x: 8 + k * 5, y: 26 };
      drawSegmentShadow(g, cell);
      drawSegment(g, cell, color, 0, 5);
    });

    // Y se juntan en la super serpiente
    const sa = Phaser.Math.Clamp((t - C) / 1400, 0, 1);
    this.playerG.setAlpha(sa);
    if (sa > 0 && !this.introPlayer) {
      this.introPlayer = this.makePlayerCells();
      drawSnake(this.playerG, this.introPlayer, BOSS.player.dir, false, 5, this.friendColors);
    }
    if (t >= D) this.endIntro();
  }

  endIntro() {
    if (this.phase !== 'intro') return;
    this.introG.destroy(); this.introHuman.destroy(); this.introText.destroy(); this.skipText.destroy();
    this.playerG.clear();
    this.playerG.setAlpha(1);
    this.introPlayer = null;
    this.hudLabel.setVisible(true);
    this.powerIcons.forEach((i) => i.setVisible(true));
    this.startBattle();
  }

  // ---------- Batalla ----------

  makePlayerCells() {
    const n = BOSS.playerLen + this.friendIds.length;
    const p = BOSS.player;
    return Array.from({ length: n }, (_, i) => ({ x: ((p.x - p.dir.x * i) % COLS + COLS) % COLS, y: ((p.y - p.dir.y * i) % ROWS + ROWS) % ROWS }));
  }

  startBattle() {
    this.phase = 'battle';
    this.rider.setVisible(true);
    this.player = this.makePlayerCells();
    this.pdir = { ...BOSS.player.dir };
    this.queue = [];
    const b = BOSS.boss;
    this.boss = Array.from({ length: BOSS.bossLen }, (_, i) => ({ x: ((b.x - b.dir.x * i) % COLS + COLS) % COLS, y: ((b.y - b.dir.y * i) % ROWS + ROWS) % ROWS }));
    this.bdir = { ...b.dir };
    this.hits = 0;
    this.pAcc = 0; this.bAcc = 0;
    this.pInvuln = 0; this.retreat = 0; this.freeze = 0; this.vision = 0;
    this.shield = false; this.doubleNext = false;
    this.cooldown = {};
    this.apples = [];
    for (let i = 0; i < BOSS.apples; i++) this.spawnApple();
    const names = this.friendIds.slice().sort((a, b) => BOSS_POWERS[a].key - BOSS_POWERS[b].key).map((id) => BOSS_POWERS[id].key + ' ' + BOSS_POWERS[id].name).join(' · ');
    this.showToast(BOSS_TEXT.help + (names ? ' — ' + names : ''), 4500);
    this.drawAll(0);
  }

  allCells() { return this.player.concat(this.boss); }

  spawnApple() {
    const used = this.allCells().concat(this.apples);
    const free = [];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!used.some((c) => c.x === x && c.y === y)) free.push({ x, y });
    if (!free.length) return;
    const cell = Phaser.Utils.Array.GetRandom(free);
    const g = this.add.graphics().setDepth(DEPTH.items);
    drawApple(g);
    g.setPosition(cell.x * CELL + CELL / 2, cell.y * CELL + CELL / 2);
    this.tweens.add({ targets: g, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
    this.apples.push({ ...cell, g });
  }

  eatAppleAt(cell) {
    const i = this.apples.findIndex((a) => a.x === cell.x && a.y === cell.y);
    if (i < 0) return false;
    this.apples[i].g.destroy();
    this.apples.splice(i, 1);
    this.spawnApple();
    return true;
  }

  update(time, delta) {
    if (this.phase === 'intro') return this.updateIntro(Math.min(delta, 100));
    if (this.phase !== 'battle' || this.paused) return;
    const dt = Math.min(delta, 100);
    this.pInvuln = Math.max(0, this.pInvuln - dt);
    this.retreat = Math.max(0, this.retreat - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.vision = Math.max(0, this.vision - dt);
    Object.keys(this.cooldown).forEach((id) => { this.cooldown[id] = Math.max(0, this.cooldown[id] - dt); });

    this.pAcc += dt;
    while (this.pAcc >= BOSS.playerStep && this.phase === 'battle') { this.pAcc -= BOSS.playerStep; this.playerStep(); }
    this.bAcc += dt;
    const bossDelay = BOSS.bossStep * (this.freeze > 0 ? BOSS_POWERS.escarcha.slow : 1);
    while (this.bAcc >= bossDelay && this.phase === 'battle') { this.bAcc -= bossDelay; this.bossStep(); }
    this.drawAll(time);
  }

  // Un paso de la super serpiente
  playerStep() {
    if (this.queue.length) this.pdir = this.queue.shift();
    const next = wrapStep(this.player[0], this.pdir);
    const hit = classifyPlayerMove(next, this.player, this.boss);
    if (hit && this.pInvuln <= 0 && !(hit === 'self' && !BOSS.selfCollisionKills)) {
      if (!this.useShield()) return this.lose();
    }
    this.player.unshift(next);
    if (this.eatAppleAt(next)) { beep(this, 660, 0.08, 'square', 990); } else this.player.pop();
  }

  // Un paso de la mega serpiente
  bossStep() {
    const flee = this.retreat > 0;
    this.bdir = bossChooseDir(this.boss, this.bdir, this.player[0], Math.random, { flee });
    const next = wrapStep(this.boss[0], this.bdir);
    const hit = classifyBossMove(next, this.boss, this.player);
    let hurt = false;
    if (hit === 'player-head') {
      // choque de frente
      if (this.pInvuln <= 0 && !this.useShield()) return this.lose();
    } else if (hit && this.retreat <= 0) {
      hurt = true;
    }
    this.boss.unshift(next);
    if (this.eatAppleAt(next)) beep(this, 220, 0.1, 'square', 330); else this.boss.pop();
    if (hurt) this.hurtBoss();
  }

  hurtBoss() {
    const amount = this.doubleNext ? 2 : 1;
    this.doubleNext = false;
    const res = bossTakeHit(this.boss.length, this.hits, amount);
    this.hits = res.hits;
    const head = this.boss[0];
    this.burst.setParticleTint(PAL.gold);
    this.burst.explode(22, head.x * CELL + CELL / 2, head.y * CELL + CELL / 2);
    this.cameras.main.shake(180, 0.006);
    beep(this, 180, 0.35, 'sawtooth', 70);
    this.floatText(head.x * CELL + CELL / 2, head.y * CELL, amount > 1 ? '¡Golpe doble!' : '¡Golpe!', CSS.goldLight);
    if (res.dead) return this.win();
    this.boss.splice(res.len);          // pierde segmentos de la cola
    this.retreat = BOSS.retreat;        // se aleja y no se le puede golpear
  }

  useShield() {
    if (!this.shield) return false;
    this.shield = false;
    this.pInvuln = BOSS.invuln;
    this.cameras.main.shake(120, 0.005);
    beep(this, 880, 0.2, 'sine', 220);
    const h = this.player[0];
    this.floatText(h.x * CELL + CELL / 2, h.y * CELL, '¡Escudo!', CSS.gold);
    return true;
  }

  // ---------- Poderes de las amigas ----------

  buildPowerIcons() {
    this.powerIcons = [];
    this.iconRects = [];
    const ids = this.friendIds.slice().sort((a, b) => BOSS_POWERS[a].key - BOSS_POWERS[b].key);
    const r = 28, gap = 16;
    const total = ids.length * (2 * r) + (ids.length - 1) * gap;
    ids.forEach((id, i) => {
      const x = 400 - total / 2 + r + i * (2 * r + gap), y = 546;
      const label = this.add.text(x, y + r + 12, String(BOSS_POWERS[id].key), { ...TEXT, fontSize: '16px', fontStyle: '800', color: CSS.goldLight, stroke: '#0b1410', strokeThickness: 4 }).setOrigin(0.5).setDepth(DEPTH.hud + 1);
      this.powerIcons.push(label);
      this.iconRects.push({ id, x, y, r });
    });
  }

  activatePower(id) {
    if (this.phase !== 'battle' || this.paused) return;
    const def = BOSS_POWERS[id];
    if (!this.friendIds.includes(id) || (this.cooldown[id] || 0) > 0) return;
    this.cooldown[id] = def.cd;
    if (id === 'musgo') this.shield = true;
    if (id === 'duna') this.doubleNext = true;
    if (id === 'escarcha') this.freeze = def.time;
    if (id === 'luna') this.vision = def.time;
    if (id === 'brasa') {
      const keep = Math.max(3, Math.ceil(this.boss.length * (1 - def.cut)));
      this.boss.splice(keep).forEach((c) => { this.burst.setParticleTint(0xe2512f); this.burst.explode(4, c.x * CELL + CELL / 2, c.y * CELL + CELL / 2); });
    }
    beep(this, 330, 0.2, 'triangle', 990);
    this.showToast(def.name + ': ' + def.desc, 2000);
  }

  // ---------- Dibujo ----------

  // La mega serpiente: relieve como la de Inti, pero oscura y con ojos rojos
  drawBoss(g, cells, dir, retreat, freeze) {
    cells.forEach((c) => drawSegmentShadow(g, c));
    for (let i = cells.length - 1; i >= 0; i--) {
      const t = cells.length > 1 ? i / (cells.length - 1) : 0;
      const color = Phaser.Display.Color.GetColor(
        Math.round(Phaser.Math.Linear(0x8a, 0x2d, t)), Math.round(Phaser.Math.Linear(0x25, 0x0f, t)), Math.round(Phaser.Math.Linear(0x45, 0x23, t)));
      drawSegment(g, cells[i], i % 3 === 0 ? shade(color, 0.15) : color, 0, 1);
    }
    const h = cells[0];
    const cx = h.x * CELL + CELL / 2, cy = h.y * CELL + CELL / 2 - 2;
    g.lineStyle(1.5, 0xff6a6a, 0.8);
    g.strokeRoundedRect(h.x * CELL + 1, h.y * CELL + 1, CELL - 2, CELL - 6, 6);
    for (const side of [-1, 1]) {
      const ex = cx + dir.x * 3 - dir.y * side * 4, ey = cy + dir.y * 3 + dir.x * side * 4;
      g.fillStyle(0xff4040);
      g.fillCircle(ex, ey, 3.2);
      g.fillStyle(0x2a0a0a);
      if (dir.x !== 0) g.fillEllipse(ex + dir.x * 0.5, ey, 3.2, 1.2); else g.fillEllipse(ex, ey + dir.y * 0.5, 1.2, 3.2);
    }
    if (freeze > 0) {
      g.lineStyle(3, 0x9fd8f0, 0.9);
      g.strokeCircle(cx, cy + 2, 14);
    }
  }

  drawAll(time) {
    // la mega serpiente se ve con un pulso suave mientras se aleja (sin destellos)
    this.bossG.clear();
    this.bossG.setAlpha(this.retreat > 0 ? 0.55 + 0.35 * Math.sin(time * 0.012) : 1);
    this.drawBoss(this.bossG, this.boss, this.bdir, this.retreat, this.freeze);

    this.playerG.clear();
    this.playerG.setAlpha(this.pInvuln > 0 ? 0.7 + 0.3 * Math.sin(time * 0.012) : 1);
    drawSnake(this.playerG, this.player, this.pdir, this.shield, 5, this.friendColors);
    const h = this.player[0];
    this.rider.setPosition(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2 - 4);
    this.rider.setAlpha(this.playerG.alpha);

    // la visión de Luna marca las próximas celdas de la mega serpiente
    this.visionG.clear();
    if (this.vision > 0) {
      bossPredict(this.boss, this.bdir, this.player[0], BOSS_POWERS.luna.cells).forEach((c, i) => {
        this.visionG.fillStyle(0x7da0ff, 0.55 - i * 0.05);
        this.visionG.fillRoundedRect(c.x * CELL + 3, c.y * CELL + 3, CELL - 6, CELL - 6, 5);
        this.visionG.lineStyle(1.5, 0xdfe8ff, 0.8);
        this.visionG.strokeRoundedRect(c.x * CELL + 3, c.y * CELL + 3, CELL - 6, CELL - 6, 5);
      });
    }
    this.drawHud();
  }

  drawHud() {
    const g = this.hudG;
    g.clear();
    // vida de la mega serpiente: BOSS.hits barras
    const w = 64, gap = 6, total = BOSS.hits * w + (BOSS.hits - 1) * gap;
    for (let i = 0; i < BOSS.hits; i++) {
      const x = 400 - total / 2 + i * (w + gap);
      const alive = i < BOSS.hits - this.hits;
      g.fillStyle(PAL.bg, 0.85);
      g.fillRoundedRect(x - 2, 8, w + 4, 22, 6);
      g.fillStyle(alive ? 0xc23a5a : PAL.line, alive ? 1 : 0.5);
      g.fillRoundedRect(x, 10, w, 18, 5);
      if (alive) { g.fillStyle(0xff8aa0, 0.45); g.fillRoundedRect(x + 3, 12, w - 6, 5, 3); }
    }
    // íconos de los poderes, con la recarga como un cuarto que se apaga
    this.iconRects.forEach(({ id, x, y, r }) => {
      const cd = this.cooldown ? (this.cooldown[id] || 0) : 0;
      const ready = cd <= 0;
      const color = FRIENDS[id].color;
      g.fillStyle(PAL.bg, 0.88);
      g.fillCircle(x, y, r + 3);
      g.fillStyle(color, ready ? 1 : 0.5);
      g.fillCircle(x, y, r);
      g.lineStyle(3, ready ? PAL.goldLight : PAL.line);
      g.strokeCircle(x, y, r);
      this.drawGlyph(g, id, x, y);
      if (!ready) {
        const frac = cd / BOSS_POWERS[id].cd;
        g.fillStyle(0x000000, 0.55);
        g.slice(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false);
        g.fillPath();
      }
      if (this.isActive(id)) {
        g.lineStyle(3, PAL.gold);
        g.strokeCircle(x, y, r + 5);
      }
    });
  }

  isActive(id) {
    return (id === 'musgo' && this.shield) || (id === 'duna' && this.doubleNext) || (id === 'escarcha' && this.freeze > 0) || (id === 'luna' && this.vision > 0);
  }

  // Un dibujo sencillo para cada poder
  drawGlyph(g, id, x, y) {
    const dark = 0x1a1204;
    g.lineStyle(3, dark);
    g.fillStyle(0xefe6d2);
    if (id === 'musgo') {          // escudo
      const pts = [[0, -13], [11, -8], [9, 6], [0, 14], [-9, 6], [-11, -8]].map(([a, b]) => ({ x: x + a, y: y + b }));
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
    } else if (id === 'duna') {    // dos puntos: "x2"
      g.lineBetween(x - 11, y - 7, x - 3, y + 7); g.lineBetween(x - 3, y - 7, x - 11, y + 7);
      g.fillStyle(dark); g.fillCircle(x + 6, y - 5, 2.4); g.fillRect(x + 2, y + 2, 9, 3.4);
    } else if (id === 'escarcha') { // copo de nieve
      for (let k = 0; k < 3; k++) {
        const a = (Math.PI / 3) * k;
        g.lineBetween(x - Math.cos(a) * 13, y - Math.sin(a) * 13, x + Math.cos(a) * 13, y + Math.sin(a) * 13);
      }
    } else if (id === 'brasa') {   // tijeras
      g.lineBetween(x - 11, y - 11, x + 9, y + 9); g.lineBetween(x - 11, y + 11, x + 9, y - 9);
      g.strokeCircle(x + 10, y + 11, 3.5); g.strokeCircle(x + 10, y - 11, 3.5);
    } else {                        // ojo
      g.strokeEllipse(x, y, 28, 16);
      g.fillStyle(dark); g.fillCircle(x, y, 4);
    }
  }

  // ---------- Controles ----------

  handleKey(code) {
    if (this.phase === 'lose') {
      if (code === 'Space' || code === 'Enter') this.scene.restart({ skipIntro: true });
      else if (code === 'KeyM') this.scene.start('MenuScene');
      return;
    }
    if (debugKey(this, code)) return;
    if (this.phase === 'intro') { if (code === 'Space' || code === 'Enter') this.endIntro(); return; }
    if (this.phase !== 'battle') return;
    if (code === 'KeyP' || code === 'Escape') return this.togglePause();
    const power = Object.keys(BOSS_POWERS).find((id) => code === 'Digit' + BOSS_POWERS[id].key || code === 'Numpad' + BOSS_POWERS[id].key);
    if (power) return this.activatePower(power);
    const d = DIRS[code];
    if (d && !this.paused) this.turn(d);
  }

  turn(d) {
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.pdir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (this.queue.length < 2) this.queue.push(d);
  }

  togglePause() {
    this.paused = !this.paused;
    this.pauseLayer.setVisible(this.paused);
    if (this.paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
  }

  onDown(x, y) {
    this.tapped = false;
    if (this.phase === 'intro') { this.endIntro(); this.tapped = true; return; }
    if (this.phase === 'lose') { this.scene.restart({ skipIntro: true }); return; }
    if (this.phase !== 'battle') return;
    const hit = this.iconRects.find((i) => Math.hypot(x - i.x, y - i.y) <= i.r + 8);
    if (hit) { this.tapped = true; this.activatePower(hit.id); }
  }

  onUp(p) {
    if (this.phase !== 'battle' || this.tapped || this.paused) return;
    const dx = p.upX - p.downX, dy = p.upY - p.downY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    this.turn(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  }

  // ---------- Avisos ----------

  showToast(text, ms) {
    if (this.toast) this.toast.destroy();
    this.toast = this.add.text(400, 66, text, { ...TEXT, fontSize: '15px', color: CSS.goldLight, backgroundColor: 'rgba(11,20,16,0.82)', padding: { x: 10, y: 4 }, align: 'center', wordWrap: { width: 700 } })
      .setOrigin(0.5, 0).setDepth(DEPTH.hud);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: ms, duration: 500, onComplete: () => { if (this.toast) { this.toast.destroy(); this.toast = null; } } });
  }

  floatText(x, y, text, color) {
    x = Phaser.Math.Clamp(x, 80, 720);
    const label = this.add.text(x, y, text, { ...TEXT, fontSize: '18px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(DEPTH.fx);
    this.tweens.add({ targets: label, y: y - 40, alpha: 0, duration: 800, onComplete: () => label.destroy() });
  }

  // ---------- Final de la batalla ----------

  // Derrota: la serpiente envuelve a Inti. Se puede reintentar sin repetir el puzzle.
  lose() {
    if (this.phase !== 'battle') return;
    this.phase = 'lose';
    this.cameras.main.shake(250, 0.01);
    beep(this, 300, 0.5, 'sawtooth', 60);
    this.playerG.setAlpha(1);
    const h = this.player[0];
    const over = (o) => o.setDepth(DEPTH.overlay);
    over(this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg, 0.78));
    over(this.add.text(400, 215, BOSS_TEXT.defeat, { ...TITLE, fontSize: '36px', align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5));
    over(this.add.text(400, 285, BOSS_TEXT.defeatSub, { ...TEXT, fontSize: '22px', color: CSS.scale }).setOrigin(0.5));
    over(this.add.text(400, 370, BOSS_TEXT.retry, { ...TEXT, fontSize: '18px', color: PAL.muted }).setOrigin(0.5));
    this.burst.setParticleTint(PAL.red);
    this.burst.explode(20, h.x * CELL + CELL / 2, h.y * CELL + CELL / 2);
  }

  // Victoria: la mega serpiente se deshace y la forma humana de Inti queda fija
  win() {
    if (this.phase !== 'battle') return;
    this.phase = 'win';
    if (!this.testRun) { GameState.stage = 'ending'; GameState.save(); }
    [392, 523, 659, 784, 1046].forEach((f, i) => this.time.delayedCall(i * 140, () => beep(this, f, 0.3, 'triangle')));
    // los segmentos se apagan uno tras otro
    this.boss.forEach((c, i) => this.time.delayedCall(i * 70, () => {
      this.burst.setParticleTint(i % 2 ? PAL.gold : 0xc23a5a);
      this.burst.explode(5, c.x * CELL + CELL / 2, c.y * CELL + CELL / 2);
    }));
    this.tweens.add({ targets: this.bossG, alpha: 0, duration: 1600 });
    this.visionG.clear();
    const t = this.add.text(400, 250, BOSS_TEXT.win, { ...TITLE, fontSize: '34px', align: 'center', stroke: '#0b1410', strokeThickness: 6, wordWrap: { width: 720 } }).setOrigin(0.5).setDepth(DEPTH.overlay).setAlpha(0);
    const s = this.add.text(400, 310, BOSS_TEXT.winSub, { ...TEXT, fontSize: '20px', color: CSS.goldLight, stroke: '#0b1410', strokeThickness: 5, align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5).setDepth(DEPTH.overlay).setAlpha(0);
    this.tweens.add({ targets: [t, s], alpha: 1, duration: 800, delay: 600 });
    this.time.delayedCall(4200, () => this.leave());
  }

  // Lo que sigue son los finales (E3). Mientras no existan: un texto y el menú.
  leave() {
    this.cameras.main.fadeOut(600, 11, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.testRun) return this.scene.start('MenuScene');
      if (this.scene.manager.keys.EndingScene) return this.scene.start('EndingScene');
      this.scene.start('StoryScene', {
        pages: [
          { art: 'fruta_origen', text: 'Inti venció a la mega serpiente y su forma humana quedó fija.' },
          { speaker: 'La guardiana', text: '«¿Vuelves a casa o te quedas a cuidar de ellos?» (los finales llegarán pronto)' }
        ],
        next: 'MenuScene'
      });
    });
  }
}

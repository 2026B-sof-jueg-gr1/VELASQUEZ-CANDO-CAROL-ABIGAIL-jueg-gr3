class SnakeScene extends Phaser.Scene {
  constructor() {
    super('SnakeScene');
  }

  create() {
    frameCamera(this);
    this.snake = this.startSnake();
    this.dir = { x: 1, y: 0 };
    this.queue = [];
    this.score = 0;
    this.best = loadBest();
    this.stepDelay = 120; // ms entre pasos, baja al comer
    this.acc = 0;
    this.dead = false;
    this.paused = false;
    this.busy = false;               // true durante la muda y el espejo: el juego se detiene
    this.applesSinceMaterial = 0;    // manzanas comidas desde el último material
    this.material = null;            // material que está en el tablero
    this.fruit = null;               // Fruta del Origen que está en el tablero
    this.power = null;               // poder que está en el tablero
    this.powerCooldown = 5000;       // ms hasta intentar sacar otro poder
    this.effects = { slow: 0, double: 0, shield: false };
    this.invuln = 0;                 // ms de invulnerabilidad después de gastar el escudo
    this.grace = 0;                  // ms de gracia después de cruzar un borde: la cabeza ignora a los enemigos
    this.applesLevel = 0;            // manzanas comidas en este intento del nivel (suben el máximo de enemigos)

    makeTextures(this);
    this.scenario = createScenario(this, GameState.current().scenario);
    // Bordes, piedras y marco de esta tierra
    this.world = new World(GameState.level - 1);
    this.visuals = createWorldVisuals(this, this.world);
    this.enemies = new EnemyDirector(this);
    this.graceRing = this.add.graphics().setDepth(DEPTH.fx).setVisible(false);
    this.graceRing.fillStyle(PAL.gold, 0.16);
    this.graceRing.fillCircle(0, 0, 17);
    this.graceRing.lineStyle(3, PAL.gold, 0.9);
    this.graceRing.strokeCircle(0, 0, 17);
    this.overlay = null;
    if (DEBUG && !this.world.report.ok) this.world.report.problems.forEach((t) => console.warn('[Mapa ' + this.world.name + '] ' + t));

    this.foodGfx = this.add.graphics().setDepth(DEPTH.items);
    drawApple(this.foodGfx);
    this.tweens.add({ targets: this.foodGfx, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });

    this.materialGfx = this.add.graphics().setVisible(false).setDepth(DEPTH.items);
    this.tweens.add({ targets: this.materialGfx, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });

    this.fruitGfx = this.add.graphics().setVisible(false).setDepth(DEPTH.items);
    drawOriginFruit(this.fruitGfx);
    this.tweens.add({ targets: this.fruitGfx, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });
    this.fruitGlow = null;
    this.fruitLabel = this.add.text(0, 0, '', {
      ...TEXT, fontSize: '20px', fontStyle: '800', color: CSS.goldLight, stroke: '#0b1410', strokeThickness: 4
    }).setOrigin(0.5).setDepth(DEPTH.fx).setVisible(false);

    this.gfx = this.add.graphics().setDepth(DEPTH.snake);
    const burst = (tint, speed, lifespan) => this.add.particles(0, 0, 'dot', {
      speed, lifespan, scale: { start: 1, end: 0 }, tint, emitting: false
    }).setDepth(DEPTH.fx);
    this.appleBurst = burst(PAL.red, { min: 60, max: 200 }, 450);
    this.starBurst = burst(PAL.gold, { min: 80, max: 260 }, 600);
    this.powerBurst = burst(0xffffff, { min: 80, max: 220 }, 500);
    this.cutBurst = burst(PAL.scale, { min: 40, max: 140 }, 400);
    this.shedBurst = burst(0xcfe0b8, { min: 30, max: 130 }, 900);

    this.food = this.spawnFood();
    this.placeAt(this.foodGfx, this.food);

    this.scoreText = this.add.text(10, 8, 'Puntos: 0', HUD_STYLE).setDepth(DEPTH.hud);
    this.levelText = this.add.text(400, 8, '', HUD_STYLE).setOrigin(0.5, 0).setDepth(DEPTH.hud);
    this.bestText = this.add.text(790, 8, 'Récord: ' + this.best, HUD_STYLE).setOrigin(1, 0).setDepth(DEPTH.hud);
    this.effectsText = this.add.text(10, 592, '', HUD_STYLE).setOrigin(0, 1).setDepth(DEPTH.hud).setVisible(false);
    // Los 3 espacios de materiales, arriba a la derecha
    this.slots = [0, 1, 2].map((i) => this.add.graphics({ x: 702 + i * 32, y: 58 }).setDepth(DEPTH.hud));
    this.updateLevelText();
    this.drawSlots();

    this.pauseLayer = this.add.container(0, 0, [
      this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg, 0.65),
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

    this.cameras.main.fadeIn(450, 11, 20, 16);
    this.showBanner('Nivel ' + GameState.level + ' · ' + this.scenario.name);

    // Si moriste con los 3 materiales, la Fruta del Origen vuelve a aparecer al reintentar
    if (GameState.materials >= 3) this.spawnFruit();
    this.draw();
  }

  startSnake() {
    return [{ x: 20, y: 15 }, { x: 19, y: 15 }, { x: 18, y: 15 }];
  }

  handleKey(code) {
    if (debugKey(this, code)) return;
    if (code === 'KeyP' || code === 'Escape') return this.togglePause();
    const d = DIRS[code];
    if (d) this.turn(d);
  }

  turn(d) {
    if (this.dead || this.paused || this.busy) return;
    // Comparar con la última dirección encolada para no dar media vuelta
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (this.queue.length < 2) this.queue.push(d);
  }

  togglePause() {
    if (this.dead || this.busy) return;
    this.paused = !this.paused;
    this.pauseLayer.setVisible(this.paused);
    // Detiene también los temporizadores y las animaciones
    this.time.paused = this.paused;
    if (this.paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
  }

  update(time, delta) {
    if (this.dead || this.paused || this.busy) return;
    this.updatePowers(delta);
    this.updateFruit(delta);
    this.updateInvuln(delta, time);
    this.enemies.update(delta);
    this.acc += delta;
    // Con el poder Lento cada paso tarda más
    const delay = this.effects.slow > 0 ? this.stepDelay * SLOW_FACTOR : this.stepDelay;
    while (this.acc >= delay && !this.dead && !this.busy) {
      this.acc -= delay;
      this.step();
    }
  }

  // Pulso suave (menos de 2 veces por segundo, sin destellos) mientras dura la invulnerabilidad
  updateInvuln(delta, time) {
    // Gracia tras cruzar un borde: un aro dorado suave sigue a la cabeza mientras dura
    if (this.grace > 0) {
      this.grace = Math.max(0, this.grace - delta);
      const h = this.snake[0];
      this.graceRing.setPosition(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2).setAlpha(0.25 + 0.75 * this.grace / GRACE_MS).setVisible(this.grace > 0);
    } else if (this.graceRing.visible) {
      this.graceRing.setVisible(false);
    }
    if (this.invuln > 0) {
      this.invuln = Math.max(0, this.invuln - delta);
      this.gfx.setAlpha(this.invuln > 0 ? 0.7 + 0.3 * Math.sin(time * 0.012) : 1);
    } else if (this.gfx.alpha !== 1) {
      this.gfx.setAlpha(1);
    }
  }

  step() {
    if (this.queue.length) this.dir = this.queue.shift();

    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    // Qué hay en la celda de destino: piedra, borde cerrado, un cruce de borde o el cuerpo
    const next = this.world.resolve(head.x, head.y);
    let entry = next.cell;
    if (next.hit === 'border') {
      // Borde cerrado: con escudo (o con la invulnerabilidad) sale por el lado opuesto, como siempre
      if (this.invuln <= 0 && !this.useShield()) return this.gameOver();
      entry = { x: (head.x + COLS) % COLS, y: (head.y + ROWS) % ROWS };
    } else if (next.hit === 'rock') {
      if (this.invuln <= 0 && !this.useShield('rock')) return this.gameOver();
    } else if (next.crossed) {
      this.crossGlow(entry);
      this.grace = GRACE_MS;
    }
    head.x = entry.x;
    head.y = entry.y;

    const at = (c) => c && head.x === c.x && head.y === c.y;
    const eatsApple = at(this.food);
    const eatsMaterial = at(this.material);
    const eatsFruit = at(this.fruit);
    const takesPower = at(this.power);
    // Solo la manzana alarga la serpiente
    // Si no come, la cola se mueve, así que esa celda queda libre
    const body = eatsApple ? this.snake : this.snake.slice(0, -1);
    if (body.some((s) => s.x === head.x && s.y === head.y)) {
      if (this.invuln <= 0 && !this.useShield('body')) return this.gameOver();
    }
    // Un enemigo en la celda de destino: solo cuenta la cabeza
    if (this.enemies.hitAt(head.x, head.y) && !this.enemyHit()) return this.gameOver();
    // Mientras la cabeza está dentro de una piedra no se acaba la invulnerabilidad
    if (this.world.isRock(head.x, head.y)) this.invuln = Math.max(this.invuln, 300);

    this.snake.unshift(head);

    if (takesPower) this.collectPower();
    if (eatsMaterial) this.collectMaterial();

    if (eatsFruit) {
      this.eatFruit(); // la muda reinicia la serpiente
      return;
    }

    if (eatsApple) {
      this.addPoints(10, this.food, this.appleBurst, '#ff7675');
      beep(this, 660, 0.08, 'square', 990);
      this.stepDelay = Math.max(60, this.stepDelay - 3);
      this.applesSinceMaterial++;
      this.applesLevel++;
      this.food = this.spawnFood();
      if (!this.food) return this.gameOver(true);
      this.placeAt(this.foodGfx, this.food);
      // Cada MATERIAL_EVERY manzanas aparece el siguiente material de la tierra
      if (this.applesSinceMaterial >= MATERIAL_EVERY) this.spawnMaterial();
    }

    if (!eatsApple) this.snake.pop();

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
  }

  floatText(x, y, text, color) {
    x = Phaser.Math.Clamp(x, 80, 720); // que el texto no se corte en los bordes
    const label = this.add.text(x, y, text, {
      ...TEXT, fontSize: '18px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(DEPTH.fx);
    this.tweens.add({ targets: label, y: y - 40, alpha: 0, duration: 800, onComplete: () => label.destroy() });
  }

  // ---------- Materiales ----------

  // Dibuja los 3 espacios: vacíos o con el material que ya tienes
  drawSlots() {
    const mats = GameState.current().materials;
    this.slots.forEach((g, i) => {
      const filled = i < GameState.materials;
      g.clear();
      g.fillStyle(PAL.bg, 0.82);
      g.fillCircle(0, 0, 16);
      g.lineStyle(2, filled ? PAL.gold : PAL.line, filled ? 1 : 0.9);
      g.strokeCircle(0, 0, 16);
      if (filled) {
        drawMaterial(g, mats[i].shape, mats[i].color);
      } else {
        g.fillStyle(PAL.line, 0.8);
        g.fillCircle(0, 0, 3);
      }
    });
  }

  spawnMaterial() {
    if (this.material || this.fruit || GameState.materials >= 3) return;
    const free = this.freeCells();
    if (!free.length) return;
    const cell = Phaser.Utils.Array.GetRandom(free);
    const def = GameState.current().materials[GameState.materials];
    this.material = { ...cell, def };
    this.applesSinceMaterial = 0;
    this.materialGfx.clear();
    drawMaterial(this.materialGfx, def.shape, def.color);
    this.placeAt(this.materialGfx, cell);
    this.materialGfx.setVisible(true);
    this.floatText(cell.x * CELL + CELL / 2, cell.y * CELL, def.name, CSS.goldLight);
  }

  removeMaterial() {
    this.material = null;
    this.materialGfx.setVisible(false);
  }

  collectMaterial() {
    const { def } = this.material;
    this.addPoints(20, this.material, this.starBurst, CSS.gold);
    beep(this, 440, 0.12, 'triangle', 880);
    this.removeMaterial();
    GameState.materials++;
    GameState.save();
    this.drawSlots();
    const slot = this.slots[GameState.materials - 1];
    this.tweens.add({ targets: slot, scale: 1.4, duration: 150, yoyo: true });
    if (GameState.materials >= 3) this.spawnFruit();
    else this.floatText(this.snake[0].x * CELL + CELL / 2, this.snake[0].y * CELL - 14, def.name + ' ' + GameState.materials + '/3', CSS.goldLight);
  }

  // ---------- La Fruta del Origen ----------

  // Aparece a 1 o 2 celdas libres de una piedra o de un borde, siempre en una casilla alcanzable
  spawnFruit() {
    if (this.fruit) return;
    const free = this.freeCells();
    if (!free.length) return;
    const near = free.filter((c) => this.world.fruitCells.some((f) => f.x === c.x && f.y === c.y) && !this.enemies.near(c.x, c.y, 2));
    const cell = Phaser.Utils.Array.GetRandom(near.length ? near : free);
    this.fruit = { ...cell, life: FRUIT_TIME };

    this.placeAt(this.fruitGfx, cell);
    this.fruitGfx.setVisible(true).setAlpha(1);
    const px = cell.x * CELL + CELL / 2, py = cell.y * CELL + CELL / 2;
    this.fruitGlow = this.add.particles(px, py, 'dot', {
      speed: { min: 15, max: 50 }, lifespan: 900, scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 }, tint: PAL.gold, frequency: 80, blendMode: 'ADD'
    }).setDepth(DEPTH.items);
    this.fruitLabel.setPosition(px, py < 70 ? py + 30 : py - 30).setText(String(Math.ceil(FRUIT_TIME / 1000))).setVisible(true);

    this.floatText(px, py - 18, '¡Fruta del Origen!', CSS.gold);
    beep(this, 392, 0.3, 'sine', 988);
  }

  removeFruit() {
    this.fruit = null;
    this.fruitGfx.setVisible(false);
    this.fruitLabel.setVisible(false);
    if (this.fruitGlow) { this.fruitGlow.destroy(); this.fruitGlow = null; }
  }

  updateFruit(delta) {
    if (!this.fruit) return;
    this.fruit.life -= delta;
    this.fruitLabel.setText(String(Math.max(0, Math.ceil(this.fruit.life / 1000))));
    // Se va apagando en los últimos 2 segundos (sin parpadeos)
    this.fruitGfx.setAlpha(Math.min(1, 0.3 + this.fruit.life / 2000));
    if (this.fruit.life <= 0) this.witherFruit();
  }

  // Si se marchita, pierdes 1 material y hay que juntarlo otra vez
  witherFruit() {
    const px = this.fruit.x * CELL + CELL / 2, py = this.fruit.y * CELL + CELL / 2;
    this.removeFruit();
    GameState.materials = Math.max(0, GameState.materials - 1);
    GameState.save();
    this.drawSlots();
    this.applesSinceMaterial = 0;
    this.floatText(px, py, 'Se marchitó: −1 material', '#f0704d');
    beep(this, 300, 0.4, 'sawtooth', 90);
  }

  // Al comer la fruta: muda de piel, espejo y siguiente tierra
  eatFruit() {
    this.addPoints(50, this.fruit, this.starBurst, CSS.gold);
    beep(this, 520, 0.25, 'triangle', 1560);
    this.removeFruit();
    this.removeMaterial();
    this.removePower();
    this.enemies.clear();
    this.busy = true;
    this.shedSkin();
    this.time.delayedCall(700, () => this.playMirror(() => this.goToMemory()));
  }

  // La piel vieja se desprende y cae; la serpiente vuelve a empezar con 3 segmentos
  shedSkin() {
    const skin = this.add.graphics().setDepth(DEPTH.fx).setAlpha(0.75);
    drawSnake(skin, this.snake, this.dir, false, GameState.level);
    this.tweens.add({ targets: skin, y: 18, alpha: 0, duration: 1000, onComplete: () => skin.destroy() });
    this.snake.forEach((s) => this.shedBurst.explode(3, s.x * CELL + CELL / 2, s.y * CELL + CELL / 2));
    [660, 520, 400].forEach((f, i) => this.time.delayedCall(i * 120, () => beep(this, f, 0.2, 'triangle', f / 2)));

    this.snake = this.startSnake();
    this.dir = { x: 1, y: 0 };
    this.queue = [];
    this.stepDelay = 120;
    this.acc = 0;
    this.invuln = 0;
    this.gfx.setVisible(false);
  }

  // El espejo: el reflejo de la serpiente y, por un instante, una silueta humana.
  // Cuanto más avanzas, más tiempo (de 0,1 s a 0,6 s) y más nítida se ve.
  playMirror(onDone) {
    const stage = GameState.level;
    const hold = 100 + (stage - 1) * 125;
    const peak = 0.3 + stage * 0.1;
    const cx = 400, cy = 270;

    const layer = this.add.container(0, 0).setDepth(DEPTH.overlay).setAlpha(0);
    const dim = this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg, 0.92);
    const glass = this.add.graphics({ x: cx, y: cy });
    glass.fillStyle(0x0f1d17);
    glass.fillEllipse(0, 0, 240, 320);
    const reflection = this.add.graphics({ x: cx, y: cy });
    drawMirrorSnake(reflection, stage);
    const human = this.add.graphics({ x: cx, y: cy }).setAlpha(0);
    drawMirrorHuman(human);
    const maskShape = this.make.graphics({ x: cx, y: cy, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillEllipse(0, 0, 236, 316);
    const mask = maskShape.createGeometryMask();
    reflection.setMask(mask);
    human.setMask(mask);
    const frame = this.add.graphics({ x: cx, y: cy });
    frame.lineStyle(7, PAL.gold);
    frame.strokeEllipse(0, 0, 244, 324);
    frame.lineStyle(2, PAL.goldDark, 0.8);
    frame.strokeEllipse(0, 0, 260, 340);
    const title = this.add.text(400, 478, 'Muda de piel', { ...TITLE, fontSize: '30px', fontStyle: '700' }).setOrigin(0.5);
    const sub = this.add.text(400, 516, LEVELS[stage - 1].name + ' superada', { ...TEXT, fontSize: '18px', color: PAL.muted }).setOrigin(0.5);
    layer.add([dim, glass, reflection, human, frame, title, sub]);

    const finish = onDone;
    this.tweens.add({
      targets: layer, alpha: 1, duration: 450,
      onComplete: () => this.time.delayedCall(550, () => {
        this.tweens.add({
          targets: human, alpha: peak, duration: 140,
          onComplete: () => this.time.delayedCall(hold, () => {
            this.tweens.add({
              targets: human, alpha: 0, duration: 260,
              onComplete: () => this.time.delayedCall(500, finish)
            });
          })
        });
      })
    });
  }

  // Después del espejo viene la cámara del recuerdo de esta tierra. Al resolverla se pasa a la siguiente.
  goToMemory() {
    this.cameras.main.fadeOut(500, 11, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MemoryRingScene', { memory: GameState.current().memory, rings: ringsForLevel(GameState.level), after: 'fruit' });
    });
  }

  // ---------- Escenarios ----------

  // Atajos del modo debug (teclas N y M)
  debugNextLevel() {
    if (this.busy || this.dead) return;
    if (GameState.level >= LEVELS.length) return debugToast(this, 'Debug: ya estás en la última tierra');
    GameState.level++;
    GameState.materials = 0;
    GameState.save();
    this.scene.restart();
  }

  // Debug E: saca un enemigo ya, sin esperar ni respetar el máximo
  debugEnemy() {
    if (this.busy || this.dead) return;
    const ok = this.enemies.spawn(true);
    debugToast(this, ok ? 'Debug: ' + this.enemies.def.name : 'Debug: no hay casilla válida');
  }

  // Debug L: pinta aterrizaje (azul), trampas (rojo), zona de salida (amarillo) y casillas de aparición (verde)
  debugOverlay() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
      return debugToast(this, 'Debug: capas ocultas');
    }
    const g = this.add.graphics().setDepth(DEPTH.fx - 0.5);
    const w = this.world;
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (w.isRock(x, y)) continue;
        const k = x + ',' + y;
        let color = 0, a = 0;
        if (w.traps.has(k)) { color = 0xff3030; a = 0.55; }
        else if (w.inSpawnZone(x, y)) { color = 0xffe14a; a = 0.35; }
        else if (w.landing.has(k)) { color = 0x3d8bff; a = 0.28; }
        else if (w.spawnSet.has(k)) { color = 0x3ddc84; a = 0.2; }
        if (a) { g.fillStyle(color, a); g.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2); }
      }
    }
    this.overlay = g;
    debugToast(this, 'L: azul aterrizaje · amarillo salida · rojo trampa · verde aparición');
  }

  debugMaterials() {
    if (this.busy || this.dead) return;
    this.removeMaterial();
    GameState.materials = 3;
    GameState.save();
    this.drawSlots();
    this.spawnFruit();
    debugToast(this, 'Debug: 3 materiales');
  }

  updateLevelText() {
    this.levelText.setText('Nivel ' + GameState.level + ' · ' + this.scenario.name);
  }

  showBanner(text) {
    const t = this.add.text(400, 300, text, {
      ...TEXT, fontSize: '38px', fontStyle: '800', color: CSS.gold, stroke: '#0b1410', strokeThickness: 8
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

  // Un enemigo toca la cabeza. Devuelve true si la serpiente sobrevive (gracia, invulnerabilidad o escudo).
  enemyHit() {
    if (this.invuln > 0 || this.grace > 0) return true;
    return this.useShield('enemy');
  }

  // El escudo absorbe cualquier golpe y se gasta. Al pasar una piedra o el cuerpo, la serpiente
  // queda invulnerable 1 segundo (con un pulso suave) para no morir en el paso siguiente.
  useShield() {
    if (!this.effects.shield) return false;
    this.effects.shield = false;
    this.invuln = 1000;
    this.cameras.main.shake(120, 0.005);
    beep(this, 880, 0.2, 'sine', 220);
    const h = this.snake[0];
    this.floatText(h.x * CELL + CELL / 2, h.y * CELL, '¡Escudo!', CSS.gold);
    return true;
  }

  // Un destello dorado corto donde la serpiente reaparece al cruzar un borde abierto
  crossGlow(cell) {
    const g = this.add.graphics({ x: cell.x * CELL + CELL / 2, y: cell.y * CELL + CELL / 2 }).setDepth(DEPTH.fx);
    g.fillStyle(PAL.gold, 0.5);
    g.fillCircle(0, 0, 12);
    this.tweens.add({ targets: g, alpha: 0, scale: 2.2, duration: 450, onComplete: () => g.destroy() });
  }

  // ---------- Comida ----------

  freeCells() {
    const at = (c, x, y) => c && c.x === x && c.y === y;
    const free = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (this.world.isRock(x, y) || this.world.isTrap(x, y)) continue;
        if (this.enemies.near(x, y, 0)) continue;
        if (this.snake.some((s) => s.x === x && s.y === y)) continue;
        if (at(this.food, x, y) || at(this.material, x, y) || at(this.fruit, x, y) || at(this.power, x, y)) continue;
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

  draw() {
    this.gfx.clear();
    drawSnake(this.gfx, this.snake, this.dir, this.effects.shield, GameState.level);
  }

  gameOver(won = false, note = '') {
    this.dead = true;
    // Los materiales de este nivel se conservan (ya están guardados en GameState)
    this.removeMaterial();
    this.removeFruit();
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
    over(this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg, 0.78));
    over(this.add.text(400, 230, won ? '¡Ganaste!' : 'Game Over', {
      ...TITLE, fontSize: '56px'
    }).setOrigin(0.5));
    over(this.add.text(400, 300, 'Puntos: ' + this.score + '   ·   Nivel ' + GameState.level, {
      ...TEXT, fontSize: '24px', color: CSS.scale
    }).setOrigin(0.5));
    if (note) {
      over(this.add.text(400, 345, note, { ...TEXT, fontSize: '18px', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5));
    }
    if (newRecord && this.score > 0) {
      const rec = over(this.add.text(400, note ? 385 : 345, '¡Nuevo récord!', {
        ...TEXT, fontSize: '22px', fontStyle: '700', color: CSS.goldLight
      }).setOrigin(0.5).setScale(0));
      this.tweens.add({ targets: rec, scale: 1, duration: 400, ease: 'Back.Out' });
    }
    over(this.add.text(400, 440, 'ESPACIO o toca: reintentar   ·   M: menú', {
      ...TEXT, fontSize: '18px', color: PAL.muted
    }).setOrigin(0.5));

    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));
    this.input.once('pointerdown', () => this.scene.restart());
  }
}

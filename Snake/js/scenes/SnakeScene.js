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
    // El nivel de partida (GameState.level va de 1 a 5) manda en qué tierra empezamos
    this.startLevel = GameState.level - 1;
    this.level = this.startLevel;
    this.power = null;               // poder que está en el tablero
    this.powerCooldown = 5000;       // ms hasta intentar sacar otro poder
    this.effects = { slow: 0, double: 0, shield: false };

    makeTextures(this);
    this.scenario = createScenario(this, LEVELS[this.startLevel].scenario);

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
    if (debugKey(this, code)) return;
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
    const level = this.startLevel + Math.floor(this.score / LEVEL_POINTS);
    if (level === this.level) return;
    this.setLevel(level);
  }

  // Cambia de nivel y guarda la partida (así "Continuar" retoma en esta tierra)
  setLevel(level) {
    this.level = level;
    GameState.level = (level % LEVELS.length) + 1;
    GameState.materials = 0;
    GameState.save();
    this.changeScenario(LEVELS[GameState.level - 1].scenario);
  }

  // Atajo del modo debug (tecla N)
  debugNextLevel() {
    this.setLevel(this.level + 1);
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

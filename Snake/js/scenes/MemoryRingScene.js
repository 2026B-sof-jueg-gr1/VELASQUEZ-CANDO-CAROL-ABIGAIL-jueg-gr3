// La cámara del recuerdo: la imagen está partida en anillos concéntricos, cada uno girado.
// Hay que girarlos hasta que la imagen encaje. No se puede perder ni saltar.
// Recibe { memory: 'id', rings: 2 a 4, after: 'fruit' | 'debug' }.
class MemoryRingScene extends Phaser.Scene {
  constructor() {
    super('MemoryRingScene');
  }

  init(data) {
    this.cfg = data || {};
  }

  create() {
    frameCamera(this);
    this.cameras.main.fadeIn(500, 11, 20, 16);
    const id = this.cfg.memory || 'ninez';
    this.memory = MEMORIES[id];
    this.memoryId = id;
    this.n = this.cfg.rings || ringsForLevel(GameState.level);
    this.sel = 0;            // anillo elegido (0 = el de afuera)
    this.locked = false;     // true mientras un anillo gira
    this.done = false;
    this.cx = 400;
    this.cy = 268;
    this.R = 140;

    this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg);
    this.add.circle(this.cx, this.cy, 175, PAL.gold, 0.06);
    this.add.text(400, 40, 'Recuerdo', { ...TITLE, fontSize: '30px', fontStyle: '700' }).setOrigin(0.5);
    this.subText = this.add.text(400, 78, 'Gira los anillos hasta que la imagen encaje', { ...TEXT, fontSize: '18px', color: PAL.muted }).setOrigin(0.5);

    // Cada anillo es la misma imagen, recortada a un círculo más pequeño y girada.
    // Los de adentro se dibujan encima de los de afuera.
    const key = makeArtTexture(this, 'art-m-' + id, MEMORY_ART[id]);
    this.angles = [];
    this.images = [];
    for (let i = 0; i < this.n; i++) {
      const rOut = this.R * (this.n - i) / this.n;
      const img = this.add.image(this.cx, this.cy, key).setDepth(i).setScale(this.R / 120);
      const shape = this.make.graphics({ add: false });
      shape.fillStyle(0xffffff);
      shape.fillCircle(this.cx, this.cy, rOut);
      img.setMask(shape.createGeometryMask());
      const turns = Phaser.Math.Between(1, 7); // nunca 0: ningún anillo empieza bien puesto
      this.angles.push(turns * 45);
      img.setAngle(turns * 45);
      this.images.push(img);
    }

    this.marks = this.add.graphics().setDepth(30);
    this.glow = this.add.graphics().setDepth(31).setAlpha(0);
    this.drawMarks();

    this.createButtons();
    this.hint = this.add.text(400, 536, 'Arriba / Abajo: elegir anillo   ·   Izquierda / Derecha: girar   ·   o toca un anillo y usa los botones', {
      ...TEXT, fontSize: '14px', color: PAL.muted, align: 'center', wordWrap: { width: 700 }
    }).setOrigin(0.5);
    this.phrase = this.add.text(400, 440, this.memory.titulo, {
      ...TEXT, fontSize: '22px', color: CSS.goldLight, align: 'center', wordWrap: { width: 640 }, stroke: '#0b1410', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(40);
    this.continueText = this.add.text(400, 500, 'ESPACIO o toca para continuar', { ...TEXT, fontSize: '16px', color: PAL.muted }).setOrigin(0.5).setAlpha(0).setDepth(40);

    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
    this.input.keyboard.on('keydown', (e) => this.handleKey(e.code));

    // Tocar un anillo lo elige; deslizar a los lados lo gira
    this.pressedButton = false;
    this.input.on('pointerup', (p) => {
      if (this.pressedButton) { this.pressedButton = false; return; }
      if (this.done) return this.proceed();
      const dx = p.upX - p.downX, dy = p.upY - p.downY;
      const ring = this.ringAt(p.downX - MARGIN, p.downY - MARGIN);
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
        if (ring >= 0) this.select(ring);
      } else if (Math.abs(dx) > Math.abs(dy) && ring >= 0) {
        this.select(ring);
        this.rotate(Math.sign(dx));
      }
    });
  }

  // Botones de girar, para quien juega con el dedo o con el mouse
  createButtons() {
    const make = (x, dir) => {
      const g = this.add.graphics({ x, y: 478 }).setDepth(30);
      g.fillStyle(PAL.surface, 0.95); g.fillCircle(0, 0, 24);
      g.lineStyle(2, PAL.gold, 0.9); g.strokeCircle(0, 0, 24);
      g.fillStyle(PAL.gold);
      g.fillTriangle(dir * 9, 0, dir * -7, -10, dir * -7, 10);
      const zone = this.add.zone(x, 478, 56, 56).setInteractive({ useHandCursor: true }).setDepth(30);
      zone.on('pointerdown', () => { this.pressedButton = true; this.rotate(dir); });
      return [g, zone];
    };
    this.buttons = [].concat(make(332, -1), make(468, 1));
  }

  handleKey(code) {
    if (this.done) {
      if (code === 'Space' || code === 'Enter') this.proceed();
      return;
    }
    if (debugKey(this, code)) return;
    if (code === 'ArrowUp' || code === 'KeyW') this.select(this.sel - 1);
    else if (code === 'ArrowDown' || code === 'KeyS') this.select(this.sel + 1);
    else if (code === 'ArrowLeft' || code === 'KeyA') this.rotate(-1);
    else if (code === 'ArrowRight' || code === 'KeyD') this.rotate(1);
  }

  // Qué anillo está bajo un punto (o -1 si está fuera del círculo)
  ringAt(x, y) {
    const d = Phaser.Math.Distance.Between(x, y, this.cx, this.cy);
    if (d > this.R + 6) return -1;
    return Phaser.Math.Clamp(Math.floor((this.R - d) / (this.R / this.n)), 0, this.n - 1);
  }

  select(i) {
    if (this.locked || this.done) return;
    this.sel = Phaser.Math.Clamp(i, 0, this.n - 1);
    beep(this, 520, 0.04, 'sine');
    this.drawMarks();
  }

  // El anillo elegido brilla; los demás solo tienen una línea fina
  drawMarks() {
    const g = this.marks;
    g.clear();
    for (let i = 0; i < this.n && !this.done; i++) {
      const rOut = this.R * (this.n - i) / this.n;
      const on = i === this.sel && !this.done;
      g.lineStyle(on ? 5 : 1.5, PAL.gold, on ? 1 : 0.4);
      g.strokeCircle(this.cx, this.cy, rOut);
      if (on) {
        const rIn = this.R * (this.n - i - 1) / this.n;
        g.lineStyle(2, PAL.goldLight, 0.7);
        if (rIn > 0) g.strokeCircle(this.cx, this.cy, rIn);
        // marca en la parte de arriba del anillo, para ver cuánto ha girado
        g.fillStyle(PAL.gold);
        g.fillTriangle(this.cx - 7, this.cy - rOut - 12, this.cx + 7, this.cy - rOut - 12, this.cx, this.cy - rOut - 2);
      }
    }
    g.lineStyle(4, PAL.goldDark, 0.9);
    g.strokeCircle(this.cx, this.cy, this.R + 6);
  }

  rotate(dir) {
    if (this.locked || this.done) return;
    this.locked = true;
    const i = this.sel;
    this.angles[i] += dir * 45;
    beep(this, 300 + i * 40, 0.07, 'triangle');
    this.tweens.add({
      targets: this.images[i], angle: this.images[i].angle + dir * 45, duration: 150,
      onComplete: () => { this.locked = false; this.checkSolved(); }
    });
  }

  checkSolved() {
    const ok = this.angles.every((a) => ((a % 360) + 360) % 360 === 0);
    if (ok) this.solve();
  }

  solve() {
    this.done = true;
    this.drawMarks();
    GameState.addMemory(this.memoryId);
    [523, 659, 784, 1046].forEach((f, i) => this.time.delayedCall(i * 110, () => beep(this, f, 0.25, 'triangle')));

    // Un halo dorado se abre alrededor de la imagen (sin parpadeos)
    this.glow.clear();
    this.glow.lineStyle(8, PAL.gold, 1);
    this.glow.strokeCircle(this.cx, this.cy, this.R + 8);
    this.glow.setAlpha(0).setScale(1);
    this.glow.setPosition(0, 0);
    this.tweens.add({ targets: this.glow, alpha: { from: 0.9, to: 0 }, duration: 900 });
    this.buttons.forEach((b) => { if (b.input) b.disableInteractive(); });
    this.tweens.add({ targets: this.buttons, alpha: 0, duration: 300 });
    this.tweens.add({ targets: [this.hint], alpha: 0, duration: 300 });
    this.subText.setText('¡Recuerdo recuperado!').setColor(CSS.gold);
    this.tweens.add({ targets: this.phrase, alpha: 1, duration: 700, delay: 300 });
    this.tweens.add({ targets: this.continueText, alpha: 0.9, duration: 500, delay: 1100 });
  }

  proceed() {
    if (this.leaving || !this.continueText || this.continueText.alpha < 0.5) return;
    this.leaving = true;
    this.cameras.main.fadeOut(450, 11, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => this.afterMemory());
  }

  // Qué viene después del recuerdo: la siguiente tierra, el final provisional o volver al juego
  afterMemory() {
    if (this.cfg.after === 'fruit') {
      if (GameState.level >= LEVELS.length) {
        GameState.materials = 0;
        GameState.save();
        this.scene.start('StoryScene', { pages: STORY.finale, next: 'MenuScene' });
      } else {
        GameState.level++;
        GameState.materials = 0;
        GameState.save();
        goToLevelStory(this);
      }
    } else {
      this.scene.start('SnakeScene');
    }
  }
}

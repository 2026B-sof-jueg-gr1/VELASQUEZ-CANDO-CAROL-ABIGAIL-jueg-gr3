class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    makeTextures(this);
    createScenario(this, 0);

    // Serpiente decorativa persiguiendo una manzana
    const snake = [];
    for (let i = 0; i < 12; i++) snake.push({ x: 25 - i, y: 2 });
    drawSnake(this.add.graphics().setDepth(DEPTH.snake), snake, { x: 1, y: 0 }, false);
    const apple = this.add.graphics().setDepth(DEPTH.items);
    drawApple(apple);
    apple.setPosition(29 * CELL + CELL / 2, 2 * CELL + CELL / 2);
    this.tweens.add({ targets: apple, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });

    const front = (obj) => obj.setOrigin(0.5).setDepth(DEPTH.hud);
    front(this.add.text(400, 135, 'AMARU', {
      ...TITLE, fontSize: '92px',
      stroke: '#3a2504', strokeThickness: 8, shadow: { offsetX: 3, offsetY: 5, color: '#000', blur: 8, fill: true, stroke: true }
    }));
    front(this.add.text(400, 205, 'la Fruta del Origen', {
      ...TITLE, fontSize: '24px', fontStyle: '700', color: PAL.text, stroke: '#0b1410', strokeThickness: 5
    }));
    front(this.add.text(400, 243, 'Fase inicial · Come, crece y muda tu piel', {
      ...TEXT, fontSize: '19px', stroke: '#0b1410', strokeThickness: 4
    }));

    this.add.rectangle(400, 318, 560, 108, PAL.bg, 0.85).setStrokeStyle(2, PAL.gold, 0.55).setDepth(DEPTH.hud);
    front(this.add.text(400, 318, [
      'Flechas / WASD / deslizar: moverte   ·   P o Esc: pausa',
      'Cada 5 manzanas aparece un material de la tierra: junta 3',
      'La Fruta del Origen dura solo 8 segundos: cómela y muda de piel',
      'Poderes: Lento · Puntos x2 · Escudo · Tijeras'
    ], { ...TEXT, fontSize: '16px', lineSpacing: 6, align: 'center' }));

    // Las cinco tierras, con los mismos colores de la landing
    const worlds = [['Bosque', '#6fd197'], ['Desierto', '#e0b469'], ['Nieve', '#cfe6f2'], ['Volcán', '#f0704d'], ['Noche', '#8fa4ff']];
    worlds.forEach(([name, color], i) => front(this.add.text(176 + i * 112, 396, name, {
      ...TEXT, fontSize: '16px', fontStyle: '700', color, backgroundColor: 'rgba(11,20,16,0.85)', padding: { x: 8, y: 3 }
    })));

    front(this.add.text(400, 436, 'Récord: ' + loadBest(), HUD_STYLE).setColor(CSS.gold));
    if (DEBUG) front(this.add.text(60, 585, 'MODO DEBUG', { ...TEXT, fontSize: '14px', color: '#1a1204', backgroundColor: '#f2b33d', padding: { x: 6, y: 2 } }));

    this.createButtons(front);
  }

  // Botones "Continuar" (solo si hay partida guardada) y "Nueva partida"
  createButtons(front) {
    this.started = false;
    this.armed = false;           // true cuando "Nueva partida" pide confirmación
    this.hasSave = GameState.hasSave();
    if (this.hasSave) GameState.load(); else GameState.reset();

    this.options = [];
    if (this.hasSave) {
      this.options.push({ id: 'continue', label: 'Continuar · Nivel ' + GameState.level + ' · ' + GameState.current().name });
    }
    this.options.push({ id: 'new', label: 'Nueva partida' });
    this.sel = 0;

    const firstY = this.options.length === 1 ? 505 : 487;
    this.buttons = this.options.map((opt, i) => {
      const y = firstY + i * 48;
      const box = this.add.rectangle(400, y, 400, 40, PAL.surface, 0.95).setDepth(DEPTH.hud)
        .setInteractive({ useHandCursor: true });
      const label = front(this.add.text(400, y, opt.label, { ...TEXT, fontSize: '19px', fontStyle: '700' }));
      box.on('pointerover', () => this.select(i));
      box.on('pointerdown', () => { this.select(i); this.activate(); });
      return { box, label };
    });
    this.render();

    this.input.keyboard.addCapture('SPACE,UP,DOWN,ENTER');
    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.select(this.sel - 1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.select(this.sel + 1);
      else if (e.code === 'Space' || e.code === 'Enter') this.activate();
    });
  }

  select(i) {
    const next = Phaser.Math.Wrap(i, 0, this.options.length);
    if (next !== this.sel) this.armed = false;
    this.sel = next;
    this.render();
  }

  render() {
    this.buttons.forEach((b, i) => {
      const on = i === this.sel;
      const opt = this.options[i];
      b.box.setStrokeStyle(on ? 3 : 2, on ? PAL.gold : PAL.line, on ? 1 : 0.9);
      b.label.setColor(on ? CSS.gold : PAL.text);
      b.label.setText(opt.id === 'new' && this.armed ? '¿Seguro? Se borra tu partida' : opt.label);
    });
  }

  activate() {
    if (this.started) return;
    const opt = this.options[this.sel];
    // Con una partida guardada, "Nueva partida" pide una segunda pulsación para no borrarla sin querer
    if (opt.id === 'new' && this.hasSave && !this.armed) {
      this.armed = true;
      this.render();
      return;
    }
    if (opt.id === 'new') {
      GameState.reset();
      GameState.clearSave();
    }
    this.started = true;
    beep(this, 440, 0.12, 'square', 880);
    this.scene.start('SnakeScene');
  }
}

// Los finales. Tiene dos partes (data.part):
//   'choose'  → la guardiana pregunta "¿Vuelves a casa o te quedas a cuidar de ellos?" con dos botones grandes
//               (teclado: ↑↓ elegir y Espacio; o tocar). Al elegir pasa a la historia de ese final (StoryScene).
//   'credits' → los créditos. Al terminar se borra la partida en curso (se conservan el récord y los finales vistos),
//               así "Continuar" desaparece del menú hasta empezar una partida nueva.
// Con data.test (modo debug) no se guarda ni se borra nada; ahí la tecla C cambia quién lleva la fruta.
// Reglas y textos: js/ending.js y ENDING en data.js.
class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene');
  }

  init(data) {
    this.part = (data && data.part) || 'choose';
    this.test = !!(data && data.test);
    this.ending = data && data.ending;
    this.variant = (data && data.variant) || 0;
    this.chosen = false;
    this.done = false;
    this.ready = false;
  }

  // Amigas que se unieron, en el orden en que lo hicieron. En prueba de debug se cambian con C.
  friendList() {
    if (!this.test) return GameState.friends.slice();
    return [Object.keys(FRIENDS), ['musgo', 'duna'], []][this.variant % 3];
  }

  create() {
    frameCamera(this);
    this.cameras.main.fadeIn(600, 11, 20, 16);
    this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg);
    this.add.circle(400, 130, 190, PAL.gold, 0.05);
    this.input.keyboard.addCapture('UP,DOWN,SPACE,ENTER');
    if (this.part === 'credits') this.buildCredits(); else this.buildChoose();
  }

  // ---------- La pregunta ----------

  buildChoose() {
    const cx = 400, cy = 112, R = 84;
    const key = artTexture(this, 'guardiana_aparece');
    const img = this.add.image(cx, cy, key).setScale(0.7);
    const shape = this.make.graphics({ add: false });
    shape.fillStyle(0xffffff); shape.fillCircle(cx, cy, R);
    img.setMask(shape.createGeometryMask());
    const frame = this.add.graphics();
    frame.lineStyle(5, PAL.gold); frame.strokeCircle(cx, cy, R + 3);
    frame.lineStyle(2, PAL.goldDark, 0.8); frame.strokeCircle(cx, cy, R + 11);

    this.add.text(400, 222, 'La guardiana', { ...TEXT, fontSize: '16px', fontStyle: '700', color: CSS.gold }).setOrigin(0.5);
    this.add.text(400, 244, ENDING.ask, { ...TEXT, fontSize: '23px', align: 'center', lineSpacing: 6, wordWrap: { width: 700 } }).setOrigin(0.5, 0);

    // Dos botones de 104 px de alto: miden unos 44 px reales en un celular vertical de 360 px de ancho
    const seen = loadEndingsSeen();
    this.opts = ['casa', 'guardian'].map((id, i) => {
      const y = 350 + i * 116;
      const box = this.add.graphics();
      const label = this.add.text(400, y - 16, ENDING.options[id].label, { ...TEXT, fontSize: '26px', fontStyle: '800' }).setOrigin(0.5);
      const sub = this.add.text(400, y + 20, ENDING.options[id].sub + (seen.includes(id) ? '  ·  ya lo viste' : ''), { ...TEXT, fontSize: '17px', color: PAL.muted }).setOrigin(0.5);
      const zone = this.add.zone(400, y, 560, 104).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.select(i));
      zone.on('pointerdown', () => { this.select(i); this.choose(id); });
      return { id, y, box, label, sub };
    });
    this.sel = 0;
    this.hint = this.add.text(400, 580, 'ARRIBA / ABAJO: elegir  ·  ESPACIO: confirmar  ·  o toca una opción', { ...TEXT, fontSize: '14px', color: PAL.muted }).setOrigin(0.5);
    if (this.test) {
      this.testLabel = this.add.text(400, 606, '', { ...TEXT, fontSize: '14px', color: '#1a1204', backgroundColor: '#f2b33d', padding: { x: 6, y: 2 } }).setOrigin(0.5).setDepth(DEPTH.overlay);
      this.refreshTest();
    }
    this.render();

    this.input.keyboard.on('keydown', (e) => {
      if (this.chosen) return;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.select(this.sel - 1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.select(this.sel + 1);
      else if (e.code === 'Space' || e.code === 'Enter') this.choose(this.opts[this.sel].id);
      else if (e.code === 'Digit1') this.choose('casa');
      else if (e.code === 'Digit2') this.choose('guardian');
      else if (this.test && e.code === 'KeyC') { this.variant = (this.variant + 1) % 3; this.refreshTest(); }
    });
  }

  refreshTest() {
    const f = this.friendList();
    this.testLabel.setText('DEBUG · amigas: ' + (f.length ? f.join(', ') : 'ninguna') + ' · lleva la fruta: ' + carrierName(endingCarrier(f)) + ' · C: cambiar');
  }

  select(i) {
    this.sel = Phaser.Math.Wrap(i, 0, this.opts.length);
    this.render();
  }

  render() {
    this.opts.forEach((o, i) => {
      const on = i === this.sel;
      o.box.clear();
      o.box.fillStyle(PAL.surface, 0.95);
      o.box.fillRoundedRect(120, o.y - 52, 560, 104, 12);
      o.box.lineStyle(on ? 4 : 2, on ? PAL.gold : PAL.line);
      o.box.strokeRoundedRect(120, o.y - 52, 560, 104, 12);
      o.label.setColor(on ? CSS.gold : PAL.text);
    });
  }

  choose(id) {
    if (this.chosen) return;
    this.chosen = true;
    const friends = this.friendList();
    if (!this.test) {
      GameState.ending = id;
      GameState.save();
      saveEndingSeen(id);
    }
    beep(this, 440, 0.12, 'square', 880);
    this.cameras.main.fadeOut(500, 11, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('StoryScene', { pages: endingPages(id, friends), next: 'EndingScene', nextData: { part: 'credits', ending: id, test: this.test, variant: this.variant } });
    });
  }

  // ---------- Créditos ----------

  buildCredits() {
    const sizes = { title: ['92px', TITLE], sub: ['26px', TITLE], small: ['18px', TEXT], big: ['44px', TITLE], name: ['30px', TEXT] };
    const colors = { title: CSS.gold, sub: CSS.goldLight, small: PAL.muted, big: CSS.gold, name: PAL.text };
    this.credits = this.add.container(0, 0);
    let y = 0;
    creditsLines().forEach((l) => {
      if (l.k === 'gap') { y += 50; return; }
      const [size, style] = sizes[l.k];
      const t = this.add.text(400, y, l.t, { ...style, fontSize: size, fontStyle: l.k === 'title' ? '900' : l.k === 'name' ? '700' : style.fontStyle, color: colors[l.k], stroke: l.k === 'title' || l.k === 'big' ? '#3a2504' : undefined, strokeThickness: l.k === 'title' ? 8 : l.k === 'big' ? 4 : 0 }).setOrigin(0.5, 0);
      this.credits.add(t);
      y += t.height + 12;
    });
    const total = y;
    // sube despacio, de abajo hacia arriba; el último renglón queda a media pantalla
    this.credits.setY(620);
    const endY = 290 - total + 40;
    this.skipBar = this.add.rectangle(400, 596, GAME_W, 44, PAL.bg, 1).setDepth(9);
    this.skipHint = this.add.text(400, 596, 'ESPACIO o toca: saltar', { ...TEXT, fontSize: '14px', color: PAL.muted }).setOrigin(0.5).setDepth(10);
    this.roll = this.tweens.add({ targets: this.credits, y: endY, duration: Math.max(8000, (620 - endY) * 24), ease: 'Linear', onComplete: () => this.finishCredits() });
    this.time.delayedCall(700, () => { this.ready = true; });
    this.input.keyboard.on('keydown', (e) => { if (e.code === 'Space' || e.code === 'Enter') this.press(); });
    this.input.on('pointerdown', () => this.press());
  }

  press() {
    if (!this.ready) return;
    if (!this.done) { if (this.roll) this.roll.stop(); return this.finishCredits(); }
    this.toMenu();
  }

  // Al terminar: se borra la partida en curso (queda el récord y los finales vistos) y se vuelve al menú
  finishCredits() {
    if (this.done) return;
    this.done = true;
    this.ready = false;
    if (!this.test) {
      GameState.reset();
      GameState.clearSave();
    }
    this.skipHint.setVisible(false);
    this.skipBar.setVisible(false);
    this.tweens.add({ targets: this.credits, alpha: 0, duration: 700 });
    const fin = this.add.text(400, 270, 'Fin', { ...TITLE, fontSize: '72px', stroke: '#3a2504', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0);
    const back = this.add.text(400, 360, 'ESPACIO o toca: volver al menú', { ...TEXT, fontSize: '18px', color: PAL.muted }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [fin, back], alpha: 1, duration: 800, delay: 500 });
    this.time.delayedCall(1300, () => { this.ready = true; });
  }

  toMenu() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(500, 11, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
  }
}

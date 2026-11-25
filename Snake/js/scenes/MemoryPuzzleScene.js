// El puzzle de la puerta: ordenar los recuerdos conseguidos de la primera a la última casilla.
// Con mouse o dedo: arrastrar una tarjeta a una casilla, o tocarla y tocar la casilla.
// Con teclado: ←→ elige, Espacio coge o suelta, ↑↓ cambia de zona (bandeja, casillas, botón), Esc o Retroceso devuelve la tarjeta.
// Si el orden está mal las tarjetas tiemblan y la puerta sigue cerrada (no hay Game Over).
// Si está bien: la película de recuerdos, la puerta se abre e Inti cruza.
// La lógica (orden, ayuda) está en js/puzzle.js.
class MemoryPuzzleScene extends Phaser.Scene {
  constructor() {
    super('MemoryPuzzleScene');
  }

  init() {
    // Los recuerdos que tiene la partida. En modo debug, si hay menos de 5, se usan los 10 para poder probar.
    this.ids = GameState.memories.slice();
    if (DEBUG && this.ids.length < 5) this.ids = Object.keys(MEMORIES);
  }

  create() {
    frameCamera(this);
    this.cameras.main.fadeIn(500, 11, 20, 16);
    this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg);
    this.add.circle(400, 140, 190, PAL.gold, 0.05);

    this.n = this.ids.length;
    this.size = this.n <= 5 ? 96 : this.n <= 8 ? 80 : 72;
    this.gap = this.n <= 8 ? 8 : 6;
    this.fails = 0;
    this.held = null;            // id de la tarjeta que se tiene en la mano
    this.drag = null;
    this.phase = 'play';         // play | film | door
    this.focus = { zone: 'tray', i: 0 };
    this.slots = Array(this.n).fill(null);

    this.add.text(400, 24, PUZZLE.title, { ...TITLE, fontSize: '26px', fontStyle: '700' }).setOrigin(0.5);
    this.buildDoor();
    this.buildSlots();
    this.buildCards();
    this.buildTexts();
    this.buildButton();

    this.focusG = this.add.graphics().setDepth(40);
    this.hintG = this.add.graphics().setDepth(5);
    this.refreshFocus();

    this.input.keyboard.addCapture('LEFT,RIGHT,UP,DOWN,SPACE,ENTER,BACKSPACE,ESC');
    this.input.keyboard.on('keydown', (e) => this.handleKey(e.code));
    this.input.on('pointerdown', (p) => this.onDown(p.x - MARGIN, p.y - MARGIN));
    this.input.on('pointermove', (p) => this.onMove(p.x - MARGIN, p.y - MARGIN));
    this.input.on('pointerup', (p) => this.onUp(p.x - MARGIN, p.y - MARGIN));
  }

  // ---------- Dibujo ----------

  // La puerta de piedra, en dos hojas que se abren hacia los lados
  buildDoor() {
    const key = 'puzzle-door';
    if (!this.textures.exists(key)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x2a251f);
      g.fillRoundedRect(0, 0, 200, 170, { tl: 100, tr: 100, bl: 0, br: 0 });
      g.fillStyle(0x5b5348);
      g.fillRoundedRect(10, 10, 180, 160, { tl: 90, tr: 90, bl: 0, br: 0 });
      g.lineStyle(3, 0x7d7364, 0.9);              // brillo del arco de la puerta
      g.beginPath();
      g.arc(100, 100, 84, Math.PI, Math.PI * 2);
      g.strokePath();
      g.fillStyle(0x3b352d);
      g.fillRect(98, 22, 4, 148);
      // chakana dorada en el centro (la misma forma de la landing)
      const pts = [[18, 6], [30, 6], [30, 12], [36, 12], [36, 18], [42, 18], [42, 30], [36, 30], [36, 36], [30, 36], [30, 42], [18, 42], [18, 36], [12, 36], [12, 30], [6, 30], [6, 18], [12, 18], [12, 12], [18, 12]];
      const s = 1.6;
      g.fillStyle(PAL.goldDark);
      g.fillPoints(pts.map(([x, y]) => ({ x: 100 + (x - 24) * s + 1.5, y: 92 + (y - 24) * s + 2 })), true);
      g.fillStyle(PAL.gold);
      g.fillPoints(pts.map(([x, y]) => ({ x: 100 + (x - 24) * s, y: 92 + (y - 24) * s })), true);
      g.fillStyle(0x2a251f);
      g.fillCircle(100, 92, 5);
      g.generateTexture(key, 200, 170);
      g.destroy();
    }
    // el marco de piedra se queda quieto; la luz de detrás crece al abrirse
    const frameG = this.add.graphics().setDepth(0.8);
    frameG.fillStyle(0x2a251f);
    frameG.fillRoundedRect(300, 55, 200, 170, { tl: 100, tr: 100, bl: 0, br: 0 });
    this.doorLight = this.add.graphics().setDepth(1);
    this.doorLight.fillStyle(PAL.goldLight, 1);
    this.doorLight.fillRoundedRect(314, 66, 172, 160, { tl: 86, tr: 86, bl: 0, br: 0 });
    this.doorLight.setAlpha(0);
    this.leftLeaf = this.add.image(300, 55, key).setOrigin(0, 0).setCrop(0, 0, 100, 170).setDepth(2);
    this.rightLeaf = this.add.image(300, 55, key).setOrigin(0, 0).setCrop(100, 0, 100, 170).setDepth(2);
    this.add.graphics().setDepth(0).fillStyle(0x000000, 0.35).fillEllipse(400, 228, 230, 16);
  }

  slotPos(i) {
    const w = this.n * this.size + (this.n - 1) * this.gap;
    return { x: 400 - w / 2 + this.size / 2 + i * (this.size + this.gap), y: 296 };
  }

  trayPos(i) {
    const p = this.slotPos(i);
    return { x: p.x, y: 410 };
  }

  buildSlots() {
    this.slotG = this.add.graphics().setDepth(3);
    this.slotNums = [];
    for (let i = 0; i < this.n; i++) {
      const p = this.slotPos(i), s = this.size;
      this.slotG.fillStyle(PAL.surface, 0.95);
      this.slotG.fillRoundedRect(p.x - s / 2, p.y - s / 2, s, s, 8);
      this.slotG.lineStyle(2, PAL.line);
      this.slotG.strokeRoundedRect(p.x - s / 2, p.y - s / 2, s, s, 8);
      this.slotNums.push(this.add.text(p.x, p.y, String(i + 1), { ...TEXT, fontSize: '28px', fontStyle: '800', color: '#4a6354' }).setOrigin(0.5).setDepth(4));
    }
    // marcas de las casillas de la bandeja (donde vuelve cada tarjeta)
    for (let i = 0; i < this.n; i++) {
      const p = this.trayPos(i), s = this.size;
      this.slotG.lineStyle(1.5, PAL.line, 0.6);
      this.slotG.strokeRoundedRect(p.x - s / 2, p.y - s / 2, s, s, 8);
    }
  }

  buildCards() {
    this.cards = {};
    const order = puzzleShuffle(this.ids);
    const s = this.size;
    order.forEach((id, home) => {
      const key = artTexture(this, id);
      const img = this.add.image(0, 0, key).setScale((s - 8) / 240);
      const frame = this.add.graphics();
      frame.fillStyle(0x000000, 0.4);
      frame.fillRoundedRect(-s / 2 + 2, -s / 2 + 4, s, s, 8);
      frame.lineStyle(3, PAL.gold);
      frame.strokeRoundedRect(-s / 2, -s / 2, s, s, 8);
      const glow = this.add.graphics().setAlpha(0);
      glow.lineStyle(5, PAL.goldLight);
      glow.strokeRoundedRect(-s / 2 - 3, -s / 2 - 3, s + 6, s + 6, 10);
      const c = this.add.container(0, 0, [frame, img, glow]).setDepth(10);
      const pos = this.trayPos(home);
      c.setPosition(pos.x, pos.y);
      this.cards[id] = { id, c, glow, home, where: 'tray', slot: -1 };
    });
  }

  buildTexts() {
    this.caption = this.add.text(400, 480, PUZZLE.help, { ...TEXT, fontSize: '17px', color: PAL.muted, align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5).setDepth(6);
    this.message = this.add.text(400, 512, '', { ...TEXT, fontSize: '19px', fontStyle: '700', color: CSS.goldLight, align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5).setDepth(6);
  }

  buildButton() {
    this.btnBox = this.add.graphics().setDepth(6);
    this.btnLabel = this.add.text(400, 556, PUZZLE.button, { ...TEXT, fontSize: '20px', fontStyle: '800', color: CSS.gold }).setOrigin(0.5).setDepth(7);
    this.btnRect = { x: 280, y: 530, w: 240, h: 52 };
    this.drawButton(false);
  }

  drawButton(on) {
    const b = this.btnRect;
    this.btnBox.clear();
    this.btnBox.fillStyle(PAL.surface, 0.95);
    this.btnBox.fillRoundedRect(b.x, b.y, b.w, b.h, 10);
    this.btnBox.lineStyle(on ? 4 : 2, on ? PAL.goldLight : PAL.gold);
    this.btnBox.strokeRoundedRect(b.x, b.y, b.w, b.h, 10);
  }

  // ---------- Posiciones y movimiento ----------

  cardPos(card) {
    return card.where === 'slot' ? this.slotPos(card.slot) : this.trayPos(card.home);
  }

  moveCard(card, dur = 180) {
    const p = this.cardPos(card);
    this.tweens.killTweensOf(card.c);
    this.tweens.add({ targets: card.c, x: p.x, y: p.y, scale: 1, duration: dur, ease: 'Sine.Out' });
    card.c.setDepth(10);
  }

  // Pone una tarjeta en una casilla. Si ya había otra, va a la casilla de la que vino la primera, o a la bandeja.
  place(id, slotIdx) {
    const card = this.cards[id];
    const from = card.where === 'slot' ? card.slot : -1;
    const other = this.slots[slotIdx];
    if (from >= 0) this.slots[from] = null;
    if (other && other !== id) {
      const oc = this.cards[other];
      if (from >= 0) { oc.where = 'slot'; oc.slot = from; this.slots[from] = other; } else { oc.where = 'tray'; oc.slot = -1; }
      this.moveCard(oc);
    }
    card.where = 'slot';
    card.slot = slotIdx;
    this.slots[slotIdx] = id;
    this.held = null;
    this.moveCard(card);
    beep(this, 440, 0.07, 'triangle');
    this.afterChange();
  }

  toTray(id) {
    const card = this.cards[id];
    if (card.where === 'slot') this.slots[card.slot] = null;
    card.where = 'tray';
    card.slot = -1;
    if (this.held === id) this.held = null;
    this.moveCard(card);
    beep(this, 330, 0.06, 'triangle');
    this.afterChange();
  }

  afterChange() {
    this.updateHintMark();
    const full = this.slots.every((s) => s);
    this.message.setText(full ? PUZZLE.ready : '');
    this.refreshFocus();
  }

  // Tarjeta cogida (con teclado o con un toque): se levanta un poco y brilla
  pickUp(id) {
    if (this.held && this.held !== id) this.cards[this.held].glow.setAlpha(0);
    this.held = id;
    const card = this.cards[id];
    card.c.setDepth(30);
    this.tweens.killTweensOf(card.c);
    this.tweens.add({ targets: card.c, scale: 1.12, duration: 120 });
    card.glow.setAlpha(1);
    this.showTitle(id);
    beep(this, 520, 0.05, 'sine');
    this.refreshFocus();
  }

  drop() {
    if (!this.held) return;
    const card = this.cards[this.held];
    card.glow.setAlpha(0);
    this.held = null;
    this.moveCard(card);
    this.refreshFocus();
  }

  showTitle(id) {
    this.caption.setText(MEMORIES[id].titulo).setColor(CSS.goldLight);
  }

  clearTitle() {
    this.caption.setText(PUZZLE.help).setColor(PAL.muted);
  }

  // ---------- Teclado ----------

  trayCards() {
    return Object.values(this.cards).filter((c) => c.where === 'tray').sort((a, b) => a.home - b.home);
  }

  handleKey(code) {
    if (this.phase === 'film') { if (code === 'Space' || code === 'Enter') this.filmNext(); return; }
    if (this.phase !== 'play') return;
    const f = this.focus;
    if (code === 'Escape' || code === 'Backspace') {
      if (this.held) this.drop();
      else if (f.zone === 'slots' && this.slots[f.i]) this.toTray(this.slots[f.i]);
      return;
    }
    if (code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowRight' || code === 'KeyD') {
      const d = code === 'ArrowLeft' || code === 'KeyA' ? -1 : 1;
      if (f.zone === 'tray') {
        const list = this.trayCards();
        if (list.length) {
          const cur = Math.max(0, list.findIndex((c) => c.home === f.i));
          f.i = list[Phaser.Math.Wrap(cur + d, 0, list.length)].home;
        }
      } else if (f.zone === 'slots') {
        f.i = Phaser.Math.Wrap(f.i + d, 0, this.n);
      }
      this.syncCursor();
      return;
    }
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
      if (this.held) return;   // con una tarjeta en la mano solo se elige la casilla
      const zones = ['slots', 'tray', 'button'];
      const cur = zones.indexOf(f.zone === 'tray' ? 'tray' : f.zone);
      // arriba: casillas; abajo: bandeja y luego el botón
      const next = code === 'ArrowUp' || code === 'KeyW' ? Math.max(0, cur - 1) : Math.min(2, cur + 1);
      f.zone = zones[next];
      if (f.zone === 'tray') { const list = this.trayCards(); f.i = list.length ? list[0].home : 0; if (!list.length) f.zone = 'slots'; }
      this.syncCursor();
      return;
    }
    if (code === 'Space' || code === 'Enter') this.activate();
  }

  // Espacio o Enter según la zona
  activate() {
    const f = this.focus;
    if (f.zone === 'button') return this.tryOpen();
    if (f.zone === 'tray') {
      const card = this.trayCards().find((c) => c.home === f.i);
      if (!card) return;
      if (this.held === card.id) return this.drop();
      this.pickUp(card.id);
      f.zone = 'slots';
      f.i = Math.max(0, this.slots.findIndex((s) => !s));
      this.syncCursor();
      return;
    }
    // zona de casillas
    if (this.held) return this.place(this.held, f.i);
    if (this.slots[f.i]) { const id = this.slots[f.i]; this.pickUp(id); }
  }

  // La tarjeta en la mano sigue al cursor de las casillas
  syncCursor() {
    const f = this.focus;
    if (this.held && f.zone === 'slots') {
      const card = this.cards[this.held];
      const p = this.slotPos(f.i);
      this.tweens.killTweensOf(card.c);
      this.tweens.add({ targets: card.c, x: p.x, y: p.y - 10, scale: 1.12, duration: 100 });
    }
    const id = f.zone === 'slots' ? this.slots[f.i] : f.zone === 'tray' ? (this.trayCards().find((c) => c.home === f.i) || {}).id : null;
    if (id && !this.held) this.showTitle(id);
    else if (!this.held) this.clearTitle();
    this.refreshFocus();
  }

  refreshFocus() {
    const g = this.focusG, f = this.focus, s = this.size;
    g.clear();
    if (this.phase !== 'play') return;
    g.lineStyle(4, PAL.goldLight);
    if (f.zone === 'slots') {
      const p = this.slotPos(f.i);
      g.strokeRoundedRect(p.x - s / 2 - 4, p.y - s / 2 - 4, s + 8, s + 8, 11);
    } else if (f.zone === 'tray') {
      const list = this.trayCards();
      if (!list.length) return;
      if (!list.some((c) => c.home === f.i)) f.i = list[0].home;
      const p = this.trayPos(f.i);
      g.strokeRoundedRect(p.x - s / 2 - 4, p.y - s / 2 - 4, s + 8, s + 8, 11);
    } else {
      this.drawButton(true);
      return;
    }
    this.drawButton(false);
  }

  // ---------- Mouse y dedo ----------

  cardAt(x, y) {
    const s = this.size / 2;
    const list = Object.values(this.cards).sort((a, b) => b.c.depth - a.c.depth);
    return list.find((c) => Math.abs(x - c.c.x) <= s && Math.abs(y - c.c.y) <= s) || null;
  }

  slotAt(x, y) {
    const s = this.size / 2 + this.gap / 2;
    for (let i = 0; i < this.n; i++) {
      const p = this.slotPos(i);
      if (Math.abs(x - p.x) <= s && Math.abs(y - p.y) <= s) return i;
    }
    return -1;
  }

  overButton(x, y) {
    const b = this.btnRect;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  onDown(x, y) {
    if (this.phase === 'film') return this.filmNext();
    if (this.phase !== 'play') return;
    if (this.overButton(x, y)) { this.pressedButton = true; return; }
    const card = this.cardAt(x, y);
    if (card) {
      // con una tarjeta cogida, tocar una casilla llena cambia las dos
      if (this.held && this.held !== card.id && card.where === 'slot') { this.place(this.held, card.slot); return; }
      if (this.held && this.held !== card.id) this.drop();
      this.drag = { id: card.id, sx: x, sy: y, ox: card.c.x - x, oy: card.c.y - y, moved: false };
      this.focus = card.where === 'slot' ? { zone: 'slots', i: card.slot } : { zone: 'tray', i: card.home };
      return;
    }
    const i = this.slotAt(x, y);
    if (i >= 0 && this.held) this.place(this.held, i);
  }

  onMove(x, y) {
    const d = this.drag;
    if (!d) return;
    if (!d.moved && Math.hypot(x - d.sx, y - d.sy) > 12) {
      d.moved = true;
      const card = this.cards[d.id];
      card.c.setDepth(30);
      this.tweens.killTweensOf(card.c);
      card.c.setScale(1.12);
      this.showTitle(d.id);
    }
    if (d.moved) this.cards[d.id].c.setPosition(x + d.ox, y + d.oy);
  }

  onUp(x, y) {
    if (this.phase !== 'play') return;
    if (this.pressedButton) {
      this.pressedButton = false;
      if (this.overButton(x, y)) this.tryOpen();
      return;
    }
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const card = this.cards[d.id];
    if (d.moved) {
      const i = this.slotAt(card.c.x, card.c.y);
      if (i >= 0) this.place(d.id, i); else this.toTray(d.id);
      return;
    }
    // un toque: coger la tarjeta, o soltarla si ya estaba cogida
    if (this.held === d.id) this.drop(); else this.pickUp(d.id);
  }

  // ---------- Probar el orden ----------

  tryOpen() {
    if (this.phase !== 'play') return;
    if (this.slots.some((s) => !s)) {
      this.message.setText(PUZZLE.empty);
      beep(this, 260, 0.12, 'square');
      return;
    }
    if (puzzleCorrect(this.slots)) return this.succeed();
    this.fail();
  }

  fail() {
    this.fails++;
    this.message.setText(PUZZLE.wrong);
    beep(this, 200, 0.3, 'sawtooth', 90);
    // las tarjetas tiemblan y se ven borrosas un momento (sin destellos)
    Object.values(this.cards).forEach((card) => {
      const ghosts = [-1, 1].map((k) => {
        const img = card.c.list[1];
        const gh = this.add.image(card.c.x + k * 5, card.c.y, img.texture.key).setScale(img.scale).setAlpha(0.3).setDepth(card.c.depth - 0.1);
        return gh;
      });
      this.tweens.add({
        targets: card.c, x: card.c.x + 6, duration: 55, yoyo: true, repeat: 5,
        onComplete: () => { card.c.x = this.cardPos(card).x; ghosts.forEach((gh) => gh.destroy()); }
      });
      this.tweens.add({ targets: card.c, alpha: 0.6, duration: 330, yoyo: true });
    });
    this.updateHintMark();
  }

  // Tras 3 intentos fallidos, la tarjeta que va primero entre las que no están en su casilla brilla suave,
  // junto con la casilla que le toca
  updateHintMark() {
    this.hintG.clear();
    if (this.hintTween) { this.hintTween.stop(); this.hintTween = null; }
    Object.values(this.cards).forEach((c) => { if (c.id !== this.held) c.glow.setAlpha(0); });
    if (this.fails < PUZZLE.hintAfter) return;
    const hint = puzzleHint(this.slots, this.ids);
    if (!hint) return;
    const card = this.cards[hint.id];
    const p = this.slotPos(hint.slot), s = this.size;
    this.hintG.lineStyle(4, PAL.goldLight, 1);
    this.hintG.strokeRoundedRect(p.x - s / 2 - 2, p.y - s / 2 - 2, s + 4, s + 4, 9);
    card.glow.setAlpha(1);
    this.hintTween = this.tweens.add({ targets: [card.glow, this.hintG], alpha: { from: 0.35, to: 1 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  // ---------- La película y la puerta ----------

  succeed() {
    this.phase = 'film';
    this.focusG.clear();
    this.hintG.clear();
    if (this.hintTween) this.hintTween.stop();
    [2, 3, 4, 5, 6, 7].forEach((f, i) => this.time.delayedCall(i * 90, () => beep(this, 440 + f * 60, 0.18, 'triangle')));
    this.message.setText('');
    const ui = [this.slotG, this.hintG, this.caption, this.btnBox, this.btnLabel].concat(this.slotNums, Object.values(this.cards).map((c) => c.c));
    this.tweens.add({ targets: ui, alpha: 0, duration: 500 });
    this.film = puzzleOrder(this.ids);
    this.filmIndex = -1;
    this.filmStage = this.add.container(0, 0).setDepth(50);
    this.filmBg = this.add.rectangle(400, 300, GAME_W, GAME_H, PAL.bg, 1).setDepth(49).setAlpha(0);
    this.tweens.add({ targets: this.filmBg, alpha: 1, duration: 600, onComplete: () => this.filmNext() });
  }

  // Espacio o un toque adelantan al siguiente recuerdo
  filmNext() {
    if (this.filmBusy || this.phase !== 'film') return;
    if (this.filmTimer) { this.filmTimer.remove(); this.filmTimer = null; }
    const out = () => {
      this.filmIndex++;
      if (this.filmIndex >= this.film.length) return this.openDoor();
      this.showFilmFrame(this.filmIndex);
    };
    if (this.filmIndex < 0) return out();
    this.filmBusy = true;
    const old = this.filmItems;
    this.tweens.add({
      targets: old, alpha: 0, duration: 250,
      onComplete: () => { old.forEach((o) => o.destroy()); this.filmBusy = false; out(); }
    });
  }

  showFilmFrame(i) {
    const id = this.film[i];
    const key = artTexture(this, id);
    const img = this.add.image(400, 262, key).setScale(1.9).setAlpha(0).setDepth(51);
    const frame = this.add.graphics().setDepth(52).setAlpha(0);
    frame.lineStyle(5, PAL.gold);
    frame.strokeRect(400 - 228, 262 - 228, 456, 456);
    const title = this.add.text(400, 524, MEMORIES[id].titulo, { ...TEXT, fontSize: '22px', fontStyle: '700', color: CSS.goldLight, align: 'center', wordWrap: { width: 700 }, stroke: '#0b1410', strokeThickness: 4 }).setOrigin(0.5).setDepth(52).setAlpha(0);
    const count = this.add.text(400, 568, (i + 1) + ' / ' + this.film.length + '   ·   ESPACIO o toca para seguir', { ...TEXT, fontSize: '14px', color: PAL.muted }).setOrigin(0.5).setDepth(52).setAlpha(0);
    this.filmItems = [img, frame, title, count];
    this.tweens.add({ targets: this.filmItems, alpha: 1, duration: 400 });
    beep(this, 330 + i * 40, 0.15, 'sine');
    this.filmTimer = this.time.delayedCall(PUZZLE.filmHold, () => { this.filmTimer = null; this.filmNext(); });
  }

  // La puerta se abre; la serpiente se acerca y, al cruzar, Inti queda como humano
  openDoor() {
    this.phase = 'door';
    this.filmBusy = true;
    this.tweens.add({ targets: this.filmBg, alpha: 0, duration: 500 });
    this.tweens.add({ targets: this.filmStage, alpha: 0, duration: 300 });
    this.filmBg.setDepth(0.5);
    GameState.stage = 'boss';
    GameState.save();
    [262, 330, 392, 523].forEach((f, i) => this.time.delayedCall(i * 250, () => beep(this, f, 0.5, 'triangle')));
    // las hojas se deslizan hacia los lados y entra la luz
    this.tweens.add({ targets: this.doorLight, alpha: 1, duration: 1800, delay: 400 });
    this.tweens.add({ targets: this.leftLeaf, x: 205, duration: 1800, delay: 400, ease: 'Sine.InOut' });
    this.tweens.add({ targets: this.rightLeaf, x: 395, duration: 1800, delay: 400, ease: 'Sine.InOut' });

    // la serpiente (con las amigas) sube hacia la puerta
    const snake = [];
    for (let k = 0; k < 4 + GameState.friends.length; k++) snake.push({ x: 20, y: 25 + k });
    const sg = this.add.graphics({ x: -10, y: -80 }).setDepth(20).setAlpha(0);   // la cabeza empieza en y = 420
    drawSnake(sg, snake, { x: 0, y: -1 }, false, 5, this.friendColors());
    this.tweens.add({ targets: sg, alpha: 1, duration: 400, delay: 1900 });
    // Inti, de pie, con su mochila
    const human = this.add.graphics({ x: 400, y: 215 }).setDepth(21).setAlpha(0);
    artPerson(human, 0, 0, 100, 0x3d5bd9, true);
    const text = this.add.text(400, 520, PUZZLE.crossing, { ...TEXT, fontSize: '22px', fontStyle: '700', color: CSS.goldLight, align: 'center', wordWrap: { width: 700 }, stroke: '#0b1410', strokeThickness: 4 }).setOrigin(0.5).setDepth(22).setAlpha(0);
    this.tweens.add({
      targets: sg, y: -340, duration: 3200, delay: 2300, ease: 'Sine.InOut',
      onUpdate: () => { if (sg.y < -240) sg.setAlpha(Phaser.Math.Clamp((sg.y + 330) / 90, 0, 1)); }
    });
    this.tweens.add({ targets: human, alpha: 1, y: 150, duration: 1800, delay: 4300, ease: 'Sine.Out' });
    this.tweens.add({ targets: text, alpha: 1, duration: 800, delay: 5000 });
    this.time.delayedCall(7600, () => this.leave());
  }

  friendColors() {
    return GameState.friends.map((id) => FRIENDS[id].color);
  }

  // La batalla final (E2) todavía no existe: mientras tanto, un texto y el menú
  leave() {
    this.cameras.main.fadeOut(600, 11, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.scene.manager.keys.BossScene) return this.scene.start('BossScene');
      this.scene.start('StoryScene', {
        pages: [{ art: 'fruta_origen', text: 'Al otro lado de la puerta, algo enorme esperaba entre las sombras…' }, { speaker: 'La guardiana', text: '«La batalla final llegará pronto.»' }],
        next: 'MenuScene'
      });
    });
  }
}

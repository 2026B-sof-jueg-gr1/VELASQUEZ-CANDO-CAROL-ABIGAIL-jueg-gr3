// Escena de texto: las letras aparecen de a poco y se avanza con Espacio, Enter o un toque.
// Recibe { pages: [{ text, art, speaker, title }], next: 'NombreDeEscena' }.
class StoryScene extends Phaser.Scene {
  constructor() {
    super('StoryScene');
  }

  init(data) {
    this.pages = (data && data.pages) || [];
    this.nextKey = (data && data.next) || 'SnakeScene';
    this.index = 0;
    this.leaving = false;
  }

  create() {
    this.cameras.main.fadeIn(500, 11, 20, 16);
    this.add.rectangle(400, 300, 800, 600, PAL.bg);
    this.add.circle(400, 215, 190, PAL.gold, 0.05);

    this.artImage = null;
    this.artFrame = null;
    this.titleText = this.add.text(400, 34, '', { ...TEXT, fontSize: '22px', fontStyle: '800', color: CSS.gold }).setOrigin(0.5);
    this.speakerText = this.add.text(400, 452, '', { ...TEXT, fontSize: '16px', fontStyle: '700', color: CSS.gold }).setOrigin(0.5);
    this.bodyText = this.add.text(400, 474, '', { ...TEXT, fontSize: '21px', align: 'center', lineSpacing: 7 }).setOrigin(0.5, 0);
    this.hintText = this.add.text(400, 572, 'ESPACIO o toca para continuar', { ...TEXT, fontSize: '15px', color: PAL.muted }).setOrigin(0.5).setAlpha(0);
    this.dots = this.add.graphics();

    this.input.keyboard.addCapture('SPACE,ENTER');
    this.input.keyboard.on('keydown', (e) => { if (e.code === 'Space' || e.code === 'Enter') this.advance(); });
    this.input.on('pointerdown', () => this.advance());

    if (!this.pages.length) return this.leave();
    this.showPage(0);
  }

  showPage(i) {
    const page = this.pages[i];

    // Ilustración dentro de un círculo con marco dorado
    if (this.artImage) { this.artImage.clearMask(true); this.artImage.destroy(); }
    if (this.artFrame) this.artFrame.destroy();
    const key = page.art ? artTexture(this, page.art) : null;
    if (key) {
      this.artImage = this.add.image(400, 215, key).setAlpha(0);
      const maskShape = this.make.graphics({ add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillCircle(400, 215, 118);
      this.artImage.setMask(maskShape.createGeometryMask());
      this.artFrame = this.add.graphics();
      this.artFrame.lineStyle(5, PAL.gold);
      this.artFrame.strokeCircle(400, 215, 121);
      this.artFrame.lineStyle(2, PAL.goldDark, 0.8);
      this.artFrame.strokeCircle(400, 215, 130);
      this.tweens.add({ targets: this.artImage, alpha: 1, duration: 500 });
    } else {
      this.artImage = null;
      this.artFrame = null;
    }

    this.titleText.setText(page.title || '');
    this.speakerText.setText(page.speaker || '');
    this.hintText.setAlpha(0);
    this.drawDots(i);

    // Se parte el texto en líneas antes de mostrarlo, así las palabras no saltan de renglón mientras aparecen
    const measure = this.make.text({ x: 0, y: 0, text: page.text, style: { ...TEXT, fontSize: '21px', align: 'center', wordWrap: { width: 660 } }, add: false });
    this.full = measure.getWrappedText().join('\n');
    measure.destroy();
    this.chars = 0;
    this.typing = true;
    this.bodyText.setText('');
    if (this.typer) this.typer.remove();
    this.typer = this.time.addEvent({
      delay: 28, loop: true,
      callback: () => {
        this.chars++;
        this.bodyText.setText(this.full.slice(0, this.chars));
        if (this.chars >= this.full.length) this.finishTyping();
      }
    });
  }

  finishTyping() {
    this.typing = false;
    if (this.typer) { this.typer.remove(); this.typer = null; }
    this.bodyText.setText(this.full);
    this.tweens.add({ targets: this.hintText, alpha: 0.9, duration: 400 });
  }

  drawDots(i) {
    this.dots.clear();
    const n = this.pages.length;
    if (n < 2) return;
    for (let k = 0; k < n; k++) {
      this.dots.fillStyle(k === i ? PAL.gold : PAL.line, k === i ? 1 : 0.9);
      this.dots.fillCircle(400 + (k - (n - 1) / 2) * 16, 548, 4);
    }
  }

  advance() {
    if (this.leaving) return;
    if (this.typing) return this.finishTyping(); // un toque completa el texto de golpe
    this.index++;
    if (this.index >= this.pages.length) return this.leave();
    beep(this, 330, 0.06, 'sine');
    this.showPage(this.index);
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400, 11, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.nextKey));
  }
}

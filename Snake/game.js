const CELL = 20;
const COLS = 40; // 800 / 20
const ROWS = 30; // 600 / 20

const DIRS = {
  ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 }
};

function loadBest() {
  try { return Number(localStorage.getItem('snake-best')) || 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('snake-best', String(v)); } catch (e) { /* sin storage */ }
}

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

    this.add.grid(400, 300, 800, 600, CELL, CELL, 0x1b1b1b, 1, 0x262626, 1);
    this.gfx = this.add.graphics();
    this.food = this.spawnFood();

    const style = { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' };
    this.scoreText = this.add.text(12, 10, 'Puntos: 0', style);
    this.bestText = this.add.text(788, 10, 'Récord: ' + this.best, style).setOrigin(1, 0);

    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    this.input.keyboard.on('keydown', (e) => this.handleKey(e.code));

    this.draw();
  }

  handleKey(code) {
    const d = DIRS[code];
    if (!d || this.dead) return;
    // Comparar con la última dirección encolada para no dar media vuelta
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (this.queue.length < 2) this.queue.push(d);
  }

  update(time, delta) {
    if (this.dead) return;
    this.acc += delta;
    while (this.acc >= this.stepDelay && !this.dead) {
      this.acc -= this.stepDelay;
      this.step();
    }
  }

  step() {
    if (this.queue.length) this.dir = this.queue.shift();

    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return this.gameOver();
    }

    const eating = this.food && head.x === this.food.x && head.y === this.food.y;
    // Si no come, la cola se mueve, así que esa celda queda libre
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some((s) => s.x === head.x && s.y === head.y)) {
      return this.gameOver();
    }

    this.snake.unshift(head);

    if (eating) {
      this.score += 10;
      this.scoreText.setText('Puntos: ' + this.score);
      this.stepDelay = Math.max(60, this.stepDelay - 3);
      this.cameras.main.flash(80, 40, 120, 40);
      this.food = this.spawnFood();
      if (!this.food) return this.gameOver(true);
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  spawnFood() {
    const free = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (!this.snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    return free.length ? Phaser.Utils.Array.GetRandom(free) : null;
  }

  draw() {
    const g = this.gfx;
    g.clear();

    if (this.food) {
      g.fillStyle(0xe74c3c);
      g.fillRect(this.food.x * CELL + 2, this.food.y * CELL + 2, CELL - 4, CELL - 4);
    }

    this.snake.forEach((s, i) => {
      g.fillStyle(i === 0 ? 0x7bed9f : 0x2ecc71);
      g.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  gameOver(won = false) {
    this.dead = true;
    this.draw();

    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.best);
      this.bestText.setText('Récord: ' + this.best);
    }

    if (!won) this.cameras.main.shake(250, 0.01);

    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);
    this.add.text(400, 260, won ? '¡Ganaste!' : 'Game Over', {
      fontFamily: 'monospace', fontSize: '48px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(400, 330, 'Puntos: ' + this.score + '   ·   Espacio para reiniciar', {
      fontFamily: 'monospace', fontSize: '18px', color: '#cccccc'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#1b1b1b',
  scene: SnakeScene
};

const game = new Phaser.Game(config);
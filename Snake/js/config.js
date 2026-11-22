// Constantes, paleta y datos fijos del juego (se carga antes que todo lo demás)
const CELL = 20;
const COLS = 40; // 800 / 20
const ROWS = 30; // 600 / 20

// Paleta de Amaru: la misma que usa la landing page (styles.css)
const PAL = {
  bg: 0x0b1410, surface: 0x15231c, line: 0x2b4034,
  text: '#efe6d2', muted: '#bdb6a2',
  gold: 0xf2b33d, goldDark: 0xb97f12, goldLight: 0xffe9a8,
  scale: 0x3fae6a, red: 0xd8433a
};
const CSS = { gold: '#f2b33d', goldLight: '#ffe9a8', scale: '#74d695', dark: '#0b1410' };
const FONT_TITLE = '"Cinzel Decorative", Georgia, serif';
const FONT_BODY = 'Outfit, system-ui, sans-serif';

const HEAD_COLOR = 0x74d695;  // verde claro de la cabeza
const TAIL_COLOR = 0x1f6e43;  // verde profundo de la cola
const BONUS_EVERY = 5;      // cada cuántas manzanas aparece la Fruta del Origen
const BONUS_TIME = 8000;    // ms que dura la Fruta del Origen (igual que en la landing: 8 segundos)
const LEVEL_POINTS = 100;   // puntos para pasar al siguiente escenario
const POWER_TIME = 7000;    // ms que un poder se queda en el tablero
const SLOW_FACTOR = 1.6;    // cuánto más lento va la serpiente con el poder Lento

// Capas de dibujo (mayor = encima)
const DEPTH = { bg: 0, ambient: 1, items: 2, snake: 3, fx: 4, hud: 10, banner: 15, overlay: 20 };

const DIRS = {
  ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 }
};

const POWERS = {
  slow: { label: 'Lento', color: 0x3d5bd9, time: 6000 },
  double: { label: 'Puntos x2', color: 0xf2b33d, time: 10000 },
  shield: { label: 'Escudo', color: 0x3fae6a },
  cut: { label: 'Tijeras', color: 0xe2512f }
};

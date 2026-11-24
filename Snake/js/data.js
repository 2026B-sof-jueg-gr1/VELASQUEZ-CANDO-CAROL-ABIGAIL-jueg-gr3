// Todos los textos y datos de la historia viven aquí, para poder cambiarlos sin tocar la lógica.
// Por ahora solo se usan los nombres de las tierras; el resto lo irán usando las fases siguientes.

const STUDIO = { name: 'AMARU STUDIO', members: ['Carol Velásquez'], madeWith: 'Hecho con Phaser 3' };

// Un material: nombre, forma con la que se dibuja (ver drawMaterial en draw.js) y color
const M = (name, shape, color) => ({ name, shape, color });


// ---- Mapas de cada tierra: bordes y piedras, colocados a mano ----
// Coordenadas de celda: x de 0 a 39, y de 0 a 29. La orilla de afuera (x -1 / 40, y -1 / 30) es solo el marco.
// edges: 'open' = se cruza por toda la orilla, 'closed' = pared de piedras, 'gap' = pared con huecos.
// gapsX = columnas de los huecos de arriba y abajo (iguales en los dos lados); gapsY = filas de los huecos de izquierda y derecha.
const hbar = (y, x0, x1) => { const r = []; for (let x = x0; x <= x1; x++) r.push([x, y]); return r; };
const vbar = (x, y0, y1) => { const r = []; for (let y = y0; y <= y1; y++) r.push([x, y]); return r; };
const OPEN_EDGES = { T: 'open', B: 'open', L: 'open', R: 'open' };
const GAP_EDGES = { T: 'gap', B: 'gap', L: 'gap', R: 'gap' };

// Las cinco tierras, en orden. `scenario` es la posición en SCENARIOS (js/draw.js).
const LEVELS = [
  {
    id: 'bosque', name: 'Bosque', scenario: 0,
    materials: [M('Semilla', 'seed', 0x8b5a2b), M('Rocío', 'drop', 0x7fd6ff), M('Hoja dorada', 'leaf', 0xf2b33d)],
    friend: 'musgo', enemy: 'hormigas', memory: 'guardiana',
    edges: OPEN_EDGES, gapsX: [], gapsY: [], rocks: [],
  },
  {
    id: 'desierto', name: 'Desierto', scenario: 1,
    materials: [M('Cristal de arena', 'crystal', 0xe8c36f), M('Agua de oasis', 'drop', 0x2fb7c8), M('Pluma de cóndor', 'feather', 0x2b2b35)],
    friend: 'duna', enemy: 'escorpiones', memory: 'ninez',
    edges: OPEN_EDGES, gapsX: [], gapsY: [],
    // (versión aprobada antes de la regla de aterrizaje: [8,7] [9,7] [8,8] [30,6] [31,6] [31,22] [32,22] [32,21])
    rocks: [[12, 12], [13, 12], [12, 13], [26, 11], [27, 11], [27, 18], [28, 18], [28, 17]],
  },
  {
    id: 'nieve', name: 'Nieve', scenario: 2,
    materials: [M('Hielo de glaciar', 'crystal', 0x9fd8f0), M('Flor de chuquiragua', 'flower', 0xe8762d), M('Lana de vicuña', 'wool', 0xd9b98a)],
    friend: 'escarcha', enemy: 'hielo', memory: 'hermana_enferma',
    edges: { T: 'gap', B: 'gap', L: 'open', R: 'open' }, gapsX: [[8, 11], [28, 31]], gapsY: [],
    // (barras aprobadas antes de la regla de aterrizaje: fila 15 columnas 5-8 y fila 14 columnas 31-34)
    rocks: [].concat(hbar(9, 14, 15), hbar(10, 14, 15), hbar(19, 25, 26), hbar(20, 25, 26), hbar(15, 10, 13), hbar(14, 26, 29)),
  },
  {
    id: 'volcan', name: 'Volcán', scenario: 3,
    materials: [M('Piedra pómez', 'rock', 0xb9b2a6), M('Azufre', 'shards', 0xf1d93a), M('Obsidiana', 'crystal', 0x3a3a4a)],
    friend: 'brasa', enemy: 'lava', memory: 'leyenda',
    edges: GAP_EDGES, gapsX: [[10, 13]], gapsY: [[6, 9]],
    rocks: [].concat(vbar(15, 17, 22), vbar(27, 7, 12), hbar(22, 24, 29), hbar(11, 8, 13)),
  },
  {
    id: 'noche', name: 'Noche', scenario: 4,
    materials: [M('Luz de luciérnaga', 'orb', 0xd4ff6b), M('Rocío lunar', 'drop', 0xbcd0ff), M('Flor nocturna', 'flower', 0xb48cff)],
    friend: 'luna', enemy: 'murcielagos', memory: 'caminata',
    edges: GAP_EDGES, gapsX: [[31, 33]], gapsY: [[4, 6]],
    // 30 piedras; si se siente muy difícil, quitar el arco de abajo a la derecha (quedan 20)
    rocks: [].concat(hbar(11, 6, 11), vbar(6, 12, 15), vbar(29, 17, 20), hbar(21, 24, 29), hbar(8, 24, 29), vbar(24, 9, 12)),
  }
];

// Enemigos de cada tierra (los ids son LEVELS[i].enemy). Tiempos en ms; cap = máximo a la vez.
const ENEMIES = {
  hormigas: { name: 'Hormigas', step: 230, cap: 2, len: 4 },
  escorpiones: { name: 'Escorpiones', step: 160, cap: 2 },
  hielo: { name: 'Bloques de hielo', slide: 90, rest: 1000, maxSlide: 25, cap: 3 },
  lava: { name: 'Culebras de lava', warn: 1000, up: 2000, restMin: 1500, restMax: 3000, cap: 3 },
  murcielagos: { name: 'Murciélagos', step: 130, zig: 3, cap: 3 }
};

// Miniserpientes amigas. `power` es lo que harán en la batalla final.
const FRIENDS = {
  musgo: { name: 'Musgo', color: 0x3fae6a, memory: 'trepar', power: 'Escudo: aguanta un golpe' },
  duna: { name: 'Duna', color: 0xe0b469, memory: 'mochila', power: 'Golpe doble: el siguiente daño cuenta por dos' },
  escarcha: { name: 'Escarcha', color: 0xcfe6f2, memory: 'curandero', power: 'Congela a la mega serpiente por 5 s' },
  brasa: { name: 'Brasa', color: 0xe2512f, memory: 'arbol', power: 'Corte: le quita el 30 % de la cola' },
  luna: { name: 'Luna', color: 0x3d5bd9, memory: 'entrada', power: 'Visión: marca hacia dónde se mueve' }
};

// Recuerdos. `orden` (1 a 10) es la posición correcta para el puzzle final.
const MEMORIES = {
  ninez: { orden: 1, titulo: 'Inti de niño jugando con su hermana' },
  trepar: { orden: 2, titulo: 'Inti le enseña a su hermana a trepar árboles' },
  hermana_enferma: { orden: 3, titulo: 'La hermana enferma en cama' },
  curandero: { orden: 4, titulo: 'El curandero dice que no hay cura' },
  leyenda: { orden: 5, titulo: 'Una anciana cuenta la leyenda del árbol que cura' },
  mochila: { orden: 6, titulo: 'Inti prepara su mochila y se despide' },
  caminata: { orden: 7, titulo: 'Inti caminando de noche hacia el bosque' },
  entrada: { orden: 8, titulo: 'Inti cruza la entrada del bosque prohibido' },
  arbol: { orden: 9, titulo: 'Inti frente al árbol sagrado' },
  guardiana: { orden: 10, titulo: 'El rostro de la guardiana al descubrirlo mordiendo la fruta' }
};

// Textos de la historia. Cada página puede llevar: text, art (ilustración), speaker (quién habla) y title.
const STORY = {
  // Intro de una partida nueva. No revela por qué Inti entró al bosque.
  intro: [
    { art: 'bosque_borde', text: 'Inti, un explorador, llegó al borde del bosque prohibido. Dicen que nadie sale de allí siendo el mismo.' },
    { art: 'mordisco', text: 'Entre las raíces encontró un árbol sagrado. Sin pensarlo dos veces, mordió su fruta.' },
    { art: 'guardiana_aparece', text: 'Entonces apareció la guardiana del bosque. Sus ojos brillaban como oro viejo.' },
    { art: 'serpiente', speaker: 'La guardiana', text: '«Tomaste lo que no era tuyo. Vivirás como serpiente.» Y su forma humana se rompió en cinco fragmentos.' },
    { art: 'tierras', text: 'Cada fragmento duerme en una tierra distinta: el bosque, el desierto, la nieve, el volcán y la noche.' },
    { art: 'fruta_origen', speaker: 'La guardiana', text: '«En cada una crece una Fruta del Origen. Solo brota si le ofreces tres materiales de ese lugar. Cómela y recuperarás un pedazo de ti.»' }
  ],
  // Lo que dice la guardiana antes de cada nivel (en el mismo orden que LEVELS)
  levels: [
    'Aquí empezó tu falta. Reúne la semilla, el rocío y la hoja dorada.',
    'El desierto no perdona a quien camina sin rumbo. Busca el cristal de arena, el agua del oasis y la pluma de cóndor.',
    'En las alturas el frío congela hasta los recuerdos. Hielo de glaciar, flor de chuquiragua y lana de vicuña te esperan.',
    'El volcán quema lo que sobra y deja lo verdadero. Piedra pómez, azufre y obsidiana.',
    'La última tierra es la más oscura. Luz de luciérnaga, rocío lunar y flor nocturna.'
  ],
  // Provisional: se reemplaza cuando exista el puzzle de la puerta
  finale: [
    { art: 'fruta_origen', text: 'Recorriste las cinco tierras y recuperaste cinco recuerdos. Pero la puerta de regreso aún no se abre.' },
    { speaker: 'La guardiana', text: '«Vuelve pronto, Inti. Todavía te falta ordenar tu memoria.»' }
  ]
};

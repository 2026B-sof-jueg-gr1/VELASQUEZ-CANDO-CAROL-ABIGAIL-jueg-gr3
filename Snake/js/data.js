// Todos los textos y datos de la historia viven aquí, para poder cambiarlos sin tocar la lógica.
// Por ahora solo se usan los nombres de las tierras; el resto lo irán usando las fases siguientes.

const STUDIO = { name: 'AMARU STUDIO', members: ['Carol Velásquez'], madeWith: 'Hecho con Phaser 3' };

// Las cinco tierras, en orden. `scenario` es la posición en SCENARIOS (js/draw.js).
const LEVELS = [
  {
    id: 'bosque', name: 'Bosque', scenario: 0,
    materials: ['Semilla', 'Rocío', 'Hoja dorada'],
    friend: 'musgo', enemy: 'hormigas', memory: 'guardiana'
  },
  {
    id: 'desierto', name: 'Desierto', scenario: 1,
    materials: ['Cristal de arena', 'Agua de oasis', 'Pluma de cóndor'],
    friend: 'duna', enemy: 'escorpiones', memory: 'ninez'
  },
  {
    id: 'nieve', name: 'Nieve', scenario: 2,
    materials: ['Hielo de glaciar', 'Flor de chuquiragua', 'Lana de vicuña'],
    friend: 'escarcha', enemy: 'hielo', memory: 'hermana_enferma'
  },
  {
    id: 'volcan', name: 'Volcán', scenario: 3,
    materials: ['Piedra pómez', 'Azufre', 'Obsidiana'],
    friend: 'brasa', enemy: 'lava', memory: 'leyenda'
  },
  {
    id: 'noche', name: 'Noche', scenario: 4,
    materials: ['Luz de luciérnaga', 'Rocío lunar', 'Flor nocturna'],
    friend: 'luna', enemy: 'murcielagos', memory: 'caminata'
  }
];

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

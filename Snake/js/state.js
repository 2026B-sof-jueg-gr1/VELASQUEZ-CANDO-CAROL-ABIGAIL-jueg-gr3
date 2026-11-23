// Estado de la partida (compartido entre escenas) y guardado en localStorage.
// Es como una libreta: cada escena la lee y la actualiza, y al terminar un nivel se guarda.

// Récord de puntos (se guarda aparte de la partida)
function loadBest() {
  try { return Number(localStorage.getItem('snake-best')) || 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('snake-best', String(v)); } catch (e) { /* sin storage */ }
}

const SAVE_KEY = 'amaru-save';
const ENDINGS_KEY = 'amaru-endings';
const SAVE_VERSION = 1;

const GameState = {
  level: 1,          // tierra actual, de 1 a 5
  materials: 0,      // materiales del nivel actual, de 0 a 3
  friends: [],       // ids de los amigos conseguidos (ver FRIENDS en data.js)
  memories: [],      // ids de los recuerdos conseguidos (ver MEMORIES en data.js)
  ending: null,      // 'casa' o 'guardian' cuando se elige el final

  reset() {
    this.level = 1;
    this.materials = 0;
    this.friends = [];
    this.memories = [];
    this.ending = null;
  },

  // Datos que se guardan en el navegador
  toJSON() {
    return {
      v: SAVE_VERSION, level: this.level, materials: this.materials,
      friends: this.friends, memories: this.memories, ending: this.ending
    };
  },

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.toJSON())); } catch (e) { /* sin storage */ }
  },

  // Devuelve true si había una partida guardada válida y la cargó
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d || d.v !== SAVE_VERSION) return false;
      this.level = Phaser.Math.Clamp(Number(d.level) || 1, 1, LEVELS.length);
      this.materials = Phaser.Math.Clamp(Number(d.materials) || 0, 0, 3);
      this.friends = Array.isArray(d.friends) ? d.friends.filter((f) => FRIENDS[f]) : [];
      this.memories = Array.isArray(d.memories) ? d.memories.filter((m) => MEMORIES[m]) : [];
      this.ending = d.ending === 'casa' || d.ending === 'guardian' ? d.ending : null;
      return true;
    } catch (e) { return false; }
  },

  hasSave() {
    try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return !!d && d.v === SAVE_VERSION; } catch (e) { return false; }
  },

  clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* sin storage */ }
  },

  // Guarda un recuerdo recuperado (una sola vez) y la partida
  addMemory(id) {
    if (MEMORIES[id] && !this.memories.includes(id)) this.memories.push(id);
    this.save();
  },

  // Datos del nivel actual (nombre, materiales, amigo...)
  current() { return LEVELS[this.level - 1]; }
};

// Finales que ya se han visto (se mostrarán en el menú)
function loadEndingsSeen() {
  try { const e = JSON.parse(localStorage.getItem(ENDINGS_KEY)); return Array.isArray(e) ? e : []; } catch (err) { return []; }
}
function saveEndingSeen(id) {
  const seen = loadEndingsSeen();
  if (!seen.includes(id)) seen.push(id);
  try { localStorage.setItem(ENDINGS_KEY, JSON.stringify(seen)); } catch (e) { /* sin storage */ }
}

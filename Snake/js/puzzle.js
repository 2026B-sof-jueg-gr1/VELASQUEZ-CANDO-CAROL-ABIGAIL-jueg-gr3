// Lógica del puzzle de la puerta (sin dibujo, para poder probarla aparte).
// Cada casilla guarda el id de un recuerdo o null. El orden correcto sale del campo `orden` de MEMORIES (data.js):
// como hay una casilla por recuerdo, el orden relativo de los que hay es también su casilla exacta.

// Los ids de los recuerdos ordenados de la primera a la última casilla
function puzzleOrder(ids) {
  return ids.slice().sort((a, b) => MEMORIES[a].orden - MEMORIES[b].orden);
}

// ¿Todas las casillas están llenas y en orden?
function puzzleCorrect(slots) {
  if (slots.some((s) => s === null || s === undefined)) return false;
  return puzzleOrder(slots).every((id, i) => slots[i] === id);
}

// Las casillas que no tienen el recuerdo que les toca
function puzzleWrongSlots(slots) {
  const want = puzzleOrder(slots.filter((s) => s));
  const out = [];
  slots.forEach((id, i) => { if (id !== want[i]) out.push(i); });
  return out;
}

// La ayuda: el recuerdo que va primero entre los que no están en su casilla, y la casilla que le toca.
// `allIds` son todos los recuerdos del puzzle (por si algunas casillas aún están vacías).
function puzzleHint(slots, allIds) {
  const want = puzzleOrder(allIds || slots.filter((s) => s));
  for (let i = 0; i < want.length; i++) {
    if (slots[i] !== want[i]) return { id: want[i], slot: i };
  }
  return null;
}

// Baraja los recuerdos y se asegura de que no queden ya en orden
function puzzleShuffle(ids) {
  const a = ids.slice();
  if (a.length < 2) return a;
  do {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } while (puzzleOrder(a).every((id, i) => a[i] === id));
  return a;
}

// Comprobación para la tecla V del modo debug: devuelve { ok, problems }
function validatePuzzle() {
  const problems = [];
  const ids = Object.keys(MEMORIES);
  const ordenes = ids.map((id) => MEMORIES[id].orden).sort((a, b) => a - b);
  if (ordenes.join() !== '1,2,3,4,5,6,7,8,9,10') problems.push('puzzle: los `orden` de MEMORIES no son 1 a 10 sin repetir');
  ids.forEach((id) => { if (typeof MEMORY_ART !== 'undefined' && !MEMORY_ART[id]) problems.push('puzzle: falta la ilustración de ' + id); });
  // con los 5 recuerdos de las tierras, con los 10, y con un par cambiado
  [LEVELS.map((l) => l.memory), ids].forEach((set) => {
    const sorted = puzzleOrder(set);
    if (!puzzleCorrect(sorted)) problems.push('puzzle: el orden correcto de ' + set.length + ' recuerdos no pasa');
    if (set.length > 1) {
      const swapped = sorted.slice();
      [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
      if (puzzleCorrect(swapped)) problems.push('puzzle: un par cambiado de ' + set.length + ' recuerdos pasa por correcto');
      const h = puzzleHint(swapped);
      if (!h || h.id !== sorted[0] || h.slot !== 0) problems.push('puzzle: la ayuda de ' + set.length + ' recuerdos no señala el primero');
    }
    if (puzzleShuffle(set).length !== set.length) problems.push('puzzle: la mezcla pierde recuerdos');
  });
  return { ok: problems.length === 0, problems };
}

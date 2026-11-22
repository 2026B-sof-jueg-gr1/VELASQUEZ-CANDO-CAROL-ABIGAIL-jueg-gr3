// Modo debug: solo se activa con ?debug=1 en la URL. Sirve para probar y para la presentación.
//   N = siguiente nivel   M = dar los 3 materiales   B = batalla final   R = puzzle de recuerdos
const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

// Atajos que funcionan dentro de una escena de juego. Devuelve true si la tecla era de debug.
function debugKey(scene, code) {
  if (!DEBUG) return false;
  if (code === 'KeyN') {
    if (scene.debugNextLevel) scene.debugNextLevel();
  } else if (code === 'KeyM') {
    GameState.materials = 3;
    debugToast(scene, 'Debug: 3 materiales');
  } else if (code === 'KeyB') {
    debugGo(scene, 'BossScene', 'la batalla final');
  } else if (code === 'KeyR') {
    debugGo(scene, 'MemoryPuzzleScene', 'el puzzle de recuerdos');
  } else {
    return false;
  }
  return true;
}

// Salta a una escena si ya existe; si todavía no se ha construido, lo avisa en pantalla
function debugGo(scene, key, label) {
  if (scene.scene.manager.keys[key]) scene.scene.start(key);
  else debugToast(scene, 'Debug: ' + label + ' aún no existe');
}

function debugToast(scene, text) {
  const t = scene.add.text(400, 560, text, {
    fontFamily: FONT_BODY, fontSize: '16px', color: '#1a1204', backgroundColor: '#f2b33d', padding: { x: 10, y: 4 }
  }).setOrigin(0.5).setDepth(DEPTH.overlay + 1);
  scene.tweens.add({ targets: t, alpha: 0, delay: 1200, duration: 500, onComplete: () => t.destroy() });
}

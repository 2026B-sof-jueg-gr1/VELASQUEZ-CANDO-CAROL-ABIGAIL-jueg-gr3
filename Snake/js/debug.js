// Modo debug: solo se activa con ?debug=1 en la URL. Sirve para probar y para la presentación.
//   N = siguiente nivel   M = dar los 3 materiales   G = cámara del recuerdo   B = batalla final   R = puzzle de recuerdos
//   E = sacar un enemigo ya   L = ver aterrizaje / trampas / casillas de aparición
//   F = sacar a la amiga ya   H = unirla ya (abre su recuerdo)
//   K = los finales (la guardiana pregunta; en la pregunta, C cambia quién lleva la fruta)
//   T = contador de cuadros por segundo (para mirar el rendimiento en el celular; ?touch=1 simula la pantalla táctil)
//   V = validar los mapas de las 5 tierras (resultado en la consola)
const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

// Atajos que funcionan dentro de una escena de juego. Devuelve true si la tecla era de debug.
function debugKey(scene, code) {
  if (!DEBUG) return false;
  if (code === 'KeyN') {
    if (scene.debugNextLevel) scene.debugNextLevel();
  } else if (code === 'KeyM') {
    if (scene.debugMaterials) scene.debugMaterials();
  } else if (code === 'KeyG') {
    scene.scene.start('MemoryRingScene', { memory: GameState.current().memory, after: 'debug' });
  } else if (code === 'KeyF') {
    if (scene.debugFriend) scene.debugFriend();
  } else if (code === 'KeyH') {
    if (scene.debugFriendJoin) scene.debugFriendJoin();
  } else if (code === 'KeyE') {
    if (scene.debugEnemy) scene.debugEnemy();
  } else if (code === 'KeyL') {
    if (scene.debugOverlay) scene.debugOverlay();
  } else if (code === 'KeyV') {
    const ok = validateAllWorlds();
    debugToast(scene, ok ? 'Validador: los 5 niveles pasan' : 'Validador: hay avisos (consola)');
  } else if (code === 'KeyB') {
    debugGo(scene, 'BossScene', 'la batalla final');
  } else if (code === 'KeyT') {
    toggleFps(scene);
  } else if (code === 'KeyK') {
    if (scene.scene.manager.keys.EndingScene) scene.scene.start('EndingScene', { part: 'choose', test: true });
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

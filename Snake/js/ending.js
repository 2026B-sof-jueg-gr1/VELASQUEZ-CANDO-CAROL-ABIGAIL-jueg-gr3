// Los dos finales y los créditos, sin dibujo, para poder comprobarlos aparte (ver EndingScene.js y ENDING en data.js).
//   'casa'     → las amigas se despiden e Inti llega a su casa con la fruta para su hermana.
//   'guardian' → Inti se queda a cuidar a las amigas; Luna lleva la fruta a la hermana. Si Luna no se unió,
//                la lleva la última amiga que se unió; y si no hay ninguna, la guardiana.

// Quién lleva la fruta en el final del guardián: 'luna', el id de la última amiga que se unió, o 'guardiana'
function endingCarrier(friends) {
  if (friends.includes('luna')) return 'luna';
  return friends.length ? friends[friends.length - 1] : 'guardiana';
}

function carrierName(id) {
  return id === 'guardiana' ? 'La guardiana' : FRIENDS[id].name;
}

// "Musgo", "Musgo y Duna", "Musgo, Duna y Luna"
function nameList(ids) {
  const names = ids.map((id) => FRIENDS[id].name);
  return names.length <= 1 ? names.join('') : names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
}

// Las páginas de historia de un final, según las amigas que se unieron (en el orden en que se unieron)
function endingPages(id, friends) {
  const T = ENDING.text;
  if (id === 'casa') {
    return [
      friends.length
        ? { art: 'despedida', text: nameList(friends) + T.farewell[friends.length > 1 ? 1 : 0] }
        : { art: 'guardiana_aparece', speaker: 'La guardiana', text: T.farewellAlone },
      { art: 'casa_llegada', text: T.arrive },
      { art: 'hermana_sana', text: T.healed }
    ];
  }
  const carrier = endingCarrier(friends);
  return [
    { art: 'guardiana_aparece', speaker: 'La guardiana', text: T.stay },
    { art: 'carry:' + carrier, text: carrier === 'guardiana' ? T.carryGuardian : carrierName(carrier) + T.carry },
    { art: 'hermana_sana', text: T.healedGuardian },
    { art: 'tierras', text: friends.length ? T.guardianEnd : T.guardianEndAlone }
  ];
}

// Líneas de los créditos: k es el tipo de línea (title, sub, small, big, name, gap)
function creditsLines() {
  const L = [{ t: 'AMARU', k: 'title' }, { t: 'la Fruta del Origen', k: 'sub' }, { t: '', k: 'gap' },
    { t: 'Un juego de', k: 'small' }, { t: STUDIO.name, k: 'big' }, { t: '', k: 'gap' },
    { t: 'Equipo', k: 'small' }];
  STUDIO.members.forEach((m) => L.push({ t: m, k: 'name' }));
  L.push({ t: '', k: 'gap' }, { t: STUDIO.madeWith, k: 'small' }, { t: '', k: 'gap' }, { t: ENDING.text.thanks, k: 'sub' });
  return L;
}

// Comprobación para la tecla V del modo debug: devuelve { ok, problems }
function validateEndings() {
  const problems = [];
  const T = ENDING.text;
  // quién lleva la fruta
  const carry = [[[], 'guardiana'], [['luna'], 'luna'], [['musgo', 'duna'], 'duna'], [['luna', 'musgo', 'duna'], 'luna'], [['duna', 'musgo', 'luna', 'brasa'], 'luna'], [['brasa', 'escarcha'], 'escarcha']];
  carry.forEach(([f, want]) => { if (endingCarrier(f) !== want) problems.push('finales: con ' + (f.join('/') || 'ninguna amiga') + ' debería llevar la fruta ' + want + ' y lleva ' + endingCarrier(f)); });

  // las dos opciones y los textos
  ['casa', 'guardian'].forEach((id) => {
    const o = ENDING.options[id];
    if (!o || !o.label || !o.sub) problems.push('finales: falta la opción ' + id);
  });
  if (!ENDING.ask) problems.push('finales: falta la pregunta de la guardiana');
  Object.keys(T).forEach((k) => { if (!T[k] || (Array.isArray(T[k]) && T[k].some((x) => !x))) problems.push('finales: texto vacío en ' + k); });

  // las páginas de cada final con distintas combinaciones de amigas: con texto y con ilustración que exista
  const stub = new Proxy({}, { get: () => () => {} });
  const known = (name) => name.startsWith('land:') || (name.startsWith('carry:') && (name === 'carry:guardiana' || !!FRIENDS[name.slice(6)])) || !!MEMORY_ART[name] || !!STORY_ART[name];
  const sets = [[], ['luna'], ['musgo', 'duna'], ['luna', 'musgo', 'duna', 'escarcha', 'brasa'], ['brasa']];
  ['casa', 'guardian'].forEach((id) => sets.forEach((f) => {
    const pages = endingPages(id, f);
    const tag = 'final ' + id + ' con ' + (f.join('/') || 'ninguna amiga');
    if (pages.length < 3) problems.push('finales: ' + tag + ' tiene menos de 3 páginas');
    pages.forEach((p, i) => {
      if (!p.text || /undefined|\{n\}/.test(p.text)) problems.push('finales: ' + tag + ', página ' + (i + 1) + ' sin texto o con un dato roto');
      if (!p.art || !known(p.art)) problems.push('finales: ' + tag + ', página ' + (i + 1) + ' usa una ilustración que no existe (' + p.art + ')');
    });
  }));
  // las ilustraciones nuevas se dibujan sin errores
  ['despedida', 'casa_llegada', 'hermana_sana'].forEach((n) => { try { STORY_ART[n](stub); } catch (e) { problems.push('finales: la ilustración ' + n + ' falla: ' + e.message); } });
  Object.keys(FRIENDS).concat('guardiana').forEach((id) => { try { STORY_ART.portador(stub, id); } catch (e) { problems.push('finales: la ilustración del portador ' + id + ' falla: ' + e.message); } });

  // créditos
  const lines = creditsLines().map((l) => l.t);
  if (!lines.includes(STUDIO.name)) problems.push('créditos: falta el nombre del estudio');
  STUDIO.members.forEach((m) => { if (!lines.includes(m)) problems.push('créditos: falta ' + m); });
  if (!lines.includes(STUDIO.madeWith)) problems.push('créditos: falta "' + STUDIO.madeWith + '"');
  if (!/Phaser 3/.test(STUDIO.madeWith)) problems.push('créditos: debe decir que está hecho con Phaser 3');
  return { ok: problems.length === 0, problems };
}

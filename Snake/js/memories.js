// Ilustraciones de los recuerdos y de la historia, dibujadas con formas (sin imágenes).
// Cada una se dibuja centrada en (0,0) dentro de un cuadro de 240 x 240 (de -120 a 120).

// ---------- Ayudantes de dibujo ----------

// Fondo de dos colores: arriba el cielo/pared y abajo el suelo
function artBg(g, top, bottom, horizon = 20) {
  g.fillStyle(top);
  g.fillRect(-120, -120, 240, 240);
  g.fillStyle(bottom);
  g.fillRect(-120, horizon, 240, 120 - horizon);
}

// Persona sencilla: los pies están en (x, y) y h es la altura
function artPerson(g, x, y, h, color, pack = false) {
  const skin = 0xe3b48c;
  if (pack) { g.fillStyle(0x6b4423); g.fillRoundedRect(x - h * 0.27, y - h * 0.6, h * 0.2, h * 0.34, 3); }
  g.fillStyle(color);
  g.fillRoundedRect(x - h * 0.13, y - h * 0.62, h * 0.26, h * 0.42, 3);
  g.fillStyle(0x2b1d14);
  g.fillRect(x - h * 0.1, y - h * 0.22, h * 0.07, h * 0.22);
  g.fillRect(x + h * 0.03, y - h * 0.22, h * 0.07, h * 0.22);
  g.fillStyle(skin);
  g.fillCircle(x, y - h * 0.72, h * 0.14);
  g.fillStyle(0x2b1d14);
  g.fillEllipse(x, y - h * 0.8, h * 0.28, h * 0.14);
}

function artTree(g, x, y, h, leaf = 0x2f7d43) {
  g.fillStyle(0x6b4423);
  g.fillRect(x - h * 0.08, y - h * 0.5, h * 0.16, h * 0.5);
  g.fillStyle(leaf);
  g.fillCircle(x, y - h * 0.65, h * 0.32);
  g.fillCircle(x - h * 0.22, y - h * 0.5, h * 0.22);
  g.fillCircle(x + h * 0.22, y - h * 0.5, h * 0.22);
}

function artFruit(g, x, y, r, bite = false, bg = 0x12301f) {
  g.fillStyle(PAL.gold, 0.18); g.fillCircle(x, y, r * 2.3);
  g.fillStyle(PAL.goldDark); g.fillCircle(x, y + r * 0.1, r * 1.05);
  g.fillStyle(PAL.gold); g.fillCircle(x, y, r);
  g.fillStyle(PAL.goldLight, 0.9); g.fillCircle(x - r * 0.35, y - r * 0.35, r * 0.3);
  g.fillStyle(PAL.scale); g.fillEllipse(x + r * 0.5, y - r * 1.05, r * 0.8, r * 0.4);
  if (bite) { g.fillStyle(bg); g.fillCircle(x + r * 0.95, y - r * 0.3, r * 0.5); g.fillCircle(x + r * 0.95, y + r * 0.35, r * 0.4); }
}

// ---------- Los 10 recuerdos ----------

const MEMORY_ART = {
  // 1. Inti de niño jugando con su hermana
  ninez(g) {
    artBg(g, 0x9fd8f0, 0x4a9c4a, 30);
    g.fillStyle(0xfff3b0); g.fillCircle(-75, -78, 20);
    g.fillStyle(0xe2512f); g.fillPoints([{ x: 65, y: -90 }, { x: 85, y: -62 }, { x: 65, y: -34 }, { x: 45, y: -62 }], true);
    g.lineStyle(2, 0xffffff); g.lineBetween(65, -34, -15, 40);
    g.fillStyle(0xf2b33d); g.fillTriangle(66, -34, 58, -20, 74, -20);
    artPerson(g, -20, 85, 78, 0x3d5bd9);
    artPerson(g, 20, 92, 60, 0xf2b33d);
  },
  // 2. Inti le enseña a su hermana a trepar árboles
  trepar(g) {
    artBg(g, 0xb7e3c4, 0x3f7a35, 62);
    g.fillStyle(0x6b4423); g.fillRect(14, -70, 30, 160);
    g.fillRect(-30, -30, 50, 10);
    g.fillStyle(0x2f7d43); g.fillCircle(30, -88, 50); g.fillCircle(-12, -70, 36); g.fillCircle(76, -70, 36);
    artPerson(g, -20, -26, 46, 0x3d5bd9);
    artPerson(g, -62, 95, 62, 0xf2b33d);
    g.lineStyle(3, 0xe3b48c); g.lineBetween(-56, 66, -40, 40);
  },
  // 3. La hermana enferma en cama
  hermana_enferma(g) {
    artBg(g, 0x2a1f2e, 0x3a2a22, 62);
    g.fillStyle(0x16224a); g.fillRect(-98, -92, 56, 66);
    g.fillStyle(0xefe6d2); g.fillCircle(-62, -66, 11);
    g.fillStyle(0x16224a); g.fillCircle(-58, -70, 10);
    g.lineStyle(3, 0x6b4423); g.strokeRect(-98, -92, 56, 66); g.lineBetween(-70, -92, -70, -26);
    g.fillStyle(0x5a3a22); g.fillRect(-112, 46, 190, 38); g.fillRect(-112, 20, 10, 64);
    g.fillStyle(0xdcd0b8); g.fillRoundedRect(-106, 30, 178, 24, 6);
    g.fillStyle(0xffffff); g.fillRoundedRect(-104, 22, 44, 18, 8);
    g.fillStyle(0xe3b48c); g.fillCircle(-84, 24, 12);
    g.fillStyle(0x2b1d14); g.fillEllipse(-90, 17, 26, 12);
    g.fillStyle(0x6a8fb0); g.fillRoundedRect(-60, 26, 128, 34, 8);
    g.fillStyle(0x5a3a22); g.fillRect(88, 30, 22, 54);
    g.fillStyle(0xefe6d2); g.fillRect(94, 10, 10, 20);
    g.fillStyle(PAL.gold); g.fillEllipse(99, 4, 8, 14);
  },
  // 4. El curandero dice que no hay cura
  curandero(g) {
    artBg(g, 0x3b2a1a, 0x2a1d12, 70);
    g.fillStyle(0x7a3a2a); g.fillTriangle(-34, 100, 34, 100, 0, -22);
    g.fillStyle(0xe3b48c); g.fillCircle(0, -38, 17);
    [[-14, 0x2fb7c8], [0, 0xe2512f], [14, 0xf2b33d]].forEach(([dx, c], i) => {
      g.fillStyle(c); g.fillEllipse(dx, -62 - (i === 1 ? 6 : 0), 9, 26);
    });
    g.fillStyle(0x2b1d14); g.fillCircle(-6, -40, 2); g.fillCircle(6, -40, 2);
    g.lineStyle(4, 0xe3b48c); g.lineBetween(-24, 20, 18, 52); g.lineBetween(24, 20, -18, 52);
    g.lineStyle(4, 0x6b4423); g.lineBetween(62, -70, 62, 100);
    g.fillStyle(PAL.gold); g.fillCircle(62, -74, 8);
    g.fillStyle(0x4a3220); g.fillEllipse(-76, 90, 44, 18);
    g.fillStyle(0x6b4423); g.fillRect(-98, 80, 44, 10);
    g.lineStyle(2, 0xefe6d2, 0.6); g.lineBetween(-80, 72, -76, 56); g.lineBetween(-70, 72, -66, 52);
  },
  // 5. Una anciana cuenta la leyenda del árbol que cura
  leyenda(g) {
    artBg(g, 0x1b1a2e, 0x3a2a22, 72);
    g.fillStyle(0xefe6d2, 0.9); g.fillEllipse(48, -48, 118, 84);
    g.fillTriangle(10, -14, 24, -10, -6, 20);
    g.fillStyle(0x6b4423); g.fillRect(44, -56, 8, 30);
    g.fillStyle(0x2f7d43); g.fillCircle(48, -66, 22); g.fillCircle(30, -56, 14); g.fillCircle(66, -56, 14);
    g.fillStyle(PAL.gold); g.fillCircle(48, -70, 5);
    g.fillStyle(0xb0605a); g.fillTriangle(-96, 92, -34, 92, -66, 24);
    g.fillStyle(0xe3b48c); g.fillCircle(-66, 14, 14);
    g.fillStyle(0xdddddd); g.fillEllipse(-66, 6, 30, 16);
    g.fillStyle(0x4a3220); g.fillEllipse(0, 96, 56, 14);
    g.fillStyle(0xe2512f); g.fillTriangle(-16, 92, 16, 92, 0, 52);
    g.fillStyle(PAL.gold); g.fillTriangle(-8, 92, 8, 92, 0, 68);
  },
  // 6. Inti prepara su mochila y se despide
  mochila(g) {
    artBg(g, 0xf4b183, 0x7a5a3a, 56);
    g.fillStyle(PAL.gold); g.fillCircle(80, 56, 28);
    g.fillStyle(0x5a3a22); g.fillRect(-104, -84, 62, 154);
    g.fillStyle(0x1a1209); g.fillRect(-96, -76, 46, 146);
    g.fillStyle(0x3a2a22); g.fillTriangle(-96, -76, -64, -66, -96, 70);
    artPerson(g, 8, 90, 100, 0x3fae6a, true);
    g.lineStyle(4, 0xe3b48c); g.lineBetween(20, 46, 44, 8);
    g.fillStyle(0xe3b48c); g.fillCircle(46, 4, 5);
  },
  // 7. Inti caminando de noche hacia el bosque
  caminata(g) {
    artBg(g, 0x0f1a3a, 0x16240f, 40);
    g.fillStyle(0xefe6d2); g.fillCircle(52, -62, 30);
    g.fillStyle(0x0f1a3a); g.fillCircle(64, -70, 26);
    g.fillStyle(0xffffff, 0.9);
    [[-80, -90], [-30, -70], [-60, -30], [10, -100], [90, -20], [-98, -50]].forEach(([x, y]) => g.fillCircle(x, y, 1.6));
    g.fillStyle(0x0b1a10); g.fillTriangle(-120, 40, -60, -10, 0, 40); g.fillTriangle(-20, 40, 50, -20, 120, 40);
    g.fillStyle(0x8a7350); g.fillPoints([{ x: -6, y: 40 }, { x: 8, y: 40 }, { x: 60, y: 120 }, { x: -70, y: 120 }], true);
    artPerson(g, 2, 92, 52, 0xe2512f, true);
  },
  // 8. Inti cruza la entrada del bosque prohibido
  entrada(g) {
    artBg(g, 0x1c3a2c, 0x16301f, 60);
    g.fillStyle(PAL.gold, 0.25); g.fillPoints([{ x: -34, y: -40 }, { x: 34, y: -40 }, { x: 60, y: 120 }, { x: -60, y: 120 }], true);
    g.fillStyle(0x3d2a18); g.fillRect(-108, -120, 62, 240); g.fillRect(46, -120, 62, 240);
    g.fillStyle(0x2f7d43); g.fillEllipse(0, -96, 240, 70);
    g.fillStyle(0x4a3220); g.fillEllipse(-40, -66, 70, 18); g.fillEllipse(40, -66, 70, 18);
    g.fillStyle(0xefe6d2, 0.14); g.fillEllipse(-30, 60, 130, 28); g.fillEllipse(40, 86, 150, 30);
    artPerson(g, 0, 98, 54, 0xe2512f, true);
  },
  // 9. Inti frente al árbol sagrado
  arbol(g) {
    artBg(g, 0x12301f, 0x0d2216, 70);
    g.fillStyle(0x6b4423); g.fillTriangle(-30, 100, 30, 100, 0, -10); g.fillRect(-14, -44, 28, 80);
    g.fillStyle(0x2f7d43); g.fillCircle(0, -70, 58); g.fillCircle(-46, -48, 38); g.fillCircle(46, -48, 38);
    g.fillStyle(0x3fae6a); g.fillCircle(-12, -84, 30);
    artFruit(g, 0, -56, 11);
    artPerson(g, -66, 100, 50, 0xe2512f, true);
  },
  // 10. El rostro de la guardiana al descubrirlo mordiendo la fruta
  guardiana(g) {
    artBg(g, 0x0e2418, 0x0e2418, 120);
    g.fillStyle(0x2f7d43);
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI + (k * Math.PI) / 6;
      g.fillTriangle(Math.cos(a) * 44, -14 + Math.sin(a) * 52, Math.cos(a - 0.22) * 78, -14 + Math.sin(a - 0.22) * 84, Math.cos(a + 0.22) * 78, -14 + Math.sin(a + 0.22) * 84);
    }
    g.fillStyle(0x6fae7e); g.fillEllipse(0, -6, 92, 120);
    g.fillStyle(0x3a6b4a); g.fillEllipse(0, -34, 80, 26);
    for (const s of [-1, 1]) {
      g.fillStyle(0xf2c14e); g.fillEllipse(s * 22, -14, 24, 16);
      g.fillStyle(PAL.bg); g.fillEllipse(s * 22, -14, 5, 15);
      g.lineStyle(3, 0x1f4a2e); g.lineBetween(s * 36, -32, s * 12, -26);
    }
    g.lineStyle(3, 0x1f4a2e); g.lineBetween(-12, 34, 12, 34);
    artFruit(g, 0, 90, 20, true, 0x0e2418);
  }
};

// ---------- Ilustraciones de la historia ----------

const STORY_ART = {
  bosque_borde(g) {
    artBg(g, 0x1a2a3a, 0x10200f, 56);
    g.fillStyle(0x0a1a0e);
    [[-90, 90], [-40, 120], [30, 110], [86, 96]].forEach(([x, h]) => { g.fillRect(x - 8, 56 - h, 16, h); g.fillTriangle(x - 34, 36 - h * 0.35, x + 34, 36 - h * 0.35, x, -h - 10); });
    g.fillStyle(0xefe6d2, 0.12); g.fillEllipse(0, 70, 240, 34);
    g.fillStyle(0x6b4423); g.fillRect(-12, 28, 5, 52); g.fillRect(-26, 24, 34, 14);
    g.lineStyle(3, 0xe2512f); g.lineBetween(-20, 28, -2, 36); g.lineBetween(-2, 28, -20, 36);
    artPerson(g, -64, 90, 50, 0xe2512f, true);
  },
  mordisco(g) {
    artBg(g, 0x12301f, 0x0d2216, 60);
    artFruit(g, 0, 0, 44, true, 0x12301f);
    g.fillStyle(0xffffff, 0.8);
    [[-60, -50], [62, -40], [50, 56], [-54, 50]].forEach(([x, y]) => g.fillCircle(x, y, 2.4));
  },
  guardiana_aparece(g) {
    artBg(g, 0x0e2418, 0x0a1a10, 80);
    g.fillStyle(0x2f7d43); g.fillTriangle(-70, 120, 70, 120, 0, -70);
    g.fillStyle(0x6fae7e); g.fillCircle(0, -66, 22);
    g.fillStyle(0x2f7d43); g.fillTriangle(-30, -80, -14, -108, -4, -80); g.fillTriangle(30, -80, 14, -108, 4, -80); g.fillTriangle(-10, -84, 0, -116, 10, -84);
    for (const s of [-1, 1]) { g.fillStyle(0xf2c14e); g.fillEllipse(s * 9, -66, 11, 7); g.fillStyle(PAL.bg); g.fillEllipse(s * 9, -66, 2, 7); }
    artPerson(g, 0, 118, 30, 0xe2512f);
  },
  serpiente(g) {
    artBg(g, 0x0e2418, 0x0a1a10, 90);
    g.fillStyle(PAL.gold, 0.18); g.fillCircle(0, 0, 90);
    for (let k = 0; k <= 30; k++) {
      const t = k / 30, x = Math.sin(t * 6) * 54 * (1 - t * 0.2), y = 90 - t * 150;
      g.fillStyle(shade(0x3fae6a, -0.3 + t * 0.3)); g.fillCircle(x, y, 17 - t * 3);
    }
    g.fillStyle(0x74d695); g.fillEllipse(0, -70, 50, 38);
    for (const s of [-1, 1]) { g.fillStyle(0xf2c14e); g.fillCircle(s * 10, -74, 6); g.fillStyle(PAL.bg); g.fillEllipse(s * 10, -74, 2, 8); }
    g.lineStyle(2, 0xefe6d2, 0.35); g.strokeCircle(-78, -40, 12); g.lineBetween(-78, -28, -78, 6); g.lineBetween(-78, -16, -92, -2); g.lineBetween(-78, -16, -64, -2);
  },
  tierras(g) {
    artBg(g, 0x0b1410, 0x0b1410, 120);
    const lands = [0x3fae6a, 0xe0b469, 0xcfe6f2, 0xe2512f, 0x3d5bd9];
    lands.forEach((c, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const x = Math.cos(a) * 66, y = Math.sin(a) * 66;
      g.fillStyle(c, 0.28); g.fillCircle(x, y, 32);
      g.fillStyle(c); g.fillCircle(x, y, 24);
      g.fillStyle(0xffffff, 0.3); g.fillCircle(x - 7, y - 8, 7);
    });
    g.fillStyle(PAL.gold); g.fillCircle(0, 0, 11);
    g.fillStyle(PAL.goldLight, 0.8); g.fillCircle(-3, -3, 4);
  },
  fruta_origen(g) {
    artBg(g, 0x12301f, 0x0d2216, 70);
    artFruit(g, 0, -6, 38);
    [[-78, 60, 0x8b5a2b], [0, 84, 0x7fd6ff], [78, 60, 0xf2b33d]].forEach(([x, y, c]) => {
      g.fillStyle(0xffffff, 0.16); g.fillCircle(x, y, 18); g.fillStyle(c); g.fillCircle(x, y, 11);
    });
  },
  // Un ícono por tierra, con los mismos colores de la landing
  land(g, idx) {
    const cols = [0x3fae6a, 0xe0b469, 0xcfe6f2, 0xe2512f, 0x3d5bd9];
    artBg(g, shade(cols[idx], -0.72), shade(cols[idx], -0.82), 40);
    g.fillStyle(cols[idx], 0.2); g.fillCircle(0, 0, 100);
    g.fillStyle(cols[idx]);
    if (idx === 0) { // árbol
      g.fillRect(-9, 10, 18, 60);
      g.fillCircle(0, -22, 44); g.fillCircle(-30, 0, 28); g.fillCircle(30, 0, 28);
    } else if (idx === 1) { // sol
      g.fillCircle(0, 0, 36);
      for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; g.lineStyle(7, cols[1]); g.lineBetween(Math.cos(a) * 52, Math.sin(a) * 52, Math.cos(a) * 80, Math.sin(a) * 80); }
    } else if (idx === 2) { // copo de nieve
      g.lineStyle(7, cols[2]);
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        g.lineBetween(0, 0, Math.cos(a) * 78, Math.sin(a) * 78);
        g.lineBetween(Math.cos(a) * 48, Math.sin(a) * 48, Math.cos(a + 0.6) * 66, Math.sin(a + 0.6) * 66);
        g.lineBetween(Math.cos(a) * 48, Math.sin(a) * 48, Math.cos(a - 0.6) * 66, Math.sin(a - 0.6) * 66);
      }
    } else if (idx === 3) { // volcán
      g.fillTriangle(-80, 70, 80, 70, 0, -44);
      g.fillStyle(0xf2b33d); g.fillTriangle(-18, -22, 18, -22, 0, -60); g.fillRect(-6, -22, 12, 50);
    } else { // luna creciente
      g.fillCircle(0, 0, 58);
      g.fillStyle(shade(cols[4], -0.8)); g.fillCircle(24, -14, 50);
    }
  }
};

// ---------- Utilidades compartidas por las escenas de historia ----------

// Dibuja una ilustración en una textura de 240 x 240 (una sola vez)
function makeArtTexture(scene, key, drawFn) {
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ add: false });
  g.translateCanvas(120, 120);
  drawFn(g);
  g.generateTexture(key, 240, 240);
  g.destroy();
  return key;
}

// Elige la textura de una ilustración por su nombre: un recuerdo, una de la historia o 'land:N'
function artTexture(scene, name) {
  if (name.startsWith('land:')) { const i = Number(name.slice(5)); return makeArtTexture(scene, 'art-land-' + i, (g) => STORY_ART.land(g, i)); }
  if (MEMORY_ART[name]) return makeArtTexture(scene, 'art-m-' + name, MEMORY_ART[name]);
  if (STORY_ART[name]) return makeArtTexture(scene, 'art-s-' + name, STORY_ART[name]);
  return null;
}

// Páginas de la guardiana antes de un nivel (1 a 5)
function levelPages(level) {
  return [{
    art: 'land:' + (level - 1), speaker: 'La guardiana',
    title: 'Nivel ' + level + ' · ' + LEVELS[level - 1].name, text: STORY.levels[level - 1]
  }];
}

// Cuántos anillos tiene la cámara del recuerdo en cada nivel
function ringsForLevel(level) {
  return [2, 3, 3, 4, 4][level - 1] || 3;
}

// Pasa a la historia previa a un nivel y luego al juego
function goToLevelStory(scene, extraPages = []) {
  scene.scene.start('StoryScene', { pages: extraPages.concat(levelPages(GameState.level)), next: 'SnakeScene' });
}

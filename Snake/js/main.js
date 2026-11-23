// Arranque del juego
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game',
  backgroundColor: '#0b1410',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, StoryScene, SnakeScene, MemoryRingScene]
};

// Espera a que carguen las tipografías de Amaru para que el canvas no dibuje con otra letra.
// Si tardan o fallan, el juego arranca igual con la letra de respaldo.
const fontsReady = document.fonts
  ? Promise.all([document.fonts.load('900 40px "Cinzel Decorative"'), document.fonts.load('700 40px "Cinzel Decorative"'),
    document.fonts.load('400 16px Outfit'), document.fonts.load('700 16px Outfit'), document.fonts.load('800 16px Outfit')])
  : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))])
  .catch(() => {})
  .then(() => { new Phaser.Game(config); });

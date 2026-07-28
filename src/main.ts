import Phaser from 'phaser';
import { gameState } from './core/GameState';
import { TickEngine } from './core/TickEngine';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { loadGame, saveGame, hasSave } from './core/SaveSystem';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, WorldScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
};

// Auto-load saved game
if (hasSave()) {
  const data = loadGame();
  if (data) {
    Object.assign(gameState, data);
  }
}

const game = new Phaser.Game(config);

// Start tick engine after a short delay to let Phaser init
let engine: TickEngine;
setTimeout(() => {
  engine = new TickEngine(gameState, () => {});
  engine.start();
}, 500);

// Expose for debug overlay
(window as any).__tickEngine = () => engine;

// Auto-save on page unload
window.addEventListener('beforeunload', () => {
  saveGame(gameState);
});

// Auto-save every 60 seconds
setInterval(() => {
  saveGame(gameState);
}, 60000);

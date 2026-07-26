import Phaser from 'phaser';
import { gameState } from '../core/GameState';
import { saveGame, loadGame, hasSave } from '../core/SaveSystem';

const BTN_X = 620;
const BTN_Y = 505;
const BTN_WIDTH = 50;
const BTN_HEIGHT = 28;
const GAP = 56;

export class SaveLoadUI {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    // Save button
    const saveBg = this.scene.add.rectangle(BTN_X, BTN_Y, BTN_WIDTH, BTN_HEIGHT, 0x27ae60, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(200);

    this.scene.add.text(BTN_X, BTN_Y, 'Save', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(200);

    saveBg.on('pointerdown', () => {
      saveGame(gameState);
      this.showToast('Game Saved!');
    });
    saveBg.on('pointerover', () => saveBg.setAlpha(1));
    saveBg.on('pointerout', () => saveBg.setAlpha(0.8));

    // Load button
    const loadBg = this.scene.add.rectangle(BTN_X + GAP, BTN_Y, BTN_WIDTH, BTN_HEIGHT, 0x2980b9, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(200);

    this.scene.add.text(BTN_X + GAP, BTN_Y, 'Load', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(200);

    loadBg.on('pointerdown', () => {
      const data = loadGame();
      if (data) {
        Object.assign(gameState, data);
        this.showToast('Game Loaded!');
      } else {
        this.showToast('No Save Found');
      }
    });
    loadBg.on('pointerover', () => loadBg.setAlpha(1));
    loadBg.on('pointerout', () => loadBg.setAlpha(0.8));
  }

  private showToast(text: string): void {
    const txt = this.scene.add.text(400, 300, text, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#000000aa',
    }).setOrigin(0.5).setDepth(1000);

    this.scene.tweens.add({
      targets: txt,
      y: 280,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }
}

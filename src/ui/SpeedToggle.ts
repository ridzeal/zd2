import Phaser from 'phaser';
import { eventBus } from '../core/EventBus';

const BTN_X = 740;
const BTN_Y = 505;
const BTN_WIDTH = 50;
const BTN_HEIGHT = 28;

export class SpeedToggle {
  private scene: Phaser.Scene;
  private bg!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private currentSpeed: 1 | 2 = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.bg = this.scene.add.rectangle(BTN_X, BTN_Y, BTN_WIDTH, BTN_HEIGHT, 0x333355, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(300);

    this.label = this.scene.add.text(BTN_X, BTN_Y, '1x', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(300);

    this.bg.on('pointerdown', () => {
      this.currentSpeed = this.currentSpeed === 1 ? 2 : 1;
      this.label.setText(`${this.currentSpeed}x`);
      eventBus.emit('speed-change', { speed: this.currentSpeed });
    });

    this.bg.on('pointerover', () => this.bg.setAlpha(1));
    this.bg.on('pointerout', () => this.bg.setAlpha(0.8));
  }
}

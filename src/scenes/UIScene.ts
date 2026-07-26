import Phaser from 'phaser';
import { BuildMenu } from '../ui/BuildMenu';
import { SpeedToggle } from '../ui/SpeedToggle';
import { SaveLoadUI } from '../ui/SaveLoadUI';
import { ActivityLog } from '../ui/ActivityLog';
import { gameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';

export class UIScene extends Phaser.Scene {
  private buildMenu!: BuildMenu;
  private speedToggle!: SpeedToggle;
  private saveLoadUI!: SaveLoadUI;
  private activityLog!: ActivityLog;
  private tickText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // HUD text (top-left, above build menu)
    this.tickText = this.add.text(10, 8, 'Tick: 0', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setDepth(200);
    this.dayText = this.add.text(10, 24, 'Day: 1', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setDepth(200);
    this.goldText = this.add.text(10, 40, 'Gold: 100', {
      fontSize: '14px', color: '#ffd700', fontFamily: 'monospace',
    }).setDepth(200);
    this.levelText = this.add.text(10, 56, 'Level: 1', {
      fontSize: '14px', color: '#00ff00', fontFamily: 'monospace',
    }).setDepth(200);

    // Listen for updates
    eventBus.on('gold-change', () => {
      this.goldText?.setText(`Gold: ${gameState.gold}`);
    });
    eventBus.on('tick', (data) => {
      this.tickText?.setText(`Tick: ${data.tick}`);
      this.dayText?.setText(`Day: ${data.day}`);
    });
    eventBus.on('level-up', (data) => {
      this.levelText?.setText(`Level: ${data.level}`);
    });

    this.buildMenu = new BuildMenu(this);
    this.buildMenu.create();
    this.speedToggle = new SpeedToggle(this);
    this.speedToggle.create();
    this.saveLoadUI = new SaveLoadUI(this);
    this.saveLoadUI.create();
    this.activityLog = new ActivityLog(this);
    this.activityLog.create();
  }
}

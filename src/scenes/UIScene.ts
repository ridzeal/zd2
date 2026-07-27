import Phaser from 'phaser';
import { BuildMenu } from '../ui/BuildMenu';
import { SpeedToggle } from '../ui/SpeedToggle';
import { SaveLoadUI } from '../ui/SaveLoadUI';
import { ActivityLog } from '../ui/ActivityLog';
import { gameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';

const PANEL_BG = 0x2a1a0a;
const PANEL_BG_ALPHA = 0.85;
const PANEL_BORDER = 0xc4a66a;
const HEADER_COLOR = '#c4a66a';
const BODY_COLOR = '#e8d5b0';
const GOLD_COLOR = '#ffd700';

export class UIScene extends Phaser.Scene {
  private buildMenu!: BuildMenu;
  private speedToggle!: SpeedToggle;
  private saveLoadUI!: SaveLoadUI;
  private activityLog!: ActivityLog;
  private tickText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  // Bound handlers for cleanup
  private onGoldChange!: () => void;
  private onTick!: (data: { tick: number; day: number }) => void;
  private onLevelUp!: (data: { level: number }) => void;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Themed HUD panel (top-left, above build menu)
    const panelX = 8;
    const panelY = 4;
    const panelW = 160;
    const panelH = 72;

    const hudPanel = this.add.graphics();
    hudPanel.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    hudPanel.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    hudPanel.lineStyle(2, PANEL_BORDER, 0.8);
    hudPanel.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);
    hudPanel.setDepth(190);

    // HUD text (gold headers, cream body)
    this.tickText = this.add.text(18, 10, 'Tick: 0', {
      fontSize: '12px', color: BODY_COLOR, fontFamily: 'monospace',
    }).setDepth(200);
    this.dayText = this.add.text(18, 26, 'Day: 1', {
      fontSize: '12px', color: BODY_COLOR, fontFamily: 'monospace',
    }).setDepth(200);
    this.goldText = this.add.text(18, 42, 'Gold: 100', {
      fontSize: '12px', color: GOLD_COLOR, fontFamily: 'monospace',
    }).setDepth(200);
    this.levelText = this.add.text(18, 58, 'Level: 1', {
      fontSize: '12px', color: '#7ec47e', fontFamily: 'monospace',
    }).setDepth(200);

    // Store bound handlers for cleanup
    this.onGoldChange = () => {
      this.goldText?.setText(`Gold: ${gameState.gold}`);
    };
    this.onTick = (data) => {
      this.tickText?.setText(`Tick: ${data.tick}`);
      this.dayText?.setText(`Day: ${data.day}`);
    };
    this.onLevelUp = (data) => {
      this.levelText?.setText(`Level: ${data.level}`);
    };

    // Listen for updates
    eventBus.on('gold-change', this.onGoldChange);
    eventBus.on('tick', this.onTick);
    eventBus.on('level-up', this.onLevelUp);

    this.buildMenu = new BuildMenu(this);
    this.buildMenu.create();
    this.speedToggle = new SpeedToggle(this);
    this.speedToggle.create();
    this.saveLoadUI = new SaveLoadUI(this);
    this.saveLoadUI.create();
    this.activityLog = new ActivityLog(this);
    this.activityLog.create();

    // Cleanup on scene shutdown
    this.events.on('shutdown', this.shutdown, this);
  }

  private shutdown(): void {
    eventBus.off('gold-change', this.onGoldChange);
    eventBus.off('tick', this.onTick);
    eventBus.off('level-up', this.onLevelUp);
    this.buildMenu.destroy();
    this.activityLog.destroy();
  }
}

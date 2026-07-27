import Phaser from 'phaser';
import { eventBus } from '../core/EventBus';

const LOG_X = 10;
const LOG_HEIGHT = 80;
const MAX_LOGS = 50;
const VISIBLE_LOGS = 3;

export class ActivityLog {
  private scene: Phaser.Scene;
  private logs: string[] = [];
  private textObjects: Phaser.GameObjects.Text[] = [];
  private expanded = false;
  private bg!: Phaser.GameObjects.Rectangle;
  private toggleBtn!: Phaser.GameObjects.Text;
  private container!: Phaser.GameObjects.Container;

  // Bound handlers for cleanup
  private onRoomInteraction!: (data: { text: string; color: string }) => void;
  private onMilestoneReached!: (data: { day: number }) => void;
  private onAdventurerArrived!: (data: { classId: string }) => void;
  private onQuestComplete!: (data: { advId: string; won: boolean }) => void;
  private onLevelUp!: (data: { level: number }) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const gameHeight = 600;
    const logAreaY = gameHeight - LOG_HEIGHT;

    // Background
    this.bg = this.scene.add.rectangle(400, logAreaY + LOG_HEIGHT / 2, 800, LOG_HEIGHT, 0x000000, 0.7)
      .setDepth(90);

    // Toggle button
    this.toggleBtn = this.scene.add.text(780, logAreaY + 4, '▲', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(91).setInteractive({ useHandCursor: true });

    this.toggleBtn.on('pointerdown', () => {
      this.expanded = !this.expanded;
      this.toggleBtn.setText(this.expanded ? '▼' : '▲');
      this.refreshDisplay();
    });

    // Container for log lines
    this.container = this.scene.add.container(0, 0).setDepth(91);

    // Create text objects for visible lines
    for (let i = 0; i < VISIBLE_LOGS; i++) {
      const txt = this.scene.add.text(LOG_X, logAreaY + 6 + i * 18, '', {
        fontSize: '12px', color: '#cccccc', fontFamily: 'monospace',
      });
      this.textObjects.push(txt);
      this.container.add(txt);
    }

    // Store bound handlers for cleanup
    this.onRoomInteraction = (data) => this.addLog(data.text, data.color);
    this.onMilestoneReached = (data) => this.addLog(`Milestone reached: Day ${data.day}`, '#ffd700');
    this.onAdventurerArrived = (data) => this.addLog(`New adventurer arrived: ${data.classId}`, '#00ff00');
    this.onQuestComplete = (data) => this.addLog(`Quest ${data.won ? 'won' : 'lost'} by ${data.advId}`, data.won ? '#ffd700' : '#ff4444');
    this.onLevelUp = (data) => this.addLog(`Level up! Now level ${data.level}`, '#ffd700');

    // Listen to events
    eventBus.on('room-interaction', this.onRoomInteraction);
    eventBus.on('milestone-reached', this.onMilestoneReached);
    eventBus.on('adventurer-arrived', this.onAdventurerArrived);
    eventBus.on('quest-complete', this.onQuestComplete);
    eventBus.on('level-up', this.onLevelUp);
  }

  destroy(): void {
    eventBus.off('room-interaction', this.onRoomInteraction);
    eventBus.off('milestone-reached', this.onMilestoneReached);
    eventBus.off('adventurer-arrived', this.onAdventurerArrived);
    eventBus.off('quest-complete', this.onQuestComplete);
    eventBus.off('level-up', this.onLevelUp);
    this.textObjects.forEach(t => t.destroy());
    this.textObjects = [];
    this.container?.destroy();
  }

  private addLog(text: string, color?: string): void {
    const timestamp = `D${this.scene.registry.get('day') || 1}`;
    const entry = `[${timestamp}] ${text}`;
    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.pop();
    }
    this.refreshDisplay();
  }

  private refreshDisplay(): void {
    const visibleCount = this.expanded ? VISIBLE_LOGS : Math.min(VISIBLE_LOGS, this.logs.length);
    for (let i = 0; i < VISIBLE_LOGS; i++) {
      if (i < visibleCount && i < this.logs.length) {
        this.textObjects[i].setText(this.logs[i]);
        this.textObjects[i].setAlpha(1 - i * 0.2);
      } else {
        this.textObjects[i].setText('');
      }
    }
  }
}

import Phaser from 'phaser';
import { RoomDef, gameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import roomsData from '../data/rooms.json';

const rooms: RoomDef[] = roomsData as RoomDef[];
const MENU_X = 10;
const MENU_START_Y = 95;
const BTN_HEIGHT = 32;
const BTN_GAP = 3;

export class BuildMenu {
  private scene: Phaser.Scene;
  private buttons: Phaser.GameObjects.Container[] = [];
  private selectedId: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    rooms.forEach((room, i) => {
      const y = MENU_START_Y + i * (BTN_HEIGHT + BTN_GAP);
      const colorNum = Phaser.Display.Color.HexStringToColor(room.color).color;
      const isLocked = room.unlockLevel > gameState.level;
      const alpha = isLocked ? 0.3 : 0.8;

      const bg = this.scene.add.rectangle(0, 0, 140, BTN_HEIGHT, colorNum, alpha)
        .setStrokeStyle(1, 0xffffff, isLocked ? 0.3 : 0.6);

      const lockText = isLocked ? ' 🔒' : '';
      const label = this.scene.add.text(0, 0, `${room.name} (${room.cost}g)${lockText}`, {
        fontSize: '12px', color: isLocked ? '#888888' : '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const container = this.scene.add.container(MENU_X + 70, y, [bg, label]);
      container.setSize(140, BTN_HEIGHT);

      if (!isLocked) {
        container.setInteractive({ useHandCursor: true });

        container.on('pointerdown', () => {
          if (this.selectedId === room.id) {
            this.deselect();
          } else {
            this.select(room.id);
          }
        });

        container.on('pointerover', () => bg.setAlpha(1));
        container.on('pointerout', () => bg.setAlpha(this.selectedId === room.id ? 1 : 0.8));
      }

      this.buttons.push(container);
    });

    eventBus.on('deselect-room', () => this.deselect());
    eventBus.on('level-up', () => this.refresh());
  }

  refresh(): void {
    // Destroy old buttons
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
    this.selectedId = null;
    this.scene.registry.set('selectedRoomType', null);
    // Recreate
    this.create();
  }

  select(roomId: string): void {
    this.selectedId = roomId;
    this.scene.registry.set('selectedRoomType', roomId);
    this.buttons.forEach((btn, i) => {
      if (i >= rooms.length) return;
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(rooms[i].id === roomId ? 3 : 1, 0xffffff, rooms[i].id === roomId ? 1 : 0.6);
    });
  }

  deselect(): void {
    this.selectedId = null;
    this.scene.registry.set('selectedRoomType', null);
    this.buttons.forEach((btn) => {
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(1, 0xffffff, 0.6);
      bg.setAlpha(0.8);
    });
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }
}

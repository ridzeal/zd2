import Phaser from 'phaser';
import { RoomDef, gameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import roomsData from '../data/rooms.json';

const rooms: RoomDef[] = roomsData as RoomDef[];
const MENU_X = 10;
const MENU_START_Y = 95;
const BTN_WIDTH = 140;
const BTN_HEIGHT = 32;
const BTN_GAP = 3;

const BASE_COLOR = 0x2a1a0a;
const BASE_BORDER = 0xc4a66a;
const SELECTED_BORDER = 0xffd700;
const HOVER_COLOR = 0x3d2a14;
const LOCKED_ALPHA = 0.35;
const NORMAL_ALPHA = 0.85;

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
      const alpha = isLocked ? LOCKED_ALPHA : NORMAL_ALPHA;

      const bg = this.scene.add.rectangle(0, 0, BTN_WIDTH, BTN_HEIGHT, BASE_COLOR, alpha)
        .setStrokeStyle(2, isLocked ? 0x555555 : BASE_BORDER, isLocked ? 0.3 : 0.7);

      const lockText = isLocked ? ' 🔒' : '';
      const label = this.scene.add.text(0, 0, `${room.name} (${room.cost}g)${lockText}`, {
        fontSize: '11px',
        color: isLocked ? '#888888' : '#e8d5b0',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      const container = this.scene.add.container(MENU_X + BTN_WIDTH / 2, y, [bg, label]);
      container.setSize(BTN_WIDTH, BTN_HEIGHT);

      if (!isLocked) {
        container.setInteractive({ useHandCursor: true });

        container.on('pointerdown', () => {
          if (this.selectedId === room.id) {
            this.deselect();
          } else {
            this.select(room.id);
          }
        });

        container.on('pointerover', () => {
          if (this.selectedId !== room.id) {
            bg.setFillStyle(HOVER_COLOR, 1);
          }
        });

        container.on('pointerout', () => {
          if (this.selectedId !== room.id) {
            bg.setFillStyle(BASE_COLOR, NORMAL_ALPHA);
          }
        });
      }

      this.buttons.push(container);
    });

    eventBus.on('deselect-room', () => this.deselect());
    eventBus.on('level-up', () => this.refresh());
  }

  refresh(): void {
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
    this.selectedId = null;
    this.scene.registry.set('selectedRoomType', null);
    this.create();
  }

  select(roomId: string): void {
    this.selectedId = roomId;
    this.scene.registry.set('selectedRoomType', roomId);
    this.buttons.forEach((btn, i) => {
      if (i >= rooms.length) return;
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      if (rooms[i].id === roomId) {
        bg.setFillStyle(HOVER_COLOR, 1);
        bg.setStrokeStyle(2, SELECTED_BORDER, 1);
      } else {
        bg.setFillStyle(BASE_COLOR, NORMAL_ALPHA);
        bg.setStrokeStyle(2, BASE_BORDER, 0.7);
      }
    });
  }

  deselect(): void {
    this.selectedId = null;
    this.scene.registry.set('selectedRoomType', null);
    this.buttons.forEach((btn) => {
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(BASE_COLOR, NORMAL_ALPHA);
      bg.setStrokeStyle(2, BASE_BORDER, 0.7);
    });
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }
}

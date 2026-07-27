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
const THUMB_SIZE = 20;

const BASE_COLOR = 0x2a1a0a;
const BASE_BORDER = 0xc4a66a;
const SELECTED_BORDER = 0xffd700;
const HOVER_COLOR = 0x3d2a14;
const LOCKED_ALPHA = 0.35;
const NORMAL_ALPHA = 0.85;

function drawDiamond(g: Phaser.GameObjects.Graphics, fill: number, fillAlpha: number, stroke: number, strokeAlpha: number): void {
  g.clear();
  g.fillStyle(fill, fillAlpha);
  g.beginPath();
  g.moveTo(BTN_WIDTH / 2, 0);
  g.lineTo(BTN_WIDTH, BTN_HEIGHT / 2);
  g.lineTo(BTN_WIDTH / 2, BTN_HEIGHT);
  g.lineTo(0, BTN_HEIGHT / 2);
  g.closePath();
  g.fillPath();
  g.lineStyle(2, stroke, strokeAlpha);
  g.beginPath();
  g.moveTo(BTN_WIDTH / 2, 0);
  g.lineTo(BTN_WIDTH, BTN_HEIGHT / 2);
  g.lineTo(BTN_WIDTH / 2, BTN_HEIGHT);
  g.lineTo(0, BTN_HEIGHT / 2);
  g.closePath();
  g.strokePath();
}

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
      const isLocked = room.unlockLevel > gameState.level;
      const alpha = isLocked ? LOCKED_ALPHA : NORMAL_ALPHA;

      const diamond = this.scene.add.graphics();
      drawDiamond(diamond, BASE_COLOR, alpha, BASE_BORDER, isLocked ? 0.3 : 0.7);

      // Thumbnail icon (if texture exists)
      const thumbKey = `room_${room.id}`;
      const hasThumb = this.scene.textures.exists(thumbKey);
      const thumbX = 12;
      const thumbY = BTN_HEIGHT / 2;

      // Label text
      const lockText = isLocked ? ' 🔒' : '';
      const labelText = `${room.name} (${room.cost}g)${lockText}`;
      const labelX = hasThumb ? 28 : BTN_WIDTH / 2;
      const label = this.scene.add.text(labelX, BTN_HEIGHT / 2, labelText, {
        fontSize: '11px',
        color: isLocked ? '#888888' : '#e8d5b0',
        fontFamily: 'monospace',
      }).setOrigin(hasThumb ? 0 : 0.5, 0.5);

      const children: Phaser.GameObjects.GameObject[] = [diamond, label];

      if (hasThumb) {
        const thumb = this.scene.add.image(thumbX, thumbY, thumbKey)
          .setDisplaySize(THUMB_SIZE, THUMB_SIZE);
        children.push(thumb);
      }

      const container = this.scene.add.container(MENU_X, y, children);
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
            drawDiamond(diamond, HOVER_COLOR, 1, BASE_BORDER, 1);
          }
        });

        container.on('pointerout', () => {
          if (this.selectedId !== room.id) {
            drawDiamond(diamond, BASE_COLOR, NORMAL_ALPHA, BASE_BORDER, 0.7);
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
      const diamond = btn.list[0] as Phaser.GameObjects.Graphics;
      if (rooms[i].id === roomId) {
        drawDiamond(diamond, HOVER_COLOR, 1, SELECTED_BORDER, 1);
      } else {
        drawDiamond(diamond, BASE_COLOR, NORMAL_ALPHA, BASE_BORDER, 0.7);
      }
    });
  }

  deselect(): void {
    this.selectedId = null;
    this.scene.registry.set('selectedRoomType', null);
    this.buttons.forEach((btn) => {
      const diamond = btn.list[0] as Phaser.GameObjects.Graphics;
      drawDiamond(diamond, BASE_COLOR, NORMAL_ALPHA, BASE_BORDER, 0.7);
    });
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }
}

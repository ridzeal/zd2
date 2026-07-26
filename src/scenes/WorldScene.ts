import Phaser from 'phaser';
import { gameState, placeRoom } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import { RoomDef } from '../core/GameState';
import roomsData from '../data/rooms.json';
import classesData from '../data/classes.json';
import { getAllAdventurers } from '../systems/AISystem';
import { generateSprites } from '../assets/sprites/generateSprites';
import { applyHD2DEffects } from '../shaders/HD2DPipeline';

const rooms: RoomDef[] = roomsData as RoomDef[];
const GRID_SIZE = 32;
const GRID_COLS = 25;
const GRID_ROWS = 18;

interface ClassDef {
  id: string;
  name: string;
  color: string;
}
const classes: ClassDef[] = classesData as ClassDef[];

export class WorldScene extends Phaser.Scene {
  private roomGraphics!: Phaser.GameObjects.Graphics;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private advGraphics!: Phaser.GameObjects.Graphics;
  private previewX = -1;
  private previewY = -1;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    // Generate placeholder sprites
    generateSprites(this);

    // Apply HD-2D post-processing effects
    applyHD2DEffects(this);

    // Grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x333355, 0.5);
    for (let x = 0; x <= GRID_COLS; x++) {
      grid.lineBetween(x * GRID_SIZE, 0, x * GRID_SIZE, GRID_ROWS * GRID_SIZE);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      grid.lineBetween(0, y * GRID_SIZE, GRID_COLS * GRID_SIZE, y * GRID_SIZE);
    }

    // Room layer (below text, above grid)
    this.roomGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();
    this.advGraphics = this.add.graphics();

    // Grid click to place room
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const selectedType = this.registry.get('selectedRoomType') as string | null;
      if (!selectedType) return;

      const gridX = Math.floor(pointer.x / GRID_SIZE);
      const gridY = Math.floor(pointer.y / GRID_SIZE);
      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;

      const roomDef = rooms.find(r => r.id === selectedType);
      if (!roomDef) return;

      if (placeRoom(gameState, roomDef, gridX, gridY)) {
        eventBus.emit('gold-change', { gold: gameState.gold, delta: -roomDef.cost });
        eventBus.emit('state-change');
      }
    });

    // Right-click to deselect
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        eventBus.emit('deselect-room');
      }
    });

    // Hover preview
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.previewX = Math.floor(pointer.x / GRID_SIZE);
      this.previewY = Math.floor(pointer.y / GRID_SIZE);
    });

    // Floating text for room interactions
    eventBus.on('room-interaction', (data: { x: number; y: number; text: string; color: string }) => {
      const txt = this.add.text(data.x, data.y, data.text, {
        fontSize: '12px',
        color: data.color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: txt,
        y: data.y - 20,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => txt.destroy(),
      });
    });
  }

  update(): void {
    // Redraw rooms
    this.roomGraphics.clear();
    for (const room of gameState.rooms) {
      const def = rooms.find(r => r.id === room.typeId);
      if (!def) continue;
      this.roomGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(def.color).color, 0.85);
      this.roomGraphics.fillRect(
        room.gridX * GRID_SIZE + 1,
        room.gridY * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
      this.roomGraphics.lineStyle(1, 0xffffff, 0.6);
      this.roomGraphics.strokeRect(
        room.gridX * GRID_SIZE + 1,
        room.gridY * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
    }

    // Adventurers (sorted by Y for depth)
    this.advGraphics.clear();
    const advMap = getAllAdventurers();
    const advArray = Array.from(advMap.values());
    advArray.sort((a, b) => a.data.y - b.data.y);
    for (const adv of advArray) {
      const cls = classes.find(c => c.id === adv.data.classId);
      const color = cls ? Phaser.Display.Color.HexStringToColor(cls.color).color : 0xffffff;
      adv.render(this.advGraphics, color);
    }

    // Preview
    this.previewGraphics.clear();
    const selectedType = this.registry.get('selectedRoomType') as string | null;
    if (selectedType && this.previewX >= 0 && this.previewY >= 0
        && this.previewX < GRID_COLS && this.previewY < GRID_ROWS) {
      const def = rooms.find(r => r.id === selectedType);
      if (def) {
        const occupied = gameState.rooms.some(r => r.gridX === this.previewX && r.gridY === this.previewY);
        const canAfford = gameState.gold >= def.cost;
        const alpha = occupied || !canAfford ? 0.2 : 0.4;
        this.previewGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(def.color).color, alpha);
        this.previewGraphics.fillRect(
          this.previewX * GRID_SIZE + 1,
          this.previewY * GRID_SIZE + 1,
          GRID_SIZE - 2,
          GRID_SIZE - 2,
        );
      }
    }
  }
}

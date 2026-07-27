import Phaser from 'phaser';
import { gameState, placeRoom } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import { RoomDef } from '../core/GameState';
import roomsData from '../data/rooms.json';
import classesData from '../data/classes.json';
import { getAllAdventurers } from '../systems/AISystem';
import { generateSprites } from '../assets/sprites/generateSprites';
import { applyHD2DEffects } from '../shaders/HD2DPipeline';
import { TerrainRenderer } from '../render/TerrainRenderer';
import { gridToScreen, screenToGrid, gridToDepth, TILE_W, TILE_H } from '../render/Isometric';

const rooms: RoomDef[] = roomsData as RoomDef[];
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
  private terrain!: TerrainRenderer;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    // Generate placeholder sprites
    generateSprites(this);

    // Apply HD-2D post-processing effects
    applyHD2DEffects(this);

    // Terrain
    this.terrain = new TerrainRenderer();
    this.terrain.create(this);

    // Camera setup — center the isometric view
    const gridPixelW = GRID_COLS * TILE_W;
    const gridPixelH = GRID_ROWS * TILE_H;
    this.cameras.main.setBounds(-gridPixelW / 2, -gridPixelH / 4, gridPixelW, gridPixelH);
    this.cameras.main.centerOn(0, gridPixelH / 4);

    // Room layer (below text, above grid)
    this.roomGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();
    this.advGraphics = this.add.graphics();

    // Grid click to place room
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const selectedType = this.registry.get('selectedRoomType') as string | null;
      if (!selectedType) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { gridX, gridY } = screenToGrid(worldPoint.x, worldPoint.y);
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
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { gridX, gridY } = screenToGrid(worldPoint.x, worldPoint.y);
      this.previewX = gridX;
      this.previewY = gridY;
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
    // Terrain
    this.terrain.render(GRID_COLS, GRID_ROWS);

    // Redraw rooms as isometric 3D blocks
    this.roomGraphics.clear();
    for (const room of gameState.rooms) {
      const def = rooms.find(r => r.id === room.typeId);
      if (!def) continue;
      const { x, y } = gridToScreen(room.gridX, room.gridY);
      const color = Phaser.Display.Color.HexStringToColor(def.color).color;

      // Top face (roof)
      this.roomGraphics.fillStyle(color, 0.85);
      this.roomGraphics.beginPath();
      this.roomGraphics.moveTo(x, y - TILE_H / 2 - 8);
      this.roomGraphics.lineTo(x + TILE_W / 2, y - 8);
      this.roomGraphics.lineTo(x, y + TILE_H / 2 - 8);
      this.roomGraphics.lineTo(x - TILE_W / 2, y - 8);
      this.roomGraphics.closePath();
      this.roomGraphics.fillPath();

      // Front face
      this.roomGraphics.fillStyle(color, 0.7);
      this.roomGraphics.beginPath();
      this.roomGraphics.moveTo(x - TILE_W / 2, y - 8);
      this.roomGraphics.lineTo(x, y + TILE_H / 2 - 8);
      this.roomGraphics.lineTo(x, y + TILE_H / 2);
      this.roomGraphics.lineTo(x - TILE_W / 2, y + 8);
      this.roomGraphics.closePath();
      this.roomGraphics.fillPath();

      // Right face
      this.roomGraphics.fillStyle(color, 0.6);
      this.roomGraphics.beginPath();
      this.roomGraphics.moveTo(x + TILE_W / 2, y - 8);
      this.roomGraphics.lineTo(x, y + TILE_H / 2 - 8);
      this.roomGraphics.lineTo(x, y + TILE_H / 2);
      this.roomGraphics.lineTo(x + TILE_W / 2, y + 8);
      this.roomGraphics.closePath();
      this.roomGraphics.fillPath();
    }

    // Adventurers (sorted by depth)
    this.advGraphics.clear();
    const advMap = getAllAdventurers();
    const advArray = Array.from(advMap.values());
    advArray.sort((a, b) => {
      const da = gridToDepth(a.data.x / TILE_W, a.data.y / TILE_H);
      const db = gridToDepth(b.data.x / TILE_W, b.data.y / TILE_H);
      return da - db;
    });
    for (const adv of advArray) {
      const cls = classes.find(c => c.id === adv.data.classId);
      const color = cls ? Phaser.Display.Color.HexStringToColor(cls.color).color : 0xffffff;
      const gridX = adv.data.x / TILE_W;
      const gridY = adv.data.y / TILE_H;
      const { x, y } = gridToScreen(gridX, gridY);

      this.advGraphics.fillStyle(color, 0.9);
      this.advGraphics.fillCircle(x, y - 4, 4);
      this.advGraphics.lineStyle(1, 0xffffff, 0.6);
      this.advGraphics.strokeCircle(x, y - 4, 4);

      const hpRatio = adv.data.hp / adv.data.maxHp;
      const hpColor = hpRatio > 0.3 ? 0x00ff00 : 0xff0000;
      this.advGraphics.fillStyle(0x000000, 0.5);
      this.advGraphics.fillRect(x - 8, y + 6, 16, 2);
      this.advGraphics.fillStyle(hpColor, 0.8);
      this.advGraphics.fillRect(x - 8, y + 6, 16 * hpRatio, 2);
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
        const { x, y } = gridToScreen(this.previewX, this.previewY);
        this.previewGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(def.color).color, alpha);
        this.previewGraphics.beginPath();
        this.previewGraphics.moveTo(x, y - TILE_H / 2);
        this.previewGraphics.lineTo(x + TILE_W / 2, y);
        this.previewGraphics.lineTo(x, y + TILE_H / 2);
        this.previewGraphics.lineTo(x - TILE_W / 2, y);
        this.previewGraphics.closePath();
        this.previewGraphics.fillPath();
      }
    }
  }
}

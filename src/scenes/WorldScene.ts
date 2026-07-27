import Phaser from 'phaser';
import { gameState, placeRoom } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import { RoomDef } from '../core/GameState';
import roomsData from '../data/rooms.json';
import { getAllAdventurers } from '../systems/AISystem';
import { generateSprites } from '../assets/sprites/generateSprites';
import { applyHD2DEffects } from '../shaders/HD2DPipeline';
import { TerrainRenderer } from '../render/TerrainRenderer';
import { CharacterRenderer } from '../render/CharacterRenderer';
import { gridToScreen, screenToGrid, TILE_W, TILE_H } from '../render/Isometric';

const rooms: RoomDef[] = roomsData as RoomDef[];
const GRID_COLS = 25;
const GRID_ROWS = 18;
const BLOCK_H = 8;

export class WorldScene extends Phaser.Scene {
  private roomGraphics!: Phaser.GameObjects.Graphics;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private charRenderer!: CharacterRenderer;
  private previewX = -1;
  private previewY = -1;
  private terrain!: TerrainRenderer;
  private roomsDirty = true;
  private lastPreviewKey = '';

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
    this.charRenderer = new CharacterRenderer();
    this.charRenderer.create(this);

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
        this.roomsDirty = true;
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

    // Redraw rooms only when changed
    if (this.roomsDirty) {
      this.roomsDirty = false;
      this.roomGraphics.clear();
      for (const room of gameState.rooms) {
        const def = rooms.find(r => r.id === room.typeId);
        if (!def) continue;
        const { x, y } = gridToScreen(room.gridX, room.gridY);
        const color = Phaser.Display.Color.HexStringToColor(def.color).color;

        // Top face (roof)
        this.roomGraphics.fillStyle(color, 0.85);
        this.roomGraphics.beginPath();
        this.roomGraphics.moveTo(x, y - TILE_H / 2 - BLOCK_H);
        this.roomGraphics.lineTo(x + TILE_W / 2, y - BLOCK_H);
        this.roomGraphics.lineTo(x, y + TILE_H / 2 - BLOCK_H);
        this.roomGraphics.lineTo(x - TILE_W / 2, y - BLOCK_H);
        this.roomGraphics.closePath();
        this.roomGraphics.fillPath();

        // Front face
        this.roomGraphics.fillStyle(color, 0.7);
        this.roomGraphics.beginPath();
        this.roomGraphics.moveTo(x - TILE_W / 2, y - BLOCK_H);
        this.roomGraphics.lineTo(x, y + TILE_H / 2 - BLOCK_H);
        this.roomGraphics.lineTo(x, y + TILE_H / 2);
        this.roomGraphics.lineTo(x - TILE_W / 2, y + BLOCK_H);
        this.roomGraphics.closePath();
        this.roomGraphics.fillPath();

        // Right face
        this.roomGraphics.fillStyle(color, 0.6);
        this.roomGraphics.beginPath();
        this.roomGraphics.moveTo(x + TILE_W / 2, y - BLOCK_H);
        this.roomGraphics.lineTo(x, y + TILE_H / 2 - BLOCK_H);
        this.roomGraphics.lineTo(x, y + TILE_H / 2);
        this.roomGraphics.lineTo(x + TILE_W / 2, y + BLOCK_H);
        this.roomGraphics.closePath();
        this.roomGraphics.fillPath();
      }
    }

    // Adventurers (sprite-based rendering with depth sorting)
    const advMap = getAllAdventurers();
    const advArray = Array.from(advMap.values());
    this.charRenderer.update(advArray);

    // Preview — only redraw when hover position or selection changes
    const selectedType = this.registry.get('selectedRoomType') as string | null;
    const previewKey = `${selectedType}:${this.previewX}:${this.previewY}`;
    if (previewKey !== this.lastPreviewKey) {
      this.lastPreviewKey = previewKey;
      this.previewGraphics.clear();
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
}

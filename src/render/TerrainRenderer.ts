import { gridToScreen, TILE_W, TILE_H } from './Isometric';

const GRASS_VARIANTS = ['terrain-grass-0', 'terrain-grass-1', 'terrain-grass-2'];
const GRASS_COLORS = [0x4a8c3f, 0x3d7a32, 0x458538];
const PATH_COLOR = 0xc4a66a;

type PathType = 'h' | 'v' | 'cross' | 'corner';

export class TerrainRenderer {
  private paths = new Map<string, PathType>();
  private graphics: Phaser.GameObjects.Graphics | null = null;

  private seed(x: number, y: number): number {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h >>> 0) / 4294967296;
  }

  getGroundTile(gridX: number, gridY: number): string {
    const key = `${gridX},${gridY}`;
    if (this.paths.has(key)) {
      return `terrain-path-${this.paths.get(key)}`;
    }
    const idx = Math.floor(this.seed(gridX, gridY) * GRASS_VARIANTS.length);
    return GRASS_VARIANTS[idx];
  }

  setPath(gridX: number, gridY: number, type: PathType): void {
    this.paths.set(`${gridX},${gridY}`, type);
  }

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(-1000);
  }

  render(gridCols: number, gridRows: number): void {
    if (!this.graphics) return;
    this.graphics.clear();

    for (let gx = 0; gx < gridCols; gx++) {
      for (let gy = 0; gy < gridRows; gy++) {
        const { x, y } = gridToScreen(gx, gy);
        const key = `${gx},${gy}`;
        const isPath = this.paths.has(key);
        const color = isPath ? PATH_COLOR : GRASS_COLORS[Math.floor(this.seed(gx, gy) * GRASS_COLORS.length)];

        this.graphics.fillStyle(color, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x, y - TILE_H / 2);
        this.graphics.lineTo(x + TILE_W / 2, y);
        this.graphics.lineTo(x, y + TILE_H / 2);
        this.graphics.lineTo(x - TILE_W / 2, y);
        this.graphics.closePath();
        this.graphics.fillPath();
      }
    }
  }
}

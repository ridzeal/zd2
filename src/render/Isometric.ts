export const TILE_W = 32;
export const TILE_H = 16;

export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_W / 2),
    y: (gridX + gridY) * (TILE_H / 2),
  };
}

export function screenToGrid(screenX: number, screenY: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.round((screenX / (TILE_W / 2) + screenY / (TILE_H / 2)) / 2),
    gridY: Math.round((screenY / (TILE_H / 2) - screenX / (TILE_W / 2)) / 2),
  };
}

export function gridToDepth(gridX: number, gridY: number): number {
  return gridX * 100 + gridY;
}

import { describe, it, expect } from 'vitest';
import { gridToScreen, screenToGrid, gridToDepth, TILE_W, TILE_H } from '../src/render/Isometric';

describe('Isometric coordinate conversion', () => {
  it('converts grid (0,0) to screen origin', () => {
    const s = gridToScreen(0, 0);
    expect(s.x).toBe(0);
    expect(s.y).toBe(0);
  });
  it('converts grid (1,0) to right-one-tile', () => {
    const s = gridToScreen(1, 0);
    expect(s.x).toBe(TILE_W / 2);
    expect(s.y).toBe(TILE_H / 2);
  });
  it('converts grid (0,1) to down-one-tile', () => {
    const s = gridToScreen(0, 1);
    expect(s.x).toBe(-TILE_W / 2);
    expect(s.y).toBe(TILE_H / 2);
  });
  it('roundtrips screen back to grid', () => {
    const s = gridToScreen(3, 5);
    const g = screenToGrid(s.x, s.y);
    expect(g.gridX).toBe(3);
    expect(g.gridY).toBe(5);
  });
  it('depth increases with Y then X', () => {
    expect(gridToDepth(0, 0)).toBeLessThan(gridToDepth(0, 1));
    expect(gridToDepth(0, 1)).toBeLessThan(gridToDepth(1, 0));
  });
});

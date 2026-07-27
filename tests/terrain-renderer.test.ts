import { describe, it, expect } from 'vitest';
import { TerrainRenderer } from '../src/render/TerrainRenderer';

describe('TerrainRenderer', () => {
  it('returns grass tile for empty ground', () => {
    const r = new TerrainRenderer();
    expect(r.getGroundTile(5, 5)).toMatch(/^terrain-grass/);
  });
  it('returns path tile for path coordinates', () => {
    const r = new TerrainRenderer();
    r.setPath(3, 4, 'h');
    expect(r.getGroundTile(3, 4)).toBe('terrain-path-h');
  });
  it('generates random grass variations', () => {
    const r = new TerrainRenderer();
    const tiles = new Set<string>();
    for (let i = 0; i < 50; i++) {
      tiles.add(r.getGroundTile(i % 10, Math.floor(i / 10)));
    }
    expect(tiles.size).toBeGreaterThan(1);
  });
});

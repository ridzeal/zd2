import { describe, it, expect } from 'vitest';
import { ASSET_MANIFEST, getAssetsByCategory, getAssetPath } from '../src/assets/AssetManifest';

describe('AssetManifest', () => {
  it('has entries for all 7 building types', () => {
    const buildings = getAssetsByCategory('building');
    expect(buildings.length).toBe(7);
  });

  it('has entries for all 6 character classes', () => {
    const chars = getAssetsByCategory('character');
    expect(chars.length).toBe(6);
  });

  it('returns correct path for an asset', () => {
    const path = getAssetPath('building-shop');
    expect(path).toBe('/assets/buildings/building-shop.png');
  });

  it('includes terrain tiles', () => {
    const terrain = getAssetsByCategory('terrain');
    expect(terrain.length).toBeGreaterThanOrEqual(4);
  });
});

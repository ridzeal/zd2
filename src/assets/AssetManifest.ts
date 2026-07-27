export type AssetCategory = 'terrain' | 'building' | 'character' | 'decoration' | 'ui';

export interface AssetEntry {
  key: string;
  path: string;
  category: AssetCategory;
  frameWidth?: number;
  frameHeight?: number;
}

export const ASSET_MANIFEST: AssetEntry[] = [
  // Terrain (32x32)
  { key: 'terrain-grass-1', path: '/assets/terrain/grass-1.png', category: 'terrain' },
  { key: 'terrain-grass-2', path: '/assets/terrain/grass-2.png', category: 'terrain' },
  { key: 'terrain-grass-3', path: '/assets/terrain/grass-3.png', category: 'terrain' },
  { key: 'terrain-path-h', path: '/assets/terrain/path-h.png', category: 'terrain' },
  { key: 'terrain-path-v', path: '/assets/terrain/path-v.png', category: 'terrain' },
  { key: 'terrain-path-cross', path: '/assets/terrain/path-cross.png', category: 'terrain' },
  { key: 'terrain-path-corner', path: '/assets/terrain/path-corner.png', category: 'terrain' },

  // Buildings (64x64)
  { key: 'building-shop', path: '/assets/buildings/building-shop.png', category: 'building' },
  { key: 'building-inn', path: '/assets/buildings/building-inn.png', category: 'building' },
  { key: 'building-smithy', path: '/assets/buildings/building-smithy.png', category: 'building' },
  { key: 'building-arena', path: '/assets/buildings/building-arena.png', category: 'building' },
  { key: 'building-entrance', path: '/assets/buildings/building-entrance.png', category: 'building' },
  { key: 'building-library', path: '/assets/buildings/building-library.png', category: 'building' },
  { key: 'building-temple', path: '/assets/buildings/building-temple.png', category: 'building' },

  // Characters (16x16 spritesheet, 4x4 frames)
  { key: 'char-warrior', path: '/assets/characters/char-warrior.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-mage', path: '/assets/characters/char-mage.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-thief', path: '/assets/characters/char-thief.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-cleric', path: '/assets/characters/char-cleric.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-paladin', path: '/assets/characters/char-paladin.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-necromancer', path: '/assets/characters/char-necromancer.png', category: 'character', frameWidth: 16, frameHeight: 16 },

  // Decorations
  { key: 'deco-tree-1', path: '/assets/decorations/deco-tree1.png', category: 'decoration' },
  { key: 'deco-tree-2', path: '/assets/decorations/deco-tree2.png', category: 'decoration' },
  { key: 'deco-bush', path: '/assets/decorations/deco-bush.png', category: 'decoration' },
  { key: 'deco-flower-red', path: '/assets/decorations/deco-flower-red.png', category: 'decoration' },
  { key: 'deco-flower-yellow', path: '/assets/decorations/deco-flower-yellow.png', category: 'decoration' },
  { key: 'deco-rock', path: '/assets/decorations/deco-rock.png', category: 'decoration' },
];

export function getAssetsByCategory(category: AssetCategory): AssetEntry[] {
  return ASSET_MANIFEST.filter((e) => e.category === category);
}

export function getAssetPath(key: string): string | undefined {
  return ASSET_MANIFEST.find((e) => e.key === key)?.path;
}

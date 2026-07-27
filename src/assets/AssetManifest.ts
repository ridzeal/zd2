export type AssetCategory = 'terrain' | 'building' | 'character' | 'decoration' | 'ui';

export interface AssetEntry {
  key: string;
  path: string;
  category: AssetCategory;
  frameWidth?: number;
  frameHeight?: number;
}

export const ASSET_MANIFEST: AssetEntry[] = [
  // Terrain
  { key: 'terrain-grass', path: '/assets/terrain/terrain-grass.png', category: 'terrain' },
  { key: 'terrain-stone', path: '/assets/terrain/terrain-stone.png', category: 'terrain' },
  { key: 'terrain-dirt', path: '/assets/terrain/terrain-dirt.png', category: 'terrain' },
  { key: 'terrain-water', path: '/assets/terrain/terrain-water.png', category: 'terrain' },

  // Buildings (7 types from rooms.json)
  { key: 'building-shop', path: '/assets/buildings/building-shop.png', category: 'building' },
  { key: 'building-inn', path: '/assets/buildings/building-inn.png', category: 'building' },
  { key: 'building-smithy', path: '/assets/buildings/building-smithy.png', category: 'building' },
  { key: 'building-arena', path: '/assets/buildings/building-arena.png', category: 'building' },
  { key: 'building-entrance', path: '/assets/buildings/building-entrance.png', category: 'building' },
  { key: 'building-library', path: '/assets/buildings/building-library.png', category: 'building' },
  { key: 'building-temple', path: '/assets/buildings/building-temple.png', category: 'building' },

  // Characters (6 classes from classes.json)
  { key: 'char-warrior', path: '/assets/characters/char-warrior.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-mage', path: '/assets/characters/char-mage.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-thief', path: '/assets/characters/char-thief.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-cleric', path: '/assets/characters/char-cleric.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-paladin', path: '/assets/characters/char-paladin.png', category: 'character', frameWidth: 16, frameHeight: 16 },
  { key: 'char-necromancer', path: '/assets/characters/char-necromancer.png', category: 'character', frameWidth: 16, frameHeight: 16 },

  // Decorations
  { key: 'deco-torch', path: '/assets/decorations/deco-torch.png', category: 'decoration' },
  { key: 'deco-sign', path: '/assets/decorations/deco-sign.png', category: 'decoration' },

  // UI
  { key: 'ui-gold-icon', path: '/assets/ui/ui-gold-icon.png', category: 'ui' },
  { key: 'ui-heart-icon', path: '/assets/ui/ui-heart-icon.png', category: 'ui' },
];

export function getAssetsByCategory(category: AssetCategory): AssetEntry[] {
  return ASSET_MANIFEST.filter((e) => e.category === category);
}

export function getAssetPath(key: string): string | undefined {
  return ASSET_MANIFEST.find((e) => e.key === key)?.path;
}

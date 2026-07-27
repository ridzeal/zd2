# DV2 Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the flat top-down game into an isometric Dungeon Village 2-style visual experience with pixel art buildings, terrain tiles, character sprites, and atmospheric effects.

**Architecture:** Introduce an isometric rendering layer on top of existing game state. Coordinate conversion utilities transform grid positions to screen positions. A layered renderer handles terrain → decorations → buildings → characters with depth sorting. Asset loading uses a manifest-based system with fallback to procedural placeholders when PNGs aren't available yet.

**Tech Stack:** Phaser 4, TypeScript, Canvas 2D (for procedural fallback sprites), PNG assets (user-provided later)

## Global Constraints

- All assets go in `/public/assets/` subdirectories (terrain/, buildings/, characters/, decorations/, ui/)
- Native resolution: terrain 32x32, buildings 64x64, characters 16x16, decorations 8x8 to 32x48
- PNG format with transparency
- Color palette: warm pastoral (greens #3d7a32-#4a8c3f, browns #8b4513-#c4a66a, golds #ffd700)
- Isometric ratio: 2:1 (TILE_WIDTH=32, TILE_HEIGHT=16)
- Buildings occupy 2x2 grid cells
- Character spritesheets: 16x16 frames, 4 frames x 4 directions
- Depth key: `gridY * 100 + gridX` (higher = in front)
- No visible grid lines in final render
- Tick engine remains decoupled from render (setInterval/accumulator)

---

### Task 1: Isometric Coordinate Utilities

**Covers:** [S4.1]

**Files:**
- Create: `src/render/Isometric.ts`
- Create: `tests/isometric.test.ts`

**Interfaces:**
- Consumes: none (standalone utility)
- Produces: `gridToScreen(gridX, gridY) => {x, y}`, `screenToGrid(screenX, screenY) => {gridX, gridY}`, `GRID_TO_DEPTH(gridX, gridY) => number`, constants `TILE_W=32`, `TILE_H=16`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/isometric.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/isometric.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/render/Isometric.ts
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
  return gridY * 100 + gridX;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/isometric.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/render/Isometric.ts tests/isometric.test.ts
git commit -m "feat: add isometric coordinate conversion utilities"
```

---

### Task 2: Asset Loading Pipeline

**Covers:** [S3, S4.3, S5]

**Files:**
- Create: `src/assets/AssetManifest.ts`
- Modify: `src/scenes/BootScene.ts`
- Create: `tests/asset-manifest.test.ts`

**Interfaces:**
- Consumes: none (standalone)
- Produces: `AssetManifest` type with entries per asset category, `loadAssets(scene: Phaser.Scene)` function, `hasAsset(key: string) => boolean`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/asset-manifest.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/asset-manifest.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/assets/AssetManifest.ts
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
  { key: 'terrain-grass-1', path: '/assets/terrain/grass-1.png', category: 'terrain' },
  { key: 'terrain-grass-2', path: '/assets/terrain/grass-2.png', category: 'terrain' },
  { key: 'terrain-grass-3', path: '/assets/terrain/grass-3.png', category: 'terrain' },
  { key: 'terrain-path-h', path: '/assets/terrain/path-h.png', category: 'terrain' },
  { key: 'terrain-path-v', path: '/assets/terrain/path-v.png', category: 'terrain' },
  { key: 'terrain-path-cross', path: '/assets/terrain/path-cross.png', category: 'terrain' },
  { key: 'terrain-path-corner', path: '/assets/terrain/path-corner.png', category: 'terrain' },

  // Buildings
  { key: 'building-shop', path: '/assets/buildings/building-shop.png', category: 'building' },
  { key: 'building-inn', path: '/assets/buildings/building-inn.png', category: 'building' },
  { key: 'building-smithy', path: '/assets/buildings/building-smithy.png', category: 'building' },
  { key: 'building-arena', path: '/assets/buildings/building-arena.png', category: 'building' },
  { key: 'building-entrance', path: '/assets/buildings/building-entrance.png', category: 'building' },
  { key: 'building-library', path: '/assets/buildings/building-library.png', category: 'building' },
  { key: 'building-temple', path: '/assets/buildings/building-temple.png', category: 'building' },

  // Characters (spritesheets)
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
  return ASSET_MANIFEST.filter(e => e.category === category);
}

export function getAssetPath(key: string): string | undefined {
  return ASSET_MANIFEST.find(e => e.key === key)?.path;
}
```

Modify `src/scenes/BootScene.ts` to load assets via the manifest (with graceful fallback for missing files):

```typescript
// In BootScene.create() — replace or augment existing loading
import { ASSET_MANIFEST, AssetEntry } from '../assets/AssetManifest';

// For each entry, attempt to load. If file doesn't exist, generate a placeholder.
for (const entry of ASSET_MANIFEST) {
  if (entry.frameWidth && entry.frameHeight) {
    this.load.spritesheet(entry.key, entry.path, {
      frameWidth: entry.frameWidth,
      frameHeight: entry.frameHeight,
    });
  } else {
    this.load.image(entry.key, entry.path);
  }
}

// Error handler: generate placeholder for missing assets
this.load.on('loaderror', (file: Phaser.Loader.File) => {
  // Generate a colored placeholder texture
  const key = file.key;
  const size = key.startsWith('char-') ? 16 : key.startsWith('deco-') ? 16 : 32;
  const tex = this.textures.createCanvas(key, size, size);
  if (tex) {
    const ctx = tex.context;
    ctx.fillStyle = '#ff00ff'; // bright pink = missing asset
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, size, size);
    tex.refresh();
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/asset-manifest.test.ts`
Expected: PASS

- [ ] **Step 5: Run existing tests to check for regressions**

Run: `npx vitest run`
Expected: All pass (manifest is additive, no breaking changes)

- [ ] **Step 6: Commit**

```bash
git add src/assets/AssetManifest.ts src/scenes/BootScene.ts tests/asset-manifest.test.ts
git commit -m "feat: add asset manifest and loading pipeline with placeholder fallback"
```

---

### Task 3: Isometric Terrain Renderer

**Covers:** [S3.1, S4.1, S4.2]

**Files:**
- Create: `src/render/TerrainRenderer.ts`
- Modify: `src/scenes/WorldScene.ts`
- Create: `tests/terrain-renderer.test.ts`

**Interfaces:**
- Consumes: `gridToScreen` from Isometric.ts, `ASSET_MANIFEST` from AssetManifest.ts
- Produces: `TerrainRenderer` class with `create(scene)`, `render(state)`, `getGroundTile(gridX, gridY) => string`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/terrain-renderer.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/terrain-renderer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/render/TerrainRenderer.ts
import Phaser from 'phaser';
import { gridToScreen, TILE_W, TILE_H, gridToDepth } from './Isometric';

const GRASS_VARIANTS = ['terrain-grass-1', 'terrain-grass-2', 'terrain-grass-3'];

export class TerrainRenderer {
  private graphics!: Phaser.GameObjects.Graphics;
  private pathMap = new Map<string, string>();
  private seededRandom(x: number, y: number): number {
    // Deterministic variation per tile
    return ((x * 7919 + y * 6271) % 997) / 997;
  }

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(-1000); // Always behind everything
  }

  setPath(gridX: number, gridY: number, type: 'h' | 'v' | 'cross' | 'corner'): void {
    this.pathMap.set(`${gridX},${gridY}`, `terrain-path-${type}`);
  }

  getGroundTile(gridX: number, gridY: number): string {
    const key = `${gridX},${gridY}`;
    const path = this.pathMap.get(key);
    if (path) return path;
    const r = this.seededRandom(gridX, gridY);
    return GRASS_VARIANTS[Math.floor(r * GRASS_VARIANTS.length)];
  }

  render(gridCols: number, gridRows: number): void {
    this.graphics.clear();
    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        const { x, y } = gridToScreen(gx, gy);
        const tileKey = this.getGroundTile(gx, gy);
        // For now, draw a colored diamond (will be replaced by sprite when assets load)
        const color = tileKey.includes('path') ? 0xc4a66a :
                      tileKey === 'terrain-grass-2' ? 0x4a9c4f :
                      tileKey === 'terrain-grass-3' ? 0x3d8a32 : 0x4a8c3f;
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

  destroy(): void {
    this.graphics?.destroy();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/terrain-renderer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/render/TerrainRenderer.ts tests/terrain-renderer.test.ts
git commit -m "feat: add isometric terrain renderer with grass and path tiles"
```

---

### Task 4: Integrate Terrain into WorldScene

**Covers:** [S4.1, S4.2]

**Files:**
- Modify: `src/scenes/WorldScene.ts`

**Interfaces:**
- Consumes: `TerrainRenderer` from Task 3, `gridToScreen/gridToDepth` from Task 1
- Produces: WorldScene renders isometric terrain instead of flat grid

- [ ] **Step 1: Update WorldScene to use isometric rendering**

Replace the grid lines and flat room rendering in `WorldScene.ts`:

```typescript
// In WorldScene.ts — add imports
import { TerrainRenderer } from '../render/TerrainRenderer';
import { gridToScreen, gridToDepth, TILE_W, TILE_H } from '../render/Isometric';

// Add field
private terrain!: TerrainRenderer;

// In create() — replace grid lines with terrain
// REMOVE: grid lines drawing code (lines 42-49)
// ADD:
this.terrain = new TerrainRenderer();
this.terrain.create(this);

// In update() — replace room rendering with isometric sprites
// REMOVE: this.roomGraphics.fillRect(...) loop
// ADD: render rooms as isometric diamonds at grid positions
this.roomGraphics.clear();
for (const room of gameState.rooms) {
  const def = rooms.find(r => r.id === room.typeId);
  if (!def) continue;
  const { x, y } = gridToScreen(room.gridX, room.gridY);
  const depth = gridToDepth(room.gridX, room.gridY);

  // Draw isometric building block
  const color = Phaser.Display.Color.HexStringToColor(def.color).color;
  this.roomGraphics.fillStyle(color, 0.85);

  // Top face
  this.roomGraphics.beginPath();
  this.roomGraphics.moveTo(x, y - TILE_H / 2 - 8); // raised
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

// In update() — convert adventurer rendering to isometric
// REMOVE: this.advGraphics.fillRect for circles
// ADD: render at isometric positions with depth sorting
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
  // Convert pixel position to grid for isometric
  const gridX = adv.data.x / TILE_W;
  const gridY = adv.data.y / TILE_H;
  const { x, y } = gridToScreen(gridX, gridY);
  const depth = gridToDepth(gridX, gridY);

  // Draw character as small isometric figure
  this.advGraphics.fillStyle(color, 0.9);
  this.advGraphics.fillCircle(x, y - 4, 4);
  this.advGraphics.lineStyle(1, 0xffffff, 0.6);
  this.advGraphics.strokeCircle(x, y - 4, 4);

  // HP bar
  const hpRatio = adv.data.hp / adv.data.maxHp;
  const hpColor = hpRatio > 0.3 ? 0x00ff00 : 0xff0000;
  this.advGraphics.fillStyle(0x000000, 0.5);
  this.advGraphics.fillRect(x - 8, y + 6, 16, 2);
  this.advGraphics.fillStyle(hpColor, 0.8);
  this.advGraphics.fillRect(x - 8, y + 6, 16 * hpRatio, 2);
}

// Update preview to isometric
// In the preview section, convert previewX/previewY to isometric
```

- [ ] **Step 2: Run dev server and verify visual**

Run: `just dev`
Open browser → see isometric diamond grid with colored terrain, buildings as 3D-ish blocks

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/scenes/WorldScene.ts
git commit -m "feat: integrate isometric terrain and 3D building rendering into WorldScene"
```

---

### Task 5: Character Sprite System

**Covers:** [S3.3, S4.2]

**Files:**
- Create: `src/render/CharacterRenderer.ts`
- Modify: `src/scenes/WorldScene.ts`
- Modify: `src/entities/Adventurer.ts`

**Interfaces:**
- Consumes: `gridToScreen`, `gridToDepth` from Isometric.ts, character asset keys from AssetManifest
- Produces: `CharacterRenderer` class that replaces circle rendering with animated sprites

- [ ] **Step 1: Create CharacterRenderer**

```typescript
// src/render/CharacterRenderer.ts
import Phaser from 'phaser';
import { gridToScreen, gridToDepth } from './Isometric';
import { Adventurer } from '../entities/Adventurer';

const CLASS_TO_SPRITE: Record<string, string> = {
  warrior: 'char-warrior',
  mage: 'char-mage',
  thief: 'char-thief',
  cleric: 'char-cleric',
  paladin: 'char-paladin',
  necromancer: 'char-necromancer',
};

export class CharacterRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private hpBars = new Map<string, Phaser.GameObjects.Graphics>();
  private scene!: Phaser.Scene;

  create(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  update(adventurers: Adventurer[]): void {
    // Track which sprites are active
    const activeIds = new Set<string>();

    // Sort by depth for proper layering
    const sorted = [...adventurers].sort((a, b) => {
      const da = gridToDepth(a.data.x / 32, a.data.y / 32);
      const db = gridToDepth(b.data.x / 32, b.data.y / 32);
      return da - db;
    });

    for (const adv of sorted) {
      activeIds.add(adv.data.id);
      const spriteKey = CLASS_TO_SPRITE[adv.data.classId] || 'char-warrior';
      const { x, y } = gridToScreen(adv.data.x / 32, adv.data.y / 32);
      const depth = gridToDepth(adv.data.x / 32, adv.data.y / 32);

      let sprite = this.sprites.get(adv.data.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(x, y, spriteKey);
        sprite.setScale(2); // 16px → 32px
        this.sprites.set(adv.data.id, sprite);

        // Create walk animation if it doesn't exist
        const animKey = `${spriteKey}-walk`;
        if (!this.scene.anims.exists(animKey)) {
          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
          });
        }
        sprite.play(animKey);
      }

      sprite.setPosition(x, y - 8);
      sprite.setDepth(depth);

      // HP bar
      let hpBar = this.hpBars.get(adv.data.id);
      if (!hpBar) {
        hpBar = this.scene.add.graphics();
        this.hpBars.set(adv.data.id, hpBar);
      }
      hpBar.clear();
      const hpRatio = adv.data.hp / adv.data.maxHp;
      hpBar.fillStyle(0x000000, 0.5);
      hpBar.fillRect(x - 10, y + 8, 20, 3);
      hpBar.fillStyle(hpRatio > 0.3 ? 0x00ff00 : 0xff0000, 0.8);
      hpBar.fillRect(x - 10, y + 8, 20 * hpRatio, 3);
      hpBar.setDepth(depth);
    }

    // Remove stale sprites
    for (const [id, sprite] of this.sprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
        this.hpBars.get(id)?.destroy();
        this.hpBars.delete(id);
      }
    }
  }

  destroy(): void {
    this.sprites.forEach(s => s.destroy());
    this.hpBars.forEach(h => h.destroy());
    this.sprites.clear();
    this.hpBars.clear();
  }
}
```

- [ ] **Step 2: Integrate into WorldScene**

Add `CharacterRenderer` field, call `create()` in `create()`, call `update()` in `update()` with adventurer array. Remove old `advGraphics` circle rendering.

- [ ] **Step 3: Run dev server and verify**

Run: `just dev`
Characters should render as sprites (or pink placeholders if PNGs missing) with walk animations

- [ ] **Step 4: Commit**

```bash
git add src/render/CharacterRenderer.ts src/scenes/WorldScene.ts
git commit -m "feat: add character sprite system with walk animations and depth sorting"
```

---

### Task 6: Remove Grid Lines and Polish Camera

**Covers:** [S2, S4.4]

**Files:**
- Modify: `src/scenes/WorldScene.ts`

**Interfaces:**
- Consumes: isometric rendering from Tasks 3-5
- Produces: clean camera view without grid lines, centered isometric village

- [ ] **Step 1: Remove grid lines and center camera**

In `WorldScene.ts`:
- Remove the grid lines drawing code entirely (the `grid.lineStyle` / `grid.lineBetween` loops)
- Set camera bounds and center on the isometric grid
- Add slight camera zoom for better framing

```typescript
// In create(), after terrain setup:
const gridPixelW = GRID_COLS * TILE_W;
const gridPixelH = GRID_ROWS * TILE_H;
this.cameras.main.setBounds(-gridPixelW / 2, -gridPixelH / 4, gridPixelW, gridPixelH);
this.cameras.main.centerOn(0, gridPixelH / 4);
this.cameras.main.setZoom(1.2);
```

- [ ] **Step 2: Run dev server and verify**

Run: `just dev`
No grid lines visible, isometric village centered on screen

- [ ] **Step 3: Commit**

```bash
git add src/scenes/WorldScene.ts
git commit -m "feat: remove grid lines, center and zoom isometric camera"
```

---

### Task 7: UI Overhaul — Themed Panels

**Covers:** [S3.5]

**Files:**
- Modify: `src/ui/BuildMenu.ts`
- Modify: `src/scenes/UIScene.ts`

**Interfaces:**
- Consumes: asset keys from AssetManifest
- Produces: Build menu with themed panel backgrounds, building thumbnail icons

- [ ] **Step 1: Update BuildMenu with isometric building previews**

Replace colored rectangles with small isometric building thumbnails:

```typescript
// In BuildMenu.create(), replace the bg rectangle with:
const thumbKey = `building-${room.id}`;
const hasAsset = this.scene.textures.exists(thumbKey);
if (hasAsset) {
  const thumb = this.scene.add.image(-50, 0, thumbKey).setScale(0.5);
  container.add(thumb);
}
// Keep the colored rectangle as fallback, but make it isometric-shaped
const colorNum = Phaser.Display.Color.HexStringToColor(room.color).color;
const bg = this.scene.add.graphics();
bg.fillStyle(colorNum, alpha);
// Draw isometric diamond instead of rectangle
bg.beginPath();
bg.moveTo(0, -BTN_HEIGHT / 2);
bg.lineTo(70, 0);
bg.lineTo(0, BTN_HEIGHT / 2);
bg.lineTo(-70, 0);
bg.closePath();
bg.fillPath();
```

- [ ] **Step 2: Update UIScene panel styling**

Replace plain rectangles with themed panels (warm brown/gold palette):

```typescript
// Panel background
const panelBg = this.add.graphics();
panelBg.fillStyle(0x2a1a0a, 0.85);
panelBg.fillRoundedRect(0, 0, 200, 400, 8);
panelBg.lineStyle(2, 0xc4a66a, 0.8);
panelBg.strokeRoundedRect(0, 0, 200, 400, 8);
```

- [ ] **Step 3: Run dev server and verify**

Run: `just dev`
Build menu shows isometric diamond buttons with building thumbnails, UI panels have warm themed look

- [ ] **Step 4: Commit**

```bash
git add src/ui/BuildMenu.ts src/scenes/UIScene.ts
git commit -m "feat: overhaul UI with themed panels and isometric building previews"
```

---

### Task 8: Enhanced Placeholder Sprite Generator

**Covers:** [S3.2, S3.3]

**Files:**
- Modify: `src/assets/sprites/generateSprites.ts`

**Interfaces:**
- Consumes: asset keys from AssetManifest
- Produces: richer procedural placeholders (isometric buildings, character shapes) for when PNGs aren't available

- [ ] **Step 1: Replace simple shapes with isometric building placeholders**

Update `generateSprites.ts` to draw isometric 3D-ish buildings instead of flat squares:

```typescript
// Replace the 'square' case with isometric building drawing:
case 'square': {
  // Top face (roof)
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.beginPath();
  ctx.moveTo(cx, 2);
  ctx.lineTo(def.size - 2, cy / 2 + 2);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(2, cy / 2 + 2);
  ctx.closePath();
  ctx.fill();

  // Front face (wall)
  const darkerR = Math.max(0, r - 40);
  const darkerG = Math.max(0, g - 40);
  const darkerB = Math.max(0, b - 40);
  ctx.fillStyle = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
  ctx.beginPath();
  ctx.moveTo(2, cy / 2 + 2);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx, def.size - 2);
  ctx.lineTo(2, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Right face
  const darkestR = Math.max(0, r - 60);
  const darkestG = Math.max(0, g - 60);
  const darkestB = Math.max(0, b - 60);
  ctx.fillStyle = `rgb(${darkestR}, ${darkestG}, ${darkestB})`;
  ctx.beginPath();
  ctx.moveTo(def.size - 2, cy / 2 + 2);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx, def.size - 2);
  ctx.lineTo(def.size - 2, cy + 2);
  ctx.closePath();
  ctx.fill();
  break;
}
```

- [ ] **Step 2: Run dev server and verify**

Run: `just dev`
Buildings now render as isometric 3D-ish shapes instead of flat rectangles (still procedural, but much closer to DV2 style)

- [ ] **Step 3: Commit**

```bash
git add src/assets/sprites/generateSprites.ts
git commit -m "feat: upgrade placeholder sprites to isometric 3D building shapes"
```

---

### Task 9: HD-2D Atmosphere Effects

**Covers:** [S2]

**Files:**
- Modify: `src/shaders/HD2DPipeline.ts`

**Interfaces:**
- Consumes: existing camera
- Produces: enhanced vignette, color grading, soft shadow feel

- [ ] **Step 1: Enhance HD-2D pipeline**

```typescript
// src/shaders/HD2DPipeline.ts
export function applyHD2DEffects(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;

  // Stronger vignette for DV2 atmosphere
  camera.filters.internal.addVignette(0.5, 0.5, 0.5, 0.4);

  // Warmer color grading — boost reds/yellows, slight saturation
  const cm = camera.filters.internal.addColorMatrix();
  cm.colorMatrix.saturate(0.15);
  cm.colorMatrix.rotate(5); // slight warm shift

  // Subtle brightness boost for pastoral feel
  cm.colorMatrix.brightness(1.05);
}
```

- [ ] **Step 2: Run dev server and verify**

Run: `just dev`
Scene has warmer colors, stronger vignette, pastoral atmosphere

- [ ] **Step 3: Commit**

```bash
git add src/shaders/HD2DPipeline.ts
git commit -m "feat: enhance HD-2D atmosphere with warmer color grading and vignette"
```

---

### Task 10: Final Integration Test

**Covers:** [S2, S3, S4, S5, S7]

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run dev server and manual smoke test**

Run: `just dev`
Verify:
- Isometric grid renders with grass terrain
- Buildings appear as 3D-ish blocks (or pink placeholders)
- Characters walk with animation (or pink placeholders)
- No visible grid lines
- UI panels have warm themed look
- Camera is centered and zoomed
- Game loop still works (tick, gold, adventurer spawning)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete DV2 visual overhaul — isometric rendering, terrain, placeholders"
```

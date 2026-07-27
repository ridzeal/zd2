# Dungeon Village 2 Visual Overhaul — Design Spec

## [S1] Problem

The game currently uses flat top-down rendering: colored rectangles for rooms, colored circles for adventurers, black background with visible grid lines. This does not match the Dungeon Village 2 aesthetic, which uses an isometric perspective with detailed pixel art buildings, terrain tiles, and character sprites — creating a "flattened 3D" look.

## [S2] Target Aesthetic

Dungeon Village 2 (Kairosoft) style:
- **Isometric camera** (~30° angle) — grid cells become diamond-shaped
- **Buildings** show roof + front wall + door — pseudo-3D with depth
- **Terrain** is grass tiles with dirt/stone paths connecting buildings
- **Characters** are small pixel art sprites with walk animations
- **Decorations** — trees, flowers, bushes add life to the village
- **Atmosphere** — warm pastoral palette, soft vignette, no visible grid lines
- **Depth sorting** — ground → decorations → buildings → characters → sky

## [S3] Asset Specifications

All assets are user-provided PNG files. The code will load them as Phaser spritesheets or individual textures.

### [S3.1] Terrain Tiles

| Tile | Size | Notes |
|------|------|-------|
| `grass-1.png` | 32x32 | Base grass tile, seamless tiling |
| `grass-2.png` | 32x32 | Variation with slight color/texture difference |
| `grass-3.png` | 32x32 | Variation with small grass blades |
| `path-h.png` | 32x32 | Horizontal dirt/stone path |
| `path-v.png` | 32x32 | Vertical dirt/stone path |
| `path-cross.png` | 32x32 | Path intersection |
| `path-corner.png` | 32x32 | Path corner/turn |
| `water.png` | 32x32 | Water tile (optional for MVP) |

**Style**: Top-down pixel art, 16x16 or 32x32 native resolution scaled up. Warm green palette for grass (#4a8c3f to #3d7a32 range). Paths are sandy/brown (#c4a66a range).

### [S3.2] Building Sprites

Each building is a **2x2 tile** structure (64x64 at 32px/tile) showing roof, walls, and door.

| Building | File | Size | Visual Description |
|----------|------|------|--------------------|
| Item Shop | `building-shop.png` | 64x64 | Blue-tinted roof, shop sign, display window |
| Inn | `building-inn.png` | 64x64 | Warm brown roof, welcoming door, lantern |
| Smithy | `building-smithy.png` | 64x64 | Dark roof, anvil symbol, smokestack |
| Arena | `building-arena.png` | 64x64 | Open roof/colosseum style, banner |
| Dungeon Entrance | `building-entrance.png` | 64x64 | Stone arch, dark doorway, torch |
| Library | `building-library.png` | 64x64 | Green-tinted roof, book symbol |
| Temple | `building-temple.png` | 64x64 | Golden roof, ornate door, peaceful |

**Style**: Isometric pixel art. Each building shows:
- **Roof** (top 40%): colored tiles/shingles, slight perspective angle
- **Front wall** (bottom 60%): stone/wood texture, door in center
- **Optional**: window, sign, chimney, torch for character

**Native resolution**: 64x64 pixels (rendered at 2x = 128x128 on screen). Each building occupies 2x2 grid cells.

### [S3.3] Character Sprites

Each character class needs a **walk animation spritesheet**.

| Class | File | Frame Size | Frames | Directions |
|-------|------|------------|--------|------------|
| Warrior | `char-warrior.png` | 16x16 | 4 frames x 4 dirs | Down, Left, Right, Up |
| Mage | `char-mage.png` | 16x16 | 4 frames x 4 dirs | Down, Left, Right, Up |
| Thief | `char-thief.png` | 16x16 | 4 frames x 4 dirs | Down, Left, Right, Up |
| Cleric | `char-cleric.png` | 16x16 | 4 frames x 4 dirs | Down, Left, Right, Up |
| Paladin | `char-paladin.png` | 16x16 | 4 frames x 4 dirs | Down, Left, Right, Up |
| Necromancer | `char-necromancer.png` | 16x16 | 4 frames x 4 dirs | Down, Left, Right, Up |

**Spritesheet layout**: Horizontal strip, 16 frames total (4 directions x 4 animation frames). Each direction is a row or sequential block.

**Style**: Cute/chibi pixel art, 16x16 native (rendered at 2x = 32x32). Distinct silhouette per class. Warm color palette matching the pastoral theme.

### [S3.4] Decoration Sprites

| Decoration | File | Size | Notes |
|------------|------|------|-------|
| Tree 1 | `deco-tree1.png` | 32x48 | Oak-style, green canopy |
| Tree 2 | `deco-tree2.png` | 32x48 | Pine-style, darker green |
| Bush | `deco-bush.png` | 16x16 | Small round bush |
| Flower red | `deco-flower-red.png` | 8x8 | Small red flower |
| Flower yellow | `deco-flower-yellow.png` | 8x8 | Small yellow flower |
| Rock | `deco-rock.png` | 16x16 | Small gray rock |
| Fence | `deco-fence.png` | 32x16 | Wooden fence segment |

### [S3.5] UI Elements

| Element | File | Size | Notes |
|---------|------|------|-------|
| Panel background | `ui-panel.png` | N/A | 9-sliceable panel for menus |
| Gold icon | `ui-gold.png` | 16x16 | Coin sprite |
| Day icon | `ui-day.png` | 16x16 | Sun/calendar icon |
| Level icon | `ui-level.png` | 16x16 | Star/arrow icon |
| Button normal | `ui-btn-normal.png` | N/A | 9-sliceable button |
| Button hover | `ui-btn-hover.png` | N/A | 9-sliceable button hover |
| Button selected | `ui-btn-selected.png` | N/A | 9-sliceable button active |

## [S4] Rendering Pipeline

### [S4.1] Isometric Camera

- Convert grid coordinates (gridX, gridY) to screen coordinates:
  - `screenX = (gridX - gridY) * (TILE_WIDTH / 2)`
  - `screenY = (gridX + gridY) * (TILE_HEIGHT / 2)`
- TILE_WIDTH = 32, TILE_HEIGHT = 16 (standard 2:1 isometric ratio)
- Camera offset to center the village in the viewport

### [S4.2] Depth Sorting

Render order (back to front):
1. Terrain tiles (ground layer)
2. Decorations (trees, flowers — by Y position)
3. Buildings (by Y position of their base)
4. Characters (by Y position)
5. Floating text / UI overlays

Depth key for isometric: `depth = gridY * 100 + gridX` (higher = rendered later = in front)

### [S4.3] Asset Loading

- Load all PNGs in BootScene via `this.load.image()` or `this.load.spritesheet()`
- Character spritesheets use `this.load.spritesheet()` with frameWidth/frameHeight
- Create animations in WorldScene `create()` via `this.anims.create()`

### [S4.4] Building Placement

- Buildings occupy 2x2 grid cells
- When placing, mark all 4 cells as occupied
- Render building sprite at the isometric position of the top-left cell
- Building origin point: center-bottom (so it sits on the ground properly)

## [S5] File Structure for Assets

```
/public/assets/
  /terrain/
    grass-1.png, grass-2.png, grass-3.png
    path-h.png, path-v.png, path-cross.png, path-corner.png
    water.png
  /buildings/
    building-shop.png, building-inn.png, building-smithy.png
    building-arena.png, building-entrance.png
    building-library.png, building-temple.png
  /characters/
    char-warrior.png, char-mage.png, char-thief.png
    char-cleric.png, char-paladin.png, char-necromancer.png
  /decorations/
    deco-tree1.png, deco-tree2.png, deco-bush.png
    deco-flower-red.png, deco-flower-yellow.png
    deco-rock.png, deco-fence.png
  /ui/
    ui-panel.png, ui-gold.png, ui-day.png, ui-level.png
    ui-btn-normal.png, ui-btn-hover.png, ui-btn-selected.png
```

## [S6] Implementation Phases

1. **Asset loading pipeline** — load PNGs in BootScene, replace procedural sprites
2. **Isometric renderer** — replace flat grid with isometric tile rendering
3. **Building sprites** — replace colored rects with building PNGs
4. **Character sprites** — replace circles with animated character spritesheets
5. **Terrain system** — render grass tiles across the grid, add path placement
6. **Decorations** — scatter trees/flowers/bushes on empty tiles
7. **Depth sorting** — implement proper render ordering
8. **UI polish** — themed panels, icons, remove grid lines
9. **Atmosphere** — vignette, color grading, soft shadows

## [S7] Constraints

- All assets must be provided by the user (no external asset downloads in code)
- Asset spec above is the contract — code will load files from `/public/assets/` paths
- Native resolution: terrain 32x32, buildings 64x64, characters 16x16, decorations 8x8 to 32x48
- PNG format with transparency
- Color palette: warm pastoral (greens, browns, golds) — no neon or saturated colors

# Phaser 3 → 4 Full Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Zeal Village project from Phaser 3.90 to Phaser 4.2.1, rebuilding phases 0-3 (scaffold, rooms, adventurers, economy loop) with clean Phaser 4 idioms.

**Architecture:** Pure TypeScript core systems (GameState, TickEngine, EventBus, SaveSystem) remain unchanged. Rendering layer (scenes, UI, sprite generation, HD-2D effects) rewritten for Phaser 4's new Filter system, DynamicTexture API, and node-based renderer.

**Tech Stack:** Phaser 4.2.1, TypeScript 7, Vite 8, Vitest 4

## Global Constraints

- Phaser version: `^4.2.1` (latest stable)
- Dev server port: 3020 (via `just dev`)
- Test runner: Vitest (`npm test`)
- Typecheck: `npx tsc --noEmit`
- Data files (`src/data/*.json`) are unchanged — do not modify
- Core systems (`src/core/GameState.ts`, `EventBus.ts`, `TickEngine.ts`, `SaveSystem.ts`) are pure TS — minimal changes only (import paths)
- Systems (`src/systems/*.ts`) are pure TS — no changes needed
- Every task ends with a testable build (`just dev` boots, game renders)

---

### Task 1: Update Project Configuration

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts` (no changes needed, already correct)

- [ ] **Step 1: Update package.json**

Change phaser dependency from `^3.90.0` to `^4.2.1`:

```json
{
  "name": "zeal-village",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^4.2.1"
  },
  "devDependencies": {
    "typescript": "^7.0.2",
    "vite": "^8.1.5",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Update tsconfig.json**

Add `typeRoots` and `types` for Phaser 4 TypeScript definitions (per migration guide):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "typeRoots": ["./node_modules/phaser/types"],
    "types": ["Phaser"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: `phaser@4.2.1` installed, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: upgrade phaser 3.90 → 4.2.1, update tsconfig for v4 types"
```

---

### Task 2: Rewrite Sprite Generation for Phaser 4

**Files:**
- Rewrite: `src/assets/sprites/generateSprites.ts`

**Context:** `Graphics.generateTexture()` was removed in Phaser 4. Must use `scene.textures.createCanvas()` to create DynamicTexture, draw onto its context, then call `refresh()`.

- [ ] **Step 1: Rewrite generateSprites.ts**

```typescript
import Phaser from 'phaser';

interface SpriteDef {
  key: string;
  color: number;
  shape: 'square' | 'circle' | 'triangle' | 'diamond';
  size: number;
}

const ROOM_SPRITES: SpriteDef[] = [
  { key: 'sprite-shop', color: 0x4a9eff, shape: 'square', size: 32 },
  { key: 'sprite-inn', color: 0x50c878, shape: 'square', size: 32 },
  { key: 'sprite-smithy', color: 0xff6347, shape: 'square', size: 32 },
  { key: 'sprite-arena', color: 0xffd700, shape: 'square', size: 32 },
  { key: 'sprite-entrance', color: 0x9b59b6, shape: 'diamond', size: 32 },
  { key: 'sprite-library', color: 0x1abc9c, shape: 'square', size: 32 },
  { key: 'sprite-temple', color: 0xe67e22, shape: 'triangle', size: 32 },
];

const CLASS_SPRITES: SpriteDef[] = [
  { key: 'sprite-warrior', color: 0xe74c3c, shape: 'circle', size: 16 },
  { key: 'sprite-mage', color: 0x3498db, shape: 'circle', size: 16 },
  { key: 'sprite-thief', color: 0x2ecc71, shape: 'circle', size: 16 },
  { key: 'sprite-cleric', color: 0xf39c12, shape: 'circle', size: 16 },
  { key: 'sprite-paladin', color: 0xf1c40f, shape: 'circle', size: 16 },
  { key: 'sprite-necromancer', color: 0x8e44ad, shape: 'circle', size: 16 },
];

export function generateSprites(scene: Phaser.Scene): void {
  const allDefs = [...ROOM_SPRITES, ...CLASS_SPRITES];

  for (const def of allDefs) {
    // Skip if texture already exists (e.g. on scene restart)
    if (scene.textures.exists(def.key)) continue;

    const texture = scene.textures.createCanvas(def.key, def.size, def.size);
    if (!texture) continue;

    const ctx = texture.context;
    const colorStr = intToRgbString(def.color);

    ctx.fillStyle = colorStr;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    const cx = def.size / 2;
    const cy = def.size / 2;
    const half = def.size / 2 - 1;

    switch (def.shape) {
      case 'square':
        ctx.fillRect(1, 1, def.size - 2, def.size - 2);
        ctx.strokeRect(1, 1, def.size - 2, def.size - 2);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(cx, cy, half, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(cx, 1);
        ctx.lineTo(1, def.size - 1);
        ctx.lineTo(def.size - 1, def.size - 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(cx, 1);
        ctx.lineTo(def.size - 1, cy);
        ctx.lineTo(cx, def.size - 1);
        ctx.lineTo(1, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }

    texture.refresh();
  }
}

function intToRgbString(color: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/assets/sprites/generateSprites.ts
git commit -m "feat: rewrite sprite generation for Phaser 4 DynamicTexture API"
```

---

### Task 3: Rewrite HD-2D Pipeline for Phaser 4 Filters

**Files:**
- Rewrite: `src/shaders/HD2DPipeline.ts`

**Context:** Phaser 4 unified FX and Masks into a Filters system. `camera.postFX` is replaced by `camera.filters.internal` / `camera.filters.external`. The `addColorMatrix()` now returns a Filter, and color methods are on a `.colorMatrix` property.

- [ ] **Step 1: Rewrite HD2DPipeline.ts**

```typescript
import Phaser from 'phaser';

export function applyHD2DEffects(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;

  // Vignette effect — darkens edges
  camera.filters.internal.add(new Phaser.FX.Vignette(camera, {
    x: 0.5,
    y: 0.5,
    radius: 0.4,
    strength: 0.3,
  }));

  // Color grading — warm tint, slight saturation boost
  const colorMatrix = new Phaser.FX.ColorMatrix(camera);
  colorMatrix.colorMatrix.saturate(0.1);
  camera.filters.internal.add(colorMatrix);
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors (may need to adjust based on actual Phaser 4 FX API surface).

- [ ] **Step 3: Commit**

```bash
git add src/shaders/HD2DPipeline.ts
git commit -m "feat: rewrite HD-2D effects using Phaser 4 unified Filter system"
```

---

### Task 4: Rewrite Scenes for Phaser 4

**Files:**
- Rewrite: `src/scenes/BootScene.ts`
- Rewrite: `src/scenes/WorldScene.ts`
- Rewrite: `src/scenes/UIScene.ts`

**Context:** Scenes use standard Phaser API (Scene, Graphics, Text, Input, Tweens) which is mostly compatible with v4. Main changes: remove any `postFX` references (handled in HD2DPipeline), ensure `roundPixels` config is correct.

- [ ] **Step 1: Rewrite BootScene.ts**

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scene.launch('UIScene');
    this.scene.start('WorldScene');
  }
}
```

(No changes needed — already clean.)

- [ ] **Step 2: Rewrite WorldScene.ts**

```typescript
import Phaser from 'phaser';
import { gameState, placeRoom } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import { RoomDef } from '../core/GameState';
import roomsData from '../data/rooms.json';
import classesData from '../data/classes.json';
import { getAllAdventurers } from '../systems/AISystem';
import { generateSprites } from '../assets/sprites/generateSprites';
import { applyHD2DEffects } from '../shaders/HD2DPipeline';

const rooms: RoomDef[] = roomsData as RoomDef[];
const GRID_SIZE = 32;
const GRID_COLS = 25;
const GRID_ROWS = 18;

interface ClassDef {
  id: string;
  name: string;
  color: string;
}
const classes: ClassDef[] = classesData as ClassDef[];

export class WorldScene extends Phaser.Scene {
  private roomGraphics!: Phaser.GameObjects.Graphics;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private advGraphics!: Phaser.GameObjects.Graphics;
  private previewX = -1;
  private previewY = -1;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    generateSprites(this);
    applyHD2DEffects(this);

    // Grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x333355, 0.5);
    for (let x = 0; x <= GRID_COLS; x++) {
      grid.lineBetween(x * GRID_SIZE, 0, x * GRID_SIZE, GRID_ROWS * GRID_SIZE);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      grid.lineBetween(0, y * GRID_SIZE, GRID_COLS * GRID_SIZE, y * GRID_SIZE);
    }

    this.roomGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();
    this.advGraphics = this.add.graphics();

    // Grid click to place room
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const selectedType = this.registry.get('selectedRoomType') as string | null;
      if (!selectedType) return;

      const gridX = Math.floor(pointer.x / GRID_SIZE);
      const gridY = Math.floor(pointer.y / GRID_SIZE);
      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;

      const roomDef = rooms.find(r => r.id === selectedType);
      if (!roomDef) return;

      if (placeRoom(gameState, roomDef, gridX, gridY)) {
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
      this.previewX = Math.floor(pointer.x / GRID_SIZE);
      this.previewY = Math.floor(pointer.y / GRID_SIZE);
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
    // Redraw rooms
    this.roomGraphics.clear();
    for (const room of gameState.rooms) {
      const def = rooms.find(r => r.id === room.typeId);
      if (!def) continue;
      this.roomGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(def.color).color, 0.85);
      this.roomGraphics.fillRect(
        room.gridX * GRID_SIZE + 1,
        room.gridY * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
      this.roomGraphics.lineStyle(1, 0xffffff, 0.6);
      this.roomGraphics.strokeRect(
        room.gridX * GRID_SIZE + 1,
        room.gridY * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
    }

    // Adventurers (sorted by Y for depth)
    this.advGraphics.clear();
    const advMap = getAllAdventurers();
    const advArray = Array.from(advMap.values());
    advArray.sort((a, b) => a.data.y - b.data.y);
    for (const adv of advArray) {
      const cls = classes.find(c => c.id === adv.data.classId);
      const color = cls ? Phaser.Display.Color.HexStringToColor(cls.color).color : 0xffffff;
      adv.render(this.advGraphics, color);
    }

    // Preview
    this.previewGraphics.clear();
    const selectedType = this.registry.get('selectedRoomType') as string | null;
    if (selectedType && this.previewX >= 0 && this.previewY >= 0
        && this.previewX < GRID_COLS && this.previewY < GRID_ROWS) {
      const def = rooms.find(r => r.id === selectedType);
      if (def) {
        const occupied = gameState.rooms.some(r => r.gridX === this.previewX && r.gridY === this.previewY);
        const canAfford = gameState.gold >= def.cost;
        const alpha = occupied || !canAfford ? 0.2 : 0.4;
        this.previewGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(def.color).color, alpha);
        this.previewGraphics.fillRect(
          this.previewX * GRID_SIZE + 1,
          this.previewY * GRID_SIZE + 1,
          GRID_SIZE - 2,
          GRID_SIZE - 2,
        );
      }
    }
  }
}
```

- [ ] **Step 3: Rewrite UIScene.ts**

```typescript
import Phaser from 'phaser';
import { BuildMenu } from '../ui/BuildMenu';
import { SpeedToggle } from '../ui/SpeedToggle';
import { SaveLoadUI } from '../ui/SaveLoadUI';
import { ActivityLog } from '../ui/ActivityLog';
import { gameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';

export class UIScene extends Phaser.Scene {
  private buildMenu!: BuildMenu;
  private speedToggle!: SpeedToggle;
  private saveLoadUI!: SaveLoadUI;
  private activityLog!: ActivityLog;
  private tickText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.tickText = this.add.text(10, 8, 'Tick: 0', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setDepth(200);
    this.dayText = this.add.text(10, 24, 'Day: 1', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setDepth(200);
    this.goldText = this.add.text(10, 40, 'Gold: 100', {
      fontSize: '14px', color: '#ffd700', fontFamily: 'monospace',
    }).setDepth(200);
    this.levelText = this.add.text(10, 56, 'Level: 1', {
      fontSize: '14px', color: '#00ff00', fontFamily: 'monospace',
    }).setDepth(200);

    eventBus.on('gold-change', () => {
      this.goldText?.setText(`Gold: ${gameState.gold}`);
    });
    eventBus.on('tick', (data) => {
      this.tickText?.setText(`Tick: ${data.tick}`);
      this.dayText?.setText(`Day: ${data.day}`);
    });
    eventBus.on('level-up', (data) => {
      this.levelText?.setText(`Level: ${data.level}`);
    });

    this.buildMenu = new BuildMenu(this);
    this.buildMenu.create();
    this.speedToggle = new SpeedToggle(this);
    this.speedToggle.create();
    this.saveLoadUI = new SaveLoadUI(this);
    this.saveLoadUI.create();
    this.activityLog = new ActivityLog(this);
    this.activityLog.create();
  }
}
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BootScene.ts src/scenes/WorldScene.ts src/scenes/UIScene.ts
git commit -m "feat: rewrite scenes for Phaser 4 compatibility"
```

---

### Task 5: Rewrite UI Components for Phaser 4

**Files:**
- Rewrite: `src/ui/BuildMenu.ts`
- Rewrite: `src/ui/SpeedToggle.ts`
- Rewrite: `src/ui/SaveLoadUI.ts`
- Rewrite: `src/ui/ActivityLog.ts`

**Context:** UI uses standard Phaser API (Container, Rectangle, Text, Input). These are compatible with v4. No breaking changes needed — rewrite for cleanliness.

- [ ] **Step 1: Rewrite BuildMenu.ts**

```typescript
import Phaser from 'phaser';
import { RoomDef, gameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import roomsData from '../data/rooms.json';

const rooms: RoomDef[] = roomsData as RoomDef[];
const MENU_X = 10;
const MENU_START_Y = 95;
const BTN_HEIGHT = 32;
const BTN_GAP = 3;

export class BuildMenu {
  private scene: Phaser.Scene;
  private buttons: Phaser.GameObjects.Container[] = [];
  private selectedId: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    rooms.forEach((room, i) => {
      const y = MENU_START_Y + i * (BTN_HEIGHT + BTN_GAP);
      const colorNum = Phaser.Display.Color.HexStringToColor(room.color).color;
      const isLocked = room.unlockLevel > gameState.level;
      const alpha = isLocked ? 0.3 : 0.8;

      const bg = this.scene.add.rectangle(0, 0, 140, BTN_HEIGHT, colorNum, alpha)
        .setStrokeStyle(1, 0xffffff, isLocked ? 0.3 : 0.6);

      const lockText = isLocked ? ' 🔒' : '';
      const label = this.scene.add.text(0, 0, `${room.name} (${room.cost}g)${lockText}`, {
        fontSize: '12px', color: isLocked ? '#888888' : '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const container = this.scene.add.container(MENU_X + 70, y, [bg, label]);
      container.setSize(140, BTN_HEIGHT);

      if (!isLocked) {
        container.setInteractive({ useHandCursor: true });

        container.on('pointerdown', () => {
          if (this.selectedId === room.id) {
            this.deselect();
          } else {
            this.select(room.id);
          }
        });

        container.on('pointerover', () => bg.setAlpha(1));
        container.on('pointerout', () => bg.setAlpha(this.selectedId === room.id ? 1 : 0.8));
      }

      this.buttons.push(container);
    });

    eventBus.on('deselect-room', () => this.deselect());
    eventBus.on('level-up', () => this.refresh());
  }

  refresh(): void {
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
    this.selectedId = null;
    this.scene.registry.set('selectedRoomType', null);
    this.create();
  }

  select(roomId: string): void {
    this.selectedId = roomId;
    this.scene.registry.set('selectedRoomType', roomId);
    this.buttons.forEach((btn, i) => {
      if (i >= rooms.length) return;
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(rooms[i].id === roomId ? 3 : 1, 0xffffff, rooms[i].id === roomId ? 1 : 0.6);
    });
  }

  deselect(): void {
    this.selectedId = null;
    this.scene.registry.set('selectedRoomType', null);
    this.buttons.forEach((btn) => {
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(1, 0xffffff, 0.6);
      bg.setAlpha(0.8);
    });
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }
}
```

- [ ] **Step 2: Rewrite SpeedToggle.ts**

```typescript
import Phaser from 'phaser';
import { eventBus } from '../core/EventBus';

const BTN_X = 740;
const BTN_Y = 505;
const BTN_WIDTH = 50;
const BTN_HEIGHT = 28;

export class SpeedToggle {
  private scene: Phaser.Scene;
  private bg!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private currentSpeed: 1 | 2 = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.bg = this.scene.add.rectangle(BTN_X, BTN_Y, BTN_WIDTH, BTN_HEIGHT, 0x333355, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(300);

    this.label = this.scene.add.text(BTN_X, BTN_Y, '1x', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(300);

    this.bg.on('pointerdown', () => {
      this.currentSpeed = this.currentSpeed === 1 ? 2 : 1;
      this.label.setText(`${this.currentSpeed}x`);
      eventBus.emit('speed-change', { speed: this.currentSpeed });
    });

    this.bg.on('pointerover', () => this.bg.setAlpha(1));
    this.bg.on('pointerout', () => this.bg.setAlpha(0.8));
  }
}
```

- [ ] **Step 3: Rewrite SaveLoadUI.ts**

```typescript
import Phaser from 'phaser';
import { gameState } from '../core/GameState';
import { saveGame, loadGame } from '../core/SaveSystem';

const BTN_X = 620;
const BTN_Y = 505;
const BTN_WIDTH = 50;
const BTN_HEIGHT = 28;
const GAP = 56;

export class SaveLoadUI {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const saveBg = this.scene.add.rectangle(BTN_X, BTN_Y, BTN_WIDTH, BTN_HEIGHT, 0x27ae60, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(200);

    this.scene.add.text(BTN_X, BTN_Y, 'Save', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(200);

    saveBg.on('pointerdown', () => {
      saveGame(gameState);
      this.showToast('Game Saved!');
    });
    saveBg.on('pointerover', () => saveBg.setAlpha(1));
    saveBg.on('pointerout', () => saveBg.setAlpha(0.8));

    const loadBg = this.scene.add.rectangle(BTN_X + GAP, BTN_Y, BTN_WIDTH, BTN_HEIGHT, 0x2980b9, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(200);

    this.scene.add.text(BTN_X + GAP, BTN_Y, 'Load', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(200);

    loadBg.on('pointerdown', () => {
      const data = loadGame();
      if (data) {
        Object.assign(gameState, data);
        this.showToast('Game Loaded!');
      } else {
        this.showToast('No Save Found');
      }
    });
    loadBg.on('pointerover', () => loadBg.setAlpha(1));
    loadBg.on('pointerout', () => loadBg.setAlpha(0.8));
  }

  private showToast(text: string): void {
    const txt = this.scene.add.text(400, 300, text, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#000000aa',
    }).setOrigin(0.5).setDepth(1000);

    this.scene.tweens.add({
      targets: txt,
      y: 280,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }
}
```

- [ ] **Step 4: Rewrite ActivityLog.ts**

```typescript
import Phaser from 'phaser';
import { eventBus } from '../core/EventBus';

const LOG_X = 10;
const LOG_HEIGHT = 80;
const MAX_LOGS = 50;
const VISIBLE_LOGS = 3;

export class ActivityLog {
  private scene: Phaser.Scene;
  private logs: string[] = [];
  private textObjects: Phaser.GameObjects.Text[] = [];
  private expanded = false;
  private bg!: Phaser.GameObjects.Rectangle;
  private toggleBtn!: Phaser.GameObjects.Text;
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const gameHeight = 600;
    const logAreaY = gameHeight - LOG_HEIGHT;

    this.bg = this.scene.add.rectangle(400, logAreaY + LOG_HEIGHT / 2, 800, LOG_HEIGHT, 0x000000, 0.7)
      .setDepth(90);

    this.toggleBtn = this.scene.add.text(780, logAreaY + 4, '▲', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(91).setInteractive({ useHandCursor: true });

    this.toggleBtn.on('pointerdown', () => {
      this.expanded = !this.expanded;
      this.toggleBtn.setText(this.expanded ? '▼' : '▲');
      this.refreshDisplay();
    });

    this.container = this.scene.add.container(0, 0).setDepth(91);

    for (let i = 0; i < VISIBLE_LOGS; i++) {
      const txt = this.scene.add.text(LOG_X, logAreaY + 6 + i * 18, '', {
        fontSize: '12px', color: '#cccccc', fontFamily: 'monospace',
      });
      this.textObjects.push(txt);
      this.container.add(txt);
    }

    eventBus.on('room-interaction', (data) => {
      this.addLog(data.text, data.color);
    });
    eventBus.on('milestone-reached', (data) => {
      this.addLog(`Milestone reached: Day ${data.day}`, '#ffd700');
    });
    eventBus.on('adventurer-arrived', (data) => {
      this.addLog(`New adventurer arrived: ${data.classId}`, '#00ff00');
    });
    eventBus.on('quest-complete', (data) => {
      this.addLog(`Quest ${data.won ? 'won' : 'lost'} by ${data.advId}`, data.won ? '#ffd700' : '#ff4444');
    });
    eventBus.on('level-up', (data) => {
      this.addLog(`Level up! Now level ${data.level}`, '#ffd700');
    });
  }

  private addLog(text: string, color?: string): void {
    const timestamp = `D${this.scene.registry.get('day') || 1}`;
    const entry = `[${timestamp}] ${text}`;
    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.pop();
    }
    this.refreshDisplay();
  }

  private refreshDisplay(): void {
    const visibleCount = this.expanded ? VISIBLE_LOGS : Math.min(VISIBLE_LOGS, this.logs.length);
    for (let i = 0; i < VISIBLE_LOGS; i++) {
      if (i < visibleCount && i < this.logs.length) {
        this.textObjects[i].setText(this.logs[i]);
        this.textObjects[i].setAlpha(1 - i * 0.2);
      } else {
        this.textObjects[i].setText('');
      }
    }
  }
}
```

- [ ] **Step 5: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/BuildMenu.ts src/ui/SpeedToggle.ts src/ui/SaveLoadUI.ts src/ui/ActivityLog.ts
git commit -m "feat: rewrite UI components for Phaser 4"
```

---

### Task 6: Update Main Entry Point

**Files:**
- Modify: `src/main.ts`

**Context:** Update `render.roundPixels` to `false` (v4 default, but explicit is better). Remove `antialias: false` if it causes issues with v4 renderer.

- [ ] **Step 1: Rewrite main.ts**

```typescript
import Phaser from 'phaser';
import { gameState } from './core/GameState';
import { TickEngine } from './core/TickEngine';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { loadGame, saveGame, hasSave } from './core/SaveSystem';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, WorldScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    roundPixels: false,
  },
};

if (hasSave()) {
  const data = loadGame();
  if (data) {
    Object.assign(gameState, data);
  }
}

const game = new Phaser.Game(config);

setTimeout(() => {
  const engine = new TickEngine(gameState, () => {});
  engine.start();
}, 500);

window.addEventListener('beforeunload', () => {
  saveGame(gameState);
});

setInterval(() => {
  saveGame(gameState);
}, 60000);
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: update main entry point for Phaser 4 config"
```

---

### Task 7: Update Documentation

**Files:**
- Modify: `roadmap.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update roadmap.md tech stack line**

Change line 4 from:
```
- **Engine**: Phaser 3 + TypeScript
```
to:
```
- **Engine**: Phaser 4 + TypeScript
```

- [ ] **Step 2: Update AGENTS.md stack line**

Change the stack section from `Phaser 3` to `Phaser 4`.

- [ ] **Step 3: Commit**

```bash
git add roadmap.md AGENTS.md
git commit -m "docs: update references from Phaser 3 to Phaser 4"
```

---

### Task 8: Full Verification

**Files:** None (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Start dev server and verify**

Run: `just dev`
Expected: Dev server starts on port 3020. Open browser — game boots, shows grid, day/tick counter increments, build menu visible, can place rooms, adventurers spawn and wander.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```

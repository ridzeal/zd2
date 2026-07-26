# Phase 0 — Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Empty Phaser 3 + Vite + TypeScript project boots, renders a grid, tick counter visible on screen.

**Architecture:** Fixed-timestep tick engine (setInterval) drives a central GameState object. Phaser scenes render the state. EventBus decouples simulation from rendering.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

## Global Constraints
- Tick engine runs on `setInterval`, NOT `requestAnimationFrame` — game logic is deterministic regardless of render FPS
- In-memory GameState is single source of truth — no Redux, no external state libraries
- Data (room types, classes, loot) lives in JSON config files under `/src/data/`, never hardcoded in logic
- Every phase ends in a clickable/browser-playable build
- Keep it simple: no abstractions for single-use code

---

## File Structure

```
/src
  core/
    TickEngine.ts      — fixed-timestep loop, calls callback at 10 ticks/sec
    GameState.ts        — central state: day, tick, gold, level, rooms[], adventurers[]
    EventBus.ts         — typed pub/sub for sim <-> UI <-> render
  scenes/
    BootScene.ts        — preload assets, start WorldScene
    WorldScene.ts       — render grid + tick/day counter
    UIScene.ts          — overlay placeholder
  main.ts              — Phaser.Game config, boot
/tests/
  tick.test.ts         — TickEngine unit tests
  gamestate.test.ts    — GameState unit tests
/index.html
/package.json
/vite.config.ts
/tsconfig.json
```

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`

**Step 1:** Create `package.json`

```json
{
  "name": "zd2-dungeon-village",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 2:** Install dependencies

```bash
npm install phaser@3
npm install -D typescript vite vitest
```

**Step 3:** Create `vite.config.ts`

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
```

**Step 4:** Create `tsconfig.json`

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
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5:** Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dungeon Village</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; overflow: hidden; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 6:** Verify dev server starts

```bash
npx vite --host 0.0.0.0 --port 3000
```

Expected: Vite dev server starts on port 3000 without errors. Stop with Ctrl+C.

**Step 7:** Init git repo + commit

```bash
git init && git add -A && git commit -m "chore: scaffold vite + phaser + ts project"
```

---

### Task 2: Core Layer — EventBus

**Files:**
- Create: `src/core/EventBus.ts`

**Interfaces:**
- Consumes: (none)
- Produces: `eventBus.on(event, callback)`, `eventBus.off(event, callback)`, `eventBus.emit(event, data)`

**Step 1:** Create `src/core/EventBus.ts`

```ts
type EventMap = {
  'tick': { tick: number; day: number };
  'day-change': { day: number };
  'gold-change': { gold: number; delta: number };
  'state-change': void;
};

type EventKey = keyof EventMap;
type Callback<T> = T extends void ? () => void : (data: T) => void;

class EventBus {
  private listeners = new Map<EventKey, Set<Function>>();

  on<K extends EventKey>(event: K, callback: Callback<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends EventKey>(event: K, callback: Callback<EventMap[K]>): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<K extends EventKey>(event: K, ...args: EventMap[K] extends void ? [] : [EventMap[K]]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }
}

export const eventBus = new EventBus();
```

**Step 2:** Verify no TypeScript errors

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 3: Core Layer — GameState (with tests)

**Files:**
- Create: `src/core/GameState.ts`
- Create: `tests/gamestate.test.ts`

**Interfaces:**
- Consumes: (none)
- Produces: `createGameState()`, `tick(state)`, `GameState` interface

**Step 1:** Write failing test `tests/gamestate.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { createGameState, tick } from '../src/core/GameState';

describe('GameState', () => {
  it('initializes with default values', () => {
    const state = createGameState();
    expect(state.day).toBe(1);
    expect(state.tick).toBe(0);
    expect(state.gold).toBe(100);
    expect(state.level).toBe(1);
    expect(state.speed).toBe(1);
    expect(state.rooms).toEqual([]);
    expect(state.adventurers).toEqual([]);
  });

  it('increments tick on each tick', () => {
    const state = createGameState();
    tick(state);
    expect(state.tick).toBe(1);
  });

  it('increments day after 100 ticks', () => {
    const state = createGameState();
    for (let i = 0; i < 99; i++) tick(state);
    expect(state.day).toBe(1);
    expect(state.tick).toBe(99);
    tick(state);
    expect(state.day).toBe(2);
    expect(state.tick).toBe(0);
  });
});
```

**Step 2:** Run test — verify it fails (module not found)

```bash
npx vitest run tests/gamestate.test.ts
```

**Step 3:** Implement `src/core/GameState.ts`

```ts
export interface PlacedRoom {
  id: string;
  typeId: string;
  gridX: number;
  gridY: number;
}

export interface AdventurerInstance {
  id: string;
  classId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export interface GameState {
  day: number;
  tick: number;
  speed: 1 | 2;
  gold: number;
  level: number;
  rooms: PlacedRoom[];
  adventurers: AdventurerInstance[];
}

const TICKS_PER_DAY = 100;

export function createGameState(): GameState {
  return {
    day: 1,
    tick: 0,
    speed: 1,
    gold: 100,
    level: 1,
    rooms: [],
    adventurers: [],
  };
}

export function tick(state: GameState): void {
  state.tick++;
  if (state.tick >= TICKS_PER_DAY) {
    state.tick = 0;
    state.day++;
  }
}
```

**Step 4:** Run tests — verify all pass

```bash
npx vitest run tests/gamestate.test.ts
```

Expected: 3 tests passing.

**Step 5:** Commit

```bash
git add src/core/GameState.ts tests/gamestate.test.ts
git commit -m "feat: add GameState with tick/day progression"
```

---

### Task 4: Core Layer — TickEngine (with tests)

**Files:**
- Create: `src/core/TickEngine.ts`
- Create: `tests/tick.test.ts`

**Interfaces:**
- Consumes: `GameState`, `tick()` from GameState, `eventBus` from EventBus
- Produces: `TickEngine` class with `start()`, `stop()`, `setSpeed()`

**Step 1:** Write failing test `tests/tick.test.ts`

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TickEngine } from '../src/core/TickEngine';
import { createGameState } from '../src/core/GameState';

describe('TickEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onTick at 10 ticks per second', () => {
    const state = createGameState();
    const onTick = vi.fn();
    const engine = new TickEngine(state, onTick);

    engine.start();
    vi.advanceTimersByTime(1000);

    expect(onTick).toHaveBeenCalledTimes(10);
    engine.stop();
  });

  it('doubles speed when set to 2x', () => {
    const state = createGameState();
    const onTick = vi.fn();
    const engine = new TickEngine(state, onTick);

    engine.start();
    engine.setSpeed(2);
    vi.advanceTimersByTime(1000);

    expect(onTick).toHaveBeenCalledTimes(20);
    engine.stop();
  });

  it('stops ticking when stopped', () => {
    const state = createGameState();
    const onTick = vi.fn();
    const engine = new TickEngine(state, onTick);

    engine.start();
    vi.advanceTimersByTime(500);
    engine.stop();
    vi.advanceTimersByTime(500);

    expect(onTick).toHaveBeenCalledTimes(5);
  });
});
```

**Step 2:** Run test — verify it fails (module not found)

```bash
npx vitest run tests/tick.test.ts
```

**Step 3:** Implement `src/core/TickEngine.ts`

```ts
import { GameState, tick as tickState } from './GameState';
import { eventBus } from './EventBus';

const BASE_INTERVAL_MS = 100; // 10 ticks/sec

export class TickEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: GameState;
  private onTick: () => void;
  private speed: 1 | 2 = 1;

  constructor(state: GameState, onTick: () => void) {
    this.state = state;
    this.onTick = onTick;
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => {
      tickState(this.state);
      eventBus.emit('tick', { tick: this.state.tick, day: this.state.day });
      this.onTick();
    }, BASE_INTERVAL_MS / this.speed);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSpeed(speed: 1 | 2): void {
    this.speed = speed;
    if (this.intervalId !== null) {
      this.stop();
      this.start();
    }
  }
}
```

**Step 4:** Run tests — verify all pass

```bash
npx vitest run tests/tick.test.ts
```

Expected: 3 tests passing.

**Step 5:** Commit

```bash
git add src/core/TickEngine.ts src/core/EventBus.ts tests/tick.test.ts
git commit -m "feat: add TickEngine with EventBus and speed control"
```

---

### Task 5: Phaser Scenes

**Files:**
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/WorldScene.ts`
- Create: `src/scenes/UIScene.ts`

**Interfaces:**
- Consumes: `GameState`, `eventBus`
- Produces: Three Phaser scenes

**Step 1:** Create `src/scenes/BootScene.ts`

```ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scene.start('WorldScene');
  }
}
```

**Step 2:** Create `src/scenes/WorldScene.ts`

```ts
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';

const GRID_SIZE = 32;
const GRID_COLS = 25;
const GRID_ROWS = 18;

export class WorldScene extends Phaser.Scene {
  private gameState!: GameState;
  private tickText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: { gameState: GameState }): void {
    this.gameState = data.gameState;
  }

  create(): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x333355, 0.5);
    for (let x = 0; x <= GRID_COLS; x++) {
      grid.lineBetween(x * GRID_SIZE, 0, x * GRID_SIZE, GRID_ROWS * GRID_SIZE);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      grid.lineBetween(0, y * GRID_SIZE, GRID_COLS * GRID_SIZE, y * GRID_SIZE);
    }

    this.tickText = this.add.text(10, 10, 'Tick: 0', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    });
    this.dayText = this.add.text(10, 32, 'Day: 1', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    });

    eventBus.on('tick', ({ tick, day }) => {
      this.tickText.setText(`Tick: ${tick}`);
      this.dayText.setText(`Day: ${day}`);
    });
  }
}
```

**Step 3:** Create `src/scenes/UIScene.ts`

```ts
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.add.text(10, 60, 'UI Overlay (Phase 1+)', {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    });
  }
}
```

**Step 4:** Verify TypeScript compiles

```bash
npx tsc --noEmit
```

---

### Task 6: Entry Point + Integration

**Files:**
- Create: `src/main.ts`

**Interfaces:**
- Consumes: All core modules, all scenes
- Produces: Phaser.Game instance running with tick engine

**Step 1:** Create `src/main.ts`

```ts
import Phaser from 'phaser';
import { createGameState } from './core/GameState';
import { TickEngine } from './core/TickEngine';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';

const gameState = createGameState();

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
};

const game = new Phaser.Game(config);

// Start tick engine after a short delay to let Phaser init
setTimeout(() => {
  const engine = new TickEngine(gameState, () => {});
  engine.start();
}, 500);
```

**Step 2:** Run all tests

```bash
npx vitest run
```

Expected: All 6 tests pass (3 gamestate + 3 tick).

**Step 3:** Start dev server and verify in browser

```bash
npx vite --host 0.0.0.0 --port 3000
```

Expected: Browser shows dark background with grid lines and incrementing Tick/Day counters.

**Step 4:** Final commit

```bash
git add -A
git commit -m "feat: Phase 0 complete — scaffold with grid and tick counter"
```

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` — all 6 tests pass
- [ ] Browser shows grid + tick/day counter incrementing
- [ ] Tick increments 10/sec at 1x speed
- [ ] Day increments after 100 ticks

# Zeal Village — MVP Build Reference

## Tech Stack
- **Engine**: Phaser 4 + TypeScript
- **Bundler**: Vite
- **State**: Simple in-memory game state object (single source of truth), no Redux needed at MVP scale
- **Data**: JSON/TS config files for room types, adventurer classes, loot tables (data-driven, not hardcoded)
- **Rendering**: Phaser sprites/rects for MVP visuals; HD-2D shader pass (bloom/DOF/vignette) deferred to Phase 4
- **Save**: `localStorage` (single slot) for MVP
- **Deploy target**: static build → existing Nginx/Cloudflare Tunnel infra

## Project Structure
```
/src
  /core
    TickEngine.ts        # fixed-timestep sim loop, decoupled from render FPS
    GameState.ts          # central state: gold, day, rooms, adventurers
    EventBus.ts            # sim <-> UI <-> render communication
  /entities
    Room.ts
    Adventurer.ts
  /systems
    EconomySystem.ts       # gold in/out resolution per tick
    SpawnSystem.ts          # adventurer generation
    AISystem.ts              # wander/pathing, room interaction
    QuestSystem.ts           # dungeon delve resolution (auto-battle abstraction)
  /data
    rooms.json               # room type definitions (cost, effect, unlock level)
    classes.json              # adventurer class definitions (stats, spawn weight)
    lootTables.json
  /scenes
    BootScene.ts
    WorldScene.ts              # main grid + render loop
    UIScene.ts                  # overlay: build menu, roster, speed control
  /ui
    BuildMenu.ts
    RosterPanel.ts
    SpeedToggle.ts
  main.ts
/tests
  economy.test.ts
  tick.test.ts
```

## Core Data Schema (draft — agent may refine)
```ts
interface RoomDef {
  id: string;
  name: string;
  cost: number;
  unlockLevel: number;
  effect: { type: 'income' | 'attract' | 'heal' | 'stock'; value: number };
}

interface AdventurerClass {
  id: string;
  name: string;
  baseStats: { atk: number; def: number; hp: number };
  spawnWeight: number;
}

interface GameState {
  day: number;
  tick: number;
  speed: 1 | 2;
  gold: number;
  level: number;
  rooms: PlacedRoom[];
  adventurers: AdventurerInstance[];
}
```

## Design Notes for Code Agent
- Tick engine must run independent of `requestAnimationFrame` — use `setInterval`/accumulator pattern so game logic is deterministic regardless of render performance.
- Auto-battle/quest resolution should be a stat+RNG formula, not real-time combat — matches Kairosoft's abstraction level.
- Every phase below must end in something clickable/playable in browser — no headless-only milestones.
- Keep room/class/loot definitions in JSON, not hardcoded in logic, so balancing doesn't require code changes.

---

## Roadmap — Each Phase Ends in a Testable Playable Build

### Phase 0 — Scaffold
**Goal**: Empty Phaser+Vite project boots, renders a grid, tick counter visible on screen.
**Deliverable**: Open browser, see day/tick counter incrementing, empty grid.

### Phase 1 — Room Placement
**Goal**: Place rooms from a build menu onto grid, gold deducts on placement.
**Deliverable**: Player can build 5 room types on a grid, gold balance updates, rooms render as colored rects/placeholder sprites.

### Phase 2 — Adventurer Spawn & Wander
**Goal**: Adventurers spawn periodically, wander between rooms, idle animation/movement visible.
**Deliverable**: Watch adventurers walk around the built dungeon — no economy tie-in yet.

### Phase 3 — Core Economy Loop
**Goal**: Adventurers interact with rooms (shop = spend gold, inn = heal, entrance = spawn), quest/dungeon delve resolves and returns loot/gold.
**Deliverable**: Full loop closes — build room → adventurers generate gold → gold funds more rooms/upgrades. This is the "it's a game now" milestone.

### Phase 4 — Progression & Unlocks
**Goal**: Level system gates new room types and adventurer tiers; speed toggle (1x/2x) added.
**Deliverable**: Playable session where leveling up visibly unlocks new build options.

### Phase 5 — HD-2D Visual Pass
**Goal**: Swap placeholder rects for pixel sprites, add depth-sort layering, bloom/DOF/vignette shader pass.
**Deliverable**: Same Phase 4 loop, now visually in target HD-2D style.

### Phase 6 — Save/Load + Polish
**Goal**: Single-slot save/load via localStorage, basic UI polish, sound stubs.
**Deliverable**: Close browser, reopen, session restores. Considered MVP-complete.

---

## Explicitly Out of Scope for MVP
- Multi-floor dungeons
- Multiplayer/leaderboards
- Real-time player-controlled combat
- Crafting systems
- Story/dialogue/NPC named characters
- 3x speed toggle

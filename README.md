# Zeal Village

A Kairosoft-inspired village management sim built with Phaser 3 + TypeScript. Build rooms, attract adventurers, close the economy loop, and watch your village grow.

## Play

```bash
npm install
npm run dev
```

Open `http://localhost:3020` in your browser.

## How to Play

1. **Build rooms** — Select a room type from the build menu (left side), then click on the grid to place it. Each room costs gold.
2. **Adventurers arrive** — After reaching day milestones, adventurers start visiting your village and wandering between rooms.
3. **Earn gold** — Adventurers using your shops generate income. Gold funds more rooms.
4. **Quest** — Adventurers at the Dungeon Entrance go on quests. Wins bring gold, losses bring HP damage.
5. **Level up** — Earn XP from quests. Leveling up unlocks new room types and adventurer classes.
6. **Speed toggle** — Use the 1x/2x button (bottom-right) to control game speed.
7. **Save/Load** — Game auto-saves every 60 seconds and on page close. Manual save/load buttons available.

## Tech Stack

- **Engine**: Phaser 3
- **Language**: TypeScript
- **Bundler**: Vite
- **Tests**: Vitest
- **State**: In-memory game state object (single source of truth)
- **Save**: localStorage (single slot)

## Project Structure

```
/src
  /core           TickEngine, GameState, EventBus, SaveSystem
  /entities       Adventurer
  /systems        SpawnSystem, AISystem, EconomySystem, QuestSystem
  /data           rooms.json, classes.json, lootTables.json, milestones.json
  /scenes         BootScene, WorldScene, UIScene
  /ui             BuildMenu, SpeedToggle, SaveLoadUI, ActivityLog
  /shaders        HD2DPipeline
  /assets         Sprite generation
/tests            gamestate.test.ts, tick.test.ts
```

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 0 — Scaffold | Done | Phaser+Vite project boots, grid renders, tick counter |
| 1 — Room Placement | Done | Build menu, place rooms on grid, gold deducts |
| 2 — Adventurer Arrival | Done | Milestone-based arrival, wander between rooms |
| 3 — Core Economy | Done | Room interactions, income generation, quest system |
| 4 — Progression | Done | Level system, room/class unlocks, speed toggle |
| 5 — HD-2D Visuals | Done | Placeholder sprites, depth sorting, vignette shader |
| 6 — Save/Load + Polish | Done | localStorage save, activity log, UI polish |

## Build

```bash
npm run build    # TypeScript check + production build to dist/
npm test         # Run all Vitest tests
```

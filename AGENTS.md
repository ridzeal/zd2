# AGENTS.md — Zeal Village

## Stack
- **Phaser 4 + TypeScript + Vite** — static build, deploy to Nginx/Cloudflare Tunnel
- **No framework beyond Phaser** — no React, no Redux. In-memory game state object is single source of truth.
- **Data-driven config** — room types, adventurer classes, loot tables live in JSON/TS config files under `/src/data/`, never hardcoded in logic.

## Project Structure
```
/src/core/      TickEngine, GameState, EventBus
/src/entities/  Room, Adventurer
/src/systems/   EconomySystem, SpawnSystem, AISystem, QuestSystem
/src/data/      rooms.json, classes.json, lootTables.json
/src/scenes/    BootScene, WorldScene, UIScene
/src/ui/        BuildMenu, RosterPanel, SpeedToggle
/tests/         economy.test.ts, tick.test.ts
```

## Key Architectural Rules
1. **Tick engine is decoupled from render** — use `setInterval`/accumulator pattern, NOT `requestAnimationFrame`. Game logic must be deterministic regardless of render performance.
2. **Auto-battle, not real-time combat** — quest/dungeon delve is a stat+RNG formula resolving instantly (Kairosoft abstraction level). No real-time player-controlled combat.
3. **Every phase ends in a clickable/browser-playable build** — no headless-only milestones.
4. **`localStorage` single-slot save** for MVP.

## Build & Dev Commands
- `just dev` — Kill port 3020 process, then start Vite dev server on **port 3020** (always use this port for testing)
- `npm run build` — TypeScript check + production build to `dist/`
- `npm test` — Run all Vitest tests
- `npx tsc --noEmit` — Typecheck only

## Deploy
- **Target**: static build → existing Nginx/Cloudflare Tunnel infra (`.zealhaven.net` subdomain)

## Conventions
- Keep it simple: no abstractions for single-use code, no over-engineering beyond what each phase requires.
- Phases are sequential: 0 (scaffold) → 1 (rooms) → 2 (adventurers) → 3 (economy loop) → 4 (progression) → 5 (HD-2D visuals) → 6 (save/load + polish). Respect the phase order; each builds on the last.
- Out of scope for MVP: multiplayer, crafting, story/dialogue, multi-floor dungeons, 3x speed.

## When Adding a Phase
1. Read `roadmap.md` for the phase goal and deliverable.
2. Create/modify files under the structure above — don't invent new top-level directories.
3. If adding a new system or entity, add its JSON config to `/src/data/` and its TypeScript class to the appropriate `/src/` subdirectory.
4. Add or update tests in `/tests/` for any new system.

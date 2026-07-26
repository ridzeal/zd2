---
feature: phase1-room-placement
status: delivered
specs: [docs/compose/spec/phase1-room-placement.md]
commits: 238574e..41c017e
---

# Phase 1 — Room Placement

## What Was Built
Build menu with 5 room types, grid click placement with gold deduction, colored rect rendering for placed rooms, and hover preview that dims for occupied/insufficient-gold cells. Cross-scene communication via EventBus.

## Position in System
Foundation mechanic — enables player to build the dungeon layout. Phase 2+ systems (adventurer spawn, economy) depend on placed rooms for their behavior.

## Data Model
- `src/data/rooms.json` — 5 room type definitions (id, name, cost, unlockLevel, effect, color)
- `GameState.rooms: PlacedRoom[]` — runtime array of placed rooms
- `GameState.gold: number` — deducted on placement
- `RoomDef` interface shared between config and logic

## Architecture
| Layer | Files |
|-------|-------|
| Config | `src/data/rooms.json` |
| Core state | `src/core/GameState.ts` → `placeRoom()`, `RoomDef` |
| UI | `src/ui/BuildMenu.ts` → 5 selectable buttons |
| Scene | `src/scenes/WorldScene.ts` → grid click + room rendering |
| Scene | `src/scenes/UIScene.ts` → overlay scene hosting BuildMenu |
| Events | `src/core/EventBus.ts` → `gold-change`, `deselect-room`, `state-change` |

Key patterns:
- Room selection via Phaser `registry` (cross-scene shared state)
- BuildMenu updates visuals internally, WorldScene owns gold/room rendering via `update()`
- Right-click deselect routed through EventBus (`deselect-room`)

## Known Issues / Deferred Work
- `placeRoom()` untested — no unit tests for gold deduction or occupancy check
- Room IDs reset on HMR (module-scoped `nextRoomId`)
- Hex color parsed every frame in `update()` — negligible at Phase 1 scale
- Room removal/upgrade not implemented (Phase 6 or later)

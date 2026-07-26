import { GameState } from '../core/GameState';
import { Adventurer } from '../entities/Adventurer';

const GRID_SIZE = 32;
const MIN_IDLE = 20;
const MAX_IDLE = 50;

const adventurers = new Map<string, Adventurer>();

export function getAdventurer(id: string): Adventurer | undefined {
  return adventurers.get(id);
}

export function getAllAdventurers(): Map<string, Adventurer> {
  return adventurers;
}

export function addAdventurer(adv: Adventurer): void {
  adventurers.set(adv.data.id, adv);
}

export function removeAdventurer(id: string): void {
  adventurers.delete(id);
}

export function processAI(state: GameState): void {
  // Sync: remove adventurers no longer in state
  for (const [id] of adventurers) {
    if (!state.adventurers.find(a => a.id === id)) {
      adventurers.delete(id);
    }
  }

  // Ensure all state adventurers have Adventurer instances
  for (const data of state.adventurers) {
    if (!adventurers.has(data.id)) {
      const adv = new Adventurer(data, data.x, data.y);
      pickNewTarget(adv, state);
      adventurers.set(data.id, adv);
    }
  }

  // Update all adventurers
  for (const [id, adv] of adventurers) {
    adv.update();

    if (adv.shouldWander()) {
      pickNewTarget(adv, state);
    }
  }
}

function pickNewTarget(adv: Adventurer, state: GameState): void {
  if (state.rooms.length === 0) return;

  const room = state.rooms[Math.floor(Math.random() * state.rooms.length)];
  const targetX = room.gridX * GRID_SIZE + GRID_SIZE / 2;
  const targetY = room.gridY * GRID_SIZE + GRID_SIZE / 2;

  adv.setTarget(targetX, targetY);
}

export interface RoomDef {
  id: string;
  name: string;
  cost: number;
  unlockLevel: number;
  effect: { type: 'income' | 'attract' | 'heal' | 'stock'; value: number };
  color: string;
}

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
  state?: 'idle' | 'walking';
  targetX?: number;
  targetY?: number;
  name?: string;
}

export interface GameState {
  day: number;
  tick: number;
  speed: 1 | 2;
  gold: number;
  level: number;
  xp: number;
  rooms: PlacedRoom[];
  adventurers: AdventurerInstance[];
  reachedMilestones: number[];
}

const TICKS_PER_DAY = 100;

export function createGameState(): GameState {
  return {
    day: 1,
    tick: 0,
    speed: 1,
    gold: 100,
    level: 1,
    xp: 0,
    rooms: [],
    adventurers: [],
    reachedMilestones: [],
  };
}

// Shared singleton for browser use — imported by both TickEngine and WorldScene
export const gameState = createGameState();

export function tick(state: GameState): void {
  state.tick++;
  if (state.tick >= TICKS_PER_DAY) {
    state.tick = 0;
    state.day++;
  }
}

let nextRoomId = 1;

export function getXpToLevel(level: number): number {
  return level * 100;
}

export function addXp(state: GameState, amount: number): boolean {
  state.xp += amount;
  const xpNeeded = getXpToLevel(state.level);
  if (state.xp >= xpNeeded && state.level < 5) {
    state.xp -= xpNeeded;
    state.level++;
    return true; // leveled up
  }
  return false;
}

export function placeRoom(state: GameState, roomDef: RoomDef, gridX: number, gridY: number): boolean {
  if (state.gold < roomDef.cost) return false;
  if (state.rooms.some(r => r.gridX === gridX && r.gridY === gridY)) return false;

  state.gold -= roomDef.cost;
  state.rooms.push({
    id: `room-${nextRoomId++}`,
    typeId: roomDef.id,
    gridX,
    gridY,
  });
  return true;
}

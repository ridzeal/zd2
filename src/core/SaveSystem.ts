import { GameState } from './GameState';

const SAVE_KEY = 'zd2-save';

export function saveGame(state: GameState): void {
  const data = {
    day: state.day,
    tick: state.tick,
    speed: state.speed,
    gold: state.gold,
    level: state.level,
    xp: state.xp,
    rooms: state.rooms,
    adventurers: state.adventurers,
    reachedMilestones: state.reachedMilestones,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): Partial<GameState> | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<GameState>;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

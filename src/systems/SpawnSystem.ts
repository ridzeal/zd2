import { GameState, AdventurerInstance } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import classesData from '../data/classes.json';
import milestonesData from '../data/milestones.json';

interface ClassDef {
  id: string;
  name: string;
  baseStats: { atk: number; def: number; hp: number };
  spawnWeight: number;
  color: string;
  unlockLevel: number;
}

interface Milestone {
  day: number;
  count: number;
}

const classes: ClassDef[] = classesData as ClassDef[];
const milestones: Milestone[] = milestonesData as Milestone[];
const MAX_ADVENTURERS = 20;

let nextAdventurerId = 1;

function weightedRandomClass(level: number): ClassDef {
  const eligible = classes.filter(c => c.unlockLevel <= level);
  if (eligible.length === 0) return classes[0];
  const totalWeight = eligible.reduce((sum, c) => sum + c.spawnWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const cls of eligible) {
    roll -= cls.spawnWeight;
    if (roll <= 0) return cls;
  }
  return eligible[eligible.length - 1];
}

export function processSpawn(state: GameState): void {
  if (state.adventurers.length >= MAX_ADVENTURERS) return;
  if (state.rooms.length === 0) return;

  for (const m of milestones) {
    if (state.day >= m.day && !state.reachedMilestones.includes(m.day)) {
      state.reachedMilestones.push(m.day);
      eventBus.emit('milestone-reached', { day: m.day });

      const count = Math.min(m.count, MAX_ADVENTURERS - state.adventurers.length);
      for (let i = 0; i < count; i++) {
        spawnAdventurer(state);
      }
      break;
    }
  }
}

function spawnAdventurer(state: GameState): void {
  const cls = weightedRandomClass(state.level);

  // Find entrance or random room
  const entrance = state.rooms.find(r => r.typeId === 'entrance');
  const room = entrance || state.rooms[Math.floor(Math.random() * state.rooms.length)];
  const GRID_SIZE = 32;
  const spawnX = room.gridX * GRID_SIZE + GRID_SIZE / 2;
  const spawnY = room.gridY * GRID_SIZE + GRID_SIZE / 2;

  const adv: AdventurerInstance = {
    id: `adv-${nextAdventurerId++}`,
    classId: cls.id,
    x: spawnX,
    y: spawnY,
    hp: cls.baseStats.hp,
    maxHp: cls.baseStats.hp,
  };

  state.adventurers.push(adv);
  eventBus.emit('adventurer-arrived', { id: adv.id, classId: cls.id });
}

import { GameState, addXp } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import { getAdventurer } from './AISystem';
import lootTablesData from '../data/lootTables.json';

interface LootTable {
  gold: [number, number];
  items: string[];
  xp: number;
}

interface LootTables {
  easy: LootTable;
  medium: LootTable;
  hard: LootTable;
}

const lootTables: LootTables = lootTablesData as unknown as LootTables;
const QUEST_DELAY = 20; // ticks before quest resolves

// Track quest state per adventurer
const questing = new Map<string, number>(); // advId -> ticks remaining

export function processQuests(state: GameState): void {
  // Process ongoing quests
  for (const [advId, ticksLeft] of questing) {
    questing.set(advId, ticksLeft - 1);
    if (ticksLeft <= 1) {
      resolveQuest(advId, state);
      questing.delete(advId);
    }
  }

  // Check for adventurers at entrance who can start a quest
  for (const data of state.adventurers) {
    if (questing.has(data.id)) continue;

    const adv = getAdventurer(data.id);
    if (!adv || adv.getState() !== 'idle') continue;

    // Check if at entrance
    const entrance = state.rooms.find(r => r.typeId === 'entrance');
    if (!entrance) continue;

    const GRID_SIZE = 32;
    const atEntrance =
      Math.floor(data.x / GRID_SIZE) === entrance.gridX &&
      Math.floor(data.y / GRID_SIZE) === entrance.gridY;

    if (atEntrance) {
      questing.set(data.id, QUEST_DELAY);
      eventBus.emit('room-interaction', {
        x: data.x, y: data.y - 15,
        text: 'Questing...',
        color: '#ffd700',
      });
    }
  }
}

function resolveQuest(advId: string, state: GameState): void {
  const data = state.adventurers.find(a => a.id === advId);
  if (!data) return;

  // Simple difficulty scaling
  const dayDifficulty = Math.min(Math.floor(state.day / 10), 2);
  const difficultyKey = (['easy', 'medium', 'hard'] as const)[dayDifficulty];
  const loot = lootTables[difficultyKey];

  const winChance = Math.min(0.9, (data.hp / data.maxHp) * 0.6 + 0.2);
  const roll = Math.random();

  if (roll < winChance) {
    // Win
    const goldDrop = loot.gold[0] + Math.floor(Math.random() * (loot.gold[1] - loot.gold[0]));
    state.gold += goldDrop;
    eventBus.emit('gold-change', { gold: state.gold, delta: goldDrop });

    // Award XP
    const leveledUp = addXp(state, loot.xp);
    eventBus.emit('xp-gained', { amount: loot.xp });
    if (leveledUp) {
      eventBus.emit('level-up', { level: state.level });
      eventBus.emit('room-interaction', {
        x: data.x, y: data.y - 30,
        text: `Level ${state.level}!`,
        color: '#ffd700',
      });
    }

    eventBus.emit('quest-complete', { advId, won: true });
    eventBus.emit('room-interaction', {
      x: data.x, y: data.y - 15,
      text: `Win! +${goldDrop}g`,
      color: '#ffd700',
    });
  } else {
    // Loss
    const damage = 5 + Math.floor(Math.random() * 10);
    data.hp = Math.max(1, data.hp - damage);
    eventBus.emit('quest-complete', { advId, won: false });
    eventBus.emit('room-interaction', {
      x: data.x, y: data.y - 15,
      text: `Defeat -${damage}hp`,
      color: '#ff4444',
    });
  }
}

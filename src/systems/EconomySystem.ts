import { GameState } from '../core/GameState';
import { eventBus } from '../core/EventBus';
import { getAdventurer } from './AISystem';
import roomsData from '../data/rooms.json';

interface RoomDef {
  id: string;
  name: string;
  effect: { type: string; value: number };
}

const rooms: RoomDef[] = roomsData as RoomDef[];
const INTERACTION_COOLDOWN = 30;

// Track cooldowns per adventurer+room
const cooldowns = new Map<string, number>();

export function processEconomy(state: GameState): void {
  // Decrease all cooldowns
  for (const [key, val] of cooldowns) {
    if (val > 0) {
      cooldowns.set(key, val - 1);
    }
  }

  for (const data of state.adventurers) {
    const adv = getAdventurer(data.id);
    if (!adv || adv.getState() !== 'idle') continue;

    // Find which room the adventurer is standing on
    const room = findRoomAtPosition(state, data.x, data.y);
    if (!room) continue;

    const roomDef = rooms.find(r => r.id === room.typeId);
    if (!roomDef) continue;

    const cooldownKey = `${data.id}-${room.id}`;
    if ((cooldowns.get(cooldownKey) || 0) > 0) continue;

    switch (roomDef.effect.type) {
      case 'income': {
        const goldEarned = roomDef.effect.value;
        state.gold += goldEarned;
        cooldowns.set(cooldownKey, INTERACTION_COOLDOWN);
        eventBus.emit('gold-change', { gold: state.gold, delta: goldEarned });
        eventBus.emit('room-interaction', {
          x: data.x, y: data.y - 15,
          text: `+${goldEarned}g`,
          color: '#00ff00',
        });
        break;
      }
      case 'heal': {
        if (data.hp < data.maxHp) {
          const healAmount = Math.min(roomDef.effect.value, data.maxHp - data.hp);
          data.hp += healAmount;
          cooldowns.set(cooldownKey, INTERACTION_COOLDOWN);
          eventBus.emit('room-interaction', {
            x: data.x, y: data.y - 15,
            text: `+${healAmount}hp`,
            color: '#50c878',
          });
        }
        break;
      }
      case 'stock': {
        // Buff handled in QuestSystem — just mark interaction
        cooldowns.set(cooldownKey, INTERACTION_COOLDOWN);
        break;
      }
    }
  }
}

function findRoomAtPosition(state: GameState, x: number, y: number) {
  const GRID_SIZE = 32;
  const gridX = Math.floor(x / GRID_SIZE);
  const gridY = Math.floor(y / GRID_SIZE);
  return state.rooms.find(r => r.gridX === gridX && r.gridY === gridY);
}

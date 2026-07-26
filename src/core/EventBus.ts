type EventMap = {
  'tick': { tick: number; day: number };
  'day-change': { day: number };
  'gold-change': { gold: number; delta: number };
  'state-change': void;
  'deselect-room': void;
  'adventurer-arrived': { id: string; classId: string };
  'adventurer-removed': { id: string };
  'milestone-reached': { day: number };
  'room-interaction': { x: number; y: number; text: string; color: string };
  'quest-complete': { advId: string; won: boolean };
  'speed-change': { speed: 1 | 2 };
  'level-up': { level: number };
  'xp-gained': { amount: number };
};

type EventKey = keyof EventMap;
type Callback<T> = T extends void ? () => void : (data: T) => void;

class EventBus {
  private listeners = new Map<EventKey, Set<Function>>();

  on<K extends EventKey>(event: K, callback: Callback<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends EventKey>(event: K, callback: Callback<EventMap[K]>): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<K extends EventKey>(event: K, ...args: EventMap[K] extends void ? [] : [EventMap[K]]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }
}

export const eventBus = new EventBus();

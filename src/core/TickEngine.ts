import { GameState, tick as tickState } from './GameState';
import { eventBus } from './EventBus';
import { processSpawn } from '../systems/SpawnSystem';
import { processAI } from '../systems/AISystem';
import { processEconomy } from '../systems/EconomySystem';
import { processQuests } from '../systems/QuestSystem';

const BASE_INTERVAL_MS = 100; // 10 ticks/sec

export interface TickStats {
  lastTickTime: number;
  tickCount: number;
  lastTickDuration: number;
  spawnMs: number;
  aiMs: number;
  economyMs: number;
  questMs: number;
}

export class TickEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: GameState;
  private onTick: () => void;
  private speed: 1 | 2 = 1;
  private onSpeedChange: (data: { speed: 1 | 2 }) => void;
  private stats: TickStats = {
    lastTickTime: 0,
    tickCount: 0,
    lastTickDuration: 0,
    spawnMs: 0,
    aiMs: 0,
    economyMs: 0,
    questMs: 0,
  };

  constructor(state: GameState, onTick: () => void) {
    this.state = state;
    this.onTick = onTick;

    this.onSpeedChange = (data) => {
      this.setSpeed(data.speed);
    };
    eventBus.on('speed-change', this.onSpeedChange);
  }

  getStats(): TickStats {
    return this.stats;
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => {
      const tickStart = performance.now();

      tickState(this.state);

      let t = performance.now();
      processSpawn(this.state);
      this.stats.spawnMs = performance.now() - t;

      t = performance.now();
      processAI(this.state);
      this.stats.aiMs = performance.now() - t;

      t = performance.now();
      processEconomy(this.state);
      this.stats.economyMs = performance.now() - t;

      t = performance.now();
      processQuests(this.state);
      this.stats.questMs = performance.now() - t;

      this.stats.lastTickDuration = performance.now() - tickStart;
      this.stats.lastTickTime = performance.now();
      this.stats.tickCount++;

      eventBus.emit('tick', { tick: this.state.tick, day: this.state.day });
      this.onTick();
    }, BASE_INTERVAL_MS / this.speed);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy(): void {
    this.stop();
    eventBus.off('speed-change', this.onSpeedChange);
  }

  setSpeed(speed: 1 | 2): void {
    this.speed = speed;
    if (this.intervalId !== null) {
      this.stop();
      this.start();
    }
  }
}

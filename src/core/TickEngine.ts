import { GameState, tick as tickState } from './GameState';
import { eventBus } from './EventBus';
import { processSpawn } from '../systems/SpawnSystem';
import { processAI } from '../systems/AISystem';
import { processEconomy } from '../systems/EconomySystem';
import { processQuests } from '../systems/QuestSystem';

const BASE_INTERVAL_MS = 100; // 10 ticks/sec

export class TickEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: GameState;
  private onTick: () => void;
  private speed: 1 | 2 = 1;
  private onSpeedChange: (data: { speed: 1 | 2 }) => void;

  constructor(state: GameState, onTick: () => void) {
    this.state = state;
    this.onTick = onTick;

    this.onSpeedChange = (data) => {
      this.setSpeed(data.speed);
    };
    eventBus.on('speed-change', this.onSpeedChange);
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => {
      tickState(this.state);
      processSpawn(this.state);
      processAI(this.state);
      processEconomy(this.state);
      processQuests(this.state);
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

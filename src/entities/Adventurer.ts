import { AdventurerInstance } from '../core/GameState';

const WALK_SPEED = 2;
const RADIUS = 8;
const MIN_IDLE = 20;
const MAX_IDLE = 50;

export class Adventurer {
  data: AdventurerInstance;
  private targetX: number;
  private targetY: number;
  private state: 'idle' | 'walking';
  private idleTicks: number;
  private idleTarget: number;

  constructor(data: AdventurerInstance, targetX: number, targetY: number) {
    this.data = data;
    this.targetX = targetX;
    this.targetY = targetY;
    this.state = 'walking';
    this.idleTicks = 0;
    this.idleTarget = 0;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    this.state = 'walking';
  }

  getIdleTicks(): number {
    return this.idleTicks;
  }

  setIdleTarget(ticks: number): void {
    this.idleTarget = ticks;
    this.idleTicks = 0;
    this.state = 'idle';
  }

  getState(): 'idle' | 'walking' {
    return this.state;
  }

  update(): void {
    if (this.state === 'walking') {
      const dx = this.targetX - this.data.x;
      const dy = this.targetY - this.data.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= WALK_SPEED) {
        this.data.x = this.targetX;
        this.data.y = this.targetY;
        this.state = 'idle';
        this.idleTicks = 0;
        this.idleTarget = MIN_IDLE + Math.floor(Math.random() * (MAX_IDLE - MIN_IDLE));
      } else {
        this.data.x += (dx / dist) * WALK_SPEED;
        this.data.y += (dy / dist) * WALK_SPEED;
      }
    } else if (this.state === 'idle') {
      this.idleTicks++;
    }
  }

  shouldWander(): boolean {
    return this.state === 'idle' && this.idleTicks >= this.idleTarget;
  }

  isAlive(): boolean {
    return this.data.hp > 0;
  }
}

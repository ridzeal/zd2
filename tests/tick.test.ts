import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TickEngine } from '../src/core/TickEngine';
import { createGameState } from '../src/core/GameState';

describe('TickEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onTick at 10 ticks per second', () => {
    const state = createGameState();
    const onTick = vi.fn();
    const engine = new TickEngine(state, onTick);

    engine.start();
    vi.advanceTimersByTime(1000);

    expect(onTick).toHaveBeenCalledTimes(10);
    engine.stop();
  });

  it('doubles speed when set to 2x', () => {
    const state = createGameState();
    const onTick = vi.fn();
    const engine = new TickEngine(state, onTick);

    engine.start();
    engine.setSpeed(2);
    vi.advanceTimersByTime(1000);

    expect(onTick).toHaveBeenCalledTimes(20);
    engine.stop();
  });

  it('stops ticking when stopped', () => {
    const state = createGameState();
    const onTick = vi.fn();
    const engine = new TickEngine(state, onTick);

    engine.start();
    vi.advanceTimersByTime(500);
    engine.stop();
    vi.advanceTimersByTime(500);

    expect(onTick).toHaveBeenCalledTimes(5);
  });
});

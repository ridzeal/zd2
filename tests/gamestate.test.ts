import { describe, it, expect } from 'vitest';
import { createGameState, tick } from '../src/core/GameState';

describe('GameState', () => {
  it('initializes with default values', () => {
    const state = createGameState();
    expect(state.day).toBe(1);
    expect(state.tick).toBe(0);
    expect(state.gold).toBe(100);
    expect(state.level).toBe(1);
    expect(state.speed).toBe(1);
    expect(state.rooms).toEqual([]);
    expect(state.adventurers).toEqual([]);
    expect(state.reachedMilestones).toEqual([]);
  });

  it('increments tick on each tick', () => {
    const state = createGameState();
    tick(state);
    expect(state.tick).toBe(1);
  });

  it('increments day after 100 ticks', () => {
    const state = createGameState();
    for (let i = 0; i < 99; i++) tick(state);
    expect(state.day).toBe(1);
    expect(state.tick).toBe(99);
    tick(state);
    expect(state.day).toBe(2);
    expect(state.tick).toBe(0);
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { loadGameGlobals } from '../fixtures/load-globals.js';
import {
  applyGrade, newCard, fuzzInterval, capInterval,
  isMastered, isLeech, todayKey, startOfNextStudyDay, clamp,
} from '../../src/lib/srs.js';

let SRS;
beforeAll(() => { SRS = loadGameGlobals().PPZ_CONFIG.SRS; });

const NOW = Date.UTC(2026, 0, 15, 14, 0, 0); // 2026-01-15 14:00 UTC
const MIN = 60_000;

describe('clamp / capInterval / fuzzInterval', () => {
  it('clamp bounds the value', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it('capInterval honors MAX_INTERVAL_DAYS', () => {
    expect(capInterval(1e9, SRS)).toBe(SRS.MAX_INTERVAL_DAYS);
    expect(capInterval(0, SRS)).toBe(1);
    expect(capInterval(7.4, SRS)).toBe(7);
  });
  it('fuzzInterval is deterministic for the same id', () => {
    expect(fuzzInterval('v1', 30, SRS)).toBe(fuzzInterval('v1', 30, SRS));
    expect(fuzzInterval('v2', 30, SRS)).not.toBeUndefined();
  });
  it('fuzzInterval stays within ±FUZZ_PCT of the requested days (rounded)', () => {
    const days = 100;
    const margin = Math.ceil(days * SRS.FUZZ_PCT);
    for (const id of ['v1', 'p3', 'hwp7', 'g4', 'n11']) {
      const got = fuzzInterval(id, days, SRS);
      expect(got).toBeGreaterThanOrEqual(days - margin);
      expect(got).toBeLessThanOrEqual(days + margin);
    }
  });
  it('fuzzInterval skips fuzz for tiny intervals (<2 days)', () => {
    expect(fuzzInterval('v1', 1, SRS)).toBe(1);
  });
});

describe('todayKey / startOfNextStudyDay', () => {
  it('todayKey returns YYYY-MM-DD', () => {
    expect(todayKey(NOW, SRS)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('startOfNextStudyDay is in the future', () => {
    expect(startOfNextStudyDay(NOW, SRS)).toBeGreaterThan(NOW);
  });
  it('startOfNextStudyDay is within ~28h of now', () => {
    const dt = startOfNextStudyDay(NOW, SRS) - NOW;
    expect(dt).toBeLessThan(28 * 3600_000);
    expect(dt).toBeGreaterThan(0);
  });
});

describe('newCard', () => {
  it('initializes a fresh record with EASE_START and queue=new', () => {
    const c = newCard(SRS);
    expect(c.queue).toBe('new');
    expect(c.ease).toBe(SRS.EASE_START);
    expect(c.lapses).toBe(0);
    expect(c.reps).toBe(0);
  });
});

describe('applyGrade — NEW/LEARNING queue', () => {
  it('"good" advances through learning steps then graduates', () => {
    const c = newCard(SRS);
    applyGrade(c, 'v1', 'good', SRS, NOW);
    expect(c.queue).toBe('learning');
    expect(c.step).toBe(1);
    // continue stepping
    applyGrade(c, 'v1', 'good', SRS, NOW);
    applyGrade(c, 'v1', 'good', SRS, NOW);
    expect(c.queue).toBe('review');
    expect(c.interval).toBe(SRS.GRAD_INTERVAL_GOOD);
    expect(c.reps).toBe(1);
  });

  it('"easy" graduates immediately at GRAD_INTERVAL_EASY', () => {
    const c = newCard(SRS);
    applyGrade(c, 'v1', 'easy', SRS, NOW);
    expect(c.queue).toBe('review');
    expect(c.interval).toBe(SRS.GRAD_INTERVAL_EASY);
    expect(c.ease).toBeGreaterThan(SRS.EASE_START); // +0.05 bump
  });

  it('"again" resets step to 0', () => {
    const c = newCard(SRS);
    applyGrade(c, 'v1', 'good', SRS, NOW);
    applyGrade(c, 'v1', 'again', SRS, NOW);
    expect(c.step).toBe(0);
    expect(c.queue).toBe('learning');
  });

  it('records the rolling history (last 5)', () => {
    const c = newCard(SRS);
    for (const g of ['good','good','good','again','good','easy','easy']) {
      applyGrade(c, 'v1', g, SRS, NOW);
    }
    expect(c.history.length).toBe(5);
    // grades pushed: g,g,g,a,g,e,e -> last 5: g,a,g,e,e
    expect(c.history.join('')).toBe('gagee');
  });
});

describe('applyGrade — REVIEW queue (SM-2)', () => {
  function reviewCard(interval = 10, ease = SRS.EASE_START) {
    return {
      queue: 'review', step: 0, interval, due: NOW, ease,
      reps: 5, lapses: 0, mastery: 50, lastResult: 'good', history: [],
    };
  }

  it('"again" enters relearning, halves interval, drops ease, increments lapses', () => {
    const c = reviewCard(20, 2.5);
    applyGrade(c, 'v1', 'again', SRS, NOW);
    expect(c.queue).toBe('relearning');
    expect(c.lapses).toBe(1);
    expect(c.interval).toBeLessThan(20);
    expect(c.ease).toBeCloseTo(2.5 - 0.20, 5);
    expect(c.due).toBe(NOW + SRS.RELEARNING_STEPS_MIN[0] * MIN);
  });

  it('"good" multiplies interval by ease', () => {
    const c = reviewCard(10, 2.5);
    applyGrade(c, 'v1', 'good', SRS, NOW);
    expect(c.interval).toBeGreaterThanOrEqual(11);
    expect(c.interval).toBeLessThanOrEqual(Math.ceil(10 * 2.5 * (1 + SRS.FUZZ_PCT)));
  });

  it('"easy" multiplies interval by ease * EASY_BONUS and bumps ease', () => {
    const c = reviewCard(10, 2.5);
    applyGrade(c, 'v1', 'easy', SRS, NOW);
    expect(c.ease).toBeCloseTo(2.5 + 0.10, 5);
    expect(c.interval).toBeGreaterThanOrEqual(12);
  });

  it('"hard" applies HARD_MULT and lowers ease', () => {
    const c = reviewCard(10, 2.5);
    applyGrade(c, 'v1', 'hard', SRS, NOW);
    expect(c.ease).toBeCloseTo(2.5 - 0.05, 5);
    expect(c.interval).toBeGreaterThanOrEqual(11);
  });

  it('LEECH_LAPSE_THRESHOLD lapses auto-suspends the card', () => {
    const c = reviewCard(10, 2.0);
    c.lapses = SRS.LEECH_LAPSE_THRESHOLD - 1;
    applyGrade(c, 'v1', 'again', SRS, NOW);
    expect(c.suspended).toBe(true);
  });

  it('ease is clamped to [EASE_MIN, EASE_MAX]', () => {
    const c = reviewCard(10, SRS.EASE_MIN + 0.01);
    applyGrade(c, 'v1', 'again', SRS, NOW);
    expect(c.ease).toBeGreaterThanOrEqual(SRS.EASE_MIN);
    const c2 = reviewCard(10, SRS.EASE_MAX - 0.01);
    applyGrade(c2, 'v1', 'easy', SRS, NOW);
    expect(c2.ease).toBeLessThanOrEqual(SRS.EASE_MAX);
  });
});

describe('isMastered / isLeech', () => {
  it('mastered = review queue + interval >= MASTERY_INTERVAL_DAYS + lapses <= MASTERY_MAX_LAPSES', () => {
    expect(isMastered({ queue: 'review', interval: SRS.MASTERY_INTERVAL_DAYS, lapses: 0 }, SRS)).toBe(true);
    expect(isMastered({ queue: 'review', interval: SRS.MASTERY_INTERVAL_DAYS - 1, lapses: 0 }, SRS)).toBe(false);
    expect(isMastered({ queue: 'review', interval: SRS.MASTERY_INTERVAL_DAYS, lapses: SRS.MASTERY_MAX_LAPSES + 1 }, SRS)).toBe(false);
    expect(isMastered({ queue: 'learning', interval: 100, lapses: 0 }, SRS)).toBe(false);
  });
  it('leech = lapses >= LEECH_LAPSE_THRESHOLD', () => {
    expect(isLeech({ lapses: SRS.LEECH_LAPSE_THRESHOLD }, SRS)).toBe(true);
    expect(isLeech({ lapses: SRS.LEECH_LAPSE_THRESHOLD - 1 }, SRS)).toBe(false);
    expect(isLeech(null, SRS)).toBe(false);
  });
});

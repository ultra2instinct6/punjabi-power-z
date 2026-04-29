import { describe, it, expect } from 'vitest';
import {
  getRank,
  xpForNext,
  levelRewardMult,
  srsHash,
  unlockedTierForLevel,
  cardTier,
} from '../../src/lib/progression.js';

const RANKS = [
  { level: 1, title: 'Beginner', badge: 'A' },
  { level: 50, title: 'Trainee', badge: 'B' },
  { level: 500, title: 'Warrior', badge: 'C' },
];
const CARD_TIERS = { MAX: 5, UNLOCK_AT: { 1: 1, 2: 50, 3: 500, 4: 5000, 5: 25000 } };

describe('getRank', () => {
  it('returns the first rank for the lowest level', () => {
    expect(getRank(1, RANKS).title).toBe('Beginner');
  });
  it('returns the highest qualifying rank', () => {
    expect(getRank(49, RANKS).title).toBe('Beginner');
    expect(getRank(50, RANKS).title).toBe('Trainee');
    expect(getRank(499, RANKS).title).toBe('Trainee');
    expect(getRank(500, RANKS).title).toBe('Warrior');
    expect(getRank(99999, RANKS).title).toBe('Warrior');
  });
});

describe('xpForNext', () => {
  it('matches the documented curve at known anchor levels', () => {
    expect(xpForNext(1)).toBe(100);
    expect(xpForNext(50)).toBe(2060);
    expect(xpForNext(100)).toBe(4060);
    expect(xpForNext(500)).toBe(20060);
    expect(xpForNext(5000)).toBe(200060);
    expect(xpForNext(25000)).toBe(1000060);
  });
  it('never returns less than the floor', () => {
    expect(xpForNext(0)).toBeGreaterThanOrEqual(60);
  });
});

describe('levelRewardMult', () => {
  it('starts at 1.0 for level 0', () => {
    expect(levelRewardMult(0)).toBe(1);
  });
  it('grows linearly mid-game', () => {
    expect(levelRewardMult(10)).toBeCloseTo(7);
    expect(levelRewardMult(100)).toBeCloseTo(61);
  });
  it('saturates at the cap', () => {
    expect(levelRewardMult(1e10)).toBe(1_200_000);
  });
});

describe('srsHash', () => {
  it('is deterministic and non-negative', () => {
    expect(srsHash('v1')).toBe(srsHash('v1'));
    expect(srsHash('hwp7')).toBeGreaterThanOrEqual(0);
  });
  it('returns 0 for empty string', () => {
    expect(srsHash('')).toBe(0);
  });
  it('produces different hashes for different ids', () => {
    expect(srsHash('v1')).not.toBe(srsHash('v2'));
  });
});

describe('unlockedTierForLevel', () => {
  it('returns 1 for fresh accounts', () => {
    expect(unlockedTierForLevel(1, CARD_TIERS)).toBe(1);
  });
  it('unlocks tier 2 at level 50', () => {
    expect(unlockedTierForLevel(49, CARD_TIERS)).toBe(1);
    expect(unlockedTierForLevel(50, CARD_TIERS)).toBe(2);
  });
  it('unlocks tier 5 at level 25000', () => {
    expect(unlockedTierForLevel(25000, CARD_TIERS)).toBe(5);
    expect(unlockedTierForLevel(1e9, CARD_TIERS)).toBe(5);
  });
});

describe('cardTier', () => {
  it('classifies foundational vocab as tier 1', () => {
    expect(cardTier({ id: 'v1', type: 'vocab' })).toBe(1);
    expect(cardTier({ id: 'pc1', type: 'vocab' })).toBe(1);
    expect(cardTier({ id: 'd1', type: 'vocab' })).toBe(1);
  });
  it('splits numbers: 1-10 tier 1, 11+ tier 2', () => {
    expect(cardTier({ id: 'n1', type: 'vocab' })).toBe(1);
    expect(cardTier({ id: 'n10', type: 'vocab' })).toBe(1);
    expect(cardTier({ id: 'n11', type: 'vocab' })).toBe(2);
  });
  it('classifies adjectives/verbs as tier 3', () => {
    expect(cardTier({ id: 'ad1', type: 'vocab' })).toBe(3);
    expect(cardTier({ id: 'vb1', type: 'vocab' })).toBe(3);
  });
  it('classifies grammar parts-of-speech as tier 4', () => {
    expect(cardTier({ id: 'g1', type: 'grammar' })).toBe(4);
    expect(cardTier({ id: 'g4', type: 'grammar' })).toBe(4);
    expect(cardTier({ id: 'qy1', type: 'grammar' })).toBe(4);
  });
  it('classifies advanced grammar as tier 5', () => {
    expect(cardTier({ id: 'tense12', type: 'grammar' })).toBe(5);
  });
  it('classifies greetings/yes-no/early phrases as tier 1', () => {
    expect(cardTier({ id: 'gx1', type: 'phrase' })).toBe(1);
    expect(cardTier({ id: 'yn1', type: 'phrase' })).toBe(1);
    expect(cardTier({ id: 'p1', type: 'phrase' })).toBe(1);
    expect(cardTier({ id: 'p10', type: 'phrase' })).toBe(1);
    expect(cardTier({ id: 'p11', type: 'phrase' })).toBe(3);
  });
  it('returns 3 for null/undefined card', () => {
    expect(cardTier(null)).toBe(3);
    expect(cardTier(undefined)).toBe(3);
  });
});

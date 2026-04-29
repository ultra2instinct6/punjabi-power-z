import { describe, it, expect, beforeAll } from 'vitest';
import { loadGameGlobals } from '../fixtures/load-globals.js';

let CFG;
beforeAll(() => { CFG = loadGameGlobals().PPZ_CONFIG; });

describe('PPZ_CONFIG shape', () => {
  it('exposes all required sections', () => {
    expect(Object.keys(CFG).sort()).toEqual(
      ['BATTLE', 'CARD_TIERS', 'DIFFICULTY', 'ENEMIES', 'INTERRUPT', 'LEARNING_LOOP', 'RANKS', 'SRS'].sort()
    );
  });
});

describe('RANKS', () => {
  it('is sorted ascending by level and starts at 1', () => {
    expect(CFG.RANKS[0].level).toBe(1);
    for (let i = 1; i < CFG.RANKS.length; i++) {
      expect(CFG.RANKS[i].level).toBeGreaterThan(CFG.RANKS[i - 1].level);
    }
  });
  it('every entry has title + badge', () => {
    for (const r of CFG.RANKS) {
      expect(r.title).toBeTypeOf('string');
      expect(r.badge).toBeTypeOf('string');
    }
  });
});

describe('ENEMIES', () => {
  it('every enemy has name, hp, valid tier', () => {
    const tiers = new Set(['minion', 'elite', 'boss']);
    for (const e of CFG.ENEMIES) {
      expect(e.name).toBeTypeOf('string');
      expect(e.baseHp).toBeGreaterThan(0);
      expect(tiers.has(e.tier)).toBe(true);
    }
  });
  it('boss enemies have a quote + koQuote', () => {
    for (const e of CFG.ENEMIES.filter((x) => x.tier === 'boss')) {
      expect(e.quote, `boss ${e.name} missing quote`).toBeTypeOf('string');
      expect(e.koQuote, `boss ${e.name} missing koQuote`).toBeTypeOf('string');
    }
  });
});

describe('BATTLE tier ladder', () => {
  it('TIER_DMG_MULT has TIER_THRESHOLDS.length + 1 entries (base form + each tier)', () => {
    expect(CFG.BATTLE.TIER_DMG_MULT.length).toBe(CFG.BATTLE.TIER_THRESHOLDS.length + 1);
  });
  it('TIER_NAMES aligns with TIER_DMG_MULT length', () => {
    expect(CFG.BATTLE.TIER_NAMES.length).toBe(CFG.BATTLE.TIER_DMG_MULT.length);
  });
  it('damage multipliers are monotonically increasing', () => {
    const m = CFG.BATTLE.TIER_DMG_MULT;
    for (let i = 1; i < m.length; i++) expect(m[i]).toBeGreaterThan(m[i - 1]);
  });
  it('tier thresholds are strictly increasing', () => {
    const t = CFG.BATTLE.TIER_THRESHOLDS;
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThan(t[i - 1]);
  });
});

describe('DIFFICULTY', () => {
  it('exposes the four canonical difficulties', () => {
    expect(Object.keys(CFG.DIFFICULTY).sort()).toEqual(['easy', 'endless', 'hard', 'normal']);
  });
  it('endless has fights = Infinity', () => {
    expect(CFG.DIFFICULTY.endless.fights).toBe(Infinity);
    expect(CFG.DIFFICULTY.endless.endless).toBe(true);
  });
});

describe('SRS', () => {
  it('ease bounds bracket the start ease', () => {
    expect(CFG.SRS.EASE_START).toBeGreaterThan(CFG.SRS.EASE_MIN);
    expect(CFG.SRS.EASE_START).toBeLessThan(CFG.SRS.EASE_MAX);
  });
  it('learning steps are ascending', () => {
    const s = CFG.SRS.LEARNING_STEPS_MIN;
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1]);
  });
  it('MAX_INTERVAL_DAYS caps the schedule reasonably', () => {
    expect(CFG.SRS.MAX_INTERVAL_DAYS).toBeGreaterThanOrEqual(30);
    expect(CFG.SRS.MAX_INTERVAL_DAYS).toBeLessThanOrEqual(3650);
  });
});

describe('CARD_TIERS', () => {
  it('UNLOCK_AT covers tiers 1..MAX, monotonically increasing', () => {
    const { MAX, UNLOCK_AT } = CFG.CARD_TIERS;
    let prev = -Infinity;
    for (let t = 1; t <= MAX; t++) {
      expect(UNLOCK_AT[t]).toBeGreaterThan(prev);
      prev = UNLOCK_AT[t];
    }
  });
});

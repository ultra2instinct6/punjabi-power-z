import { describe, it, expect, beforeAll } from 'vitest';
import { loadGameGlobals } from '../fixtures/load-globals.js';

let BANK, TOPICS;
beforeAll(() => {
  const g = loadGameGlobals();
  BANK = g.MEDICINE_BANK;
  TOPICS = g.MEDICINE_TOPICS;
});

describe('MEDICINE_TOPICS', () => {
  it('exposes the canonical 15 topic codes', () => {
    expect(Object.keys(TOPICS).sort()).toEqual(
      ['BIOS','CARD','CCS','ENDO','GI','HEME','ID','NEURO','OBGYN','PEDS','PSYCH','PULM','RENAL','RHEUM','SURG'].sort()
    );
  });
});

describe('MEDICINE_BANK', () => {
  it('loads as a non-empty array', () => {
    expect(Array.isArray(BANK)).toBe(true);
    expect(BANK.length).toBeGreaterThan(100);
  });

  it('every question has a complete schema', () => {
    for (const q of BANK) {
      expect(q.id, JSON.stringify(q).slice(0, 80)).toMatch(/^[a-z]+-\d+/);
      expect(Object.values(TOPICS), q.id).toContain(q.topic);
      expect(q.subtopic, q.id).toBeTypeOf('string');
      expect(q.stem, q.id).toBeTypeOf('string');
      expect(Array.isArray(q.choices), q.id).toBe(true);
      expect(q.choices.length, q.id).toBe(4);
      for (const c of q.choices) expect(c, q.id).toBeTypeOf('string');
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThanOrEqual(3);
      expect(q.pearl, q.id).toBeTypeOf('string');
      expect(['mcq', 'ccs']).toContain(q.type);
    }
  });

  it('has unique question ids', () => {
    const seen = new Set();
    const dups = [];
    for (const q of BANK) {
      if (seen.has(q.id)) dups.push(q.id);
      else seen.add(q.id);
    }
    expect(dups).toEqual([]);
  });

  it('every topic has at least one question', () => {
    const used = new Set(BANK.map((q) => q.topic));
    for (const t of Object.values(TOPICS)) {
      expect(used.has(t), `topic "${t}" has no questions`).toBe(true);
    }
  });
});

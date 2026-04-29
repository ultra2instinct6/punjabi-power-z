import { describe, it, expect, beforeAll } from 'vitest';
import { loadGameGlobals } from '../fixtures/load-globals.js';

let DECK;
beforeAll(() => { DECK = loadGameGlobals().PPZ_DECK; });

describe('PPZ_DECK', () => {
  it('loads as a non-empty array', () => {
    expect(Array.isArray(DECK)).toBe(true);
    expect(DECK.length).toBeGreaterThan(1000);
  });

  it('every card has id + type + punjabi + english', () => {
    for (const c of DECK) {
      expect(c.id, JSON.stringify(c)).toBeTypeOf('string');
      expect(c.type, c.id).toBeTypeOf('string');
      expect(c.punjabi, c.id).toBeTypeOf('string');
      expect(c.english, c.id).toBeTypeOf('string');
    }
  });

  it('uses only known card types', () => {
    const allowed = new Set(['vocab', 'phrase', 'grammar']);
    for (const c of DECK) expect(allowed.has(c.type), `${c.id} type=${c.type}`).toBe(true);
  });

  it('has unique card ids', () => {
    const seen = new Map();
    const dups = [];
    for (const c of DECK) {
      if (seen.has(c.id)) dups.push(c.id);
      else seen.set(c.id, true);
    }
    expect(dups).toEqual([]);
  });

  it('related references resolve to existing card ids', () => {
    const ids = new Set(DECK.map((c) => c.id));
    const broken = [];
    for (const c of DECK) {
      if (!c.related) continue;
      const refs = String(c.related).split(/[,/]/).map((s) => s.trim()).filter(Boolean);
      for (const r of refs) {
        if (!ids.has(r) && !DECK.some((x) => x.punjabi === r)) {
          broken.push(`${c.id} -> ${r}`);
        }
      }
    }
    // We tolerate non-id `related` strings (they often point at words by Punjabi spelling),
    // so this just guards against typos that look like ids but aren't.
    const idLike = broken.filter((s) => /-> [a-z]+\d+$/.test(s));
    expect(idLike).toEqual([]);
  });
});

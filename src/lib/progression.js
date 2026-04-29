/* ============================================================
   Punjabi Power Z — pure progression helpers (Phase 6)
   Mirror of the same-named functions inside the script.js IIFE.
   Kept here as ES modules so they can be unit-tested without
   booting the DOM. If you change behavior in script.js, update
   the mirror here and the matching test will catch drift.
   ============================================================ */

/** Pick the highest rank table entry whose `level` <= `level`. */
export function getRank(level, ranks) {
  let r = ranks[0];
  for (const e of ranks) if (level >= e.level) r = e;
  return r;
}

/** XP required to advance from `level` -> `level+1`. */
export function xpForNext(level) {
  return Math.max(60, Math.round(60 + 40 * level));
}

/** Per-level reward multiplier. Capped to avoid overflow at the level ceiling. */
export function levelRewardMult(level) {
  return Math.min(1 + level * 0.6, 1_200_000);
}

/** Deterministic non-negative hash for an SRS card id (used for fuzz seeding). */
export function srsHash(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Highest tier unlocked at the given player level, given a CARD_TIERS table. */
export function unlockedTierForLevel(level, cardTiers) {
  let unlocked = 1;
  for (let t = 1; t <= cardTiers.MAX; t++) {
    if (level >= cardTiers.UNLOCK_AT[t]) unlocked = t;
  }
  return unlocked;
}

/** Tier classification for a deck card. Mirrors the IIFE rules in script.js. */
export function cardTier(card) {
  if (!card) return 3;
  const id = card.id || '';
  const num = parseInt((id.match(/\d+$/) || ['0'])[0], 10);

  if (card.type === 'grammar') {
    if (/^g([1-4])$/.test(id)) return 4;
    if (/^(qy|fw|fa|mw)\d+$/.test(id)) return 4;
    return 5;
  }
  if (card.type === 'phrase') {
    if (/^(gx|yn)\d+$/.test(id)) return 1;
    if (/^p\d+$/.test(id) && num <= 10) return 1;
    if (/^lm\d+$/.test(id)) return 4;
    if (/^(hwd|hsd|bzd)\d+$/.test(id)) return 4;
    if (/^(hwp|hsp|bzp)\d+$/.test(id)) return 3;
    return 3;
  }
  // Vocab
  if (/^v\d+$/.test(id)) return 1;
  if (/^(pc|c|d)\d+$/.test(id)) return 1;
  if (/^n\d+$/.test(id)) return num <= 10 ? 1 : 2;
  if (/^(f|b|t|fd|a|pl|q)\d+$/.test(id)) return 2;
  if (/^(ad|vb)\d+$/.test(id)) return 3;
  if (/^(hw|hs|bz)\d+$/.test(id)) return 3;
  return 2;
}

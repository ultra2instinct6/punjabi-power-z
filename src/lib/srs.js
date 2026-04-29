/* ============================================================
   Punjabi Power Z — SRS scheduler (pure)
   Mirror of the SRS scheduling logic inside the script.js IIFE.
   Kept here as ES modules so we can unit-test the scheduling
   math without booting the DOM. If you change behavior in
   script.js, update the mirror here and the tests will catch
   any drift.

   Conventions:
     - All times in milliseconds since epoch
     - Intervals stored on srs in *days*
     - Grade is one of: "again" | "hard" | "good" | "easy"
     - Card record `srs` shape:
         { queue, step, interval, due, ease, reps, lapses, mastery,
           lastResult, history?, suspended?, masteredAt? }
   ============================================================ */

import { srsHash } from './progression.js';

const MIN = 60_000;
const DAY = 86_400_000;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Deterministic ±FUZZ_PCT jitter on an interval (days). */
export function fuzzInterval(id, days, srs) {
  if (days < 2) return Math.min(days, srs.MAX_INTERVAL_DAYS);
  const h = srsHash(id);
  const norm = ((h % 1000) / 1000) * 2 - 1;
  const fuzzed = Math.max(1, Math.round(days * (1 + srs.FUZZ_PCT * norm)));
  return Math.min(fuzzed, srs.MAX_INTERVAL_DAYS);
}

/** Hard-cap an interval and round to whole days. */
export function capInterval(days, srs) {
  return Math.min(Math.max(1, Math.round(days)), srs.MAX_INTERVAL_DAYS);
}

/** True if the card meets the "Mastered" criteria. */
export function isMastered(srs, cfg) {
  return (
    !!srs &&
    srs.queue === 'review' &&
    (srs.interval || 0) >= cfg.MASTERY_INTERVAL_DAYS &&
    (srs.lapses || 0) <= cfg.MASTERY_MAX_LAPSES
  );
}

/** True if the card has lapsed enough times to auto-suspend. */
export function isLeech(srs, cfg) {
  return !!srs && (srs.lapses || 0) >= cfg.LEECH_LAPSE_THRESHOLD;
}

/** Bucket a timestamp into a YYYY-MM-DD study-day key (4 AM rollover). */
export function todayKey(now, cfg) {
  const d = new Date(now - cfg.STUDY_DAY_OFFSET_HOURS * 3600_000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Timestamp of the next study-day rollover (4 AM local by default). */
export function startOfNextStudyDay(now, cfg) {
  const offsetMs = cfg.STUDY_DAY_OFFSET_HOURS * 3600_000;
  const shifted = new Date(now - offsetMs);
  shifted.setHours(0, 0, 0, 0);
  return shifted.getTime() + 86_400_000 + offsetMs;
}

/**
 * Apply a grade to an SRS card record. Mutates `srs` and returns the new state.
 * Pure: relies only on `cfg` (an SRS config) and `now` (timestamp). No I/O.
 *
 * Mirrors `applySrsGrade` in script.js *without* the XP and toast side-effects
 * — those stay in the DOM-bound code. The tests below pin the math.
 */
export function applyGrade(srs, cardId, grade, cfg, now) {
  if (!Array.isArray(srs.history)) srs.history = [];
  srs.history.push(grade[0]);
  if (srs.history.length > 5) srs.history.splice(0, srs.history.length - 5);

  const graduate = (intervalDays, easeBump = 0) => {
    srs.queue = 'review';
    srs.step = 0;
    srs.interval = intervalDays;
    srs.due = now + fuzzInterval(cardId, intervalDays, cfg) * DAY;
    srs.reps = (srs.reps || 0) + 1;
    if (easeBump) srs.ease = clamp((srs.ease || cfg.EASE_START) + easeBump, cfg.EASE_MIN, cfg.EASE_MAX);
  };

  // --- NEW or LEARNING ----------------------------------------------------
  if (srs.queue === 'new' || srs.queue === 'learning') {
    if (srs.queue === 'new') {
      srs.queue = 'learning';
      srs.step = 0;
    }
    const steps = cfg.LEARNING_STEPS_MIN;
    switch (grade) {
      case 'again':
        srs.step = 0;
        srs.due = now + steps[0] * MIN;
        srs.mastery = clamp((srs.mastery || 0) - 3, 0, 100);
        break;
      case 'hard':
        srs.due = now + steps[srs.step] * MIN;
        srs.mastery = clamp((srs.mastery || 0) + 1, 0, 100);
        break;
      case 'good':
        srs.step += 1;
        if (srs.step >= steps.length) {
          graduate(cfg.GRAD_INTERVAL_GOOD);
          srs.mastery = clamp((srs.mastery || 0) + 5, 0, 100);
        } else {
          srs.due = now + steps[srs.step] * MIN;
          srs.mastery = clamp((srs.mastery || 0) + 3, 0, 100);
        }
        break;
      case 'easy':
        graduate(cfg.GRAD_INTERVAL_EASY, 0.05);
        srs.mastery = clamp((srs.mastery || 0) + 8, 0, 100);
        break;
    }
    srs.lastResult = grade;
    return srs;
  }

  // --- RELEARNING ---------------------------------------------------------
  if (srs.queue === 'relearning') {
    const steps = cfg.RELEARNING_STEPS_MIN;
    switch (grade) {
      case 'again':
        srs.step = 0;
        srs.due = now + steps[0] * MIN;
        srs.mastery = clamp((srs.mastery || 0) - 4, 0, 100);
        break;
      case 'hard':
        srs.due = now + steps[srs.step] * MIN;
        break;
      case 'good':
        srs.step += 1;
        if (srs.step >= steps.length) {
          srs.queue = 'review';
          srs.step = 0;
          srs.due = now + fuzzInterval(cardId, srs.interval, cfg) * DAY;
          srs.reps = (srs.reps || 0) + 1;
          srs.mastery = clamp((srs.mastery || 0) + 4, 0, 100);
        } else {
          srs.due = now + steps[srs.step] * MIN;
          srs.mastery = clamp((srs.mastery || 0) + 2, 0, 100);
        }
        break;
      case 'easy':
        srs.queue = 'review';
        srs.step = 0;
        srs.interval = Math.max(srs.interval, 1);
        srs.due = now + fuzzInterval(cardId, srs.interval, cfg) * DAY;
        srs.reps = (srs.reps || 0) + 1;
        srs.mastery = clamp((srs.mastery || 0) + 6, 0, 100);
        break;
    }
    srs.lastResult = grade;
    return srs;
  }

  // --- REVIEW (graduated SM-2) -------------------------------------------
  const prevInterval = Math.max(1, srs.interval || 1);
  switch (grade) {
    case 'again': {
      srs.ease = clamp((srs.ease || cfg.EASE_START) - 0.20, cfg.EASE_MIN, cfg.EASE_MAX);
      srs.lapses = (srs.lapses || 0) + 1;
      srs.interval = capInterval(Math.max(1, Math.round(prevInterval * cfg.LAPSE_MULT)), cfg);
      srs.queue = 'relearning';
      srs.step = 0;
      srs.due = now + cfg.RELEARNING_STEPS_MIN[0] * MIN;
      srs.mastery = clamp((srs.mastery || 0) - 5, 0, 100);
      if (isLeech(srs, cfg)) srs.suspended = true;
      break;
    }
    case 'hard': {
      srs.ease = clamp((srs.ease || cfg.EASE_START) - 0.05, cfg.EASE_MIN, cfg.EASE_MAX);
      srs.interval = capInterval(Math.max(prevInterval + 1, prevInterval * cfg.HARD_MULT), cfg);
      srs.due = now + fuzzInterval(cardId, srs.interval, cfg) * DAY;
      srs.reps = (srs.reps || 0) + 1;
      srs.mastery = clamp((srs.mastery || 0) + 3, 0, 100);
      break;
    }
    case 'good': {
      srs.interval = capInterval(Math.max(prevInterval + 1, prevInterval * (srs.ease || cfg.EASE_START)), cfg);
      srs.due = now + fuzzInterval(cardId, srs.interval, cfg) * DAY;
      srs.reps = (srs.reps || 0) + 1;
      srs.mastery = clamp((srs.mastery || 0) + 8, 0, 100);
      break;
    }
    case 'easy': {
      srs.ease = clamp((srs.ease || cfg.EASE_START) + 0.10, cfg.EASE_MIN, cfg.EASE_MAX);
      srs.interval = capInterval(
        Math.max(prevInterval + 2, prevInterval * (srs.ease || cfg.EASE_START) * cfg.EASY_BONUS),
        cfg
      );
      srs.due = now + fuzzInterval(cardId, srs.interval, cfg) * DAY;
      srs.reps = (srs.reps || 0) + 1;
      srs.mastery = clamp((srs.mastery || 0) + 14, 0, 100);
      break;
    }
  }
  srs.lastResult = grade;
  return srs;
}

/** Factory: a fresh SRS record for a brand-new card. */
export function newCard(cfg) {
  return {
    queue: 'new',
    step: 0,
    interval: 0,
    due: 0,
    ease: cfg.EASE_START,
    reps: 0,
    lapses: 0,
    mastery: 0,
    lastResult: null,
    history: [],
  };
}

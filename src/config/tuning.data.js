/* ============================================================
   Punjabi Power Z — Tuning constants
   Extracted from script.js (Phase 2c). Loaded BEFORE script.js
   via index.html. Exposed on window.PPZ_CONFIG for the legacy
   IIFE. All gameplay knobs live here:
     RANKS, ENEMIES, INTERRUPT, BATTLE, DIFFICULTY, SRS, CARD_TIERS
   ============================================================ */
(function () {
  "use strict";

  const RANKS = [
    { level: 1,        title: "Peshtigo Beginner",          badge: "🥋" },
    { level: 50,       title: "Punjabi Trainee",            badge: "🧑‍🎓" },
    { level: 500,      title: "Village Warrior",            badge: "🛡️" },
    { level: 5000,     title: "Saiyan Speaker",             badge: "🔥" },
    { level: 25000,    title: "Super Saiyan Student",       badge: "⚡" },
    { level: 100000,   title: "Super Saiyan Scholar",       badge: "🌟" },
    { level: 500000,   title: "Ultra Instinct Translator",  badge: "🌀" },
    { level: 1000000,  title: "Legendary Super Saiyan Linguist", badge: "👑" },
  ];

  const ENEMIES = [
    { name: "Training Bot",  emoji: "🤖", baseHp: 60,  tier: "minion", flavor: "A friendly first opponent. Warm up.",
      flavorAlts: ["Wakes up. Already disappointed in you.", "Beep boop. Boring boop."] },
    { name: "Saibaman",      emoji: "👽", baseHp: 90,  tier: "minion", flavor: "Small but tricky. Watch your timing." },
    { name: "Goblin Scout",  emoji: "👺", baseHp: 110, tier: "minion", flavor: "Fast on its feet — answer quickly." },
    { name: "Frieza Minion", emoji: "🦖", baseHp: 140, tier: "elite",  flavor: "Elite mook. Hits harder than it looks." },
    { name: "Cell Mini-Boss",emoji: "🐉", baseHp: 220, tier: "boss",   flavor: "A perfect copy. Only perfect answers will do.",
      flavorAlts: ["He copied you, then improved on it."],
      quote: "Show me your perfect form.",
      koQuote: "Imperfect... but worthy." },
    { name: "Cell Jr.",      emoji: "🐲", baseHp: 170, tier: "minion", flavor: "Energetic and dangerous in packs." },
    { name: "Phantom Wraith",emoji: "👻", baseHp: 190, tier: "elite",  flavor: "Its telegraphs are louder. Listen." },
    { name: "Storm Djinn",   emoji: "🌪️", baseHp: 210, tier: "minion", flavor: "Whirlwind attacks come fast." },
    { name: "Frost Lich",    emoji: "🧟", baseHp: 230, tier: "elite",  flavor: "Chills your timer. Stay sharp.",
      flavorAlts: ["Breath like January in Manali."] },
    { name: "Buu Spawn",     emoji: "🟣", baseHp: 270, tier: "boss",   flavor: "Stretchy and stubborn. Big reward.",
      flavorAlts: ["Pink, stretchy, rude."],
      quote: "Mmm... candy or fight?",
      koQuote: "Sticky end." },
    { name: "Shadow Naga",   emoji: "🐍", baseHp: 290, tier: "minion", flavor: "Strikes from the dark." },
    { name: "Final Tyrant",  emoji: "💀", baseHp: 380, tier: "boss",   flavor: "The end of the arena. Everything you've trained for.",
      flavorAlts: ["You've trained 1,000 cards for this moment. Don't choke."],
      quote: "Kneel, learner.",
      koQuote: "You... earned it." },
    // ---- New roster (Section A) ----
    { name: "Tea Slug",          emoji: "🐌", baseHp: 75,  tier: "minion", flavor: "Slow drip, sticky leaves." },
    { name: "Bazaar Thief",      emoji: "🦝", baseHp: 100, tier: "minion", flavor: "Snatches your focus mid-answer." },
    { name: "Pind Crow",         emoji: "🐦", baseHp: 95,  tier: "minion", flavor: "Caws your wrong answers back at you." },
    { name: "Mango Imp",         emoji: "🥭", baseHp: 120, tier: "minion", flavor: "Sweet outside, savage inside." },
    { name: "Gym Bro Saiyan",    emoji: "💪", baseHp: 160, tier: "elite",  flavor: "All sets, no rest day." },
    { name: "Frieza Lieutenant", emoji: "🦎", baseHp: 200, tier: "elite",  flavor: "Cold-blooded and well-paid." },
    { name: "Dhol Demon",        emoji: "🥁", baseHp: 175, tier: "elite",  flavor: "Hits on every beat." },
    { name: "Kali-Yuga Warrior", emoji: "⚔️", baseHp: 220, tier: "elite",  flavor: "Born for the worst age. Thrives in it." },
    { name: "Jungle Tigress",    emoji: "🐅", baseHp: 240, tier: "elite",  flavor: "Stalks your hesitation." },
    { name: "Cyber Naga",        emoji: "🐍", baseHp: 260, tier: "elite",  flavor: "Bytes harder than it bites." },
    { name: "Ghost Pandit",      emoji: "👳", baseHp: 250, tier: "boss",   flavor: "Recites your mistakes back as mantra.",
      quote: "Your roots forgot you.",
      koQuote: "Your roots remember." },
    { name: "Mahishasura",       emoji: "🐃", baseHp: 320, tier: "boss",   flavor: "A bull-demon king. No mortal weapon will do.",
      quote: "No mortal weapon. No chance.",
      koQuote: "A mortal felled me?!" },
    { name: "Shadow Guru",       emoji: "🕯️", baseHp: 340, tier: "boss",   flavor: "Teaches one lesson: humility.",
      quote: "Unlearn, then bow.",
      koQuote: "Lesson learned. By me." },
    { name: "Cell Perfect Form", emoji: "🧬", baseHp: 360, tier: "boss",   flavor: "Every cell has improved. Yours haven't.",
      quote: "I am completion itself.",
      koQuote: "Perfection... has a flaw." },
    { name: "Zero Saiyan",       emoji: "🌌", baseHp: 420, tier: "boss",   flavor: "Beyond the arena. Beyond you.",
      quote: "Beyond the arena. Beyond you.",
      koQuote: "Beyond... defeated." },
  ];

  const INTERRUPT = {
    MIN_CARDS_BETWEEN: 5,
    MAX_CARDS_BETWEEN: 12,
    BASE_CHANCE: 0.30,
    WEIGHTS: { speed: 35, recall: 40, incoming: 25 },
    SPEED_DURATION_MS: 20000,
    INCOMING_DURATION_MS: 6000,
    RECALL_DURATION_MS: 8000,
    IDLE_MS: 25000,
    REPEAT_MISS_THRESHOLD: 2,
    RECENT_BUFFER_SIZE: 15,
    SHIELD_CAP: 3,
  };

  const BATTLE = {
    QUESTION_MS_BASE: 9000,
    QUESTION_MS_MIN: 5500,
    SPEED_BONUS_MAX: 0.5,        // up to +50% damage for very fast answers
    TELEGRAPH_EVERY: 4,          // enemy charges special every N questions
    TELEGRAPH_TURNS: 2,          // turns to charge
    TELEGRAPH_DAMAGE_MULT: 2.4,  // multiplier on enemyAttack() damage
    // 9-tier DBZ transformation ladder (streak thresholds, dmg mults, names).
    // Index 0 is base form. Thresholds are ascending streak counts.
    TIER_THRESHOLDS: [5, 10, 15, 20, 30, 45, 60, 80, 100],
    TIER_DMG_MULT:   [1.0, 1.10, 1.20, 1.30, 1.40, 1.55, 1.70, 1.90, 2.10, 2.35],
    TIER_NAMES:      [
      "",
      "Kaioken",
      "Super Saiyan",
      "Super Saiyan 2",
      "Super Saiyan 3",
      "Super Saiyan 4",
      "Super Saiyan God",
      "Super Saiyan Blue",
      "Ultra Instinct Sign",
      "Mastered Ultra Instinct",
    ],
    KI_SPECIAL_COST: 100,
    KI_SPECIAL_DMG_BASE: 30,
    KI_SPECIAL_DMG_PER_LVL: 1.2,

    // Focus-mode transformation ladder: 3 meaningful tiers instead of 9.
    // Activated when state.settings.focusMode === true. Cuts fanfare
    // interruptions per battle from ~6–10 down to ≤3 so the learner can
    // keep eyes on the next prompt.
    FOCUS_TIER_THRESHOLDS: [10, 25],
    FOCUS_TIER_DMG_MULT:   [1.0, 1.4, 1.9],
    FOCUS_TIER_NAMES:      ["", "Powered Up", "Ultra"],
    // Streak milestones that fire a named-attack toast in focus mode.
    // Anything off this list still grants its damage bonus silently.
    FOCUS_NAMED_ATTACK_STREAKS: [10, 25, 100],
  };

  // Recency-bias and battle→training writeback knobs. Keeping these here
  // so the magic numbers live with the rest of BATTLE/SRS tuning.
  const LEARNING_LOOP = {
    // Cards graded in the current training session get a strong battle pick
    // weight bonus (so freshly-learned vocab shows up in battle).
    SESSION_RECENCY_WEIGHT: 2.5,
    // Cards reviewed within this window in training also get a softer bump
    // even if the in-memory session list is empty (e.g., after reload).
    RECENCY_WINDOW_MS: 30 * 60_000, // 30 minutes
    RECENCY_WEIGHT: 1.5,
    // How many cardIds to keep in state.session.reviewedIds (rolling cap).
    SESSION_BUFFER: 50,
    // After a session has been idle this long, the next training grade
    // starts a fresh session.reviewedIds buffer.
    SESSION_GAP_MS: 30 * 60_000,
    // When a battle miss lands on a card already in the "review" queue,
    // pull its due date forward by this much (no lapse, no interval reset).
    BATTLE_MISS_DUE_PUSHFORWARD_MS: 60_000, // 1 minute
    // Sort priority bonus (in ms-equivalent) for shaky cards that came
    // from a recent battle miss vs a normal shaky flag. Stacks on top of
    // SRS.SHAKY_PRIORITY_BONUS in pickNextCard.
    SHAKY_BATTLE_BONUS_MS: 6 * 3600_000, // 6 hours
    // How many recent battle misses to remember for the post-battle
    // "Cards to review" callout. Drops the oldest beyond this cap.
    BATTLE_MISS_BUFFER: 12,
    // Focus-mode interrupt scaling: gentler, less frequent, off until the
    // learner has graduated this many cards.
    FOCUS_INTERRUPT_BASE_CHANCE: 0.18,
    FOCUS_INTERRUPT_MIN_BETWEEN: 8,
    FOCUS_INTERRUPT_MIN_GRADUATED: 30,
    // Focus-mode pre-battle intro durations.
    FOCUS_INTRO_MINION_MS: 350,
    FOCUS_INTRO_BOSS_MS: 2800,
  };

  const DIFFICULTY = {
    easy:    { label: "Easy",    desc: "Easy — 7 fights, gentle timer, fewer specials.",   fights: 7,  timerMult: 1.30, dmgMult: 0.75, telegraphEvery: 6, healPerKO: 25,  endless: false },
    normal:  { label: "Normal",  desc: "Normal — 10 fights, classic timer.",                fights: 10, timerMult: 1.00, dmgMult: 1.00, telegraphEvery: 4, healPerKO: 20,  endless: false },
    hard:    { label: "Hard",    desc: "Hard — 12 fights, tight timer, no inter-fight heal.", fights: 12, timerMult: 0.85, dmgMult: 1.20, telegraphEvery: 3, healPerKO: 0,   endless: false },
    endless: { label: "Endless", desc: "Endless — survive as long as you can. Heal every 3 KOs.", fights: Infinity, timerMult: 1.00, dmgMult: 1.00, telegraphEvery: 4, healPerKO: 0, healEveryNKOs: 3, healAmount: 18, endless: true },
  };

  const SRS = {
    SCHEMA_VERSION: 3,
    // Learning steps for brand-new cards. Minutes.
    LEARNING_STEPS_MIN: [1, 10, 60 * 24], // 1m, 10m, 1d
    // Relearning steps after a "again" on a graduated card. Minutes.
    RELEARNING_STEPS_MIN: [10, 60 * 24], // 10m, 1d
    // First two graduated intervals (days) before SM-2 takes over.
    GRAD_INTERVAL_GOOD: 1,
    GRAD_INTERVAL_EASY: 4,
    // Ease bounds + starting ease.
    EASE_MIN: 1.3,
    EASE_MAX: 2.8,
    EASE_START: 2.3,
    // Interval multipliers in review queue.
    HARD_MULT: 1.2,
    EASY_BONUS: 1.3,
    // Fuzz applied to review intervals (±FUZZ_PCT). Deterministic per card.
    FUZZ_PCT: 0.05,
    // After a lapse, new interval = max(1, oldInterval * LAPSE_MULT).
    LAPSE_MULT: 0.5,
    // Hard upper bound on any single interval (days). Prevents cards from
    // disappearing into multi-year intervals.
    MAX_INTERVAL_DAYS: 365,
    // Mastery threshold for the "Mastered" badge.
    MASTERY_INTERVAL_DAYS: 21,
    MASTERY_MAX_LAPSES: 1,
    // Adaptive new-card pacing. Not user-tunable: we want every learner on
    // a research-backed schedule (5/day baseline, ~10 cards/day max for a
    // language deck this size, scaled down by recent backlog/lapses).
    NEW_PER_DAY_BASE: 5,
    NEW_PER_DAY_MIN: 1,
    NEW_PER_DAY_MAX: 10,
    BACKLOG_SOFT_CAP: 30,           // reviews beyond this start shrinking new cap
    LAPSE_LOOKBACK_MS: 7 * 86400_000,
    // Battle soft-writeback ease deltas.
    BATTLE_EASE_FAST: 0.02,
    BATTLE_EASE_SLOW: 0.01,
    BATTLE_EASE_MISS: -0.05,
    BATTLE_FAST_MS: 2000,
    // Shaky-card boost: training reviews from shakyCards get sorted earlier.
    SHAKY_PRIORITY_BONUS: 1,
    // Auto-clear shaky flag if the card hasn't been seen in this long.
    SHAKY_DECAY_MS: 14 * 86400_000,
    // Leech: a card with this many lapses is auto-suspended from training
    // and battle until the user explicitly resets it.
    LEECH_LAPSE_THRESHOLD: 8,
    // "Day" rolls over at 4 AM local so late-night sessions stay on the
    // same study day.
    STUDY_DAY_OFFSET_HOURS: 4,
  };

  const CARD_TIERS = {
    // Player level required to unlock each tier's NEW cards. Aligned with
    // the rank table (Beginner / Trainee / Village Warrior / Saiyan Speaker
    // / Super Saiyan Student) so each early rank-up actually unlocks new
    // content instead of being purely cosmetic.
    UNLOCK_AT: { 1: 1, 2: 50, 3: 500, 4: 5000, 5: 25000 },
    NAMES:     { 1: "Foundations", 2: "Daily Life", 3: "Communication", 4: "Grammar Basics", 5: "Advanced" },
    MAX: 5,
  };

  window.PPZ_CONFIG = { RANKS, ENEMIES, INTERRUPT, BATTLE, LEARNING_LOOP, DIFFICULTY, SRS, CARD_TIERS };
})();

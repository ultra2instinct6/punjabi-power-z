/* ============================================================
   Punjabi Power Z — Warrior from Peshtigo
   Single-file game logic. No backend. localStorage save.
   ============================================================ */

(() => {
  "use strict";

  // ---------- Content (extracted to src/data/deck.data.js) -------
  /** @type {{id:string, type:'vocab'|'phrase'|'grammar', punjabi:string, english:string, definition?:string, related?:string, example?:string}[]} */
  const DECK = window.PPZ_DECK;
  if (!Array.isArray(DECK)) {
    throw new Error('PPZ: deck.data.js must load before script.js');
  }

  // ---------- Ranks -----------------------------------------------------------
  const RANKS = window.PPZ_CONFIG.RANKS;

  function getRank(level) {
    let r = RANKS[0];
    for (const e of RANKS) if (level >= e.level) r = e;
    return r;
  }

  // Gentle linear XP curve so the time-per-level is roughly constant at
  // every level (rewards below scale with level too). 1→100 is a warm-up
  // (≈20 levels per battle run), then the absolute numbers grow but the
  // pace doesn't. Designed so the rank ladder all the way to 1,000,000
  // feels like a long, steady grind rather than a wall.
  //   L1→2:    100 xp        L500→501:    20,060 xp
  //   L50→51:  2,060 xp      L5000→5001:  200,060 xp
  //   L100→101: 4,060 xp      L25000→25001: 1,000,060 xp
  function xpForNext(level) {
    return Math.max(60, Math.round(60 + 40 * level));
  }

  // Per-level reward multiplier shared by Training and Battle. Keeps XP
  // gain proportional to the curve above so each session is meaningful no
  // matter how high you've climbed. Capped to avoid catastrophic overflow
  // near the level ceiling.
  function levelRewardMult() {
    return Math.min(1 + state.level * 0.6, 1_200_000);
  }

  // ---------- Enemies ---------------------------------------------------------
  const ENEMIES = window.PPZ_CONFIG.ENEMIES;

  // ---------- Tuning constants (random training interrupts) ------------------
  const INTERRUPT = window.PPZ_CONFIG.INTERRUPT;

  // ---------- Tuning constants (battle) --------------------------------------
  const BATTLE = window.PPZ_CONFIG.BATTLE;

  // ---------- Tuning constants (Training↔Battle learning loop) --------------
  const LEARNING_LOOP = window.PPZ_CONFIG.LEARNING_LOOP || {
    SESSION_RECENCY_WEIGHT: 2.5, RECENCY_WINDOW_MS: 30 * 60_000, RECENCY_WEIGHT: 1.5,
    SESSION_BUFFER: 50, SESSION_GAP_MS: 30 * 60_000,
    BATTLE_MISS_DUE_PUSHFORWARD_MS: 60_000, SHAKY_BATTLE_BONUS_MS: 6 * 3600_000,
    BATTLE_MISS_BUFFER: 12,
    FOCUS_INTERRUPT_BASE_CHANCE: 0.18, FOCUS_INTERRUPT_MIN_BETWEEN: 8, FOCUS_INTERRUPT_MIN_GRADUATED: 30,
    FOCUS_INTRO_MINION_MS: 350, FOCUS_INTRO_BOSS_MS: 2800,
  };
  // Convenience: is the learner in Focus Mode? Reads settings each call so
  // toggling at runtime takes effect immediately.
  function isFocusMode() { return !!(state && state.settings && state.settings.focusMode); }
  function isBossSpecialsOn() {
    if (!state || !state.settings) return true;
    return state.settings.bossSpecials !== false;
  }

  // Per-difficulty tuning. Modifiers applied at run start in startBattle().
  const DIFFICULTY = window.PPZ_CONFIG.DIFFICULTY;

  // ---------- Spaced-Repetition tuning --------------------------------------
  const SRS = window.PPZ_CONFIG.SRS;

  // ---------- Content difficulty tiers --------------------------------------
  const CARD_TIERS = window.PPZ_CONFIG.CARD_TIERS;

  function cardTier(card) {
    if (!card) return 3;
    const id = card.id || "";
    const num = parseInt((id.match(/\d+$/) || ["0"])[0], 10);
    if (card.type === "grammar") {
      if (/^g([1-4])$/.test(id)) return 4;          // parts of speech
      if (/^(qy|fw|fa|mw)\d+$/.test(id)) return 4;  // quantity / function / frequency / measure
      return 5;                                     // everything else grammar = advanced
    }
    if (card.type === "phrase") {
      if (/^(gx|yn)\d+$/.test(id)) return 1;        // greetings & yes/no
      if (/^p\d+$/.test(id) && num <= 10) return 1; // first 10 core phrases
      if (/^lm\d+$/.test(id)) return 4;             // "learning Punjabi" toolkit
      if (/^(hwd|hsd|bzd)\d+$/.test(id)) return 4;  // mini-dialogues — advanced
      if (/^(hwp|hsp|bzp)\d+$/.test(id)) return 3;  // health / hospitality / business phrases
      return 3;                                     // kindness, compliments, apologies, etc.
    }
    // Vocab
    if (/^v\d+$/.test(id)) return 1;                // core vocab v1..vN
    if (/^(pc|c|d)\d+$/.test(id)) return 1;         // pronouns, colors, days
    if (/^n\d+$/.test(id)) return num <= 10 ? 1 : 2;// numbers 1-10 foundational, rest tier 2
    if (/^(f|b|t|fd|a|pl|q)\d+$/.test(id)) return 2;// family, body, time, food, animals, places, questions
    if (/^(ad|vb)\d+$/.test(id)) return 3;          // adjectives, verbs
    if (/^(hw|hs|bz)\d+$/.test(id)) return 3;       // health / hospitality / business vocab
    return 2;                                       // sensible default for unclassified vocab groups
  }

  function unlockedTierForLevel(level) {
    let unlocked = 1;
    for (let t = 1; t <= CARD_TIERS.MAX; t++) {
      if (level >= CARD_TIERS.UNLOCK_AT[t]) unlocked = t;
    }
    return unlocked;
  }

  function srsHash(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function fuzzInterval(id, days) {
    if (days < 2) return Math.min(days, SRS.MAX_INTERVAL_DAYS);
    const h = srsHash(id);
    // Deterministic offset in [-FUZZ_PCT, +FUZZ_PCT].
    const norm = ((h % 1000) / 1000) * 2 - 1;
    const fuzzed = Math.max(1, Math.round(days * (1 + SRS.FUZZ_PCT * norm)));
    return Math.min(fuzzed, SRS.MAX_INTERVAL_DAYS);
  }
  function capInterval(days) {
    return Math.min(Math.max(1, Math.round(days)), SRS.MAX_INTERVAL_DAYS);
  }
  function todayKey(now = Date.now()) {
    // Subtract the offset so anything before 4 AM counts as "yesterday".
    const d = new Date(now - SRS.STUDY_DAY_OFFSET_HOURS * 3600_000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function getDailyStats(now = Date.now()) {
    if (!state.dailyStats) state.dailyStats = {};
    const k = todayKey(now);
    if (!state.dailyStats[k]) state.dailyStats[k] = { newIntroduced: 0, lapses: 0, reviews: 0 };
    return state.dailyStats[k];
  }
  // Returns the ms timestamp of the next study-day rollover (4 AM local by
  // default). Used by Bury so a buried card sleeps until the next "study day"
  // begins, matching the rest of our day-bucketing logic.
  function startOfNextStudyDay(now = Date.now()) {
    const offsetMs = SRS.STUDY_DAY_OFFSET_HOURS * 3600_000;
    const shifted = new Date(now - offsetMs);
    shifted.setHours(0, 0, 0, 0);
    // Next midnight in shifted-time + offset gets us back to wall-clock 4 AM tomorrow.
    return shifted.getTime() + 86_400_000 + offsetMs;
  }
  function recentLapses(ms = SRS.LAPSE_LOOKBACK_MS) {
    if (!state.dailyStats) return 0;
    const cutoff = Date.now() - ms;
    let n = 0;
    for (const [k, v] of Object.entries(state.dailyStats)) {
      const ts = new Date(k + "T00:00:00").getTime();
      if (!isNaN(ts) && ts >= cutoff) n += (v.lapses || 0);
    }
    return n;
  }
  function isLeech(s) {
    return !!s && (s.lapses || 0) >= SRS.LEECH_LAPSE_THRESHOLD;
  }
  function dueReviewCount(now = Date.now()) {
    let n = 0;
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s || s.suspended || isLeech(s)) continue;
      if ((s.queue === "review" || s.queue === "relearning") && (s.due || 0) <= now) n++;
    }
    return n;
  }
  function masteryPctRaw() {
    let mastered = 0, denom = 0;
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s || s.suspended) continue;
      denom++;
      if (s.queue === "review" && s.interval >= SRS.MASTERY_INTERVAL_DAYS && (s.lapses || 0) <= SRS.MASTERY_MAX_LAPSES) mastered++;
    }
    return denom ? Math.round((mastered / denom) * 100) : 0;
  }
  function dailyNewCardLimit() {
    const backlog = dueReviewCount();
    const lapses = recentLapses();
    let cap = SRS.NEW_PER_DAY_BASE;
    if (backlog > SRS.BACKLOG_SOFT_CAP) {
      cap -= Math.floor((backlog - SRS.BACKLOG_SOFT_CAP) / 10);
    }
    cap -= Math.floor(lapses / 5);
    if (masteryPctRaw() > 60 && backlog < 10) cap += 2;
    return clamp(cap, SRS.NEW_PER_DAY_MIN, SRS.NEW_PER_DAY_MAX);
  }
  function forecastDueByDay(days = 7) {
    const now = Date.now();
    const buckets = new Array(days).fill(0);
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s || s.queue === "new" || s.suspended || isLeech(s)) continue;
      if ((s.due || 0) <= now) { buckets[0]++; continue; }
      const offset = Math.floor(((s.due || 0) - now) / 86400_000);
      if (offset < days) buckets[offset]++;
    }
    return buckets;
  }
  // Sweep shaky-card flags older than SHAKY_DECAY_MS. Cheap; called on session start.
  function decayShakyCards() {
    if (!state.shakyCards) return;
    const cutoff = Date.now() - SRS.SHAKY_DECAY_MS;
    for (const [id, ts] of Object.entries(state.shakyCards)) {
      if (!ts || ts < cutoff) delete state.shakyCards[id];
    }
  }
  // Compute the interval (in days) that a given grade WOULD produce, without
  // mutating state. Used to render preview labels on the SRS buttons.
  function previewGradeInterval(cardId, grade) {
    const s = state.srs[cardId];
    if (!s) return null;
    const min = 1, day = 1440;
    const inLearning = s.queue === "new" || s.queue === "learning" || s.queue === "relearning";
    if (inLearning) {
      const steps = (s.queue === "relearning") ? SRS.RELEARNING_STEPS_MIN : SRS.LEARNING_STEPS_MIN;
      const step = Math.min(s.step || 0, steps.length - 1);
      switch (grade) {
        case "again": return { minutes: steps[0] };
        case "hard":  return { minutes: steps[step] };
        case "good": {
          const next = step + 1;
          if (next >= steps.length) {
            const days = (s.queue === "relearning") ? Math.max(1, s.interval || 1) : SRS.GRAD_INTERVAL_GOOD;
            return { days };
          }
          return { minutes: steps[next] };
        }
        case "easy": {
          const days = (s.queue === "relearning") ? Math.max(1, s.interval || 1) : SRS.GRAD_INTERVAL_EASY;
          return { days };
        }
      }
    }
    // Review queue.
    const prev = Math.max(1, s.interval || 1);
    switch (grade) {
      case "again": return { minutes: SRS.RELEARNING_STEPS_MIN[0] };
      case "hard":  return { days: capInterval(Math.max(prev + 1, prev * SRS.HARD_MULT)) };
      case "good":  return { days: capInterval(Math.max(prev + 1, prev * s.ease)) };
      case "easy":  return { days: capInterval(Math.max(prev + 2, prev * Math.min(SRS.EASE_MAX, s.ease + 0.1) * SRS.EASY_BONUS)) };
    }
    return null;
  }

  // ---------- Haptics --------------------------------------------------------
  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
  }

  // ---------- Punjabi Text-to-Speech ----------------------------------------
  // Strategy: prefer a real `pa-IN` Web Speech voice if the OS provides one
  // (Edge ships one; some Android Chrome builds do too). Otherwise fall back
  // to Google Translate's free TTS endpoint with `tl=pa`, which has a real
  // Punjabi voice and works in any browser via a plain <audio> element.
  // For best pronunciation we feed it Gurmukhi script. Cards without a
  // Gurmukhi mapping still attempt audio with the romanized text (imperfect
  // but functional) — extend GURMUKHI below to improve quality over time.
  const GURMUKHI = {
    // Core vocab
    v1: "ਪਾਣੀ", v2: "ਰੋਟੀ", v3: "ਘਰ", v4: "ਮਾਂ", v5: "ਪਿਓ",
    v6: "ਬਜ਼ਾਰ", v7: "ਗੱਡੀ", v8: "ਜਲਦੀ", v9: "ਰੁਕ", v10: "ਸੁਣ",
    v11: "ਕਿਤਾਬ", v12: "ਦੋਸਤ", v13: "ਸਕੂਲ", v14: "ਚਾਹ", v15: "ਦੁੱਧ",
    v16: "ਰੰਗ", v17: "ਦਿਨ", v18: "ਰਾਤ", v19: "ਖਾਣਾ", v20: "ਨਾਮ",
    // Numbers
    n1: "ਇੱਕ", n2: "ਦੋ", n3: "ਤਿੰਨ", n4: "ਚਾਰ", n5: "ਪੰਜ",
    n6: "ਛੇ", n7: "ਸੱਤ", n8: "ਅੱਠ", n9: "ਨੌਂ", n10: "ਦਸ",
    n11: "ਗਿਆਰਾਂ", n12: "ਬਾਰਾਂ", n13: "ਤੇਰਾਂ", n14: "ਚੌਦਾਂ", n15: "ਪੰਦਰਾਂ",
    n16: "ਸੋਲਾਂ", n17: "ਸਤਾਰਾਂ", n18: "ਅਠਾਰਾਂ", n19: "ਉੱਨੀ",
    n20: "ਵੀਹ", n30: "ਤੀਹ", n40: "ਚਾਲੀ", n50: "ਪੰਜਾਹ",
    n100: "ਸੌ", n1000: "ਹਜ਼ਾਰ",
    // Family
    f1: "ਭਰਾ", f2: "ਭੈਣ", f3: "ਦਾਦਾ", f4: "ਦਾਦੀ", f5: "ਨਾਨਾ",
    f6: "ਨਾਨੀ", f7: "ਚਾਚਾ", f8: "ਮਾਮਾ", f9: "ਪੁੱਤਰ", f10: "ਧੀ",
    f11: "ਪਰਿਵਾਰ",
    // Body
    b1: "ਸਿਰ", b2: "ਅੱਖ", b3: "ਕੰਨ", b4: "ਨੱਕ", b5: "ਮੂੰਹ",
    b6: "ਹੱਥ", b7: "ਪੈਰ", b8: "ਪੇਟ", b9: "ਦਿਲ", b10: "ਵਾਲ",
    b11: "ਦੰਦ", b12: "ਜੀਭ", b13: "ਗਲਾ", b14: "ਉਂਗਲ",
    // Colors
    c1: "ਲਾਲ", c2: "ਨੀਲਾ", c3: "ਪੀਲਾ", c4: "ਹਰਾ", c5: "ਕਾਲਾ",
    c6: "ਚਿੱਟਾ", c7: "ਭੂਰਾ", c8: "ਗੁਲਾਬੀ",
    // Days
    d1: "ਸੋਮਵਾਰ", d2: "ਮੰਗਲਵਾਰ", d3: "ਬੁੱਧਵਾਰ", d4: "ਵੀਰਵਾਰ",
    d5: "ਸ਼ੁੱਕਰਵਾਰ", d6: "ਸ਼ਨੀਵਾਰ", d7: "ਐਤਵਾਰ",
    // Time
    t1: "ਅੱਜ", t2: "ਕੱਲ੍ਹ", t3: "ਸਵੇਰੇ", t4: "ਸ਼ਾਮ", t5: "ਦੁਪਹਿਰ",
    t6: "ਹੁਣ", t7: "ਸਾਲ", t8: "ਮਹੀਨਾ", t9: "ਹਫ਼ਤਾ",
    // Food
    fd1: "ਚਾਵਲ", fd2: "ਦਾਲ", fd3: "ਸਬਜ਼ੀ", fd4: "ਆਲੂ", fd5: "ਫਲ",
    fd6: "ਅੰਬ", fd7: "ਲੱਸੀ", fd8: "ਨਮਕ", fd9: "ਮਿਰਚ", fd10: "ਅੰਡਾ",
    fd11: "ਪਰੌਂਠੇ",
    // Animals
    a1: "ਕੁੱਤਾ", a2: "ਬਿੱਲੀ", a3: "ਗਾਂ", a4: "ਘੋੜਾ", a5: "ਪੰਛੀ", a6: "ਸ਼ੇਰ",
    // Places
    pl1: "ਪਿੰਡ", pl2: "ਸ਼ਹਿਰ", pl3: "ਖੇਤ", pl4: "ਨਦੀ",
    pl5: "ਗੁਰਦੁਆਰਾ", pl6: "ਦੁਕਾਨ",
    // Adjectives
    ad1: "ਵੱਡਾ", ad2: "ਛੋਟਾ", ad3: "ਚੰਗਾ", ad4: "ਮਾੜਾ", ad5: "ਸੋਹਣਾ",
    ad6: "ਗਰਮ", ad7: "ਠੰਡਾ", ad8: "ਨਵਾਂ", ad9: "ਪੁਰਾਣਾ", ad10: "ਸੌਖਾ",
    ad11: "ਔਖਾ",
    // Verbs
    vb1: "ਜਾਣਾ", vb2: "ਆਉਣਾ", vb3: "ਕਰਨਾ", vb4: "ਬੋਲਣਾ", vb5: "ਪੜ੍ਹਨਾ",
    vb6: "ਲਿਖਣਾ", vb7: "ਦੇਖਣਾ", vb8: "ਸਮਝਣਾ", vb9: "ਸਿੱਖਣਾ",
    vb10: "ਸੌਣਾ", vb11: "ਖਰੀਦਣਾ", vb12: "ਦੇਣਾ", vb13: "ਲੈਣਾ",
    // Pronouns
    pr1: "ਮੈਂ", pr2: "ਤੂੰ", pr3: "ਤੁਸੀਂ", pr4: "ਅਸੀਂ", pr5: "ਉਹ", pr6: "ਇਹ",
    // Question words
    q1: "ਕੀ", q2: "ਕਿੱਥੇ", q3: "ਕਦੋਂ", q4: "ਕਿਉਂ", q5: "ਕਿਵੇਂ",
    q6: "ਕੌਣ", q7: "ਕਿੰਨਾ",
    // Phrases
    p1: "ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?", p2: "ਮੈਂ ਠੀਕ ਹਾਂ", p3: "ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?",
    p4: "ਮੇਰਾ ਨਾਮ ___ ਹੈ", p5: "ਮੈਂ ਪੰਜਾਬੀ ਸਿੱਖ ਰਿਹਾ ਹਾਂ",
    p6: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", p7: "ਸ਼ੁਕਰੀਆ",
    p8: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਜੀ", p9: "ਫਿਰ ਮਿਲਾਂਗੇ", p10: "ਰੱਬ ਰਾਖਾ",
    p11: "ਮਾਫ਼ ਕਰਨਾ", p12: "ਕੋਈ ਗੱਲ ਨਹੀਂ", p13: "ਮਿਹਰਬਾਨੀ",
    p14: "ਜੀ ਹਾਂ", p15: "ਜੀ ਨਹੀਂ", p16: "ਤੁਹਾਨੂੰ ਮਿਲ ਕੇ ਖੁਸ਼ੀ ਹੋਈ",
    p17: "ਤੁਸੀਂ ਕਿੱਥੋਂ ਹੋ?", p18: "ਮੈਂ ਅਮਰੀਕਾ ਤੋਂ ਹਾਂ",
    p19: "ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਈ", p20: "ਹੌਲੇ ਬੋਲੋ", p21: "ਫਿਰ ਕਹੋ",
    p22: "ਮੈਨੂੰ ਭੁੱਖ ਲੱਗੀ ਹੈ", p23: "ਮੈਨੂੰ ਪਿਆਸ ਲੱਗੀ ਹੈ",
    p24: "ਮੈਨੂੰ ਪਸੰਦ ਹੈ", p25: "ਮੈਨੂੰ ਪਤਾ ਨਹੀਂ", p26: "ਕਿੰਨੇ ਪੈਸੇ?",
    p27: "ਬਹੁਤ ਮਹਿੰਗਾ ਹੈ", p28: "ਚਲੋ!", p29: "ਅੱਛਾ", p30: "ਖੁਸ਼ ਰਹੋ",
    // Kindness phrases
    k1: "ਜੀ", k2: "ਜੀ ਆਇਆ ਨੂੰ", k3: "ਤਸ਼ਰੀਫ਼ ਰੱਖੋ", k4: "ਬੈਠ ਜਾਓ ਜੀ",
    k5: "ਪਾਣੀ ਪੀਓ ਜੀ", k6: "ਚਾਹ ਪੀ ਕੇ ਜਾਣਾ", k7: "ਕਿਰਪਾ ਕਰਕੇ",
    k8: "ਮਿਹਰਬਾਨੀ ਕਰਕੇ", k9: "ਬਹੁਤ ਸ਼ੁਕਰੀਆ ਜੀ", k10: "ਧੰਨਵਾਦ",
    k11: "ਮੈਨੂੰ ਮਾਫ਼ ਕਰੋ", k12: "ਗ਼ਲਤੀ ਹੋ ਗਈ", k13: "ਤੁਹਾਡੀ ਮਿਹਰਬਾਨੀ",
    k14: "ਰੱਬ ਤੁਹਾਡਾ ਭਲਾ ਕਰੇ", k15: "ਖ਼ੈਰ", k16: "ਸਭ ਠੀਕ ਹੈ",
    k17: "ਕੀ ਹਾਲ ਹੈ?", k18: "ਸਭ ਵਧੀਆ", k19: "ਤੁਹਾਡਾ ਦਿਨ ਵਧੀਆ ਰਹੇ",
    k20: "ਆਰਾਮ ਨਾਲ", k21: "ਫ਼ਿਕਰ ਨਾ ਕਰੋ", k22: "ਮਦਦ ਚਾਹੀਦੀ ਹੈ?",
    k23: "ਮੈਂ ਮਦਦ ਕਰਾਂ?", k24: "ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ", k25: "ਬੇਸ਼ੱਕ",
    k26: "ਜ਼ਰੂਰ", k27: "ਖਿਆਲ ਰੱਖਣਾ", k28: "ਆਪਣਾ ਧਿਆਨ ਰੱਖੋ",
    k29: "ਵਧਾਈਆਂ!", k30: "ਮੁਬਾਰਕ",
    // Weather
    w1: "ਮੌਸਮ", w2: "ਗਰਮੀ", w3: "ਸਰਦੀ", w4: "ਬਾਰਿਸ਼", w5: "ਬੱਦਲ",
    w6: "ਆਸਮਾਨ", w7: "ਸੂਰਜ", w8: "ਚੰਦ", w9: "ਤਾਰੇ", w10: "ਹਵਾ",
    w11: "ਬਰਫ਼", w12: "ਫੁੱਲ", w13: "ਰੁੱਖ",
    // House
    ho1: "ਕਮਰਾ", ho2: "ਰਸੋਈ", ho3: "ਦਰਵਾਜ਼ਾ", ho4: "ਖਿੜਕੀ", ho5: "ਮੇਜ਼",
    ho6: "ਕੁਰਸੀ", ho7: "ਪਲੰਘ", ho8: "ਘੜੀ", ho9: "ਬੱਤੀ", ho10: "ਚਾਬੀ",
    // Health
    h11: "ਦਵਾਈ", h12: "ਡਾਕਟਰ", h13: "ਬੀਮਾਰ", h14: "ਦੁਖਣਾ", h15: "ਆਰਾਮ",
    // School
    s1: "ਉਸਤਾਦ", s2: "ਵਿਦਿਆਰਥੀ", s3: "ਸਬਕ", s4: "ਇਮਤਿਹਾਨ",
    s5: "ਕਲਮ", s6: "ਕਾਗਜ਼",
    // Honorifics
    h1: "ਸਾਹਿਬ", h2: "ਸਰਦਾਰ ਜੀ", h3: "ਵੀਰ ਜੀ", h4: "ਪਾ ਜੀ",
    h5: "ਭੈਣ ਜੀ", h6: "ਬੇਟਾ", h7: "ਪੁੱਤਰ ਜੀ", h8: "ਬਜ਼ੁਰਗ",
    h9: "ਸਤਿਕਾਰ", h10: "ਇੱਜ਼ਤ",
    // Feelings
    fe1: "ਖੁਸ਼", fe2: "ਉਦਾਸ", fe3: "ਗੁੱਸਾ", fe4: "ਸ਼ਾਂਤ", fe5: "ਡਰ",
    fe6: "ਥੱਕ", fe7: "ਪਿਆਰ", fe8: "ਯਾਦ", fe9: "ਦੁੱਖ", fe10: "ਸੁੱਖ",
    fe11: "ਉਮੀਦ", fe12: "ਸਿਹਤ",
    // Daily essentials
    de1: "ਪੈਸਾ", de2: "ਕੰਮ", de3: "ਸਮਾਨ", de4: "ਕੱਪੜਾ", de5: "ਰਸਤਾ",
    de6: "ਸਮਾਂ", de7: "ਵੇਲੇ", de8: "ਫ਼ੋਨ", de9: "ਗੱਲ", de10: "ਸਵਾਲ",
    de11: "ਜਵਾਬ", de12: "ਸੱਚ", de13: "ਝੂਠ", de14: "ਮਿਹਨਤ", de15: "ਹਿੰਮਤ",
    // Ordinals
    no1: "ਪਹਿਲਾ", no2: "ਦੂਜਾ", no3: "ਤੀਜਾ", no4: "ਆਖਰੀ",

    // ===== Phase-2 expansion (single-word vocab; phrases fall back to roman) =====
    // Numbers 21-29, 60-90
    n21: "ਇੱਕੀ", n22: "ਬਾਈ", n23: "ਤੇਈ", n24: "ਚੌਵੀ", n25: "ਪੰਜੀ",
    n26: "ਛੱਬੀ", n27: "ਸਤਾਈ", n28: "ਅਠਾਈ", n29: "ਉਨੱਤੀ",
    n60: "ਸੱਠ", n70: "ਸੱਤਰ", n80: "ਅੱਸੀ", n90: "ਨੱਬੇ",
    // Big numbers
    nh1: "ਸੌ", nh2: "ਦੋ ਸੌ", nh3: "ਪੰਜ ਸੌ", nh4: "ਹਜ਼ਾਰ", nh5: "ਦਸ ਹਜ਼ਾਰ",
    nh6: "ਲੱਖ", nh7: "ਕਰੋੜ", nh8: "ਸਵਾ ਸੌ", nh9: "ਢਾਈ ਸੌ", nh10: "ਅੱਧਾ",
    // Ordinals (or*)
    or1: "ਪਹਿਲਾ", or2: "ਦੂਜਾ", or3: "ਤੀਜਾ", or4: "ਚੌਥਾ", or5: "ਪੰਜਵਾਂ", or6: "ਆਖ਼ਰੀ",
    // More verbs
    vb14: "ਖਾਣਾ", vb15: "ਪੀਣਾ", vb16: "ਖੇਡਣਾ", vb17: "ਹੱਸਣਾ", vb18: "ਰੋਣਾ",
    vb19: "ਤੁਰਨਾ", vb20: "ਦੌੜਨਾ", vb21: "ਬੈਠਣਾ", vb22: "ਖਲੋਣਾ", vb23: "ਉੱਠਣਾ",
    vb24: "ਮਿਲਣਾ", vb25: "ਖੋਲ੍ਹਣਾ", vb26: "ਬੰਦ ਕਰਨਾ", vb27: "ਪੁੱਛਣਾ", vb28: "ਦੱਸਣਾ",
    vb29: "ਸੋਚਣਾ", vb30: "ਯਾਦ ਕਰਨਾ", vb31: "ਭੁੱਲਣਾ",
    vb32: "ਬਣਾਉਣਾ", vb33: "ਤੋੜਨਾ", vb34: "ਜੋੜਨਾ", vb35: "ਸੰਭਾਲਣਾ", vb36: "ਨੱਚਣਾ",
    vb37: "ਗਾਉਣਾ", vb38: "ਧੋਣਾ", vb39: "ਇੰਤਜ਼ਾਰ ਕਰਨਾ", vb40: "ਸ਼ੁਰੂ ਕਰਨਾ",
    vb41: "ਖਤਮ ਕਰਨਾ", vb42: "ਚੁਣਨਾ", vb43: "ਲੱਭਣਾ", vb44: "ਛੁਪਣਾ", vb45: "ਮਾਰਨਾ",
    vb46: "ਜਗਾਉਣਾ", vb47: "ਕਮਾਉਣਾ", vb48: "ਖਰੀਦਣਾ", vb49: "ਵੇਚਣਾ", vb50: "ਗੁੱਸਾ ਕਰਨਾ",
    // Opposites / common adjectives
    op1: "ਲੰਬਾ", op2: "ਉੱਚਾ", op3: "ਨੀਵਾਂ", op4: "ਤੇਜ਼", op5: "ਹੌਲੇ",
    op6: "ਖਾਲੀ", op7: "ਭਰਿਆ", op8: "ਸਾਫ਼", op9: "ਗੰਦਾ", op10: "ਸਸਤਾ", op11: "ਮਹਿੰਗਾ",
    // Personality adjectives
    pa1: "ਸਿਆਣਾ", pa2: "ਬੇਵਕੂਫ਼", pa3: "ਇਮਾਨਦਾਰ", pa4: "ਬਹਾਦਰ", pa5: "ਡਰਪੋਕ",
    pa6: "ਅਮੀਰ", pa7: "ਗਰੀਬ", pa8: "ਮਿਹਨਤੀ", pa9: "ਆਲਸੀ", pa10: "ਪਿਆਰਾ",
    pa11: "ਦੁਸ਼ਮਣ", pa12: "ਆਪਣਾ",
    // Body (extra)
    b15: "ਬਾਂਹ", b16: "ਗਰਦਨ", b17: "ਪਿੱਠ", b18: "ਗੋਡਾ", b19: "ਕੂਹਣੀ",
    b20: "ਖ਼ੂਨ", b21: "ਸਾਹ",
    // Health
    h16: "ਬੁਖ਼ਾਰ", h17: "ਖਾਂਸੀ", h18: "ਜ਼ੁਕਾਮ", h19: "ਚੋਟ", h20: "ਦਰਦ",
    h21: "ਹਸਪਤਾਲ", h22: "ਤਬੀਅਤ",
    // Feelings (extra)
    fe13: "ਸ਼ਰਮਿੰਦਾ", fe14: "ਹੈਰਾਨ", fe15: "ਗਰਵ", fe16: "ਸ਼ੱਕ", fe17: "ਭਰੋਸਾ",
    fe18: "ਮਾਫ਼ੀ", fe19: "ਸ਼ਾਂਤੀ", fe20: "ਖੌਫ਼",
    // Food (extra)
    fd12: "ਗੋਭੀ", fd13: "ਮੂਲੀ", fd14: "ਗਾਜਰ", fd15: "ਪਾਲਕ", fd16: "ਮੇਥੀ",
    fd17: "ਭਿੰਡੀ", fd18: "ਪਨੀਰ", fd19: "ਗੁਲਾਬ ਜਾਮਨ", fd20: "ਜਲੇਬੀ", fd21: "ਖੀਰ",
    fd22: "ਲੱਡੂ", fd23: "ਮਿਠਾਈ", fd24: "ਮਸਾਲਾ ਚਾਹ", fd25: "ਦੁੱਧ ਪੱਤੀ",
    // Fruits
    fr1: "ਸੇਬ", fr2: "ਕੇਲਾ", fr3: "ਅੰਗੂਰ", fr4: "ਸੰਤਰਾ", fr5: "ਤਰਬੂਜ਼",
    fr6: "ਅਨਾਰ", fr7: "ਪਪੀਤਾ", fr8: "ਅਨਾਨਾਸ", fr9: "ਨਾਸ਼ਪਾਤੀ", fr10: "ਖਰਬੂਜਾ",
    // Animals (extra)
    a7: "ਬੱਕਰੀ", a8: "ਚੂਹਾ", a9: "ਕਾਂ", a10: "ਕਬੂਤਰ", a11: "ਮੱਛੀ",
    a12: "ਤਿਤਲੀ", a13: "ਮੱਖੀ", a14: "ਮੱਛਰ", a15: "ਸੱਪ", a16: "ਹਾਥੀ",
    // Nature
    na1: "ਪਹਾੜ", na2: "ਜੰਗਲ", na3: "ਸਮੁੰਦਰ", na4: "ਝੀਲ", na5: "ਰੇਤ",
    na6: "ਮਿੱਟੀ", na7: "ਪੱਤਾ", na8: "ਬੀਜ", na9: "ਬਾਗ਼", na10: "ਅੱਗ",
    // Sports
    sp1: "ਖੇਡ", sp2: "ਕਬੱਡੀ", sp3: "ਕ੍ਰਿਕਟ", sp4: "ਹਾਕੀ", sp5: "ਫੁੱਟਬਾਲ",
    sp6: "ਗੁੱਲੀ-ਡੰਡਾ", sp7: "ਖੋ-ਖੋ", sp8: "ਪਤੰਗ", sp9: "ਤਾਸ਼", sp10: "ਲੂਡੋ",
    // Music
    mu1: "ਗਾਣਾ", mu2: "ਗੀਤ", mu3: "ਧੁਨ", mu4: "ਵਾਜਾ", mu5: "ਤਬਲਾ",
    mu6: "ਹਾਰਮੋਨੀਅਮ", mu7: "ਸਿਤਾਰ", mu8: "ਨਾਚ", mu9: "ਕਵੀ", mu10: "ਕਵਿਤਾ",
    // Religion
    rl1: "ਗੁਰੂ", rl2: "ਗ੍ਰੰਥ", rl3: "ਅਰਦਾਸ", rl4: "ਪਾਠ", rl5: "ਕੀਰਤਨ",
    rl6: "ਸਿਮਰਨ", rl7: "ਨਾਮ", rl8: "ਪੰਗਤ", rl9: "ਖੰਡਾ", rl10: "ਮੰਦਰ",
    rl11: "ਮਸਜਿਦ", rl12: "ਗਿਰਜਾ",
    // Festivals
    fs1: "ਦੀਵਾਲੀ", fs2: "ਹੋਲੀ", fs3: "ਹੋਲਾ ਮਹੱਲਾ", fs4: "ਗੁਰਪੁਰਬ", fs5: "ਈਦ",
    fs6: "ਕਰਵਾ ਚੌਥ", fs7: "ਰੱਖੜੀ", fs8: "ਵਿਆਹ", fs9: "ਜਨਮਦਿਨ", fs10: "ਮੇਲਾ",
    // Wedding
    wd1: "ਬਰਾਤ", wd2: "ਡੋਲੀ", wd3: "ਸਗਨ", wd4: "ਮਿਲਣੀ", wd5: "ਅਨੰਦ ਕਾਰਜ",
    wd6: "ਲਾਵਾਂ", wd7: "ਵਿਦਾਈ", wd8: "ਨਿਕਾਹ",
    // Transport / city
    ct1: "ਬੱਸ", ct2: "ਰੇਲ", ct3: "ਰਿਕਸ਼ਾ", ct4: "ਆਟੋ", ct5: "ਟਰੈਕਟਰ",
    ct6: "ਹਵਾਈ ਜਹਾਜ਼", ct7: "ਏਅਰਪੋਰਟ", ct8: "ਟਿਕਟ", ct9: "ਸਾਈਕਲ", ct10: "ਟ੍ਰੈਫ਼ਿਕ",
    // Work
    wk1: "ਦਫ਼ਤਰ", wk2: "ਨੌਕਰੀ", wk3: "ਬੌਸ", wk4: "ਮੁਲਾਜ਼ਮ", wk5: "ਤਨਖ਼ਾਹ",
    wk6: "ਛੁੱਟੀ", wk7: "ਮੀਟਿੰਗ", wk8: "ਫ਼ਾਈਲ", wk9: "ਕੰਪਿਊਟਰ", wk10: "ਈਮੇਲ",
    // Tech
    tc1: "ਮੋਬਾਈਲ", tc2: "ਇੰਟਰਨੈੱਟ", tc3: "ਵੀਡੀਓ", tc4: "ਮੈਸੇਜ", tc5: "ਫੋਟੋ",
    tc6: "ਕੈਮਰਾ", tc7: "ਟੀਵੀ", tc8: "ਰੇਡੀਓ", tc9: "ਚਾਰਜਰ", tc10: "ਐਪ",
    // Family kinship
    fk1: "ਮਾਮਾ", fk2: "ਮਾਮੀ", fk3: "ਚਾਚਾ", fk4: "ਚਾਚੀ", fk5: "ਤਾਇਆ",
    fk6: "ਤਾਈ", fk7: "ਮਾਸੀ", fk8: "ਭੂਆ", fk9: "ਦਾਦਾ", fk10: "ਦਾਦੀ",
    fk11: "ਨਾਨਾ", fk12: "ਨਾਨੀ",
    // Punjabi months
    mo1: "ਚੇਤ", mo2: "ਵੈਸਾਖ", mo3: "ਜੇਠ", mo4: "ਹਾੜ੍ਹ", mo5: "ਸਾਉਣ",
    mo6: "ਭਾਦੋਂ", mo7: "ਅੱਸੂ", mo8: "ਕੱਤਕ", mo9: "ਮੱਘਰ", mo10: "ਪੋਹ",
    mo11: "ਮਾਘ", mo12: "ਫੱਗਣ",
    // Seasons
    se1: "ਰੁੱਤ", se2: "ਬਹਾਰ", se3: "ਬਰਸਾਤ", se4: "ਪੱਤਝੜ",
    // Time (single-word)
    tm1: "ਵਜਾ", tm2: "ਵਜੇ", tm3: "ਸਵਾ", tm4: "ਸਾਢੇ", tm5: "ਪੌਣੇ",
    tm6: "ਡੇਢ", tm7: "ਢਾਈ", tm8: "ਮਿੰਟ", tm9: "ਘੰਟਾ",
    // Money
    mn1: "ਰੁਪਇਆ", mn2: "ਚਿੱਲਰ", mn3: "ਨੋਟ", mn4: "ਬੈਂਕ", mn5: "ਖਾਤਾ",
    mn6: "ਉਧਾਰ", mn7: "ਮੁਫ਼ਤ", mn8: "ਖਰਚਾ",
    // Clothing
    cl1: "ਕੱਪੜੇ", cl2: "ਕਮੀਜ਼", cl3: "ਸਲਵਾਰ", cl4: "ਕੁੜਤਾ", cl5: "ਪਜਾਮਾ",
    cl6: "ਦੁਪੱਟਾ", cl7: "ਚੁੰਨੀ", cl8: "ਪੱਗ", cl9: "ਜੁੱਤੀ", cl10: "ਜੁਰਾਬ",
    cl11: "ਟੋਪੀ", cl12: "ਚਸ਼ਮੇ",
    // Kitchen
    kc1: "ਚੁੱਲ੍ਹਾ", kc2: "ਤਵਾ", kc3: "ਬਰਤਨ", kc4: "ਚਮਚਾ", kc5: "ਚਾਕੂ",
    kc6: "ਪਲੇਟ", kc7: "ਗਲਾਸ", kc8: "ਆਟਾ", kc9: "ਘਿਓ", kc10: "ਮੱਖਣ",
    kc11: "ਮਸਾਲਾ", kc12: "ਤੜਕਾ",
    // Travel single words
    tr1: "ਸਫ਼ਰ", tr2: "ਸੜਕ", tr3: "ਸਟੇਸ਼ਨ", tr4: "ਸੱਜੇ", tr5: "ਖੱਬੇ",
    tr6: "ਸਿੱਧਾ", tr7: "ਨੇੜੇ", tr8: "ਦੂਰ",
    // Directions
    dr1: "ਸੱਜੇ", dr2: "ਖੱਬੇ", dr3: "ਸਿੱਧਾ", dr4: "ਮੋੜ", dr5: "ਉੱਤਰ",
    dr6: "ਦੱਖਣ", dr7: "ਪੂਰਬ", dr8: "ਪੱਛਮ", dr9: "ਨਜ਼ਦੀਕ", dr10: "ਦੂਰ",
    // Discourse markers
    dm1: "ਓਏ", dm2: "ਲੈ", dm3: "ਚੱਲ", dm4: "ਬੱਸ", dm5: "ਹੋਰ",
    dm6: "ਅੱਛਾ", dm7: "ਸਹੀ", dm8: "ਯਾਰ", dm9: "ਦੇਖ", dm10: "ਸੁਣੋ",
    // Sequence words
    st1: "ਇੱਕ ਵਾਰੀ", st2: "ਫਿਰ", st3: "ਅਚਾਨਕ", st4: "ਆਖ਼ਰ ਵਿੱਚ",
    st5: "ਉਸ ਤੋਂ ਬਾਅਦ", st6: "ਪਹਿਲਾਂ", st7: "ਇਸ ਤੋਂ ਇਲਾਵਾ",
    // Conjunctions
    cj1: "ਤੇ", cj2: "ਅਤੇ", cj3: "ਪਰ", cj4: "ਲੇਕਿਨ", cj5: "ਜਾਂ",
    cj6: "ਕਿਉਂਕਿ", cj7: "ਇਸ ਲਈ", cj8: "ਭਾਵੇਂ", cj9: "ਫਿਰ ਵੀ",
    cj10: "ਜਦੋਂ", cj11: "ਜਿੱਥੇ", cj12: "ਜੋ",
    // Conditionals (single words only)
    cd3: "ਅਗਰ", cd4: "ਮਗਰ", cd5: "ਸ਼ਾਇਦ",
    // Be-verbs (single forms)
    bv1: "ਹਾਂ", bv2: "ਹੈਂ", bv3: "ਹੋ", bv4: "ਹੈ", bv5: "ਹਨ",
    bv6: "ਸੀ", bv7: "ਸੀਗੀ", bv8: "ਸਨ",
    // Light-verb compounds
    lvb1: "ਕਰ ਲੋ", lvb2: "ਦੇ ਦੋ", lvb3: "ਹੋ ਗਿਆ", lvb4: "ਆ ਗਿਆ",
    lvb5: "ਖਾ ਲੋ", lvb6: "ਪੀ ਲੋ", lvb7: "ਲੈ ਲੋ", lvb8: "ਦੱਸ ਦੋ",
    lvb9: "ਲੈ ਆਓ", lvb10: "ਲੈ ਜਾਓ", lvb11: "ਸੁਣਾ ਦੋ", lvb12: "ਦਿਖਾ ਦੋ",
    lvb13: "ਬਣਾ ਦੋ", lvb14: "ਰੱਖ ਦੋ",
    // Imperatives (single-word)
    im1: "ਕਰ", im2: "ਕਰੋ", im3: "ਕਰੋ ਜੀ",
    // Postpositions (g29-g34)
    g29: "ਲਈ", g30: "ਵਰਗੀ", g31: "ਬਿਨਾ", g32: "ਤੱਕ", g33: "ਸਿਵਾ", g34: "ਵਾਸਤੇ",
    // People/community (pc7-8, pr9-10)
    pc7: "ਕਿਸਾਨ", pc8: "ਦੁਕਾਨਦਾਰ", pr9: "ਡਰਾਈਵਰ", pr10: "ਇੰਜੀਨੀਅਰ",
    // Loose words
    lw1: "ਤੇ", lw2: "ਪਰ", lw3: "ਵੀ", lw4: "ਸਿਰਫ਼", lw5: "ਬਹੁਤ",
    lw6: "ਥੋੜ੍ਹਾ", lw7: "ਸਭ", lw8: "ਕੁਝ", lw9: "ਫਿਰ", lw10: "ਅਭੀ",
    // Culture (proper nouns mostly)
    cu1: "ਭੰਗੜਾ", cu2: "ਗਿੱਧਾ", cu3: "ਢੋਲ", cu4: "ਵਿਸਾਖੀ", cu5: "ਲੋਹੜੀ",
    cu6: "ਖ਼ਾਲਸਾ", cu7: "ਪੰਜ ਪਿਆਰੇ", cu8: "ਪਿੰਡ ਦੀ ਹਵਾ",
    // Encouragement (en1-en2 single-word)
    en1: "ਸ਼ਾਬਾਸ਼!", en2: "ਵਧੀਆ ਕੰਮ!",
    // Farming
    fm1: "ਖੇਤੀ", fm2: "ਫਸਲ", fm3: "ਕਣਕ", fm4: "ਬਾਸਮਤੀ", fm5: "ਕਿਸਾਨ",
    fm6: "ਮੰਡੀ", fm7: "ਕੋਠੀ", fm8: "ਢਾਬਾ",
    // Diaspora
    ds1: "ਵਿਲਾਇਤ", ds2: "ਪਰਦੇਸ", ds3: "ਦੇਸ", ds4: "ਐਨ ਆਰ ਆਈ",
    // Reduplication
    rd1: "ਛੋਟੀ-ਮੋਟੀ", rd2: "ਜਲਦੀ-ਜਲਦੀ", rd3: "ਠੀਕ-ਠੀਕ", rd4: "ਅਲੱਗ-ਅਲੱਗ",
    rd5: "ਧੀਰੇ-ਧੀਰੇ", rd6: "ਘਰ-ਘਰ", rd7: "ਫਿਰ-ਫਿਰ", rd8: "ਸੋਹਣਾ-ਸੋਹਣਾ",
    // Restaurant single words
    rs1: "ਮੀਨੂ", rs2: "ਵੇਟਰ", rs3: "ਆਰਡਰ", rs4: "ਬਿੱਲ",
    // Travel/transport extras
    tv1: "ਪਲੇਟਫਾਰਮ", tv9: "ਸਾਮਾਨ",
    // Doctor visit (single words)
    dv3: "ਪਰਚੀ", dv4: "ਦਵਾਈ",
    // Phrases (selected short ones)
    p28: "ਚਲੋ!", p45: "ਕੋਈ ਨਹੀਂ", p49: "ਵਾਹਿਗੁਰੂ", p50: "ਚੜ੍ਹਦੀ ਕਲਾ",
    // Loanword fixes (real Punjabi pronunciations)
    de8: "ਫ਼ੋਨ", mn4: "ਬੈਂਕ", ct8: "ਟਿਕਟ", pr9: "ਡਰਾਈਵਰ",
    wk9: "ਕੰਪਿਊਟਰ", tc5: "ਫ਼ੋਟੋ",
    mw2: "ਗਰਾਮ", mw4: "ਮੀਟਰ", mw7: "ਪੈਕਟ",
    vs4: "ਬੋਤਲ", hi4: "ਬਾਲਕਨੀ",
    pr10: "ਇੰਜੀਨੀਅਰ", sp3: "ਕ੍ਰਿਕਟ", mu6: "ਹਰਮੋਨੀਅਮ",
    ct7: "ਏਅਰਪੋਰਟ", wk7: "ਮੀਟਿੰਗ", wk10: "ਈਮੇਲ",
    tc2: "ਇੰਟਰਨੈੱਟ", tc3: "ਵੀਡੀਓ",
    tv3: "ਟਿਕਟ ਘਰ", hg7: "ਸ਼ੈਂਪੂ",
    pp1: "ਪਾਰਕ", pp2: "ਲਾਇਬ੍ਰੇਰੀ", pp8: "ਸਟੇਡੀਅਮ",
    dg2: "ਪਾਸਵਰਡ", dg6: "ਲਾਗਇਨ", dg7: "ਸਕ੍ਰੀਨਸ਼ਾਟ", dg8: "ਵੀਡੀਓ ਕਾਲ",
    // Pronouns
    pc1: "ਮੈਂ", pc2: "ਤੂੰ", pc3: "ਤੁਸੀਂ", pc4: "ਅਸੀਂ", pc5: "ਉਹ", pc6: "ਇਹ",
    // Hospitality / cultural
    hp2: "ਹੋਰ ਲਉ ਜੀ", hp4: "ਆਪਣਾ ਘਰ ਸਮਝੋ", hp6: "ਲੰਗਰ", hp7: "ਸੇਵਾ", hp8: "ਸੰਗਤ",
    // Polite phrases
    p32: "ਕੋਈ ਤਕਲੀਫ਼ ਨਹੀਂ", p35: "ਪਹਿਲਾਂ ਤੁਸੀਂ", p36: "ਜਿਵੇਂ ਤੁਹਾਡੀ ਮਰਜ਼ੀ",
    p42: "ਮੈਨੂੰ ਲੱਗਦਾ ਹੈ", p43: "ਬੁਰਾ ਨਾ ਮੰਨੋ", p46: "ਆਜਾ ਜੀ",
    p47: "ਕੁਝ ਖਾ ਲਉ", p48: "ਰੱਬ ਮਿਹਰ ਕਰੇ",
    // Soft commands
    sc1: "ਦੱਸੋ ਜੀ", sc2: "ਸੁਣੋ ਜੀ", sc3: "ਵੇਖੋ ਜੀ", sc4: "ਕਰੋ ਜੀ", sc5: "ਲਿਆਉ ਜੀ", sc6: "ਅੰਦਰ ਆਉ ਜੀ",
    tr9: "ਰਸਤਾ ਦੱਸੋ ਜੀ",
    // Sentence builders
    sb1: "ਇਹ ___ ਹੈ", sb2: "ਉਹ ___ ਹੈ",
    // Learner phrases
    lv8: "ਫਿਰ ਕਹੋ ਜੀ", lv10: "ਮੈਨੂੰ ਸਿਖਾ ਦਿਉ",
    sh2: "ਥੋੜਾ ਘੱਟ ਕਰੋ",
    // Encouragement
    en3: "ਲੱਗੇ ਰਹੋ", en5: "ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    // Greetings
    gr1: "ਸੁਬਹ ਬਖ਼ੈਰ", gr2: "ਸ਼ੁਭ ਸੁਬਹ", gr3: "ਸ਼ਾਮ ਵਧੀਆ", gr4: "ਸ਼ੁਭ ਰਾਤ",
    // No / refusal
    nf1: "ਨਹੀਂ ਜੀ, ਸ਼ੁਕਰੀਆ", nf2: "ਕਦੇ ਫਿਰ", nf3: "ਅੱਜ ਨਹੀਂ ਜੀ", nf6: "ਸੋਚ ਕੇ ਦੱਸਾਂਗਾ",
    // Phone
    ph1: "ਹੈਲੋ ਜੀ",
    // Classroom
    cr1: "ਖੋਲ੍ਹ ਲਉ ਕਿਤਾਬ", cr2: "ਲਿਖ ਲਉ", cr3: "ਸੁਣੋ ਤੇ ਦੁਹਰਾਉ", cr4: "ਸਵਾਲ ਪੁੱਛੋ", cr7: "ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    // Emergency
    em2: "ਡਾਕਟਰ ਬੁਲਾਉ", em4: "ਪੁਲਿਸ ਬੁਲਾਉ", em5: "ਮੈਨੂੰ ਚੋਟ ਲੱਗੀ",
    // Idioms
    id4: "ਹੱਥ ਜੋੜਨ", id5: "ਪੈਰ ਪਕੜਨੇ", id6: "ਅੱਖਾਂ ਵਿੱਚ ਪਾਣੀ",
    id8: "ਆਪਣੀ-ਆਪਣੀ ਢੋਲ", id9: "ਮੂੰਹ ਨੂੰ ਲਗਾਮ",
    // Imperatives
    im5: "ਮਿਹਰਬਾਨੀ ਕਰਕੇ ___", im6: "ਕਿਰਪਾ ਕਰਕੇ ___",
    cd6: "ਹੋ ਸਕਦਾ ਹੈ",
    // Restaurant
    rs7: "ਤਿੱਖਾ ਨਹੀਂ ਚਾਹੀਦਾ", rs8: "ਬਿੱਲ ਲਿਆਉ ਜੀ", rs10: "ਪਾਣੀ ਲਿਆ ਦਿਉ",
    // Bargaining
    bg2: "ਬਹੁਤ ਜ਼ਿਆਦਾ ਹੈ", bg3: "ਘੱਟ ਕਰੋ", bg4: "ਆਖਰੀ ਕੀਮਤ", bg7: "ਰਹਿ ਦਿਉ",
    // Doctor visit
    dv6: "ਮੈਨੂੰ ___ ਹੈ", dv7: "ਗਹਿਰੀ ਸਾਹ ਲਉ", dv8: "ਟੈਸਟ ਕਰਾਉਣਾ ਪੈਂਦਾ ਹੈ",
    dv9: "ਆਰਾਮ ਕਰੋ", dv10: "ਠੀਕ ਹੋ ਜਾਉਗੇ",
    // Travel extras
    tv2: "ਗੱਡੀ ਨੰਬਰ",
    // Diaspora extras
    ds5: "ਕਾਲ ਬੈਕ ਕਰਾਂਗਾ", ds6: "ਡਰੌਪ ਕਰ ਦਿਉ", ds7: "ਅੱਪਡੇਟ ਕਰ ਦਿਉ",
    // Colors
    co8: "ਬੈਂਗਣੀ", co10: "ਸਲੇਟੀ", co11: "ਸੁਨਹਿਰੀ",
    // Sizes / shapes
    sz1: "ਗੋਲ", sz2: "ਚੌਕੋਰ", sz3: "ਤਿਕੋਨਾ", sz4: "ਲੰਮਾ", sz5: "ਚੌੜਾ", sz6: "ਪਤਲਾ", sz7: "ਮੋਟਾ",
    // Taste / texture
    tx1: "ਮਿੱਠਾ", tx2: "ਨਮਕੀਨ", tx3: "ਖੱਟਾ", tx4: "ਕੌੜਾ", tx5: "ਤਿੱਖਾ", tx6: "ਫਿੱਕਾ",
    tx7: "ਨਰਮ", tx8: "ਸਖ਼ਤ", tx9: "ਗਿੱਲਾ", tx10: "ਸੁੱਕਾ", tx11: "ਚਿਕਨਾ", tx12: "ਖੁਰਦਰਾ",
    // Senses / sounds
    sn1: "ਖ਼ੁਸ਼ਬੂ", sn2: "ਬਦਬੂ", sn3: "ਆਵਾਜ਼", sn4: "ਸ਼ੋਰ", sn5: "ਚਮਕ", sn6: "ਧੁੰਦਲਾ",
    // Frequency adverbs
    fa1: "ਹਮੇਸ਼ਾ", fa2: "ਅਕਸਰ", fa3: "ਕਦੇ-ਕਦੇ", fa4: "ਕਦੇ ਨਹੀਂ",
    fa5: "ਰੋਜ਼", fa6: "ਹਰ ਵੇਲੇ", fa8: "ਫ਼ੌਰਨ",
    // Manner adverbs
    ma1: "ਛੇਤੀ", ma3: "ਧਿਆਨ ਨਾਲ", ma4: "ਏਂਜ", ma5: "ਏਂਵੇਂ", ma6: "ਆਸਾਨੀ ਨਾਲ", ma7: "ਮੁਸ਼ਕਿਲ ਨਾਲ",
    // Measure words
    mw1: "ਕਿਲੋ", mw3: "ਲੀਟਰ", mw5: "ਫੁੱਟ", mw6: "ਡੱਬਾ", mw8: "ਜੋੜੀ", mw9: "ਦੋ-ਦੋ", mw10: "ਦਰਜਨ",
    // Vessels / containers
    vs1: "ਕਟੋਰਾ", vs2: "ਥਾਲੀ", vs3: "ਲੋਟਾ", vs5: "ਝੋਲਾ", vs6: "ਪੇਟੀ", vs7: "ਟੋਕਰੀ", vs8: "ਬਾਲਟੀ",
    // Body extras
    bx4: "ਅੰਗੂਠਾ", bx5: "ਨਹੁੰ", bx7: "ਦਾੜ੍ਹੀ", bx8: "ਮੁੱਛਾਂ", bx9: "ਕੰਧਾ", bx10: "ਛਾਤੀ",
    // Hygiene
    hg1: "ਗ਼ੁਸਲਖਾਨਾ", hg2: "ਪਖਾਨਾ", hg3: "ਸਾਬਣ", hg4: "ਬਰੁਸ਼", hg5: "ਮੰਜਨ", hg6: "ਤੌਲੀਆ", hg8: "ਕੰਘੀ",
    // Speech verbs
    sv4: "ਸਮਝਾਉਣਾ", sv6: "ਜਵਾਬ ਦੇਣਾ", sv7: "ਸੁਣਨਾ", sv8: "ਚੁੱਪ ਕਰਨਾ",
    // Body / motion verbs
    bv23: "ਚੱਲਣਾ", bv25: "ਲੇਟਣਾ", bv26: "ਝੁਕਣਾ", bv27: "ਉਠਾਉਣਾ",
    bv28: "ਸੁੱਟਣਾ", bv29: "ਫੜਨਾ", bv30: "ਹਿਲਾਉਣਾ",
    // Emotion verbs
    ev3: "ਮੁਸਕਰਾਉਣਾ", ev4: "ਚਿੱਲਾਉਣਾ", ev5: "ਘਬਰਾਉਣਾ", ev6: "ਸ਼ਰਮਾਉਣਾ", ev7: "ਪਿਆਰ ਕਰਨਾ",
    // Public places
    pp3: "ਡਾਕ ਘਰ", pp4: "ਪੈਟਰੋਲ ਪੰਪ", pp5: "ਏ ਟੀ ਐਮ",
    pp6: "ਥਾਣਾ", pp7: "ਕੋਰਟ", pp9: "ਸਿਨੇਮਾ", pp10: "ਮਾਲ",
    // Home interior
    hi1: "ਛੱਤ", hi2: "ਦੀਵਾਰ", hi3: "ਫ਼ਰਸ਼", hi5: "ਬੈਠਕ",
    hi6: "ਸੌਣ ਵਾਲਾ ਕਮਰਾ", hi7: "ਅਲਮਾਰੀ", hi8: "ਪਰਦਾ",
    // Digital extras
    dg1: "ਵਾਈ-ਫ਼ਾਈ", dg3: "ਲਿੰਕ", dg4: "ਓ ਟੀ ਪੀ", dg5: "ਅਕਾਊਂਟ", dg9: "ਗਰੁੱਪ", dg10: "ਸ਼ੇਅਰ ਕਰਨਾ",
    // Greetings extras
    gx1: "ਨਮਸਤੇ ਜੀ", gx2: "ਰਾਮ ਰਾਮ", gx3: "ਅਦਾਬ", gx4: "ਸਲਾਮ", gx5: "ਅਲਵਿਦਾ",
    // Yes/no extras
    yn3: "ਬਿਲਕੁਲ", yn4: "ਇਕਦਮ", yn5: "ਗ਼ਲਤ", yn6: "ਪੱਕਾ", yn7: "ਮੁਸ਼ਕਿਲ", yn8: "ਆਸਾਨ",
    // Compliments
    cm2: "ਮੁਬਾਰਕ ਹੋ", cm4: "ਬਹੁਤ ਖ਼ੂਬ", cm7: "ਤੁਹਾਡਾ ਜਵਾਬ ਨਹੀਂ",
    // Agreement / thanks
    ag3: "ਬਹੁਤ ਸ਼ੁਕਰੀਆ", ag6: "ਤੁਹਾਡਾ ਅਹਿਸਾਨ",
    // Learning meta
    lm6: "ਸਪੈਲਿੰਗ ਦੱਸੋ ਜੀ", lm10: "ਸਿਖਾਉਣਾ ਸ਼ੁਰੂ ਕਰਾਂਗੇ",
    // Sentence-level coverage (audit pass)
    hp1: "ਖਾਣਾ ਖਾ ਕੇ ਜਾਣਾ", hp3: "ਬਸ ਜੀ, ਬਹੁਤ ਹੋ ਗਿਆ", hp5: "ਮਹਿਮਾਨ ਰੱਬ ਦਾ ਰੂਪ",
    p31: "ਤੁਹਾਨੂੰ ਤਕਲੀਫ਼ ਨਹੀਂ?", p33: "ਤੁਹਾਡਾ ਬਹੁਤ ਬਹੁਤ ਸ਼ੁਕਰੀਆ",
    p34: "ਮਿਹਰਬਾਨੀ ਕਰਕੇ ਇੱਕ ਮਿੰਟ", p37: "ਮੈਨੂੰ ਤੁਹਾਡੇ ਨਾਲ ਗੱਲ ਕਰਨੀ ਹੈ",
    p38: "ਸੁਣ ਰਹੇ ਹੋ?", p39: "ਮੈਨੂੰ ਸਮਝ ਆ ਗਈ",
    p40: "ਕੀ ਮੈਂ ਪੁੱਛ ਸਕਦਾ ਹਾਂ?", p41: "ਤੁਹਾਡੀ ਗੱਲ ਠੀਕ ਹੈ",
    tr10: "ਇਹ ਕਿੱਥੇ ਹੈ?",
    sb3: "ਮੈਨੂੰ ___ ਚਾਹੀਦਾ ਹੈ", sb4: "ਮੈਨੂੰ ___ ਪਸੰਦ ਹੈ",
    sb5: "ਮੈਂ ___ ਜਾ ਰਿਹਾ ਹਾਂ", sb6: "ਤੁਹਾਨੂੰ ___ ਆਉਂਦਾ ਹੈ?",
    sb7: "ਮੈਨੂੰ ___ ਆਉਂਦਾ ਹੈ", sb8: "ਕੀ ਤੁਸੀਂ ___ ਸਕਦੇ ਹੋ?",
    lv1: "ਤੁਹਾਡਾ ਕੰਮ ਕੀ ਹੈ?", lv2: "ਤੁਸੀਂ ਕਿੱਥੇ ਰਹਿੰਦੇ ਹੋ?",
    lv3: "ਤੁਹਾਡੀ ਉਮਰ ਕਿੰਨੀ ਹੈ?", lv4: "ਤੁਹਾਡੇ ਕਿੰਨੇ ਭੈਣ-ਭਰਾ ਹਨ?",
    lv5: "ਤੁਹਾਨੂੰ ਕੀ ਪਸੰਦ ਹੈ?", lv6: "ਮੈਨੂੰ ਪੰਜਾਬੀ ਸਿੱਖਣੀ ਹੈ",
    lv7: "ਮੈਨੂੰ ਥੋੜੀ-ਥੋੜੀ ਪੰਜਾਬੀ ਆਉਂਦੀ ਹੈ", lv9: "ਇਹ ਪੰਜਾਬੀ ਵਿੱਚ ਕੀ ਕਹਿੰਦੇ ਹਨ?",
    sh1: "ਇਹ ਕਿੰਨੇ ਦਾ ਹੈ?", sh3: "ਮੈਨੂੰ ਇਹ ਚਾਹੀਦਾ ਹੈ",
    sh4: "ਬਸ, ਹੋਰ ਨਹੀਂ ਚਾਹੀਦਾ", sh5: "ਪੈਸਾ ਕਿੱਥੇ ਦੇਈਏ?",
    en4: "ਤੂੰ ਕਰ ਸਕਦਾ ਹੈ",
    md1: "ਏ: ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਜੀ। ਬੀ: ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਕੀ ਹਾਲ ਹੈ?",
    md2: "ਏ: ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ? ਬੀ: ਮੇਰਾ ਨਾਮ ___ ਹੈ। ਤੁਹਾਡਾ?",
    md3: "ਏ: ਚਾਹ ਪੀਉਗੇ? ਬੀ: ਬਸ ਥੋੜੀ ਜੀ, ਸ਼ੁਕਰੀਆ।",
    md4: "ਏ: ਇਹ ਕਿੰਨੇ ਦਾ ਹੈ? ਬੀ: ਸੌ ਰੁਪਏ। ਏ: ਥੋੜਾ ਘੱਟ ਕਰੋ। ਬੀ: ਅੱਛਾ, ਅੱਸੀ।",
    md5: "ਏ: ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਈ। ਬੀ: ਕੋਈ ਗੱਲ ਨਹੀਂ, ਫਿਰ ਕਹਿੰਦਾ ਹਾਂ ਹੌਲੇ।",
    tm10: "ਕਿੰਨੇ ਵਜੇ ਹਨ?",
    qp1: "ਕੀ ___ ਹੈ?", qp2: "ਕਿੱਥੇ ___?", qp3: "ਕਿਸ ਵੇਲੇ?",
    qp5: "ਕਿੱਥੋਂ ਆਏ ਹੋ?", qp6: "ਕੀ ਕਰ ਰਹੇ ਹੋ?",
    gr5: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ — ਹਰ ਵੇਲੇ",
    nf4: "ਬਹੁਤ ਸ਼ੁਕਰੀਆ, ਪਰ ਬਸ", nf5: "ਮੈਨੂੰ ਮਾਫ਼ ਕਰੋ, ਮੈਂ ਨਹੀਂ ਕਰ ਸਕਦਾ",
    ph2: "ਕੌਣ ਬੋਲ ਰਿਹਾ ਹੈ?", ph3: "ਰਵੀ ਨਾਲ ਗੱਲ ਕਰਾਉਣੀ ਹੈ",
    ph4: "ਇੱਕ ਮਿੰਟ ਹੋਲਡ ਕਰੋ", ph5: "ਬਾਅਦ ਵਿੱਚ ਫ਼ੋਨ ਕਰਾਂਗਾ",
    ph6: "ਆਵਾਜ਼ ਨਹੀਂ ਆ ਰਹੀ",
    cr5: "ਠੀਕ ਹੈ?", cr6: "ਸਮਝ ਆਈ?", cr8: "ਬਹੁਤ ਵਧੀਆ!",
    em1: "ਮਦਦ!", em3: "ਅੱਗ ਲੱਗੀ ਹੈ!", em6: "ਹਸਪਤਾਲ ਕਿੱਥੇ ਹੈ?",
    em7: "ਮੈਨੂੰ ਡਰ ਲੱਗਦਾ ਹੈ", em8: "ਸੰਭਾਲ ਕੇ!",
    id1: "ਮਿਹਨਤ ਦਾ ਫਲ ਮਿੱਠਾ", id2: "ਸੁਖ ਵੇਲੇ ਰੱਬ ਯਾਦ",
    id3: "ਨਾਮ ਵੱਡਾ, ਦਰਸ਼ਨ ਛੋਟੇ", id7: "ਦਿਲ ਤੇ ਹੱਥ ਰੱਖਕੇ",
    id10: "ਚੜ੍ਹਦੀ ਕਲਾ ਵਿੱਚ ਰਹੇ",
    rs5: "ਇੱਕ ਪਲੇਟ ___ ਮਿਲ ਸਕਦੀ?", rs6: "ਇਹ ਕਿਸ ਦਾ ਸੁਆਦ ਹੈ?",
    rs9: "ਖਾਣਾ ਬਹੁਤ ਵਧੀਆ ਸੀ",
    bg1: "ਕਿੰਨੇ ਦਾ?", bg5: "ਹੋਰ ਸਸਤਾ ਨਹੀਂ?",
    bg6: "ਠੀਕ ਹੈ, ਲੈ ਲਾਂਗਾ", bg8: "ਪੱਕਾ ਰੇਟ ਕੀ?",
    dv1: "ਕੀ ਤਕਲੀਫ਼ ਹੈ?", dv2: "ਕਦੋਂ ਤੋਂ?", dv5: "ਦਰਦ ਕਿੱਥੇ ਹੈ?",
    tv4: "ਕਿੱਥੋਂ ਚੱਲਦੀ ਹੈ?", tv5: "ਕਿੰਨੇ ਵਜੇ ਚੱਲਦੀ?",
    tv6: "ਕਿੰਨਾ ਟਾਈਮ ਲੱਗੇਗਾ?", tv7: "ਇਹ ਸੀਟ ਖ਼ਾਲੀ ਹੈ?",
    tv8: "ਮੈਨੂੰ ___ ਜਾਣਾ ਹੈ", tv10: "ਆਖ਼ਰੀ ਸਟਾਪ ਕਿੱਥੇ?",
    dn1: "ਮੈਂ ਸਵੇਰੇ ਛੇ ਵਜੇ ਉੱਠਦਾ ਹਾਂ।",
    dn2: "ਫਿਰ ਮੂੰਹ ਧੋ ਕੇ ਚਾਹ ਪੀਂਦਾ ਹਾਂ।",
    dn3: "ਨਾਸ਼ਤਾ ਕਰਕੇ ਕੰਮ ਤੇ ਜਾਂਦਾ ਹਾਂ।",
    dn4: "ਦੁਪਹਿਰੇ ਬਾਰਾਂ ਵਜੇ ਖਾਣਾ ਖਾਂਦਾ ਹਾਂ।",
    dn5: "ਸ਼ਾਮ ਨੂੰ ਦੋਸਤਾਂ ਨਾਲ ਮਿਲਦਾ ਹਾਂ।",
    dn6: "ਰਾਤ ਨੂੰ ਖਾਣਾ ਖਾਕੇ ਟੀਵੀ ਵੇਖਦਾ ਹਾਂ।",
    dn7: "ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ ਕਿਤਾਬ ਪੜ੍ਹਦਾ ਹਾਂ।",
    dn8: "ਏਂਜ ਮੇਰਾ ਇੱਕ ਦਿਨ ਖ਼ਤਮ ਹੋ ਜਾਂਦਾ ਹੈ।",
    gx7: "ਜਲਦੀ ਮਿਲਣ ਦੀ ਉਮੀਦ",
    cm3: "ਕਮਾਲ!", cm5: "ਦਿਲ ਖ਼ੁਸ਼ ਹੋ ਗਿਆ", cm6: "ਕਿਆ ਬਾਤ!",
    lm5: "ਇਹ ਸ਼ਬਦ ਦਾ ਮਤਲਬ ਕੀ?",
    lm7: "ਗ਼ਲਤੀ ਹੋ ਗਈ ਤਾਂ ਠੀਕ ਕਰੋ",
    lm8: "ਮੈਨੂੰ ਥੋੜਾ ਥੋੜਾ ਪੰਜਾਬੀ ਆਉਂਦੀ ਹੈ",
    lm9: "ਤੁਹਾਡੀ ਮਦਦ ਚਾਹੀਦੀ ਹੈ",
    // Religion proper nouns repeats already covered above

    // Health & wellness expansion
    hw1: "ਖੰਘ", hw2: "ਛਿੱਕ", hw3: "ਦਰਦ", hw4: "ਸਿਰ-ਦਰਦ", hw5: "ਪੇਟ-ਦਰਦ",
    hw6: "ਉਲਟੀ", hw7: "ਦਸਤ", hw8: "ਚੱਕਰ", hw9: "ਕਮਜ਼ੋਰੀ", hw10: "ਐਲਰਜੀ",
    hw11: "ਖੁਜਲੀ", hw12: "ਚਮੜੀ", hw13: "ਫੇਫੜੇ", hw14: "ਗੁਰਦਾ", hw15: "ਜਿਗਰ",
    hw16: "ਸਾਹ", hw17: "ਨੀਂਦ", hw18: "ਆਰਾਮ", hw19: "ਯੋਗ", hw20: "ਧਿਆਨ",
    hw21: "ਕਸਰਤ", hw22: "ਸਿਹਤ", hw23: "ਤੰਦਰੁਸਤੀ", hw24: "ਖੁਰਾਕ", hw25: "ਪਾਣੀ-ਭਰੇ",
    hw26: "ਤਣਾਅ", hw27: "ਚਿੰਤਾ", hw28: "ਗੋਲੀ", hw29: "ਸ਼ਰਬਤ", hw30: "ਨੁਸਖਾ",
    hwp1: "ਮੇਰੇ ਸਿਰ ਚ ਦਰਦ ਹੈ",
    hwp2: "ਕਿੰਨਾ ਚਿਰ ਤੋਂ ਦਰਦ ਹੈ?",
    hwp3: "ਖਾਣੇ ਬਾਅਦ ਦਵਾਈ ਲਾਓ",
    hwp4: "ਬਹੁਤ ਪਾਣੀ ਪੀਓ",
    hwp5: "ਮੈਨੂੰ ਆਰਾਮ ਦੀ ਲੋੜ ਹੈ",
    hwp6: "ਅੱਜ ਮੈਨੂੰ ਚੰਗਾ ਲੱਗ ਰਿਹਾ ਹੈ",
    hwp7: "ਐਂਬੂਲੈਂਸ ਬੁਲਾਓ!",
    hwp8: "ਮੈਨੂੰ ਮੂੰਗਫਲੀ ਤੋਂ ਐਲਰਜੀ ਹੈ",
    hwp9: "ਬੁਖਾਰ ਉਤਰ ਗਿਆ",
    hwp10: "ਡਾਕਟਰ ਨਾਲ ਮਿਲਣੀ ਲੈਣੀ ਹੈ",
    hwp11: "ਖੂਨ ਦੀ ਜਾਂਚ ਕਰਵਾਉਣੀ ਹੈ",
    hwp12: "ਸ਼ੂਗਰ ਨਾਰਮਲ ਹੈ",
    hwp13: "ਲੰਬੀ ਸਾਹ ਲਾਓ",
    hwp14: "ਰੋਜ਼ ਸੈਰ ਕਰੋ",
    hwp15: "ਤਿੱਖਾ ਨਾ ਖਾਓ",
    hwp16: "ਹਸਪਤਾਲ ਲੈ ਚਲੋ",
    hwp17: "ਤਬੀਅਤ ਢਿੱਲੀ ਹੈ",
    hwp18: "ਯੋਗ ਕਰਨਾ ਸ਼ੁਰੂ ਕਰੋ",
    hwp19: "ਧਿਆਨ ਨਾਲ ਸਿਹਤ ਚੰਗੀ ਰਹਿੰਦੀ ਹੈ",
    hwp20: "ਆਪਣਾ ਖਿਆਲ ਰੱਖੋ",
    hwd1: "ਕੀ ਤਕਲੀਫ ਹੈ? / ਸਿਰ-ਦਰਦ ਤੇ ਬੁਖਾਰ।",
    hwd2: "ਇਹ ਗੋਲੀ ਦਿਨ ਚ ਤਿੰਨ ਵਾਰ ਲਾਓ, ਖਾਣੇ ਬਾਅਦ।",
    hwd3: "ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ? / ਹੁਣ ਪਹਿਲਾਂ ਤੋਂ ਚੰਗੇ।",
    hwd4: "ਸਾਹ ਅੰਦਰ, ਹੱਥ ਉੱਪਰ — ਬਾਹਰ, ਹੱਥ ਨੀਚੇ।",
    hwd5: "ਖਾਣਾ ਖਾ ਕੇ ਗੋਲੀ ਲਾਓ, ਤੇ ਜਲਦੀ ਸੌਂ ਜਾਓ।",

    // Hospitality expansion
    hs1: "ਮਹਿਮਾਨ", hs2: "ਸਵਾਗਤ", hs3: "ਥਾਲੀ", hs4: "ਪਤੀਲਾ", hs5: "ਤੋਹਫਾ",
    hs6: "ਸ਼ਗਨ", hs7: "ਆਸ਼ੀਰਵਾਦ", hs8: "ਮਿਠਾਈ", hs9: "ਹਾਰ", hs10: "ਬਰਾਂਡੇ",
    hs11: "ਬੈਠਕ", hs12: "ਦਰਵਾਜ਼ਾ", hs13: "ਜੁੱਤੀ", hs14: "ਸ਼ਾਲ", hs15: "ਦਾਵਤ",
    hs16: "ਰਸੋਈ", hs17: "ਪਰੋਸਣਾ", hs18: "ਮੂੰਹ-ਮਿੱਠਾ", hs19: "ਲੰਗਰ", hs20: "ਫੁੱਲ",
    hsp1: "ਅੰਦਰ ਆਓ ਜੀ, ਜੁੱਤੀ ਲਾਹੋ",
    hsp2: "ਕੁਝ ਖਾ ਕੇ ਜਾਓ",
    hsp3: "ਰਾਤ ਦੇ ਖਾਣੇ ਤੇ ਰੁਕੋ",
    hsp4: "ਬੱਚੇ ਨੂੰ ਅਗਲੀ ਵਾਰ ਲਾਓ",
    hsp5: "ਬਹੁਤ ਚਿਰ ਬਾਅਦ ਮਿਲੇ",
    hsp6: "ਘਰ ਆਪਣਾ ਸਮਝੋ",
    hsp7: "ਚਾਹ ਤੇ ਛੋਲੇ ਲੈ ਕੇ ਆਓ",
    hsp8: "ਮਿਠਾਈ ਖਾਓ, ਮੂੰਹ ਮਿੱਠਾ ਕਰੋ",
    hsp9: "ਅੱਜ ਰਹਿਣ ਦਿਓ, ਕੱਲ ਆਉਣਾ",
    hsp10: "ਤੁਸੀਂ ਤਕਲੀਫ ਨਾ ਕਰੋ",
    hsp11: "ਹੋਰ ਲਾਓ ਜੀ, ਸ਼ਰਮਾਓ ਨਾ",
    hsp12: "ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
    hsp13: "ਫਿਰ ਕਦੋਂ ਆਓਗੇ?",
    hsp14: "ਜਾਂਦੇ ਹੋਏ ਸ਼ਗਨ ਲਾਓ",
    hsp15: "ਸੁਖੀ ਰਹੋ, ਵੱਸੀ ਰਹੋ",
    hsp16: "ਜਲਦੀ ਫਿਰ ਮਿਲਾਂਗੇ",
    hsp17: "ਲੰਗਰ ਛਕ ਕੇ ਜਾਣਾ",
    hsp18: "ਸ਼ਾਮ ਦੇ ਚਾਹ ਤੇ ਆਓ",
    hsp19: "ਇਹ ਛੋਟਾ ਤੋਹਫਾ ਕਬੂਲ ਕਰੋ",
    hsp20: "ਘਰ ਜ਼ਰੂਰ ਆਉਣਾ",
    hsd1: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! / ਆਓ ਜੀ, ਅੰਦਰ ਤਸ਼ਰੀਫ ਰੱਖੋ।",
    hsd2: "ਹੋਰ ਇੱਕ ਰੋਟੀ ਲਾਓ। / ਬਸ ਜੀ, ਬਹੁਤ ਹੋ ਗਈ।",
    hsd3: "ਸੁਖੀ ਰਹੋ ਪੁੱਤ। / ਤੁਹਾਡੇ ਆਸ਼ੀਰਵਾਦ ਚਾਹੀਦੇ ਨੇ।",
    hsd4: "ਮਿਠਾਈ ਖਾਓ। / ਸ਼ੁਕਰੀਆ ਆਂਟੀ ਜੀ!",
    hsd5: "ਫਿਰ ਕਦੋਂ ਆਓਗੇ? / ਅਗਲੇ ਸੰਡੇ ਪੱਕਾ।",

    // Business conversations expansion
    bz1: "ਕਲਾਇੰਟ", bz2: "ਕਸਟਮਰ", bz3: "ਡੀਲ", bz4: "ਕਰਾਰ", bz5: "ਤਜਵੀਜ਼",
    bz6: "ਡੈੱਡਲਾਈਨ", bz7: "ਬਿੱਲ", bz8: "ਪਾਰਟਨਰ", bz9: "ਸਪਲਾਇਰ", bz10: "ਰੇਟ",
    bz11: "ਡਿਸਕਾਊਂਟ", bz12: "ਜੀ.ਐੱਸ.ਟੀ.", bz13: "ਦਸਤਖਤ", bz14: "ਮੋਹਰ", bz15: "ਦਲਾਲੀ",
    bz16: "ਮੀਟਿੰਗ", bz17: "ਆਫਿਸ", bz18: "ਈਮੇਲ", bz19: "ਪੇਮੈਂਟ", bz20: "ਮਾਲ",
    bzp1: "ਆਓ ਮੀਟਿੰਗ ਸੈੱਟ ਕਰ ਲਈਏ",
    bzp2: "ਰੇਟ ਤੇ ਥੋੜੀ ਗੱਲਬਾਤ ਕਰਨੀ ਹੈ",
    bzp3: "ਕੱਲ ਤਕਰੀਬਨ ਤਜਵੀਜ਼ ਭੇਜ ਦੇਵਾਂਗਾ",
    bzp4: "ਈਮੇਲ ਤੇ ਕਨਫਰਮ ਕਰੋ ਜੀ",
    bzp5: "ਤੁਹਾਡੇ ਨਾਲ ਕੰਮ ਕਰਕੇ ਖੁਸ਼ੀ ਹੋਈ",
    bzp6: "ਬਲਕ ਤੇ ਡਿਸਕਾਊਂਟ ਮਿਲ ਸਕਦਾ ਹੈ",
    bzp7: "ਦੇਰ ਲਈ ਮੁਆਫੀ",
    bzp8: "ਆਪਣੇ ਕੁਲੀਗ ਨੂੰ ਲੂਪ ਚ ਲਿਆਉਂਦਾ ਹਾਂ",
    bzp9: "ਬਿੱਲ ਭੇਜ ਦਿਓ ਅੱਜ ਹੀ",
    bzp10: "ਪੇਮੈਂਟ ਕੱਲ ਤਕਰੀਬਨ ਆ ਜਾਏਗੀ",
    bzp11: "ਇਹ ਸਾਡੇ ਰੇਟ ਨੇ, ਜੀ",
    bzp12: "ਪਹਿਲਾਂ ਥੋੜੀ ਐਡਵਾਂਸ ਦੇਣੀ ਪਏਗੀ",
    bzp13: "ਮਾਲ ਕੱਲ ਤਕਰੀਬਨ ਪਹੁੰਚ ਜਾਏਗਾ",
    bzp14: "ਕੁਆਲਿਟੀ ਦੀ ਗਾਰੰਟੀ ਹੈ ਸਾਡੀ",
    bzp15: "ਦਸਤਖਤ ਇੱਥੇ ਕਰੋ",
    bzp16: "ਬੌਸ ਨਾਲ ਪੁੱਛ ਕੇ ਦੱਸਾਂਗਾ",
    bzp17: "ਇਹ ਸਾਡੀ ਬੈਸਟ ਆਫਰ ਹੈ",
    bzp18: "ਅਗਲੀ ਕੁਆਰਟਰ ਚ ਮਿਲਾਂਗੇ",
    bzp19: "ਕਰਾਰ ਦੀ ਕਾਪੀ ਭੇਜ ਦਿਓ",
    bzp20: "ਵੈਂਡਰ ਨਾਲ ਪ੍ਰਾਈਸ ਲੌਕ ਹੋ ਗਈ",
    bzp21: "ਕਸਟਮਰ ਦੀ ਫੀਡਬੈਕ ਚਾਹੀਦੀ ਹੈ",
    bzp22: "ਇਹ ਸਾਡੀ ਜੀ.ਐੱਸ.ਟੀ. ਦੇ ਨਾਲ ਰੇਟ ਹੈ",
    bzp23: "ਡਿਸਕਾਊਂਟ ਤੋਂ ਬਾਅਦ ਫਾਈਨਲ ਪ੍ਰਾਈਸ ਦੱਸ ਦਿਓ",
    bzp24: "ਸਾਡੀ ਟੀਮ ਕੰਮ ਸ਼ੁਰੂ ਕਰ ਦੇਊਗੀ",
    bzp25: "ਤੁਹਾਡਾ ਬਿਜ਼ਨਸ ਸਾਡੇ ਨਾਲ ਪਹਿਲੀ ਵਾਰ?",
    bzd1: "ਸਾਡੇ ਪ੍ਰੋਡਕਟ ਦੀ ਡੈਮੋ ਲੈ ਲਾਓ। / ਹਾਂਜੀ, ਟਾਈਮ ਸੈੱਟ ਕਰੋ।",
    bzd2: "ਡਿਲੀਵਰੀ ਜਲਦੀ ਕਰਵਾਓ। / ਤਿੰਨ ਦਿਨ ਚ ਮਾਲ ਪਹੁੰਚ ਜਾਏਗਾ।",
    bzd3: "ਇਹ ਸਾਡੀ ਬੈਸਟ ਰੇਟ ਹੈ। / ਠੀਕ ਹੈ, ਡੀਲ ਪੱਕੀ।",
    bzd4: "ਸਰ, ਇਹ ਇਸ਼ੂ ਹੈ। / ਮੈਨੂੰ ਡੀਟੇਲ ਈਮੇਲ ਕਰੋ, ਮੈਂ ਕਲਾਇੰਟ ਨਾਲ ਗੱਲ ਕਰਦਾ ਹਾਂ।",
    bzd5: "ਬਿੱਲ ਦਾ ਕੀ ਸਟੇਟਸ ਹੈ? / ਕੱਲ ਤਕਰੀਬਨ ਪੇਮੈਂਟ ਰਿਲੀਜ਼ ਹੋ ਜਾਏਗੀ।",
  };

  // Words/phrases that don't yet have a Gurmukhi mapping above will fall back
  // to the romanized text (imperfect; Google's pa TTS will best-effort it).
  function gurmukhiFor(card) {
    if (!card) return "";
    // Skip Gurmukhi for grammar rule entries whose `punjabi` field is a
    // descriptive label (often contains slashes or English-style names).
    if (card.type === "grammar" && !GURMUKHI[card.id] && !card.gurmukhi) return "";
    return card.gurmukhi || GURMUKHI[card.id] || "";
  }

  // ---------- Punjabi rendering helpers --------------------------------------
  // We display Punjabi as Gurmukhi on top, romanized below. When no Gurmukhi
  // mapping exists we fall back to roman-only so layout is never empty.
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  /** Build the Punjabi cell HTML (Gurmukhi over roman). */
  function punjabiHtml(card) {
    if (!card) return "";
    const gm = gurmukhiFor(card);
    const rom = card.punjabi || "";
    if (gm && rom && gm !== rom) {
      return `<span class="gm" lang="pa-Guru">${escapeHtml(gm)}</span>` +
             `<span class="rom">${escapeHtml(rom)}</span>`;
    }
    // Roman-only fallback — keep the .rom class so spacing stays consistent.
    return `<span class="rom solo">${escapeHtml(gm || rom)}</span>`;
  }
  function renderPunjabi(el, card) {
    if (!el) return;
    el.innerHTML = punjabiHtml(card);
  }
  /** True when the user's chosen direction means Punjabi is the ANSWER
   *  (i.e. English is the prompt). Default = "en2pa". */
  function isReverse() {
    const d = state.settings && state.settings.direction;
    return (d || "en2pa") === "en2pa";
  }
  /** Apply the body[data-direction] flag so CSS can flip the train flashcard. */
  function applyDirectionAttr() {
    const d = (state.settings && state.settings.direction) || "en2pa";
    try { document.body.setAttribute("data-direction", d); } catch {}
  }

  // ---- Dev-time mapping audit (runs once, console only) ---------------------
  function auditGurmukhiMap() {
    // Dev-time mapping check; intentionally silent in production.
    try {
      DECK.filter(c => c.type !== "grammar" && !gurmukhiFor(c));
    } catch {}
  }

  const tts = {
    voice: null,         // legacy alias → Punjabi voice
    voicePunjabi: null,
    voiceEnglish: null,
    voicesReady: false,
    audio: null,         // current <audio> element (Google TTS fallback)
    utter: null,         // current SpeechSynthesisUtterance
    speakingButtons: new Set(),
    hintShown: false,
    primed: false,       // iOS Safari requires a user-gesture warm-up
  };

  // iOS Safari unlocks speechSynthesis the first time speak() is called from
  // a user gesture. We do NOT need a silent priming utterance — in fact, a
  // silent prime followed by cancel() races with the real utterance and kills
  // it. Just call speak() directly inside the user-gesture handler.
  function primeSpeech() {
    if (tts.primed) return;
    if (!("speechSynthesis" in window)) return;
    tts.primed = true;
    // Re-poll voices: iOS often returns [] until first speak in a gesture.
    setTimeout(() => { try { loadVoicesOnce(); } catch {} }, 100);
  }

  function loadVoicesOnce() {
    if (!("speechSynthesis" in window)) return;
    let attempts = 0;
    const pick = () => {
      const all = window.speechSynthesis.getVoices() || [];
      // iOS sometimes returns [] for ~1s after page load. Retry a few times.
      if (all.length === 0 && attempts < 10) {
        attempts++;
        setTimeout(pick, 250);
        return;
      }

      // ---- Generic quality scorer for Indic voices (PA + HI) --------------
      // Prefer Premium / Enhanced / Neural / Natural / Online / WaveNet over
      // the bundled "Compact" iOS voices, which sound thin and metallic.
      const indicScore = (v) => {
        const n = (v.name || "").toLowerCase();
        let s = 0;
        if (/premium|enhanced/.test(n)) s += 120;
        if (/neural|natural|online|cloud|wavenet|studio/.test(n)) s += 100;
        if (/google/.test(n)) s += 60;
        if (/microsoft/.test(n)) s += 50;
        if (/compact/.test(n)) s -= 200;        // iOS "Compact" = thin/distant
        if (/espeak|festival/.test(n)) s -= 500; // robotic
        if (v.localService) s += 8;              // tiny local-render bonus
        return s;
      };

      // Punjabi: prefer real Punjabi voice. If absent (default on iOS),
      // fall back to a Hindi voice — Hindi TTS reads Latin text using
      // Devanagari phonetics which sound very close to spoken Punjabi when
      // we feed it the roman transliteration.
      const paCandidates = all.filter(v =>
        /^pa(-|_|$)/i.test(v.lang) || /punjab/i.test(v.name || "")
      );
      paCandidates.sort((a, b) => indicScore(b) - indicScore(a));
      tts.voicePunjabi = paCandidates[0] || null;

      const hiCandidates = all.filter(v =>
        /^hi(-|_|$)/i.test(v.lang) || /hindi/i.test(v.name || "")
      );
      hiCandidates.sort((a, b) => indicScore(b) - indicScore(a));
      tts.voiceHindi = hiCandidates[0] || null;

      if (tts.voicePunjabi) {
        try { audioDbgLog("PA voice: " + tts.voicePunjabi.name + " (" + tts.voicePunjabi.lang + ")"); } catch {}
      }
      if (tts.voiceHindi) {
        try { audioDbgLog("HI voice: " + tts.voiceHindi.name + " (" + tts.voiceHindi.lang + ")"); } catch {}
      }

      // English: prefer high-quality AMERICAN MALE voices first.
      // Hard requirement on en-US locale, deep/authoritative male timbre.
      const en = all.filter(v => /^en(-|_|$)/i.test(v.lang));
      const isUS = (v) => /en[-_]us/i.test(v.lang);
      const score = (v) => {
        const n = (v.name || "").toLowerCase();
        let s = 0;

        // ---- Locale: en-US is REQUIRED to sound American ------------------
        if (isUS(v)) s += 200;
        else if (/en[-_]ca/i.test(v.lang)) s += 40;   // Canadian English ~ closest fallback
        else s -= 100;                                 // strongly avoid en-GB/AU/IE/IN

        // ---- Strong American MALE voices (top priority) -------------------
        // Microsoft Neural US males (Edge / Azure)
        if (/microsoft.*(guy|davis|tony|jason|brandon|christopher|eric|roger|steffan|brian)/.test(n)) s += 220;
        // Apple US males (macOS / iOS) — Alex/Tom/Aaron/Fred/Eddy/Reed are en-US
        if (/(alex|tom|aaron|fred|eddy|reed|rocko|grandpa|junior|albert|bruce|ralph|gordon)/.test(n)) s += 200;
        // Google US English male
        if (/google.*us english.*male/.test(n)) s += 180;
        if (/google\s+us\s+english/.test(n) && /\bmale\b/.test(n)) s += 180;
        // Generic male tag (must still be en-US to score high overall)
        if (/\bmale\b/.test(n) && !/female/.test(n)) s += 50;

        // ---- Premium / Neural / Natural quality bumps ---------------------
        if (/premium|enhanced/.test(n)) s += 90;
        if (/natural|neural|online|cloud|wavenet/.test(n)) s += 80;

        // ---- Penalties: weak / generic / female-only / non-US -------------
        if (/espeak/.test(n)) s -= 500;
        if (/^english$/.test(n)) s -= 200;
        // "Compact" iOS voices sound thin/distant — strongly penalize.
        if (/compact|eddy.*compact|fred.*compact/.test(n)) s -= 250;
        if (/novelty|whisper|bahh|bells|bubbles|cellos|deranged|hysterical|trinoids|zarvox/.test(n)) s -= 400;
        // Known British/AU/IE male names — penalize so they never beat a US voice
        if (/(daniel|oliver|arthur|karen|moira|tessa|sangeeta|veena|rishi)/.test(n)) s -= 80;

        if (v.localService) s += 8;
        return s;
      };
      en.sort((a, b) => score(b) - score(a));
      // Final guard: if the top pick somehow isn't en-US, prefer the best en-US
      // candidate even if it scores a hair lower.
      const topUS = en.find(isUS);
      tts.voiceEnglish = topUS || en[0] || null;
      if (tts.voiceEnglish) {
        try { audioDbgLog("EN voice: " + tts.voiceEnglish.name + " (" + tts.voiceEnglish.lang + ")"); } catch {}
      }
      // Back-compat: legacy single-voice slot still points to the Punjabi one.
      tts.voice = tts.voicePunjabi;
      tts.voicesReady = true;
    };
    pick();
    if (!tts.voicePunjabi || !tts.voiceEnglish) {
      try { window.speechSynthesis.onvoiceschanged = pick; } catch {}
    }
  }

  function setSpeakingUI(on) {
    for (const b of tts.speakingButtons) {
      b.classList.toggle("speaking", on);
    }
  }

  function stopSpeaking() {
    try { if (tts.audio) { tts.audio.pause(); tts.audio.src = ""; tts.audio = null; } } catch {}
    try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch {}
    setSpeakingUI(false);
  }

  function speakViaWebSpeech(text, voice, langTag) {
    if (!("speechSynthesis" in window)) return false;
    const u = new SpeechSynthesisUtterance(text);
    // Use the matched voice when we have one (gives much better quality than
    // the system default on iOS too).
    if (voice) u.voice = voice;
    u.lang = langTag || (voice && voice.lang) || "pa-IN";
    // Natural defaults. Avoid pitch != 1 on iOS — it produces a tinny/distant
    // artifact in Apple's TTS engine.
    u.rate = 1.0;
    u.pitch = 1.0;
    u.volume = 1;
    u.onstart = () => { setSpeakingUI(true); try { audioDbgLog("start: \"" + (text||"").slice(0,30) + "\" voice=" + (u.voice ? u.voice.name : "(default)") + " lang=" + u.lang); } catch {} };
    u.onend = () => { setSpeakingUI(false); try { audioDbgLog("end"); } catch {} };
    u.onerror = (e) => {
      setSpeakingUI(false);
      const errMsg = (e && (e.error || e.message)) || "unknown";
      console.warn("[PPZ TTS] utterance error:", errMsg);
      try { audioDbgLog("error: " + errMsg); } catch {}
      if (!tts._errorShown) {
        tts._errorShown = true;
        toast("Audio error: " + errMsg, 3000);
        setTimeout(() => { tts._errorShown = false; }, 5000);
      }
    };
    tts.utter = u;
    try { window.speechSynthesis.speak(u); } catch (err) {
      console.warn("[PPZ TTS] speak() threw:", err);
      return false;
    }
    return true;
  }

  function speakViaGoogle(text, lang) {
    const tl = lang === "en" ? "en" : "pa";
    // translate_tts has a ~200 char limit. Truncate defensively.
    const safeText = text.length > 190 ? text.slice(0, 190) : text;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=`
              + encodeURIComponent(safeText);
    // Do NOT set crossOrigin — Google's TTS endpoint doesn't send CORS headers.
    const a = new Audio(url);
    a.preload = "auto";
    a.onplaying = () => setSpeakingUI(true);
    a.onended = () => { setSpeakingUI(false); tts.audio = null; };
    a.onerror = (ev) => {
      setSpeakingUI(false);
      tts.audio = null;
      console.warn("[PPZ TTS] Google audio error", ev, "url:", url);
      toast(lang === "pa"
        ? "Punjabi audio failed. Install a Punjabi voice in iOS Settings → Accessibility → Spoken Content → Voices."
        : "Audio failed — check your connection.", 4000);
    };
    tts.audio = a;
    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch((err) => {
        console.warn("[PPZ TTS] audio.play() rejected:", err);
        toast("Tap the speaker again — iOS needs a fresh tap to start audio.", 3000);
      });
    }
  }

  /**
   * Speak text in the requested language.
   * @param {string|{gurmukhi?:string, roman?:string}} text
   * @param {"pa"|"en"} lang
   */
  function speakText(text, lang) {
    // Allow callers to pass either a plain string or an object with both
    // Gurmukhi script and Roman transliteration. The Hindi-voice fallback
    // needs the roman form to pronounce correctly.
    let primary = "";
    let roman = "";
    if (text && typeof text === "object") {
      primary = text.gurmukhi || text.roman || "";
      roman = text.roman || text.gurmukhi || "";
    } else {
      primary = roman = String(text || "");
    }
    if (!primary.trim()) return;
    primeSpeech();
    try {
      if ("speechSynthesis" in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    try { if (tts.audio) { tts.audio.pause(); tts.audio.src = ""; tts.audio = null; } } catch {}

    if (lang === "en") {
      const voice = tts.voiceEnglish;
      if ("speechSynthesis" in window && speakViaWebSpeech(primary, voice, "en-US")) return;
      if (navigator.onLine) speakViaGoogle(primary, "en");
      else toast("Audio needs internet (no English voice).");
      return;
    }

    // ---- Punjabi --------------------------------------------------------
    // Best: real Punjabi voice if installed.
    if (tts.voicePunjabi) {
      if (speakViaWebSpeech(primary, tts.voicePunjabi, tts.voicePunjabi.lang || "pa-IN")) return;
    }
    // Fallback A: Hindi voice reading the ROMAN transliteration.
    // iOS ships with Hindi voices ("Lekha"/"Kiran"/etc.) and Hindi TTS
    // pronounces Latin letters using Indic phonetics — sounds very close to
    // actual Punjabi when given roman text.
    if (tts.voiceHindi && roman) {
      if (speakViaWebSpeech(roman, tts.voiceHindi, tts.voiceHindi.lang || "hi-IN")) return;
    }
    // Fallback B: Web Speech with hi-IN lang only (no specific voice).
    if ("speechSynthesis" in window && roman) {
      if (speakViaWebSpeech(roman, null, "hi-IN")) return;
    }
    // Fallback C: online Google TTS as last resort.
    if (navigator.onLine) {
      speakViaGoogle(primary, "pa");
    } else {
      toast("Punjabi voice not available. Install in iOS Settings → Accessibility → Spoken Content → Voices.", 4500);
    }
  }

  /**
   * Speak a card in the appropriate language for the current direction.
   * Default speaks the ANSWER side (en2pa => Punjabi, pa2en => English).
   * Pass `opts.lang` to force a specific language (used by the front/back
   * speaker buttons so each speaker matches the face it sits on).
   */
  function speakCard(card, opts = {}) {
    if (!card) return;
    const en2pa = isReverse();
    const lang = opts.lang || (en2pa ? "pa" : "en");
    if (lang === "pa") {
      // Pass both forms so the engine can pick the best (Punjabi voice → Gurmukhi,
      // Hindi-fallback voice → Roman transliteration).
      speakText({
        gurmukhi: gurmukhiFor(card) || card.punjabi || "",
        roman:    card.punjabi || "",
      }, "pa");
    } else {
      speakText(card.english || "", "en");
    }
  }

  function maybeShowVoiceHint() {
    if (tts.hintShown) return;
    try {
      if (localStorage.getItem("ppz_tts_hint_v1")) { tts.hintShown = true; return; }
    } catch {}
    if (!tts.voice && !navigator.onLine) {
      toast("Tip: connect to the internet for Punjabi audio.", 2600);
    }
    try { localStorage.setItem("ppz_tts_hint_v1", "1"); } catch {}
    tts.hintShown = true;
  }

  // ---------- Battle feedback helpers ----------------------------------------
  // D3 — Tiny DOM particle pool. Reuses detached <span> nodes for hot-spawn
  //      effects (dmg-pop, ko-puff) to cut GC churn during long combos.
  const _particlePool = { dmg: [], ko: [] };
  function _acquireParticle(kind, baseClass) {
    const pool = _particlePool[kind];
    let el = pool && pool.pop();
    if (!el) {
      el = document.createElement("span");
    }
    el.className = baseClass;
    el.style.cssText = "";
    el.textContent = "";
    return el;
  }
  function _releaseParticle(kind, el) {
    if (!el) return;
    if (el.parentNode) el.parentNode.removeChild(el);
    el.className = "";
    el.style.cssText = "";
    el.textContent = "";
    const pool = _particlePool[kind];
    if (pool && pool.length < 24) pool.push(el);
  }

  function popDamage(combatantSel, amount, kind = "dmg") {
    const host = document.querySelector(combatantSel);
    if (!host) return;
    const el = _acquireParticle("dmg", "dmg-pop");
    if (kind === "crit") el.classList.add("crit");
    else if (kind === "heal") el.classList.add("heal");
    else if (kind === "miss") el.classList.add("miss");
    // B7 — Scale damage number by magnitude vs current player max HP. Big
    //      numbers feel bigger; misses/heals stay default.
    if (typeof amount === "number" && (kind === "dmg" || kind === "crit")) {
      const ref = (typeof battle !== "undefined" && battle && battle.playerMax) ? battle.playerMax : 100;
      const ratio = amount / ref;
      if (ratio >= 0.30) el.classList.add("huge");
      else if (ratio >= 0.15) el.classList.add("big");
    }
    el.textContent = (kind === "heal" ? "+" : kind === "miss" ? "" : "-") + amount;
    host.appendChild(el);
    setTimeout(() => _releaseParticle("dmg", el), 1100);
  }
  function flashHp(sel, kind = "hit") {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove("hit", "heal");
    void el.offsetWidth;
    el.classList.add(kind === "heal" ? "heal" : "hit");
    setTimeout(() => el.classList.remove("hit", "heal"), 500);
  }

  // B6 — HP bar ghost-drain. Snap a "ghost" fill to the previous HP%, then
  //      let CSS slide it down to match the new live width — the gap shows
  //      the chunk just lost (or gained) as a pale flash.
  //      sel: "#enemyHpFill" or "#playerHpFill" (the live fill).
  //      prevPct/newPct: 0..100.
  function ghostDrainHp(sel, prevPct, newPct, kind = "hit") {
    const ghostId = sel === "#enemyHpFill" ? "enemyHpGhost" : "playerHpGhost";
    const ghost = document.getElementById(ghostId);
    if (!ghost) return;
    const start = Math.max(0, Math.min(100, prevPct));
    const end   = Math.max(0, Math.min(100, newPct));
    ghost.classList.remove("fading", "heal");
    if (kind === "heal") ghost.classList.add("heal");
    // Snap to start without transition, then animate to end.
    const prevTransition = ghost.style.transition;
    ghost.style.transition = "none";
    ghost.style.width = start + "%";
    void ghost.offsetWidth;
    ghost.style.transition = prevTransition;
    requestAnimationFrame(() => {
      ghost.style.width = end + "%";
    });
    clearTimeout(ghostDrainHp["_t_" + ghostId]);
    ghostDrainHp["_t_" + ghostId] = setTimeout(() => {
      ghost.classList.add("fading");
    }, 700);
  }
  function flashSprite(sel, opts = {}) {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove("hit-flash", "crit-ring");
    void el.offsetWidth;
    el.classList.add("hit-flash");
    if (opts.crit) el.classList.add("crit-ring");
    setTimeout(() => el.classList.remove("hit-flash", "crit-ring"), 700);
  }
  function glowQuiz(kind) {
    const el = $(".quiz");
    if (!el) return;
    el.classList.remove("correct-glow", "wrong-glow");
    void el.offsetWidth;
    el.classList.add(kind === "correct" ? "correct-glow" : "wrong-glow");
    setTimeout(() => el.classList.remove("correct-glow", "wrong-glow"), 600);
  }
  function reanimateChoices() {
    const wrap = $("#choices");
    if (!wrap) return;
    wrap.classList.add("refresh");
    void wrap.offsetWidth;
    wrap.classList.add("run");
    setTimeout(() => wrap.classList.remove("refresh", "run"), 700);
  }
  function bumpStreakLabel() {
    const el = $("#streakLabel");
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
  function flashAnswer(kind) {
    const fl = document.getElementById("answerFlash");
    if (fl) {
      fl.classList.remove("show", "good", "bad");
      void fl.offsetWidth;
      fl.classList.add("show", kind === "correct" ? "good" : "bad");
      setTimeout(() => fl.classList.remove("show", "good", "bad"), 600);
    }
    const prompt = $("#quizPrompt");
    if (prompt) {
      prompt.classList.remove("flash-good", "flash-bad");
      void prompt.offsetWidth;
      prompt.classList.add(kind === "correct" ? "flash-good" : "flash-bad");
      setTimeout(() => prompt.classList.remove("flash-good", "flash-bad"), 550);
    }
  }

  // ---------- State / persistence --------------------------------------------
  const SAVE_KEY = "ppz_save_v1";

  function defaultSrs() {
    const m = {};
    for (const c of DECK) m[c.id] = {
      ease: SRS.EASE_START,
      interval: 0,        // days; valid in review/relearning queues
      due: 0,             // ms epoch
      mastery: 0,         // 0..100, cosmetic UI score
      seen: 0,            // total times shown
      queue: "new",      // "new" | "learning" | "review" | "relearning"
      step: 0,            // index into LEARNING_STEPS_MIN / RELEARNING_STEPS_MIN
      reps: 0,            // graduated reviews
      lapses: 0,
      lastResult: null,   // "again"|"hard"|"good"|"easy"|"battle-ok"|"battle-miss"
      lastReviewAt: 0,    // ms epoch of last training grading
      previousInterval: 0,// days; for retention analytics later
      suspended: false,   // true => excluded from training/battle picks
      firstSeenAt: 0,
    };
    return m;
  }
  function defaultReview() {
    const m = {};
    for (const c of DECK) m[c.id] = { lastSeenAt: 0, missCount: 0, lastMissAt: 0 };
    return m;
  }
  function defaultState() {
    return {
      version: 1,
      level: 1,
      xp: 0,
      totalXp: 0,
      srs: defaultSrs(),
      sessionXp: 0,
      review: defaultReview(),
      streakShield: 0,
      kiCharge: 0,
      badges: { speed: 0, recall: 0, incoming: 0 },
      battleStats: {
        wins: 0, losses: 0, runs: 0,
        bestStreak: 0, fastestKoMs: 0, perfectRuns: 0,
        bestEnemyIdx: 0, totalQuestions: 0, totalCorrect: 0, kiSpecialsUsed: 0,
        // Map of enemy template name -> times seen. Used by Focus Mode to
        // skip the pre-battle intro card after the first encounter.
        enemiesSeen: {},
      },
      settings: {
        interrupts: true, ttsAutoplay: false,
        difficulty: "normal",
        direction: "en2pa",
        battleHints: true,
        confirmRetreat: true,
        // New accounts default to Focus Mode (fewer fanfare interruptions,
        // tighter learning loop). Existing saves keep the classic feel
        // unless the player opts in via Settings.
        focusMode: true,
        // Boss-special telegraphs default ON; toggle in Settings to remove
        // the parallel "watch the charge bar" cognitive thread.
        bossSpecials: true,
        audio: { sfx: 0.7, music: 0.4, master: 1.0, muted: false },
      },
      schemaVersion: SRS.SCHEMA_VERSION,
      dailyStats: {},
      shakyCards: {},
      // Rolling list of cardIds graded in the current training session,
      // used by pickBattleCard to bias toward freshly-learned vocab.
      // Cleared automatically after LEARNING_LOOP.SESSION_GAP_MS of idle.
      session: { startedAt: 0, lastGradeAt: 0, reviewedIds: [] },
      // Recent battle misses for the post-battle "Cards to review" callout
      // and the "Train these now" handoff. Capped to BATTLE_MISS_BUFFER.
      lastBattleMisses: [],
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      // Merge to be forward-compatible if deck grows.
      const merged = {
        ...base,
        ...parsed,
        srs: { ...base.srs, ...(parsed.srs || {}) },
        review: { ...base.review, ...(parsed.review || {}) },
        badges: { ...base.badges, ...(parsed.badges || {}) },
        battleStats: { ...base.battleStats, ...(parsed.battleStats || {}) },
        settings: {
          ...base.settings,
          ...(parsed.settings || {}),
          audio: { ...base.settings.audio, ...((parsed.settings && parsed.settings.audio) || {}) },
        },
        dailyStats: { ...(parsed.dailyStats || {}) },
        shakyCards: { ...(parsed.shakyCards || {}) },
        session: parsed.session && Array.isArray(parsed.session.reviewedIds)
          ? { startedAt: parsed.session.startedAt|0, lastGradeAt: parsed.session.lastGradeAt|0,
              reviewedIds: parsed.session.reviewedIds.slice(-LEARNING_LOOP.SESSION_BUFFER) }
          : { startedAt: 0, lastGradeAt: 0, reviewedIds: [] },
        lastBattleMisses: Array.isArray(parsed.lastBattleMisses)
          ? parsed.lastBattleMisses.slice(-LEARNING_LOOP.BATTLE_MISS_BUFFER) : [],
      };
      // Preserve "Classic" experience for existing saves: Focus Mode only
      // defaults ON for accounts that have never seen the toggle. If the
      // player has any prior battle history but no focusMode field, keep
      // them on Classic (they explicitly chose nothing yet).
      if (parsed.settings && parsed.settings.focusMode === undefined) {
        const hasHistory = (parsed.battleStats && parsed.battleStats.runs > 0) ||
                           Object.values(parsed.srs || {}).some(s => s && s.seen > 0);
        merged.settings.focusMode = !hasHistory;
      }
      if (parsed.settings && parsed.settings.bossSpecials === undefined) {
        merged.settings.bossSpecials = true;
      }
      // Backfill enemiesSeen if older save lacks it.
      if (!merged.battleStats.enemiesSeen) merged.battleStats.enemiesSeen = {};
      merged.sessionXp = 0;
      // Per-card SRS migration: backfill new schema fields without losing
      // legacy progress (ease/interval/due/mastery/seen).
      for (const c of DECK) {
        const s = merged.srs[c.id] || (merged.srs[c.id] = {});
        if (s.ease == null) s.ease = SRS.EASE_START;
        if (s.interval == null) s.interval = 0;
        if (s.due == null) s.due = 0;
        if (s.mastery == null) s.mastery = 0;
        if (s.seen == null) s.seen = 0;
        if (s.reps == null) s.reps = 0;
        if (s.lapses == null) s.lapses = 0;
        if (s.step == null) s.step = 0;
        if (s.lastResult == null) s.lastResult = null;
        if (s.firstSeenAt == null) s.firstSeenAt = 0;
        if (s.lastReviewAt == null) s.lastReviewAt = 0;
        if (s.previousInterval == null) s.previousInterval = 0;
        if (s.suspended == null) s.suspended = false;
        if (!s.queue) {
          // Infer queue from legacy data: any prior interval/seen => review.
          s.queue = (s.seen > 0 || s.interval > 0) ? "review" : "new";
          if (s.queue === "review" && !s.interval) s.interval = 1;
        }
      }
      merged.schemaVersion = SRS.SCHEMA_VERSION;
      // Trim daily-stats keys older than 30 days so the save blob stays small.
      try {
        const cutoff = Date.now() - 30 * 86400_000;
        for (const k of Object.keys(merged.dailyStats)) {
          const ts = new Date(k + "T00:00:00").getTime();
          if (!isNaN(ts) && ts < cutoff) delete merged.dailyStats[k];
        }
      } catch {}
      return merged;
    } catch {
      return defaultState();
    }
  }
  function saveState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
  }
  function resetProgress() {
    state = defaultState();
    saveState();
  }

  // ---------- Utilities -------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function toast(msg, ms = 1600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), ms);
  }

  // ---- Audio Debug Panel ----------------------------------------------------
  // Triple-tap the top HUD to open. Shows voice list + every TTS event.
  const audioDbg = { lines: [], el: null, taps: 0, lastTap: 0 };
  function audioDbgLog(msg) {
    const ts = new Date().toLocaleTimeString();
    audioDbg.lines.push(`[${ts}] ${msg}`);
    if (audioDbg.lines.length > 60) audioDbg.lines.shift();
    if (audioDbg.el) {
      const log = audioDbg.el.querySelector(".dbg-log");
      if (log) { log.textContent = audioDbg.lines.join("\n"); log.scrollTop = log.scrollHeight; }
    }
  }
  function installAudioDebugPanel() {
    // Triple-tap on rank/level area to open
    const trigger = document.querySelector(".hud") || document.body;
    trigger.addEventListener("click", () => {
      const now = Date.now();
      if (now - audioDbg.lastTap > 600) audioDbg.taps = 0;
      audioDbg.taps++;
      audioDbg.lastTap = now;
      if (audioDbg.taps >= 3) { audioDbg.taps = 0; openAudioDebug(); }
    });
  }
  function openAudioDebug() {
    if (audioDbg.el) { audioDbg.el.remove(); audioDbg.el = null; return; }
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.92);color:#0f0;font:12px/1.4 monospace;padding:12px;z-index:99999;overflow:auto;";
    const voices = ("speechSynthesis" in window) ? (window.speechSynthesis.getVoices() || []) : [];
    const voicesList = voices.map(v => `${v.lang}  ${v.name}${v.localService ? " [local]" : ""}${v.default ? " [default]" : ""}`).join("\n") || "(no voices)";
    wrap.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <button data-act="close" style="padding:8px 12px;background:#333;color:#fff;border:0;border-radius:6px;">Close</button>
        <button data-act="test-en" style="padding:8px 12px;background:#06c;color:#fff;border:0;border-radius:6px;">Test EN</button>
        <button data-act="test-pa" style="padding:8px 12px;background:#c60;color:#fff;border:0;border-radius:6px;">Test PA (gurmukhi)</button>
        <button data-act="test-roman" style="padding:8px 12px;background:#a40;color:#fff;border:0;border-radius:6px;">Test PA (roman/Hindi)</button>
        <button data-act="test-default" style="padding:8px 12px;background:#080;color:#fff;border:0;border-radius:6px;">Test default voice</button>
        <button data-act="reload-voices" style="padding:8px 12px;background:#444;color:#fff;border:0;border-radius:6px;">Reload voices</button>
      </div>
      <div><b>UA:</b> ${navigator.userAgent}</div>
      <div><b>speechSynthesis:</b> ${"speechSynthesis" in window ? "yes" : "NO"}</div>
      <div><b>voices.length:</b> ${voices.length}</div>
      <div><b>EN picked:</b> ${tts.voiceEnglish ? tts.voiceEnglish.name + " (" + tts.voiceEnglish.lang + ")" : "(none)"}</div>
      <div><b>PA picked:</b> ${tts.voicePunjabi ? tts.voicePunjabi.name + " (" + tts.voicePunjabi.lang + ")" : "(none)"}</div>
      <div><b>HI picked:</b> ${tts.voiceHindi ? tts.voiceHindi.name + " (" + tts.voiceHindi.lang + ")" : "(none)"}</div>
      <hr style="border-color:#333;">
      <details><summary style="cursor:pointer;">All voices (${voices.length})</summary><pre style="white-space:pre-wrap;color:#9cf;">${voicesList}</pre></details>
      <hr style="border-color:#333;">
      <pre class="dbg-log" style="white-space:pre-wrap;color:#0f0;max-height:50vh;overflow:auto;">${audioDbg.lines.join("\n")}</pre>
    `;
    document.body.appendChild(wrap);
    audioDbg.el = wrap;
    wrap.addEventListener("click", (e) => {
      const act = e.target?.dataset?.act;
      if (!act) return;
      if (act === "close") { wrap.remove(); audioDbg.el = null; return; }
      if (act === "test-en") { audioDbgLog("test EN: 'Hello, this is a test.'"); speakText("Hello, this is a test.", "en"); return; }
      if (act === "test-pa") { audioDbgLog("test PA gurmukhi: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ'"); speakText({gurmukhi:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ", roman:"sat sri akaal"}, "pa"); return; }
      if (act === "test-roman") {
        audioDbgLog("test roman direct via Hindi voice");
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("sat sri akaal, kiddan");
          u.lang = "hi-IN";
          if (tts.voiceHindi) u.voice = tts.voiceHindi;
          u.onstart = () => audioDbgLog("→ start (roman/hi)");
          u.onend = () => audioDbgLog("→ end (roman/hi)");
          u.onerror = (e) => audioDbgLog("→ error (roman/hi): " + (e.error||"?"));
          window.speechSynthesis.speak(u);
        }
        return;
      }
      if (act === "test-default") {
        audioDbgLog("test default voice (no voice set)");
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("This is the default voice test.");
          u.onstart = () => audioDbgLog("→ start (default)");
          u.onend = () => audioDbgLog("→ end (default)");
          u.onerror = (e) => audioDbgLog("→ error (default): " + (e.error||"?"));
          window.speechSynthesis.speak(u);
        }
        return;
      }
      if (act === "reload-voices") { loadVoicesOnce(); audioDbgLog("reload-voices triggered"); }
    });
  }

  // ---------- HUD / XP / Level -----------------------------------------------
  function updateHud() {
    const rank = getRank(state.level);
    const rankEl = $("#rankBadge");
    const lvlEl = $("#levelLabel");
    const newRankText = `${rank.badge} ${rank.title}`;
    const newLvlText = `Lv ${state.level.toLocaleString()}`;
    if (rankEl.textContent !== newRankText) {
      rankEl.textContent = newRankText;
      rankEl.classList.remove("pop"); void rankEl.offsetWidth; rankEl.classList.add("pop");
    }
    if (lvlEl.textContent !== newLvlText) {
      lvlEl.textContent = newLvlText;
      lvlEl.classList.remove("pop"); void lvlEl.offsetWidth; lvlEl.classList.add("pop");
    }
    const need = xpForNext(state.level);
    const pct = clamp((state.xp / need) * 100, 0, 100);
    $("#xpFill").style.width = pct + "%";
    $("#xpText").textContent = `${state.xp.toLocaleString()} / ${need.toLocaleString()} XP`;
    const bar = $(".xpbar");
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function gainXp(amount) {
    if (amount <= 0) return;
    state.xp += amount;
    state.totalXp += amount;
    state.sessionXp += amount;
    let leveled = false;
    let unlockedTierName = null;
    while (state.xp >= xpForNext(state.level) && state.level < 1_000_000) {
      state.xp -= xpForNext(state.level);
      const prevRank = getRank(state.level);
      const prevTier = unlockedTierForLevel(state.level);
      state.level += 1;
      const newRank = getRank(state.level);
      const newTier = unlockedTierForLevel(state.level);
      leveled = true;
      if (newTier > prevTier) {
        unlockedTierName = CARD_TIERS.NAMES[newTier] || `Tier ${newTier}`;
      }
      if (newRank.title !== prevRank.title) {
        showLevelUp(true, newRank, unlockedTierName);
        unlockedTierName = null; // consumed by rank-up overlay
      }
    }
    if (leveled) {
      // Single quick flash if no rank-up overlay shown
      if (!$("#levelup").classList.contains("show")) showLevelUp(false, getRank(state.level), unlockedTierName);
    }
    saveState();
    updateHud();
  }

  function showLevelUp(isRankUp, rank, unlockedTierName) {
    const el = $("#levelup");
    $("#levelupTitle").textContent = isRankUp ? "RANK UP!" : "LEVEL UP!";
    $("#levelupSub").textContent   = `You reached Lv ${state.level.toLocaleString()}`;
    const rankEl = $("#levelupRank");
    if (unlockedTierName) {
      rankEl.textContent = isRankUp
        ? `${rank.badge} ${rank.title} — ${unlockedTierName} unlocked`
        : `🔓 ${unlockedTierName} unlocked`;
    } else {
      rankEl.textContent = isRankUp ? `${rank.badge} ${rank.title}` : "";
    }
    el.classList.add("show");
    clearTimeout(showLevelUp._t);
    showLevelUp._t = setTimeout(() => el.classList.remove("show"), (isRankUp || unlockedTierName) ? 1800 : 900);
  }

  // ---------- Router ----------------------------------------------------------
  // Order used to infer "forward" vs "back" navigation direction.
  const SCREEN_ORDER = ["start", "train", "battle", "battle-results", "settings"];
  // Veil color/kind by destination.
  const SCREEN_FX = { train: "train", battle: "battle", "battle-results": "battle", start: "home", settings: "home" };

  function playTransitionVeil(kind) {
    const veil = document.getElementById("transitionVeil");
    if (!veil) return;
    veil.classList.remove("show");
    veil.removeAttribute("data-kind");
    // Force reflow so the animation restarts cleanly.
    void veil.offsetWidth;
    veil.setAttribute("data-kind", kind);
    veil.classList.add("show");
    clearTimeout(playTransitionVeil._t);
    playTransitionVeil._t = setTimeout(() => {
      veil.classList.remove("show");
    }, 950);
  }

  let _routeBusy = false;
  function showScreen(name) {
    if (_routeBusy) return;
    const current = document.querySelector(".screen.active");
    const currentName = current ? current.dataset.screen : null;
    if (currentName === name) return;

    // Cleanup before switching
    stopSpeaking();
    if (battle && name !== "battle" && name !== "battle-results") {
      cancelAnimationFrame(battle.timerRaf);
      battle = null;
      try { Music.stop(); } catch {}
    } else if (battle && name === "battle-results") {
      // Stash summary before tearing down; results screen reads it.
      _lastRunSummary = battle._summary || _lastRunSummary;
      cancelAnimationFrame(battle.timerRaf);
      try { Music.stop(); } catch {}
      battle = null;
    }
    if (name !== "battle") {
      document.body.classList.remove("in-battle");
      // Hide any battle-scoped overlays so they don't linger when user
      // navigates away mid-pause/mid-coach/mid-prebattle.
      ["#pauseOverlay", "#confirmRetreat", "#coachOverlay", "#prebattleOverlay"]
        .forEach(sel => { const el = $(sel); if (el) el.hidden = true; });
    }
    if (name !== "train" && train) {
      clearTimeout(train.idleTimer);
      train.idleTimer = null;
      if (trainEvent) closeTrainEvent(true);
      train.eventActive = false;
    }
    if (name !== "train") { try { TrainMusic.stop(); } catch {} }

    // Direction inference
    const fromIdx = SCREEN_ORDER.indexOf(currentName);
    const toIdx   = SCREEN_ORDER.indexOf(name);
    const dir = (toIdx > fromIdx) ? "forward" : "back";
    const app = document.getElementById("app");
    if (app) {
      app.dataset.direction = dir;
      app.classList.remove("warp");
      void app.offsetWidth;
      app.classList.add("warp");
    }

    // Cinematic veil FX
    playTransitionVeil(SCREEN_FX[name] || "home");

    _routeBusy = true;

    const swap = () => {
      // Mark current as leaving (kept in DOM briefly for exit animation).
      $$(".screen").forEach(s => {
        if (s === current) {
          s.classList.remove("active");
          s.classList.add("leaving");
        } else {
          s.classList.remove("active", "leaving");
        }
        if (s.dataset.screen === name) s.classList.add("active");
      });
      $("#hud").hidden = (name === "start");
      if (name === "train")  { startTrainSession(); try { TrainMusic.start(); } catch {} }
      if (name === "battle") openPrebattle();
      if (name === "battle-results") renderResultsScreen();
      document.body.classList.toggle("in-battle", name === "battle");
      updateHud();

      // Remove the "leaving" copy after its exit animation completes.
      if (current) {
        setTimeout(() => current.classList.remove("leaving"), 460);
      }
      _routeBusy = false;
    };

    // Brief hold so the iris "closes" before content swaps under it.
    if (current) {
      setTimeout(swap, 200);
    } else {
      swap();
    }
  }

  // ---------- Train mode ------------------------------------------------------
  const train = {
    current: null,
    revealed: false,
    recentIds: [],
    cardsSinceInterrupt: 0,
    consecutiveCorrect: 0,
    repeatMissId: null,
    lastMissedId: null,
    idleTimer: null,
    revealedAt: 0,
    forceIdleSpeed: false,
    eventActive: false,
    // One-shot queue of cardIds the picker should serve before falling back
    // to normal SRS scheduling. Populated by the post-battle "Train missed
    // cards" handoff.
    preferMissesQueue: [],
  };

  function logReview(cardId, wasCorrect, opts = {}) {
    if (!state.review) state.review = {};
    if (!state.review[cardId]) state.review[cardId] = { lastSeenAt: 0, missCount: 0, lastMissAt: 0 };
    const r = state.review[cardId];
    r.lastSeenAt = Date.now();
    if (wasCorrect === false) {
      // Light-touch logging (e.g., during Speed Burst) only updates timestamps,
      // never bumps missCount or repeat-miss tracking.
      if (!opts.light) {
        r.missCount = (r.missCount || 0) + 1;
        r.lastMissAt = Date.now();
        if (train.lastMissedId === cardId) {
          train.repeatMissId = cardId;
        }
        train.lastMissedId = cardId;
      }
    } else if (wasCorrect === true) {
      if (train.repeatMissId === cardId) train.repeatMissId = null;
      if (train.lastMissedId === cardId) train.lastMissedId = null;
    }
    // Update recent buffer
    train.recentIds = [cardId, ...train.recentIds.filter(id => id !== cardId)]
      .slice(0, INTERRUPT.RECENT_BUFFER_SIZE);
  }

  function updateTrainHud() {
    const sh = $("#trainShield"); if (sh) sh.textContent = String(state.streakShield || 0);
    const ki = $("#trainKi");     if (ki) ki.textContent = String(state.kiCharge || 0);
  }

  function pickNextCard() {
    const now = Date.now();

    // 0) Battle→Training handoff: serve recently-missed-in-battle cards
    //    first. We pop ids one at a time and skip any that no longer exist
    //    in the deck or are now suspended.
    while (train.preferMissesQueue && train.preferMissesQueue.length) {
      const id = train.preferMissesQueue.shift();
      const card = DECK.find(c => c.id === id);
      const srs = card && state.srs[card.id];
      if (card && srs && !srs.suspended && !isLeech(srs)) return card;
    }

    // Bucket by queue.
    const learning = [];   // due learning/relearning (sub-day timing matters)
    const review = [];     // due reviews
    const newPool = [];
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s) continue;
      if (s.suspended || isLeech(s)) continue;
      if (s.queue === "learning" || s.queue === "relearning") {
        if ((s.due || 0) <= now) learning.push(c);
      } else if (s.queue === "review") {
        if ((s.due || 0) <= now) review.push(c);
      } else if (s.queue === "new") {
        newPool.push(c);
      }
    }

    // 1) Learning/relearning first — earliest-due wins.
    if (learning.length) {
      learning.sort((a, b) => (state.srs[a.id].due || 0) - (state.srs[b.id].due || 0));
      return learning[0];
    }

    // 2) Review queue: oldest-overdue first, with shaky-card boost.
    if (review.length) {
      review.sort((a, b) => {
        const sa = state.srs[a.id], sb = state.srs[b.id];
        const shA = state.shakyCards?.[a.id] ? SRS.SHAKY_PRIORITY_BONUS : 0;
        const shB = state.shakyCards?.[b.id] ? SRS.SHAKY_PRIORITY_BONUS : 0;
        const dueA = (sa.due || 0) - shA * 86400_000;
        const dueB = (sb.due || 0) - shB * 86400_000;
        return dueA - dueB;
      });
      // Light randomness across the most-overdue cluster so sessions feel fresh.
      const top = review.slice(0, Math.max(3, Math.ceil(review.length / 8)));
      return top[Math.floor(Math.random() * top.length)];
    }

    // 3) New cards (no daily limit — learners can always pull in new material),
    //    but only from tiers the player's level has unlocked. This keeps
    //    beginners on Foundations/Daily Life cards instead of dropping
    //    advanced grammar on them. If the unlocked-tier pool is exhausted,
    //    we fall back to the next tier so the queue is never artificially
    //    empty (effectively early-unlocking when the player has done the work).
    if (newPool.length) {
      const live = newPool.filter(c => !state.srs[c.id]?.suspended && !isLeech(state.srs[c.id]));
      if (live.length) {
        const cap = unlockedTierForLevel(state.level);
        let pool = live.filter(c => cardTier(c) <= cap);
        // Fallback: walk up the tiers until we find something to teach.
        let probe = cap;
        while (!pool.length && probe < CARD_TIERS.MAX) {
          probe += 1;
          pool = live.filter(c => cardTier(c) <= probe);
        }
        if (!pool.length) pool = live;
        pool.sort((a, b) => {
          // Prefer lower-tier cards first so within an unlocked range we
          // still teach foundations before progressing.
          const ta = cardTier(a), tb = cardTier(b);
          if (ta !== tb) return ta - tb;
          const sa = state.srs[a.id], sb = state.srs[b.id];
          if (sa.mastery !== sb.mastery) return sa.mastery - sb.mastery;
          return srsHash(a.id) - srsHash(b.id);
        });
        return pool[0];
      }
    }

    // 4) Nothing due, nothing new — preview soonest review (so the user can
    //    keep practicing without an empty screen).
    const all = DECK.slice().filter(c => state.srs[c.id]);
    all.sort((a, b) => (state.srs[a.id].due || 0) - (state.srs[b.id].due || 0));
    return all[0] || DECK[0];
  }

  function startTrainSession() {
    state.sessionXp = 0;
    decayShakyCards();
    train.current = pickNextCard();
    train.revealed = false;
    train.cardsSinceInterrupt = 0;
    train.consecutiveCorrect = 0;
    train.eventActive = false;
    closeTrainEvent(true);
    renderCard();
    updateTrainStats();
    updateTrainHud();
    armIdleTimer();
  }

  function armIdleTimer() {
    clearTimeout(train.idleTimer);
    train.idleTimer = null;
    if (!state.settings?.interrupts) return;
    train.idleTimer = setTimeout(() => {
      if (train.eventActive) return;
      const trainScreen = document.querySelector("#screen-train");
      if (!trainScreen?.classList.contains("active")) return;
      // Idle while staring at front face: force a Speed Burst
      if (!train.revealed) {
        train.forceIdleSpeed = true;
        startInterruptEvent("speed");
      }
    }, INTERRUPT.IDLE_MS);
  }

  function renderCard() {
    const c = train.current;
    const en2pa = isReverse(); // true => English-prompt mode (default)
    applyDirectionAttr();
    const typeEl = $("#cardType");
    if (typeEl) {
      typeEl.textContent = c.type;
      typeEl.dataset.type = c.type || "vocab"; // drives per-type pill color in CSS
    }
    // "Missed in battle" pill — makes the loop visible to the learner so
    // they understand WHY this card surfaced again. Show only for fairly
    // recent misses (last 24h) so the pill doesn't hang around forever.
    const fromBattleEl = $("#cardFromBattle");
    if (fromBattleEl) {
      const misses = Array.isArray(state.lastBattleMisses) ? state.lastBattleMisses : [];
      const hit = misses.find(m => m && m.cardId === c.id);
      const fresh = hit && (Date.now() - (hit.ts || 0)) < 24 * 3600_000;
      fromBattleEl.hidden = !fresh;
    }

    // Direction-aware front face:
    //  - en2pa: front shows ENGLISH; back reveals Punjabi (Gurmukhi + roman)
    //  - pa2en: front shows Punjabi (Gurmukhi + roman); back reveals English
    const cardPromptEl = $("#cardPrompt");
    if (en2pa) {
      // Front = English text only.
      if (cardPromptEl) cardPromptEl.textContent = c.english;
    } else {
      renderPunjabi(cardPromptEl, c);
    }

    // Back face always carries BOTH so learners see the full mapping.
    renderPunjabi($("#cardPromptBack"), c);
    $("#cardEnglish").textContent = c.english;
    // Section icons + auto-hide empty rows so the back face stays clean.
    const setMeta = (sel, icon, label, value) => {
      const el = $(sel);
      if (!el) return;
      if (value) {
        el.innerHTML = `<span class="meta-icon" aria-hidden="true">${icon}</span>`
          + `<span class="meta-label">${label}</span>`
          + `<span class="meta-text">${escapeHtml(value)}</span>`;
        el.hidden = false;
      } else {
        el.textContent = "";
        el.hidden = true;
      }
    };
    setMeta("#cardDef",     "\u{1F4D6}", "Definition", c.definition);
    setMeta("#cardRelated", "\u{1F517}", "Related",    c.related);
    setMeta("#cardExample", "\u{1F4AC}", "Example",    c.example);

    // Standalone Gurmukhi line on back is now redundant (Gurmukhi sits inside
    // #cardPromptBack), but keep the element hidden for backwards-compat.
    const gmBack = $("#cardGurmukhiBack");
    if (gmBack) { gmBack.textContent = ""; gmBack.hidden = true; }

    const front = $(".flashcard .front");
    const back  = $("#cardBack");
    const srs   = $("#srsRow");
    if (train.revealed) {
      front.hidden = true;
      back.hidden = false;
      srs.hidden = false;
      renderSrsButtonHints(c.id);
      renderCardHistory(c.id);
    } else {
      front.hidden = false;
      back.hidden = true;
      srs.hidden = true;
    }

    // Auto-play audio when the ANSWER face is visible (i.e. after reveal).
    //  - en2pa: answer is Punjabi, spoken in pa-IN
    //  - pa2en: answer is English, spoken in en-US
    // NOTE: speak synchronously (no setTimeout) to preserve the user-gesture
    // chain that iOS Safari requires.
    if (state.settings?.ttsAutoplay) {
      if (train.revealed) {
        speakCard(train.current);
      }
    }
  }

  function updateTrainStats() {
    const total = DECK.length;
    const sum = DECK.reduce((acc, c) => acc + (state.srs[c.id]?.mastery || 0), 0);
    const masteryPct = Math.round(sum / total);
    $("#trainMastery").textContent = masteryPct + "%";
    $("#trainSessionXp").textContent = (state.sessionXp || 0).toLocaleString();

    // Queue counters (single pass).
    const now = Date.now();
    let dueCount = 0, learningCount = 0, relearningCount = 0;
    let bdNew = 0, bdLearn = 0, bdYoung = 0, bdMature = 0, bdMastered = 0;
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s) continue;
      const isDue = (s.due || 0) <= now;
      if (s.queue === "learning") {
        learningCount++; bdLearn++;
        if (isDue) dueCount++;
      } else if (s.queue === "relearning") {
        relearningCount++; bdLearn++;
        if (isDue) dueCount++;
      } else if (s.queue === "review") {
        if (isDue) dueCount++;
        const mature = s.interval >= SRS.MASTERY_INTERVAL_DAYS;
        if (mature && (s.lapses || 0) <= SRS.MASTERY_MAX_LAPSES) bdMastered++;
        else if (mature) bdMature++;
        else bdYoung++;
      } else {
        bdNew++;
      }
    }

    const stats = getDailyStats(now);
    const set = (id, v) => { const el = $(id); if (el) el.textContent = String(v); };
    set("#srsDue", dueCount);
    set("#srsNew", stats.newIntroduced || 0);
    set("#srsLearning", learningCount);
    set("#srsRelearning", relearningCount);
    set("#bdNew", bdNew);
    set("#bdLearning", bdLearn);
    set("#bdYoung", bdYoung);
    set("#bdMature", bdMature);
    set("#bdMastered", bdMastered);

    // Compact inline queue snapshot shown directly above the flashcard so
    // users feel the queue draining as they grade. Animates a brief flash
    // on each counter when the value changes (green for decrement = progress,
    // amber for increment = card got pushed back).
    const chip = $("#cardQueueChip");
    if (chip) {
      const prev = updateTrainStats._lastQueue || {};
      const flashClass = (key, n) => {
        if (prev[key] == null) return "";
        if (n < prev[key]) return " cq-flash-down";
        if (n > prev[key]) return " cq-flash-up";
        return "";
      };
      chip.innerHTML =
        `<span class="cq cq-new${flashClass('new', bdNew)}">New <strong>${bdNew}</strong></span>`
        + `<span class="cq-sep">·</span>`
        + `<span class="cq cq-learn${flashClass('learn', bdLearn)}">Learn <strong>${bdLearn}</strong></span>`
        + `<span class="cq-sep">·</span>`
        + `<span class="cq cq-due${flashClass('due', dueCount)}">Due <strong>${dueCount}</strong></span>`;
      updateTrainStats._lastQueue = { new: bdNew, learn: bdLearn, due: dueCount };
    }

    // 7-day forecast bars (lightweight CSS).
    const wrap = $("#forecastBars");
    if (wrap) {
      const buckets = forecastDueByDay(7);
      const max = Math.max(1, ...buckets);
      const labels = ["Today", "+1", "+2", "+3", "+4", "+5", "+6"];
      wrap.innerHTML = buckets.map((n, i) => {
        const h = Math.round((n / max) * 100);
        return `<div class="fc-col" title="${labels[i]}: ${n} due">`
          + `<div class="fc-bar" style="height:${h}%"></div>`
          + `<span class="fc-num">${n}</span>`
          + `<span class="fc-lbl">${labels[i]}</span>`
          + `</div>`;
      }).join("");
    }
  }

  // Format an interval (days) into "1m" / "10m" / "1h" / "3d" / "2w" / "1mo".
  function formatNextDue(ms) {
    if (ms <= 0) return "now";
    const m = ms / 60000;
    if (m < 60) return `${Math.max(1, Math.round(m))}m`;
    const h = m / 60;
    if (h < 24) return `${Math.round(h)}h`;
    const d = h / 24;
    if (d < 14) return `${Math.round(d)}d`;
    const w = d / 7;
    if (w < 9) return `${Math.round(w)}w`;
    return `${Math.round(d / 30)}mo`;
  }
  function formatPreview(prev) {
    if (!prev) return "";
    if (prev.minutes != null) {
      if (prev.minutes < 60) return `${prev.minutes}m`;
      const h = Math.round(prev.minutes / 60);
      if (h < 24) return `${h}h`;
      return `${Math.round(h / 24)}d`;
    }
    if (prev.days != null) {
      if (prev.days < 14) return `${prev.days}d`;
      if (prev.days < 60) return `${Math.round(prev.days / 7)}w`;
      if (prev.days < 365) return `${Math.round(prev.days / 30)}mo`;
      return `${Math.round(prev.days / 365)}y`;
    }
    return "";
  }
  function renderSrsButtonHints(cardId) {
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt || ""; };
    if (!cardId || !state.srs[cardId]) {
      set("#srsSubAgain", ""); set("#srsSubHard", "");
      set("#srsSubGood", "");  set("#srsSubEasy", "");
      return;
    }
    set("#srsSubAgain", formatPreview(previewGradeInterval(cardId, "again")));
    set("#srsSubHard",  formatPreview(previewGradeInterval(cardId, "hard")));
    set("#srsSubGood",  formatPreview(previewGradeInterval(cardId, "good")));
    set("#srsSubEasy",  formatPreview(previewGradeInterval(cardId, "easy")));
  }

  // Per-card last-5 grade sparkline rendered on the back face. Hides the
  // entire labeled row on the very first review (no glyphs yet) so the back
  // face stays uncluttered for brand-new cards.
  function renderCardHistory(cardId) {
    const el = $("#cardHistory");
    const row = $("#cardHistoryRow");
    if (!el) return;
    const srs = state.srs[cardId];
    const hist = (srs && Array.isArray(srs.history)) ? srs.history.slice(-5) : [];
    if (!hist.length) {
      if (row) row.hidden = true;
      el.innerHTML = "";
      return;
    }
    if (row) row.hidden = false;
    const glyph = { a: "✗", h: "◦", g: "✓", e: "★" };
    const label = { a: "Again", h: "Hard", g: "Good", e: "Easy" };
    // Pad on the LEFT so newest is always rightmost (latest-on-right reading).
    const padCount = 5 - hist.length;
    let html = "";
    for (let i = 0; i < padCount; i++) html += '<span class="h-slot h-empty">·</span>';
    for (const g of hist) {
      html += `<span class="h-slot h-${g}" title="${label[g] || g}">${glyph[g] || "·"}</span>`;
    }
    el.innerHTML = html;
  }

  function gradeCard(grade) {
    const c = train.current;
    const srs = state.srs[c.id];
    srs.seen += 1;
    if (!srs.firstSeenAt) srs.firstSeenAt = Date.now();
    srs.previousInterval = srs.interval || 0;
    srs.lastReviewAt = Date.now();
    const stats = getDailyStats();
    stats.reviews = (stats.reviews || 0) + 1;
    const xp = applySrsGrade(c.id, grade);
    gainXp(xp);
    // Treat "again" as a miss for interrupt-trigger purposes; everything else as success.
    logReview(c.id, grade !== "again");
    if (grade === "again") {
      train.consecutiveCorrect = 0;
    } else {
      train.consecutiveCorrect += 1;
      // Successful training review clears the shaky flag set by Battle Mode.
      if (state.shakyCards && state.shakyCards[c.id] && grade !== "hard") {
        delete state.shakyCards[c.id];
      }
    }
    train.cardsSinceInterrupt += 1;
    saveState();

    // Brief "Next review" hint so users can see scheduling in action.
    const dueIn = (state.srs[c.id].due || 0) - Date.now();
    if (dueIn > 0) toast(`Next review: ${formatNextDue(dueIn)}`, 900);

    // Try to fire a random training interrupt.
    if (maybeInterrupt()) return;

    train.current = pickNextCard();
    train.revealed = false;
    renderCard();
    updateTrainStats();
    armIdleTimer();
  }

  // Returns true if the card currently meets the "Mastered" criteria.
  function isMastered(srs) {
    return !!srs && srs.queue === "review"
      && (srs.interval || 0) >= SRS.MASTERY_INTERVAL_DAYS
      && (srs.lapses || 0) <= SRS.MASTERY_MAX_LAPSES;
  }

  // Snooze a card until the next study-day rollover (4 AM local). Awards no
  // XP, doesn't count as a miss for interrupt purposes, and resets the
  // session correct-streak so users can't game it for combo bonuses. Used by
  // the "Bury" button + the `b` keyboard shortcut.
  function buryUntilTomorrow(cardId) {
    const srs = state.srs[cardId];
    if (!srs) return;
    srs.due = startOfNextStudyDay();
    train.consecutiveCorrect = 0;
    train.cardsSinceInterrupt += 1;
    saveState();
    toast("Buried until tomorrow", 1100);
    train.current = pickNextCard();
    train.revealed = false;
    renderCard();
    updateTrainStats();
    armIdleTimer();
  }

  // Apply an SRS grade across queues. Returns XP earned.
  function applySrsGrade(cardId, grade) {
    const srs = state.srs[cardId];
    const now = Date.now();
    const minute = 60_000, day = 86_400_000;
    const xpMap = { again: 2, hard: 5, good: 10, easy: 15 };
    // Scale base XP with player level so training never feels worthless at
    // high level. A "good" at L100 is worth ~610 XP (10 * 61); at L25,000
    // it's ~150,010 XP — keeping pace with xpForNext().
    const mult = levelRewardMult();
    let xp = Math.round((xpMap[grade] || 0) * mult);
    const wasMastered = isMastered(srs);

    // Rolling per-card grade history (last 5). Stored as a compact char array
    // ('a'/'h'/'g'/'e') so existing saves auto-upgrade with zero migration.
    if (!Array.isArray(srs.history)) srs.history = [];
    srs.history.push(grade[0]);
    if (srs.history.length > 5) srs.history.splice(0, srs.history.length - 5);

    // Helper: graduate from learning to review.
    const graduate = (intervalDays, easeBump = 0) => {
      srs.queue = "review";
      srs.step = 0;
      srs.interval = intervalDays;
      srs.due = now + fuzzInterval(cardId, intervalDays) * day;
      srs.reps += 1;
      if (easeBump) srs.ease = clamp(srs.ease + easeBump, SRS.EASE_MIN, SRS.EASE_MAX);
    };

    // --- NEW or LEARNING queue ---------------------------------------------
    if (srs.queue === "new" || srs.queue === "learning") {
      if (srs.queue === "new") {
        srs.queue = "learning";
        srs.step = 0;
        const stats = getDailyStats(now);
        stats.newIntroduced = (stats.newIntroduced || 0) + 1;
      }
      const steps = SRS.LEARNING_STEPS_MIN;
      switch (grade) {
        case "again":
          srs.step = 0;
          srs.due = now + steps[0] * minute;
          srs.mastery = clamp(srs.mastery - 3, 0, 100);
          break;
        case "hard":
          // Repeat current step (don't advance).
          srs.due = now + steps[srs.step] * minute;
          srs.mastery = clamp(srs.mastery + 1, 0, 100);
          break;
        case "good":
          srs.step += 1;
          if (srs.step >= steps.length) {
            graduate(SRS.GRAD_INTERVAL_GOOD);
            srs.mastery = clamp(srs.mastery + 5, 0, 100);
          } else {
            srs.due = now + steps[srs.step] * minute;
            srs.mastery = clamp(srs.mastery + 3, 0, 100);
          }
          break;
        case "easy":
          // Easy graduates immediately at a longer interval.
          graduate(SRS.GRAD_INTERVAL_EASY, 0.05);
          srs.mastery = clamp(srs.mastery + 8, 0, 100);
          break;
      }
      srs.lastResult = grade;
      // First-time mastery bounty is handled at the bottom of the function
      // (return path is hit only when grading from learning queue, no
      // mastery transition is possible here).
      return xp;
    }

    // --- RELEARNING queue --------------------------------------------------
    if (srs.queue === "relearning") {
      const steps = SRS.RELEARNING_STEPS_MIN;
      switch (grade) {
        case "again":
          srs.step = 0;
          srs.due = now + steps[0] * minute;
          srs.mastery = clamp(srs.mastery - 4, 0, 100);
          break;
        case "hard":
          srs.due = now + steps[srs.step] * minute;
          break;
        case "good":
          srs.step += 1;
          if (srs.step >= steps.length) {
            // Re-graduate to review using the gentle lapse interval already
            // stored at lapse time on srs.interval.
            srs.queue = "review";
            srs.step = 0;
            srs.due = now + fuzzInterval(cardId, srs.interval) * day;
            srs.reps += 1;
            srs.mastery = clamp(srs.mastery + 4, 0, 100);
          } else {
            srs.due = now + steps[srs.step] * minute;
            srs.mastery = clamp(srs.mastery + 2, 0, 100);
          }
          break;
        case "easy":
          // Easy on relearning: jump back to review immediately, modest interval.
          srs.queue = "review";
          srs.step = 0;
          srs.interval = Math.max(srs.interval, 1);
          srs.due = now + fuzzInterval(cardId, srs.interval) * day;
          srs.reps += 1;
          srs.mastery = clamp(srs.mastery + 6, 0, 100);
          break;
      }
      srs.lastResult = grade;
      if (!wasMastered && isMastered(srs)) {
        const bonus = Math.round(200 * mult);
        xp += bonus;
        srs.masteredAt = now;
        const card = DECK.find(c => c.id === cardId);
        const name = card?.english || "card";
        toast(`Mastered ${name}! +${bonus.toLocaleString()} XP`, 1600);
      }
      return xp;
    }

    // --- REVIEW queue (graduated SM-2) -------------------------------------
    const prevInterval = Math.max(1, srs.interval || 1);
    switch (grade) {
      case "again": {
        // Lapse: drop ease, half the interval (gentle), enter relearning.
        srs.ease = clamp(srs.ease - 0.20, SRS.EASE_MIN, SRS.EASE_MAX);
        srs.lapses = (srs.lapses || 0) + 1;
        srs.interval = capInterval(Math.max(1, Math.round(prevInterval * SRS.LAPSE_MULT)));
        srs.queue = "relearning";
        srs.step = 0;
        srs.due = now + SRS.RELEARNING_STEPS_MIN[0] * minute;
        srs.mastery = clamp(srs.mastery - 5, 0, 100);
        const stats = getDailyStats(now);
        stats.lapses = (stats.lapses || 0) + 1;
        // Auto-suspend leeches so they stop polluting the queue.
        if (isLeech(srs)) srs.suspended = true;
        break;
      }
      case "hard": {
        srs.ease = clamp(srs.ease - 0.05, SRS.EASE_MIN, SRS.EASE_MAX);
        srs.interval = capInterval(Math.max(prevInterval + 1, prevInterval * SRS.HARD_MULT));
        srs.due = now + fuzzInterval(cardId, srs.interval) * day;
        srs.reps += 1;
        srs.mastery = clamp(srs.mastery + 3, 0, 100);
        break;
      }
      case "good": {
        srs.interval = capInterval(Math.max(prevInterval + 1, prevInterval * srs.ease));
        srs.due = now + fuzzInterval(cardId, srs.interval) * day;
        srs.reps += 1;
        srs.mastery = clamp(srs.mastery + 8, 0, 100);
        break;
      }
      case "easy": {
        srs.ease = clamp(srs.ease + 0.10, SRS.EASE_MIN, SRS.EASE_MAX);
        srs.interval = capInterval(Math.max(prevInterval + 2, prevInterval * srs.ease * SRS.EASY_BONUS));
        srs.due = now + fuzzInterval(cardId, srs.interval) * day;
        srs.reps += 1;
        srs.mastery = clamp(srs.mastery + 14, 0, 100);
        break;
      }
    }
    srs.lastResult = grade;
    if (!wasMastered && isMastered(srs)) {
      const bonus = Math.round(200 * mult);
      xp += bonus;
      srs.masteredAt = now;
      const card = DECK.find(c => c.id === cardId);
      const name = card?.english || "card";
      toast(`Mastered ${name}! +${bonus.toLocaleString()} XP`, 1600);
    }
    // Session-recency tracking for the Training→Battle loop. We dedupe and
    // cap the buffer so very long sessions don't bloat localStorage. A
    // SESSION_GAP_MS gap since the last grade resets the buffer so we
    // only show "freshly learned" cards in the next battle.
    trackSessionReview(cardId, now);
    return xp;
  }

  // Push a graded card into the rolling session buffer used by
  // pickBattleCard for recency bias. Resets the buffer if the previous
  // grade was long enough ago to count as a separate session.
  function trackSessionReview(cardId, now) {
    if (!state.session) state.session = { startedAt: 0, lastGradeAt: 0, reviewedIds: [] };
    const sess = state.session;
    if (!sess.lastGradeAt || (now - sess.lastGradeAt) > LEARNING_LOOP.SESSION_GAP_MS) {
      sess.startedAt = now;
      sess.reviewedIds = [];
    }
    sess.lastGradeAt = now;
    // Move-to-end on duplicate so the buffer reflects most-recent ordering.
    const i = sess.reviewedIds.indexOf(cardId);
    if (i >= 0) sess.reviewedIds.splice(i, 1);
    sess.reviewedIds.push(cardId);
    if (sess.reviewedIds.length > LEARNING_LOOP.SESSION_BUFFER) {
      sess.reviewedIds.splice(0, sess.reviewedIds.length - LEARNING_LOOP.SESSION_BUFFER);
    }
  }

  // ---------- Battle mode -----------------------------------------------------
  let battle = null;

  function getDifficulty() {
    return DIFFICULTY[state.settings?.difficulty] || DIFFICULTY.normal;
  }

  function makeEnemy(index) {
    const diff = getDifficulty();
    // Cycle through templates; promote every 5th to a boss using enemy.png.
    const isBossWave = (index > 0) && (index % 5 === 0);
    let tmpl;
    if (isBossWave) {
      // Pick the strongest boss template from ENEMIES; in endless, scale up.
      const bosses = ENEMIES.filter(e => e.tier === "boss");
      tmpl = bosses[Math.min(Math.floor(index / 5) - 1, bosses.length - 1)] || bosses[bosses.length - 1];
    } else {
      const minions = ENEMIES.filter(e => e.tier !== "boss");
      tmpl = minions[index % minions.length];
    }
    const tier = isBossWave ? "boss" : (tmpl.tier || "minion");
    const tierHpMult = tier === "boss" ? 1.6 : tier === "elite" ? 1.2 : 1.0;
    // Endless: log scaling so it's not a wall.
    const endlessScale = diff.endless ? Math.log2(1 + index) * 18 : 0;
    const hp = Math.round((tmpl.baseHp + state.level * 4 + index * 25 + endlessScale) * tierHpMult);
    return {
      ...tmpl,
      tier,
      isBoss: tier === "boss",
      maxHp: hp,
      hp,
    };
  }

  function startBattle() {
    // Clear lingering defeat/KO visuals from a previous run.
    const _ps = document.querySelector("#playerSprite");
    if (_ps) _ps.classList.remove("ko");
    const _ar = document.querySelector("#screen-battle .arena");
    if (_ar) _ar.classList.remove("dim-out", "frozen", "arena-punch", "arena-shake", "hp-critical");
    const _ov = document.getElementById("defeatOverlay");
    if (_ov) _ov.classList.remove("show");
    const _cl = document.getElementById("confettiLayer");
    if (_cl) _cl.innerHTML = "";
    // C6 — Begin enemy idle micro-animation loop.
    startEnemyIdle();
    const diff = getDifficulty();
    battle = {
      enemyIdx: 0,
      enemy: makeEnemy(0),
      playerHp: 100, playerMax: 100,
      streak: 0, ki: 0,
      currentCard: null, currentChoices: [], currentChoiceCards: [], correctIdx: -1,
      reverse: false,
      busy: false,
      questionStart: 0,
      questionDuration: BATTLE.QUESTION_MS_BASE,
      timerRaf: 0,
      questionsThisFight: 0,
      telegraphTurns: 0,
      telegraphMaxTurns: 0,
      telegraphLabel: "",
      perfectRun: true,
      startedAt: performance.now(),
      runStartedAt: performance.now(),
      tier: 0,
      // V2 additions
      diff,
      kosThisRun: 0,
      questionsThisRun: 0,
      correctThisRun: 0,
      tierEverHit: [false, false, false, false, false, false, false, false, false, false],
      pausedAt: 0,
      pausedTotal: 0,
      ended: false,
      recentCards: [], // sliding window of last shown card ids (anti-repeat)
    };
    state.battleStats.runs = (state.battleStats.runs || 0) + 1;
    saveState();
    Sfx.init();
    Music.start();
    showStageHud();
    renderBattle();
    // Show pre-battle intro, then go to first question
    showIntroCard(battle.enemy, battle.enemyIdx, () => {
      nextQuestion();
      renderBattle();
      maybeStartOnboarding();
    });
  }

  function pickBattleCard() {
    // Weighted sampling, but only over cards the player has actually been
    // introduced to in Training (queue !== "new"). This keeps battles from
    // quizzing content the player has never been taught — a key part of
    // making level/difficulty progression feel coherent. If the seen pool
    // is too small (brand-new account), we fall back to tier-unlocked
    // unseen cards so battles aren't dead on arrival.
    const idx = battle?.enemyIdx ?? 0;
    const recent = (battle && battle.recentCards) || [];
    const tierCap = unlockedTierForLevel(state.level);
    const seen = DECK.filter(c => {
      const s = state.srs[c.id];
      return s && s.queue !== "new" && !s.suspended && !isLeech(s);
    });
    const MIN_SEEN_FOR_BATTLE = 8;
    let all;
    if (seen.length >= MIN_SEEN_FOR_BATTLE) {
      all = seen;
    } else {
      // Top up with cards from unlocked tiers so a fresh player can still
      // battle, but never reach into locked advanced content.
      const supplement = DECK.filter(c => {
        const s = state.srs[c.id];
        if (!s || s.suspended || isLeech(s)) return false;
        if (s.queue !== "new") return false;
        return cardTier(c) <= tierCap;
      });
      all = seen.concat(supplement);
      if (all.length < MIN_SEEN_FOR_BATTLE) {
        // Absolute last resort — just use the deck so the game never breaks.
        all = DECK.slice();
      }
    }
    // Window size: ~1/3 of pool, clamped. Keeps the same anti-repeat feel
    // even when the pool is small.
    const windowSize = Math.max(4, Math.min(Math.floor(all.length / 3), Math.floor(all.length / 2) - 1, 24));
    const recentSet = new Set(recent.slice(-windowSize));

    const nowMs = Date.now();
    function weightFor(c) {
      const s = state.srs[c.id];
      if (!s) return 0.5;
      let w = 1;
      // Tier band bias.
      const m = s.mastery || 0;
      if (idx <= 1)       { if (m < 40) w *= 1.6; else if (m > 80) w *= 0.4; }
      else if (idx <= 3)  { if (m >= 20 && m < 80) w *= 1.4; else w *= 0.6; }
      else                { if (m >= 50) w *= 1.5; else w *= 0.5; }
      // Weakness bias.
      if ((s.ease || SRS.EASE_START) < SRS.EASE_START - 0.1) w *= 1.4;
      if (m < 40) w *= 1.3;
      // Shaky bias.
      if (state.shakyCards && state.shakyCards[c.id]) w *= 1.8;
      // Recency bias — the core of the Training→Battle loop. Cards
      // graded in the current training session show up much more often,
      // so freshly learned vocab gets re-tested under battle's pressure.
      const sessRecent = state.session && state.session.reviewedIds;
      if (sessRecent && sessRecent.indexOf(c.id) >= 0) {
        w *= LEARNING_LOOP.SESSION_RECENCY_WEIGHT;
      } else {
        // Softer fallback: any review (training or battle) within the
        // recency window also gets a smaller bump. Survives reload.
        const lastSeen = state.review && state.review[c.id] && state.review[c.id].lastSeenAt;
        if (lastSeen && (nowMs - lastSeen) < LEARNING_LOOP.RECENCY_WINDOW_MS) {
          w *= LEARNING_LOOP.RECENCY_WEIGHT;
        }
      }
      // Suspended/leech: skip entirely (training-only territory).
      if (s.suspended) w = 0;
      return w;
    }

    function weightedPick(pool) {
      let total = 0;
      for (const c of pool) total += c._w;
      if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
      let r = Math.random() * total;
      for (const c of pool) { r -= c._w; if (r <= 0) return c; }
      return pool[pool.length - 1];
    }

    // Build pool excluding recently shown.
    let pool = [];
    for (const c of all) {
      const w = weightFor(c);
      if (w <= 0) continue;
      if (recentSet.has(c.id)) continue;
      c._w = w;
      pool.push(c);
    }
    // Safety: if anti-repeat emptied everything, drop the constraint but still
    // forbid the immediate previous card.
    if (!pool.length) {
      const lastId = recent[recent.length - 1];
      for (const c of all) {
        const w = weightFor(c);
        if (w <= 0) continue;
        if (c.id === lastId) continue;
        c._w = w;
        pool.push(c);
      }
    }
    // Final safety: pure random over all eligible cards.
    if (!pool.length) {
      pool = all.filter(c => !state.srs[c.id]?.suspended);
      pool.forEach(c => { c._w = 1; });
    }

    const pick = weightedPick(pool);
    pool.forEach(c => { delete c._w; });

    if (battle) {
      battle.recentCards = battle.recentCards || [];
      battle.recentCards.push(pick.id);
      if (battle.recentCards.length > windowSize * 2) {
        battle.recentCards = battle.recentCards.slice(-windowSize * 2);
      }
    }
    return pick;
  }

  // Battle answers never reschedule a card; they only nudge ease and toggle
  // the "shaky" flag, which gives that card a slight priority bump in the
  // next training session. This keeps Train Mode the source of truth for SRS.
  function applyBattleSignal(cardId, correct, responseMs) {
    const srs = state.srs[cardId];
    if (!srs) return;
    if (correct) {
      const fast = responseMs <= SRS.BATTLE_FAST_MS;
      srs.ease = clamp(
        srs.ease + (fast ? SRS.BATTLE_EASE_FAST : SRS.BATTLE_EASE_SLOW),
        SRS.EASE_MIN, SRS.EASE_MAX
      );
      srs.lastResult = "battle-ok";
      // A win on a shaky card requires a clean answer in TRAINING to clear
      // the flag — battle alone shouldn't unflag it (otherwise grinding
      // battles would erase real weakness signals).
    } else {
      srs.ease = clamp(srs.ease + SRS.BATTLE_EASE_MISS, SRS.EASE_MIN, SRS.EASE_MAX);
      srs.lastResult = "battle-miss";
      if (!state.shakyCards) state.shakyCards = {};
      const now = Date.now();
      state.shakyCards[cardId] = now;
      // Battle→Training writeback. For cards already in the review queue
      // we pull the due date sharply forward so the next training session
      // re-tests this word almost immediately. We deliberately don't touch
      // ease beyond the existing nudge, don't increment lapses, and don't
      // reset the interval — the SRS scheduler stays the source of truth.
      // Cards in learning/relearning are already in a tight loop, so we
      // leave them alone here.
      if (srs.queue === "review") {
        const newDue = now + LEARNING_LOOP.BATTLE_MISS_DUE_PUSHFORWARD_MS;
        if (!srs.due || srs.due > newDue) srs.due = newDue;
      }
      // Track for the post-battle "Cards to review" callout.
      if (!Array.isArray(state.lastBattleMisses)) state.lastBattleMisses = [];
      // Dedupe — keep most-recent-first ordering.
      state.lastBattleMisses = state.lastBattleMisses.filter(m => m && m.cardId !== cardId);
      state.lastBattleMisses.unshift({ cardId, ts: now });
      if (state.lastBattleMisses.length > LEARNING_LOOP.BATTLE_MISS_BUFFER) {
        state.lastBattleMisses.length = LEARNING_LOOP.BATTLE_MISS_BUFFER;
      }
    }
  }

  function nextQuestion() {
    const card = pickBattleCard();
    // Direction is now strictly user-controlled via Settings (no more random).
    const reverse = isReverse();
    const built = buildChoices(card, { mode: "normal", reverse });
    battle.currentCard = card;
    battle.currentChoices = built.choices;
    battle.currentChoiceCards = built.cards;
    battle.correctIdx = built.correctIdx;
    battle.reverse = reverse;
    battle.busy = false;
    battle.questionsThisFight = (battle.questionsThisFight || 0) + 1;
    battle.questionsThisRun = (battle.questionsThisRun || 0) + 1;
    state.battleStats.totalQuestions = (state.battleStats.totalQuestions || 0) + 1;
    // Question duration scales with enemy index AND difficulty.
    const idx = battle.enemyIdx || 0;
    const baseDur = Math.max(BATTLE.QUESTION_MS_MIN, BATTLE.QUESTION_MS_BASE - idx * 600);
    battle.questionDuration = Math.round(baseDur * (battle.diff?.timerMult || 1));
    // Telegraph: every Nth question (per-difficulty), enemy starts charging.
    // Players who want a pure language-learning experience can disable
    // the parallel "watch the charge bar" thread via Settings → Boss
    // Specials. Ki specials and core combat are unaffected.
    if (isBossSpecialsOn()) {
      const telegraphEvery = battle.diff?.telegraphEvery || BATTLE.TELEGRAPH_EVERY;
      if (battle.telegraphTurns === 0 && battle.questionsThisFight % telegraphEvery === 0) {
        battle.telegraphTurns = BATTLE.TELEGRAPH_TURNS;
        battle.telegraphMaxTurns = BATTLE.TELEGRAPH_TURNS;
        battle.telegraphLabel = pickTelegraphLabel();
        Sfx.play("telegraphWarn");
        buzz(40);
      }
    }
    startQuestionTimer();
  }

  function pickTelegraphLabel() {
    const moves = [
      "Death Beam", "Eye Laser", "Galick Gun", "Special Beam", "Dark Wave",
      "Final Flash", "Big Bang Attack", "Hellzone Grenade", "Destructo Disc", "Solar Flare",
      "Masenko", "Burning Attack", "Crimson Lotus", "Thunder Mudra", "Naam-Bomb",
      "Sher Strike", "Tandoor Blaze", "Sarpanch Slam", "Monsoon Surge", "Kirpan Cross-Slash"
    ];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  function startQuestionTimer() {
    cancelAnimationFrame(battle.timerRaf);
    battle.questionStart = performance.now();
    battle.pausedTotal = 0;
    const fill = $("#quizTimerFill");
    if (fill) { fill.classList.remove("danger"); fill.style.width = "100%"; }
    let lastTickSec = -1;
    const tick = (t) => {
      if (!battle || battle.busy) return;
      if (battle.pausedAt) { battle.timerRaf = requestAnimationFrame(tick); return; }
      const elapsed = (t - battle.questionStart) - battle.pausedTotal;
      const left = Math.max(0, battle.questionDuration - elapsed);
      const pct = (left / battle.questionDuration) * 100;
      if (fill) {
        fill.style.width = pct + "%";
        if (pct < 30) fill.classList.add("danger");
      }
      // Tick SFX in last 3 seconds
      const secLeft = Math.ceil(left / 1000);
      if (secLeft <= 3 && secLeft > 0 && secLeft !== lastTickSec) {
        lastTickSec = secLeft;
        Sfx.play("tick");
      }
      if (left <= 0) {
        onTimeout();
        return;
      }
      battle.timerRaf = requestAnimationFrame(tick);
    };
    battle.timerRaf = requestAnimationFrame(tick);
  }

  function onTimeout() {
    if (!battle || battle.busy) return;
    battle.busy = true;
    cancelAnimationFrame(battle.timerRaf);
    const buttons = $$("#choices .choice");
    const choicesWrap = $("#choices");
    buttons.forEach(b => b.disabled = true);
    if (choicesWrap) choicesWrap.classList.add("locked");
    if (buttons[battle.correctIdx]) buttons[battle.correctIdx].classList.add("correct");
    flashAnswer("wrong");
    battle.lastResult = "wrong";
    handleWrongAnswer({ timeout: true });
  }

  function renderBattle() {
    $("#enemyName").textContent   = battle.enemy.name;

    // Enemy sprite: emoji for minions/elites, image for bosses
    const enemyImg = $("#enemyImg");
    const enemyEmoji = $("#enemyEmoji");
    const enemyCombatant = document.querySelector(".combatant.enemy");
    if (enemyCombatant) {
      const _wasTier = enemyCombatant.classList.contains("boss") ? "boss"
                     : enemyCombatant.classList.contains("elite") ? "elite" : "minion";
      const _newTier = battle.enemy.tier || "minion";
      enemyCombatant.classList.remove("minion", "elite", "boss");
      enemyCombatant.classList.add(_newTier);
      // C2 — Boss intro one-shot when a boss first appears (tier changes to boss).
      if (_newTier === "boss" && _wasTier !== "boss") {
        enemyCombatant.classList.remove("entered");
        void enemyCombatant.offsetWidth;
        enemyCombatant.classList.add("entered");
        setTimeout(() => enemyCombatant.classList.remove("entered"), 950);
      }
    }
    if (battle.enemy.isBoss) {
      if (enemyImg) enemyImg.hidden = false;
      if (enemyEmoji) { enemyEmoji.hidden = true; enemyEmoji.textContent = ""; }
    } else {
      if (enemyImg) enemyImg.hidden = true;
      if (enemyEmoji) { enemyEmoji.hidden = false; enemyEmoji.textContent = battle.enemy.emoji || "👾"; }
    }
    // Enemy tier tag
    const enemyTierTag = $("#enemyTierTag");
    if (enemyTierTag) {
      const t = battle.enemy.tier || "minion";
      if (t === "minion") {
        enemyTierTag.hidden = true;
      } else {
        enemyTierTag.hidden = false;
        enemyTierTag.className = "enemy-tier-tag " + t;
        enemyTierTag.textContent = t === "boss" ? "BOSS" : "ELITE";
      }
    }
    // Charging aura
    if (enemyCombatant) {
      enemyCombatant.classList.toggle("charging", battle.telegraphTurns > 0);
    }

    $("#enemyHpFill").style.width = (battle.enemy.hp / battle.enemy.maxHp * 100) + "%";
    $("#enemyHpText").textContent = `${battle.enemy.hp}/${battle.enemy.maxHp}`;
    $("#playerHpFill").style.width = (battle.playerHp / battle.playerMax * 100) + "%";
    $("#playerHpText").textContent = `${battle.playerHp}/${battle.playerMax}`;
    // #4 Low-HP danger vignette
    const arenaEl = document.querySelector("#screen-battle .arena");
    if (arenaEl) arenaEl.classList.toggle("low-hp", (battle.playerHp / battle.playerMax) < 0.25);
    // C1 + C7 — Update arena tint + low-HP pulse cadence.
    updateArenaHue();
    $("#kiFill").style.width = battle.ki + "%";
    $("#streakLabel").textContent = String(battle.streak);
    const sb = $("#battleShield"); if (sb) sb.textContent = String(state.streakShield || 0);

    // Telegraph banner (replaces small badge)
    renderTelegraphBanner();

    // KI Special FAB state
    renderKiFab();

    // Stage HUD
    renderStageHud();

    // Prompt + label (direction-aware: battle.reverse means Punjabi is the answer)
    const lbl = $("#quizPromptLabel");
    if (lbl) lbl.textContent = battle.reverse ? "Translate to Punjabi:" : "Translate to English:";
    const promptEl = $("#quizPrompt");
    if (battle.currentCard) {
      if (battle.reverse) {
        // English prompt
        promptEl.textContent = battle.currentCard.english;
      } else {
        // Punjabi prompt — show Gurmukhi over roman
        renderPunjabi(promptEl, battle.currentCard);
      }
    }
    if (promptEl) promptEl.classList.remove("flash-good", "flash-bad");
    // Recency chip — shows the learner why this card surfaced in battle,
    // closing the feedback loop on the Training→Battle handoff. Guard
    // against the first renderBattle() call from startBattle(), which
    // runs before nextQuestion() has set battle.currentCard.
    const chip = $("#quizRecencyChip");
    if (chip) {
      const cur = battle.currentCard;
      const recent = !!(cur && state.session && Array.isArray(state.session.reviewedIds)
                  && state.session.reviewedIds.indexOf(cur.id) >= 0);
      chip.hidden = !recent;
    }
    const choicesWrap = $("#choices");
    if (choicesWrap) choicesWrap.classList.remove("locked");
    $$("#choices .choice").forEach((btn, i) => {
      const card = battle.currentChoiceCards && battle.currentChoiceCards[i];
      if (battle.reverse && card) {
        // Punjabi answer choices — render Gurmukhi + roman
        btn.innerHTML = punjabiHtml(card);
      } else {
        btn.textContent = battle.currentChoices[i] || "";
      }
      btn.classList.remove("correct", "wrong");
      btn.disabled = false;
    });

    applyTransformVisual();
    applyShieldVisual();
  }

  function applyTransformVisual() {
    const sprite = $("#playerSprite");
    const tag = $("#tierTag");
    if (!sprite) return;
    sprite.classList.remove(
      "tier-1", "tier-2", "tier-3", "tier-4", "tier-5",
      "tier-6", "tier-7", "tier-8", "tier-9",
    );
    const tier = battle.tier || 0;
    if (tier > 0) sprite.classList.add(`tier-${tier}`);
    if (tag) {
      if (tier > 0) {
        tag.hidden = false;
        tag.textContent = BATTLE.TIER_NAMES[tier];
        tag.dataset.tier = String(tier);
      } else {
        tag.hidden = true;
        delete tag.dataset.tier;
      }
    }
  }

  function applyShieldVisual() {
    const aura = $("#shieldAura");
    if (!aura) return;
    aura.classList.remove("shatter");
    if ((state.streakShield || 0) > 0) aura.classList.add("on");
    else aura.classList.remove("on");
  }

  function shieldShatterFx() {
    const aura = $("#shieldAura");
    if (!aura) return;
    aura.classList.remove("on");
    void aura.offsetWidth;
    aura.classList.add("shatter");
    setTimeout(() => aura.classList.remove("shatter"), 500);
  }

  function computeTier(streak) {
    // Focus Mode collapses the 9-tier ladder down to 3 visible bands so
    // the visual progression maps cleanly to "competent / strong / peak"
    // rather than nine indistinguishable colour/aura swaps.
    const t = isFocusMode() && Array.isArray(BATTLE.FOCUS_TIER_THRESHOLDS)
      ? BATTLE.FOCUS_TIER_THRESHOLDS
      : BATTLE.TIER_THRESHOLDS;
    for (let i = t.length - 1; i >= 0; i--) {
      if (streak >= t[i]) return i + 1;
    }
    return 0;
  }

  function playerAttack(streak) {
    let dmg = 12 + Math.floor(state.level * 0.6);
    let label = null;
    let fx = null, sfx = null;
    if (streak >= 100 && streak % 100 === 0) { dmg += 250; label = "ULTIMATE FORM!"; fx = "spiritbomb"; sfx = "spirit"; }
    else if (streak >= 75 && streak % 75 === 0) { dmg += 180; label = "INSTANT TRANSMISSION KAMEHAMEHA!"; fx = "kamehameha"; sfx = "kameBeam"; }
    else if (streak >= 50 && streak % 50 === 0) { dmg += 120; label = "DRAGON FIST!"; fx = "spiritbomb"; sfx = "spirit"; }
    else if (streak >= 25 && streak % 25 === 0) { dmg += 80; label = "SPIRIT BOMB!"; fx = "spiritbomb"; sfx = "spirit"; }
    else if (streak >= 20 && streak % 20 === 0) { dmg += 30; label = "FINAL FLASH!"; fx = "kamehameha"; sfx = "kameBeam"; }
    else if (streak >= 15 && streak % 15 === 0) { dmg += 25; label = "GALICK GUN!"; fx = "kamehameha"; sfx = "kameBeam"; }
    else if (streak >= 10 && streak % 10 === 0) { dmg += 40; label = "KAMEHAMEHA!"; fx = "kamehameha"; sfx = "kameBeam"; }
    else if (streak >= 5  && streak % 5  === 0) { dmg += 18; label = "KI BLAST!";   fx = "kiblast"; sfx = "crit"; }
    // In Focus Mode we keep the damage math (player still feels stronger
    // on streaks) but silence the parade of named-attack toasts / FX
    // except at the meaningful milestones — 10 (Kamehameha), 25 (Spirit
    // Bomb), and 100 (Ultimate Form). One named celebration per stage,
    // not one every five answers.
    let allow = true;
    if (isFocusMode()) {
      const streaks = (BATTLE.FOCUS_NAMED_ATTACK_STREAKS || [10, 25, 100]);
      allow = label != null && streaks.includes(streak);
    }
    if (allow) {
      if (fx) playFx(fx);
      if (sfx) Sfx.play(sfx);
      if (label) toast(label);
    }
    return dmg;
  }

  function enemyAttack() {
    const base = 8 + Math.floor(state.level * 0.3) + Math.floor(Math.random() * 6);
    return Math.round(base * (battle?.diff?.dmgMult || 1));
  }

  function onChoice(i) {
    if (!battle || battle.busy) return;
    battle.busy = true;
    cancelAnimationFrame(battle.timerRaf);
    const correct = (i === battle.correctIdx);
    const buttons = $$("#choices .choice");
    const choicesWrap = $("#choices");
    buttons.forEach(b => b.disabled = true);
    if (choicesWrap) choicesWrap.classList.add("locked");
    buttons[i].classList.add(correct ? "correct" : "wrong");
    if (!correct) buttons[battle.correctIdx].classList.add("correct");
    flashAnswer(correct ? "correct" : "wrong");

    if (correct) {
      battle.lastResult = "correct";
      handleCorrectAnswer();
    } else {
      battle.lastResult = "wrong";
      handleWrongAnswer({ timeout: false });
    }
  }

  function handleCorrectAnswer() {
    battle.streak += 1;
    battle.correctThisRun = (battle.correctThisRun || 0) + 1;
    state.battleStats.totalCorrect = (state.battleStats.totalCorrect || 0) + 1;
    battle.ki = clamp(battle.ki + 12, 0, 100);
    if (battle.streak > (state.battleStats?.bestStreak || 0)) {
      state.battleStats.bestStreak = battle.streak;
    }
    bumpStreakLabel();
    Sfx.play("swoosh");
    // Tier transformation announce
    const newTier = computeTier(battle.streak);
    if (newTier > (battle.tier || 0)) {
      battle.tier = newTier;
      tierUpFx(newTier);
      buzz([20, 40, 30]);
      applyTransformVisual();
    }
    // A5 — Streak milestone fanfare at 5 / 10 / 25 / 50 / 100 / and every
    //      100 thereafter. Fires alongside (not instead of) the existing
    //      labelled special damage.
    {
      const _s = battle.streak;
      const _milestone = (_s === 5) || (_s === 10) || (_s === 25) || (_s === 50)
        || (_s === 100) || (_s > 100 && _s % 100 === 0);
      if (_milestone) streakFanfare(_s);
    }
    // Damage = base * tier mult * speed bonus
    const base = playerAttack(battle.streak);
    const tierMult = BATTLE.TIER_DMG_MULT[battle.tier || 0];
    const elapsed = (performance.now() - battle.questionStart) - (battle.pausedTotal || 0);
    const speedFactor = clamp(1 - (elapsed / battle.questionDuration), 0, 1);
    const speedBonus = 1 + BATTLE.SPEED_BONUS_MAX * speedFactor;
    const dmg = Math.round(base * tierMult * speedBonus);
    const _enemyPrevPct = (battle.enemy.hp / battle.enemy.maxHp) * 100;
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    ghostDrainHp("#enemyHpFill", _enemyPrevPct, (battle.enemy.hp / battle.enemy.maxHp) * 100);
    if (speedFactor > 0.6) {
      const pct = Math.round((speedBonus - 1) * 100);
      // #9 Throttle: only toast big bonuses (>=30%) or every 6s, never both.
      const now = performance.now();
      const last = battle._lastSpeedToastAt || 0;
      if (pct >= 30 || (now - last) > 6000) {
        battle._lastSpeedToastAt = now;
        toast(pickRandom([`⚡ Quick! +${pct}% dmg`, `⚡ Lightning! +${pct}% dmg`]), 900);
      }
    }
    gainXp(6 + Math.round(speedFactor * 4));
    // Soft writeback: battle ease nudge only — interval/due/lapses untouched.
    applyBattleSignal(battle.currentCard.id, true, elapsed);
    const srs = state.srs[battle.currentCard.id];
    if (srs) { srs.mastery = clamp(srs.mastery + 2, 0, 100); srs.seen += 1; }
    saveState();
    glowQuiz("correct");
    // Crit on SS2+ (tier 3+), fast answers, or every 5th streak hit.
    const isCrit = (battle.tier || 0) >= 3 || speedFactor > 0.7 || (battle.streak % 5 === 0);
    popDamage(".combatant.enemy", dmg, isCrit ? "crit" : "dmg");
    flashSprite("#enemySprite", { crit: isCrit });
    flashHp("#enemyHpFill");
    shakeEl("#enemySprite");
    // B4 — Anime motion lines streaking toward the enemy on every hit.
    playMotionLines("ltr", isCrit ? 7 : 5);
    // B1+B2+B3 — Crits get hit-stop, camera punch, and a spark burst.
    if (isCrit) {
      spawnCritSparks("#enemySprite", 9);
      freezeArena(110);
      cameraPunch();
    }
    Sfx.play(isCrit ? "crit" : "hit");
    buzz(isCrit ? [10, 20, 30] : 15);
    advanceBattle();
  }

  function handleWrongAnswer({ timeout }) {
    battle.perfectRun = false;
    // Soft writeback: flag the card as shaky and nudge ease down.
    if (battle.currentCard) {
      const elapsed = (performance.now() - battle.questionStart) - (battle.pausedTotal || 0);
      applyBattleSignal(battle.currentCard.id, false, elapsed);
    }
    // Reveal the correct answer briefly so the player learns from the miss (#1).
    if (battle.currentCard) {
      const answer = battle.reverse ? battle.currentCard.punjabi : battle.currentCard.english;
      if (answer) toast(`✗ ${answer}`, 1400);
    }
    if ((state.streakShield || 0) > 0) {
      state.streakShield -= 1;
      saveState();
      toast("🛡️ Streak Shield absorbed it!", 1500);
      shieldShatterFx();
      popDamage(".combatant.player", "BLOCK", "miss");
      updateTrainHud();
      const sb = $("#battleShield"); if (sb) sb.textContent = String(state.streakShield || 0);
      Sfx.play("block");
      buzz(25);
      advanceBattle();
      return;
    }
    const lostStreak = battle.streak || 0;
    battle.streak = 0;
    battle.tier = 0;
    bumpStreakLabel();
    // #19 Combo-break stinger: only when a meaningful streak was lost.
    if (lostStreak >= 10) {
      Sfx.play("ko");
      buzz([60, 30, 60]);
      toast(`💥 Combo broken! (${lostStreak})`, 1200);
    }
    battle.ki = clamp(battle.ki - 20, 0, 100);
    let dmg = enemyAttack();
    if (timeout) dmg = Math.round(dmg * 1.2);
    const _playerPrevPct = (battle.playerHp / battle.playerMax) * 100;
    battle.playerHp = Math.max(0, battle.playerHp - dmg);
    ghostDrainHp("#playerHpFill", _playerPrevPct, (battle.playerHp / battle.playerMax) * 100);
    glowQuiz("wrong");
    if (timeout) popDamage(".combatant.player", "TIMEOUT", "miss");
    popDamage(".combatant.player", dmg, "dmg");
    flashSprite("#playerSprite");
    flashHp("#playerHpFill");
    shakeEl("#playerSprite");
    // B4 — Reverse motion lines (enemy attacking player).
    playMotionLines("rtl", 5);
    Sfx.play("hit");
    buzz(timeout ? 60 : 40);
    advanceBattle();
  }

  function advanceBattle() {
    // Telegraph countdown: tick down, unleash on zero.
    if (battle.telegraphTurns > 0) {
      battle.telegraphTurns -= 1;
      if (battle.telegraphTurns === 0 && battle.telegraphLabel) {
        const dmg = Math.round(enemyAttack() * BATTLE.TELEGRAPH_DAMAGE_MULT);
        if ((state.streakShield || 0) > 0) {
          state.streakShield -= 1;
          saveState();
          toast(`🛡️ Shield absorbed ${battle.telegraphLabel}!`, 1800);
          shieldShatterFx();
          popDamage(".combatant.player", "BLOCK", "miss");
          updateTrainHud();
          Sfx.play("block");
        } else {
          const _pPrevPct = (battle.playerHp / battle.playerMax) * 100;
          battle.playerHp = Math.max(0, battle.playerHp - dmg);
          ghostDrainHp("#playerHpFill", _pPrevPct, (battle.playerHp / battle.playerMax) * 100);
          // A4 — Named special-move overlay + beam sweep for charged hits.
          showNamedAttack(battle.telegraphLabel);
          fireBeam(battle.enemy && battle.enemy.isBoss ? "" : "purple");
          toast(`💥 ${battle.telegraphLabel} hits for ${dmg}!`, 1800);
          popDamage(".combatant.player", dmg, "crit");
          flashSprite("#playerSprite", { crit: true });
          flashHp("#playerHpFill");
          shakeEl("#playerSprite");
          shakeArena();
          playFx("tg-hit");
          flashAnswerBoom();
          // B1+B2+B4 — Telegraph hits earn extra weight: longer hit-stop, a
          //         camera punch, plus reverse motion lines.
          freezeArena(150);
          cameraPunch();
          playMotionLines("rtl", 8);
          Sfx.play("telegraphHit");
          buzz([0, 80, 30, 80]);
        }
        battle.telegraphLabel = "";
        battle.telegraphMaxTurns = 0;
      }
    }

    setTimeout(() => {
      if (!battle) return;
      if (battle.enemy.hp <= 0) {
        // Battle KO reward: scaled by player level (parity with the XP
        // curve), difficulty (hard pays more, easy pays less), boss bonus,
        // and current correct-answer streak. Keeps every fight relevant
        // even at very high level.
        const base = 30 + battle.enemyIdx * 8 + (battle.enemy.isBoss ? 80 : 0);
        const mult = levelRewardMult();
        const diffMult = battle.diff?.dmgMult || 1; // 0.75 / 1.0 / 1.20 / 1.0
        const streakBonus = 1 + Math.min(0.5, (battle.streak || 0) * 0.05);
        const reward = Math.round(base * mult * diffMult * streakBonus);
        gainXp(reward);
        toast(`Defeated ${battle.enemy.name}! +${reward.toLocaleString()} XP`, 2000);
        state.battleStats.wins = (state.battleStats.wins || 0) + 1;
        battle.kosThisRun = (battle.kosThisRun || 0) + 1;
        if (battle.diff?.endless) {
          state.battleStats.bestEnemyIdx = Math.max(state.battleStats.bestEnemyIdx || 0, battle.enemyIdx + 1);
        }
        const koMs = performance.now() - battle.startedAt;
        if (!state.battleStats.fastestKoMs || koMs < state.battleStats.fastestKoMs) {
          state.battleStats.fastestKoMs = Math.round(koMs);
        }
        if (battle.perfectRun) {
          state.battleStats.perfectRuns = (state.battleStats.perfectRuns || 0) + 1;
          toast(pickRandom(["✨ PERFECT RUN!", "✨ FLAWLESS VICTORY!", "✨ NO DAMAGE — UNREAL!"]), 1600);
        }
        saveState();
        Sfx.play("ko");
        playKoPuff();
        // Boss KO quote (#11)
        if (battle.enemy.isBoss && battle.enemy.koQuote) {
          setTimeout(() => toast(`“${battle.enemy.koQuote}”`, 2200), 600);
        }
        // Win condition
        const totalFights = battle.diff?.fights ?? 10;
        battle.enemyIdx += 1;
        if (!battle.diff?.endless && battle.enemyIdx >= totalFights) {
          finishRun("victory");
          return;
        }
        battle.enemy = makeEnemy(battle.enemyIdx);
        // Heal
        let heal = 0;
        if (battle.diff?.endless) {
          const everyN = battle.diff.healEveryNKOs || 3;
          if (battle.kosThisRun % everyN === 0) heal = battle.diff.healAmount || 18;
        } else {
          heal = battle.diff?.healPerKO ?? 20;
        }
        if (heal > 0) {
          const before = battle.playerHp;
          battle.playerHp = clamp(battle.playerHp + heal, 0, battle.playerMax);
          const actual = battle.playerHp - before;
          if (actual > 0) {
            popDamage(".combatant.player", actual, "heal");
            flashHp("#playerHpFill", "heal");
            ghostDrainHp("#playerHpFill", (before / battle.playerMax) * 100, (battle.playerHp / battle.playerMax) * 100, "heal");
          }
        }
        battle.questionsThisFight = 0;
        battle.telegraphTurns = 0;
        battle.telegraphMaxTurns = 0;
        battle.perfectRun = true;
        battle.startedAt = performance.now();
        // Tempo ramps with progression; bosses get extra push
        Music.setBoss(!!battle.enemy.isBoss);
        // Battle tempo: mid-pace cinematic, climbs per stage, bosses harder-hitting.
        Music.setBpm(92 + Math.min(18, battle.enemyIdx * 2) + (battle.enemy.isBoss ? 4 : 0));

        // Pre-battle intro for next enemy, then continue
        showIntroCard(battle.enemy, battle.enemyIdx, () => {
          nextQuestion();
          renderBattle();
          requestAnimationFrame(() => reanimateChoices());
        });
        return;
      }
      if (battle.playerHp <= 0) {
        finishRun("defeat");
        return;
      }
      nextQuestion();
      renderBattle();
      requestAnimationFrame(() => reanimateChoices());
    }, battle.lastResult === "wrong" ? 1700 : (battle.enemy && battle.enemy.isBoss && battle.enemy.hp <= 0 ? 1800 : 900));
  }

  function shakeEl(sel) {
    const el = $(sel);
    if (!el) return;
    const onEnd = () => { el.classList.remove("shake"); el.removeEventListener("animationend", onEnd); };
    el.classList.remove("shake");
    void el.offsetWidth;
    el.addEventListener("animationend", onEnd);
    el.classList.add("shake");
  }

  function playFx(kind) {
    const fx = $("#fx");
    fx.className = "fx";
    void fx.offsetWidth;
    fx.classList.add("show", kind);
    clearTimeout(playFx._t);
    const dur =
      kind === "spiritbomb"   ? 1600 :
      kind === "kamehameha"   ? 1200 :
      kind === "gold-burst"   ? 1000 :
      kind === "memory-clone" ? 1200 :
      kind === "frieza-trap"  ? 1100 :
      kind === "ki-cannon"    ? 900  :
      kind === "tg-hit"       ? 700  :
      kind === "victory"      ? 1700 :
      kind === "defeat"       ? 1500 : 900;
    playFx._t = setTimeout(() => {
      fx.classList.remove("show", kind);
    }, dur);
  }

  // ===================================================================
  // BATTLE V2 — Sfx, Music, KI Special, HUD, Intro, Results, Pause,
  // Onboarding, Pre-battle. All vanilla, no external deps.
  // ===================================================================

  // ---------- WebAudio engine -----------------------------------------------
  const Sfx = (() => {
    let ctx = null;
    let masterGain = null;
    let sfxGain = null;
    let musicGain = null;
    let initialized = false;
    function init() {
      if (initialized) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        masterGain = ctx.createGain();
        sfxGain = ctx.createGain();
        musicGain = ctx.createGain();
        // Kid-safe limiter chain: compressor + gentle high-shelf rolloff to
        // tame any harsh transients before they reach the speakers.
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -10;   // start limiting early
        limiter.knee.value = 6;
        limiter.ratio.value = 12;        // brick-wall-ish
        limiter.attack.value = 0.003;
        limiter.release.value = 0.18;
        const softShelf = ctx.createBiquadFilter();
        softShelf.type = "highshelf";
        softShelf.frequency.value = 6000;
        softShelf.gain.value = -3;       // gently roll off ear-piercing highs
        sfxGain.connect(softShelf);
        musicGain.connect(softShelf);
        softShelf.connect(limiter);
        limiter.connect(masterGain);
        masterGain.connect(ctx.destination);
        applyVolumes();
        initialized = true;
      } catch {}
    }
    function applyVolumes() {
      if (!initialized) return;
      const s = state.settings?.audio || { sfx: 0.7, music: 0.4, master: 1.0, muted: false };
      const m = s.muted ? 0 : 1;
      masterGain.gain.setTargetAtTime((s.master ?? 1) * m, ctx.currentTime, 0.02);
      sfxGain.gain.setTargetAtTime(s.sfx ?? 0.7, ctx.currentTime, 0.02);
      musicGain.gain.setTargetAtTime(s.music ?? 0.4, ctx.currentTime, 0.02);
    }
    function tone({ type = "sine", freq = 440, dur = 0.15, vol = 0.4, attack = 0.005, release = 0.08, freqEnd = null, filter = null, dest = null }) {
      if (!initialized) init();
      if (!initialized || !ctx) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + attack);
      g.gain.linearRampToValueAtTime(vol * 0.6, t0 + dur - release);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      const node = osc;
      if (filter) {
        const f = ctx.createBiquadFilter();
        f.type = filter.type || "lowpass";
        f.frequency.value = filter.freq || 1000;
        f.Q.value = filter.Q || 1;
        node.connect(f); f.connect(g);
      } else {
        node.connect(g);
      }
      g.connect(dest || sfxGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
    function noiseBurst({ dur = 0.2, vol = 0.4, filterFreq = 800, type = "lowpass" } = {}) {
      if (!initialized) init();
      if (!initialized || !ctx) return;
      const t0 = ctx.currentTime;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = filterFreq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(sfxGain);
      src.start(t0);
    }
    // Voices redesigned for kid-friendly ears + DBZ flair:
    //  - Rounder waveforms (sine / triangle, filtered saws only)
    //  - Lower peak gains (~0.18–0.32) feeding the limiter
    //  - Soft attacks/releases (no clicks)
    //  - Lowpass filters on noise to remove ear-piercing highs
    //  - Melodic tone sweeps for that anime "ki-energy" feel
    const VOICES = {
      // Quick, soft air-swoosh
      swoosh: () => {
        noiseBurst({ dur: 0.18, vol: 0.16, filterFreq: 1400, type: "bandpass" });
      },
      // Friendly thwack: round low thump + a soft mid pop, no bright noise
      hit: () => {
        tone({ type: "sine",     freq: 260, freqEnd: 110, dur: 0.16, vol: 0.26, attack: 0.004, release: 0.10 });
        tone({ type: "triangle", freq: 520, freqEnd: 220, dur: 0.10, vol: 0.14, attack: 0.004, release: 0.06 });
      },
      // Crit: mini DBZ "power impact" — octave triangle blast (no harsh saw)
      crit: () => {
        tone({ type: "triangle", freq: 330, freqEnd: 110, dur: 0.22, vol: 0.30, attack: 0.005, release: 0.12 });
        tone({ type: "sine",     freq: 660, freqEnd: 220, dur: 0.20, vol: 0.18, attack: 0.005, release: 0.10 });
        tone({ type: "triangle", freq: 990, freqEnd: 660, dur: 0.18, vol: 0.10, attack: 0.005, release: 0.08 });
      },
      // Block: warm bell ding (perfect 5th), no tinny squares
      block: () => {
        tone({ type: "sine",     freq: 880,  dur: 0.18, vol: 0.22, attack: 0.004, release: 0.12 });
        tone({ type: "sine",     freq: 1320, dur: 0.18, vol: 0.14, attack: 0.004, release: 0.12 });
      },
      // Crack: a dampened tap rather than ear-piercing white noise
      crack: () => {
        noiseBurst({ dur: 0.16, vol: 0.20, filterFreq: 1600, type: "bandpass" });
        tone({ type: "triangle", freq: 700, freqEnd: 300, dur: 0.10, vol: 0.14, attack: 0.003, release: 0.06 });
      },
      // ki-charge: smooth rising sine sweep (Goku powering up), no saw buzz
      kiCharge: () => {
        tone({ type: "sine",     freq: 220, freqEnd: 880,  dur: 0.55, vol: 0.22, attack: 0.06, release: 0.20, filter: { type: "lowpass", freq: 2400, Q: 0.7 } });
        tone({ type: "triangle", freq: 330, freqEnd: 1320, dur: 0.55, vol: 0.10, attack: 0.06, release: 0.20 });
      },
      // ki-fire: descending tonal whoosh, low-passed for warmth
      kiFire: () => {
        tone({ type: "triangle", freq: 880, freqEnd: 165, dur: 0.55, vol: 0.30, attack: 0.005, release: 0.20, filter: { type: "lowpass", freq: 2200, Q: 0.7 } });
        noiseBurst({ dur: 0.30, vol: 0.16, filterFreq: 1000, type: "lowpass" });
      },
      // Kamehameha beam: warm sustained 5th + soft ascending shimmer
      kameBeam: () => {
        tone({ type: "sine",     freq: 165,  dur: 0.65, vol: 0.28, attack: 0.04, release: 0.20 });
        tone({ type: "sine",     freq: 247,  dur: 0.65, vol: 0.20, attack: 0.04, release: 0.20 });
        tone({ type: "triangle", freq: 660, freqEnd: 1320, dur: 0.55, vol: 0.14, attack: 0.06, release: 0.20, filter: { type: "lowpass", freq: 2800, Q: 0.7 } });
      },
      // Spirit Bomb: dreamy major-7th arpeggio, soft attacks
      spirit: () => {
        [523.25, 659.25, 783.99, 987.77].forEach((f, i) =>
          setTimeout(() => tone({ type: "sine", freq: f, dur: 0.55, vol: 0.22, attack: 0.04, release: 0.30 }), i * 130));
      },
      // Telegraph warn: gentle minor-2nd siren, soft sine, no harsh squares
      telegraphWarn: () => {
        tone({ type: "sine", freq: 740, freqEnd: 440, dur: 0.30, vol: 0.24, attack: 0.02, release: 0.10 });
        tone({ type: "sine", freq: 880, freqEnd: 523, dur: 0.30, vol: 0.18, attack: 0.02, release: 0.10 });
      },
      // Telegraph hit: rounded big-impact, low boom + low-passed thud (no painful highs)
      telegraphHit: () => {
        tone({ type: "sine",     freq: 110, freqEnd: 40, dur: 0.55, vol: 0.34, attack: 0.005, release: 0.25 });
        tone({ type: "triangle", freq: 220, freqEnd: 80, dur: 0.50, vol: 0.20, attack: 0.005, release: 0.20 });
        noiseBurst({ dur: 0.35, vol: 0.18, filterFreq: 500, type: "lowpass" });
      },
      // Tier-up: bright triumphant ascending pentatonic (DBZ transformation cue)
      tierUp: () => {
        [392.00, 493.88, 587.33, 783.99, 987.77, 1174.66].forEach((f, i) =>
          setTimeout(() => tone({ type: "triangle", freq: f, dur: 0.20, vol: 0.26, attack: 0.005, release: 0.10 }), i * 55));
      },
      // KO: warm descending fall (no harsh saw)
      ko: () => {
        tone({ type: "triangle", freq: 523, freqEnd: 110, dur: 0.45, vol: 0.30, attack: 0.005, release: 0.20 });
        tone({ type: "sine",     freq: 262, freqEnd: 65,  dur: 0.50, vol: 0.20, attack: 0.005, release: 0.20 });
        noiseBurst({ dur: 0.30, vol: 0.16, filterFreq: 700, type: "lowpass" });
      },
      // Victory: heroic major fanfare (I–IV–V–I)
      victory: () => {
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) =>
          setTimeout(() => tone({ type: "triangle", freq: f, dur: 0.24, vol: 0.28, attack: 0.005, release: 0.12 }), i * 95));
      },
      // Defeat: sad gentle descent, no harsh tones
      defeat: () => {
        [523.25, 440.00, 369.99, 293.66, 246.94].forEach((f, i) =>
          setTimeout(() => tone({ type: "sine", freq: f, dur: 0.32, vol: 0.24, attack: 0.02, release: 0.18 }), i * 130));
      },
      // UI clicks: very soft, mellow
      tick:   () => { tone({ type: "sine",     freq: 1000, dur: 0.04, vol: 0.10, attack: 0.002, release: 0.02 }); },
      select: () => { tone({ type: "triangle", freq: 660,  dur: 0.07, vol: 0.14, attack: 0.003, release: 0.04 }); },
    };
    function play(name) {
      if (!initialized) init();
      if (!initialized) return;
      const v = VOICES[name]; if (!v) return;
      try { if (ctx.state === "suspended") ctx.resume(); v(); } catch {}
    }
    return { init, play, applyVolumes, get ctx() { return ctx; }, get musicGain() { return musicGain; } };
  })();

  // ---------- Procedural Music loop -----------------------------------------
  const Music = (() => {
    // Modern metal / hype / DBZ-flavored battle theme.
    // Key: F# minor — chord loop F#m – D – A – E (i – VI – III – VII).
    //  - 4-on-the-floor kick locked with palm-muted 8th-note sub bass for
    //    driving metal/EDM push.
    //  - Distorted power-chord stabs (root + 5th + octave saw stack, low-
    //    passed to stay ear-safe) on the downbeat of every bar.
    //  - Rhodes/pad chord behind the stabs; pad ducks on every kick for a
    //    sidechain "pump" that screams modern production.
    //  - DBZ horn-stab hit + crash on every 4-bar phrase downbeat.
    //  - Snare on 2 & 4 with a tom fill on the last beat of bar 4.
    //  - Hooky F#-minor pentatonic lead doubled at the octave for bosses.
    let timer = null;
    let currentBpm = 100;         // hype tempo
    let isBoss = false;
    let step = 0;                 // 16th-note step within a 4-bar loop (0..63)
    let nextNoteTime = 0;
    let lastKickTime = -1;        // for sidechain pump on chord/pad
    const LOOKAHEAD_MS = 25;
    const SCHED_AHEAD = 0.15;

    // Bass roots, low octave for metal weight.
    const BASS_ROOTS = [46.25, 73.42, 55.00, 82.41]; // F#1, D2, A1, E2
    // Power-chord stab roots (root, 5th, octave) — low-mid register.
    // F#: F#2 C#3 F#3 | D: D2 A2 D3 | A: A2 E3 A3 | E: E2 B2 E3
    const POWER = [
      [92.50, 138.59, 185.00],
      [73.42, 110.00, 146.83],
      [110.00, 164.81, 220.00],
      [82.41, 123.47, 164.81],
    ];

    // Rhodes/pad chord voicings — F#-minor family with 7th/9th colors.
    // F#m9 | Dmaj7 | Amaj7 | E7
    const CHORDS = [
      [185.00, 220.00, 277.18, 329.63, 415.30], // F#m9
      [146.83, 185.00, 220.00, 277.18],         // Dmaj7
      [220.00, 277.18, 329.63, 415.30],         // Amaj7
      [164.81, 207.65, 246.94, 293.66],         // E7
    ];

    // Top-voice melody — F#-minor pentatonic (F# A B C# E). Driven, hooky.
    const FS5=739.99, A5=880.00, B5=987.77, CS6=1108.73, E6=1318.51, FS6=1479.98;
    const LEAD = [
      // Bar 1 (F#m9): hook on the tonic
      [null,null,null,null, FS5,null,null,null, null,null,null,null, A5,null,CS6,null],
      // Bar 2 (Dmaj7): lift
      [null,null,null,null, A5,null,null,null, CS6,null,null,null, B5,null,A5,null],
      // Bar 3 (Amaj7): peak
      [null,null,null,null, CS6,null,null,null, E6,null,null,null, CS6,null,B5,null],
      // Bar 4 (E7): drive home with a leading tone (G#=415 already in chord)
      [null,null,null,null, B5,null,A5,null, null,null,null,null, FS5,null,null,null],
    ];

    // Hype metal/EDM kit (16 sixteenths per bar, straight time).
    // KICK: 4-on-the-floor + ghost 16th lead-in to beat 1 of next bar.
    // SNARE: backbeat 2 & 4, with a ghost 16th before beat 4 for movement.
    // HAT: every 8th closed; open-hat lift on the 'and of 4'.
    // STAB: power-chord on every downbeat.
    const KICK  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1];
    const SNARE = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1];
    const HAT   = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,2]; // 2 = open hat
    const STAB  = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]; // beats 1 & 3

    // Continuous vinyl/tape noise — initialized once.
    let noiseSrc = null, noiseGain = null;

    function start() {
      Sfx.init();
      stop();
      step = 0;
      nextNoteTime = (Sfx.ctx && Sfx.ctx.currentTime) || 0;
      startVinyl();
      schedule();
    }
    function stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      stopVinyl();
    }
    function setBoss(b) { isBoss = b; }
    function setBpm(bpm) { currentBpm = Math.max(75, Math.min(140, bpm | 0)); }

    // ---- vinyl/tape hiss bed ----
    function startVinyl() {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      try {
        const dur = 2; // 2s noise loop
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const d = buf.getChannelData(0);
        // Pink-ish noise: low-passed white noise with occasional crackle.
        let last = 0;
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          last = (last + 0.02 * w) * 0.985;
          let s = last * 4;
          if (Math.random() < 0.0008) s += (Math.random() * 2 - 1) * 0.6; // crackle
          d[i] = s;
        }
        noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = buf;
        noiseSrc.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4500;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 200;
        noiseGain = ctx.createGain();
        noiseGain.gain.value = isBoss ? 0.045 : 0.035;
        noiseSrc.connect(hp); hp.connect(lp); lp.connect(noiseGain); noiseGain.connect(Sfx.musicGain);
        noiseSrc.start();
      } catch {}
    }
    function stopVinyl() {
      try { noiseSrc && noiseSrc.stop(); } catch {}
      noiseSrc = null; noiseGain = null;
    }

    // ---- voices ----
    function tone(freq, t0, dur, vol, type, cutoff, attack = 0.012, q = 0.7) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = cutoff;
      filt.Q.value = q;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(filt); filt.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }

    // Rhodes-style EP voice — pad behind the stabs. Sidechain ducks volume
    // on every kick for that modern "pump" feel.
    function rhodes(freq, t0, dur, vol) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const wrap = ctx.createGain();
      wrap.gain.value = 1;
      // Sidechain: if a kick lands during the held chord, dip the pad.
      const kickGap = 60 / currentBpm;       // quarter-note kick spacing
      const kicks = Math.max(1, Math.ceil(dur / kickGap));
      let kt = lastKickTime > 0 ? lastKickTime : t0;
      while (kt < t0) kt += kickGap;
      for (let i = 0; i < kicks && kt < t0 + dur; i++, kt += kickGap) {
        wrap.gain.setValueAtTime(1.0, Math.max(t0, kt - 0.005));
        wrap.gain.linearRampToValueAtTime(0.35, kt + 0.01);
        wrap.gain.exponentialRampToValueAtTime(1.0, Math.min(t0 + dur, kt + 0.18));
      }
      wrap.connect(Sfx.musicGain);
      const sink = wrap;
      // We can't easily redirect tone() output, so duplicate a minimal
      // chord layer that routes through the ducker.
      const layers = [
        { mult: 1.0, vol: vol * 1.0, type: "sine",     cutoff: 2200 },
        { mult: 2.0, vol: vol * 0.28, type: "triangle", cutoff: 3500 },
        { mult: 1.5, vol: vol * 0.10, type: "sine",     cutoff: 2800 },
      ];
      layers.forEach(L => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = L.type;
        osc.frequency.value = freq * L.mult;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass"; filt.frequency.value = L.cutoff; filt.Q.value = 0.5;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(L.vol, t0 + 0.025);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(filt); filt.connect(g); g.connect(sink);
        osc.start(t0); osc.stop(t0 + dur + 0.05);
      });
    }

    // Distorted power-chord stab: detuned saw stack (root/5th/octave) low-
    // passed for ear safety. The "metal" of the track.
    function powerStab(freqs, t0, dur, vol) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0, t0);
      out.gain.linearRampToValueAtTime(vol, t0 + 0.005);
      out.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      // Distortion: waveshaper for asymmetric drive.
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      const k = 22;
      for (let i = 0; i < 1024; i++) {
        const x = (i / 512) - 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
      shaper.curve = curve; shaper.oversample = "4x";
      // Cutoff lower than typical metal so it doesn't shred kids' ears.
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 1800; lp.Q.value = 0.9;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 90;
      shaper.connect(lp); lp.connect(hp); hp.connect(out); out.connect(Sfx.musicGain);
      // Detuned dual-saw per note for thickness.
      freqs.forEach(f => {
        [-7, 7].forEach(cents => {
          const o = ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.value = f * Math.pow(2, cents / 1200);
          o.connect(shaper);
          o.start(t0); o.stop(t0 + dur + 0.02);
        });
      });
    }

    // DBZ horn-stab: short, brass-like saw + triangle blast on the "1" of
    // every 4-bar phrase. Filtered to stay warm.
    function hornHit(rootFreq, t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.45;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t0);
      lp.frequency.exponentialRampToValueAtTime(2400, t0 + 0.04);
      lp.frequency.exponentialRampToValueAtTime(900, t0 + dur);
      lp.Q.value = 1.2;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0, t0);
      out.gain.linearRampToValueAtTime(0.16, t0 + 0.012);
      out.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      lp.connect(out); out.connect(Sfx.musicGain);
      [1, 1.5, 2].forEach((m, i) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sawtooth" : "triangle";
        o.frequency.value = rootFreq * m;
        o.connect(lp);
        o.start(t0); o.stop(t0 + dur + 0.02);
      });
    }

    // Crash cymbal — filtered noise, longer tail, gentle.
    function crash(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.9;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4500;
      const shelf = ctx.createBiquadFilter(); shelf.type = "highshelf"; shelf.frequency.value = 8000; shelf.gain.value = -4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.10, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(hp); hp.connect(shelf); shelf.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }

    // Tom — short pitched thump, used in fills.
    function tom(freq, t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t0);
      o.frequency.exponentialRampToValueAtTime(freq * 0.55, t0 + 0.18);
      g.gain.setValueAtTime(0.22, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      o.connect(g); g.connect(Sfx.musicGain);
      o.start(t0); o.stop(t0 + 0.25);
    }

    // Soft sub-bass + palm-muted upper octave for metal drive on every 8th.
    function bass(freq, t0, dur) {
      tone(freq, t0, dur, 0.18, "sine", 600, 0.005, 0.5);
      tone(freq * 2, t0, dur * 0.6, 0.05, "triangle", 800, 0.005, 0.5);
    }
    function bassPalm(freq, t0, dur) {
      // Tighter, shorter, slightly distorted — palm-muted feel.
      tone(freq * 2, t0, dur, 0.07, "sawtooth", 700, 0.004, 0.6);
      tone(freq, t0, dur * 0.85, 0.10, "sine", 500, 0.004, 0.5);
    }

    // Lead — sine + saw bite, doubled at octave for bosses.
    function lead(freq, t0, dur) {
      const cutoff = isBoss ? 3400 : 2800;
      tone(freq, t0, dur, 0.075, "sine", cutoff, 0.012, 0.5);
      tone(freq * 1.005, t0, dur, 0.034, "triangle", cutoff, 0.012, 0.5);
      tone(freq, t0, dur * 0.85, 0.026, "sawtooth", cutoff * 0.7, 0.012, 0.6);
      if (isBoss) tone(freq * 2, t0, dur * 0.7, 0.020, "triangle", 4200, 0.012, 0.5);
    }

    // Punchy battle kick — thicker thump with a click transient.
    function kick(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      lastKickTime = t0;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.10);
      g.gain.setValueAtTime(0.34, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0); osc.stop(t0 + 0.25);
      // Click transient (filtered noise) for modern punch.
      const dur = 0.012;
      const buf = ctx.createBuffer(1, Math.max(8, ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1200;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.10, t0);
      cg.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(hp); hp.connect(cg); cg.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }

    // Modern gated snare — bandpass noise + tonal layer, abrupt cut for
    // "gated reverb" attitude. Low-passed to stay friendly.
    function snare(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.18;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 0.8;
      const shelf = ctx.createBiquadFilter(); shelf.type = "highshelf"; shelf.frequency.value = 5500; shelf.gain.value = -3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.24, t0);
      // Gated tail: quick decay then hard cut for that 80s-metal/modern hybrid.
      g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.09);
      g.gain.linearRampToValueAtTime(0.0001, t0 + 0.13);
      src.connect(bp); bp.connect(shelf); shelf.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
      // Tonal thwack
      const osc = ctx.createOscillator(); const g2 = ctx.createGain();
      osc.type = "triangle"; osc.frequency.setValueAtTime(240, t0);
      osc.frequency.exponentialRampToValueAtTime(160, t0 + 0.07);
      g2.gain.setValueAtTime(0.10, t0);
      g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.10);
      osc.connect(g2); g2.connect(Sfx.musicGain);
      osc.start(t0); osc.stop(t0 + 0.12);
    }

    // Closed/open hat — short noise burst, gentle high-pass. open=true
    // gives a longer tail for the "and of 4" lift.
    function hat(t0, open) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = open ? 0.16 : 0.045;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
      const shelf = ctx.createBiquadFilter(); shelf.type = "highshelf"; shelf.frequency.value = 9000; shelf.gain.value = -4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(open ? 0.045 : 0.028, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(hp); hp.connect(shelf); shelf.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }

    function playStep(s, t) {
      const bar = Math.floor(s / 16) % 4;
      const inBar = s % 16;
      const sixteenth = 60 / currentBpm / 4;
      const beatDur = sixteenth * 4;
      const phraseStart = (s === 0);

      // === Drums ===
      if (KICK[inBar])  kick(t);
      if (SNARE[inBar]) snare(t);
      if (HAT[inBar])   hat(t, HAT[inBar] === 2);

      // Tom fill on the very last beat of the 4-bar phrase (bar 3, beat 4).
      if (bar === 3 && inBar === 12) tom(180, t);
      if (bar === 3 && inBar === 13) tom(150, t);
      if (bar === 3 && inBar === 14) tom(120, t);
      if (bar === 3 && inBar === 15) tom(90,  t);

      // Crash cymbal on every 4-bar phrase downbeat (DBZ "FIGHT!" moment).
      if (phraseStart) crash(t);

      // === Bass ===
      // Palm-muted 8th-note root drive (metal feel) + sub on every quarter.
      if (inBar % 2 === 0) bassPalm(BASS_ROOTS[bar], t, sixteenth * 1.7);
      if (inBar % 4 === 0) bass(BASS_ROOTS[bar], t, beatDur * 0.95);

      // === Power-chord stab (the metal) ===
      if (STAB[inBar]) {
        const stabVol = isBoss ? 0.16 : 0.13;
        powerStab(POWER[bar], t, sixteenth * 3.5, stabVol);
      }

      // === DBZ horn hit on every phrase downbeat ===
      if (phraseStart) hornHit(BASS_ROOTS[bar] * 2, t);

      // === Rhodes/pad chord (sidechained behind the stabs) ===
      const chord = CHORDS[bar];
      const padVol = isBoss ? 0.07 : 0.06;
      if (inBar === 0) {
        chord.forEach((f, i) => rhodes(f, t + i * 0.008, beatDur * 3.6, padVol));
      }
      if (inBar === 8) {
        chord.forEach((f, i) => rhodes(f, t + i * 0.006, beatDur * 1.8, padVol * 0.75));
      }

      // === Top-line melody ===
      const note = LEAD[bar][inBar];
      if (note) {
        let hold = 1;
        for (let i = inBar + 1; i < 16; i++) { if (LEAD[bar][i]) break; hold++; }
        lead(note, t, sixteenth * hold * 0.95);
      }
    }

    function schedule() {
      const ctx = Sfx.ctx;
      if (!ctx) { timer = setTimeout(schedule, LOOKAHEAD_MS); return; }
      const sixteenth = 60 / currentBpm / 4;
      // Straight time — no swing, drives the battle.
      while (nextNoteTime < ctx.currentTime + SCHED_AHEAD) {
        if (nextNoteTime < ctx.currentTime) nextNoteTime = ctx.currentTime + 0.02;
        playStep(step, nextNoteTime);
        nextNoteTime += sixteenth;
        step = (step + 1) % 64;
      }
      timer = setTimeout(schedule, LOOKAHEAD_MS);
    }
    return { start, stop, setBoss, setBpm };
  })();

  // ---------- Training-screen lofi loop -------------------------------------
  // Inspired by Kanye West's "Runaway": a single haunting high-E piano motif
  // over Em – Am – Em – B7. Same lofi engine as the battle Music (Rhodes
  // chords, vinyl bed, swung brushed hats, soft sub-bass), gentler tempo so
  // it sits under the study session without pulling focus.
  const TrainMusic = (() => {
    let timer = null;
    const bpm = 72;
    let step = 0;
    let nextNoteTime = 0;
    const LOOKAHEAD_MS = 25;
    const SCHED_AHEAD = 0.15;

    // Em – Am – Em – B7  (i – iv – i – V), one bar each (16 sixteenths).
    const BASS_ROOTS = [82.41, 55.00, 82.41, 61.74]; // E2, A1, E2, B1
    // Lofi 7th/9th chord voicings — Rhodes mid-register.
    // Em9   : E G B D F#
    // Am9   : A C E G B
    // Em9   : E G B D F#
    // B7    : B D# F# A
    const CHORDS = [
      [164.81, 196.00, 246.94, 293.66, 369.99], // Em9
      [220.00, 261.63, 329.63, 392.00, 493.88], // Am9
      [164.81, 196.00, 246.94, 293.66, 369.99], // Em9
      [246.94, 311.13, 369.99, 440.00],         // B7
    ];

    // The Runaway motif: a single repeated high E (E5) — sparse and ringing.
    // Pattern per bar (16 sixteenths). Two soft strikes per bar, with a
    // small ornament on bar 4 leading back to the loop.
    const E5 = 659.25, G5 = 783.99, B5 = 987.77, D6 = 1174.66;
    const MOTIF = [
      [E5,null,null,null, null,null,null,null, E5,null,null,null, null,null,null,null],
      [E5,null,null,null, null,null,null,null, E5,null,null,null, null,null,null,null],
      [E5,null,null,null, null,null,null,null, E5,null,null,null, null,null,null,null],
      [E5,null,null,null, null,null,null,null, E5,null,null,null, G5,null,B5,D6 ],
    ];

    // Drums: even sparser than battle. Kick on 1 and "and of 2" only,
    // rim on beat 3, soft swung brushed hats every 8th.
    const KICK = [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0];
    const RIM  = [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];
    const HAT  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];

    let noiseSrc = null, noiseGain = null;

    function start() {
      Sfx.init();
      stop();
      step = 0;
      nextNoteTime = (Sfx.ctx && Sfx.ctx.currentTime) || 0;
      startVinyl();
      schedule();
    }
    function stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      stopVinyl();
    }

    function startVinyl() {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      try {
        const dur = 2;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          last = (last + 0.02 * w) * 0.985;
          let s = last * 4;
          if (Math.random() < 0.0007) s += (Math.random() * 2 - 1) * 0.55;
          d[i] = s;
        }
        noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = buf;
        noiseSrc.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4200;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 200;
        noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.030;
        noiseSrc.connect(hp); hp.connect(lp); lp.connect(noiseGain); noiseGain.connect(Sfx.musicGain);
        noiseSrc.start();
      } catch {}
    }
    function stopVinyl() {
      try { noiseSrc && noiseSrc.stop(); } catch {}
      noiseSrc = null; noiseGain = null;
    }

    function tone(freq, t0, dur, vol, type, cutoff, attack = 0.012) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = cutoff;
      filt.Q.value = 0.5;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(filt); filt.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
    function rhodes(freq, t0, dur, vol) {
      tone(freq, t0, dur, vol * 1.0, "sine", 2000, 0.025);
      tone(freq * 2, t0, dur * 0.6, vol * 0.25, "triangle", 3200, 0.008);
      tone(freq * 1.5, t0, dur * 0.45, vol * 0.08, "sine", 2500, 0.02);
    }
    // Piano-ish bell for the Runaway motif: bright triangle + soft sine
    // with a slow release so each strike rings out.
    function piano(freq, t0, dur, vol) {
      tone(freq, t0, dur, vol * 0.85, "triangle", 4000, 0.005);
      tone(freq * 2, t0, dur * 0.4, vol * 0.18, "sine", 5000, 0.005);
      tone(freq * 0.5, t0, dur * 0.7, vol * 0.10, "sine", 1800, 0.01);
    }
    function bass(freq, t0, dur) {
      tone(freq, t0, dur, 0.14, "sine", 600, 0.02);
      tone(freq * 2, t0, dur * 0.6, 0.03, "triangle", 700, 0.02);
    }
    function kick(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(115, t0);
      osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.14);
      g.gain.setValueAtTime(0.18, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
      osc.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0); osc.stop(t0 + 0.32);
    }
    function rim(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.05;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2100; bp.Q.value = 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.085, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }
    function hat(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.04;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.022, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(hp); hp.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }

    function playStep(s, t) {
      const bar = Math.floor(s / 16) % 4;
      const inBar = s % 16;
      const sixteenth = 60 / bpm / 4;
      const beatDur = sixteenth * 4;

      if (KICK[inBar]) kick(t);
      if (RIM[inBar])  rim(t);
      if (HAT[inBar])  hat(t);

      // Bass on the downbeat only — minimal, lets the chord & motif breathe.
      if (inBar === 0) bass(BASS_ROOTS[bar], t, beatDur * 3.2);

      // Chord on downbeat (long sustain), gentle restrike on beat 3.
      const chord = CHORDS[bar];
      if (inBar === 0) {
        chord.forEach((f, i) => rhodes(f, t + i * 0.014, beatDur * 3.7, 0.065));
      }
      if (inBar === 8) {
        chord.forEach((f, i) => rhodes(f, t + i * 0.011, beatDur * 1.6, 0.045));
      }

      // The "Runaway" piano motif on top.
      const note = MOTIF[bar][inBar];
      if (note) {
        let hold = 1;
        for (let i = inBar + 1; i < 16; i++) { if (MOTIF[bar][i]) break; hold++; }
        // The high E sustains long; ornament notes are short.
        const len = sixteenth * Math.min(hold, 8) * 0.95;
        piano(note, t, len, 0.10);
      }
    }

    function schedule() {
      const ctx = Sfx.ctx;
      if (!ctx) { timer = setTimeout(schedule, LOOKAHEAD_MS); return; }
      const sixteenth = 60 / bpm / 4;
      while (nextNoteTime < ctx.currentTime + SCHED_AHEAD) {
        if (nextNoteTime < ctx.currentTime) nextNoteTime = ctx.currentTime + 0.02;
        const swung = (step % 2 === 1) ? nextNoteTime + sixteenth * 0.20 : nextNoteTime;
        playStep(step, swung);
        nextNoteTime += sixteenth;
        step = (step + 1) % 64;
      }
      timer = setTimeout(schedule, LOOKAHEAD_MS);
    }
    return { start, stop };
  })();
  function tierUpFx(tier) {
    if (!tier) return;
    const name = BATTLE.TIER_NAMES[tier] || "POWER UP";
    Sfx.play("tierUp");
    // R5 — Iconic DBZ tier-up beats: white flash, ground shockwave + cracks,
    //      pillar of light, and lightning crackle for SS2-and-up.
    tierUpFlash(tier);
    spawnGroundShock(tier);
    if (tier >= 2) spawnTransformPillar(tier);
    if (tier >= 3) {
      spawnLightning(tier);
      // Repeat lightning bursts during the slow-mo for crackling effect.
      setTimeout(() => spawnLightning(tier), 320);
      if (tier >= 5) setTimeout(() => spawnLightning(tier), 640);
    }
    let el = $("#tierSplash");
    if (!el) {
      el = document.createElement("div");
      el.id = "tierSplash";
      el.className = "tier-splash";
      el.innerHTML = `<div class="ts-flash"></div><div class="ts-text"></div>`;
      document.body.appendChild(el);
    }
    el.setAttribute("data-tier", String(tier));
    el.querySelector(".ts-text").textContent = name + "!";
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
    document.body.classList.add("tier-slowmo");
    clearTimeout(tierUpFx._t);
    tierUpFx._t = setTimeout(() => {
      el.classList.remove("show");
      document.body.classList.remove("tier-slowmo");
    }, 1200);
    if (battle && !battle.tierEverHit[tier]) battle.tierEverHit[tier] = true;
  }

  // ---------- Arena shake / boom vignette -----------------------------------
  function shakeArena() {
    const arena = document.querySelector("#screen-battle .arena");
    if (!arena) return;
    arena.classList.remove("arena-shake");
    void arena.offsetWidth;
    arena.classList.add("arena-shake");
    setTimeout(() => arena.classList.remove("arena-shake"), 600);
  }

  // B2 — Camera punch: heavier shake (translate + rotate + scale) for crits,
  //      KOs, and telegraph hits. Layered on top of the regular shake.
  function cameraPunch() {
    const arena = document.querySelector("#screen-battle .arena");
    if (!arena) return;
    arena.classList.remove("arena-punch");
    void arena.offsetWidth;
    arena.classList.add("arena-punch");
    setTimeout(() => arena.classList.remove("arena-punch"), 460);
  }

  // B1 — Hit-stop helper. Briefly pauses arena animations to give weight to
  //      crits, telegraph hits, and KOs. Stacks safely; longest call wins.
  function freezeArena(ms = 110) {
    const arena = document.querySelector("#screen-battle .arena");
    if (!arena) return;
    arena.classList.add("frozen");
    const until = performance.now() + ms;
    const prev = freezeArena._until || 0;
    if (until > prev) freezeArena._until = until;
    clearTimeout(freezeArena._t);
    freezeArena._t = setTimeout(() => {
      if (performance.now() >= (freezeArena._until || 0) - 4) {
        arena.classList.remove("frozen");
        freezeArena._until = 0;
      }
    }, ms);
  }

  // B3 — Spawn a radial spark burst inside a sprite (used on crits / specials).
  function spawnCritSparks(hostSel, count = 8) {
    const host = document.querySelector(hostSel);
    if (!host) return;
    // Make sure the host can position the absolute children.
    const cs = getComputedStyle(host);
    if (cs.position === "static") host.style.position = "relative";
    const n = Math.max(4, Math.min(14, count));
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "crit-spark";
      const ang = (i / n) * 360 + (Math.random() * 18 - 9);
      s.style.setProperty("--angle", ang + "deg");
      // Slight stagger for natural feel.
      s.style.animationDelay = (Math.random() * 60) + "ms";
      host.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
  }

  // A4 — Named special-move overlay: big move title punches in across the
  //      screen for ~1.1s. Use for charged enemy attacks or future player
  //      ultimates.
  function showNamedAttack(label, opts = {}) {
    const ov = document.getElementById("namedAttack");
    const txt = document.getElementById("namedAttackText");
    if (!ov || !txt) return;
    txt.textContent = label || "SPECIAL";
    ov.classList.remove("show");
    void ov.offsetWidth;
    ov.classList.add("show");
    clearTimeout(showNamedAttack._t);
    showNamedAttack._t = setTimeout(() => ov.classList.remove("show"), 1200);
  }

  // A4 — Beam sweep: horizontal energy beam streaks across the arena.
  //      variant: "" | "blue" | "purple" tints the beam.
  function fireBeam(variant = "") {
    const beam = document.getElementById("beamFx");
    if (!beam) return;
    beam.classList.remove("fire", "beam-blue", "beam-purple");
    if (variant === "blue") beam.classList.add("beam-blue");
    else if (variant === "purple") beam.classList.add("beam-purple");
    void beam.offsetWidth;
    beam.classList.add("fire");
    clearTimeout(fireBeam._t);
    fireBeam._t = setTimeout(() => beam.classList.remove("fire"), 950);
  }

  // B4 — Anime-style motion lines streaking across the arena. Direction is
  //      "ltr" (player attacking enemy) or "rtl" (enemy attacking player).
  function playMotionLines(direction = "ltr", count = 5) {
    const arena = document.querySelector("#screen-battle .arena");
    if (!arena) return;
    let host = arena.querySelector(".motion-lines");
    if (!host) {
      host = document.createElement("div");
      host.className = "motion-lines";
      arena.appendChild(host);
    }
    host.innerHTML = "";
    const n = Math.max(3, Math.min(8, count));
    const flip = direction === "rtl";
    for (let i = 0; i < n; i++) {
      const line = document.createElement("span");
      line.className = "ml";
      const top = 12 + Math.random() * 76; // % vertical span
      const w = 30 + Math.random() * 45;   // % width
      const dur = 320 + Math.random() * 180;
      const delay = Math.random() * 110;
      line.style.top = top + "%";
      line.style.left = (flip ? "auto" : "-10%");
      if (flip) line.style.right = "-10%";
      line.style.width = w + "%";
      line.style.animationDuration = dur + "ms";
      line.style.animationDelay = delay + "ms";
      if (flip) line.style.animationName = "mlStreakRtl";
      host.appendChild(line);
    }
    host.classList.remove("show");
    void host.offsetWidth;
    host.classList.add("show");
    clearTimeout(playMotionLines._t);
    playMotionLines._t = setTimeout(() => {
      host.classList.remove("show");
      host.innerHTML = "";
    }, 480);
  }

  // A5 — Streak milestone fanfare ("x10!" badge punch). Tier color escalates
  //      with the milestone size.
  function streakFanfare(streak) {
    const ov = document.getElementById("streakFanfare");
    const badge = document.getElementById("streakFanfareBadge");
    if (!ov || !badge) return;
    badge.classList.remove("tier-blue", "tier-purple", "tier-red", "tier-rainbow");
    if      (streak >= 100) badge.classList.add("tier-rainbow");
    else if (streak >= 50)  badge.classList.add("tier-red");
    else if (streak >= 25)  badge.classList.add("tier-purple");
    else if (streak >= 10)  badge.classList.add("tier-blue");
    badge.textContent = "x" + streak + "!";
    ov.classList.remove("show");
    void ov.offsetWidth;
    ov.classList.add("show");
    clearTimeout(streakFanfare._t);
    streakFanfare._t = setTimeout(() => ov.classList.remove("show"), 1500);
  }

  // C1 — Arena hue reactivity. Color drifts toward red as HP drops; gold/blue
  //      when transformed. Updates CSS variables only — cheap to call often.
  function updateArenaHue() {
    const arena = document.querySelector("#screen-battle .arena");
    if (!arena || !battle) return;
    const hpPct = (battle.playerHp || 0) / (battle.playerMax || 100);
    const tier = battle.tier || 0;
    let tint = "rgba(0,0,0,0)";
    let strength = 0;
    if (hpPct < 0.30) {
      // Critical / low HP: red wash.
      tint = "rgba(255,40,40,0.55)";
      strength = clamp(0.55 + (0.30 - hpPct) * 1.2, 0.55, 0.9);
    } else if (tier >= 7) {
      // Super Saiyan Blue / Ultra Instinct: cool cyan/silver wash.
      tint = (tier >= 8) ? "rgba(220,235,255,0.45)" : "rgba(80,170,255,0.42)";
      strength = (tier >= 8) ? 0.5 : 0.45;
    } else if (tier >= 6) {
      // Super Saiyan God: crimson/pink divine wash.
      tint = "rgba(255,90,140,0.4)";
      strength = 0.4;
    } else if (tier === 5) {
      // Super Saiyan 4: red wash.
      tint = "rgba(255,80,60,0.4)";
      strength = 0.4;
    } else if (tier >= 2) {
      // Super Saiyan / SS2 / SS3: gold wash, intensifies with tier.
      tint = "rgba(255,210,63,0.4)";
      strength = 0.32 + (tier - 2) * 0.04;
    } else if (tier >= 1) {
      // Kaioken: warm red-orange wash.
      tint = "rgba(255,120,60,0.3)";
      strength = 0.28;
    }
    arena.style.setProperty("--arena-tint", tint);
    arena.style.setProperty("--arena-tint-strength", String(strength));
    // C7 — Critical-HP class & faster pulse.
    const critical = hpPct > 0 && hpPct < 0.18;
    arena.classList.toggle("hp-critical", critical);
    if (hpPct < 0.30) {
      const dur = clamp(1.1 - (0.30 - hpPct) * 2.2, 0.45, 1.1);
      arena.style.setProperty("--hp-pulse-dur", dur.toFixed(2) + "s");
    } else {
      arena.style.setProperty("--hp-pulse-dur", "1.1s");
    }
  }

  // C3 — Telegraph polish: replay the clip-path reveal of the move name.
  //      Called from renderTelegraphBanner whenever the label changes.
  function revealTelegraphMove() {
    const el = document.getElementById("tbMove");
    if (!el) return;
    el.classList.remove("reveal");
    void el.offsetWidth;
    el.classList.add("reveal");
  }

  // C4 — Transformation pillar + debris. Spawned during tierUpFx for tiers
  //      >= 2. Color matches the canonical DBZ form palette.
  function spawnTransformPillar(tier) {
    const sprite = document.querySelector("#playerSprite");
    if (!sprite) return;
    const cs = getComputedStyle(sprite);
    if (cs.position === "static") sprite.style.position = "relative";
    // Canonical DBZ tier color palette (matches CSS aura overrides).
    const colorMap = {
      1: "rgba(255,80,60,0.85)",   // Kaioken — red
      2: "rgba(255,225,90,0.92)",  // Super Saiyan — gold
      3: "rgba(255,235,110,0.95)", // SS2 — gold + lightning
      4: "rgba(255,245,160,0.95)", // SS3 — bright gold
      5: "rgba(255,80,60,0.9)",    // SS4 — red
      6: "rgba(255,90,140,0.9)",   // Super Saiyan God — crimson/pink
      7: "rgba(80,170,255,0.95)",  // Super Saiyan Blue — cyan
      8: "rgba(210,225,255,0.95)", // UI Sign — silver/cool
      9: "rgba(255,255,255,1)",    // Mastered UI — pure white
    };
    const color = colorMap[tier] || colorMap[9];
    const pillar = document.createElement("span");
    pillar.className = "transform-pillar";
    pillar.style.setProperty("--pillar-color", color);
    sprite.appendChild(pillar);
    setTimeout(() => pillar.remove(), 1100);
    // Debris specks rising on each side.
    for (let i = 0; i < 10; i++) {
      const d = document.createElement("span");
      d.className = "transform-debris";
      const dx = (Math.random() * 80) - 40;
      const dy = -(120 + Math.random() * 80);
      const delay = Math.random() * 250;
      d.style.setProperty("--dx", dx + "px");
      d.style.setProperty("--dy", dy + "px");
      d.style.setProperty("--debris-color", color);
      d.style.animationDelay = delay + "ms";
      sprite.appendChild(d);
      setTimeout(() => d.remove(), 1500 + delay);
    }
    // Hit-stop at the peak for weight.
    freezeArena(180);
  }

  // R5 — Iconic DBZ tier-up white flash. Bright burst over the arena that
  //      punctuates the moment of transformation. Tier-tinted in the rim.
  function tierUpFlash(tier) {
    const arena = document.querySelector("#screen-battle .arena");
    if (!arena) return;
    const flashColors = {
      1: "#ffd0c0", 2: "#fff5c0", 3: "#fffadf", 4: "#ffffff",
      5: "#ffd0c0", 6: "#ffd5e2", 7: "#d6ecff", 8: "#eef3ff", 9: "#ffffff",
    };
    const cs = getComputedStyle(arena);
    if (cs.position === "static") arena.style.position = "relative";
    const flash = document.createElement("div");
    flash.className = "tier-flash";
    flash.style.setProperty("--flash-color", flashColors[tier] || "#ffffff");
    arena.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
  }

  // R5 — Crackling lightning bolts (SS2-and-up signature). Higher tier =
  //      more bolts, faster cadence. Bolts are colored to the tier aura.
  function spawnLightning(tier, count) {
    const sprite = document.querySelector("#playerSprite");
    if (!sprite) return;
    const cs = getComputedStyle(sprite);
    if (cs.position === "static") sprite.style.position = "relative";
    const palette = {
      3: { c: "#fff7c2", g: "rgba(255,225,90,0.95)" },
      4: { c: "#fff7c2", g: "rgba(255,225,90,1)"   },
      5: { c: "#ffd6c2", g: "rgba(255,90,60,0.95)" },
      6: { c: "#ffd6e2", g: "rgba(255,100,150,0.95)" },
      7: { c: "#cfeaff", g: "rgba(80,170,255,1)"  },
      8: { c: "#e8efff", g: "rgba(200,220,255,0.95)" },
      9: { c: "#ffffff", g: "rgba(220,240,255,1)" },
    };
    const p = palette[tier] || palette[3];
    const n = count || (tier >= 7 ? 7 : tier >= 5 ? 5 : 4);
    for (let i = 0; i < n; i++) {
      const bolt = document.createElement("span");
      bolt.className = "lightning-bolt";
      const rot = (Math.random() * 320) - 160;
      const dx = (Math.random() * 60) - 30;
      const dy = (Math.random() * 50) - 25;
      const scale = 0.7 + Math.random() * 0.7;
      bolt.style.setProperty("--rot", rot + "deg");
      bolt.style.setProperty("--bolt-color", p.c);
      bolt.style.setProperty("--bolt-glow", p.g);
      bolt.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`;
      bolt.style.animationDelay = (i * 35 + Math.random() * 60) + "ms";
      sprite.appendChild(bolt);
      setTimeout(() => bolt.remove(), 300 + i * 35);
    }
  }

  // R5 — Ground crack + concentric shockwave under the player. Used for
  //      tier-up and KI special launch (the "crater under Goku" beat).
  function spawnGroundShock(tier) {
    const sprite = document.querySelector("#playerSprite");
    if (!sprite) return;
    const cs = getComputedStyle(sprite);
    if (cs.position === "static") sprite.style.position = "relative";
    const shockColors = {
      1: "rgba(255,150,120,0.95)",
      2: "rgba(255,235,160,0.95)",
      3: "rgba(255,235,160,0.95)",
      4: "rgba(255,245,180,1)",
      5: "rgba(255,150,120,0.95)",
      6: "rgba(255,160,200,0.95)",
      7: "rgba(160,210,255,0.95)",
      8: "rgba(220,235,255,0.95)",
      9: "rgba(255,255,255,1)",
    };
    const sColor = shockColors[tier] || "rgba(255,235,160,0.95)";
    const shock = document.createElement("span");
    shock.className = "ground-shockwave";
    shock.style.setProperty("--shock-color", sColor);
    sprite.appendChild(shock);
    setTimeout(() => shock.remove(), 950);
    // 5 radial cracks fanning out underfoot.
    for (let i = 0; i < 5; i++) {
      const crack = document.createElement("span");
      crack.className = "ground-crack";
      const rot = -60 + (i * 30) + (Math.random() * 14 - 7);
      crack.style.setProperty("--rot", rot + "deg");
      crack.style.setProperty("--crack-glow", sColor);
      crack.style.height = (18 + Math.random() * 14) + "%";
      crack.style.animationDelay = (i * 30) + "ms";
      sprite.appendChild(crack);
      setTimeout(() => crack.remove(), 900 + i * 30);
    }
  }

  // R5 — Player after-image (Zanzōken). Spawn N faded clones that drift
  //      and fade. Used during KI special launch.
  function spawnAfterimage(count) {
    const sprite = document.querySelector("#playerSprite");
    if (!sprite) return;
    const cs = getComputedStyle(sprite);
    if (cs.position === "static") sprite.style.position = "relative";
    const inner = sprite.innerHTML;
    const n = count || 3;
    for (let i = 0; i < n; i++) {
      const ai = document.createElement("div");
      ai.className = "player-afterimage";
      ai.innerHTML = inner;
      // Suppress nested aura/spark layers in the clone (visual noise).
      ai.querySelectorAll(".transform-aura, .shield-aura, .ko-puff, .crit-spark, .lightning-bolt, .transform-pillar, .transform-debris, .ground-shockwave, .ground-crack").forEach(n => n.remove());
      ai.style.setProperty("--ai-dx", (-(20 + i * 14)) + "px");
      ai.style.animationDelay = (i * 70) + "ms";
      sprite.appendChild(ai);
      setTimeout(() => ai.remove(), 500 + i * 70);
    }
  }

  // C6 — Enemy idle micro-animation. Triggers a brief "blink" on the enemy
  //      emoji every 4–7 seconds so the arena feels alive between turns.
  //      R5 — Also periodically crackles lightning around the player when
  //      transformed at SS2+ (tier ≥ 3), to sell the sustained power-up.
  let _enemyIdleTimer = 0;
  function startEnemyIdle() {
    stopEnemyIdle();
    const tick = () => {
      const screen = document.getElementById("screen-battle");
      if (!screen || !screen.classList.contains("active")) {
        _enemyIdleTimer = setTimeout(tick, 2500);
        return;
      }
      // Pause when paused or busy or telegraph charging (don't distract).
      const paused = battle && (battle.paused || battle.busy);
      const charging = battle && battle.telegraphTurns > 0;
      if (!paused && !charging) {
        const emoji = document.getElementById("enemyEmoji");
        if (emoji && !emoji.hidden) {
          emoji.classList.remove("blink");
          void emoji.offsetWidth;
          emoji.classList.add("blink");
          setTimeout(() => emoji.classList.remove("blink"), 1500);
        }
        // R5 — Sustained lightning crackle for SS2+ transformations.
        const tier = (battle && battle.tier) || 0;
        if (tier >= 3 && Math.random() < (tier >= 7 ? 0.85 : tier >= 5 ? 0.65 : 0.5)) {
          spawnLightning(tier, tier >= 7 ? 4 : 3);
        }
      }
      _enemyIdleTimer = setTimeout(tick, 4000 + Math.random() * 3000);
    };
    _enemyIdleTimer = setTimeout(tick, 4000 + Math.random() * 3000);
  }
  function stopEnemyIdle() {
    if (_enemyIdleTimer) { clearTimeout(_enemyIdleTimer); _enemyIdleTimer = 0; }
  }
  function flashAnswerBoom() {
    const f = $("#answerFlash");
    if (!f) return;
    f.classList.remove("boom"); void f.offsetWidth;
    f.classList.add("boom");
    setTimeout(() => f.classList.remove("boom"), 600);
  }

  // ---------- KO puff -------------------------------------------------------
  function playKoPuff() {
    const sprite = $("#enemySprite");
    if (!sprite) return;
    const emoji = $("#enemyEmoji");
    if (emoji && !emoji.hidden) {
      emoji.classList.remove("ko-spin"); void emoji.offsetWidth;
      emoji.classList.add("ko-spin");
      setTimeout(() => emoji.classList.remove("ko-spin"), 600);
    }
    for (let i = 0; i < 6; i++) {
      const p = _acquireParticle("ko", "ko-puff");
      const ang = (i / 6) * Math.PI * 2;
      const dist = 60 + Math.random() * 40;
      p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      sprite.appendChild(p);
      setTimeout(() => _releaseParticle("ko", p), 700);
    }
    // B1+B2 — KO weight: hit-stop and a camera punch.
    freezeArena(120);
    cameraPunch();
  }

  // A1 — Player KO sequence: slump, desaturate, dim arena. Plays before the
  //      defeat overlay shows.
  function playerKoFx() {
    const sprite = document.querySelector("#playerSprite");
    if (sprite) {
      sprite.classList.remove("ko");
      void sprite.offsetWidth;
      sprite.classList.add("ko");
    }
    const arena = document.querySelector("#screen-battle .arena");
    if (arena) {
      arena.classList.remove("dim-out");
      void arena.offsetWidth;
      arena.classList.add("dim-out");
    }
    // KO puffs around the player too.
    const host = document.querySelector("#playerSprite");
    if (host) {
      const cs = getComputedStyle(host);
      if (cs.position === "static") host.style.position = "relative";
      for (let i = 0; i < 6; i++) {
        const p = _acquireParticle("ko", "ko-puff");
        const ang = (i / 6) * Math.PI * 2;
        const dist = 50 + Math.random() * 35;
        p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
        host.appendChild(p);
        setTimeout(() => _releaseParticle("ko", p), 700);
      }
    }
    freezeArena(160);
    cameraPunch();
  }

  // A2 — Defeat overlay: full-screen red vignette + "DEFEATED" text pop.
  function showDefeatOverlay(subtitle) {
    const ov = document.getElementById("defeatOverlay");
    if (!ov) return;
    const sub = document.getElementById("defeatSub");
    if (sub && subtitle) sub.textContent = subtitle;
    ov.classList.remove("show");
    void ov.offsetWidth;
    ov.classList.add("show");
    setTimeout(() => ov.classList.remove("show"), 1700);
  }

  // A3 — Victory celebration: gold radial bloom + confetti shower.
  function playVictoryConfetti() {
    const layer = document.getElementById("confettiLayer");
    if (!layer) return;
    // Clear any leftover particles from a previous run.
    layer.innerHTML = "";
    // Bloom flash.
    const bloom = document.createElement("div");
    bloom.className = "victory-bloom";
    document.body.appendChild(bloom);
    setTimeout(() => bloom.remove(), 1500);
    // Confetti particles. DOM + CSS vars for parity with existing effects.
    const colors = ["#ffd23f", "#ff7a1a", "#6aa2ff", "#6dffa1", "#ff5c8a", "#ffffff"];
    const count = 60;
    const W = window.innerWidth || 360;
    for (let i = 0; i < count; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      const x0 = (Math.random() * W) - W / 2;
      const drift = (Math.random() * 220) - 110;
      const dur = 1800 + Math.random() * 1400;
      const delay = Math.random() * 350;
      const rot = (Math.random() * 1080) + 360;
      const col = colors[i % colors.length];
      c.style.setProperty("--x0", x0 + "px");
      c.style.setProperty("--x1", (x0 + drift) + "px");
      c.style.setProperty("--dur", dur + "ms");
      c.style.setProperty("--delay", delay + "ms");
      c.style.setProperty("--rot", rot + "deg");
      c.style.setProperty("--c", col);
      // Vary shape slightly: some squares, some thin strips.
      if (i % 3 === 0) { c.style.width = "6px"; c.style.height = "6px"; c.style.borderRadius = "50%"; }
      else if (i % 5 === 0) { c.style.width = "4px"; c.style.height = "18px"; }
      layer.appendChild(c);
      setTimeout(() => c.remove(), dur + delay + 100);
    }
    // Celebratory hit-stop + camera punch on victory beat.
    freezeArena(140);
    cameraPunch();
  }

  // ---------- Telegraph banner ----------------------------------------------
  function renderTelegraphBanner() {
    const banner = $("#telegraphBanner");
    if (!banner) return;
    if (battle.telegraphTurns > 0 && battle.telegraphLabel) {
      banner.hidden = false;
      const moveEl = $("#tbMove");
      const prevMove = moveEl ? moveEl.textContent : "";
      if (moveEl) moveEl.textContent = battle.telegraphLabel;
      // C3 — Replay the clip-path reveal whenever the label changes.
      if (prevMove !== battle.telegraphLabel) revealTelegraphMove();
      const max = battle.telegraphMaxTurns || BATTLE.TELEGRAPH_TURNS;
      const pct = (battle.telegraphTurns / max) * 100;
      $("#tbBarFill").style.width = pct + "%";
      banner.classList.toggle("final", battle.telegraphTurns === 1);
      // #2 Counter-play hint: show when KI Special is ready (only real cancel path).
      const hint = $("#tbHint");
      if (hint) {
        const kiReady = battle && battle.ki >= BATTLE.KI_SPECIAL_COST;
        hint.hidden = !kiReady;
      }
    } else {
      banner.hidden = true;
      banner.classList.remove("final");
    }
  }

  // ---------- KI Special FAB ------------------------------------------------
  function renderKiFab() {
    const fab = $("#kiFab");
    if (!fab) return;
    const ready = battle && battle.ki >= BATTLE.KI_SPECIAL_COST;
    fab.classList.toggle("ready", !!ready);
    fab.disabled = !ready;
  }
  function fireKiSpecial() {
    if (!battle || battle.ki < BATTLE.KI_SPECIAL_COST) return;
    if (battle.busy) return;
    const fab = $("#kiFab");
    if (fab) { fab.classList.add("firing"); setTimeout(() => fab.classList.remove("firing"), 500); }
    Sfx.play("kiCharge");
    setTimeout(() => Sfx.play("kiFire"), 200);
    playFx("ki-cannon");
    shakeArena();
    // C5 — KI special cinematic: zoom on player + dim arena + named overlay
    //      + beam sweep + extra hit-stop. Layered on top of existing FX.
    const _ps = document.querySelector("#playerSprite");
    if (_ps) {
      _ps.classList.remove("ki-cinematic");
      void _ps.offsetWidth;
      _ps.classList.add("ki-cinematic");
      setTimeout(() => _ps.classList.remove("ki-cinematic"), 600);
    }
    const _ar = document.querySelector("#screen-battle .arena");
    if (_ar) {
      _ar.classList.remove("ki-dim");
      void _ar.offsetWidth;
      _ar.classList.add("ki-dim");
      setTimeout(() => _ar.classList.remove("ki-dim"), 600);
    }
    showNamedAttack("KI BLAST!");
    fireBeam("blue");
    playMotionLines("ltr", 8);
    // R5 — DBZ Kamehameha launch beats: ground shockwave under feet, lightning
    //      crackle if transformed, after-image trail (Zanzōken).
    spawnGroundShock(battle.tier || 2);
    if ((battle.tier || 0) >= 3) spawnLightning(battle.tier);
    spawnAfterimage(3);
    freezeArena(140);
    cameraPunch();
    const dmg = Math.round(BATTLE.KI_SPECIAL_DMG_BASE + state.level * BATTLE.KI_SPECIAL_DMG_PER_LVL);
    const _ePrevPct = (battle.enemy.hp / battle.enemy.maxHp) * 100;
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    ghostDrainHp("#enemyHpFill", _ePrevPct, (battle.enemy.hp / battle.enemy.maxHp) * 100);
    popDamage(".combatant.enemy", dmg, "crit");
    flashSprite("#enemySprite", { crit: true });
    flashHp("#enemyHpFill");
    shakeEl("#enemySprite");
    spawnCritSparks("#enemySprite", 12);
    // Cancel any charging telegraph
    if (battle.telegraphTurns > 0) {
      battle.telegraphTurns = 0;
      battle.telegraphLabel = "";
      battle.telegraphMaxTurns = 0;
      toast(pickRandom(["⚡ Telegraph CANCELLED!", "💥 Telegraph SHATTERED!"]), 1400);
    }
    battle.ki = 0;
    state.battleStats.kiSpecialsUsed = (state.battleStats.kiSpecialsUsed || 0) + 1;
    saveState();
    buzz([15, 30, 60]);
    renderBattle();
    // If KO'd, advance like a normal kill (without re-firing answer logic)
    if (battle.enemy.hp <= 0) {
      battle.lastResult = "correct";
      advanceBattle();
    }
  }

  // ---------- Stage HUD -----------------------------------------------------
  function showStageHud() {
    const hud = $("#stageHud");
    if (hud) hud.style.display = "flex";
  }
  function renderStageHud() {
    const hud = $("#stageHud");
    if (!hud || !battle) return;
    const dotsWrap = $("#stageDots");
    const label = $("#stageLabel");
    const total = Number.isFinite(battle.diff?.fights) ? battle.diff.fights : 12;
    const isEndless = !!battle.diff?.endless;
    if (label) label.textContent = isEndless ? `Stage ${battle.enemyIdx + 1} · Endless` : `Stage ${battle.enemyIdx + 1} / ${total}`;
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      const count = isEndless ? Math.max(10, battle.enemyIdx + 5) : total;
      for (let i = 0; i < count; i++) {
        const d = document.createElement("span");
        d.className = "stage-dot";
        if (i > 0 && i % 5 === 0) d.classList.add("boss");
        if (i < battle.enemyIdx) d.classList.add("lit");
        if (i === battle.enemyIdx) d.classList.add("current");
        dotsWrap.appendChild(d);
      }
    }
  }

  // ---------- Pre-battle intro card -----------------------------------------
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function flavorFor(enemy, idx) {
    const all = [enemy.flavor, ...(enemy.flavorAlts || [])].filter(Boolean);
    if (all.length) return pickRandom(all);
    return enemy.isBoss ? "A serious threat. Stay focused." : "Another challenger appears.";
  }
  function showIntroCard(enemy, idx, onDone) {
    const card = $("#introCard");
    if (!card) { onDone && onDone(); return; }
    // Track that we've seen this enemy template at least once. Used by
    // Focus Mode to skip the intro entirely on subsequent encounters of
    // the same enemy (still shows on first sight + bosses).
    if (!state.battleStats.enemiesSeen) state.battleStats.enemiesSeen = {};
    const seenKey = enemy.name || ("e" + idx);
    const timesSeen = state.battleStats.enemiesSeen[seenKey] || 0;
    state.battleStats.enemiesSeen[seenKey] = timesSeen + 1;
    if (isFocusMode() && !enemy.isBoss && timesSeen > 0) {
      // Skip intro card outright — player has met this minion before.
      Music.setBoss(false);
      onDone && onDone();
      return;
    }
    Music.setBoss(!!enemy.isBoss);
    $("#introTag").textContent = enemy.isBoss ? `BOSS · STAGE ${idx + 1}` : `STAGE ${idx + 1}`;
    const ie = $("#introEmoji");
    if (enemy.isBoss) { ie.textContent = "👑"; }
    else { ie.textContent = enemy.emoji || "👾"; }
    $("#introName").textContent = enemy.name;
    $("#introFlavor").textContent = flavorFor(enemy, idx);
    const introQuote = $("#introQuote");
    if (introQuote) {
      if (enemy.quote) { introQuote.textContent = `“${enemy.quote}”`; introQuote.hidden = false; }
      else { introQuote.textContent = ""; introQuote.hidden = true; }
    }
    $("#introHp").textContent = `HP ${enemy.maxHp}`;
    $("#introTier").textContent = (enemy.tier || "minion").toUpperCase();
    card.classList.toggle("boss", !!enemy.isBoss);
    card.hidden = false;
    if (enemy.isBoss) Sfx.play("telegraphWarn");
    // Bosses get a longer beat so players can read the quote/flavor.
    // Focus Mode trims the (rare) minion intro to a brief flash.
    const focus = isFocusMode();
    const minionMs = focus ? (LEARNING_LOOP.FOCUS_INTRO_MINION_MS || 350) : 800;
    const bossMs = focus ? (LEARNING_LOOP.FOCUS_INTRO_BOSS_MS || 2800) : 2800;
    const dur = enemy.isBoss ? bossMs : minionMs;
    const dismiss = () => {
      card.hidden = true;
      card.removeEventListener("click", dismiss);
      // Trigger enemy-enter animation
      const em = $("#enemyEmoji");
      if (em && !em.hidden) { em.classList.remove("enter"); void em.offsetWidth; em.classList.add("enter"); }
      onDone && onDone();
    };
    card.addEventListener("click", dismiss);
    setTimeout(dismiss, dur);
  }

  // ---------- Pause / Resume / Retreat -------------------------------------
  function pauseBattle() {
    if (!battle || battle.pausedAt) return;
    battle.pausedAt = performance.now();
    $("#pauseOverlay").hidden = false;
  }
  function resumeBattle() {
    if (!battle || !battle.pausedAt) { $("#pauseOverlay").hidden = true; return; }
    const delta = performance.now() - battle.pausedAt;
    // Shift questionStart so timer math sees no missed time
    battle.questionStart += delta;
    battle.pausedAt = 0;
    $("#pauseOverlay").hidden = true;
  }
  function tryRetreat() {
    if (!battle) { showScreen("start"); return; }
    if (state.settings?.confirmRetreat && battle.enemyIdx > 0) {
      // Freeze timer without showing the pause overlay (we're showing the
      // retreat confirm overlay instead). Resume on cancel will unfreeze.
      if (!battle.pausedAt) battle.pausedAt = performance.now();
      $("#confirmRetreat").hidden = false;
    } else {
      showScreen("start");
    }
  }

  // ---------- Onboarding coach marks ----------------------------------------
  const COACH_STEPS = [
    { title: "Welcome, warrior!", body: "Tap the right answer to attack. Wrong answers (or the timer running out) hit you back." },
    { title: "Streak = Power", body: "Keep correct answers chained. At streak 5/10/25 you transform — Kaioken, Super Saiyan, SS Blue." },
    { title: "Watch telegraphs", body: "When you see a red banner, the enemy is charging. It lands in 2 turns. Block with a Streak Shield, or…" },
    { title: "Use your KI Special", body: "When the ⚡ button is gold, tap it to cancel a charging telegraph and deal big damage." },
  ];
  let coachIdx = 0;
  function maybeStartOnboarding() {
    if (!state.settings?.battleHints) return;
    coachIdx = 0;
    showCoachStep();
  }
  function showCoachStep() {
    const overlay = $("#coachOverlay");
    if (!overlay) return;
    if (coachIdx >= COACH_STEPS.length) { closeCoach(); return; }
    overlay.hidden = false;
    pauseBattle();
    const s = COACH_STEPS[coachIdx];
    $("#coachTitle").textContent = s.title;
    $("#coachBody").textContent = s.body;
  }
  function closeCoach() {
    const overlay = $("#coachOverlay");
    if (overlay) overlay.hidden = true;
    resumeBattle();
  }

  // ---------- Pre-battle difficulty selector -------------------------------
  function openPrebattle() {
    const overlay = $("#prebattleOverlay");
    if (!overlay) { startBattle(); return; }
    overlay.hidden = false;
    const cur = state.settings?.difficulty || "normal";
    $$("#diffSegment .diff-opt").forEach(b => b.classList.toggle("active", b.dataset.diff === cur));
    $("#diffDesc").textContent = (DIFFICULTY[cur] || DIFFICULTY.normal).desc;
  }
  function closePrebattleAndStart() {
    $("#prebattleOverlay").hidden = true;
    startBattle();
  }

  // ---------- Run end / Results screen --------------------------------------
  function finishRun(outcome) {
    if (!battle || battle.ended) return;
    battle.ended = true;
    cancelAnimationFrame(battle.timerRaf);
    stopEnemyIdle();
    if (outcome === "victory") {
      Sfx.play("victory");
      playFx("victory");
      // A3 — Confetti shower + gold bloom.
      playVictoryConfetti();
    } else {
      Sfx.play("defeat");
      playFx("defeat");
      // A1 + A2 — Player KO sequence then defeat overlay.
      playerKoFx();
      setTimeout(() => showDefeatOverlay(), 350);
      state.battleStats.losses = (state.battleStats.losses || 0) + 1;
    }
    Music.stop();
    saveState();
    // Stash a snapshot for the results screen
    battle._summary = {
      outcome,
      stage: battle.enemyIdx + (outcome === "victory" ? 0 : 1),
      totalFights: battle.diff?.fights ?? 0,
      isEndless: !!battle.diff?.endless,
      streakBest: battle.streak,
      kos: battle.kosThisRun || 0,
      questions: battle.questionsThisRun || 0,
      correct: battle.correctThisRun || 0,
      ki: state.battleStats.kiSpecialsUsed,
      perfect: !!battle.perfectRun && outcome === "victory",
      runMs: performance.now() - battle.runStartedAt,
      diffLabel: battle.diff?.label || "",
    };
    setTimeout(() => showScreen("battle-results"), outcome === "victory" ? 1500 : 1300);
  }
  let _lastRunSummary = null;
  function renderResultsScreen() {
    if (battle && battle._summary) _lastRunSummary = battle._summary;
    const s = _lastRunSummary;
    const banner = $("#resultsBanner");
    const stage = $("#resultsStage");
    const stats = $("#resultsStats");
    const pbs = $("#resultsPbs");
    if (!s) {
      if (banner) banner.textContent = "—";
      if (stage) stage.textContent = "No recent run.";
      if (stats) stats.innerHTML = "";
      if (pbs) pbs.innerHTML = "";
      return;
    }
    banner.classList.remove("defeat", "endless", "shimmer");
    if (s.outcome === "victory") {
      banner.textContent = s.isEndless ? "ENDLESS RUN" : "VICTORY";
      if (s.isEndless) banner.classList.add("endless");
      // A3 — Shimmer sweep across the victory banner.
      void banner.offsetWidth;
      banner.classList.add("shimmer");
    } else {
      banner.textContent = "DEFEATED";
      banner.classList.add("defeat");
    }
    stage.textContent = s.isEndless
      ? `Reached stage ${s.stage} on ${s.diffLabel}`
      : (s.outcome === "victory" ? `${s.diffLabel} arena cleared` : `Fell at stage ${s.stage} of ${s.totalFights} (${s.diffLabel})`);
    const acc = s.questions > 0 ? Math.round((s.correct / s.questions) * 100) : 0;
    const fmtMs = (ms) => ms < 60000 ? (ms/1000).toFixed(1) + "s" : Math.floor(ms/60000) + "m " + Math.round((ms%60000)/1000) + "s";
    stats.innerHTML = [
      ["Stage", s.stage],
      ["KOs", s.kos],
      ["Accuracy", acc + "%"],
      ["Best Streak", s.streakBest],
      ["KI Specials", s.ki],
      ["Run Time", fmtMs(s.runMs)],
    ].map(([k, v]) => `<div class="results-stat"><div class="label">${k}</div><div class="value">${v}</div></div>`).join("");
    // PB callouts
    const callouts = [];
    if (s.perfect) callouts.push("✨ Perfect Run!");
    if (s.streakBest > 0 && s.streakBest === state.battleStats.bestStreak) callouts.push(`🏆 New best streak: ${s.streakBest}`);
    if (s.isEndless && s.stage >= state.battleStats.bestEnemyIdx) callouts.push(`🏆 New best endless stage: ${s.stage}`);
    pbs.innerHTML = callouts.map(c => `<div class="results-pb">${c}</div>`).join("");

    // Cards missed in this run — the visible payoff for the
    // Battle→Training loop. We resolve ids against the deck and skip any
    // that aren't findable (defensive against deck edits between sessions).
    const reviewBox = $("#resultsReview");
    const reviewList = $("#resultsReviewList");
    const trainBtn = $("#trainMissesBtn");
    const misses = (Array.isArray(state.lastBattleMisses) ? state.lastBattleMisses : [])
      .map(m => ({ m, card: DECK.find(c => c.id === m.cardId) }))
      .filter(x => x.card);
    if (reviewBox && reviewList && misses.length) {
      reviewList.innerHTML = misses.slice(0, 8).map(({ card }) => {
        const en = escapeHtml(card.english || "");
        const pa = escapeHtml(card.punjabi || "");
        return `<li><span class="rv-en">${en}</span><span class="rv-sep">—</span><span class="rv-pa">${pa}</span></li>`;
      }).join("");
      reviewBox.hidden = false;
      if (trainBtn) trainBtn.hidden = false;
    } else if (reviewBox) {
      reviewBox.hidden = true;
      if (trainBtn) trainBtn.hidden = true;
    }

    // Auto-disable hints after first victory
    if (s.outcome === "victory" && state.settings?.battleHints) {
      state.settings.battleHints = false;
      saveState();
    }
  }

  // ---------- Battle Records (settings panel) -------------------------------
  function renderBattleRecords() {
    const ul = $("#recordsList");
    if (!ul) return;
    const s = state.battleStats || {};
    const fmtMs = (ms) => !ms ? "—" : (ms < 60000 ? (ms/1000).toFixed(1) + "s" : Math.floor(ms/60000) + "m " + Math.round((ms%60000)/1000) + "s");
    const acc = (s.totalQuestions || 0) > 0 ? Math.round(((s.totalCorrect || 0) / s.totalQuestions) * 100) : 0;
    const rows = [
      ["Wins", s.wins || 0],
      ["Losses", s.losses || 0],
      ["Runs started", s.runs || 0],
      ["Best streak", s.bestStreak || 0],
      ["Perfect runs", s.perfectRuns || 0],
      ["Fastest KO", fmtMs(s.fastestKoMs)],
      ["Best endless stage", s.bestEnemyIdx || 0],
      ["KI specials used", s.kiSpecialsUsed || 0],
      ["Lifetime accuracy", acc + "%"],
    ];
    ul.innerHTML = rows.map(([k, v]) => `<li><span class="label">${k}</span><span class="value">${v}</span></li>`).join("");
  }

  // ---------- Random Training Interrupts -------------------------------------
  // Multiple-choice helper; supports "confuse" mode (similar-prefix distractors).
  // IMPORTANT: filters distractors so none share the same answer text as the
  // correct card — otherwise a user could tap a "wrong" button whose visible
  // text matches the correct answer and be marked wrong (a real footgun on
  // decks where two distinct cards happen to map to the same gloss).
  function buildChoices(card, opts = {}) {
    const { mode = "normal", reverse = false } = opts;
    const norm = (s) => (s || "").toString().toLowerCase().trim();
    const correctText = norm(reverse ? card.punjabi : card.english);
    const distinctText = (c) => norm(reverse ? c.punjabi : c.english) !== correctText;
    const others = DECK.filter(c => c.id !== card.id && distinctText(c));
    let pool;
    if (mode === "confuse") {
      const prefix = (card.punjabi || "").slice(0, 2).toLowerCase();
      const sim = others.filter(c => (c.punjabi || "").toLowerCase().startsWith(prefix));
      pool = sim.length >= 3 ? sim : others.filter(c => c.type === card.type);
      if (pool.length < 3) pool = others;
    } else {
      const sameType = others.filter(c => c.type === card.type);
      pool = sameType.length >= 3 ? sameType : others;
    }
    // De-duplicate distractors by their displayed answer text too, so no two
    // buttons show identical strings.
    const seen = new Set([correctText]);
    const uniquePool = [];
    for (const c of shuffle(pool)) {
      const t = norm(reverse ? c.punjabi : c.english);
      if (seen.has(t)) continue;
      seen.add(t);
      uniquePool.push(c);
      if (uniquePool.length >= 3) break;
    }
    // Fallback: if filtering left us short (tiny deck edge case), top up from
    // the broader DECK while still excluding the correct card by id.
    if (uniquePool.length < 3) {
      for (const c of shuffle(DECK.filter(d => d.id !== card.id))) {
        const t = norm(reverse ? c.punjabi : c.english);
        if (seen.has(t)) continue;
        seen.add(t);
        uniquePool.push(c);
        if (uniquePool.length >= 3) break;
      }
    }
    const distract = uniquePool.slice(0, 3);
    const allCards = shuffle([card, ...distract]);
    const choices = allCards.map(c => reverse ? c.punjabi : c.english);
    const correctIdx = allCards.indexOf(card);
    return {
      choices,
      cards: allCards,           // parallel array of card objects per slot
      correctIdx,
      correctText: reverse ? card.punjabi : card.english,
      reverse,
    };
  }

  function pickWeightedKind() {
    const w = INTERRUPT.WEIGHTS;
    const total = w.speed + w.recall + w.incoming;
    let r = Math.random() * total;
    if ((r -= w.speed)    < 0) return "speed";
    if ((r -= w.recall)   < 0) return "recall";
    return "incoming";
  }

  function maybeInterrupt() {
    if (!state.settings?.interrupts) return false;
    if (train.eventActive) return false;
    const focus = isFocusMode();

    // Focus Mode: don't pile interrupts on a beginner who hasn't built
    // up a meaningful review queue yet. Wait until they've graduated
    // FOCUS_INTERRUPT_MIN_GRADUATED cards before any random events fire.
    // Forced events (repeat-miss / stale) still run — they're directly
    // pedagogical.
    let gradCount = 0;
    if (focus) {
      for (const id in state.srs) {
        const sr = state.srs[id];
        if (sr && (sr.queue === "review" || sr.queue === "relearning")) gradCount++;
      }
    }

    // 1) Forced: same word missed twice -> Incoming Attack with that word.
    if (train.repeatMissId) {
      return startInterruptEvent("incoming", { forcedCardId: train.repeatMissId });
    }

    // 2) Forced: very stale cards exist -> Recall Attack (with 3-card cooldown).
    if (hasStaleCards() && train.cardsSinceInterrupt >= 3) {
      if (Math.random() < 0.7) return startInterruptEvent("recall");
    }

    // Beginner gate — silence random events under focus until the deck
    // has a substantive review queue.
    if (focus && gradCount < (LEARNING_LOOP.FOCUS_INTERRUPT_MIN_GRADUATED || 30)) return false;

    // 3) Probabilistic: respect cooldown window. Focus tightens both the
    //    cooldown floor and the per-question chance.
    const minBetween = focus
      ? (LEARNING_LOOP.FOCUS_INTERRUPT_MIN_BETWEEN || 8)
      : INTERRUPT.MIN_CARDS_BETWEEN;
    const baseChance = focus
      ? (LEARNING_LOOP.FOCUS_INTERRUPT_BASE_CHANCE || 0.18)
      : INTERRUPT.BASE_CHANCE;
    if (train.cardsSinceInterrupt < minBetween) return false;
    const window = INTERRUPT.MAX_CARDS_BETWEEN - minBetween;
    const ramp = Math.min(1, (train.cardsSinceInterrupt - minBetween) / Math.max(1, window));
    const chance = baseChance * (0.5 + 0.5 * ramp);
    if (Math.random() > chance && train.cardsSinceInterrupt < INTERRUPT.MAX_CARDS_BETWEEN) return false;

    return startInterruptEvent(pickWeightedKind());
  }

  function hasStaleCards() {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    if (!state.review) return false;
    return DECK.some(c => {
      const r = state.review[c.id];
      const seen = state.srs[c.id]?.seen || 0;
      return seen > 0 && r && r.lastSeenAt > 0 && (now - r.lastSeenAt) > week;
    });
  }

  function pickRecallTarget() {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const day  = 24 * 60 * 60 * 1000;
    const fiveMin = 5 * 60 * 1000;
    const seenIds = DECK.filter(c => (state.srs[c.id]?.seen || 0) > 0);
    // Highest-ROI targets first: cards the user has actually missed (lapses
    // or recent misses) — these are exactly where retrieval practice pays
    // off most. Then fall back to time-stale cards.
    const lapsed = seenIds.filter(c => (state.srs[c.id]?.lapses || 0) > 0
                                    || (state.review?.[c.id]?.missCount || 0) > 0);
    const shaky  = seenIds.filter(c => state.shakyCards && state.shakyCards[c.id]);
    const tiers = [
      shaky,
      lapsed,
      seenIds.filter(c => now - (state.review?.[c.id]?.lastSeenAt || 0) > week),
      seenIds.filter(c => now - (state.review?.[c.id]?.lastSeenAt || 0) > day),
      seenIds.filter(c => now - (state.review?.[c.id]?.lastSeenAt || 0) > fiveMin),
    ];
    for (const t of tiers) if (t.length) return t[Math.floor(Math.random() * t.length)];
    if (train.recentIds.length) {
      const id = train.recentIds[Math.floor(Math.random() * train.recentIds.length)];
      const card = DECK.find(c => c.id === id);
      if (card) return card;
    }
    return train.current || DECK[Math.floor(Math.random() * DECK.length)];
  }

  function pickIncomingTarget(forcedCardId) {
    if (forcedCardId) {
      const c = DECK.find(c => c.id === forcedCardId);
      if (c) return c;
    }
    // Highest miss count among seen cards
    const seen = DECK.filter(c => (state.srs[c.id]?.seen || 0) > 0);
    seen.sort((a, b) => (state.review?.[b.id]?.missCount || 0) - (state.review?.[a.id]?.missCount || 0));
    if (seen.length && (state.review?.[seen[0].id]?.missCount || 0) > 0) return seen[0];
    return train.current || DECK[Math.floor(Math.random() * DECK.length)];
  }

  // Active event runtime
  let trainEvent = null;

  function startInterruptEvent(kind, opts = {}) {
    if (train.eventActive) return false;
    train.eventActive = true;
    train.cardsSinceInterrupt = 0;
    clearTimeout(train.idleTimer);

    const panel = $("#trainEvent");
    if (!panel) { train.eventActive = false; return false; }
    panel.dataset.kind = kind;
    panel.hidden = false;
    $("#flashcard").hidden = true;
    $("#srsRow").hidden = true;

    trainEvent = {
      kind,
      score: 0,
      combo: 0,
      maxCombo: 0,
      durationMs: 0,
      startedAt: 0,
      busy: false,
      currentCard: null,
      currentCorrectIdx: -1,
      mode: "normal",
      reverse: false,
    };

    if (kind === "speed")    setupSpeedBurst();
    if (kind === "recall")   setupRecallAttack();
    if (kind === "incoming") setupIncomingAttack(opts.forcedCardId);
    return true;
  }

  function setupSpeedBurst() {
    const en2pa = isReverse();
    $("#eventIcon").textContent = "⚡";
    $("#eventTitle").textContent = "ENERGY SURGE DETECTED!";
    $("#eventPromptLabel").textContent = en2pa
      ? "Translate to Punjabi:"
      : "Translate to English:";
    trainEvent.durationMs = INTERRUPT.SPEED_DURATION_MS;
    trainEvent.mode = "normal";
    trainEvent.reverse = en2pa;
    trainEvent.askedIds = new Set();
    playFx("gold-burst");
    shakeEl("#trainEvent");
    nextEventQuestion();
    startEventTimer();
  }

  function setupRecallAttack() {
    const en2pa = isReverse();
    $("#eventIcon").textContent = "🧠";
    $("#eventTitle").textContent = "MEMORY CLONE HAS RETURNED!";
    $("#eventPromptLabel").textContent = en2pa
      ? "What's this in Punjabi?"
      : "What did this mean?";
    trainEvent.durationMs = INTERRUPT.RECALL_DURATION_MS;
    trainEvent.mode = "normal";
    trainEvent.reverse = en2pa;
    trainEvent.fixedCard = pickRecallTarget();
    playFx("memory-clone");
    nextEventQuestion();
    startEventTimer();
  }

  function setupIncomingAttack(forcedCardId) {
    // Frieza Mind Trap is intentionally the harder direction for the learner:
    // English-native learners find Punjabi-as-answer harder, so this event
    // ALWAYS asks in English and shows Punjabi answer choices, regardless of
    // the user's learning-direction setting.
    $("#eventIcon").textContent = "☠️";
    $("#eventTitle").textContent = "INCOMING ATTACK — FRIEZA MIND TRAP!";
    $("#eventPromptLabel").textContent = "Which Punjabi word means:";
    trainEvent.durationMs = INTERRUPT.INCOMING_DURATION_MS;
    trainEvent.mode = "confuse";
    trainEvent.reverse = true; // force English prompt + Punjabi answer choices
    trainEvent.fixedCard = pickIncomingTarget(forcedCardId);
    train.repeatMissId = null;
    playFx("frieza-trap");
    nextEventQuestion();
    startEventTimer();
  }

  function nextEventQuestion() {
    let card;
    if (trainEvent.kind === "speed") {
      // Lag-based recall: if a card was just missed in this burst, re-ask it
      // after ~3 intervening questions. This is one of the strongest known
      // techniques for moving items into long-term memory.
      const reaskQueue = trainEvent.reaskQueue || [];
      let due = null;
      for (let i = 0; i < reaskQueue.length; i++) {
        reaskQueue[i].lag -= 1;
        if (reaskQueue[i].lag <= 0 && !due) {
          due = reaskQueue[i].card;
          reaskQueue.splice(i, 1);
          break;
        }
      }
      trainEvent.reaskQueue = reaskQueue;
      if (due) {
        card = due;
      } else {
        // Comprehensible-input principle: only ask cards the learner has
        // actually been introduced to. Brand-new cards thrown at the user
        // under a 20s timer just teach "I don't know any of these".
        const asked = trainEvent.askedIds || new Set();
        const seenPool = DECK.filter(c => (state.srs[c.id]?.seen || 0) > 0
                                      && !state.srs[c.id]?.suspended);
        // Bias: weight cards by how shaky they are. Each due/lapsed card
        // gets extra entries so they appear ~2–3× more often than mastered
        // cards inside the same burst.
        const weighted = [];
        for (const c of seenPool) {
          if (asked.has(c.id)) continue;
          const s = state.srs[c.id] || {};
          const r = state.review?.[c.id] || {};
          let w = 1;
          if (state.shakyCards && state.shakyCards[c.id]) w += 2;
          if ((s.lapses || 0) > 0) w += 1;
          if ((r.missCount || 0) > 0) w += 1;
          if ((s.due || 0) <= Date.now()) w += 1;
          for (let i = 0; i < w; i++) weighted.push(c);
        }
        let pool = weighted.length ? weighted
                : seenPool.filter(c => !asked.has(c.id));
        if (!pool.length) {
          // Fallback: tier-gated NEW cards if no seen pool yet (very fresh save)
          asked.clear();
          pool = seenPool.length ? seenPool
               : DECK.filter(c => cardTier(c) <= unlockedTierForLevel(state.level));
          if (!pool.length) pool = DECK;
        }
        card = pool[Math.floor(Math.random() * pool.length)];
        asked.add(card.id);
        trainEvent.askedIds = asked;
      }
    } else {
      card = trainEvent.fixedCard;
    }
    const built = buildChoices(card, { mode: trainEvent.mode, reverse: trainEvent.reverse });
    trainEvent.currentCard = card;
    trainEvent.currentCorrectIdx = built.correctIdx;
    trainEvent.currentChoiceCards = built.cards;
    const promptEl = $("#eventPrompt");
    if (trainEvent.reverse) {
      // English prompt
      promptEl.textContent = card.english;
    } else {
      // Punjabi prompt — Gurmukhi over roman
      renderPunjabi(promptEl, card);
    }
    const btns = $$("#eventChoices .choice");
    btns.forEach((b, i) => {
      const cardI = built.cards[i];
      if (trainEvent.reverse && cardI) {
        b.innerHTML = punjabiHtml(cardI);
      } else {
        b.textContent = built.choices[i] || "";
      }
      b.classList.remove("correct", "wrong");
      b.disabled = false;
      // Subtle re-animate on each new Speed Burst question so the rapid
      // refresh registers visually instead of looking like a static panel.
      if (trainEvent.kind === "speed") {
        b.style.animation = "none";
        // Force reflow then re-apply so the keyframes restart.
         
        b.offsetWidth;
        b.style.animation = "";
      }
    });
    $("#eventCombo").textContent = String(trainEvent.combo);
    $("#eventScore").textContent = String(trainEvent.score);
    trainEvent.busy = false;
    // Focus first choice for keyboard / a11y
    if (btns[0]) {
      try { btns[0].focus({ preventScroll: true }); } catch {}
    }
  }

  function startEventTimer() {
    trainEvent.startedAt = performance.now();
    cancelAnimationFrame(startEventTimer._raf);
    const tick = (t) => {
      if (!trainEvent) return;
      const elapsed = t - trainEvent.startedAt;
      const left = Math.max(0, trainEvent.durationMs - elapsed);
      const pct = (left / trainEvent.durationMs) * 100;
      const fill = $("#eventTimerFill");
      if (fill) fill.style.width = pct + "%";
      if (left <= 0) {
        finishTrainEvent("timeout");
        return;
      }
      startEventTimer._raf = requestAnimationFrame(tick);
    };
    startEventTimer._raf = requestAnimationFrame(tick);
  }

  function onEventChoice(i) {
    if (!trainEvent || trainEvent.busy) return;
    trainEvent.busy = true;
    const correct = (i === trainEvent.currentCorrectIdx);
    const btns = $$("#eventChoices .choice");
    btns.forEach(b => b.disabled = true);
    btns[i].classList.add(correct ? "correct" : "wrong");
    if (!correct) btns[trainEvent.currentCorrectIdx].classList.add("correct");
    // Reuse the same green/red full-screen flash Battle Mode uses so the
    // feedback is unmistakable on Energy Surge and the other interrupts.
    flashAnswer(correct ? "correct" : "wrong");

    const card = trainEvent.currentCard;
    if (correct) {
      trainEvent.combo += 1;
      trainEvent.maxCombo = Math.max(trainEvent.maxCombo, trainEvent.combo);
      trainEvent.score += 1;
      logReview(card.id, true);
      shakeEl("#trainEvent");
    } else {
      trainEvent.combo = 0;
      // Speed Burst is high-pressure; don't over-penalize the SRS miss counters.
      logReview(card.id, false, { light: trainEvent.kind === "speed" });
      // Pedagogy: on a wrong answer, briefly toast the full pairing so the
      // brain encodes the answer rather than just "I got it wrong". The
      // colour-coded correct button alone doesn't help in reverse mode where
      // a beginner may not know what the highlighted Punjabi word means.
      const pa = (card.punjabi || "").trim();
      const en = (card.english || "").trim();
      if (pa && en) toast(`${pa} = ${en}`, 1400);
      // Lag-based recall: re-ask this missed card later in the same Speed
      // Burst (3 intervening questions). One of the strongest known
      // long-term-retention techniques.
      if (trainEvent.kind === "speed") {
        if (!Array.isArray(trainEvent.reaskQueue)) trainEvent.reaskQueue = [];
        if (!trainEvent.reaskQueue.some(x => x.card.id === card.id)) {
          trainEvent.reaskQueue.push({ card, lag: 3 });
        }
      }
    }

    if (trainEvent.kind === "speed") {
      // Rapid loop: keep questions snappy on a correct answer, but on a wrong
      // answer hold the panel longer so the green-highlighted correct choice
      // is actually readable before the next question replaces it.
      const delay = correct ? 260 : 900;
      setTimeout(() => {
        if (!trainEvent) return;
        nextEventQuestion();
      }, delay);
    } else {
      // Single-question events: a touch longer on misses for the same reason.
      setTimeout(() => finishTrainEvent(correct ? "correct" : "wrong"), correct ? 700 : 1000);
    }
  }

  function finishTrainEvent(reason) {
    if (!trainEvent) return;
    cancelAnimationFrame(startEventTimer._raf);
    const ev = trainEvent;
    let summary = "";

    // For non-speed events ending without a user pick (timeout/forfeit),
    // briefly reveal which choice was correct so the learner closes the loop.
    // We mark the event as already-revealed and re-enter after a short delay.
    const noPick = (reason === "timeout" || reason === "forfeit");
    if (noPick && ev.kind !== "speed" && !ev._revealed && typeof ev.currentCorrectIdx === "number") {
      ev._revealed = true;
      const btns = $$("#eventChoices .choice");
      btns.forEach(b => { b.disabled = true; b.classList.remove("correct", "wrong"); });
      const correctBtn = btns[ev.currentCorrectIdx];
      if (correctBtn) correctBtn.classList.add("correct");
      // Show the full pairing so timeouts still teach the answer.
      const c = ev.currentCard;
      if (c) {
        const pa = (c.punjabi || "").trim();
        const en = (c.english || "").trim();
        if (pa && en) toast(`${pa} = ${en}`, 1400);
      }
      setTimeout(() => {
        if (!trainEvent) return;
        finishTrainEvent(reason);
      }, 700);
      return;
    }

    if (ev.kind === "speed") {
      const xp = ev.score * 3 + ev.maxCombo * 5;
      gainXp(xp);
      state.kiCharge = clamp((state.kiCharge || 0) + Math.min(20, ev.score * 2), 0, 999);
      state.badges.speed = (state.badges.speed || 0) + 1;
      summary = `⚡ Speed Burst: ${ev.score} correct, x${ev.maxCombo} combo → +${xp} XP`;
    } else if (ev.kind === "recall") {
      if (reason === "correct") {
        gainXp(15);
        const srs = state.srs[ev.currentCard.id];
        if (srs) srs.mastery = clamp(srs.mastery + 5, 0, 100);
        state.badges.recall = (state.badges.recall || 0) + 1;
        summary = "🧠 Recall Attack defeated! +15 XP & mastery boost";
      } else {
        const srs = state.srs[ev.currentCard.id];
        if (srs) {
          srs.interval = Math.max(0, Math.round((srs.interval || 1) * 0.5));
          srs.due = Date.now() + 60_000;
        }
        summary = "🧠 Memory faded… we'll review it sooner.";
      }
    } else if (ev.kind === "incoming") {
      if (reason === "correct") {
        gainXp(12);
        state.streakShield = clamp((state.streakShield || 0) + 1, 0, INTERRUPT.SHIELD_CAP);
        state.badges.incoming = (state.badges.incoming || 0) + 1;
        summary = `☠️ Trap survived! +1 🛡️ Streak Shield (${state.streakShield}/${INTERRUPT.SHIELD_CAP})`;
      } else {
        train.repeatMissId = ev.currentCard.id;
        summary = "☠️ Trap caught you! That word will return.";
      }
    }

    saveState();
    if (summary) toast(summary, 2200);
    closeTrainEvent(false);
    train.eventActive = false;
    train.forceIdleSpeed = false;
    // Resume normal flow
    train.current = pickNextCard();
    train.revealed = false;
    renderCard();
    updateTrainStats();
    updateTrainHud();
    armIdleTimer();
  }

  function closeTrainEvent(silent) {
    cancelAnimationFrame(startEventTimer._raf);
    const panel = $("#trainEvent");
    if (panel) {
      panel.hidden = true;
      panel.removeAttribute("data-kind");
    }
    const fc = $("#flashcard"); if (fc) fc.hidden = false;
    if (!silent) {/* no-op */}
    trainEvent = null;
  }

  // ---------- Wire up DOM -----------------------------------------------------
  function wire() {
    // Ripple coordinates for .big-btn (radial highlight follows the press point)
    document.body.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".big-btn");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      btn.style.setProperty("--my", ((e.clientY - r.top)  / r.height) * 100 + "%");
    }, { passive: true });

    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action]");
      if (!t) return;
      switch (t.dataset.action) {
        case "goto-train":    showScreen("train"); break;
        case "goto-battle":   showScreen("battle"); break;
        case "goto-medicine": showScreen("medicine"); break;
        case "goto-settings": showScreen("settings"); break;
        case "goto-start":    showScreen("start"); break;
        case "train-misses": {
          // Seed the picker queue with up to BATTLE_MISS_BUFFER recent
          // misses, then jump to Train. The first few cards will be the
          // missed ones; SRS resumes after.
          const ids = (Array.isArray(state.lastBattleMisses) ? state.lastBattleMisses : [])
            .map(m => m && m.cardId).filter(Boolean);
          train.preferMissesQueue = ids.slice(0, LEARNING_LOOP.BATTLE_MISS_BUFFER);
          showScreen("train");
          break;
        }
      }
    });

    $("#hudHomeBtn").addEventListener("click", () => showScreen("start"));

    $("#revealBtn").addEventListener("click", () => {
      train.revealed = true;
      train.revealedAt = Date.now();
      renderCard();
      armIdleTimer();
    });

    // Allow tapping anywhere on the front face to reveal — bigger hit target,
    // matches how most flashcard apps behave on mobile.
    $("#flashcard").addEventListener("click", (e) => {
      if (train.revealed) return;
      // Ignore taps on the speaker icon so audio playback doesn't double as a reveal.
      if (e.target.closest(".speak-btn")) return;
      // The Reveal button has its own listener; don't double-fire.
      if (e.target.closest("#revealBtn")) return;
      train.revealed = true;
      train.revealedAt = Date.now();
      renderCard();
      armIdleTimer();
    });

    // Header "Details ▾" toggle: hides the breakdown chips + 7-day forecast
    // by default so the Training screen opens with a clean, low-noise header.
    const detailsToggle = $("#srsDetailsToggle");
    const detailsWrap = $("#srsDetailsWrap");
    if (detailsToggle && detailsWrap) {
      // Restore last preference (default: collapsed).
      const open = !!state.settings?.trainDetailsOpen;
      detailsWrap.hidden = !open;
      detailsToggle.setAttribute("aria-expanded", String(open));
      detailsToggle.textContent = open ? "Details \u25b4" : "Details \u25be";
      detailsToggle.addEventListener("click", () => {
        const nextOpen = detailsWrap.hidden;
        detailsWrap.hidden = !nextOpen;
        detailsToggle.setAttribute("aria-expanded", String(nextOpen));
        detailsToggle.textContent = nextOpen ? "Details \u25b4" : "Details \u25be";
        if (!state.settings) state.settings = {};
        state.settings.trainDetailsOpen = nextOpen;
        saveState();
      });
    }

    $("#srsRow").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-grade]");
      if (!btn) return;
      gradeCard(btn.dataset.grade);
    });

    // Bury button on the back face: snooze the current card until tomorrow.
    const buryBtn = $("#buryBtn");
    if (buryBtn) {
      buryBtn.addEventListener("click", () => {
        if (!train.current || !train.revealed) return;
        buryUntilTomorrow(train.current.id);
      });
    }

    // Allow space/enter to reveal on flashcard
    $("#flashcard").addEventListener("keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && !train.revealed) {
        e.preventDefault();
        train.revealed = true;
        train.revealedAt = Date.now();
        renderCard();
        armIdleTimer();
      }
    });

    // Document-level Training shortcuts:
    //   space / enter  -> reveal, or grade "good" once revealed
    //   1 / 2 / 3 / 4  -> again / hard / good / easy (only after reveal)
    //   b              -> bury until tomorrow (only after reveal)
    // All shortcuts are scoped to the active Training screen and bail out
    // when an interrupt panel is open, when typing in a form field, or on
    // key-repeat to avoid runaway grading.
    document.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (trainEvent) return; // event-panel handler below owns digits during interrupts
      const active = document.querySelector(".screen.active");
      if (!active || active.dataset.screen !== "train") return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      if (key === " " || key === "Enter") {
        if (!train.revealed) {
          e.preventDefault();
          train.revealed = true;
          train.revealedAt = Date.now();
          renderCard();
          armIdleTimer();
        } else {
          e.preventDefault();
          gradeCard("good");
        }
        return;
      }
      if (!train.revealed) return;
      const gradeMap = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
      if (gradeMap[key]) {
        e.preventDefault();
        gradeCard(gradeMap[key]);
        return;
      }
      if (key === "b" || key === "B") {
        e.preventDefault();
        if (train.current) buryUntilTomorrow(train.current.id);
      }
    });

    $("#choices").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b) return;
      onChoice(Number(b.dataset.i));
    });

    // Train event panel: choice clicks + forfeit
    $("#eventChoices").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b) return;
      onEventChoice(Number(b.dataset.i));
    });
    $("#eventForfeit").addEventListener("click", () => {
      if (trainEvent) finishTrainEvent("forfeit");
    });
    document.addEventListener("keydown", (e) => {
      if (!trainEvent) return;
      if (e.key === "Escape") { finishTrainEvent("forfeit"); return; }
      // Numeric 1-4 to pick a choice during any train event.
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1;
        const btns = $$("#eventChoices .choice");
        if (btns[idx] && !btns[idx].disabled) {
          e.preventDefault();
          onEventChoice(idx);
        }
      }
    });

    // Settings: interrupts toggle
    const intToggle = $("#interruptsToggle");
    if (intToggle) {
      intToggle.checked = !!state.settings?.interrupts;
      intToggle.addEventListener("change", () => {
        if (!state.settings) state.settings = {};
        state.settings.interrupts = intToggle.checked;
        saveState();
        toast(`Random events ${intToggle.checked ? "enabled" : "disabled"}`);
      });
    }

    // Settings: Punjabi audio auto-play toggle
    const ttsToggle = $("#ttsAutoplayToggle");
    if (ttsToggle) {
      ttsToggle.checked = !!state.settings?.ttsAutoplay;
      ttsToggle.addEventListener("change", () => {
        if (!state.settings) state.settings = {};
        state.settings.ttsAutoplay = ttsToggle.checked;
        saveState();
        toast(`Audio auto-play ${ttsToggle.checked ? "enabled" : "disabled"}`);
      });
    }

    // Settings: Learning Direction segmented control
    const dirSeg = $("#directionSegment");
    if (dirSeg) {
      const refreshDirUI = () => {
        const cur = (state.settings && state.settings.direction) || "en2pa";
        dirSeg.querySelectorAll(".diff-opt").forEach(b => {
          b.classList.toggle("active", b.dataset.dir === cur);
        });
      };
      refreshDirUI();
      dirSeg.addEventListener("click", (e) => {
        const btn = e.target.closest(".diff-opt");
        if (!btn) return;
        const dir = btn.dataset.dir;
        if (dir !== "en2pa" && dir !== "pa2en") return;
        if (!state.settings) state.settings = {};
        if (state.settings.direction === dir) return;
        state.settings.direction = dir;
        saveState();
        applyDirectionAttr();
        refreshDirUI();
        toast(dir === "en2pa" ? "Mode: English → Punjabi" : "Mode: Punjabi → English");
        // Re-render Train flashcard now if visible (no in-flight question to disrupt).
        const trainScreen = document.querySelector("#screen-train");
        if (trainScreen?.classList.contains("active") && train?.current) {
          renderCard();
        }
        // Battle: applies on the next question to avoid jarring mid-fight swap.
      });
    }

    // Speaker buttons. The BACK face now has explicit per-language buttons
    // (PA + EN) so learners can hear either side at will. The FRONT face has
    // a single button that matches whichever language is shown there.
    const langForFront = () => (isReverse() ? "en" : "pa");
    const speakAt = (lang) => (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (train?.current) speakCard(train.current, { lang });
    };
    const sFront   = $("#speakFront");
    const sBackPa  = $("#speakBackPa");
    const sBackEn  = $("#speakBackEn");
    if (sFront)  { tts.speakingButtons.add(sFront);  sFront.addEventListener("click",  (e) => speakAt(langForFront())(e)); }
    if (sBackPa) { tts.speakingButtons.add(sBackPa); sBackPa.addEventListener("click", speakAt("pa")); }
    if (sBackEn) { tts.speakingButtons.add(sBackEn); sBackEn.addEventListener("click", speakAt("en")); }

    // Initialize TTS voice list (async on some browsers)
    loadVoicesOnce();
    // Show one-time hint if we likely have no Punjabi audio path
    setTimeout(maybeShowVoiceHint, 1500);

    // ---- Audio Debug Panel (triple-tap header to open) ----------------------
    // Lets us see on the iPhone exactly which voices are detected and what
    // happens on each speak call.
    installAudioDebugPanel();

    // Apply learning-direction body flag and audit Gurmukhi coverage
    applyDirectionAttr();
    auditGurmukhiMap();

    $("#resetBtn").addEventListener("click", () => {
      if (confirm("Reset all progress? This cannot be undone.")) {
        resetProgress();
        toast("Progress reset.");
        updateHud();
        showScreen("start");
      }
    });

    // ============== BATTLE V2 WIRE-UP ===============
    // Pause / resume
    const pauseBtn = $("#pauseBtn");
    if (pauseBtn) pauseBtn.addEventListener("click", () => { Sfx.play("select"); pauseBattle(); });
    const resumeBtn = $("#resumeBtn");
    if (resumeBtn) resumeBtn.addEventListener("click", () => { Sfx.play("select"); resumeBattle(); });
    const pauseRetreatBtn = $("#pauseRetreatBtn");
    if (pauseRetreatBtn) pauseRetreatBtn.addEventListener("click", () => {
      $("#pauseOverlay").hidden = true;
      $("#confirmRetreat").hidden = false;
    });

    // Retreat flow
    const retreatBtn = $("#retreatBtn");
    if (retreatBtn) retreatBtn.addEventListener("click", () => { Sfx.play("select"); tryRetreat(); });
    const cancelRetreat = $("#cancelRetreat");
    if (cancelRetreat) cancelRetreat.addEventListener("click", () => {
      $("#confirmRetreat").hidden = true;
      // Always reach back into resume — handles both pause-overlay path
      // (from #pauseRetreatBtn) and freeze-only path (from #retreatBtn).
      resumeBattle();
    });
    const confirmRetreatBtn = $("#confirmRetreatBtn");
    if (confirmRetreatBtn) confirmRetreatBtn.addEventListener("click", () => {
      $("#confirmRetreat").hidden = true;
      if (battle) { battle.ended = true; Music.stop(); cancelAnimationFrame(battle.timerRaf); }
      battle = null;
      showScreen("start");
    });

    // KI special FAB
    const kiFab = $("#kiFab");
    if (kiFab) kiFab.addEventListener("click", () => fireKiSpecial());

    // Coach overlay
    const coachNext = $("#coachNext");
    if (coachNext) coachNext.addEventListener("click", () => { Sfx.play("select"); coachIdx += 1; if (coachIdx >= COACH_STEPS.length) closeCoach(); else showCoachStep(); });
    const coachSkip = $("#coachSkip");
    if (coachSkip) coachSkip.addEventListener("click", () => { state.settings.battleHints = false; saveState(); closeCoach(); });

    // Pre-battle difficulty selector
    const diffSeg = $("#diffSegment");
    if (diffSeg) diffSeg.addEventListener("click", (e) => {
      const btn = e.target.closest(".diff-opt"); if (!btn) return;
      const d = btn.dataset.diff;
      if (!DIFFICULTY[d]) return;
      state.settings.difficulty = d;
      saveState();
      $$("#diffSegment .diff-opt").forEach(b => b.classList.toggle("active", b === btn));
      $("#diffDesc").textContent = DIFFICULTY[d].desc;
      Sfx.play("select");
    });
    const startRunBtn = $("#startRunBtn");
    if (startRunBtn) startRunBtn.addEventListener("click", () => { Sfx.init(); Sfx.play("select"); closePrebattleAndStart(); });
    const prebattleCancel = $("#prebattleCancel");
    if (prebattleCancel) prebattleCancel.addEventListener("click", () => {
      $("#prebattleOverlay").hidden = true;
      showScreen("start");
    });

    // Settings: audio sliders
    const syncSliderFill = (el) => {
      if (!el) return;
      const min = Number(el.min || 0), max = Number(el.max || 100);
      const pct = ((Number(el.value) - min) / (max - min)) * 100;
      el.style.setProperty("--val", pct + "%");
    };
    const sfxVol = $("#sfxVol");
    if (sfxVol) {
      sfxVol.value = String(Math.round((state.settings?.audio?.sfx ?? 0.7) * 100));
      const lbl = $("#sfxVolLabel"); if (lbl) lbl.textContent = sfxVol.value + "%";
      syncSliderFill(sfxVol);
      sfxVol.addEventListener("input", () => {
        state.settings.audio.sfx = Number(sfxVol.value) / 100;
        if (lbl) lbl.textContent = sfxVol.value + "%";
        syncSliderFill(sfxVol);
        Sfx.applyVolumes();
        saveState();
      });
      sfxVol.addEventListener("change", () => { Sfx.init(); Sfx.play("select"); });
    }
    const musicVol = $("#musicVol");
    if (musicVol) {
      musicVol.value = String(Math.round((state.settings?.audio?.music ?? 0.4) * 100));
      const lbl = $("#musicVolLabel"); if (lbl) lbl.textContent = musicVol.value + "%";
      syncSliderFill(musicVol);
      musicVol.addEventListener("input", () => {
        state.settings.audio.music = Number(musicVol.value) / 100;
        if (lbl) lbl.textContent = musicVol.value + "%";
        syncSliderFill(musicVol);
        Sfx.applyVolumes();
        saveState();
      });
    }
    // Settings: confirm-retreat toggle
    const crToggle = $("#confirmRetreatToggle");
    if (crToggle) {
      crToggle.checked = state.settings?.confirmRetreat !== false;
      crToggle.addEventListener("change", () => {
        state.settings.confirmRetreat = crToggle.checked;
        saveState();
      });
    }
    // Settings: reset struggling cards (shaky flags + leech suspensions).
    const resetShaky = $("#resetShakyBtn");
    if (resetShaky) {
      resetShaky.addEventListener("click", () => {
        state.shakyCards = {};
        let unsus = 0;
        for (const c of DECK) {
          const s = state.srs[c.id];
          if (s && s.suspended) { s.suspended = false; unsus++; }
        }
        saveState();
        toast(unsus ? `Reset shaky + un-suspended ${unsus}` : "Shaky-card flags cleared", 1400);
      });
    }
    // Settings: render battle records on entering settings
    const settingsScreen = document.querySelector('[data-screen="settings"]');
    if (settingsScreen) {
      const obs = new MutationObserver(() => {
        if (settingsScreen.classList.contains("active")) renderBattleRecords();
      });
      obs.observe(settingsScreen, { attributes: true, attributeFilter: ["class"] });
    }

    // Battle keyboard shortcuts (1-4 answers, Space = KI special, Esc = pause toggle)
    document.addEventListener("keydown", (e) => {
      if (!battle || trainEvent) return;
      const battleScreen = document.querySelector('[data-screen="battle"]');
      if (!battleScreen?.classList.contains("active")) return;
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1;
        const btns = $$("#choices .choice");
        if (btns[idx] && !btns[idx].disabled) { e.preventDefault(); onChoice(idx); }
      } else if (e.key === " ") {
        const fab = $("#kiFab");
        if (fab && fab.classList.contains("ready")) { e.preventDefault(); fireKiSpecial(); }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (battle.pausedAt) resumeBattle(); else pauseBattle();
      }
    });

    updateHud();

    // ----- iOS lifecycle: prevent stuck audio when the tab backgrounds -----
    // Mobile Safari pauses speechSynthesis on hide and can leave the queue
    // in a "speaking" state on return, blocking all subsequent utterances.
    // We forcefully cancel on hide and re-prime when visible again.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        try { stopSpeaking(); } catch {}
        try { Music.stop(); } catch {}
        try { TrainMusic.stop(); } catch {}
      } else {
        // Resume any suspended Web Audio context (iOS suspends on background).
        try {
          const ctx = Sfx && Sfx.ctx;
          if (ctx && ctx.state === "suspended") ctx.resume();
        } catch {}
      }
    });
    // Also flush speech on full page hide (iOS sometimes fires this without
    // visibilitychange when navigating to PWA back stack).
    window.addEventListener("pagehide", () => {
      try { stopSpeaking(); } catch {}
    });

    // SRS self-test harness (gated by ?srsTest=1).
    if (/[?&]srsTest=1\b/.test(location.search)) runSrsSelfTest();
  }

  // ---------- SRS self-test --------------------------------------------------
  // Lightweight regression checks. Run from devtools console:
  //   location.search = "?srsTest=1"
  // Non-destructive: snapshots state.srs[id] for the test card and restores.
  function runSrsSelfTest() {
    const log = (...a) => console.log("[srsTest]", ...a);
    const fail = (msg) => { console.error("[srsTest] FAIL:", msg); failures++; };
    let failures = 0;
    const id = DECK[0].id;
    const snapshot = JSON.parse(JSON.stringify(state.srs[id]));
    const snapShaky = JSON.parse(JSON.stringify(state.shakyCards || {}));
    const snapStats = JSON.parse(JSON.stringify(state.dailyStats || {}));
    try {
      // Reset card to a fresh "new" state.
      state.srs[id] = {
        ease: SRS.EASE_START, interval: 0, due: 0, mastery: 0, seen: 0,
        queue: "new", step: 0, reps: 0, lapses: 0, lastResult: null, firstSeenAt: 0,
      };
      // 1. New card: "good" advances learning step, doesn't graduate immediately.
      applySrsGrade(id, "good");
      if (state.srs[id].queue !== "learning" || state.srs[id].step !== 1) {
        fail(`new+good should advance to learning step 1; got queue=${state.srs[id].queue} step=${state.srs[id].step}`);
      }
      // 2. Easy graduates immediately to review.
      applySrsGrade(id, "easy");
      if (state.srs[id].queue !== "review" || state.srs[id].interval < SRS.GRAD_INTERVAL_EASY - 1) {
        fail(`learning+easy should graduate; got queue=${state.srs[id].queue} interval=${state.srs[id].interval}`);
      }
      // 3. Build up a long interval.
      state.srs[id].interval = 30;
      state.srs[id].queue = "review";
      const easeBefore = state.srs[id].ease;
      // 4. Lapse: should NOT reset to 1d, should go to relearning.
      applySrsGrade(id, "again");
      if (state.srs[id].queue !== "relearning") fail("lapse should enter relearning queue");
      if (state.srs[id].interval < 10) fail(`lapse interval too small; got ${state.srs[id].interval}, expected ~15`);
      if (state.srs[id].lapses !== 1) fail(`lapses should be 1; got ${state.srs[id].lapses}`);
      if (state.srs[id].ease >= easeBefore) fail("lapse should drop ease");
      // 5. Relearning good x N graduates back to review with preserved interval.
      for (let i = 0; i < SRS.RELEARNING_STEPS_MIN.length; i++) applySrsGrade(id, "good");
      if (state.srs[id].queue !== "review") fail("relearning should re-graduate after all steps");
      if (state.srs[id].interval < 10) fail(`re-graduated interval should preserve gentle lapse value; got ${state.srs[id].interval}`);
      // 6. Battle signal must NOT touch interval/lapses/due/queue.
      const before = JSON.parse(JSON.stringify(state.srs[id]));
      applyBattleSignal(id, false, 1500);
      if (state.srs[id].interval !== before.interval) fail("battle miss must not change interval");
      if (state.srs[id].due !== before.due) fail("battle miss must not change due");
      if (state.srs[id].lapses !== before.lapses) fail("battle miss must not change lapses");
      if (state.srs[id].queue !== before.queue) fail("battle miss must not change queue");
      if (state.srs[id].ease >= before.ease) fail("battle miss must drop ease");
      if (!state.shakyCards[id]) fail("battle miss must flag shaky");
      // 7. Adaptive cap honors min/max bounds.
      const cap = dailyNewCardLimit();
      if (cap < SRS.NEW_PER_DAY_MIN || cap > SRS.NEW_PER_DAY_MAX) fail(`cap out of bounds: ${cap}`);
      // 8. Fuzz is bounded.
      for (let i = 0; i < 5; i++) {
        const f = fuzzInterval(id, 100);
        if (f < 90 || f > 110) fail(`fuzzInterval out of range: ${f}`);
      }
      log(failures === 0 ? "ALL PASS" : `${failures} failure(s)`);
    } finally {
      state.srs[id] = snapshot;
      state.shakyCards = snapShaky;
      state.dailyStats = snapStats;
      saveState();
    }
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();

/* ============================================================
 * MEDICINE — USMLE Step 3 Rapid Review (stateless quiz engine)
 * Self-contained module; reads window.MEDICINE_BANK from medicine-bank.js.
 * ============================================================ */
(function () {
  "use strict";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const state = {
    items: [],          // active queue {item, choiceOrder, answerIdx}
    idx: 0,
    picked: null,       // shuffled-index user picked (or null)
    correct: 0,
    wrong: [],          // array of original items missed
    topics: new Set(),  // topic names selected
    length: 25,         // 10/25/50/'all'
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function bank() {
    return Array.isArray(window.MEDICINE_BANK) ? window.MEDICINE_BANK : [];
  }

  function uniqueTopics() {
    const set = new Set();
    bank().forEach(it => set.add(it.topic));
    return Array.from(set);
  }

  function poolForTopics(topicSet) {
    if (!topicSet.size) return [];
    return bank().filter(it => topicSet.has(it.topic));
  }

  /* ---------- Setup view ---------- */

  function renderTopicChips() {
    const wrap = $("#medTopicChips");
    if (!wrap) return;
    wrap.innerHTML = "";
    const topics = uniqueTopics();
    // default: all selected
    if (state.topics.size === 0) topics.forEach(t => state.topics.add(t));
    topics.forEach(t => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "med-chip" + (state.topics.has(t) ? " is-on" : "");
      btn.textContent = t;
      btn.dataset.topic = t;
      btn.setAttribute("aria-pressed", state.topics.has(t) ? "true" : "false");
      btn.addEventListener("click", () => {
        if (state.topics.has(t)) state.topics.delete(t);
        else state.topics.add(t);
        btn.classList.toggle("is-on");
        btn.setAttribute("aria-pressed", state.topics.has(t) ? "true" : "false");
        updatePoolInfo();
      });
      wrap.appendChild(btn);
    });
    updatePoolInfo();
  }

  function updatePoolInfo() {
    const info = $("#medPoolInfo");
    if (!info) return;
    const n = poolForTopics(state.topics).length;
    info.textContent = `${n} question${n === 1 ? "" : "s"} available`;
    const start = $("#medStartBtn");
    if (start) start.disabled = n === 0;
  }

  function setLength(val) {
    state.length = val;
    $$("#medLenSegment .med-len-opt").forEach(b => {
      b.classList.toggle("is-on", String(b.dataset.len) === String(val));
    });
  }

  function showView(name) {
    ["medSetup", "medQuiz", "medResults"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = (id !== name);
    });
  }

  function resetToSetup() {
    state.items = [];
    state.idx = 0;
    state.picked = null;
    state.correct = 0;
    state.wrong = [];
    showView("medSetup");
    renderTopicChips();
  }

  /* ---------- Quiz view ---------- */

  function buildQueue(items) {
    return items.map(it => {
      const order = shuffle([0, 1, 2, 3]);
      const answerIdx = order.indexOf(it.answer);
      return { item: it, choiceOrder: order, answerIdx };
    });
  }

  function startSession(items) {
    if (!items.length) return;
    state.items = buildQueue(items);
    state.idx = 0;
    state.picked = null;
    state.correct = 0;
    state.wrong = [];
    showView("medQuiz");
    renderQuestion();
  }

  function renderQuestion() {
    const q = state.items[state.idx];
    if (!q) { showResults(); return; }
    state.picked = null;

    const total = state.items.length;
    const fill = $("#medProgressFill");
    if (fill) fill.style.width = ((state.idx) / total * 100) + "%";

    $("#medCounter").textContent = `${state.idx + 1} / ${total}`;
    $("#medScore").textContent = `\u2713 ${state.correct} \u00b7 \u2717 ${state.wrong.length}`;
    const tag = $("#medTopicTag");
    tag.textContent = q.item.subtopic ? `${q.item.topic} \u00b7 ${q.item.subtopic}` : q.item.topic;
    $("#medStem").textContent = q.item.stem;

    const choiceBtns = $$("#medChoices .med-choice");
    choiceBtns.forEach((btn, i) => {
      btn.disabled = false;
      btn.classList.remove("is-correct", "is-wrong", "is-picked");
      const origIdx = q.choiceOrder[i];
      btn.querySelector(".med-choice-text").textContent = q.item.choices[origIdx];
    });

    const pearl = $("#medPearl");
    if (pearl) pearl.hidden = true;
  }

  function pickAnswer(shuffledIdx) {
    if (state.picked !== null) return;
    const q = state.items[state.idx];
    state.picked = shuffledIdx;
    const isRight = shuffledIdx === q.answerIdx;
    if (isRight) state.correct++;
    else state.wrong.push(q.item);

    const choiceBtns = $$("#medChoices .med-choice");
    choiceBtns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.answerIdx) btn.classList.add("is-correct");
      if (i === shuffledIdx && !isRight) btn.classList.add("is-wrong");
      if (i === shuffledIdx) btn.classList.add("is-picked");
    });

    $("#medScore").textContent = `\u2713 ${state.correct} \u00b7 \u2717 ${state.wrong.length}`;

    const pearl = $("#medPearl");
    const pearlText = $("#medPearlText");
    if (pearl && pearlText) {
      pearlText.textContent = q.item.pearl || "";
      pearl.hidden = false;
      const next = $("#medNextBtn");
      if (next) {
        next.textContent = (state.idx + 1 >= state.items.length) ? "See Results \u2192" : "Next \u2192";
        next.focus();
      }
    }
  }

  function nextQuestion() {
    state.idx++;
    if (state.idx >= state.items.length) { showResults(); return; }
    renderQuestion();
  }

  /* ---------- Results view ---------- */

  function showResults() {
    showView("medResults");
    const total = state.correct + state.wrong.length;
    const pct = total ? Math.round((state.correct / total) * 100) : 0;
    $("#medResultsBanner").textContent = total === 0 ? "Session Ended" :
      pct >= 80 ? "Strong Work" : pct >= 60 ? "Solid \u2014 Keep Going" : "Keep Drilling";
    $("#medResultsScore").textContent = `${state.correct} / ${total} (${pct}%)`;

    // Per-topic breakdown: tally totals per topic, then mark correct vs wrong
    const wrongSet = new Set(state.wrong.map(w => w.id));
    const breakdown = {};
    state.items.forEach((q) => {
      const t = q.item.topic;
      if (!breakdown[t]) breakdown[t] = { correct: 0, total: 0 };
      breakdown[t].total++;
      if (!wrongSet.has(q.item.id)) breakdown[t].correct++;
    });

    const wrap = $("#medResultsBreakdown");
    wrap.innerHTML = "";
    Object.keys(breakdown).sort().forEach(t => {
      const b = breakdown[t];
      const row = document.createElement("div");
      row.className = "med-bd-row";
      const tpct = Math.round((b.correct / b.total) * 100);
      row.innerHTML = `<span class="med-bd-topic">${t}</span>` +
        `<span class="med-bd-score">${b.correct}/${b.total}</span>` +
        `<span class="med-bd-bar"><span class="med-bd-bar-fill" style="width:${tpct}%"></span></span>`;
      wrap.appendChild(row);
    });

    const reviewBtn = $("#medReviewWrongBtn");
    if (reviewBtn) reviewBtn.disabled = state.wrong.length === 0;
  }

  /* ---------- Wiring ---------- */

  function wire() {
    if (!document.getElementById("screen-medicine")) return;

    renderTopicChips();
    setLength(25);

    $("#medSelectAll").addEventListener("click", () => {
      state.topics = new Set(uniqueTopics());
      renderTopicChips();
    });
    $("#medClearAll").addEventListener("click", () => {
      state.topics = new Set();
      renderTopicChips();
    });

    $$("#medLenSegment .med-len-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        const v = btn.dataset.len === "all" ? "all" : parseInt(btn.dataset.len, 10);
        setLength(v);
      });
    });

    $("#medStartBtn").addEventListener("click", () => {
      const pool = poolForTopics(state.topics);
      if (!pool.length) return;
      const shuffled = shuffle(pool);
      const n = state.length === "all" ? shuffled.length : Math.min(state.length, shuffled.length);
      startSession(shuffled.slice(0, n));
    });

    $("#medChoices").addEventListener("click", (e) => {
      const btn = e.target.closest(".med-choice");
      if (!btn || btn.disabled) return;
      pickAnswer(parseInt(btn.dataset.i, 10));
    });

    $("#medNextBtn").addEventListener("click", nextQuestion);

    $("#medQuitBtn").addEventListener("click", () => {
      if (state.items.length && state.picked === null && state.wrong.length + state.correct === 0) {
        resetToSetup();
      } else {
        showResults();
      }
    });

    $("#medReviewWrongBtn").addEventListener("click", () => {
      if (!state.wrong.length) return;
      const wrongCopy = state.wrong.slice();
      startSession(shuffle(wrongCopy));
    });

    $("#medNewSessionBtn").addEventListener("click", resetToSetup);

    // Reset to setup whenever the user navigates to Medicine fresh
    document.body.addEventListener("click", (e) => {
      const t = e.target.closest('[data-action="goto-medicine"]');
      if (!t) return;
      // Defer until after showScreen runs
      setTimeout(resetToSetup, 0);
    });

    // Keyboard: 1-4 to pick, Enter to advance, when quiz active
    document.addEventListener("keydown", (e) => {
      const quizVisible = !$("#medQuiz")?.hidden;
      const screenActive = document.querySelector(".screen.active")?.dataset.screen === "medicine";
      if (!quizVisible || !screenActive) return;
      if (e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key, 10) - 1;
        if (state.picked === null) pickAnswer(idx);
      } else if (e.key === "Enter" && state.picked !== null) {
        e.preventDefault();
        nextQuestion();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();

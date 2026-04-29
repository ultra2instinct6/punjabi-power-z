/* ============================================================
   Punjabi Power Z — Training↔Battle learning loop (pure helpers)
   Mirrors the in-script logic so it can be unit-tested without
   booting the DOM. Keep behavior in lockstep with script.js:
     - trackSessionReview      (applySrsGrade end)
     - applyRecencyBias        (pickBattleCard.weightFor)
     - rescheduleOnBattleMiss  (applyBattleSignal miss branch)
     - pushBattleMiss          (applyBattleSignal miss branch)
   ============================================================ */

/**
 * Push a graded card into the rolling session buffer used by
 * pickBattleCard for recency bias. Mutates and returns `session`.
 * Resets the buffer if `now - session.lastGradeAt > sessionGapMs`.
 */
export function trackSessionReview(session, cardId, now, opts) {
  const { sessionBuffer = 50, sessionGapMs = 30 * 60_000 } = opts || {};
  if (!session) session = { startedAt: 0, lastGradeAt: 0, reviewedIds: [] };
  if (!Array.isArray(session.reviewedIds)) session.reviewedIds = [];
  if (!session.lastGradeAt || (now - session.lastGradeAt) > sessionGapMs) {
    session.startedAt = now;
    session.reviewedIds = [];
  }
  session.lastGradeAt = now;
  const i = session.reviewedIds.indexOf(cardId);
  if (i >= 0) session.reviewedIds.splice(i, 1);
  session.reviewedIds.push(cardId);
  if (session.reviewedIds.length > sessionBuffer) {
    session.reviewedIds.splice(0, session.reviewedIds.length - sessionBuffer);
  }
  return session;
}

/**
 * Compute the recency multiplier for a card during battle picking.
 * Returns a number you multiply into the existing weight.
 *  - In session.reviewedIds  -> sessionRecencyWeight (e.g. 2.5)
 *  - Else seen within recencyWindowMs -> recencyWeight (e.g. 1.5)
 *  - Else 1.0
 */
export function applyRecencyBias(cardId, ctx, opts) {
  const {
    sessionRecencyWeight = 2.5,
    recencyWeight = 1.5,
    recencyWindowMs = 30 * 60_000,
  } = opts || {};
  const session = ctx && ctx.session;
  const review = ctx && ctx.review;
  const now = (ctx && ctx.now) || Date.now();
  if (session && Array.isArray(session.reviewedIds) && session.reviewedIds.indexOf(cardId) >= 0) {
    return sessionRecencyWeight;
  }
  const lastSeen = review && review[cardId] && review[cardId].lastSeenAt;
  if (lastSeen && (now - lastSeen) < recencyWindowMs) return recencyWeight;
  return 1;
}

/**
 * For a card missed in battle, pull its `due` sharply forward IF it
 * lives in the review queue. Cards in learning/relearning are left
 * alone (they're already on tight steps). Mutates and returns `srs`.
 */
export function rescheduleOnBattleMiss(srs, now, opts) {
  const { pushforwardMs = 60_000 } = opts || {};
  if (!srs || srs.queue !== "review") return srs;
  const target = now + pushforwardMs;
  if (!srs.due || srs.due > target) srs.due = target;
  return srs;
}

/**
 * Track a battle miss in the rolling buffer used by the post-battle
 * "Cards to review" UI. Most-recent-first, deduped by cardId, capped.
 * Mutates and returns the array.
 */
export function pushBattleMiss(buffer, cardId, now, opts) {
  const { bufferCap = 12 } = opts || {};
  if (!Array.isArray(buffer)) buffer = [];
  buffer = buffer.filter(m => m && m.cardId !== cardId);
  buffer.unshift({ cardId, ts: now });
  if (buffer.length > bufferCap) buffer.length = bufferCap;
  return buffer;
}

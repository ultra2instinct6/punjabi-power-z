import { describe, it, expect } from "vitest";
import {
  trackSessionReview,
  applyRecencyBias,
  rescheduleOnBattleMiss,
  pushBattleMiss,
} from "../../src/lib/learning-loop.js";

describe("trackSessionReview", () => {
  it("starts a fresh session and appends the cardId", () => {
    const sess = trackSessionReview(null, "c1", 1_000);
    expect(sess.reviewedIds).toEqual(["c1"]);
    expect(sess.startedAt).toBe(1_000);
    expect(sess.lastGradeAt).toBe(1_000);
  });

  it("dedupes by moving repeats to the end (most-recent ordering)", () => {
    let s = trackSessionReview(null, "a", 1_000);
    s = trackSessionReview(s, "b", 2_000);
    s = trackSessionReview(s, "a", 3_000);
    expect(s.reviewedIds).toEqual(["b", "a"]);
  });

  it("caps the buffer to sessionBuffer entries", () => {
    let s = null;
    for (let i = 0; i < 60; i++) s = trackSessionReview(s, "c" + i, 1_000 + i);
    expect(s.reviewedIds.length).toBe(50);
    expect(s.reviewedIds[0]).toBe("c10"); // oldest 10 evicted
    expect(s.reviewedIds[49]).toBe("c59");
  });

  it("resets the buffer when more than sessionGapMs has elapsed", () => {
    let s = trackSessionReview(null, "a", 1_000);
    s = trackSessionReview(s, "b", 1_000 + 31 * 60_000); // 31min later
    expect(s.reviewedIds).toEqual(["b"]);
    expect(s.startedAt).toBe(1_000 + 31 * 60_000);
  });
});

describe("applyRecencyBias", () => {
  const opts = { sessionRecencyWeight: 2.5, recencyWeight: 1.5, recencyWindowMs: 30 * 60_000 };

  it("returns sessionRecencyWeight for cards in this session", () => {
    const ctx = { session: { reviewedIds: ["c1"] }, review: {}, now: 10_000 };
    expect(applyRecencyBias("c1", ctx, opts)).toBe(2.5);
  });

  it("returns recencyWeight for cards reviewed within the window but not in session", () => {
    const ctx = {
      session: { reviewedIds: [] },
      review: { c1: { lastSeenAt: 9_000 } },
      now: 10_000,
    };
    expect(applyRecencyBias("c1", ctx, opts)).toBe(1.5);
  });

  it("returns 1 for stale cards", () => {
    const ctx = {
      session: { reviewedIds: [] },
      review: { c1: { lastSeenAt: 1_000 } },
      now: 1_000 + 31 * 60_000,
    };
    expect(applyRecencyBias("c1", ctx, opts)).toBe(1);
  });

  it("session bias takes precedence over window bias", () => {
    const ctx = {
      session: { reviewedIds: ["c1"] },
      review: { c1: { lastSeenAt: 9_000 } },
      now: 10_000,
    };
    expect(applyRecencyBias("c1", ctx, opts)).toBe(2.5);
  });
});

describe("rescheduleOnBattleMiss", () => {
  it("pulls review-queue card due sharply forward", () => {
    const now = 100_000_000;
    const srs = { queue: "review", due: now + 5 * 86400_000 };
    rescheduleOnBattleMiss(srs, now, { pushforwardMs: 60_000 });
    expect(srs.due).toBe(now + 60_000);
  });

  it("does not push due backward if already sooner", () => {
    const now = 100_000_000;
    const srs = { queue: "review", due: now + 10_000 };
    rescheduleOnBattleMiss(srs, now, { pushforwardMs: 60_000 });
    expect(srs.due).toBe(now + 10_000);
  });

  it("leaves learning/relearning queues alone", () => {
    const now = 100_000_000;
    const learning = { queue: "learning", due: now + 5 * 86400_000 };
    rescheduleOnBattleMiss(learning, now, { pushforwardMs: 60_000 });
    expect(learning.due).toBe(now + 5 * 86400_000);
  });
});

describe("pushBattleMiss", () => {
  it("adds entries most-recent-first", () => {
    let b = pushBattleMiss([], "a", 1);
    b = pushBattleMiss(b, "b", 2);
    expect(b.map(x => x.cardId)).toEqual(["b", "a"]);
  });

  it("dedupes by cardId", () => {
    let b = pushBattleMiss([], "a", 1);
    b = pushBattleMiss(b, "b", 2);
    b = pushBattleMiss(b, "a", 3);
    expect(b.map(x => x.cardId)).toEqual(["a", "b"]);
    expect(b[0].ts).toBe(3);
  });

  it("caps to bufferCap entries", () => {
    let b = [];
    for (let i = 0; i < 20; i++) b = pushBattleMiss(b, "c" + i, i, { bufferCap: 12 });
    expect(b.length).toBe(12);
    expect(b[0].cardId).toBe("c19");
  });
});

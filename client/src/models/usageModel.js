import { serverTimestamp } from 'firebase/firestore';

export const CYCLE_DAYS = 30;
export const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Resolves the effective subscription considering plan expiry.
 * Rules:
 * 1. Initial sign up: starts on signup date (createdAt), on default free 'starter' plan.
 * 2. Plan purchase: purchase date (startedAt) is the new starting date for the 30-day period.
 * 3. Plan expiration: once validUntil has passed, the user automatically reverts to the free default 'starter' plan,
 *    and that expiration date (validUntil) becomes the new starting date of the free billing period.
 *
 * @param {Object} [userProfile] - User profile from AuthContext
 * @param {Date} [now] - Current date
 * @returns {{ planId: string, status: string, startedAt: Date, validUntil: Date|null, isExpired: boolean, originalPlanId: string }}
 */
export function getEffectiveSubscription(userProfile = null, now = new Date()) {
  const sub = userProfile?.subscription;
  const rawPlanId = sub?.planId || 'starter';

  let startedAt = null;
  if (sub?.startedAt) {
    const s = sub.startedAt;
    startedAt = s?.toDate ? s.toDate() : (s instanceof Date ? s : new Date(s));
  }

  let validUntil = null;
  if (sub?.validUntil) {
    const v = sub.validUntil;
    validUntil = v?.toDate ? v.toDate() : (v instanceof Date ? v : new Date(v));
  }

  let createdAt = null;
  if (userProfile?.createdAt) {
    const c = userProfile.createdAt;
    createdAt = c?.toDate ? c.toDate() : (c instanceof Date ? c : new Date(c));
  }

  // Check if a paid subscription has expired
  if (rawPlanId !== 'starter' && validUntil && !isNaN(validUntil.getTime()) && now.getTime() >= validUntil.getTime()) {
    const starterValidUntil = new Date(validUntil.getTime() + CYCLE_MS);
    return {
      planId: 'starter',
      status: 'active',
      startedAt: validUntil, // That ending day is the starting day of the new free billing period
      validUntil: starterValidUntil, // The end of the 30-day starter plan period
      isExpired: true,
      originalPlanId: rawPlanId,
    };
  }

  // Active paid plan or free Starter plan
  const baseStart = (startedAt && !isNaN(startedAt.getTime()))
    ? startedAt
    : ((createdAt && !isNaN(createdAt.getTime())) ? createdAt : now);

  const effectiveValidUntil = rawPlanId !== 'starter'
    ? validUntil
    : (validUntil || new Date(baseStart.getTime() + CYCLE_MS));

  return {
    planId: rawPlanId,
    status: sub?.status || 'active',
    startedAt: baseStart,
    validUntil: effectiveValidUntil,
    isExpired: false,
    originalPlanId: rawPlanId,
  };
}

/**
 * Computes the 30-day rolling billing cycle for any user (Starter or Paid).
 * Cycles count 30 days from signup (or subscription purchase date / plan expiry date) and advance every 30 days.
 * @param {Object} [userProfile] - User profile from AuthContext
 * @param {Date} [now] - Current timestamp (default: new Date())
 * @returns {{ cycleStartDate: Date, cycleEndDate: Date, periodKey: string, formattedRange: string, daysLeft: number, cycleIndex: number, effectivePlanId: string, isExpired: boolean }}
 */
export function getUserBillingCycle(userProfile = null, now = new Date()) {
  const effectiveSub = getEffectiveSubscription(userProfile, now);
  let baseDate = effectiveSub.startedAt;

  // Fallback to start of today in UTC if no date is recorded
  if (!baseDate || isNaN(baseDate.getTime())) {
    baseDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  const nowMs = now.getTime();
  const baseMs = baseDate.getTime();
  const elapsedMs = Math.max(0, nowMs - baseMs);
  const cycleIndex = Math.floor(elapsedMs / CYCLE_MS);

  const cycleStartDate = new Date(baseMs + cycleIndex * CYCLE_MS);
  const cycleEndDate = new Date(baseMs + (cycleIndex + 1) * CYCLE_MS);

  const formatShortDate = (d) => {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const formatFullDate = (d) => {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formattedRange = `${formatShortDate(cycleStartDate)} – ${formatFullDate(cycleEndDate)}`;

  const y = cycleStartDate.getUTCFullYear();
  const m = String(cycleStartDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(cycleStartDate.getUTCDate()).padStart(2, '0');
  const periodKey = `${y}-${m}-${d}`;

  const msLeft = Math.max(0, cycleEndDate.getTime() - nowMs);
  const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

  return {
    cycleStartDate,
    cycleEndDate,
    periodKey,
    formattedRange,
    daysLeft,
    cycleIndex,
    effectivePlanId: effectiveSub.planId,
    isExpired: effectiveSub.isExpired,
  };
}

export class UsageModel {
  constructor({
    period = '',
    notesGenerated = 0,
    videoQaQuestions = 0,
    assistantQuestions = 0,
    lastUpdated = null,
  } = {}) {
    this.period = period || UsageModel.getCurrentPeriod();
    this.notesGenerated = Number(notesGenerated || 0);
    this.videoQaQuestions = Number(videoQaQuestions || 0);
    this.assistantQuestions = Number(assistantQuestions || 0);
    this.lastUpdated = lastUpdated;
  }

  /**
   * Helper to get standard period key (30-day cycle YYYY-MM-DD or fallback YYYY-MM)
   * @param {Object} [userProfile]
   * @param {Date} [d]
   * @returns {string}
   */
  static getCurrentPeriod(userProfile = null, d = new Date()) {
    if (userProfile) {
      return getUserBillingCycle(userProfile, d).periodKey;
    }
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new UsageModel({
      period: docSnap.id,
      notesGenerated: data.notesGenerated || 0,
      videoQaQuestions: data.videoQaQuestions || 0,
      assistantQuestions: data.assistantQuestions || 0,
      lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : data.lastUpdated || null,
    });
  }

  toFirestore() {
    return {
      period: this.period,
      notesGenerated: this.notesGenerated,
      videoQaQuestions: this.videoQaQuestions,
      assistantQuestions: this.assistantQuestions,
      lastUpdated: serverTimestamp(),
    };
  }

  toPlainObject() {
    return {
      period: this.period,
      notesGenerated: this.notesGenerated,
      videoQaQuestions: this.videoQaQuestions,
      assistantQuestions: this.assistantQuestions,
      lastUpdated: this.lastUpdated,
    };
  }
}

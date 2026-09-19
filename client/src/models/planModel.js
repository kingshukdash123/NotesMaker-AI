import { serverTimestamp } from 'firebase/firestore';
import {
  PLANS_COLLECTION,
  PLAN_IDS,
  PLAN_RANKS,
  DEFAULT_PLANS,
} from '../constants';

export {
  PLANS_COLLECTION,
  PLAN_IDS,
  PLAN_RANKS,
  DEFAULT_PLANS,
};

/**
 * PlanModel — Data model for subscription plans stored in the Firestore `plans` collection.
 */
export class PlanModel {
  constructor({
    id = PLAN_IDS.STARTER,
    name = '',
    badge = '',
    discountBadge = '',
    price = 0,
    originalPrice = 0,
    billingInterval = 'month',
    currencySymbol = '₹',
    description = '',
    rank = 0,
    limits = {},
    features = [],
    ctaText = '',
    highlighted = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.name = name || '';
    this.badge = badge || '';
    this.discountBadge = discountBadge || '';
    this.price = Number(price || 0);
    this.originalPrice = Number(originalPrice || 0);
    this.billingInterval = billingInterval || 'month';
    this.currencySymbol = currencySymbol || '₹';
    this.description = description || '';
    this.rank = rank !== undefined ? Number(rank) : (PLAN_RANKS[id] ?? 0);

    const defaultLimits = DEFAULT_PLANS[id]?.limits || DEFAULT_PLANS[PLAN_IDS.STARTER].limits;
    this.limits = {
      ...defaultLimits,
      ...(limits || {}),
    };

    const defaultFeatures = DEFAULT_PLANS[id]?.features || DEFAULT_PLANS[PLAN_IDS.STARTER].features;
    this.features = Array.isArray(features) && features.length > 0 ? features : defaultFeatures;
    this.ctaText = ctaText || DEFAULT_PLANS[id]?.ctaText || 'Get Started';
    this.highlighted = highlighted !== undefined ? Boolean(highlighted) : Boolean(DEFAULT_PLANS[id]?.highlighted);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Constructs a PlanModel instance from a Firestore document snapshot.
   * @param {import('firebase/firestore').DocumentSnapshot} docSnap
   * @returns {PlanModel|null}
   */
  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();
    const planId = docSnap.id;

    return new PlanModel({
      id: planId,
      name: data.name || '',
      badge: data.badge || '',
      discountBadge: data.discountBadge || '',
      price: data.price ?? 0,
      originalPrice: data.originalPrice ?? 0,
      billingInterval: data.billingInterval || 'month',
      currencySymbol: data.currencySymbol || '₹',
      description: data.description || '',
      rank: data.rank ?? PLAN_RANKS[planId] ?? 0,
      limits: data.limits || {},
      features: Array.isArray(data.features) ? data.features : [],
      ctaText: data.ctaText || '',
      highlighted: Boolean(data.highlighted),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  /**
   * Validates required plan properties.
   * @returns {string[]} Array of validation error messages
   */
  validate() {
    const errors = [];
    if (!this.id?.trim()) errors.push('Plan id is required.');
    if (!this.name?.trim()) errors.push('Plan name is required.');
    if (this.price < 0) errors.push('Plan price cannot be negative.');
    return errors;
  }

  /**
   * Serializes the PlanModel instance for Firestore writes.
   * @param {Object} [options]
   * @param {boolean} [options.isNew=false]
   * @returns {Object} Firestore document payload
   */
  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`PlanModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      id: this.id,
      name: this.name.trim(),
      badge: this.badge,
      discountBadge: this.discountBadge,
      price: this.price,
      originalPrice: this.originalPrice,
      billingInterval: this.billingInterval,
      currencySymbol: this.currencySymbol,
      description: this.description,
      rank: this.rank,
      limits: this.limits,
      features: this.features,
      ctaText: this.ctaText,
      highlighted: this.highlighted,
      updatedAt: serverTimestamp(),
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }

  /**
   * Returns a plain serializable JavaScript object.
   * @returns {Object}
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      badge: this.badge,
      discountBadge: this.discountBadge,
      price: this.price,
      originalPrice: this.originalPrice,
      billingInterval: this.billingInterval,
      currencySymbol: this.currencySymbol,
      description: this.description,
      rank: this.rank,
      limits: { ...this.limits },
      features: [...this.features],
      ctaText: this.ctaText,
      highlighted: this.highlighted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Checks if a numeric quota is exceeded for this plan.
   * @param {number} currentCount
   * @param {string} quotaKey
   * @returns {boolean}
   */
  isQuotaExceeded(currentCount, quotaKey) {
    const limit = this.limits?.[quotaKey];
    if (limit === Infinity || limit === undefined || limit === null) return false;
    return Number(currentCount || 0) >= limit;
  }

  /**
   * Checks if a boolean or feature flag is enabled.
   * @param {string} featureKey
   * @returns {boolean}
   */
  hasFeature(featureKey) {
    return Boolean(this.limits?.[featureKey]);
  }

  /**
   * Returns max video duration in hours.
   * @returns {number}
   */
  getVideoDurationHours() {
    return Math.round((this.limits?.maxVideoDurationSeconds || 0) / 3600);
  }

  /**
   * Returns the notes quota delta compared to Starter baseline (10 notes).
   * @param {number} [baseline=10]
   * @returns {number}
   */
  getNotesQuotaIncrease(baseline = 10) {
    if (this.id === PLAN_IDS.STARTER) return 0;
    return Math.max(0, (this.limits?.monthlyNotesQuota || 0) - baseline);
  }

  /**
   * Returns the video hours delta compared to Starter baseline (2 hours).
   * @param {number} [baseline=2]
   * @returns {number}
   */
  getVideoHoursIncrease(baseline = 2) {
    if (this.id === PLAN_IDS.STARTER) return 0;
    return Math.max(0, this.getVideoDurationHours() - baseline);
  }

  /**
   * Returns the monthly chat quota delta compared to Starter baseline (75 chats).
   * @param {number} [baseline=75]
   * @returns {number}
   */
  getChatQuotaIncrease(baseline = 75) {
    if (this.id === PLAN_IDS.STARTER) return 0;
    return Math.max(0, (this.limits?.monthlyChatQuota || 0) - baseline);
  }
}

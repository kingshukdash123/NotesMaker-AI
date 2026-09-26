import { serverTimestamp } from 'firebase/firestore';

export const DEFAULT_SUBSCRIPTION = {
  planId: 'starter', // 'starter' | 'learner' | 'scholar'
  status: 'active', // 'active' | 'trial' | 'expired' | 'canceled'
  startedAt: null,
  validUntil: null,
  updatedAt: null,
};

export class UserModel {
  constructor({
    uid = '',
    displayName = '',
    phoneNumber = '',
    email = null,
    subscription = null,
    hasCompletedOnboarding = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.uid = uid;
    this.id = uid;
    this.displayName = displayName || '';
    this.phoneNumber = phoneNumber || '';
    this.email = email || null;
    this.subscription = UserModel.normalizeSubscription(subscription);
    this.hasCompletedOnboarding = Boolean(hasCompletedOnboarding);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Constructs a UserModel instance from a Firestore DocumentSnapshot
   * @param {import('firebase/firestore').DocumentSnapshot} docSnap
   * @returns {UserModel|null}
   */
  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new UserModel({
      uid: docSnap.id,
      displayName: data.displayName || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || null,
      subscription: data.subscription || null,
      hasCompletedOnboarding: data.hasCompletedOnboarding ?? false,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  /**
   * Validates core model properties
   * @returns {string[]} Validation errors array
   */
  validate() {
    const errors = [];
    if (!this.uid?.trim()) errors.push('uid is required.');
    return errors;
  }

  /**
   * Serializes the model for Firestore writes
   * @param {Object} options
   * @param {boolean} [options.isNew=false]
   * @returns {Object}
   */
  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`UserModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      uid: this.uid,
      displayName: (this.displayName || '').trim(),
      phoneNumber: (this.phoneNumber || '').trim(),
      email: this.email ? this.email.trim().toLowerCase() : null,
      subscription: UserModel.normalizeSubscription(this.subscription),
      hasCompletedOnboarding: Boolean(this.hasCompletedOnboarding),
      updatedAt: serverTimestamp(),
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }

  /**
   * Converts instance into a plain serializable JavaScript object for React state
   * @returns {Object}
   */
  toPlainObject() {
    return {
      uid: this.uid,
      id: this.uid,
      displayName: this.displayName,
      phoneNumber: this.phoneNumber,
      email: this.email,
      subscription: { ...this.subscription },
      hasCompletedOnboarding: this.hasCompletedOnboarding,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Merges and sanitizes subscription data with safe defaults
   * @param {Object} [sub]
   * @returns {Object}
   */
  static normalizeSubscription(sub) {
    return {
      planId: sub?.planId || DEFAULT_SUBSCRIPTION.planId,
      status: sub?.status || DEFAULT_SUBSCRIPTION.status,
      startedAt: sub?.startedAt || DEFAULT_SUBSCRIPTION.startedAt,
      validUntil: sub?.validUntil || DEFAULT_SUBSCRIPTION.validUntil,
      updatedAt: sub?.updatedAt || DEFAULT_SUBSCRIPTION.updatedAt,
    };
  }
}

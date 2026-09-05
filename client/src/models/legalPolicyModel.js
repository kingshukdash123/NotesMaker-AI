import { serverTimestamp } from 'firebase/firestore';

/**
 * LegalPolicyModel — Data model for legal policy documents stored in Firestore.
 *
 * Firestore Collection: `legal_policies`
 * Document ID: policy slug (e.g. "privacy", "terms", "disclaimer", "cookies", "refund")
 *
 * Designed to be future-proof for paid plan tiers:
 * - `planScope` supports multiple plan identifiers (e.g. ["free", "pro", "enterprise"])
 * - Policy content can be versioned and updated without code redeploys
 * - `isActive` allows archiving old versions while keeping them retrievable
 */
export class LegalPolicyModel {
  constructor({
    id = null,
    title = '',
    slug = '',
    version = '1.0.0',
    effectiveDate = null,
    lastUpdated = null,
    isActive = true,
    planScope = ['free'],
    sections = [],
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id || slug;
    this.title = title || '';
    this.slug = slug || '';
    this.version = version || '1.0.0';
    this.effectiveDate = effectiveDate;
    this.lastUpdated = lastUpdated;
    this.isActive = isActive !== false;
    // planScope: generic string array — add plan identifiers when paid plans launch
    // e.g. ["free"] now → ["free", "pro", "enterprise"] later
    this.planScope = Array.isArray(planScope) ? planScope : ['free'];
    // sections: [{ id: string, heading: string, body: string, order: number }]
    this.sections = Array.isArray(sections) ? sections : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Construct a LegalPolicyModel from a Firestore document snapshot.
   * @param {import('firebase/firestore').DocumentSnapshot} docSnap
   * @returns {LegalPolicyModel|null}
   */
  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new LegalPolicyModel({
      id: docSnap.id,
      title: data.title || '',
      slug: data.slug || docSnap.id,
      version: data.version || '1.0.0',
      effectiveDate: data.effectiveDate?.toDate
        ? data.effectiveDate.toDate()
        : data.effectiveDate || null,
      lastUpdated: data.lastUpdated?.toDate
        ? data.lastUpdated.toDate()
        : data.lastUpdated || null,
      isActive: data.isActive !== false,
      planScope: Array.isArray(data.planScope) ? data.planScope : ['free'],
      sections: Array.isArray(data.sections) ? data.sections : [],
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.slug?.trim()) errors.push('slug is required.');
    if (!this.title?.trim()) errors.push('title is required.');
    if (!Array.isArray(this.sections) || this.sections.length === 0) {
      errors.push('sections must be a non-empty array.');
    }
    return errors;
  }

  /**
   * Serialize to a plain object for Firestore writes.
   * @param {Object} options
   * @param {boolean} [options.isNew=false] - Set true on initial creation to write createdAt
   * @returns {Object}
   */
  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`LegalPolicyModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      title: this.title.trim(),
      slug: this.slug.trim(),
      version: this.version,
      isActive: this.isActive,
      planScope: this.planScope,
      sections: this.sections,
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (this.effectiveDate) {
      payload.effectiveDate = this.effectiveDate;
    }

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}

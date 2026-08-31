import { serverTimestamp } from 'firebase/firestore';

export class SearchCacheModel {
  constructor({
    id = null,
    query = '',
    results = [],
    cachedAt = null,
  } = {}) {
    this.id = id;
    this.query = query || '';
    this.results = Array.isArray(results) ? results : [];
    this.cachedAt = cachedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new SearchCacheModel({
      id: docSnap.id,
      query: data.query || '',
      results: Array.isArray(data.results) ? data.results : [],
      cachedAt: data.cachedAt?.toDate ? data.cachedAt.toDate() : data.cachedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.query?.trim()) errors.push('query is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`SearchCacheModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      query: this.query.trim(),
      results: this.results,
    };

    if (isNew || !this.cachedAt) {
      payload.cachedAt = serverTimestamp();
    }

    return payload;
  }
}

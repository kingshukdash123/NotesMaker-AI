import { serverTimestamp } from 'firebase/firestore';

export class UserApiKeyModel {
  constructor({
    id = null,
    userId = '',
    googleApiKey = '',
    groqApiKey = '',
    updatedAt = null,
  } = {}) {
    this.id = id || userId;
    this.userId = userId;
    this.googleApiKey = googleApiKey || '';
    this.groqApiKey = groqApiKey || '';
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new UserApiKeyModel({
      id: docSnap.id,
      userId: docSnap.id,
      googleApiKey: data.googleApiKey || '',
      groqApiKey: data.groqApiKey || '',
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    return errors;
  }

  toFirestore() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`UserApiKeyModel validation failed: ${errors.join(', ')}`);
    }

    return {
      googleApiKey: (this.googleApiKey || '').trim(),
      groqApiKey: (this.groqApiKey || '').trim(),
      updatedAt: serverTimestamp(),
    };
  }
}

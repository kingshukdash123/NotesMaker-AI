import { serverTimestamp } from 'firebase/firestore';

export class NoteModel {
  constructor({
    id = null,
    userId = '',
    videoUrl = '',
    metadata = {},
    result = {},
    createdAt = null,
    createdAtDate = null,
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.videoUrl = videoUrl;
    this.metadata = metadata || {};
    this.result = result || {};
    this.createdAt = createdAt;
    this.createdAtDate = createdAtDate || (createdAt?.toDate ? createdAt.toDate() : (createdAt ? new Date(createdAt) : new Date()));
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    const createdAtDate = data.createdAt?.toDate
      ? data.createdAt.toDate()
      : (data.createdAt ? new Date(data.createdAt) : new Date());

    return new NoteModel({
      id: docSnap.id,
      userId: data.userId || '',
      videoUrl: data.videoUrl || '',
      metadata: data.metadata || {},
      result: data.result || {},
      createdAt: data.createdAt || null,
      createdAtDate,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.videoUrl) errors.push('videoUrl is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`NoteModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      userId: this.userId,
      videoUrl: this.videoUrl,
      metadata: this.metadata || {},
      result: this.result || {},
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}

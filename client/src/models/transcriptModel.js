import { serverTimestamp } from 'firebase/firestore';

export class TranscriptModel {
  constructor({
    id = null,
    videoId = '',
    language = 'en',
    segments = [],
    fullText = '',
    createdAt = null,
  } = {}) {
    this.id = id || videoId;
    this.videoId = videoId;
    this.language = language || 'en';
    this.segments = Array.isArray(segments) ? segments : [];
    this.fullText = fullText || '';
    this.createdAt = createdAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new TranscriptModel({
      id: docSnap.id,
      videoId: data.videoId || docSnap.id,
      language: data.language || 'en',
      segments: Array.isArray(data.segments) ? data.segments : [],
      fullText: data.fullText || '',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.videoId) errors.push('videoId is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`TranscriptModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      videoId: this.videoId,
      language: this.language,
      segments: this.segments,
      fullText: this.fullText,
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}

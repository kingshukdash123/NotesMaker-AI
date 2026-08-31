import { serverTimestamp } from 'firebase/firestore';

export class VideoQnAModel {
  constructor({
    id = null,
    userId = '',
    videoId = '',
    messages = [],
    updatedAt = null,
  } = {}) {
    this.id = id || `${userId}_${videoId}`;
    this.userId = userId;
    this.videoId = videoId;
    this.messages = Array.isArray(messages) ? messages : [];
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new VideoQnAModel({
      id: docSnap.id,
      userId: data.userId || '',
      videoId: data.videoId || '',
      messages: Array.isArray(data.messages) ? data.messages : [],
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.videoId) errors.push('videoId is required.');
    if (!Array.isArray(this.messages)) errors.push('messages must be an array.');
    return errors;
  }

  toFirestore() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`VideoQnAModel validation failed: ${errors.join(', ')}`);
    }

    return {
      userId: this.userId,
      videoId: this.videoId,
      messages: this.messages.map(m => ({
        sender: m.sender || 'user',
        text: m.text || '',
        isError: Boolean(m.isError),
        timestamp: m.timestamp || new Date().toISOString(),
      })),
      updatedAt: serverTimestamp(),
    };
  }
}

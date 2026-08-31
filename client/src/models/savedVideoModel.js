import { serverTimestamp } from 'firebase/firestore';

export class SavedVideoModel {
  constructor({
    id = null,
    userId = '',
    videoId = '',
    videoUrl = '',
    metadata = {},
    savedAt = null,
  } = {}) {
    this.id = id || `${userId}_${videoId}`;
    this.userId = userId;
    this.videoId = videoId;
    this.videoUrl = videoUrl;
    this.metadata = {
      title: metadata?.title || 'YouTube Video',
      channel: metadata?.channel || 'Unknown Creator',
      thumbnail: metadata?.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
    };
    this.savedAt = savedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new SavedVideoModel({
      id: docSnap.id,
      userId: data.userId || '',
      videoId: data.videoId || '',
      videoUrl: data.videoUrl || '',
      metadata: data.metadata || {},
      savedAt: data.savedAt?.toDate ? data.savedAt.toDate() : data.savedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.videoId) errors.push('videoId is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`SavedVideoModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      userId: this.userId,
      videoId: this.videoId,
      videoUrl: this.videoUrl,
      metadata: this.metadata,
    };

    if (isNew || !this.savedAt) {
      payload.savedAt = serverTimestamp();
    }

    return payload;
  }
}

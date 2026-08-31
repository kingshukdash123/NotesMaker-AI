import { serverTimestamp } from 'firebase/firestore';

export class WatchHistoryModel {
  constructor({
    id = null,
    userId = '',
    videoId = '',
    videoUrl = '',
    metadata = {},
    notesGenerated = false,
    openedAt = null,
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.videoId = videoId;
    this.videoUrl = videoUrl;
    this.metadata = {
      title: metadata?.title || 'YouTube Video',
      channel: metadata?.channel || 'Unknown Creator',
      thumbnail: metadata?.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
    };
    this.notesGenerated = Boolean(notesGenerated);
    this.openedAt = openedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new WatchHistoryModel({
      id: docSnap.id,
      userId: data.userId || '',
      videoId: data.videoId || '',
      videoUrl: data.videoUrl || '',
      metadata: data.metadata || {},
      notesGenerated: Boolean(data.notesGenerated),
      openedAt: data.openedAt?.toDate ? data.openedAt.toDate() : data.openedAt || null,
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
      throw new Error(`WatchHistoryModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      userId: this.userId,
      videoId: this.videoId,
      videoUrl: this.videoUrl,
      metadata: this.metadata,
      notesGenerated: this.notesGenerated,
    };

    if (isNew || !this.openedAt) {
      payload.openedAt = serverTimestamp();
    }

    return payload;
  }
}

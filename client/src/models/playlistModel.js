import { serverTimestamp } from 'firebase/firestore';

export class PlaylistModel {
  constructor({
    id = null,
    userId = '',
    name = '',
    videos = [],
    sourcePlaylistId = '',
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.name = name || '';
    this.videos = Array.isArray(videos) ? videos : [];
    this.sourcePlaylistId = sourcePlaylistId || '';
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Computed video count from the videos array
   */
  get videoCount() {
    return this.videos.length;
  }

  /**
   * Number of videos marked as watched
   */
  get watchedCount() {
    return this.videos.filter((v) => Boolean(v?.watched)).length;
  }

  /**
   * Number of videos remaining to be watched
   */
  get remainingCount() {
    return Math.max(0, this.videos.length - this.watchedCount);
  }

  /**
   * Progress completion percentage (0-100)
   */
  get progressPercent() {
    if (this.videos.length === 0) return 0;
    return Math.round((this.watchedCount / this.videos.length) * 100);
  }

  /**
   * Computed playlist status
   * @returns {'empty' | 'not_started' | 'in_progress' | 'completed'}
   */
  get status() {
    if (this.videos.length === 0) return 'empty';
    if (this.watchedCount === 0) return 'not_started';
    if (this.watchedCount === this.videos.length) return 'completed';
    return 'in_progress';
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();
    const videos = Array.isArray(data.videos) ? data.videos : [];

    return new PlaylistModel({
      id: docSnap.id,
      userId: data.userId || '',
      name: data.name || '',
      videos,
      sourcePlaylistId: data.sourcePlaylistId || data.youtubePlaylistId || '',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.name?.trim()) errors.push('Playlist name is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`PlaylistModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      userId: this.userId,
      name: this.name.trim(),
      videos: this.videos,
      updatedAt: serverTimestamp(),
    };

    if (this.sourcePlaylistId) {
      payload.sourcePlaylistId = this.sourcePlaylistId;
    }

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}

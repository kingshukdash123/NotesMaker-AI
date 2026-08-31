import { serverTimestamp } from 'firebase/firestore';

export class PlaylistModel {
  constructor({
    id = null,
    userId = '',
    name = '',
    videos = [],
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.name = name || '';
    this.videos = Array.isArray(videos) ? videos : [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Computed video count from the videos array
   */
  get videoCount() {
    return this.videos.length;
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

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}

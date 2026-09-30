import { serverTimestamp } from 'firebase/firestore';
import { normalizeVideoMetadata } from './videoModel';

export class NoteModel {
  constructor({
    id = null,
    userId = '',
    videoId = '',
    videoUrl = '',
    metadata = {},
    result = {},
    createdAt = null,
    createdAtDate = null,
    updatedAt = null,
  } = {}) {
    const rawMeta = metadata?.metadata || metadata || {};
    const norm = normalizeVideoMetadata({
      id,
      videoId,
      videoUrl,
      metadata: rawMeta,
      ...rawMeta,
    }) || {};

    const cleanVideoId = norm.videoId || String(videoId || '').trim();
    this.id = id || (userId && cleanVideoId ? `${userId}_${cleanVideoId}` : null);
    this.userId = String(userId || '').trim();
    this.videoId = cleanVideoId;
    this.videoUrl = norm.videoUrl || videoUrl || (cleanVideoId ? `https://www.youtube.com/watch?v=${cleanVideoId}` : '');
    this.metadata = norm.metadata || metadata || {};
    this.result = result || {};
    this.createdAt = createdAt;
    this.createdAtDate = createdAtDate || (createdAt?.toDate ? createdAt.toDate() : (createdAt ? new Date(createdAt) : new Date()));
    this.updatedAt = updatedAt;
  }

  get title() { return this.metadata.title || ''; }
  get channel() { return this.metadata.channel || ''; }
  get thumbnail() { return this.metadata.thumbnail || ''; }
  get duration() { return this.metadata.duration || 0; }
  get durationFormatted() { return this.metadata.durationFormatted || ''; }
  get video_id() { return this.videoId; }
  get duration_formatted() { return this.durationFormatted; }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    const createdAtDate = data.createdAt?.toDate
      ? data.createdAt.toDate()
      : (data.createdAt ? new Date(data.createdAt) : new Date());

    return new NoteModel({
      id: docSnap.id,
      userId: data.userId || '',
      videoId: data.videoId || data.metadata?.videoId || '',
      videoUrl: data.videoUrl || '',
      metadata: data.metadata || {},
      result: data.result || {},
      createdAt: data.createdAt || null,
      createdAtDate,
      updatedAt: data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.videoId && !this.videoUrl) errors.push('videoId or videoUrl is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`NoteModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      userId: this.userId,
      videoId: this.videoId,
      videoUrl: this.videoUrl || `https://www.youtube.com/watch?v=${this.videoId}`,
      metadata: this.metadata || {},
      result: this.result || {},
      updatedAt: serverTimestamp(),
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}


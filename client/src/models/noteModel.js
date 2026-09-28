import { serverTimestamp } from 'firebase/firestore';
import { normalizeVideoMetadata } from './videoModel';

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
    const rawMeta = metadata?.metadata || metadata || {};
    const norm = normalizeVideoMetadata({
      id,
      videoUrl,
      metadata: rawMeta,
      ...rawMeta,
    }) || {};

    this.id = id;
    this.userId = String(userId || '').trim();
    this.videoUrl = norm.videoUrl || videoUrl || '';
    this.videoId = norm.videoId || '';
    this.metadata = norm.metadata || metadata || {};
    this.result = result || {};
    this.createdAt = createdAt;
    this.createdAtDate = createdAtDate || (createdAt?.toDate ? createdAt.toDate() : (createdAt ? new Date(createdAt) : new Date()));
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
    if (!this.videoUrl && !this.videoId) errors.push('videoUrl or videoId is required.');
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


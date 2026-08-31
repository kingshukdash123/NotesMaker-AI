import { serverTimestamp } from 'firebase/firestore';

export class AssistantThreadModel {
  constructor({
    id = null,
    userId = '',
    threadId = '',
    title = 'New Chat',
    lastMessage = '',
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id || `${userId}_${threadId}`;
    this.userId = userId;
    this.threadId = threadId;
    this.title = title || 'New Chat';
    this.lastMessage = lastMessage || '';
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new AssistantThreadModel({
      id: docSnap.id,
      userId: data.userId || '',
      threadId: data.threadId || '',
      title: data.title || 'New Chat',
      lastMessage: data.lastMessage || '',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.threadId) errors.push('threadId is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`AssistantThreadModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      userId: this.userId,
      threadId: this.threadId,
      title: this.title,
      lastMessage: this.lastMessage,
      updatedAt: serverTimestamp(),
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}

import { serverTimestamp } from 'firebase/firestore';

export class AssistantMessageModel {
  constructor({
    id = null,
    userId = '',
    threadId = '',
    messages = [],
    updatedAt = null,
  } = {}) {
    this.id = id || `${userId}_${threadId}`;
    this.userId = userId;
    this.threadId = threadId;
    this.messages = Array.isArray(messages) ? messages : [];
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new AssistantMessageModel({
      id: docSnap.id,
      userId: data.userId || '',
      threadId: data.threadId || '',
      messages: Array.isArray(data.messages) ? data.messages : [],
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.threadId) errors.push('threadId is required.');
    if (!Array.isArray(this.messages)) errors.push('messages must be an array.');
    return errors;
  }

  toFirestore() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`AssistantMessageModel validation failed: ${errors.join(', ')}`);
    }

    return {
      userId: this.userId,
      threadId: this.threadId,
      messages: this.messages.map(m => ({
        role: m.role || 'user',
        content: m.content || '',
        timestamp: m.timestamp || new Date().toISOString(),
      })),
      updatedAt: serverTimestamp(),
    };
  }
}

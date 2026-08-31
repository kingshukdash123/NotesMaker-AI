import { serverTimestamp } from 'firebase/firestore';

export class PlannerTaskModel {
  constructor({
    id = null,
    userId = '',
    title = '',
    date = '',
    priority = 'medium',
    completed = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.title = title || '';
    this.date = date || '';
    this.priority = priority || 'medium';
    this.completed = Boolean(completed);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new PlannerTaskModel({
      id: docSnap.id,
      userId: data.userId || '',
      title: data.title || '',
      date: data.date || '',
      priority: data.priority || 'medium',
      completed: Boolean(data.completed),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.title?.trim()) errors.push('title is required.');
    if (!this.date) errors.push('date is required.');
    return errors;
  }

  toFirestore({ isNew = false } = {}) {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`PlannerTaskModel validation failed: ${errors.join(', ')}`);
    }

    const payload = {
      userId: this.userId,
      title: this.title.trim(),
      date: this.date,
      priority: this.priority,
      completed: this.completed,
      updatedAt: serverTimestamp(),
    };

    if (isNew || !this.createdAt) {
      payload.createdAt = serverTimestamp();
    }

    return payload;
  }
}

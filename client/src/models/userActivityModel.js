import { serverTimestamp } from 'firebase/firestore';

export class UserActivityModel {
  constructor({
    id = null,
    userId = '',
    date = '',
    timestamp = null,
  } = {}) {
    this.id = id || `${userId}_${date}`;
    this.userId = userId;
    this.date = date;
    this.timestamp = timestamp;
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const data = docSnap.data();

    return new UserActivityModel({
      id: docSnap.id,
      userId: data.userId || '',
      date: data.date || '',
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp || null,
    });
  }

  validate() {
    const errors = [];
    if (!this.userId) errors.push('userId is required.');
    if (!this.date) errors.push('date is required.');
    return errors;
  }

  toFirestore() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`UserActivityModel validation failed: ${errors.join(', ')}`);
    }

    return {
      userId: this.userId,
      date: this.date,
      timestamp: serverTimestamp(),
    };
  }
}

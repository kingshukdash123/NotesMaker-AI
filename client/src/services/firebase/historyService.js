import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  doc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { WatchHistoryModel } from '../../models';

/**
 * Logs a video visit into Firestore watch_history (YouTube style).
 * Uses a deterministic document ID `${userId}_${videoId}` so re-watching a video
 * updates its timestamp and bumps it to the top of the history without creating duplicates.
 */
export async function logVideoOpen(userId, videoId, videoUrl, metadata) {
  if (!userId || !videoId) return null;

  try {
    const docId = `${userId}_${videoId}`;
    const docRef = doc(db, 'watch_history', docId);

    const model = new WatchHistoryModel({
      id: docId,
      userId,
      videoId,
      videoUrl,
      metadata,
    });

    await setDoc(docRef, model.toFirestore({ isNew: true }), { merge: true });

    return docId;
  } catch (err) {
    console.error('Error logging watch history:', err);
    return null;
  }
}

/**
 * Retrieves the user's watch history (YouTube style).
 * Shows each unique video exactly once at its most recent watch time.
 * @returns {Promise<Array<WatchHistoryModel>>}
 */
export async function getUserWatchHistory(userId) {
  if (!userId) return [];

  const historyRef = collection(db, 'watch_history');
  const q = query(
    historyRef,
    where('userId', '==', userId),
    orderBy('openedAt', 'desc'),
    limit(100)
  );

  try {
    const querySnapshot = await getDocs(q);
    const history = [];
    const seenVideoIds = new Set();

    querySnapshot.forEach((docSnap) => {
      const model = WatchHistoryModel.fromFirestore(docSnap);
      if (model && !seenVideoIds.has(model.videoId)) {
        seenVideoIds.add(model.videoId);
        history.push(model);
      }
    });

    return history;
  } catch (err) {
    console.error('Error fetching watch history:', err);
    return [];
  }
}

/**
 * Deletes a single watch history entry if it belongs to the user.
 * @param {string} userId - Auth user ID (UID)
 * @param {string} historyId - Firestore document ID
 */
export async function deleteHistoryItem(userId, historyId) {
  if (!userId || !historyId) return;
  const docRef = doc(db, 'watch_history', historyId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const model = WatchHistoryModel.fromFirestore(docSnap);
    if (model?.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to delete this history item.');
    }
  }

  await deleteDoc(docRef);
}

/**
 * Clears the user's entire watch history.
 */
export async function clearUserHistory(userId) {
  if (!userId) return;

  const historyRef = collection(db, 'watch_history');
  const q = query(historyRef, where('userId', '==', userId));

  try {
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  } catch (err) {
    console.error('Error clearing watch history:', err);
  }
}

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
    const cleanVideoId = String(videoId).trim();
    const docId = `${userId}_${cleanVideoId}`;
    const docRef = doc(db, 'watch_history', docId);

    const model = new WatchHistoryModel({
      id: docId,
      userId,
      videoId: cleanVideoId,
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
  try {
    let querySnapshot;
    try {
      const q = query(
        historyRef,
        where('userId', '==', userId),
        orderBy('openedAt', 'desc'),
        limit(100)
      );
      querySnapshot = await getDocs(q);
    } catch (indexErr) {
      console.warn('Composite index may be missing for watch_history query, falling back to in-memory sorting:', indexErr);
      const fallbackQ = query(historyRef, where('userId', '==', userId), limit(100));
      querySnapshot = await getDocs(fallbackQ);
    }

    const history = [];
    const seenVideoIds = new Set();

    querySnapshot.forEach((docSnap) => {
      const model = WatchHistoryModel.fromFirestore(docSnap);
      if (model && !seenVideoIds.has(model.videoId)) {
        seenVideoIds.add(model.videoId);
        history.push(model);
      }
    });

    history.sort((a, b) => {
      const timeA = a.openedAt ? new Date(a.openedAt).getTime() : 0;
      const timeB = b.openedAt ? new Date(b.openedAt).getTime() : 0;
      return timeB - timeA;
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
 * Clears all watch history for the given user.
 * @param {string} userId - Auth user ID (UID)
 */
export async function clearUserWatchHistory(userId) {
  if (!userId) return;
  const historyRef = collection(db, 'watch_history');
  const q = query(historyRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);

  const deletePromises = [];
  querySnapshot.forEach((docSnap) => {
    deletePromises.push(deleteDoc(docSnap.ref));
  });

  await Promise.all(deletePromises);
}

export const clearUserHistory = clearUserWatchHistory;


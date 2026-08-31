import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { WatchHistoryModel } from '../../models';

/**
 * Logs a video visit into Firestore watch_history.
 * Deduplicates back-to-back openings of the same video so it only shows as one entry.
 */
export async function logVideoOpen(userId, videoId, videoUrl, metadata) {
  if (!userId || !videoId) return null;

  const historyRef = collection(db, 'watch_history');

  try {
    // Check for the most recent entry of this user to dedup back-to-back views
    const q = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('openedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const latestDoc = querySnapshot.docs[0];
      const latestData = latestDoc.data();

      // If the most recent entry was for the SAME video, update it instead of adding a new one
      if (latestData.videoId === videoId) {
        await updateDoc(latestDoc.ref, {
          openedAt: serverTimestamp(),
          ...(metadata ? {
            metadata: {
              title: metadata.title || latestData.metadata?.title || 'YouTube Video',
              channel: metadata.channel || latestData.metadata?.channel || 'Unknown Creator',
              thumbnail: metadata.thumbnail || latestData.metadata?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            }
          } : {})
        });
        return latestDoc.id;
      }
    }

    // Create a new entry using WatchHistoryModel
    const model = new WatchHistoryModel({
      userId,
      videoId,
      videoUrl,
      metadata,
    });

    const docRef = await addDoc(historyRef, model.toFirestore({ isNew: true }));

    return docRef.id;
  } catch (err) {
    console.error('Error logging watch history:', err);
    return null;
  }
}

/**
 * Retrieves the user's watch history, deduplicating any back-to-back entries.
 * @returns {Promise<Array<WatchHistoryModel>>}
 */
export async function getUserWatchHistory(userId) {
  if (!userId) return [];

  const historyRef = collection(db, 'watch_history');
  const q = query(
    historyRef,
    where('userId', '==', userId),
    orderBy('openedAt', 'desc'),
    limit(50)
  );

  try {
    const querySnapshot = await getDocs(q);
    const history = [];
    let lastVideoId = null;

    querySnapshot.forEach((docSnap) => {
      const model = WatchHistoryModel.fromFirestore(docSnap);
      if (model && model.videoId !== lastVideoId) {
        history.push(model);
        lastVideoId = model.videoId;
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
  if (!docSnap.exists()) return;

  const model = WatchHistoryModel.fromFirestore(docSnap);

  // Security check: ensure entry belongs to requesting user
  if (model?.userId !== userId) {
    throw new Error('Unauthorized: You do not have permission to delete this history item.');
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

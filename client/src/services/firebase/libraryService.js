import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Creates a new playlist.
 */
export async function createPlaylist(userId, name) {
  if (!userId || !name.trim()) throw new Error('Playlist name cannot be empty.');

  const playlistRef = collection(db, 'playlists');
  const docRef = await addDoc(playlistRef, {
    userId,
    name: name.trim(),
    videoCount: 0,
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Retrieves all playlists created by a user.
 */
export async function getUserPlaylists(userId) {
  if (!userId) return [];

  const playlistRef = collection(db, 'playlists');
  const q = query(
    playlistRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const playlists = [];

  querySnapshot.forEach((docSnap) => {
    playlists.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return playlists;
}

/**
 * Deletes a playlist if it belongs to the authenticated user.
 * @param {string} userId - Auth user ID (UID)
 * @param {string} playlistId - Firestore document ID
 * @returns {Promise<void>}
 */
export async function deletePlaylist(userId, playlistId) {
  if (!userId || !playlistId) return;
  const docRef = doc(db, 'playlists', playlistId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  // Security check: ensure playlist belongs to requesting user
  if (docSnap.data().userId !== userId) {
    throw new Error('Unauthorized: You do not have permission to delete this playlist.');
  }

  await deleteDoc(docRef);
}

/**
 * Saves a video to the user's library.
 */
export async function saveVideoToLibrary(userId, videoId, videoUrl, metadata, notesReady = false) {
  if (!userId || !videoId) return;

  const docRef = doc(db, 'saved_videos', `${userId}_${videoId}`);
  await setDoc(docRef, {
    userId,
    videoId,
    videoUrl,
    metadata: {
      title: metadata?.title || 'YouTube Video',
      channel: metadata?.channel || 'Unknown Creator',
      thumbnail: metadata?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    },
    playlistIds: [], // Empty by default
    notesReady,
    savedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Removes a video from the user's library.
 */
export async function removeVideoFromLibrary(userId, videoId) {
  if (!userId || !videoId) return;
  const docRef = doc(db, 'saved_videos', `${userId}_${videoId}`);
  await deleteDoc(docRef);
}

/**
 * Checks if a video is saved in the user's library.
 */
export async function isVideoSaved(userId, videoId) {
  if (!userId || !videoId) return false;
  const docRef = doc(db, 'saved_videos', `${userId}_${videoId}`);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

/**
 * Retrieves the list of playlist IDs a video has been added to.
 */
export async function getVideoPlaylistIds(userId, videoId) {
  if (!userId || !videoId) return [];
  try {
    const docRef = doc(db, 'saved_videos', `${userId}_${videoId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().playlistIds || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching video playlist IDs:', err);
    return [];
  }
}

/**
 * Retrieves all saved videos in the user's library.
 */
export async function getUserSavedVideos(userId) {
  if (!userId) return [];

  const savedRef = collection(db, 'saved_videos');
  const q = query(
    savedRef,
    where('userId', '==', userId),
    orderBy('savedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const savedVideos = [];

  querySnapshot.forEach((docSnap) => {
    savedVideos.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return savedVideos;
}

export async function addVideoToPlaylist(userId, videoId, playlistId, videoData = null) {
  if (!userId || !videoId || !playlistId) return;

  const videoDocRef = doc(db, 'saved_videos', `${userId}_${videoId}`);
  const docSnap = await getDoc(videoDocRef);

  if (!docSnap.exists()) {
    // Document does not exist, create it first
    await setDoc(videoDocRef, {
      userId,
      videoId,
      videoUrl: videoData?.videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
      metadata: {
        title: videoData?.metadata?.title || 'YouTube Video',
        channel: videoData?.metadata?.channel || 'Unknown Creator',
        thumbnail: videoData?.metadata?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      },
      playlistIds: [playlistId],
      notesReady: videoData?.notesReady || false,
      savedAt: serverTimestamp()
    });
  } else {
    // Document exists, update it
    await updateDoc(videoDocRef, {
      playlistIds: arrayUnion(playlistId)
    });
  }

  // 2. Increment videoCount in playlists doc
  const playlistDocRef = doc(db, 'playlists', playlistId);
  const playlistSnap = await getDoc(playlistDocRef);
  if (playlistSnap.exists()) {
    const currentCount = playlistSnap.data().videoCount || 0;
    await updateDoc(playlistDocRef, {
      videoCount: currentCount + 1
    });
  }
}

/**
 * Removes a saved video from a playlist.
 */
export async function removeVideoFromPlaylist(userId, videoId, playlistId) {
  if (!userId || !videoId || !playlistId) return;

  // 1. Update array remove in saved_videos doc
  const videoDocRef = doc(db, 'saved_videos', `${userId}_${videoId}`);
  await updateDoc(videoDocRef, {
    playlistIds: arrayRemove(playlistId)
  });

  // 2. Decrement videoCount in playlists doc
  const playlistDocRef = doc(db, 'playlists', playlistId);
  const playlistSnap = await getDoc(playlistDocRef);
  if (playlistSnap.exists()) {
    const currentCount = playlistSnap.data().videoCount || 0;
    await updateDoc(playlistDocRef, {
      videoCount: Math.max(currentCount - 1, 0)
    });
  }
}

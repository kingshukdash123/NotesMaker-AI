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
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { PlaylistModel, SavedVideoModel } from '../../models';

/**
 * Creates a new playlist.
 */
export async function createPlaylist(userId, name) {
  const model = new PlaylistModel({
    userId,
    name,
    videos: [],
  });

  const playlistRef = collection(db, 'playlists');
  const docRef = await addDoc(playlistRef, model.toFirestore({ isNew: true }));

  return docRef.id;
}

/**
 * Retrieves all playlists created by a user.
 * @returns {Promise<Array<PlaylistModel>>}
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
    const playlist = PlaylistModel.fromFirestore(docSnap);
    if (playlist) {
      playlists.push(playlist);
    }
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

  const playlist = PlaylistModel.fromFirestore(docSnap);

  // Security check: ensure playlist belongs to requesting user
  if (playlist?.userId !== userId) {
    throw new Error('Unauthorized: You do not have permission to delete this playlist.');
  }

  await deleteDoc(docRef);
}

/**
 * Adds a video directly into a playlist's videos array.
 * Does NOT touch saved_videos.
 */
export async function addVideoToPlaylist(userId, videoId, playlistId, videoData = null) {
  if (!userId || !videoId || !playlistId) return;

  const playlistDocRef = doc(db, 'playlists', playlistId);
  const playlistSnap = await getDoc(playlistDocRef);
  if (!playlistSnap.exists()) {
    throw new Error('Playlist not found');
  }

  const playlist = PlaylistModel.fromFirestore(playlistSnap);
  if (playlist.userId !== userId) {
    throw new Error('Unauthorized: You do not own this playlist.');
  }

  // Build the video entry
  const newVideo = {
    videoId,
    videoUrl: videoData?.videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
    metadata: {
      title: videoData?.metadata?.title || videoData?.title || 'YouTube Video',
      channel: videoData?.metadata?.channel || videoData?.channel || 'Unknown Creator',
      thumbnail: videoData?.metadata?.thumbnail || videoData?.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
    },
    addedAt: new Date().toISOString(),
  };

  // Avoid duplicates in playlist
  const existingVideos = playlist.videos || [];
  const updatedVideos = existingVideos.some(v => v.videoId === videoId)
    ? existingVideos
    : [...existingVideos, newVideo];

  await updateDoc(playlistDocRef, {
    videos: updatedVideos,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Removes a video from a playlist's videos array.
 * Does NOT touch saved_videos.
 */
export async function removeVideoFromPlaylist(userId, videoId, playlistId) {
  if (!userId || !videoId || !playlistId) return;

  const playlistDocRef = doc(db, 'playlists', playlistId);
  const playlistSnap = await getDoc(playlistDocRef);
  if (!playlistSnap.exists()) return;

  const playlist = PlaylistModel.fromFirestore(playlistSnap);
  if (playlist.userId !== userId) {
    throw new Error('Unauthorized: You do not own this playlist.');
  }

  const updatedVideos = (playlist.videos || []).filter(v => v.videoId !== videoId);

  await updateDoc(playlistDocRef, {
    videos: updatedVideos,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Retrieves the list of playlist IDs a video has been added to.
 */
export async function getVideoPlaylistIds(userId, videoId) {
  if (!userId || !videoId) return [];
  try {
    const playlists = await getUserPlaylists(userId);
    return playlists
      .filter(pl => (pl.videos || []).some(v => v.videoId === videoId))
      .map(pl => pl.id);
  } catch (err) {
    console.error('Error fetching video playlist IDs:', err);
    return [];
  }
}

/**
 * Saves a video to the user's library (Bookmarks / Saved Videos).
 */
export async function saveVideoToLibrary(userId, videoId, videoUrl, metadata) {
  if (!userId || !videoId) return;

  const model = new SavedVideoModel({
    userId,
    videoId,
    videoUrl,
    metadata,
  });

  const docRef = doc(db, 'saved_videos', `${userId}_${videoId}`);
  await setDoc(docRef, model.toFirestore({ isNew: true }), { merge: true });
}

/**
 * Removes a video from the user's library (Bookmarks / Saved Videos).
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
 * Retrieves all saved videos in the user's library.
 * @returns {Promise<Array<SavedVideoModel>>}
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
    const video = SavedVideoModel.fromFirestore(docSnap);
    if (video) {
      savedVideos.push(video);
    }
  });

  return savedVideos;
}

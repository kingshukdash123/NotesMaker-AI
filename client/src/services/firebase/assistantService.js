import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Creates or updates an assistant chat thread.
 * @param {string} userId - Firebase Auth UID
 * @param {string} threadId - Unique ID of the thread
 * @param {Object} data - { title, lastMessage, createdAt }
 */
export async function saveAssistantThread(userId, threadId, data) {
  if (!userId) throw new Error('User must be logged in to save threads.');

  const docRef = doc(db, 'assistant_threads', `${userId}_${threadId}`);
  await setDoc(docRef, {
    userId,
    threadId,
    title: data.title || 'New Chat',
    updatedAt: serverTimestamp(),
    createdAt: data.createdAt || serverTimestamp(),
    lastMessage: data.lastMessage || ''
  }, { merge: true });
}

/**
 * Retrieves all assistant threads for a user.
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Array>} List of threads
 */
export async function getAssistantThreads(userId) {
  if (!userId) return [];

  const threadsRef = collection(db, 'assistant_threads');
  const q = query(
    threadsRef,
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const threads = [];
  querySnapshot.forEach((docSnap) => {
    threads.push(docSnap.data());
  });

  // Sort in-memory by updatedAt desc with safe checks for Firestore Timestamp structures
  threads.sort((a, b) => {
    const timeA = a.updatedAt?.toMillis 
      ? a.updatedAt.toMillis() 
      : a.updatedAt?.seconds 
        ? a.updatedAt.seconds * 1000 
        : new Date(a.updatedAt || 0).getTime();
        
    const timeB = b.updatedAt?.toMillis 
      ? b.updatedAt.toMillis() 
      : b.updatedAt?.seconds 
        ? b.updatedAt.seconds * 1000 
        : new Date(b.updatedAt || 0).getTime();
        
    return timeB - timeA;
  });

  return threads;
}

/**
 * Deletes an assistant thread and its associated messages.
 * @param {string} userId - Firebase Auth UID
 * @param {string} threadId - Unique ID of the thread
 */
export async function deleteAssistantThread(userId, threadId) {
  if (!userId || !threadId) return;

  const threadDocRef = doc(db, 'assistant_threads', `${userId}_${threadId}`);
  const messagesDocRef = doc(db, 'assistant_messages', `${userId}_${threadId}`);

  await deleteDoc(threadDocRef);
  await deleteDoc(messagesDocRef);
}

/**
 * Saves chat messages and conversation summary for a thread.
 * @param {string} userId - Firebase Auth UID
 * @param {string} threadId - Unique ID of the thread
 * @param {Array} messages - List of message objects
 * @param {string} summary - Short term memory summary paragraph
 */
export async function saveAssistantMessages(userId, threadId, messages, summary) {
  if (!userId || !threadId) return;

  // Filter out any error messages and their corresponding failed user queries
  const cleanMessages = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].isError) {
      if (cleanMessages.length > 0 && (cleanMessages[cleanMessages.length - 1].role === 'user' || cleanMessages[cleanMessages.length - 1].sender === 'user')) {
        cleanMessages.pop();
      }
    } else if (messages[i].content || messages[i].text) {
      cleanMessages.push(messages[i]);
    }
  }

  const docRef = doc(db, 'assistant_messages', `${userId}_${threadId}`);
  await setDoc(docRef, {
    userId,
    threadId,
    summary: summary || '',
    messages: cleanMessages.map(m => ({
      role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
      content: m.content || m.text,
      timestamp: m.timestamp || new Date().toISOString()
    })),
    updatedAt: serverTimestamp()
  });
}

/**
 * Retrieves messages and conversation summary for a thread.
 * @param {string} userId - Firebase Auth UID
 * @param {string} threadId - Unique ID of the thread
 * @returns {Promise<Object>} { messages: Array, summary: string }
 */
export async function getAssistantMessages(userId, threadId) {
  if (!userId || !threadId) return { messages: [], summary: '' };

  const docRef = doc(db, 'assistant_messages', `${userId}_${threadId}`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      messages: data.messages || [],
      summary: data.summary || ''
    };
  }
  return { messages: [], summary: '' };
}

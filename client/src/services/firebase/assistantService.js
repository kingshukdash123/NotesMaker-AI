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
import { AssistantThreadModel, AssistantMessageModel } from '../../models';

/**
 * Creates or updates an assistant chat thread.
 * @param {string} userId - Firebase Auth UID
 * @param {string} threadId - Unique ID of the thread
 * @param {Object} data - { title, lastMessage, createdAt }
 */
export async function saveAssistantThread(userId, threadId, data = {}) {
  if (!userId) throw new Error('User must be logged in to save threads.');

  const model = new AssistantThreadModel({
    userId,
    threadId,
    title: data.title || 'New Chat',
    lastMessage: data.lastMessage || '',
    createdAt: data.createdAt,
  });

  const docRef = doc(db, 'assistant_threads', `${userId}_${threadId}`);
  await setDoc(docRef, model.toFirestore(), { merge: true });
}

/**
 * Retrieves all assistant threads for a user.
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Array<AssistantThreadModel>>} List of threads
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
    const thread = AssistantThreadModel.fromFirestore(docSnap);
    if (thread) {
      threads.push(thread);
    }
  });

  // Sort in-memory by updatedAt desc
  threads.sort((a, b) => {
    const timeA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt || 0).getTime();
    const timeB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt || 0).getTime();
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
      cleanMessages.push({
        role: messages[i].role || (messages[i].sender === 'user' ? 'user' : 'assistant'),
        content: messages[i].content || messages[i].text,
        timestamp: messages[i].timestamp || new Date().toISOString(),
      });
    }
  }

  const model = new AssistantMessageModel({
    userId,
    threadId,
    messages: cleanMessages,
  });

  const docRef = doc(db, 'assistant_messages', `${userId}_${threadId}`);
  await setDoc(docRef, {
    ...model.toFirestore(),
    summary: summary || '',
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
    const model = AssistantMessageModel.fromFirestore(docSnap);
    const data = docSnap.data();
    return {
      messages: model?.messages || [],
      summary: data.summary || ''
    };
  }
  return { messages: [], summary: '' };
}

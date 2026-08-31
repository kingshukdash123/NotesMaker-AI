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
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Creates a new task in Firestore.
 */
export async function createTask(userId, title, date, priority = 'medium') {
  if (!userId || !title.trim() || !date) throw new Error('Task title and date are required.');

  const tasksRef = collection(db, 'planner_tasks');
  const docRef = await addDoc(tasksRef, {
    userId,
    title: title.trim(),
    date, // YYYY-MM-DD local format
    priority, // 'high' | 'medium' | 'low'
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Retrieves tasks for a specific date.
 */
export async function getTasksByDate(userId, date) {
  if (!userId || !date) return [];

  const tasksRef = collection(db, 'planner_tasks');
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    where('date', '==', date),
    orderBy('createdAt', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks = [];

  querySnapshot.forEach((docSnap) => {
    tasks.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return tasks;
}

/**
 * Retrieves tasks in a date range (for monthly calendar view).
 */
export async function getTasksByMonth(userId, startDateStr, endDateStr) {
  if (!userId || !startDateStr || !endDateStr) return [];

  const tasksRef = collection(db, 'planner_tasks');
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    where('date', '>=', startDateStr),
    where('date', '<=', endDateStr)
  );

  const querySnapshot = await getDocs(q);
  const tasks = [];

  querySnapshot.forEach((docSnap) => {
    tasks.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return tasks;
}

/**
 * Toggles completion status of a task.
 */
export async function toggleTaskStatus(taskId, currentStatus) {
  if (!taskId) return;
  const docRef = doc(db, 'planner_tasks', taskId);
  await updateDoc(docRef, {
    completed: !currentStatus,
    updatedAt: serverTimestamp()
  });
}

/**
 * Deletes a task if it belongs to the user.
 * @param {string} userId - Auth user ID (UID)
 * @param {string} taskId - Firestore document ID
 */
export async function deleteTask(userId, taskId) {
  if (!userId || !taskId) return;
  const docRef = doc(db, 'planner_tasks', taskId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  // Security check: ensure task belongs to requesting user
  if (docSnap.data().userId !== userId) {
    throw new Error('Unauthorized: You do not have permission to delete this task.');
  }

  await deleteDoc(docRef);
}

/**
 * Updates task information (e.g. title or priority).
 */
export async function updateTaskDetails(taskId, title, priority) {
  if (!taskId) return;
  const docRef = doc(db, 'planner_tasks', taskId);
  await updateDoc(docRef, {
    title: title.trim(),
    priority,
    updatedAt: serverTimestamp()
  });
}

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
import { PlannerTaskModel } from '../../models';

/**
 * Creates a new task in Firestore.
 */
export async function createTask(userId, title, date, priority = 'medium') {
  const model = new PlannerTaskModel({
    userId,
    title,
    date,
    priority,
    completed: false,
  });

  const tasksRef = collection(db, 'planner_tasks');
  const docRef = await addDoc(tasksRef, model.toFirestore({ isNew: true }));

  return docRef.id;
}

/**
 * Retrieves tasks for a specific date.
 * @returns {Promise<Array<PlannerTaskModel>>}
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
    const task = PlannerTaskModel.fromFirestore(docSnap);
    if (task) {
      tasks.push(task);
    }
  });

  return tasks;
}

/**
 * Retrieves tasks in a date range (for monthly calendar view).
 * @returns {Promise<Array<PlannerTaskModel>>}
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
    const task = PlannerTaskModel.fromFirestore(docSnap);
    if (task) {
      tasks.push(task);
    }
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

  const task = PlannerTaskModel.fromFirestore(docSnap);

  // Security check: ensure task belongs to requesting user
  if (task?.userId !== userId) {
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
    title: (title || '').trim(),
    priority,
    updatedAt: serverTimestamp()
  });
}

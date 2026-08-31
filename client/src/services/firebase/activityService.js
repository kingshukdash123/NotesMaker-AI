import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserActivityModel } from '../../models';

/**
 * Logs user login/activity for the current day.
 * Uses a daily document ID format to prevent multiple writes in the same day.
 */
export async function logUserActivity(userId) {
  if (!userId) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const model = new UserActivityModel({
    userId,
    date: dateStr,
  });

  const docRef = doc(db, 'user_activity', `${userId}_${dateStr}`);
  
  try {
    await setDoc(docRef, model.toFirestore(), { merge: true });
  } catch (err) {
    console.error('Failed to log daily user activity:', err);
  }
}

/**
 * Retrieves all activity days for the user.
 * @returns {Promise<Array<UserActivityModel>>}
 */
export async function getUserActivity(userId) {
  if (!userId) return [];

  const activityRef = collection(db, 'user_activity');
  const q = query(activityRef, where('userId', '==', userId));

  try {
    const querySnapshot = await getDocs(q);
    const activityList = [];
    querySnapshot.forEach((docSnap) => {
      const model = UserActivityModel.fromFirestore(docSnap);
      if (model) {
        activityList.push(model);
      }
    });
    return activityList;
  } catch (err) {
    console.error('Failed to fetch user activity list:', err);
    return [];
  }
}

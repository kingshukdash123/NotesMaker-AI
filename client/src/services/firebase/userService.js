import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserModel, DEFAULT_STUDENT_PREFERENCES } from '../../models/userModel';

export { DEFAULT_STUDENT_PREFERENCES };

/**
 * Creates or overwrites a user profile document in Firestore using UserModel.
 * @param {string} uid - Firebase Auth User UID
 * @param {Object} data - Profile details { displayName, phoneNumber, email, preferences, hasCompletedOnboarding }
 * @returns {Promise<Object>} Created user profile data
 */
export async function createUserProfile(uid, { displayName, phoneNumber, email, preferences, hasCompletedOnboarding = false }) {
  if (!uid) throw new Error('User UID is required to create a profile.');

  const userModel = new UserModel({
    uid,
    displayName,
    phoneNumber,
    email,
    preferences: preferences || DEFAULT_STUDENT_PREFERENCES,
    hasCompletedOnboarding: Boolean(hasCompletedOnboarding),
  });

  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, userModel.toFirestore({ isNew: true }), { merge: true });
  return userModel.toPlainObject();
}

/**
 * Retrieves a user profile by Firebase UID using UserModel.fromFirestore.
 * @param {string} uid - Firebase Auth User UID
 * @returns {Promise<Object|null>} User profile data or null if not found
 */
export async function getUserProfile(uid) {
  if (!uid) return null;

  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userModel = UserModel.fromFirestore(docSnap);
      return userModel ? userModel.toPlainObject() : null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function checkPhoneRegistered(formattedPhone) {
  if (!formattedPhone) return false;

  try {
    const rawDigits = formattedPhone.replace(/[^0-9]/g, '');
    const phoneWithPlus = formattedPhone.startsWith('+') ? formattedPhone.trim() : `+${formattedPhone.trim()}`;
    const tenDigits = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    const usersRef = collection(db, 'users');
    
    // Check with + prefix (e.g. +919876543210)
    const q1 = query(usersRef, where('phoneNumber', '==', phoneWithPlus));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) return true;

    // Check with 10 digits (e.g. 9876543210)
    if (tenDigits !== phoneWithPlus) {
      const q2 = query(usersRef, where('phoneNumber', '==', tenDigits));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) return true;
    }

    // Check with full raw digits (e.g. 919876543210)
    if (rawDigits !== tenDigits && rawDigits !== phoneWithPlus) {
      const q3 = query(usersRef, where('phoneNumber', '==', rawDigits));
      const snap3 = await getDocs(q3);
      if (!snap3.empty) return true;
    }

    return false;
  } catch (error) {
    console.warn('Error querying phone registration status:', error);
    return false;
  }
}

/**
 * Updates an existing user profile in Firestore.
 * @param {string} uid - Firebase Auth User UID
 * @param {Object} updates - Fields to update (e.g., displayName, email)
 */
export async function updateUserProfile(uid, updates) {
  if (!uid) throw new Error('User UID is required to update profile.');

  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Updates user learning/mentor preferences in Firestore.
 * @param {string} uid - Firebase Auth User UID
 * @param {Object} preferences - Student academic preferences
 * @param {boolean} hasCompletedOnboarding - Flag indicating onboarding status
 */
export async function updateUserPreferences(uid, preferences, hasCompletedOnboarding = true) {
  if (!uid) throw new Error('User UID is required to update preferences.');

  const userRef = doc(db, 'users', uid);
  const updatedData = {
    preferences: UserModel.normalizePreferences(preferences),
    hasCompletedOnboarding: Boolean(hasCompletedOnboarding),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, updatedData, { merge: true });
  return updatedData;
}

/**
 * Marks onboarding as skipped and persists default student preferences.
 * @param {string} uid - Firebase Auth User UID
 */
export async function skipOnboarding(uid) {
  return updateUserPreferences(uid, DEFAULT_STUDENT_PREFERENCES, true);
}

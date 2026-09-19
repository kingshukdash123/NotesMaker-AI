import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import {
  PlanModel,
  PLANS_COLLECTION,
  PLAN_IDS,
  PLAN_RANKS,
  DEFAULT_PLANS,
} from '../../models';


/**
 * Returns the numeric rank for plan hierarchy (0 = Starter, 1 = Learner, 2 = Scholar).
 * @param {string} [planId]
 * @returns {number}
 */
export function getPlanRank(planId) {
  if (!planId) return 0;
  return PLAN_RANKS[planId] ?? 0;
}

/**
 * Returns the plan config for a given plan ID, defaulting to Starter.
 * @param {string} [planId]
 * @returns {Object}
 */
export function getPlan(planId) {
  if (!planId) return DEFAULT_PLANS[PLAN_IDS.STARTER];
  return DEFAULT_PLANS[planId] || DEFAULT_PLANS[PLAN_IDS.STARTER];
}

/**
 * Checks if a specific boolean feature is allowed on the given plan.
 * @param {string} planId
 * @param {string} featureKey
 * @returns {boolean}
 */
export function checkFeatureAccess(planId, featureKey) {
  const plan = getPlan(planId);
  return Boolean(plan.limits?.[featureKey]);
}

/**
 * Checks if a numeric quota is exceeded.
 * @param {number} currentCount
 * @param {string} planId
 * @param {'monthlyNotesQuota'|'monthlyChatQuota'|'maxPlaylists'} quotaKey
 * @returns {boolean} True if current count is greater than or equal to quota limit.
 */
export function isQuotaExceeded(currentCount, planId, quotaKey) {
  const plan = getPlan(planId);
  const limit = plan.limits?.[quotaKey];
  if (limit === Infinity || limit === undefined || limit === null) return false;
  return Number(currentCount || 0) >= limit;
}

/**
 * Formats duration in seconds to human readable string (e.g. "45m" or "2h 30m" or "15h")
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Seeds default plan configurations to Firestore if the collection is empty or missing any tier.
 */
export async function seedDefaultPlansIfEmpty() {
  try {
    const plansColRef = collection(db, PLANS_COLLECTION);
    const snapshot = await getDocs(plansColRef);

    if (snapshot.empty) {
      console.info('🌱 Seeding initial subscription plans into Firestore...');
      for (const [planId, planData] of Object.entries(DEFAULT_PLANS)) {
        const planModel = new PlanModel(planData);
        const planDocRef = doc(db, PLANS_COLLECTION, planId);
        await setDoc(planDocRef, planModel.toFirestore({ isNew: true }), { merge: true });
      }
      console.info('✅ Initial subscription plans seeded successfully.');
    } else {
      // Check if any specific tier doc is missing
      for (const [planId, planData] of Object.entries(DEFAULT_PLANS)) {
        const planDocRef = doc(db, PLANS_COLLECTION, planId);
        const docSnap = await getDoc(planDocRef);
        if (!docSnap.exists()) {
          const planModel = new PlanModel(planData);
          await setDoc(planDocRef, planModel.toFirestore({ isNew: true }), { merge: true });
        }
      }
    }
  } catch (error) {
    console.warn('Unable to seed/verify default plans in Firestore:', error);
  }
}

/**
 * Fetches all subscription plans from Firestore once.
 * @returns {Promise<Record<string, Object>>}
 */
export async function fetchPlansFromFirestore() {
  try {
    const plansColRef = collection(db, PLANS_COLLECTION);
    const snapshot = await getDocs(plansColRef);

    if (snapshot.empty) {
      await seedDefaultPlansIfEmpty();
      return DEFAULT_PLANS;
    }

    const plansMap = {};
    snapshot.forEach((docSnap) => {
      const model = PlanModel.fromFirestore(docSnap);
      if (model) {
        plansMap[model.id] = model.toPlainObject();
      }
    });

    return Object.keys(plansMap).length > 0 ? plansMap : DEFAULT_PLANS;
  } catch (error) {
    console.error('Error fetching plans from Firestore:', error);
    return DEFAULT_PLANS;
  }
}

/**
 * Subscribes to real-time updates for all plans in Firestore.
 * @param {Function} callback (plansMap: Record<string, Object>) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribePlansFromFirestore(callback) {
  if (typeof callback !== 'function') return () => {};

  const plansColRef = collection(db, PLANS_COLLECTION);

  return onSnapshot(
    plansColRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const plansMap = {};
        snapshot.forEach((docSnap) => {
          const model = PlanModel.fromFirestore(docSnap);
          if (model) {
            plansMap[model.id] = model.toPlainObject();
          }
        });

        // Ensure default IDs exist if partial snapshot
        const mergedPlans = { ...DEFAULT_PLANS, ...plansMap };
        callback(mergedPlans);
      } else {
        // If collection is empty, trigger seed and return defaults
        seedDefaultPlansIfEmpty();
        callback(DEFAULT_PLANS);
      }
    },
    (error) => {
      console.warn('Error subscribing to plans from Firestore (using defaults):', error);
      callback(DEFAULT_PLANS);
    }
  );
}

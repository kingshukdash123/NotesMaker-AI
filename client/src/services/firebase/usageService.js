import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UsageModel, getEffectiveSubscription } from '../../models/usageModel';
import { getPlan, isQuotaExceeded, formatDuration } from './planService';

/**
 * Retrieves the current monthly usage record for a user.
 * @param {string} userId - Firebase Auth UID
 * @param {string} [period] - Month period string (YYYY-MM-DD)
 * @returns {Promise<UsageModel>}
 */
export async function getUserMonthlyUsage(userId, period = UsageModel.getCurrentPeriod()) {
  if (!userId) return new UsageModel({ period });

  try {
    const usageDocRef = doc(db, 'users', userId, 'usage', period);
    const docSnap = await getDoc(usageDocRef);

    if (docSnap.exists()) {
      return UsageModel.fromFirestore(docSnap);
    }

    // Initialize document if not exists
    const initialUsage = new UsageModel({ period });
    await setDoc(usageDocRef, initialUsage.toFirestore(), { merge: true });
    return initialUsage;
  } catch (error) {
    console.error('Error fetching monthly usage:', error);
    return new UsageModel({ period });
  }
}

/**
 * Subscribes in real-time to current month's usage document.
 * @param {string} userId
 * @param {Function} callback (usage: UsageModel) => void
 * @param {string} [period]
 * @returns {Function} Unsubscribe callback
 */
export function subscribeUserMonthlyUsage(userId, callback, period = UsageModel.getCurrentPeriod()) {
  if (!userId || typeof callback !== 'function') {
    return () => {};
  }

  const usageDocRef = doc(db, 'users', userId, 'usage', period);
  return onSnapshot(
    usageDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const usage = UsageModel.fromFirestore(docSnap);
        callback(usage);
      } else {
        callback(new UsageModel({ period }));
      }
    },
    (err) => {
      console.error('Error subscribing to monthly usage:', err);
    }
  );
}

/**
 * Atomically increments a usage counter in Firestore.
 * @param {string} userId - Firebase Auth UID
 * @param {'notesGenerated'|'videoQaQuestions'|'assistantQuestions'} fieldName
 * @param {number} [amount=1]
 * @param {string} [period]
 */
export async function incrementUsageCount(
  userId,
  fieldName,
  amount = 1,
  period = UsageModel.getCurrentPeriod()
) {
  if (!userId || !fieldName) return;

  try {
    const usageDocRef = doc(db, 'users', userId, 'usage', period);
    await setDoc(
      usageDocRef,
      {
        [fieldName]: increment(amount),
        period,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Error incrementing usage field '${fieldName}':`, error);
  }
}

/**
 * Updates a user's subscription plan and status in Firestore.
 * When a user purchases a plan, that purchase date becomes the new starting date for their billing period.
 * @param {string} userId
 * @param {Object} subscription - { planId, status, startedAt, validUntil }
 */
export async function updateUserSubscription(userId, subscription) {
  if (!userId || !subscription) return;

  const now = new Date();
  const planId = subscription.planId || 'starter';
  const startedAt = subscription.startedAt || now.toISOString();
  const startedAtDate = new Date(startedAt);
  const validUntil = subscription.validUntil || new Date(startedAtDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    subscription: {
      planId,
      status: subscription.status || 'active',
      startedAt,
      validUntil,
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Synchronizes an expired paid subscription back to the default free Starter plan in Firestore.
 * Anchors the new billing period start date to the expiration timestamp.
 * @param {string} userId
 * @param {string|Date} expiredAt
 */
export async function syncExpiredSubscription(userId, expiredAt) {
  if (!userId) return;
  try {
    const expiredDate = expiredAt instanceof Date ? expiredAt : (expiredAt ? new Date(expiredAt) : new Date());
    const validUntilDate = new Date(expiredDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    await updateUserSubscription(userId, {
      planId: 'starter',
      status: 'active',
      startedAt: expiredDate.toISOString(),
      validUntil: validUntilDate.toISOString(),
    });
  } catch (err) {
    console.error('Error syncing expired subscription to Firestore:', err);
  }
}

/**
 * Validates whether the user can generate notes for a given video based on duration and remaining monthly quota.
 * @param {Object} userProfile - User profile from AuthContext
 * @param {UsageModel|Object} usage - Current monthly usage
 * @param {number} videoDurationSeconds - Video length in seconds
 * @returns {{ allowed: boolean, reason?: string, upgradeRequired?: boolean }}
 */
export function checkCanGenerateNotes(userProfile, usage, videoDurationSeconds = 0) {
  const effectiveSub = getEffectiveSubscription(userProfile);
  const planId = effectiveSub.planId || 'starter';
  const plan = getPlan(planId);

  // 1. Check video duration limit
  const maxDuration = plan.limits.maxVideoDurationSeconds;
  if (videoDurationSeconds > 0 && videoDurationSeconds > maxDuration) {
    return {
      allowed: false,
      upgradeRequired: true,
      reason: `Video length (${formatDuration(videoDurationSeconds)}) exceeds your ${plan.name} limit (${plan.limits.maxVideoDurationDisplay}). Upgrade to process longer lectures.`,
    };
  }

  // 2. Check monthly notes quota
  const usedNotes = usage?.notesGenerated || 0;
  const baseQuota = plan.limits.monthlyNotesQuota || 10;

  if (usedNotes >= baseQuota) {
    return {
      allowed: false,
      upgradeRequired: true,
      reason: `You have used all ${baseQuota} lecture note sessions for this month on the ${plan.name} plan. Upgrade to unlock more sessions.`,
    };
  }

  return { allowed: true };
}

/**
 * Validates whether the user can ask AI questions or chat with the assistant mentor.
 * @param {Object} userProfile - User profile from AuthContext
 * @param {UsageModel|Object} usage - Current monthly usage
 * @returns {{ allowed: boolean, reason?: string, upgradeRequired?: boolean }}
 */
export function checkCanChat(userProfile, usage) {
  const effectiveSub = getEffectiveSubscription(userProfile);
  const planId = effectiveSub.planId || 'starter';
  const plan = getPlan(planId);

  const usedChats = (Number(usage?.videoQaQuestions || 0)) + (Number(usage?.assistantQuestions || 0));
  const baseQuota = plan.limits.monthlyChatQuota || 75;

  if (usedChats >= baseQuota) {
    return {
      allowed: false,
      upgradeRequired: true,
      reason: `You have reached your monthly Guruji doubt limit (${usedChats}/${baseQuota}) on the ${plan.name} plan. Upgrade to unlock more questions.`,
    };
  }

  return { allowed: true };
}

/**
 * Determines whether an error string represents a user subscription tier / quota limit
 * rather than a backend / LLM provider rate limit or technical failure.
 *
 * @param {string} errorMsg
 * @returns {boolean}
 */
export function isUserPlanLimitError(errorMsg) {
  if (!errorMsg || typeof errorMsg !== 'string') return false;
  const lower = errorMsg.toLowerCase();

  // 1. Exclude LLM provider/system rate limits, API quotas, and network errors
  const isProviderOrSystemLimit =
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('resource exhausted') ||
    lower.includes('gemini') ||
    lower.includes('tpm') ||
    lower.includes('rpm') ||
    lower.includes('token limit') ||
    lower.includes('quota exceeded on api') ||
    lower.includes('model is overloaded') ||
    lower.includes('timed out');

  if (isProviderOrSystemLimit) return false;

  // 2. Match genuine user subscription plan limits
  return (
    lower.includes('plan limit') ||
    lower.includes('monthly note') ||
    lower.includes('monthly ai doubt') ||
    lower.includes('please upgrade') ||
    lower.includes('upgrade to unlock') ||
    lower.includes('upgrade to process') ||
    lower.includes('exceeds your') ||
    lower.includes('lecture note sessions for this month')
  );
}

/**
 * Formats user-facing error messages to provide clean, helpful text for provider rate limits.
 *
 * @param {string} rawMsg
 * @returns {string}
 */
export function formatProcessErrorMessage(rawMsg) {
  if (!rawMsg) return 'Failed to generate lecture notes.';
  const lower = String(rawMsg).toLowerCase();

  if (
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('resource exhausted') ||
    lower.includes('tpm') ||
    lower.includes('token limit') ||
    lower.includes('model is overloaded')
  ) {
    return 'AI servers are currently experiencing high demand. Please try again in a few moments.';
  }

  return rawMsg;
}




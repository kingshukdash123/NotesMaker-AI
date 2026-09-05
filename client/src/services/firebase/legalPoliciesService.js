import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { LegalPolicyModel } from '../../models';
import {
  LEGAL_POLICIES_DEFAULTS,
  LEGAL_POLICY_SLUGS,
  LEGAL_POLICIES_COLLECTION,
} from '../../constants';

const COLLECTION = LEGAL_POLICIES_COLLECTION;

/**
 * Retrieves a single legal policy document from Firestore by slug.
 * Falls back to the local default content if the document doesn't exist.
 *
 * @param {string} slug - Policy slug: 'privacy' | 'terms' | 'disclaimer' | 'cookies' | 'refund'
 * @returns {Promise<LegalPolicyModel>} The policy model
 */
export async function getLegalPolicy(slug) {
  if (!slug) throw new Error('Policy slug is required.');

  try {
    const docRef = doc(db, COLLECTION, slug);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return LegalPolicyModel.fromFirestore(docSnap);
    }

    // Firestore doc missing — seed it and return the default
    const defaultData = LEGAL_POLICIES_DEFAULTS[slug];
    if (defaultData) {
      await _seedPolicyDocument(slug, defaultData);
      return new LegalPolicyModel(defaultData);
    }

    return null;
  } catch (err) {
    console.warn(`[legalPoliciesService] Failed to fetch policy "${slug}" from Firestore. Using local default.`, err);
    // Fallback: return local default without seeding (offline / permission error)
    const defaultData = LEGAL_POLICIES_DEFAULTS[slug];
    return defaultData ? new LegalPolicyModel(defaultData) : null;
  }
}

/**
 * Retrieves all active legal policy documents from Firestore.
 * Seeds any missing documents from local defaults before returning.
 *
 * @returns {Promise<LegalPolicyModel[]>} Array of active policy models in display order
 */
export async function getAllLegalPolicies() {
  try {
    const colRef = collection(db, COLLECTION);
    const q = query(colRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);

    const fetchedSlugs = new Set();
    const policies = [];

    querySnapshot.forEach((docSnap) => {
      const model = LegalPolicyModel.fromFirestore(docSnap);
      if (model) {
        fetchedSlugs.add(model.slug);
        policies.push(model);
      }
    });

    // Seed any slugs that are missing from Firestore
    for (const slug of LEGAL_POLICY_SLUGS) {
      if (!fetchedSlugs.has(slug) && LEGAL_POLICIES_DEFAULTS[slug]) {
        await _seedPolicyDocument(slug, LEGAL_POLICIES_DEFAULTS[slug]);
        policies.push(new LegalPolicyModel(LEGAL_POLICIES_DEFAULTS[slug]));
      }
    }

    // Return in canonical display order
    return LEGAL_POLICY_SLUGS
      .map((slug) => policies.find((p) => p.slug === slug))
      .filter(Boolean);
  } catch (err) {
    console.warn('[legalPoliciesService] Failed to fetch all policies from Firestore. Using local defaults.', err);
    // Offline fallback: return all local defaults
    return LEGAL_POLICY_SLUGS
      .map((slug) => LEGAL_POLICIES_DEFAULTS[slug] ? new LegalPolicyModel(LEGAL_POLICIES_DEFAULTS[slug]) : null)
      .filter(Boolean);
  }
}

/**
 * Creates or replaces a legal policy document in Firestore.
 * Intended for admin use when updating policy text.
 *
 * @param {string} slug - Policy slug
 * @param {Object} policyData - Full policy data matching LegalPolicyModel constructor
 * @returns {Promise<void>}
 */
export async function upsertLegalPolicy(slug, policyData) {
  if (!slug) throw new Error('Policy slug is required.');

  const model = new LegalPolicyModel({ ...policyData, slug });
  const docRef = doc(db, COLLECTION, slug);
  await setDoc(docRef, model.toFirestore({ isNew: false }), { merge: true });
}


/**
 * Internal helper: seeds a single policy document into Firestore.
 * Uses { merge: true } to avoid overwriting any existing partial data.
 *
 * @param {string} slug
 * @param {Object} defaultData
 * @returns {Promise<void>}
 */
async function _seedPolicyDocument(slug, defaultData) {
  try {
    const model = new LegalPolicyModel(defaultData);
    const docRef = doc(db, COLLECTION, slug);
    await setDoc(docRef, {
      ...model.toFirestore({ isNew: true }),
      // Store effectiveDate as an ISO string for readability in Firestore console
      effectiveDate: defaultData.effectiveDate instanceof Date
        ? defaultData.effectiveDate.toISOString()
        : defaultData.effectiveDate || new Date().toISOString(),
    }, { merge: true });
    console.info(`[legalPoliciesService] Seeded policy document: "${slug}"`);
  } catch (err) {
    // Seeding failure is non-critical — app continues using local defaults
    console.warn(`[legalPoliciesService] Could not seed policy "${slug}":`, err);
  }
}

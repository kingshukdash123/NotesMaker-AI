/**
 * updateLegalPoliciesToFirebase.js
 *
 * Script to update all legal policy documents into Firebase Firestore collection `legal_policies`.
 * Run with: node --env-file=.env scripts/updateLegalPoliciesToFirebase.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  LEGAL_POLICIES_DEFAULTS,
  LEGAL_POLICY_SLUGS,
  LEGAL_POLICIES_COLLECTION,
} from '../src/constants/index.js';

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
  measurementId: process.env.VITE_MEASUREMENT_ID,
};

console.log(`Connecting to Firebase Project: ${firebaseConfig.projectId}...`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAllPolicies() {
  console.log(`Updating ${LEGAL_POLICY_SLUGS.length} policy documents into collection "${LEGAL_POLICIES_COLLECTION}"...`);

  let successCount = 0;
  for (const slug of LEGAL_POLICY_SLUGS) {
    const data = LEGAL_POLICIES_DEFAULTS[slug];
    if (!data) {
      console.warn(`[SKIP] No default content found for "${slug}".`);
      continue;
    }

    try {
      const docRef = doc(db, LEGAL_POLICIES_COLLECTION, slug);
      const payload = {
        id: slug,
        slug: slug,
        title: data.title,
        version: data.version || '1.0.0',
        isActive: data.isActive !== false,
        planScope: data.planScope || ['free'],
        sections: data.sections || [],
        effectiveDate: data.effectiveDate instanceof Date
          ? data.effectiveDate.toISOString()
          : data.effectiveDate || new Date().toISOString(),
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
      console.log(`✓ [UPDATED] "${slug}" (${data.title}) — ${data.sections.length} sections`);
      successCount++;
    } catch (err) {
      console.error(`✗ [FAILED] "${slug}":`, err.message);
    }
  }

  console.log(`\nComplete: ${successCount}/${LEGAL_POLICY_SLUGS.length} documents updated in Firestore.`);
  process.exit(successCount === LEGAL_POLICY_SLUGS.length ? 0 : 1);
}

updateAllPolicies().catch((err) => {
  console.error('Fatal error updating legal policies:', err);
  process.exit(1);
});

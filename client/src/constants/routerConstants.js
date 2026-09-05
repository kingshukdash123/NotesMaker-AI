/**
 * routerConstants.js
 * Centralized routing and navigation constants for Pathshala AI.
 */

import { LEGAL_SECTIONS } from './legalPoliciesDefaults.js';

/** Core application sections requiring auth */
export const VALID_CORE_SECTIONS = new Set([
  'dashboard',
  'discover',
  'search',
  'library',
  'planner',
  'assistant',
  'watch',
]);

/** All valid URL top-level sections (core app + legal pages) */
export const VALID_SECTIONS = new Set([
  ...VALID_CORE_SECTIONS,
  ...LEGAL_SECTIONS,
]);

/** Valid sub-tabs within the library section */
export const VALID_LIBRARY_TABS = new Set(['history', 'notes', 'saved', 'playlists']);

/** Valid sub-tabs within the planner section */
export const VALID_PLANNER_TABS = new Set(['daily', 'monthly']);

/** Valid sub-tabs within the video watch companion (/watch?v=...&tab=...) */
export const VALID_VIDEO_TABS = new Set(['notes', 'summary', 'qa']);

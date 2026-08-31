/**
 * Routing and Clean URL Utilities for Pathshala AI.
 * Handles parsing deep links, sub-tabs, and YouTube watch URLs (/watch?v=VIDEO_ID).
 */

const VALID_SECTIONS = new Set(['dashboard', 'discover', 'library', 'planner', 'assistant', 'watch']);
const VALID_LIBRARY_TABS = new Set(['history', 'notes', 'saved', 'playlists']);
const VALID_PLANNER_TABS = new Set(['daily', 'monthly']);
const VALID_VIDEO_TABS = new Set(['notes', 'summary', 'qa']);

/**
 * Extracts an 11-character YouTube video ID from various URL formats or plain ID string.
 * Supports:
 * - https://www.youtube.com/watch?v=_MR1Dp8-F8w
 * - https://youtu.be/_MR1Dp8-F8w
 * - https://www.youtube.com/embed/_MR1Dp8-F8w
 * - _MR1Dp8-F8w
 */
export function extractYouTubeVideoId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return '';
  const trimmed = urlOrId.trim();

  // If already standard 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Check URL formats
  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    
    // 1. ?v= parameter
    const vParam = urlObj.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // 2. youtu.be/ID
    if (urlObj.hostname.includes('youtu.be')) {
      const id = urlObj.pathname.slice(1).split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // 3. /embed/ID or /v/ID or /watch/ID
    const parts = urlObj.pathname.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      if (['embed', 'v', 'watch', 'discover', 'video'].includes(parts[i]) && parts[i + 1]) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(parts[i + 1])) {
          return parts[i + 1];
        }
      }
    }
  } catch {
    // Regex fallback
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '';
}

/**
 * Parses current window pathname and search query into structured app navigation state.
 *
 * @param {string} [pathname] - e.g. window.location.pathname
 * @param {string} [search] - e.g. window.location.search
 * @returns {Object} { section, libraryTab, plannerTab, videoId, videoTab }
 */
export function parseLocation(
  pathname = window.location.pathname,
  search = window.location.search
) {
  const searchParams = new URLSearchParams(search);
  const parts = pathname.split('/').filter(Boolean); // e.g. ["library", "notes"] or ["watch"]
  const firstPart = parts[0]?.toLowerCase() || '';
  const secondPart = parts[1]?.toLowerCase() || '';

  let section = 'dashboard';
  let libraryTab = 'history';
  let plannerTab = 'daily';
  let videoId = '';
  let videoTab = 'notes';

  // 1. Check for video watch URL
  // Formats: /watch?v=ID, /watch/ID, /discover/ID, /video/ID, or ?v=ID anywhere
  const queryV = searchParams.get('v');
  if (queryV) {
    const extracted = extractYouTubeVideoId(queryV);
    if (extracted) {
      videoId = extracted;
      section = 'discover'; // Render unified watch workspace
    }
  }

  if (firstPart === 'watch') {
    section = 'discover';
    if (!videoId && secondPart) {
      const extracted = extractYouTubeVideoId(secondPart);
      if (extracted) videoId = extracted;
    }
  } else if (firstPart === 'discover' && secondPart) {
    const extracted = extractYouTubeVideoId(secondPart);
    if (extracted) {
      videoId = extracted;
      section = 'discover';
    }
  } else if (firstPart === 'video' && secondPart) {
    const extracted = extractYouTubeVideoId(secondPart);
    if (extracted) {
      videoId = extracted;
      section = 'discover';
    }
  }

  // Check video study tool tab: ?tab=notes | summary | qa
  const queryTab = searchParams.get('tab')?.toLowerCase();
  if (queryTab && VALID_VIDEO_TABS.has(queryTab)) {
    videoTab = queryTab;
  }

  // 2. Parse main navigation sections and sub-tabs if not currently watching a video
  if (!videoId) {
    if (VALID_SECTIONS.has(firstPart)) {
      section = firstPart === 'watch' ? 'discover' : firstPart;
    } else if (firstPart === '') {
      section = 'dashboard';
    }

    // Sub-tab parsing
    if (section === 'library') {
      if (VALID_LIBRARY_TABS.has(secondPart)) {
        libraryTab = secondPart;
      } else if (queryTab && VALID_LIBRARY_TABS.has(queryTab)) {
        libraryTab = queryTab;
      }
    } else if (section === 'planner') {
      if (VALID_PLANNER_TABS.has(secondPart)) {
        plannerTab = secondPart;
      } else if (queryTab && VALID_PLANNER_TABS.has(queryTab)) {
        plannerTab = queryTab;
      }
    }
  }

  return {
    section,
    libraryTab,
    plannerTab,
    videoId,
    videoTab,
  };
}

/**
 * Builds a clean canonical URL for the given state.
 *
 * @param {Object} state
 * @param {string} state.section - 'dashboard' | 'discover' | 'library' | 'planner' | 'assistant'
 * @param {string} [state.libraryTab] - 'history' | 'notes' | 'saved' | 'playlists'
 * @param {string} [state.plannerTab] - 'daily' | 'monthly'
 * @param {string} [state.videoId] - YouTube video ID
 * @param {string} [state.videoTab] - 'notes' | 'summary' | 'qa'
 * @returns {string} Clean relative URL path, e.g. "/watch?v=_MR1Dp8-F8w&tab=summary" or "/library/notes"
 */
export function buildUrl({
  section = 'dashboard',
  libraryTab = 'history',
  plannerTab = 'daily',
  videoId = '',
  videoTab = 'notes',
} = {}) {
  // If watching a video: clean YouTube-style watch URL
  if (videoId) {
    const tabParam = videoTab && videoTab !== 'notes' ? `&tab=${videoTab}` : '';
    return `/watch?v=${videoId}${tabParam}`;
  }

  if (section === 'library') {
    return `/library/${libraryTab || 'history'}`;
  }

  if (section === 'planner') {
    return `/planner/${plannerTab || 'daily'}`;
  }

  if (section === 'dashboard') {
    return '/dashboard';
  }

  if (section === 'discover') {
    return '/discover';
  }

  if (section === 'assistant') {
    return '/assistant';
  }

  return `/${section}`;
}

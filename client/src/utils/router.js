/**
 * Routing and Clean URL Utilities for Pathshala AI.
 * Handles parsing deep links, sub-tabs, and YouTube watch URLs (/watch?v=VIDEO_ID).
 */

const VALID_SECTIONS = new Set(['dashboard', 'discover', 'search', 'library', 'planner', 'assistant', 'watch']);
const VALID_LIBRARY_TABS = new Set(['history', 'notes', 'saved', 'playlists']);
const VALID_PLANNER_TABS = new Set(['daily', 'monthly']);
const VALID_VIDEO_TABS = new Set(['notes', 'summary', 'qa']);

/**
 * Extracts an 11-character YouTube video ID from various URL formats or plain ID string.
 * Supports:
 * - https://www.youtube.com/watch?v=_MR1Dp8-F8w
 * - https://youtu.be/_MR1Dp8-F8w
 * - https://www.youtube.com/embed/_MR1Dp8-F8w
 * - https://www.youtube.com/live/_MR1Dp8-F8w
 * - https://www.youtube.com/shorts/_MR1Dp8-F8w
 * - _MR1Dp8-F8w
 */
export function extractYouTubeVideoId(urlOrId, { allowPlainId = false } = {}) {
  if (!urlOrId || typeof urlOrId !== 'string') return '';
  const trimmed = urlOrId.trim();

  // If explicit plain ID is allowed (e.g. from route params /watch/:id or ?v=ID)
  if (allowPlainId && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Must have URL indicators (domain, scheme, query param, or path markers)
  const hasUrlIndicator = /^(?:https?:\/\/|www\.)|(?:youtube\.com|youtu\.be)|[?&]v=|\/(?:watch|embed|v|live|shorts)\//i.test(trimmed);
  if (!hasUrlIndicator) {
    return '';
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

    // 3. /embed/ID or /v/ID or /watch/ID or /live/ID or /shorts/ID
    const parts = urlObj.pathname.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      if (['embed', 'v', 'watch', 'discover', 'video', 'live', 'shorts'].includes(parts[i]) && parts[i + 1]) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(parts[i + 1])) {
          return parts[i + 1];
        }
      }
    }
  } catch {
    // Regex fallback
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '';
}

/**
 * Extracts a YouTube playlist ID from various playlist URLs or plain playlist ID string.
 * Supports:
 * - https://www.youtube.com/playlist?list=PLillGF-RfqbZTASqIqdvm1R5mLrVx79CU
 * - https://www.youtube.com/watch?v=...&list=PLillGF-RfqbZTASqIqdvm1R5mLrVx79CU
 * - PLillGF-RfqbZTASqIqdvm1R5mLrVx79CU (when allowPlainId is true)
 */
export function extractYouTubePlaylistId(urlOrId, { allowPlainId = false } = {}) {
  if (!urlOrId || typeof urlOrId !== 'string') return '';
  const trimmed = urlOrId.trim();

  // If already standard playlist ID (starts with PL, RD, UU, FL, LL, OLAK, etc.)
  if (allowPlainId && /^(?:PL|RD|UU|FL|LL|OLAK|TL|CL)[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  const hasUrlIndicator = /^(?:https?:\/\/|www\.)|(?:youtube\.com|youtu\.be)|[?&]list=|\/playlist/i.test(trimmed);
  if (!hasUrlIndicator) {
    return '';
  }

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const listParam = urlObj.searchParams.get('list');
    if (listParam && listParam.trim().length >= 2) {
      return listParam.trim();
    }
  } catch {
    // Fallback regex
    const match = trimmed.match(/[?&]list=([\w-]+)/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '';
}

/**
 * Parses current window pathname and search query into structured app navigation state.
 * Returns { section, videoId, playlistId, videoTab, libraryTab, plannerTab, isVideoFullscreen }.
 */
export function parseLocation(
  pathname = window.location.pathname,
  search = window.location.search
) {
  const searchParams = new URLSearchParams(search);

  // Clean pathname segments
  const pathParts = pathname.split('/').filter(Boolean);
  const firstPart = pathParts[0]?.toLowerCase() || '';
  const secondPart = pathParts[1] || '';

  let section = 'dashboard';
  let videoId = '';
  let videoTab = 'notes';
  let libraryTab = 'history';
  let plannerTab = 'daily';

  // Playlist drawer parameter: /discover?list=PLAYLIST_ID or ?playlist=PLAYLIST_ID or /playlist/ID
  const rawList = searchParams.get('list') || searchParams.get('playlist') || '';
  let playlistId = rawList ? (extractYouTubePlaylistId(rawList, { allowPlainId: true }) || rawList.trim()) : '';

  // 1. Check for video watch URL
  // Formats: /watch?v=ID, /watch/ID, /discover/ID, /video/ID, or ?v=ID anywhere
  const queryV = searchParams.get('v');
  if (queryV) {
    const extracted = extractYouTubeVideoId(queryV, { allowPlainId: true });
    if (extracted) {
      videoId = extracted;
      section = 'discover'; // Render unified watch workspace
    }
  }

  if (firstPart === 'watch') {
    section = 'discover';
    if (!videoId && secondPart) {
      const extracted = extractYouTubeVideoId(secondPart, { allowPlainId: true });
      if (extracted) videoId = extracted;
    }
  } else if ((firstPart === 'discover' || firstPart === 'search') && secondPart) {
    const extracted = extractYouTubeVideoId(secondPart, { allowPlainId: true });
    if (extracted) {
      videoId = extracted;
      section = 'discover';
    }
  } else if (firstPart === 'video' && secondPart) {
    const extracted = extractYouTubeVideoId(secondPart, { allowPlainId: true });
    if (extracted) {
      videoId = extracted;
      section = 'discover';
    }
  } else if (firstPart === 'playlist') {
    section = 'discover';
    if (!playlistId && secondPart) {
      playlistId = extractYouTubePlaylistId(secondPart, { allowPlainId: true }) || secondPart.trim();
    }
  }

  // Check video study tool tab: ?tab=notes | summary | qa
  const queryTab = searchParams.get('tab')?.toLowerCase();

  // Search parameters for discovery
  const searchQuery = (searchParams.get('q') || searchParams.get('search') || '').trim();
  const searchCategory = (searchParams.get('category') || 'all').toLowerCase();
  const searchType = (searchParams.get('type') || 'all').toLowerCase();

  if (queryTab && VALID_VIDEO_TABS.has(queryTab)) {
    videoTab = queryTab;
  }

  // 2. Parse main navigation sections and sub-tabs if not currently watching a video
  if (!videoId) {
    if (firstPart === 'search') {
      section = 'discover';
    } else if (VALID_SECTIONS.has(firstPart)) {
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
    searchQuery,
    searchCategory,
    searchType,
    playlistId,
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
 * @param {string} [state.searchQuery] - Search query string
 * @param {string} [state.searchCategory] - Category filter
 * @param {string} [state.searchType] - Media type filter: 'all' | 'video' | 'playlist' | 'live'
 * @param {string} [state.playlistId] - YouTube playlist ID for playlist drawer
 * @returns {string} Clean relative URL path, e.g. "/watch?v=_MR1Dp8-F8w&tab=summary" or "/discover?list=PL123"
 */
export function buildUrl({
  section = 'dashboard',
  libraryTab = 'history',
  plannerTab = 'daily',
  videoId = '',
  videoTab = 'notes',
  searchQuery = '',
  searchCategory = 'all',
  searchType = 'all',
  playlistId = '',
} = {}) {
  // If watching a video: clean YouTube-style watch URL
  if (videoId) {
    const tabParam = videoTab && videoTab !== 'notes' ? `&tab=${videoTab}` : '';
    const listParam = playlistId ? `&list=${encodeURIComponent(playlistId)}` : '';
    return `/watch?v=${videoId}${listParam}${tabParam}`;
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

  if (section === 'discover' || section === 'search') {
    const params = new URLSearchParams();
    if (searchQuery && searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    if (searchCategory && searchCategory !== 'all') {
      params.set('category', searchCategory);
    }
    if (searchType && searchType !== 'all') {
      params.set('type', searchType);
    }
    if (playlistId && playlistId.trim()) {
      params.set('list', playlistId.trim());
    }
    const queryString = params.toString();
    return queryString ? `/discover?${queryString}` : '/discover';
  }

  if (section === 'assistant') {
    return '/assistant';
  }

  return `/${section}`;
}

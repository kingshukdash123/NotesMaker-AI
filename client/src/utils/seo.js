/**
 * In-Page SEO and Document Metadata Management Utility for Pathshala AI.
 * Dynamically updates document title, canonical link, meta description, keywords,
 * Open Graph (og:*), and Twitter Card (twitter:*) tags.
 */

import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  DEFAULT_ROBOTS,
  DEFAULT_TWITTER_CARD,
  SEO_PAGE_CONFIGS,
} from '../constants/seoConstants';

// Re-export constants for backward-compatibility
export {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  DEFAULT_ROBOTS,
  DEFAULT_TWITTER_CARD,
  SEO_PAGE_CONFIGS,
};

/**
 * Helper to get or create a meta tag by name or property
 */
function setMetaTag(attributeName, attributeValue, content) {
  if (content === undefined || content === null) return;
  let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Helper to get or create the canonical link tag
 */
function setCanonicalLink(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Dynamically updates document SEO metadata for the current page/state.
 *
 * @param {Object} options
 * @param {string} [options.section] - 'dashboard' | 'discover' | 'library' | 'planner' | 'assistant' | 'watch'
 * @param {string} [options.libraryTab] - 'history' | 'notes' | 'saved' | 'playlists'
 * @param {string} [options.plannerTab] - 'daily' | 'monthly'
 * @param {string} [options.videoId] - YouTube video ID
 * @param {string} [options.videoTab] - 'notes' | 'summary' | 'qa'
 * @param {Object} [options.videoMetadata] - { title, channel, thumbnail, ... }
 * @param {boolean} [options.isLoggedIn] - Whether user is logged in
 */
export function updatePageSEO({
  section = 'dashboard',
  libraryTab = 'history',
  plannerTab = 'daily',
  videoId = '',
  videoTab = 'notes',
  videoMetadata = null,
  isLoggedIn = true,
} = {}) {
  // If not logged in and on root
  if (!isLoggedIn) {
    const config = SEO_PAGE_CONFIGS.landing;
    applySEO({
      title: config.title,
      description: config.description,
      keywords: config.keywords,
      canonicalUrl: `${SITE_URL}${config.path}`,
      ogType: 'website',
      image: DEFAULT_IMAGE,
    });
    return;
  }

  // If watching a video
  if (videoId) {
    const videoTitle = videoMetadata?.title || 'YouTube Educational Video';
    const channelName = videoMetadata?.channel || 'Online Lecture';
    const thumbnail = videoMetadata?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    let tabLabel = 'Study Notes';
    let tabDesc = `Comprehensive structured study notes, equations, and references for "${videoTitle}" by ${channelName}.`;
    if (videoTab === 'summary') {
      tabLabel = 'Executive Summary';
      tabDesc = `High-level summary overview, core takeaways, and learning objectives for "${videoTitle}" by ${channelName}.`;
    } else if (videoTab === 'qa') {
      tabLabel = 'Video Q&A Companion';
      tabDesc = `Interactive AI transcript question-answering with citation timestamps for "${videoTitle}" by ${channelName}.`;
    }

    const title = `${tabLabel}: ${videoTitle} | ${SITE_NAME}`;
    const description = tabDesc;
    const keywords = `${channelName}, ${videoTitle}, YouTube lecture notes, video study guide, transcript Q&A`;
    const tabParam = videoTab && videoTab !== 'notes' ? `&tab=${videoTab}` : '';
    const canonicalUrl = `${SITE_URL}/watch?v=${videoId}${tabParam}`;

    applySEO({
      title,
      description,
      keywords,
      canonicalUrl,
      ogType: 'video.other',
      image: thumbnail,
    });
    return;
  }

  // Section with sub-tabs
  let configKey = section;
  if (section === 'library') {
    configKey = `library/${libraryTab || 'history'}`;
  } else if (section === 'planner') {
    configKey = `planner/${plannerTab || 'daily'}`;
  }

  const config = SEO_PAGE_CONFIGS[configKey] || SEO_PAGE_CONFIGS.dashboard;
  const canonicalUrl = `${SITE_URL}${config.path}`;

  applySEO({
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    canonicalUrl,
    ogType: 'website',
    image: DEFAULT_IMAGE,
  });
}

function applySEO({ title, description, keywords, canonicalUrl, ogType = 'website', image = DEFAULT_IMAGE }) {
  // Title
  document.title = title;

  // Standard Meta Tags
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'robots', DEFAULT_ROBOTS);

  // Canonical Link
  setCanonicalLink(canonicalUrl);

  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:image', image);

  // Twitter Card
  setMetaTag('name', 'twitter:card', DEFAULT_TWITTER_CARD);
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);
}

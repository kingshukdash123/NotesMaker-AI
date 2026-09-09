/**
 * In-Page SEO, Document Metadata, and Schema.org JSON-LD Management Utility for Pathshala AI.
 * Dynamically updates document title, canonical link, meta description, keywords,
 * robots directives, Open Graph, Twitter Cards, and structured data schemas.
 */

import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_ALT,
  DEFAULT_ROBOTS,
  NOINDEX_ROBOTS,
  DEFAULT_TWITTER_CARD,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  OG_LOCALE,
  SEO_PAGE_CONFIGS,
  PLATFORM_FAQS,
  LEGAL_SECTIONS,
} from '../constants';

// Re-export constants for convenience
export {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_ALT,
  DEFAULT_ROBOTS,
  NOINDEX_ROBOTS,
  DEFAULT_TWITTER_CARD,
  SEO_PAGE_CONFIGS,
  PLATFORM_FAQS,
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
 * Helper to set or update dynamic JSON-LD structured data in the document head
 */
function setJsonLd(id, jsonObject) {
  if (!jsonObject) {
    const existing = document.head.querySelector(`script#${id}`);
    if (existing) {
      existing.remove();
    }
    return;
  }

  let script = document.head.querySelector(`script#${id}`);
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('id', id);
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonObject, null, 2);
}

/**
 * Helper to generate BreadcrumbList Schema
 */
function createBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Helper to generate FAQPage Schema for landing page
 */
function createFaqPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PLATFORM_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

/**
 * Helper to generate WebApplication Schema
 */
function createWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pathshala AI',
    url: SITE_URL,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All Modern Web Browsers',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'Distraction-free educational lecture streaming',
      'Instant AI lecture notes with LaTeX math equations',
      'Clickable video timestamps in notes',
      'Guruji personal AI academic mentorship',
      'Smart study planner with streaks & target checklists',
    ],
  };
}

/**
 * Dynamically updates document SEO metadata and JSON-LD schemas for the current view.
 *
 * @param {Object} options
 * @param {string} [options.section] - 'dashboard' | 'discover' | 'library' | 'planner' | 'assistant' | 'settings' | 'watch' | legal slug
 * @param {string} [options.libraryTab] - 'history' | 'notes' | 'saved' | 'playlists'
 * @param {string} [options.plannerTab] - 'daily' | 'monthly'
 * @param {string} [options.videoId] - YouTube video ID
 * @param {string} [options.videoTab] - 'notes' | 'summary' | 'qa'
 * @param {string} [options.searchQuery] - Search query
 * @param {Object} [options.videoMetadata] - { title, channel, thumbnail, description, ... }
 * @param {boolean} [options.isLoggedIn] - Whether user is logged in
 */
export function updatePageSEO({
  section = 'dashboard',
  libraryTab = 'history',
  plannerTab = 'daily',
  videoId = '',
  videoTab = 'notes',
  searchQuery = '',
  videoMetadata = null,
  isLoggedIn = true,
} = {}) {
  // 1. Logged-out Visitor / Landing Page
  if (!isLoggedIn) {
    if (LEGAL_SECTIONS.has(section)) {
      const config = SEO_PAGE_CONFIGS[section] || SEO_PAGE_CONFIGS.legal;
      const canonicalUrl = `${SITE_URL}${config.path}`;
      applySEO({
        title: config.title,
        description: config.description,
        keywords: config.keywords,
        canonicalUrl,
        ogType: 'article',
        robots: config.robots || DEFAULT_ROBOTS,
        image: DEFAULT_IMAGE,
        imageAlt: DEFAULT_IMAGE_ALT,
      });

      setJsonLd('schema-dynamic-page', createBreadcrumbSchema([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Legal Center', url: `${SITE_URL}/legal` },
        { name: config.title.split('|')[0].trim(), url: canonicalUrl },
      ]));
      return;
    }

    const config = SEO_PAGE_CONFIGS.landing;
    const canonicalUrl = `${SITE_URL}${config.path}`;
    applySEO({
      title: config.title,
      description: config.description,
      keywords: config.keywords,
      canonicalUrl,
      ogType: 'website',
      robots: config.robots || DEFAULT_ROBOTS,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
    });

    // Inject FAQPage and WebApplication schemas for search engine rich snippets
    setJsonLd('schema-dynamic-page', {
      '@context': 'https://schema.org',
      '@graph': [
        createWebApplicationSchema(),
        createFaqPageSchema(),
      ],
    });
    return;
  }

  // 2. Active Video Watch View (/watch?v=...&tab=...)
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
    const keywords = `${channelName}, ${videoTitle}, YouTube lecture notes, video study guide, transcript Q&A, ${SITE_NAME}`;
    const tabParam = videoTab && videoTab !== 'notes' ? `&tab=${videoTab}` : '';
    const canonicalUrl = `${SITE_URL}/watch?v=${videoId}${tabParam}`;

    applySEO({
      title,
      description,
      keywords,
      canonicalUrl,
      ogType: 'video.other',
      robots: DEFAULT_ROBOTS,
      image: thumbnail,
      imageAlt: `${videoTitle} - Video Study Companion on Pathshala AI`,
    });

    setJsonLd('schema-dynamic-page', {
      '@context': 'https://schema.org',
      '@graph': [
        createBreadcrumbSchema([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Discover', url: `${SITE_URL}/discover` },
          { name: videoTitle, url: canonicalUrl },
        ]),
        {
          '@type': 'VideoObject',
          name: videoTitle,
          description,
          thumbnailUrl: [thumbnail],
          uploadDate: videoMetadata?.published_at || '2026-01-01T00:00:00+05:30',
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        },
      ],
    });
    return;
  }

  // 3. Active Search Query on Discover
  if ((section === 'discover' || section === 'search') && searchQuery && searchQuery.trim()) {
    const cleanQ = searchQuery.trim();
    const title = `Search: "${cleanQ}" — Educational Lectures & Courses | ${SITE_NAME}`;
    const description = `Explore academic lectures, course playlists, and AI study notes for "${cleanQ}" on Pathshala AI.`;
    const keywords = `${cleanQ}, online lectures, course playlists, study notes, academic tutorials, ${SITE_NAME}`;
    const canonicalUrl = `${SITE_URL}/discover?q=${encodeURIComponent(cleanQ)}`;

    applySEO({
      title,
      description,
      keywords,
      canonicalUrl,
      ogType: 'website',
      robots: DEFAULT_ROBOTS,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
    });

    setJsonLd('schema-dynamic-page', createBreadcrumbSchema([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Discover', url: `${SITE_URL}/discover` },
      { name: `Search: "${cleanQ}"`, url: canonicalUrl },
    ]));
    return;
  }

  // 4. Legal / Policy Pages
  if (LEGAL_SECTIONS.has(section)) {
    const config = SEO_PAGE_CONFIGS[section] || SEO_PAGE_CONFIGS.legal;
    const canonicalUrl = `${SITE_URL}${config.path}`;
    applySEO({
      title: config.title,
      description: config.description,
      keywords: config.keywords,
      canonicalUrl,
      ogType: 'article',
      robots: config.robots || DEFAULT_ROBOTS,
      image: DEFAULT_IMAGE,
      imageAlt: DEFAULT_IMAGE_ALT,
    });

    setJsonLd('schema-dynamic-page', createBreadcrumbSchema([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Legal Center', url: `${SITE_URL}/legal` },
      { name: config.title.split('|')[0].trim(), url: canonicalUrl },
    ]));
    return;
  }

  // 5. Section with Sub-tabs (Library / Planner) or Single Pages (Dashboard / Assistant / Settings)
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
    robots: config.robots || DEFAULT_ROBOTS,
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  });

  // Breadcrumbs for workspace sections
  const breadcrumbs = [{ name: 'Home', url: `${SITE_URL}/` }];
  if (section === 'library') {
    breadcrumbs.push({ name: 'Library', url: `${SITE_URL}/library/notes` });
    if (libraryTab && libraryTab !== 'notes') {
      breadcrumbs.push({ name: libraryTab.charAt(0).toUpperCase() + libraryTab.slice(1), url: canonicalUrl });
    }
  } else if (section === 'planner') {
    breadcrumbs.push({ name: 'Planner', url: `${SITE_URL}/planner/daily` });
    if (plannerTab && plannerTab !== 'daily') {
      breadcrumbs.push({ name: plannerTab.charAt(0).toUpperCase() + plannerTab.slice(1), url: canonicalUrl });
    }
  } else if (section !== 'dashboard') {
    breadcrumbs.push({ name: section.charAt(0).toUpperCase() + section.slice(1), url: canonicalUrl });
  }

  if (breadcrumbs.length > 1) {
    setJsonLd('schema-dynamic-page', createBreadcrumbSchema(breadcrumbs));
  } else {
    setJsonLd('schema-dynamic-page', null);
  }
}

function applySEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  robots = DEFAULT_ROBOTS,
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
}) {
  // Title
  document.title = title;

  // Standard Meta Tags
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'robots', robots);

  // Canonical Link
  setCanonicalLink(canonicalUrl);

  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:locale', OG_LOCALE);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:width', OG_IMAGE_WIDTH);
  setMetaTag('property', 'og:image:height', OG_IMAGE_HEIGHT);
  setMetaTag('property', 'og:image:alt', imageAlt);

  // Twitter Card
  setMetaTag('name', 'twitter:card', DEFAULT_TWITTER_CARD);
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);
  setMetaTag('name', 'twitter:image:alt', imageAlt);
}


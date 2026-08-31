/**
 * SEO, Document Metadata, and Open Graph Constants for Pathshala AI
 */

export const SITE_URL = 'https://pathshala-ai.web.app';
export const SITE_NAME = 'Pathshala AI';
export const DEFAULT_IMAGE = `${SITE_URL}/logo2.png`;
export const DEFAULT_ROBOTS = 'index, follow';
export const DEFAULT_TWITTER_CARD = 'summary_large_image';

export const SEO_PAGE_CONFIGS = {
  landing: {
    title: 'Pathshala AI — Autonomous Video Note Generator & Study Companion',
    description: 'Transform educational YouTube videos into structured study notes, AI summaries, flashcards, and interactive Q&A.',
    keywords: 'AI notes, YouTube study notes, lecture transcriber, video summarizer, study planner, educational AI',
    path: '/',
  },
  dashboard: {
    title: 'Dashboard — Study Analytics & Streaks | Pathshala AI',
    description: 'Track your daily study streaks, learning analytics, recent lecture sessions, and academic momentum.',
    keywords: 'study dashboard, learning streak, study analytics, lecture history, academic tracker',
    path: '/dashboard',
  },
  discover: {
    title: 'Discover Educational Lectures & Courses | Pathshala AI',
    description: 'Search and discover top-tier academic lectures, tutorials, and courses to generate structured study materials.',
    keywords: 'educational videos, academic lectures, online tutorials, video search, study discovery',
    path: '/discover',
  },
  'library/history': {
    title: 'Watch History — Library | Pathshala AI',
    description: 'Access your comprehensive study history, logged lectures, and timestamped study sessions.',
    keywords: 'study history, watched lectures, video log, lecture review, learning archive',
    path: '/library/history',
  },
  'library/notes': {
    title: 'Study Notes & Outlines Archive — Library | Pathshala AI',
    description: 'Browse your AI-generated lecture notes, markdown outlines, math formulas, and study guides.',
    keywords: 'lecture notes archive, AI study guides, course outlines, revision notes, markdown notes',
    path: '/library/notes',
  },
  'library/saved': {
    title: 'Bookmarked Lectures & Saved Videos — Library | Pathshala AI',
    description: 'Access bookmarked educational videos and study resources saved for future learning.',
    keywords: 'saved lectures, bookmarks, study library, video bookmarks',
    path: '/library/saved',
  },
  'library/playlists': {
    title: 'Custom Study Playlists — Library | Pathshala AI',
    description: 'Organize your learning modules and subject courses into organized study playlists.',
    keywords: 'study playlists, course collections, subject organization, playlist manager',
    path: '/library/playlists',
  },
  'planner/daily': {
    title: 'Daily Study Targets & Checklist — Planner | Pathshala AI',
    description: 'Plan daily study milestones, manage priority task checklists, and maintain your learning schedule.',
    keywords: 'daily study planner, task checklist, academic goals, revision schedule, study targets',
    path: '/planner/daily',
  },
  'planner/monthly': {
    title: 'Monthly Academic Calendar — Planner | Pathshala AI',
    description: 'View your monthly learning schedule, study streaks, task density, and upcoming study goals.',
    keywords: 'monthly calendar, study schedule, long-term learning plan, academic calendar',
    path: '/planner/monthly',
  },
  assistant: {
    title: 'Nova Assistant — Personal Academic AI Companion | Pathshala AI',
    description: 'Chat with Nova AI for real-time academic explanations, tutoring, research assistance, and concepts synthesis.',
    keywords: 'AI tutor, study assistant, academic chat, personal AI mentor, homework help',
    path: '/assistant',
  },
};

/**
 * SEO, Document Metadata, and Open Graph Constants for Pathshala AI
 */
import { SITE_URL, SITE_NAME } from './companyConstants.js';

export { SITE_URL, SITE_NAME };
export const DEFAULT_IMAGE = `${SITE_URL}/logo2.png`;
export const DEFAULT_ROBOTS = 'index, follow';
export const DEFAULT_TWITTER_CARD = 'summary_large_image';

export const SEO_PAGE_CONFIGS = {
  landing: {
    title: 'Pathshala AI — Distraction-Free Study & Productivity Platform',
    description: 'One platform for distraction-free study and maximum productivity. Focused educational lectures, structured AI notes, smart planner, and personal AI mentorship.',
    keywords: 'distraction-free study, study productivity, AI study notes, student focus, lecture notes, study planner, educational AI, academic productivity, Guruji AI mentor',
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
    title: 'Guruji — Personal Academic Mentor | Pathshala AI',
    description: 'Converse with Guruji, your dedicated personal study mentor for real-time explanations, motivation, and conceptual clarity.',
    keywords: 'Guruji, Pathshala AI, personal mentor, AI tutor, study assistant, academic chat',
    path: '/assistant',
  },

  // --- Legal & Policy Pages ---
  legal: {
    title: 'Legal Center — Policies & Terms | Pathshala AI',
    description: 'Access all Pathshala AI legal documents including Privacy Policy, Terms of Service, AI Disclaimer, Cookie Policy, and Refund & Cancellation Policy.',
    keywords: 'Pathshala AI legal, privacy policy, terms of service, refund policy, cookie policy, AI disclaimer',
    path: '/legal',
  },
  privacy: {
    title: 'Privacy Policy | Pathshala AI',
    description: 'Learn how Pathshala AI collects, uses, and protects your personal data in compliance with GDPR, CCPA, and the India DPDP Act 2023.',
    keywords: 'Pathshala AI privacy policy, data protection, GDPR, DPDP Act, personal data, privacy-first, secure study platform',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service | Pathshala AI',
    description: 'Read the Pathshala AI Terms of Service covering acceptable use, account responsibilities, service tiers, intellectual property, and limitation of liability.',
    keywords: 'Pathshala AI terms of service, user agreement, acceptable use, account terms, educational AI terms',
    path: '/terms',
  },
  disclaimer: {
    title: 'AI & Academic Integrity Disclaimer | Pathshala AI',
    description: 'Important disclosures about AI-generated content accuracy, YouTube fair use, and academic integrity guidelines for students using Pathshala AI.',
    keywords: 'AI disclaimer, academic integrity, AI hallucination, fair use, YouTube disclaimer, educational AI',
    path: '/disclaimer',
  },
  cookies: {
    title: 'Cookie & Storage Policy | Pathshala AI',
    description: 'Understand how Pathshala AI uses browser cookies, local storage, and session tokens — with zero invasive advertising trackers.',
    keywords: 'cookie policy, local storage, session tokens, authentication, browser storage, privacy-first',
    path: '/cookies',
  },
  refund: {
    title: 'Refund & Cancellation Policy | Pathshala AI',
    description: 'Pathshala AI refund and cancellation policy covering digital subscription terms, billing cycles, pro-rata refunds, and grievance redressal.',
    keywords: 'Pathshala AI refund policy, subscription cancellation, digital refund, billing terms, grievance',
    path: '/refund',
  },
};

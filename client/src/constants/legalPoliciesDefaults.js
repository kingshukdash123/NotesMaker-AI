/**
 * legalPoliciesDefaults.js
 *
 * Default seed content for all legal policy documents.
 * Used in two ways:
 *   1. Seeded into Firestore `legal_policies` collection on first app load (if docs missing).
 *   2. Fallback renderer if Firestore is temporarily unreachable.
 *
 * To update policy text: edit sections here (dev mode) OR directly edit Firestore
 * documents from an admin panel (prod mode) — no code redeploy required.
 *
 * planScope is kept as ['free'] now.
 * When paid plans launch, update Firestore docs to include additional plan identifiers.
 */

import {
  COMPANY_NAME,
  COMPANY_DOMAIN,
  GRIEVANCE_EMAIL,
  SUPPORT_EMAIL,
  EFFECTIVE_DATE,
} from './companyConstants.js';

export {
  COMPANY_NAME,
  COMPANY_DOMAIN,
  GRIEVANCE_EMAIL,
  SUPPORT_EMAIL,
  EFFECTIVE_DATE,
};
export const LEGAL_POLICIES_COLLECTION = 'legal_policies';

export const LEGAL_POLICIES_DEFAULTS = {

  // ─────────────────────────────────────────────────────────
  // 1. PRIVACY POLICY
  // ─────────────────────────────────────────────────────────
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    slug: 'privacy',
    version: '1.1.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'overview',
        order: 1,
        heading: 'Overview & Privacy Philosophy',
        body: `${COMPANY_NAME} ("we", "us", or "our") operates the distraction-free study and academic productivity platform available at ${COMPANY_DOMAIN}. We are committed to protecting student privacy and maintaining complete transparency regarding how data is handled.\n\nThis Privacy Policy explains what information we collect, how it is used to deliver focused learning tools, and your rights under applicable privacy laws including India's Digital Personal Data Protection (DPDP) Act, 2023. By accessing or using ${COMPANY_NAME}, you agree to the practices described in this policy.`,
      },
      {
        id: 'information-we-collect',
        order: 2,
        heading: 'Information We Collect',
        body: `To provide a personalized, distraction-free study environment, we collect only minimal, necessary information:\n\n**Identity & Contact Data**: Your name and mobile phone number, collected securely during phone OTP authentication.\n\n**Optional Profile Data**: Email address, if you voluntarily provide it in your profile settings for notifications or communication.\n\n**Study & Learning Data**: Generated AI study notes, lecture outlines, saved videos, custom study playlists, daily/monthly planner tasks, and assistant conversation history — stored securely under your private user account.\n\n**Technical & Device Data**: IP address, browser type, device category, and session timestamps collected automatically for account security, error monitoring, and service reliability.`,
      },
      {
        id: 'how-we-use',
        order: 3,
        heading: 'How We Use Your Information',
        body: `We use your information exclusively to deliver and enhance your study experience:\n- Authenticate your account securely via phone number OTP verification.\n- Stream educational lectures in a clean, distraction-free player interface.\n- Generate, organize, and export AI-assisted study notes, summaries, and lecture outlines.\n- Provide personalized academic guidance via "Guruji," our AI mentor.\n- Track study streaks, learning analytics, and planner schedules on your Dashboard.\n- Prevent abuse, enforce rate limits, and maintain platform security.\n\n**We do NOT sell, rent, monetize, or trade your personal information to third parties for advertising or marketing purposes.**`,
      },
      {
        id: 'youtube-api-services',
        order: 4,
        heading: 'YouTube API Services & Google Privacy Policy',
        body: `${COMPANY_NAME} utilizes **YouTube API Services** to enable students to discover educational lectures, view lecture metadata (such as video titles, channel names, and thumbnails), and stream content via the official YouTube embedded player.\n\n**Google Privacy Policy**: By using features powered by YouTube API Services on ${COMPANY_NAME}, you acknowledge that your use is subject to the **Google Privacy Policy** (available at https://policies.google.com/privacy or http://www.google.com/policies/privacy).\n\n**Data Caching & Storage Compliance**: In strict compliance with YouTube API Developer Policies, we temporarily cache public search query metadata for up to **1 hour** to minimize redundant API calls and optimize performance. We do **not** store YouTube API data for longer than 30 days. Furthermore, ${COMPANY_NAME} **does not download, duplicate, or store raw YouTube audiovisual media files** on its servers.\n\n**Managing & Revoking Access**: You can review, manage, or revoke access permissions granted to third-party applications at any time via the **Google Security Settings page** at https://security.google.com/settings/security/permissions.`,
      },
      {
        id: 'third-party-processors',
        order: 5,
        heading: 'Service Providers & Infrastructure',
        body: `To deliver a secure, high-performance learning platform, we work with industry-standard cloud infrastructure and database providers (such as Google Cloud / Firebase) and specialized artificial intelligence models.\n\nAll service providers process data solely on our behalf under strict data protection and confidentiality agreements. They are prohibited from using your personal information for independent commercial purposes.`,
      },
      {
        id: 'data-retention',
        order: 6,
        heading: 'Data Retention & Deletion',
        body: `We retain your personal study data for as long as your account remains active. If you choose to delete your account or request data deletion, all your personal information—including notes, watch history, saved playlists, and planner tasks—will be **permanently and irreversibly deleted within 30 days** of the verified deletion request.\n\nAny temporary YouTube API search caches expire automatically within 1 hour.`,
      },
      {
        id: 'user-rights',
        order: 7,
        heading: 'Your Rights & Privacy Controls',
        body: `Under applicable data protection laws (including India's DPDP Act, 2023), you have the right to:\n- **Access & Portability**: Request a copy or export of your personal study notes and account information.\n- **Correction**: Update or correct your profile details at any time.\n- **Erasure / Deletion**: Permanently delete your account and all associated study data.\n- **Revoke Google Permissions**: Revoke application access at https://security.google.com/settings/security/permissions.\n\nTo exercise any of your privacy rights, please email our Grievance Officer at **${GRIEVANCE_EMAIL}**. We will process and respond to all requests within **30 days**.`,
      },
      {
        id: 'cookies-storage',
        order: 8,
        heading: 'Cookies & Local Storage',
        body: `${COMPANY_NAME} uses only essential browser local storage (such as theme preferences and sidebar collapse state) and secure session tokens. We do **not** deploy third-party advertising cookies, cross-site trackers, or behavioral analytics pixels. Please refer to our Cookie & Storage Policy for full details.`,
      },
      {
        id: 'children-privacy',
        order: 9,
        heading: "Children's Privacy",
        body: `${COMPANY_NAME} is intended for students aged 13 and above. We do not knowingly collect personal data from children under 13. If we become aware that a child under 13 has provided personal data without parental consent, we will delete that data promptly. Parents or guardians may contact us at ${SUPPORT_EMAIL}.`,
      },
      {
        id: 'changes',
        order: 10,
        heading: 'Changes to This Policy',
        body: `We may update this Privacy Policy periodically to reflect improvements in our platform or legal updates. When changes are made, we will update the "Effective Date" and version number. Continued use of ${COMPANY_NAME} following policy updates constitutes your acceptance of the revised policy.`,
      },
      {
        id: 'contact',
        order: 11,
        heading: 'Contact Us & Grievance Redressal',
        body: `For questions, data requests, or privacy concerns:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Support**: ${SUPPORT_EMAIL}\n**Website**: ${COMPANY_DOMAIN}\n\nWe are committed to addressing all inquiries within 30 days.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 2. TERMS OF SERVICE
  // ─────────────────────────────────────────────────────────
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    slug: 'terms',
    version: '1.1.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'acceptance',
        order: 1,
        heading: 'Acceptance of Terms',
        body: `By accessing or using ${COMPANY_NAME} (${COMPANY_DOMAIN}), you agree to be legally bound by these Terms of Service ("Terms"). **You are also agreeing to be bound by the YouTube Terms of Service (available at https://www.youtube.com/t/terms).**\n\nIf you do not agree to these Terms or the YouTube Terms of Service, please do not access or use ${COMPANY_NAME}. These Terms constitute the complete and binding agreement between you and ${COMPANY_NAME}.`,
      },
      {
        id: 'description',
        order: 2,
        heading: 'Description of Service & Mission',
        body: `${COMPANY_NAME} is an all-in-one educational platform engineered for distraction-free study and academic productivity. Our mission is to eliminate digital distractions and provide students with a focused academic environment featuring:\n- Clean educational video lecture streaming without recommendation rabbit holes or comment distractions.\n- Automated generation of structured study notes, outlines, and lecture summaries.\n- Interactive conceptual doubt resolution via "Guruji," our AI academic mentor.\n- Integrated daily and monthly study planners to maintain academic consistency.\n- A centralized academic library to organize saved lectures, playlists, and study materials.\n\nThe service is provided as a supplementary study productivity aid and is not a substitute for formal accredited schooling.`,
      },
      {
        id: 'youtube-terms',
        order: 3,
        heading: 'YouTube API Services & Third-Party Terms',
        body: `${COMPANY_NAME} interfaces with **YouTube API Services** to help students discover and study educational video lectures. In accordance with YouTube API Services Developer Policies:\n- **Agreement to YouTube Terms**: By using ${COMPANY_NAME}, you are agreeing to be bound by the **YouTube Terms of Service** (https://www.youtube.com/t/terms).\n- **Google Privacy Policy**: Your use of YouTube API Services on our platform is governed by the **Google Privacy Policy** (https://policies.google.com/privacy).\n- **Authorized Playback**: Video playback is delivered exclusively through YouTube's official embedded player.\n- **Intellectual Property**: Video content, channel names, trademarks, and thumbnails remain the exclusive intellectual property of their respective creators and Google LLC / YouTube.`,
      },
      {
        id: 'account',
        order: 4,
        heading: 'Account Registration & Security',
        body: `You must register using a valid mobile phone number verified via One-Time Password (OTP). You are responsible for:\n- Maintaining the confidentiality of your login session.\n- All study activities, notes, and tasks created under your account.\n- Ensuring the phone number used for registration belongs legally to you.\n\nWe reserve the right to suspend accounts that violate security or acceptable use standards.`,
      },
      {
        id: 'acceptable-use',
        order: 5,
        heading: 'Acceptable Use & Academic Integrity',
        body: `You agree NOT to:\n- Use the platform for any unlawful, harassing, or harmful activity.\n- Attempt to reverse-engineer, scrape, or systematically extract data or notes.\n- Circumvent platform rate limits, API quotas, or security controls.\n- Use AI-generated notes to commit academic fraud, examination cheating, or unauthorized plagiarism.\n- Request generation of hateful, defamatory, sexually explicit, or abusive content.\n\nViolating these guidelines may result in immediate suspension or termination of your account.`,
      },
      {
        id: 'intellectual-property',
        order: 6,
        heading: 'Intellectual Property Rights',
        body: `**Your Content**: You retain complete ownership of your personalized study notes, planner tasks, and custom library collections. By using the platform, you grant ${COMPANY_NAME} a limited license to store, process, and display your notes strictly for the purpose of delivering the service to you.\n\n**Platform IP**: The ${COMPANY_NAME} platform, user interface designs, logo, branding, software, and AI workflows are the protected intellectual property of ${COMPANY_NAME}.\n\n**Educational Fair Use**: Public educational video transcripts and metadata are processed under the doctrine of educational fair use to assist students in creating personal study notes.`,
      },
      {
        id: 'service-tiers',
        order: 7,
        heading: 'Service Tiers & Access',
        body: `${COMPANY_NAME} currently offers a **free tier** providing access to core note generation, library organization, daily planners, and AI assistant features subject to fair usage limits.\n\nWe reserve the right to introduce optional premium subscription tiers in the future. Features, pricing, and limits of any paid plans will be transparently communicated prior to enrollment.`,
      },
      {
        id: 'disclaimer',
        order: 8,
        heading: 'Disclaimer of Warranties',
        body: `THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND. ${COMPANY_NAME.toUpperCase()} DOES NOT WARRANT THAT:\n- The platform will always be uninterrupted, bug-free, or error-free.\n- AI-generated notes, summaries, or Guruji responses will be 100% accurate, complete, or exhaustive.\n- Using the platform guarantees specific examination scores or academic outcomes.\n\nStudents are strongly advised to cross-verify key formulas, scientific data, and dates with official textbooks and instructors.`,
      },
      {
        id: 'liability',
        order: 9,
        heading: 'Limitation of Liability',
        body: `To the maximum extent permitted by law, ${COMPANY_NAME} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the platform.\n\nOur total aggregate liability for any claims shall not exceed the amount paid by you (if any) to ${COMPANY_NAME} during the three months preceding the claim.`,
      },
      {
        id: 'termination',
        order: 10,
        heading: 'Termination & Account Deletion',
        body: `You may delete your account and terminate these Terms at any time via your Profile Settings. We may suspend or terminate your access immediately if you violate these Terms or if required by law. Upon termination, your right to use the platform ceases immediately.`,
      },
      {
        id: 'governing-law',
        order: 11,
        heading: 'Governing Law & Dispute Resolution',
        body: `These Terms are governed by the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in India. We encourage users to contact our Grievance Officer at ${GRIEVANCE_EMAIL} first for amicable resolution.`,
      },
      {
        id: 'changes',
        order: 12,
        heading: 'Modifications to Terms',
        body: `We reserve the right to update these Terms at any time. Material changes will be indicated with an updated effective date. Your continued use of the platform after updates constitutes acceptance of the modified Terms.`,
      },
      {
        id: 'contact',
        order: 13,
        heading: 'Contact Information',
        body: `For questions or legal notices regarding these Terms:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Website**: ${COMPANY_DOMAIN}`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 3. AI & ACADEMIC INTEGRITY DISCLAIMER
  // ─────────────────────────────────────────────────────────
  disclaimer: {
    id: 'disclaimer',
    title: 'AI & Academic Integrity Disclaimer',
    slug: 'disclaimer',
    version: '1.1.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'ai-generated-content',
        order: 1,
        heading: 'AI-Generated Content Disclaimer',
        body: `${COMPANY_NAME} utilizes artificial intelligence technologies and large language models (LLMs) to generate structured lecture outlines, study notes, summaries, and conceptual explanations.\n\n**Important Notice**: AI models can occasionally produce inaccurate, incomplete, or outdated information ("hallucinations"). AI-generated notes should always serve as a **study aid and supplementary guide**, not as a definitive academic authority. Always verify critical formulas, mathematical calculations, scientific constants, and historical facts with authoritative textbooks and teachers.`,
      },
      {
        id: 'guruji-disclaimer',
        order: 2,
        heading: 'Guruji (AI Academic Mentor) Guidance',
        body: `"Guruji" is an AI-powered conversational study mentor designed to help students clarify concepts, break down complex topics, and stay motivated. Guruji's answers are generated algorithmically and do not constitute formal academic certification, professional counseling, medical advice, or legal guidance.`,
      },
      {
        id: 'academic-integrity',
        order: 3,
        heading: 'Academic Integrity & Ethical Study',
        body: `${COMPANY_NAME} is built to empower learning comprehension—not to bypass academic effort.\n\n**Acceptable Use**:\n- Creating personal study guides and summaries to enhance lecture comprehension.\n- Using Guruji to clarify doubts and explore conceptual explanations.\n- Planning study schedules and organizing learning materials.\n\n**Prohibited Misuse**:\n- Submitting AI-generated notes directly as uncredited academic coursework (plagiarism).\n- Using AI features during proctored examinations or tests.\n\nUsers are solely responsible for upholding their school or university's academic integrity policies.`,
      },
      {
        id: 'youtube-fair-use',
        order: 4,
        heading: 'YouTube Content, Fair Use & Non-Affiliation',
        body: `${COMPANY_NAME} is an independent educational productivity tool and is **not affiliated with, endorsed by, or sponsored by YouTube, Google LLC, or individual content creators**.\n\nWe access publicly available video transcripts and metadata through official YouTube API Services and authorized transcript APIs under the principles of educational fair use for commentary, study, and research. All video content, thumbnails, and channel branding remain the intellectual property of their respective copyright holders. If you are a creator with questions or requests, please contact us at ${GRIEVANCE_EMAIL}.`,
      },
      {
        id: 'no-affiliation',
        order: 5,
        heading: 'No Institutional Endorsement',
        body: `${COMPANY_NAME} is an independent educational technology application. We are not officially partnered with or endorsed by any specific university, examination board, or educational board unless explicitly designated in writing.`,
      },
      {
        id: 'contact',
        order: 6,
        heading: 'Questions & Content Inquiries',
        body: `For questions regarding our AI disclaimer or content usage:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Website**: ${COMPANY_DOMAIN}`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 4. COOKIE & STORAGE POLICY
  // ─────────────────────────────────────────────────────────
  cookies: {
    id: 'cookies',
    title: 'Cookie & Storage Policy',
    slug: 'cookies',
    version: '1.1.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'overview',
        order: 1,
        heading: 'Overview',
        body: `This Cookie & Storage Policy explains how ${COMPANY_NAME} uses browser cookies, session storage, and local storage on our platform at ${COMPANY_DOMAIN}.\n\nOur core principle: **we do not use invasive third-party advertising trackers, cross-site tracking pixels, or marketing cookies.** We use only the minimal storage necessary to deliver and personalise your experience.`,
      },
      {
        id: 'what-are-cookies',
        order: 2,
        heading: 'What Are Cookies & Local Storage?',
        body: `**Cookies** are small text files stored in your browser by websites to remember information about your session and preferences.\n\n**Local Storage** is a browser-based key-value store that persists data between sessions without an expiry date, unless explicitly cleared.\n\n**Session Storage** is similar to local storage but is cleared when you close the browser tab.`,
      },
      {
        id: 'essential-cookies',
        order: 3,
        heading: 'Essential Authentication & Session Tokens',
        body: `${COMPANY_NAME} uses secure, industry-standard authentication tokens and session storage to maintain your logged-in state:\n\n| Item | Purpose | Duration |\n|---|---|---|\n| **Authentication Token** | Maintains your encrypted session securely | Until sign-out or session expiry |\n| **Session Refresh Token** | Refreshes your session seamlessly while active | Persistent until sign-out |\n\nThese tokens are strictly necessary for secure account authentication and cannot be disabled without preventing login functionality.`,
      },
      {
        id: 'local-storage',
        order: 4,
        heading: 'Local Storage (User Preferences)',
        body: `We use browser local storage to save your in-app preferences so they persist between sessions. The following keys are stored locally:\n\n| Key | Value Stored | Purpose |\n|---|---|---|\n| \`theme\` | \`"dark"\` or \`"light"\` | Remembers your chosen interface theme |\n| \`sidebar_collapsed\` | \`"true"\` or \`"false"\` | Saves sidebar collapse state |\n| \`assistant_mode\` | \`"sidebar"\` or \`"floating"\` | Remembers Guruji panel layout preference |\n\nThis data is stored entirely on your device and is never transmitted to our servers.`,
      },
      {
        id: 'no-tracking',
        order: 5,
        heading: 'No Third-Party Tracking or Advertising',
        body: `${COMPANY_NAME} does **not** use:\n- Invasive third-party advertising trackers or behavioral analytics pixels.\n- Cross-site tracking cookies.\n- Retargeting or interest-based advertising technologies.\n- Any third-party cookies unrelated to service delivery.\n\nWe are committed to a privacy-first, tracker-free learning environment.`,
      },
      {
        id: 'managing-storage',
        order: 6,
        heading: 'How to Manage or Clear Storage',
        body: `You can clear all browser storage for ${COMPANY_NAME} at any time:\n\n1. Open your browser's **Developer Tools** (F12 or right-click → Inspect).\n2. Navigate to **Application** → **Local Storage** → \`${COMPANY_DOMAIN}\`.\n3. Select and delete any keys you wish to remove.\n\nAlternatively, clearing your browser's cookies and site data will sign you out and reset all preferences.\n\n**Note**: Clearing storage will sign you out and reset your theme and layout preferences to defaults.`,
      },
      {
        id: 'contact',
        order: 7,
        heading: 'Contact',
        body: `For questions about our storage practices, contact us at:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Website**: ${COMPANY_DOMAIN}`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 5. REFUND & CANCELLATION POLICY
  // ─────────────────────────────────────────────────────────
  refund: {
    id: 'refund',
    title: 'Refund & Cancellation Policy',
    slug: 'refund',
    version: '1.1.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'overview',
        order: 1,
        heading: 'Overview',
        body: `This Refund & Cancellation Policy governs all subscription, billing, and refund matters for ${COMPANY_NAME} (${COMPANY_DOMAIN}).\n\n**Current Status**: ${COMPANY_NAME} is currently a free platform. This policy establishes the framework that will govern refund and cancellation procedures when paid subscription plans are introduced in the future. All terms below will apply to paid plans at the time of their launch.`,
      },
      {
        id: 'free-tier',
        order: 2,
        heading: 'Free Tier',
        body: `The free tier of ${COMPANY_NAME} is available at no cost. There are no charges, no refunds applicable, and no cancellation required. You may stop using the service or delete your account at any time from your Profile settings.`,
      },
      {
        id: 'paid-subscriptions',
        order: 3,
        heading: 'Paid Subscriptions (Future Plans)',
        body: `When paid plans are introduced, the following terms will apply:\n\n**Billing Cycles**: Paid plans will be available on monthly or annual billing cycles. Subscription charges are billed at the start of each billing period.\n\n**Automatic Renewal**: Subscriptions renew automatically at the end of each billing period unless cancelled before the renewal date.\n\n**Plan Changes**: You may upgrade or downgrade your plan at any time. Upgrades take effect immediately with pro-rata adjustment. Downgrades take effect at the start of the next billing period.`,
      },
      {
        id: 'cancellation',
        order: 4,
        heading: 'Cancellation',
        body: `When paid plans are available:\n\n- You may cancel your paid subscription at any time from your Account Settings.\n- Cancellation stops future charges. You retain access to paid features until the end of your current billing period.\n- Cancelling a plan does not automatically delete your account or personal data. Your account reverts to the free tier upon subscription expiry.`,
      },
      {
        id: 'refund-eligibility',
        order: 5,
        heading: 'Refund Eligibility',
        body: `When paid plans are available, our refund policy will be as follows:\n\n**Cooling-Off Period**: New paid subscribers may request a full refund within **7 days** of their first payment, provided they have not exceeded a fair usage threshold of the paid features during that period.\n\n**Technical Failures**: If a confirmed technical failure on our part prevents you from accessing paid features for more than 48 consecutive hours in a billing period, you may be entitled to a pro-rata credit or refund for the affected period.\n\n**No Refund Cases**: Refunds will not be provided for:\n- Partially used billing periods beyond the cooling-off window.\n- Change of mind after the cooling-off period.\n- Violation of Terms of Service leading to account suspension.\n- Unused features within an active subscription.`,
      },
      {
        id: 'refund-process',
        order: 6,
        heading: 'How to Request a Refund',
        body: `To request a refund when paid plans are active:\n\n1. Email **${GRIEVANCE_EMAIL}** with subject line: *"Refund Request — [Your Registered Phone Number]"*.\n2. Include your account details, the plan name, transaction reference, and reason for the refund.\n3. We will acknowledge your request within **3 business days** and resolve it within **10 business days**.\n\nRefunds will be credited to the original payment method. Processing time depends on your payment provider (typically 5–10 business days after approval).`,
      },
      {
        id: 'failed-transactions',
        order: 7,
        heading: 'Failed Transactions',
        body: `If a payment fails due to insufficient funds, card expiry, or bank issues, your account will retain its current access tier for a 3-day grace period. If payment is not successfully retried within this period, your plan may be downgraded to the free tier. We will notify you by email before any access change takes effect.`,
      },
      {
        id: 'grievance',
        order: 8,
        heading: 'Grievance Redressal',
        body: `In compliance with India's Information Technology Act, 2000 and Consumer Protection (E-Commerce) Rules, 2020, we have appointed a Grievance Officer:\n\n**Grievance Email**: ${GRIEVANCE_EMAIL}\n**Response Time**: Within 30 days of receipt of the complaint.\n\nIf your concern is not resolved to your satisfaction, you may approach the appropriate consumer forum under the Consumer Protection Act, 2019.`,
      },
      {
        id: 'contact',
        order: 9,
        heading: 'Contact',
        body: `For billing, refund, or cancellation queries:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Website**: ${COMPANY_DOMAIN}`,
      },
    ],
  },
};

/** Ordered list of policy slugs for tab navigation display */
export const LEGAL_POLICY_SLUGS = ['privacy', 'terms', 'disclaimer', 'cookies', 'refund'];

/** Human-readable tab labels mapped from slug */
export const LEGAL_POLICY_LABELS = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  disclaimer: 'AI Disclaimer',
  cookies: 'Cookie Policy',
  refund: 'Refund & Cancellation',
};

/** Lucide icon name mapped from slug (for dynamic import in PolicyPage) */
export const LEGAL_POLICY_ICONS = {
  privacy: 'ShieldCheck',
  terms: 'FileText',
  disclaimer: 'AlertTriangle',
  cookies: 'Cookie',
  refund: 'CreditCard',
};

/** Set of all legal/policy route slugs including the hub /legal for O(1) membership checks */
export const LEGAL_SECTIONS = new Set([...LEGAL_POLICY_SLUGS, 'legal']);

/** Navigation items for legal footer, modals, and headers */
export const LEGAL_NAV_ITEMS = [
  { slug: 'privacy', label: 'Privacy Policy', shortLabel: 'Privacy' },
  { slug: 'terms', label: 'Terms of Service', shortLabel: 'Terms' },
  { slug: 'disclaimer', label: 'AI Disclaimer', shortLabel: 'AI Disclaimer' },
  { slug: 'cookies', label: 'Cookie Policy', shortLabel: 'Cookies' },
  { slug: 'refund', label: 'Refund Policy', shortLabel: 'Refund Policy' },
];

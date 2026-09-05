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
    version: '1.0.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'overview',
        order: 1,
        heading: 'Overview',
        body: `${COMPANY_NAME} ("we", "us", or "our") operates the distraction-free study and productivity platform available at ${COMPANY_DOMAIN}. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our application. By accessing or using ${COMPANY_NAME}, you agree to this policy.`,
      },
      {
        id: 'information-we-collect',
        order: 2,
        heading: 'Information We Collect',
        body: `We collect the following categories of information:\n\n**Identity & Contact Data**: Your name and mobile phone number, collected during the OTP registration process.\n\n**Optional Profile Data**: Email address, if provided voluntarily via your profile settings.\n\n**Usage & Activity Data**: Study session logs, watch history, notes, planner tasks, saved videos, playlist collections, and assistant conversation histories — stored securely under your protected user account.\n\n**Technical Data**: IP address, browser type, device type, and session identifiers collected automatically for security and service reliability.\n\n**User-Provided API Keys**: Optional user-provided AI service keys, stored encrypted and used solely to process your personal study and learning requests.`,
      },
      {
        id: 'how-we-use',
        order: 3,
        heading: 'How We Use Your Information',
        body: `We use collected data to:\n- Authenticate your account securely via phone number OTP verification.\n- Stream educational lectures and provide a distraction-free learning environment.\n- Generate, store, and organize AI-assisted study notes and lecture summaries.\n- Power the Guruji AI assistant for personalized academic guidance.\n- Track study streaks, activity calendars, and learning analytics on your Dashboard.\n- Improve platform performance, security, and feature quality.\n- Comply with applicable legal obligations.\n\nWe do **not** sell, rent, or trade your personal data to any third party for advertising purposes.`,
      },
      {
        id: 'third-party-processors',
        order: 4,
        heading: 'Service Providers & Infrastructure',
        body: `To deliver a secure, reliable, and high-performance learning platform, we work with industry-standard cloud infrastructure, secure database, and specialized technology service providers.\n\nAll service providers are bound by strict contractual confidentiality, data protection agreements, and industry-standard security frameworks. They process data solely on our behalf to facilitate platform operations and are strictly prohibited from using your data for independent purposes.\n\nWe do not sell, rent, or share personal data with external third parties for advertising or commercial marketing.`,
      },
      {
        id: 'data-retention',
        order: 5,
        heading: 'Data Retention',
        body: `We retain your data for as long as your account is active. If you request account deletion, we will permanently delete your personal data, including notes, history, planner tasks, and saved items, within 30 days of the verified deletion request.\n\nAnonymised, aggregated analytics (non-personally identifiable) may be retained for platform improvement purposes.`,
      },
      {
        id: 'user-rights',
        order: 6,
        heading: 'Your Rights',
        body: `Depending on your jurisdiction, you may have the following rights regarding your personal data:\n\n- **Access**: Request a copy of your stored personal data.\n- **Correction**: Update or correct inaccurate profile information.\n- **Deletion**: Request permanent deletion of your account and all associated data.\n- **Portability**: Request an export of your study notes and account data.\n- **Withdraw Consent**: Discontinue use of the service at any time.\n\nTo exercise any of these rights, contact us at **${GRIEVANCE_EMAIL}**. We will respond within 30 days as required under India's DPDP Act 2023 and applicable international regulations.`,
      },
      {
        id: 'cookies-storage',
        order: 7,
        heading: 'Cookies & Local Storage',
        body: `${COMPANY_NAME} uses only essential browser local storage and session tokens. We do not use invasive third-party advertising cookies. Please refer to our Cookie & Storage Policy for complete details.`,
      },
      {
        id: 'children-privacy',
        order: 8,
        heading: "Children's Privacy",
        body: `${COMPANY_NAME} is intended for students aged 13 and above. We do not knowingly collect personal data from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete it promptly. Parents or guardians may contact us at ${SUPPORT_EMAIL}.`,
      },
      {
        id: 'changes',
        order: 9,
        heading: 'Changes to This Policy',
        body: `We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of material changes by updating the "Last Updated" date at the top of this document. Continued use of the platform after changes constitutes acceptance of the revised policy.`,
      },
      {
        id: 'contact',
        order: 10,
        heading: 'Contact Us',
        body: `For privacy-related queries, data requests, or grievance redressal:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Website**: ${COMPANY_DOMAIN}\n\nWe aim to respond to all privacy requests within 30 days.`,
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
    version: '1.0.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'acceptance',
        order: 1,
        heading: 'Acceptance of Terms',
        body: `By accessing or using ${COMPANY_NAME} (${COMPANY_DOMAIN}), you agree to be legally bound by these Terms of Service ("Terms"). If you do not agree, please do not use the platform. These Terms constitute the complete and binding agreement between you and ${COMPANY_NAME}.`,
      },
      {
        id: 'description',
        order: 2,
        heading: 'Description of Service',
        body: `${COMPANY_NAME} is an all-in-one educational platform built for distraction-free study and academic productivity, enabling students to:
- Stream and learn from educational lectures in a focused, distraction-free environment.
- Generate structured study notes, summaries, and interactive lecture outlines.
- Organize study schedules and build academic momentum with integrated daily and monthly planners.
- Receive personalized conceptual mentorship and study guidance from "Guruji," our AI mentor.
- Organize study materials, playlists, and learning history in a centralized library.

The service is provided "as-is" as a supplementary educational productivity tool and is not a substitute for formal academic instruction.`,
      },
      {
        id: 'account',
        order: 3,
        heading: 'Account Registration & Responsibility',
        body: `You must register using a valid mobile phone number verified via OTP (One-Time Password). You are responsible for:\n- Maintaining the confidentiality of your account credentials.\n- All activity that occurs under your account.\n- Ensuring the phone number you register is legally yours.\n\nWe reserve the right to suspend or terminate accounts that violate these Terms.`,
      },
      {
        id: 'acceptable-use',
        order: 4,
        heading: 'Acceptable Use',
        body: `You agree NOT to:\n- Use the platform for any illegal, harmful, or abusive purpose.\n- Attempt to reverse-engineer, scrape, or extract data from the platform in an automated manner.\n- Circumvent rate limits, API quotas, or access controls.\n- Share your account credentials with others.\n- Upload or request generation of content that is hateful, violent, sexually explicit, or otherwise objectionable.\n- Use AI-generated content to commit academic fraud, plagiarism, or examination cheating.\n\nViolation of these terms may result in immediate account suspension without notice.`,
      },
      {
        id: 'intellectual-property',
        order: 5,
        heading: 'Intellectual Property',
        body: `**Your Content**: You retain ownership of your personal study notes, planner tasks, and saved data. By using the platform, you grant ${COMPANY_NAME} a limited, non-exclusive license to store and process your content to deliver the service.\n\n**Platform IP**: The ${COMPANY_NAME} platform, interface design, branding, software, and underlying AI workflows are the intellectual property of ${COMPANY_NAME} and are protected under applicable copyright and IP laws.\n\n**YouTube Content**: YouTube videos, transcripts, and thumbnails processed through the platform remain the intellectual property of their respective creators and YouTube/Google LLC. ${COMPANY_NAME} processes them under fair use for educational study purposes only.`,
      },
      {
        id: 'service-tiers',
        order: 6,
        heading: 'Service Tiers & Access',
        body: `${COMPANY_NAME} currently offers a **free tier** that provides access to core note-generation, library, planner, and AI assistant features subject to fair usage limits.\n\nWe reserve the right to introduce premium paid plans in the future. When paid plans are introduced, the specific features, pricing, and access limitations of each plan will be disclosed clearly before purchase. Existing free-tier users will be notified of any changes to their access levels with reasonable advance notice.`,
      },
      {
        id: 'api-keys',
        order: 7,
        heading: 'User-Provided API Keys',
        body: `${COMPANY_NAME} allows users to connect their own compatible AI provider API keys to power custom learning features. By providing these keys:\n- You confirm you have the necessary permissions and comply with your provider's applicable terms.\n- You accept that usage, rate limits, and billing are governed by the respective provider's terms.\n- ${COMPANY_NAME} stores your keys securely encrypted in your account and uses them solely for processing your personal requests.\n- You may remove or delete your keys at any time through the Settings panel.`,
      },
      {
        id: 'disclaimer',
        order: 8,
        heading: 'Disclaimer of Warranties',
        body: `THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. ${COMPANY_NAME.toUpperCase()} DOES NOT WARRANT THAT:\n- The service will be uninterrupted, error-free, or always available.\n- AI-generated notes, summaries, or answers will be 100% accurate, complete, or suitable for examination use.\n- Results of using the service will meet specific academic performance expectations.\n\nStudents are strongly advised to cross-verify key facts, formulas, and dates with authoritative textbooks and instructors.`,
      },
      {
        id: 'liability',
        order: 9,
        heading: 'Limitation of Liability',
        body: `To the maximum extent permitted by applicable law, ${COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, academic results, or business, arising from your use or inability to use the platform.\n\nOur total aggregate liability for any claims arising from these Terms shall not exceed the amount paid by you (if any) to ${COMPANY_NAME} in the 3 months preceding the claim.`,
      },
      {
        id: 'termination',
        order: 10,
        heading: 'Termination',
        body: `You may terminate your account at any time from your Profile settings. We may suspend or terminate your access immediately, without prior notice, if you violate these Terms or if we discontinue the service. Upon termination, your right to use the platform ceases immediately.`,
      },
      {
        id: 'governing-law',
        order: 11,
        heading: 'Governing Law & Dispute Resolution',
        body: `These Terms are governed by the laws of India. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in India. We encourage you to contact us first at ${GRIEVANCE_EMAIL} to resolve disputes amicably before pursuing legal remedies.`,
      },
      {
        id: 'changes',
        order: 12,
        heading: 'Changes to Terms',
        body: `We may revise these Terms at any time. Material changes will be communicated by updating the version number and effective date. Your continued use of the platform after changes take effect constitutes acceptance of the revised Terms.`,
      },
      {
        id: 'contact',
        order: 13,
        heading: 'Contact',
        body: `For questions about these Terms, contact us at:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Website**: ${COMPANY_DOMAIN}`,
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
    version: '1.0.0',
    effectiveDate: EFFECTIVE_DATE,
    isActive: true,
    planScope: ['free'],
    sections: [
      {
        id: 'ai-generated-content',
        order: 1,
        heading: 'AI-Generated Content Disclaimer',
        body: `${COMPANY_NAME} utilizes advanced artificial intelligence technologies and large language models (LLMs) to assist students with lecture comprehension, study notes generation, summaries, and academic guidance.\n\n**Important**: AI-generated content can contain inaccuracies, omissions, outdated information, or "hallucinations" — plausible-sounding statements that are factually incorrect.\n\nAll AI-generated content on ${COMPANY_NAME} should be treated as a **study aid and starting point**, not as a definitive or authoritative academic source. Always cross-verify:\n- Mathematical formulas and calculations\n- Historical dates, names, and events\n- Scientific constants and experimental data\n- Legal, medical, or technical specifications\n\n…with your textbooks, course materials, and qualified instructors before relying on them for examinations or assessments.`,
      },
      {
        id: 'guruji-disclaimer',
        order: 2,
        heading: 'Guruji (AI Mentor) Disclaimer',
        body: `"Guruji" is an AI-powered conversational mentor designed to help students understand concepts, clarify doubts, and stay motivated. Guruji's responses are generated by AI and may not always be accurate, current, or complete.\n\nGuruji is not a licensed educator, counsellor, or subject matter expert. Do not rely solely on Guruji's responses for critical academic decisions, medical advice, legal guidance, or mental health support.`,
      },
      {
        id: 'academic-integrity',
        order: 3,
        heading: 'Academic Integrity & Ethical Use',
        body: `${COMPANY_NAME} is designed to help students **learn from** educational content — not to replace learning or enable dishonest academic conduct.\n\n**Acceptable Use**:\n- Generating personal study notes to aid comprehension of lectures.\n- Reviewing AI summaries as a study supplement alongside official course materials.\n- Using Guruji for concept explanations, motivation, and study planning.\n\n**Prohibited Use**:\n- Submitting AI-generated notes directly as your own academic work (plagiarism).\n- Using Guruji or any AI feature to answer questions during proctored examinations.\n- Sharing AI-generated content as original research or coursework without proper disclosure.\n\nViolation of your institution's academic integrity policies is your sole responsibility. ${COMPANY_NAME} expressly disclaims any liability for academic misconduct committed by users of the platform.`,
      },
      {
        id: 'youtube-fair-use',
        order: 4,
        heading: 'YouTube Content & Fair Use',
        body: `${COMPANY_NAME} is an independent educational tool and is **not affiliated with, endorsed by, or sponsored by YouTube or Google LLC**.\n\nWe access publicly available video transcripts and metadata via official YouTube APIs and approved third-party transcript services for the sole purpose of generating educational study notes. This use is intended to comply with the principles of fair use under applicable copyright law for the purposes of commentary, education, and research.\n\nAll video content, thumbnails, and transcripts remain the property of their respective creators and YouTube/Google LLC. If you are a content creator and believe your work is being used improperly, please contact us at ${GRIEVANCE_EMAIL}.`,
      },
      {
        id: 'no-affiliation',
        order: 5,
        heading: 'No Institutional Affiliation',
        body: `${COMPANY_NAME} is an independent technology platform. We are not affiliated with, endorsed by, or partnered with any specific university, school, examination board, or educational institution unless explicitly stated in a formal partnership agreement.\n\nReferences to educational content from specific courses, professors, or institutions are purely for the purpose of providing study assistance and do not imply any official relationship.`,
      },
      {
        id: 'contact',
        order: 6,
        heading: 'Questions & Concerns',
        body: `For questions regarding this disclaimer or to report content concerns, contact us at:\n\n**Email**: ${GRIEVANCE_EMAIL}\n**Website**: ${COMPANY_DOMAIN}`,
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
    version: '1.0.0',
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
    version: '1.0.0',
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

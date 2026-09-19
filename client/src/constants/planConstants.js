/**
 * Plan Constants & Default Fallback Configurations
 */

export const PLANS_COLLECTION = 'plans';

export const PLAN_IDS = {
  STARTER: 'starter',
  LEARNER: 'learner',
  SCHOLAR: 'scholar',
};

export const PLAN_RANKS = {
  [PLAN_IDS.STARTER]: 0,
  [PLAN_IDS.LEARNER]: 1,
  [PLAN_IDS.SCHOLAR]: 2,
};

/**
 * Default fallback subscription plans specification.
 */
export const DEFAULT_PLANS = {
  [PLAN_IDS.STARTER]: {
    id: PLAN_IDS.STARTER,
    name: 'Starter',
    badge: 'Free Plan',
    discountBadge: '',
    price: 0,
    originalPrice: 0,
    billingInterval: 'month',
    currencySymbol: '₹',
    description: 'Essential AI study notes & doubt solving.',
    rank: 0,
    limits: {
      maxVideoDurationSeconds: 2 * 60 * 60, // 2 hours (120 minutes)
      maxVideoDurationDisplay: '2 hours',
      monthlyNotesQuota: 10,
      monthlyChatQuota: 75,
      maxPlaylists: Infinity,
      maxVideosPerPlaylist: Infinity,
      historyRetentionDays: Infinity,
      mathPrecision: 'standard',
      priorityQueue: false,
      vipSupport: false,
    },
    features: [
      { text: 'Standard math & formula rendering', included: true },
      { text: 'Fast email support (<4h)', included: false },
      { text: 'VIP WhatsApp support', included: false },
      { text: 'Early access to new AI features', included: false },
    ],
    ctaText: 'Current Plan',
    highlighted: false,
  },

  [PLAN_IDS.LEARNER]: {
    id: PLAN_IDS.LEARNER,
    name: 'Learner',
    badge: 'Student Choice',
    discountBadge: '40% OFF',
    price: 119,
    originalPrice: 199,
    billingInterval: 'month',
    currencySymbol: '₹',
    description: 'Ideal for college students & semester exams.',
    rank: 1,
    limits: {
      maxVideoDurationSeconds: 7 * 60 * 60, // 7 hours
      maxVideoDurationDisplay: '7 hours',
      monthlyNotesQuota: 50,
      monthlyChatQuota: 1000,
      maxPlaylists: Infinity,
      maxVideosPerPlaylist: Infinity,
      historyRetentionDays: Infinity,
      mathPrecision: 'high',
      priorityQueue: false,
      vipSupport: false,
    },
    features: [
      { text: 'High-precision math & formulas', included: true },
      { text: 'Fast email support (<4h)', included: true },
      { text: 'VIP WhatsApp support', included: false },
      { text: 'Early access to new AI features', included: false },
    ],
    ctaText: 'Get Learner Plan',
    highlighted: true,
  },

  [PLAN_IDS.SCHOLAR]: {
    id: PLAN_IDS.SCHOLAR,
    name: 'Scholar',
    badge: 'Ultimate Power',
    discountBadge: '42% OFF',
    price: 349,
    originalPrice: 599,
    billingInterval: 'month',
    currencySymbol: '₹',
    description: 'Full academic mastery & intensive study prep.',
    rank: 2,
    limits: {
      maxVideoDurationSeconds: 15 * 60 * 60, // 15 hours
      maxVideoDurationDisplay: '15 hours',
      monthlyNotesQuota: 100,
      monthlyChatQuota: 3000,
      maxPlaylists: Infinity,
      maxVideosPerPlaylist: Infinity,
      historyRetentionDays: Infinity,
      mathPrecision: 'high',
      priorityQueue: true,
      vipSupport: true,
    },
    features: [
      { text: 'High-precision math & formulas', included: true },
      { text: 'Fast email support (<4h)', included: true },
      { text: 'VIP WhatsApp support', included: true },
      { text: 'Early access to new AI features', included: true },
    ],
    ctaText: 'Get Scholar Plan',
    highlighted: true,
  },
};

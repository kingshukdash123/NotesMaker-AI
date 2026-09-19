import { useState, useEffect } from 'react';
import {
  CreditCard,
  Crown,
  Check,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { usePlans } from '../context/PlansContext';
import { PLAN_IDS } from '../models';
import { updateUserSubscription, syncExpiredSubscription } from '../services/firebase/usageService';
import { getUserBillingCycle, getEffectiveSubscription } from '../models/usageModel';
import DocPageHeader from '../components/common/DocPageHeader';
import { PlanCard } from '../components/pricing';
import {
  BillingSkeleton,
  UsageCardSkeleton,
  CurrentPlanCardSkeleton,
  PlanCardSkeleton,
} from '../components/skeletons';

export default function BillingPage() {
  const { isDark } = useTheme();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { monthlyUsage, isUsageLoading } = useApp();
  const { plansList, getPlan, getPlanRank, loading: plansLoading } = usePlans();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const effectiveSub = getEffectiveSubscription(userProfile);
  const currentPlanId = effectiveSub.planId || PLAN_IDS.STARTER;
  const currentPlan = getPlan(currentPlanId);
  const currentRank = getPlanRank(currentPlanId);
  const billingCycle = getUserBillingCycle(userProfile);

  // If a paid subscription has expired, sync state back to Starter in Firestore
  useEffect(() => {
    if (effectiveSub.isExpired && currentUser?.uid) {
      syncExpiredSubscription(currentUser.uid, effectiveSub.startedAt);
    }
  }, [effectiveSub.isExpired, currentUser?.uid, effectiveSub.startedAt]);

  // Initial full page loading state
  if (authLoading || (plansLoading && (!plansList || plansList.length === 0))) {
    return <BillingSkeleton />;
  }

  const notesUsed = monthlyUsage?.notesGenerated || 0;
  const notesQuota = currentPlan.limits.monthlyNotesQuota;
  const notesLeft = Math.max(0, notesQuota - notesUsed);
  const notesPercent = Math.min(100, Math.round((notesUsed / notesQuota) * 100));

  const qaUsed = (monthlyUsage?.videoQaQuestions || 0) + (monthlyUsage?.assistantQuestions || 0);
  const qaQuota = currentPlan.limits.monthlyChatQuota;
  const qaLeft = Math.max(0, qaQuota - qaUsed);
  const qaPercent = Math.min(100, Math.round((qaUsed / qaQuota) * 100));

  const isLimitReached = (notesLeft <= 0 || qaLeft <= 0) && currentRank < 2;

  const scrollToPlans = () => {
    const plansSection = document.getElementById('available-plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPlan = async (planId) => {
    if (planId === currentPlanId || isUpdating) return;
    
    // Prevent switching to a lower tier
    const targetRank = getPlanRank(planId);
    if (targetRank < currentRank) {
      return;
    }

    setSelectedPlanId(planId);

    if (currentUser) {
      setIsUpdating(true);
      try {
        const purchaseDate = new Date();
        const validUntil = new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        await updateUserSubscription(currentUser.uid, {
          planId,
          status: 'active',
          startedAt: purchaseDate.toISOString(),
          validUntil: validUntil.toISOString(),
        });
        setSuccessMsg(`Successfully upgraded to ${getPlan(planId).name} Plan!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        console.error('Failed to update subscription:', err);
      } finally {
        setIsUpdating(false);
        setSelectedPlanId(null);
      }
    }
  };

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textMuted = isDark ? 'text-zinc-500' : 'text-zinc-500';
  const cardBg = isDark ? 'bg-zinc-900/40' : 'bg-zinc-50/70';
  const subCardBg = isDark ? 'bg-zinc-950/60' : 'bg-white';

  return (
    <div className={`flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden ${bg}`}>
      {/* ── Header Section ── */}
      <div className="w-full shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-3 space-y-4">
          <DocPageHeader
            title="Billing & Usage"
            subtitle="Manage your subscription and monthly usage."
          />
        </div>
      </div>

      {/* ── Scrollable Billing Content Area ── */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-8 max-w-7xl mx-auto">

          {/* Success Banner */}
          {successMsg && (
            <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn ${
              isDark ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── Top Row: Current Plan & Features (Left) + Monthly Resource Usage (Right) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            
            {/* 1. Left Card: Current Active Plan */}
            <div className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all duration-200 ${cardBg}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-zinc-800/60 text-zinc-200' : 'bg-white text-zinc-800 shadow-xs'
                  }`}>
                    <Crown className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Your Current Plan</p>
                    <h3 className={`text-base sm:text-lg font-bold ${textPrimary}`}>{currentPlan.name} Plan</h3>
                  </div>
                </div>

                {/* Clean Key Specs & Features Card (No Inner Border) with Increase Badges */}
                <div className={`p-4 rounded-xl text-xs space-y-2.5 ${subCardBg}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={textMuted}>Note Sessions:</span>
                      {currentPlan.id !== PLAN_IDS.STARTER && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
                        }`}>
                          +{currentPlan.limits.monthlyNotesQuota - 10}
                        </span>
                      )}
                    </div>
                    <span className={`font-semibold ${textPrimary}`}>{currentPlan.limits.monthlyNotesQuota} / mo</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={textMuted}>Max Video Length:</span>
                      {currentPlan.id !== PLAN_IDS.STARTER && Math.round((currentPlan.limits.maxVideoDurationSeconds || 0) / 3600) > 2 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
                        }`}>
                          +{Math.round((currentPlan.limits.maxVideoDurationSeconds || 0) / 3600) - 2} hrs
                        </span>
                      )}
                    </div>
                    <span className={`font-semibold ${textPrimary}`}>{currentPlan.limits.maxVideoDurationDisplay}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={textMuted}>Guruji Doubts:</span>
                      {currentPlan.id !== PLAN_IDS.STARTER && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
                        }`}>
                          +{(currentPlan.limits.monthlyChatQuota - 75).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className={`font-semibold ${textPrimary}`}>{currentPlan.limits.monthlyChatQuota} / mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textMuted}>AI Queue Speed:</span>
                    <span className={`font-semibold ${currentPlan.limits.priorityQueue ? 'text-orange-500 dark:text-orange-400' : textPrimary}`}>
                      {currentPlan.limits.priorityQueue ? '⚡ Fast-Track Priority' : 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textMuted}>Subject Playlists:</span>
                    <span className="font-semibold text-emerald-500">Unlimited</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textMuted}>Study History Archive:</span>
                    <span className="font-semibold text-emerald-500">Unlimited</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textMuted}>Daily Study Planner:</span>
                    <span className="font-semibold text-emerald-500">Unlimited</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Right Card: Live Usage & Quota Meter (or Skeleton while fetching) */}
            {isUsageLoading ? (
              <UsageCardSkeleton isDark={isDark} cardBg={cardBg} subCardBg={subCardBg} />
            ) : (
              <div className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all duration-200 ${cardBg}`}>
                <div className="space-y-4">
                  {/* Header (Responsive for mobile screens) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`text-base sm:text-lg font-bold leading-tight ${textPrimary}`}>Monthly Resource Usage</h3>
                        <p className={`text-xs ${textSecondary}`}>Real-time quota tracking</p>
                      </div>
                    </div>

                    <div className={`flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 sm:gap-0.5 pt-2 sm:pt-0 border-t sm:border-t-0 ${
                      isDark ? 'border-zinc-800/50' : 'border-zinc-200/70'
                    }`}>
                      <div className={`text-xs ${textMuted} flex items-center gap-1.5`}>
                        <span>Cycle:</span>
                        <span className={`font-semibold ${textPrimary}`}>{billingCycle.formattedRange}</span>
                      </div>
                      <span className={`text-[10px] ${isDark ? 'border-zinc-800/50' : 'border-zinc-200/70'}`}>
                        {billingCycle.daysLeft} {billingCycle.daysLeft === 1 ? 'day' : 'days'} left
                      </span>
                    </div>
                  </div>

                  {/* Meter 1: Notes Sessions (No Inner Border) */}
                  <div className={`p-3.5 rounded-xl space-y-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={`font-medium ${textPrimary} truncate`}>Lecture Notes</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                          notesLeft > 0
                            ? isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                            : isDark ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {notesLeft > 0 ? `${notesLeft} left` : 'Limit Reached'}
                        </span>
                        <span className={`font-mono text-xs font-semibold shrink-0 whitespace-nowrap ${textPrimary}`}>
                          {notesUsed} / {notesQuota} used
                        </span>
                      </div>
                    </div>
                    
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          notesPercent >= 100
                            ? 'bg-red-500'
                            : isDark
                            ? 'bg-white'
                            : 'bg-zinc-950'
                        }`}
                        style={{
                          width: `${notesPercent}%`,
                          backgroundColor: notesPercent >= 100 ? '#ef4444' : (isDark ? '#ffffff' : '#000000'),
                        }}
                      />
                    </div>

                    <p className={`text-[11px] leading-relaxed ${textMuted}`}>
                      Generates structured lecture outlines, smart chapter takeaways, and formula breakdowns.
                    </p>
                  </div>

                  {/* Meter 2: Mentor Doubts (No Inner Border) */}
                  <div className={`p-3.5 rounded-xl space-y-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={`font-medium ${textPrimary} truncate`}>Guruji Doubts</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                          qaLeft > 0
                            ? isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                            : isDark ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {qaLeft > 0 ? `${qaLeft} left` : 'Limit Reached'}
                        </span>
                        <span className={`font-mono text-xs font-semibold shrink-0 whitespace-nowrap ${textPrimary}`}>
                          {qaUsed} / {qaQuota} used
                        </span>
                      </div>
                    </div>

                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          qaPercent >= 100
                            ? 'bg-red-500'
                            : isDark
                            ? 'bg-white'
                            : 'bg-zinc-950'
                        }`}
                        style={{
                          width: `${qaPercent}%`,
                          backgroundColor: qaPercent >= 100 ? '#ef4444' : (isDark ? '#ffffff' : '#000000'),
                        }}
                      />
                    </div>

                    <p className={`text-[11px] leading-relaxed ${textMuted}`}>
                      Ask conceptual doubt questions to Guruji and get real-time lecture Q&amp;A.
                    </p>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* ── Section Divider & Upgrade Subheading ── */}
          <div className="pt-8 pb-4 sm:pt-10 sm:pb-6 space-y-8">
            <hr className={`border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`} />

            {isLimitReached && (
              <div className="flex items-center justify-center text-center px-4">
                <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight m-0 text-center ${
                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}>
                  To get more quota and increase your study productivity, <span className="text-orange-500">upgrade your plan below</span>.
                </h3>
              </div>
            )}
          </div>

          {/* ── Section: Available Subscription Plans ── */}
          <div id="available-plans-section" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-0.5">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-orange-500 shrink-0" />
                <CreditCard className="w-4 h-4 text-orange-500 shrink-0" />
                <h2 className={`text-base font-bold ${textPrimary}`}>
                  Available Subscription Plans
                </h2>
              </div>
              <p className={`text-xs ${textSecondary}`}>
                Choose a plan that fits your study schedule. Upgrade anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pt-2">
              {plansLoading && (!plansList || plansList.length === 0) ? (
                <>
                  <PlanCardSkeleton isDark={isDark} isHighlighted={false} />
                  <PlanCardSkeleton isDark={isDark} isHighlighted={true} />
                  <PlanCardSkeleton isDark={isDark} isHighlighted={false} />
                </>
              ) : (
                plansList.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isDark={isDark}
                    currentPlanId={currentPlanId}
                    currentRank={currentRank}
                    isUpdating={isUpdating}
                    selectedPlanId={selectedPlanId}
                    onSelect={handleSelectPlan}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Payment Info & Security Banner (No Outer Border) ── */}
          <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-zinc-900/40 text-zinc-400' : 'bg-zinc-50/80 text-zinc-600'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>No credit card required</strong> for starter access. Paid plans support <strong>UPI, Cards & NetBanking</strong> with instant activation.</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">100% Secure &amp; encrypted payments</p>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

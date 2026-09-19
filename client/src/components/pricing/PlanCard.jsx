import React from 'react';
import { CheckCircle2, X, Lock, Loader2, ArrowRight } from 'lucide-react';
import { PLAN_IDS } from '../../models';
import { getPlanRank } from '../../services/firebase/planService';

/**
 * PlanCard
 * Reusable pricing card component used across Landing/Home page and Billing & Usage page.
 */
export default function PlanCard({
  plan,
  isDark = true,
  currentPlanId = null,
  currentRank = 0,
  isUpdating = false,
  selectedPlanId = null,
  onSelect,
  showBadge = true,
}) {
  const planRank = getPlanRank(plan.id);
  const isCurrent = Boolean(currentPlanId && currentPlanId === plan.id);
  const isDowngrade = Boolean(currentPlanId && planRank < currentRank);
  const isScholar = plan.id === PLAN_IDS.SCHOLAR;
  const isLearner = plan.id === PLAN_IDS.LEARNER;
  const isHighlighted = Boolean(plan.highlighted || isLearner);

  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  // Actual quota increase vs Free Starter tier (10 notes, 2 hrs, 75 chats)
  const isFree = plan.id === PLAN_IDS.STARTER;
  const videoHours = Math.round((plan.limits.maxVideoDurationSeconds || 0) / 3600);
  const notesIncrease = isFree ? 0 : (plan.limits.monthlyNotesQuota || 0) - 10;
  const videoIncrease = isFree ? 0 : videoHours - 2;
  const chatIncrease = isFree ? 0 : (plan.limits.monthlyChatQuota || 0) - 75;

  const handleAction = () => {
    if (isCurrent || isDowngrade || isUpdating) return;
    if (onSelect) {
      onSelect(plan.id);
    }
  };

  return (
    <div
      className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-7 relative transition-all duration-300 ${
        isScholar
          ? isDark
            ? 'border border-white/30 bg-zinc-950 shadow-xl shadow-white/5 hover:border-white/50'
            : 'border border-black bg-white shadow-xl shadow-zinc-950/5'
          : isHighlighted
            ? isDark
              ? 'border border-orange-500 bg-zinc-950 shadow-xl shadow-orange-500/10'
              : 'border border-orange-600 bg-white shadow-xl'
            : isDowngrade
              ? isDark
                ? 'border border-zinc-800/80 bg-zinc-950/40 opacity-70 shadow-xs'
                : 'border border-zinc-200/80 bg-white/40 opacity-70 shadow-xs'
              : isDark
                ? 'border border-zinc-800/80 bg-zinc-950 shadow-xs hover:border-zinc-700'
                : 'border border-zinc-200/80 bg-white shadow-xs hover:border-zinc-300'
      }`}
    >
      {/* Ribbon Badge (Top Center) */}
      {showBadge && plan.badge && (isHighlighted || isScholar) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={`text-[10px] font-black px-3.5 py-1 rounded-full tracking-wide uppercase shadow-md ${
              isScholar
                ? isDark
                  ? 'bg-white text-zinc-950 border border-white'
                  : 'bg-zinc-950 text-white border border-black'
                : 'bg-orange-600 text-white'
            }`}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* Standard Header, Description & Price Section */}
        <div className={`pb-5 border-b space-y-3.5 ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
          <div className="space-y-1">
            <h3
              className={`text-sm sm:text-base font-extrabold uppercase tracking-wide ${
                isScholar
                  ? isDark
                    ? 'text-white font-black'
                    : 'text-zinc-950 font-black'
                  : isHighlighted
                    ? isDark
                      ? 'text-orange-400'
                      : 'text-orange-600'
                    : isDark
                      ? 'text-zinc-400'
                      : 'text-zinc-500'
              }`}
            >
              {plan.name}
            </h3>

            {plan.description && (
              <p className={`text-xs leading-relaxed ${textSecondary}`}>
                {plan.description}
              </p>
            )}
          </div>

          {/* Price Block: Original Price & Bracketed Discount on top, Larger Final Amount below */}
          <div className="space-y-1 pt-1">
            {plan.originalPrice > 0 ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`line-through ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  ₹{plan.originalPrice}
                </span>
                {plan.discountBadge && (
                  <span className={
                    isScholar
                      ? isDark ? 'text-zinc-400' : 'text-zinc-500'
                      : isHighlighted
                        ? isDark ? 'text-orange-400' : 'text-orange-600'
                        : isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }>
                    ({plan.discountBadge})
                  </span>
                )}
              </div>
            ) : (
              <div className="h-4" />
            )}

            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl sm:text-5xl font-black tracking-tight ${textPrimary}`}>
                {plan.price === 0 ? 'Free' : `₹${plan.price}`}
              </span>
              {plan.price > 0 && (
                <span className={`text-sm sm:text-base font-semibold ${textSecondary}`}>/month</span>
              )}
            </div>
          </div>
        </div>

        {/* 1. Key Limit Specs Table (First) with increase badge right after the point label */}
        <div className={`p-3.5 rounded-xl text-xs space-y-2.5 ${isDark ? 'bg-zinc-900/60' : 'bg-zinc-100/70'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className={textSecondary}>Note Sessions:</span>
              {notesIncrease > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
                }`}>
                  +{notesIncrease}
                </span>
              )}
            </div>
            <span className={`font-semibold ${textPrimary}`}>{plan.limits.monthlyNotesQuota} / mo</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className={textSecondary}>Max Video Length:</span>
              {videoIncrease > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
                }`}>
                  +{videoIncrease} hrs
                </span>
              )}
            </div>
            <span className={`font-semibold ${textPrimary}`}>{plan.limits.maxVideoDurationDisplay}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className={textSecondary}>AI Q&amp;A Doubts:</span>
              {chatIncrease > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
                }`}>
                  +{chatIncrease.toLocaleString()}
                </span>
              )}
            </div>
            <span className={`font-semibold ${textPrimary}`}>{plan.limits.monthlyChatQuota} / mo</span>
          </div>

          <div className="flex justify-between items-center">
            <span className={textSecondary}>AI Queue Speed:</span>
            <span className={`font-semibold ${
              plan.limits.priorityQueue
                ? isScholar
                  ? isDark
                    ? 'text-white font-bold'
                    : 'text-zinc-950 font-bold'
                  : 'text-orange-500 dark:text-orange-400'
                : textPrimary
            }`}>
              {plan.limits.priorityQueue ? '⚡ Fast-Track Priority' : 'Standard'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={textSecondary}>Subject Playlists:</span>
            <span className="font-semibold text-emerald-500">Unlimited</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={textSecondary}>Study History Archive:</span>
            <span className="font-semibold text-emerald-500">Unlimited</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={textSecondary}>Daily Study Planner:</span>
            <span className="font-semibold text-emerald-500">Unlimited</span>
          </div>
        </div>

        {/* 2. Remaining Feature Points (After Table) */}
        <ul className="space-y-2.5 pt-1">
          {plan.features.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2.5 text-xs sm:text-sm transition-opacity ${
                item.included
                  ? isDark
                    ? 'text-zinc-200 font-medium opacity-100'
                    : 'text-zinc-800 font-medium opacity-100'
                  : isDark
                    ? 'text-zinc-600 opacity-40 select-none'
                    : 'text-zinc-400 opacity-40 select-none'
              }`}
            >
              {item.included ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
              ) : (
                <X className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`} />
              )}
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      {isCurrent ? (
        <button
          type="button"
          disabled
          className={`w-full py-3 rounded-xl text-sm font-bold border transition select-none cursor-default ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
              : 'bg-zinc-100 border-zinc-200 text-zinc-500'
          }`}
        >
          Current Active Plan
        </button>
      ) : isDowngrade ? (
        <button
          type="button"
          disabled
          className={`w-full py-3 rounded-xl text-sm font-bold border transition select-none flex items-center justify-center gap-1.5 cursor-not-allowed ${
            isDark
              ? 'bg-zinc-900/60 text-zinc-600 border-zinc-800/60 opacity-60'
              : 'bg-zinc-100/60 text-zinc-400 border-zinc-200/60 opacity-60'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lower Tier (Unavailable)</span>
        </button>
      ) : isScholar ? (
        <button
          type="button"
          id={`pricing-cta-${plan.id}`}
          disabled={isUpdating}
          onClick={handleAction}
          className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
            isDark
              ? 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-white/10'
              : 'bg-zinc-950 text-white hover:bg-black shadow-black/10'
          }`}
        >
          {isUpdating && selectedPlanId === plan.id ? (
            <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-zinc-950' : 'text-white'}`} />
          ) : (
            <>
              <span>{plan.ctaText}</span>
              <ArrowRight className={`w-4 h-4 transition-transform ${isDark ? 'text-zinc-950' : 'text-white'}`} />
            </>
          )}
        </button>
      ) : isHighlighted ? (
        <button
          type="button"
          id={`pricing-cta-${plan.id}`}
          disabled={isUpdating}
          onClick={handleAction}
          className="hero-rotating-border-btn w-full group py-3 cursor-pointer"
        >
          <div className="rotating-beam" />
          <div className="inner-content py-1">
            {isUpdating && selectedPlanId === plan.id ? (
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            ) : (
              <>
                <span className="text-sm">{plan.ctaText}</span>
                <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </button>
      ) : (
        <button
          type="button"
          id={`pricing-cta-${plan.id}`}
          disabled={isUpdating}
          onClick={handleAction}
          className={`w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            plan.price === 0
              ? isDark
                ? 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800 active:scale-[0.99]'
                : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 active:scale-[0.99]'
              : isDark
                ? 'bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.99]'
                : 'bg-zinc-900 text-white hover:bg-black active:scale-[0.99]'
          }`}
        >
          {isUpdating && selectedPlanId === plan.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{plan.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { PLAN_IDS } from '../../models';
import { usePlans } from '../../context/PlansContext';

/**
 * PlanQuotaBox
 * Reusable quota limits and specs box used across PlanCard, PlanUpgradeModal, and BillingPage.
 * Quotas and deltas are derived dynamically from live Firebase/Firestore plan configurations.
 */
export default function PlanQuotaBox({
  plan,
  isDark = true,
  className = '',
}) {
  const { getPlan } = usePlans();

  if (!plan || !plan.limits) return null;

  const isScholar = plan.id === PLAN_IDS.SCHOLAR;
  const isFree = plan.id === PLAN_IDS.STARTER;

  // Derive dynamic Starter baseline plan from Firestore via PlansContext
  const starterPlan = getPlan ? getPlan(PLAN_IDS.STARTER) : null;
  const starterLimits = starterPlan?.limits || {};

  const baselineNotes = Number(starterLimits.monthlyNotesQuota ?? 0);
  const baselineVideoHours = Math.round((starterLimits.maxVideoDurationSeconds ?? 0) / 3600);
  const baselineChats = Number(starterLimits.monthlyChatQuota ?? 0);

  const videoHours = Math.round((plan.limits.maxVideoDurationSeconds || 0) / 3600);
  const notesIncrease = isFree ? 0 : Math.max(0, (Number(plan.limits.monthlyNotesQuota) || 0) - baselineNotes);
  const videoIncrease = isFree ? 0 : Math.max(0, videoHours - baselineVideoHours);
  const chatIncrease = isFree ? 0 : Math.max(0, (Number(plan.limits.monthlyChatQuota) || 0) - baselineChats);

  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const boxBg = isDark ? 'bg-zinc-900/60' : 'bg-zinc-100/70';

  return (
    <div className={`p-3.5 rounded-xl text-xs space-y-2.5 text-left ${boxBg} ${className}`}>
      {/* 1. Note Sessions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className={textSecondary}>Note Sessions:</span>
          {notesIncrease > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              +{notesIncrease}
            </span>
          )}
        </div>
        <span className={`font-semibold ${textPrimary}`}>
          {plan.limits.monthlyNotesQuota} / mo
        </span>
      </div>

      {/* 2. Max Video Length */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className={textSecondary}>Max Video Length:</span>
          {videoIncrease > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              +{videoIncrease} hrs
            </span>
          )}
        </div>
        <span className={`font-semibold ${textPrimary}`}>
          {plan.limits.maxVideoDurationDisplay}
        </span>
      </div>

      {/* 3. AI Q&A Doubts */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className={textSecondary}>AI Q&amp;A Doubts:</span>
          {chatIncrease > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              +{chatIncrease.toLocaleString()}
            </span>
          )}
        </div>
        <span className={`font-semibold ${textPrimary}`}>
          {plan.limits.monthlyChatQuota} / mo
        </span>
      </div>

      {/* 4. AI Queue Speed */}
      <div className="flex justify-between items-center">
        <span className={textSecondary}>AI Queue Speed:</span>
        <span
          className={`font-semibold ${
            plan.limits.priorityQueue
              ? isScholar
                ? isDark
                  ? 'text-white font-bold'
                  : 'text-zinc-950 font-bold'
                : 'text-orange-500 dark:text-orange-400 font-bold'
              : textPrimary
          }`}
        >
          {plan.limits.priorityQueue ? '⚡ Fast-Track' : 'Standard'}
        </span>
      </div>

      {/* 5. Subject Playlists */}
      <div className="flex justify-between items-center">
        <span className={textSecondary}>Subject Playlists:</span>
        <span className="font-semibold text-emerald-500">Unlimited</span>
      </div>

      {/* 6. Study History Archive */}
      <div className="flex justify-between items-center">
        <span className={textSecondary}>Study History Archive:</span>
        <span className="font-semibold text-emerald-500">Unlimited</span>
      </div>

      {/* 7. Daily Study Planner */}
      <div className="flex justify-between items-center">
        <span className={textSecondary}>Daily Study Planner:</span>
        <span className="font-semibold text-emerald-500">Unlimited</span>
      </div>
    </div>
  );
}

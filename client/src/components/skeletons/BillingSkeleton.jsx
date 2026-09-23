import React from 'react';
import Skeleton from '../common/Skeleton';
import { useTheme } from '../../context/ThemeContext';

/**
 * UsageCardSkeleton
 * Skeleton loader specifically for the Monthly Resource Usage card.
 */
export function UsageCardSkeleton({ isDark = true, cardBg = '', subCardBg = '' }) {
  const defaultCardBg = cardBg || (isDark ? 'bg-zinc-900/40' : 'bg-zinc-50/70');
  const defaultSubCardBg = subCardBg || (isDark ? 'bg-zinc-950/60' : 'bg-white');

  return (
    <div className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all duration-200 ${defaultCardBg}`}>
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-1">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 sm:h-5 w-44 rounded-md" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5">
            <Skeleton className="h-3 w-36 rounded" />
            <Skeleton className="h-2.5 w-24 rounded" />
          </div>
        </div>

        {/* Meter 1 Skeleton */}
        <div className={`p-3.5 rounded-xl space-y-2.5 ${defaultSubCardBg}`}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-28 rounded" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-3.5 w-20 rounded" />
            </div>
          </div>
          
          <Skeleton className="w-full h-2 rounded-full" />
        </div>

        {/* Meter 2 Skeleton */}
        <div className={`p-3.5 rounded-xl space-y-2.5 ${defaultSubCardBg}`}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-36 rounded" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-3.5 w-20 rounded" />
            </div>
          </div>
          
          <Skeleton className="w-full h-2 rounded-full" />
        </div>

        {/* Usage & Billing Period Details Skeleton */}
        <div className={`p-3.5 rounded-xl flex items-start gap-2.5 ${defaultSubCardBg}`}>
          <Skeleton className="w-4 h-4 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CurrentPlanCardSkeleton
 * Skeleton loader for the Active Plan details card.
 */
export function CurrentPlanCardSkeleton({ isDark = true, cardBg = '', subCardBg = '' }) {
  const defaultCardBg = cardBg || (isDark ? 'bg-zinc-900/40' : 'bg-zinc-50/70');
  const defaultSubCardBg = subCardBg || (isDark ? 'bg-zinc-950/60' : 'bg-white');

  return (
    <div className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all duration-200 ${defaultCardBg}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-1">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-24 rounded" />
            <Skeleton className="h-4 sm:h-5 w-32 rounded-md" />
          </div>
        </div>

        {/* Spec Rows */}
        <div className={`p-4 rounded-xl space-y-3 ${defaultSubCardBg}`}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * PlanCardSkeleton
 * Skeleton placeholder for a single pricing tier card.
 */
export function PlanCardSkeleton({ isDark = true, isHighlighted = false }) {
  const cardBg = isDark
    ? isHighlighted ? 'bg-zinc-900/90' : 'bg-zinc-900/40'
    : isHighlighted ? 'bg-orange-50/30' : 'bg-zinc-50/70';

  return (
    <div className={`rounded-3xl p-6 flex flex-col justify-between space-y-6 ${cardBg} ${isHighlighted ? 'ring-1 ring-orange-500/30' : ''}`}>
      <div className="space-y-5">
        {/* Header & Badges */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          {isHighlighted && <Skeleton className="h-5 w-20 rounded-full" />}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-3 w-48 rounded" />
        </div>

        {/* Price display */}
        <div className="flex items-baseline gap-2 pt-1">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>

        {/* Limit Breakdown Sub-card */}
        <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-zinc-950/60' : 'bg-white'}`}>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>

        {/* Feature Checkmarks */}
        <div className="space-y-2.5 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="w-4 h-4 rounded-full shrink-0" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Skeleton className="w-full h-11 rounded-2xl" />
    </div>
  );
}

/**
 * Full BillingPage Skeleton
 */
export default function BillingSkeleton() {
  const { isDark } = useTheme();
  const bg = isDark ? 'bg-zinc-950' : 'bg-white';

  return (
    <div className={`flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden ${bg}`}>
      {/* Header Skeleton */}
      <div className="w-full shrink-0 px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-3 space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
          <Skeleton className="h-7 w-56 rounded-lg" />
        </div>
        <Skeleton className="h-3.5 w-72 rounded ml-11" />
      </div>

      {/* Content Area Skeleton */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-8 max-w-7xl mx-auto">
          
          {/* Top Row: Current Plan & Resource Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            <CurrentPlanCardSkeleton isDark={isDark} />
            <UsageCardSkeleton isDark={isDark} />
          </div>

          {/* Divider */}
          <div className="pt-4 pb-2">
            <Skeleton className="w-full h-px rounded" />
          </div>

          {/* Available Plans Section */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-0.5">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-5 w-48 rounded" />
              </div>
              <Skeleton className="h-3 w-64 rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pt-2">
              <PlanCardSkeleton isDark={isDark} isHighlighted={false} />
              <PlanCardSkeleton isDark={isDark} isHighlighted={false} />
              <PlanCardSkeleton isDark={isDark} isHighlighted={true} />
            </div>
          </div>

          {/* Security Banner Skeleton */}
          <Skeleton className="w-full h-14 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Skeleton from '../common/Skeleton';

/**
 * Helper to parse various video duration formats into total seconds.
 * Handles ISO 8601 (PT1H2M3S), colon-separated (HH:MM:SS or MM:SS), or raw numeric seconds.
 */
function parseDurationToSeconds(duration) {
  if (!duration) return null;
  if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
    return duration;
  }
  if (typeof duration === 'string') {
    const trimmed = duration.trim();
    if (!trimmed) return null;

    // Direct numeric string
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    // ISO 8601 string (e.g. PT1H30M15S, PT15M33S, PT45S)
    const isoMatch = trimmed.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (isoMatch && (isoMatch[1] || isoMatch[2] || isoMatch[3])) {
      const hours = parseInt(isoMatch[1] || '0', 10);
      const minutes = parseInt(isoMatch[2] || '0', 10);
      const seconds = parseInt(isoMatch[3] || '0', 10);
      return hours * 3600 + minutes * 60 + seconds;
    }

    // HH:MM:SS or MM:SS format
    const parts = trimmed.split(':').map((p) => parseInt(p, 10));
    if (parts.every((p) => !isNaN(p))) {
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
    }
  }
  return null;
}

/**
 * Computes an estimated total note-generation processing duration (in seconds)
 * proportional to the video duration.
 * - Short videos (< 10m): ~18 - 25s
 * - Medium videos (10m - 30m): ~26 - 40s
 * - Long lectures (30m - 60m): ~40 - 55s
 * - Extended videos (> 60m): ~55 - 80s
 * - Fallback (duration unknown): ~28s
 */
function estimateProcessingTime(videoSeconds) {
  if (!videoSeconds || videoSeconds <= 0) return 28;
  // Sub-linear scaling using square root: 14s base + scaling factor
  const estimated = 14 + Math.sqrt(videoSeconds) * 0.75;
  return Math.min(85, Math.max(16, Math.round(estimated)));
}

const DEFAULT_STEPS = [
  'Understanding the video transcript & audio...',
  'Analyzing lecture chapters & key concepts...',
  'Drafting comprehensive study notes & formulas...',
  'Refining structure, summaries & takeaways...',
  'Finalizing interactive study workspace...'
];

export default function VideoProcessingSkeleton({
  metadata = null,
  videoDuration = null,
  activeTab = 'notes',
  isCheckingCache = false
}) {
  const { isDark } = useTheme();

  // Extract duration from props or metadata
  const durationSeconds = useMemo(() => {
    if (videoDuration) return parseDurationToSeconds(videoDuration);
    if (!metadata) return null;
    return (
      parseDurationToSeconds(metadata.duration) ||
      parseDurationToSeconds(metadata.duration_seconds) ||
      parseDurationToSeconds(metadata.lengthSeconds) ||
      parseDurationToSeconds(metadata.durationSeconds) ||
      null
    );
  }, [metadata, videoDuration]);

  // Estimate total duration and step timing
  const { stepIntervalMs } = useMemo(() => {
    const totalSec = estimateProcessingTime(durationSeconds);
    const stepCount = DEFAULT_STEPS.length;
    // Step interval: spread steps evenly across 85% of estimated time, leaving last step to finish
    const intervalMs = Math.max(3000, Math.round(((totalSec * 0.85) / (stepCount - 1)) * 1000));
    return {
      estimatedTotalSeconds: totalSec,
      stepIntervalMs: intervalMs
    };
  }, [durationSeconds]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Dynamic step progression interval
  useEffect(() => {
    if (isCheckingCache) return;

    setCurrentStepIndex(0);
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < DEFAULT_STEPS.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on the last step until completed
      });
    }, stepIntervalMs);

    return () => clearInterval(interval);
  }, [stepIntervalMs, isCheckingCache]);

  const activeText = isCheckingCache
    ? 'Checking existing study records...'
    : DEFAULT_STEPS[currentStepIndex];

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Clean Borderless Study Notes Workspace Skeleton */}
      <div
        className={`rounded-xl transition-all duration-300 p-4 sm:p-6 space-y-6 ${
          isDark ? 'bg-zinc-950/20' : 'bg-orange-50/20'
        }`}
      >
        {/* Dynamic Status Text at Starting of Notes with Blended Color and Pulsing */}
        <div className="space-y-3 pb-2">
          <div className="flex items-center gap-2 animate-pulse opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60 shrink-0" />
            <p
              key={activeText}
              className={`text-xs font-medium tracking-tight animate-in fade-in duration-300 ${
                isDark ? 'text-zinc-400/80' : 'text-orange-900/60'
              }`}
            >
              {activeText}
            </p>
          </div>

          {/* Document Header Skeleton Title & Tags */}
          <div className="space-y-2.5 pt-1">
            <Skeleton className="h-6 sm:h-7 w-3/5 rounded-lg" />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>
        </div>

        {/* Overview / Abstract Block Skeleton */}
        <div
          className={`rounded-xl p-4 sm:p-5 space-y-3 ${
            isDark ? 'bg-zinc-900/30' : 'bg-orange-50/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="w-3.5 h-3.5 rounded bg-orange-500/30" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-11/12 rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
          </div>
        </div>

        {/* Note Chapters / Sections Skeleton */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3.5 w-20 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div
              className={`p-3.5 rounded-xl space-y-2.5 ${
                isDark ? 'bg-zinc-900/20' : 'bg-orange-50/40'
              }`}
            >
              <Skeleton className="h-4 w-2/3 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl space-y-2.5 ${
                isDark ? 'bg-zinc-900/20' : 'bg-orange-50/40'
              }`}
            >
              <Skeleton className="h-4 w-1/2 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Code / Formula & Key Points Box Skeleton */}
        <div
          className={`p-4 rounded-xl space-y-2.5 ${
            isDark ? 'bg-zinc-900/25' : 'bg-orange-50/50'
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
          <div className="space-y-2 pt-1 font-mono">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>

        {/* References / Footer List Skeleton */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3.5 w-36 rounded mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-6 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

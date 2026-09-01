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
 */
function estimateProcessingTime(videoSeconds) {
  if (!videoSeconds || videoSeconds <= 0) return 28;
  const estimated = 14 + Math.sqrt(videoSeconds) * 0.75;
  return Math.min(85, Math.max(16, Math.round(estimated)));
}

const STEP_DURATION_MS = 7000; // 7 seconds per step

const TAB_STEPS = {
  notes: [
    // Core Generation Steps (1 - 7)
    'Understanding video audio & transcript...',
    'Identifying core concepts & lecture timestamps...',
    'Extracting key takeaways, definitions & formulas...',
    'Drafting structured markdown study notes...',
    'Structuring chapters, subsections & hierarchy...',
    'Formatting mathematical equations & code blocks...',
    'Organizing compiled key references & citations...',
    // Refinement & Polishing Steps while waiting (8 - 20)
    'Refining technical definitions & terminology...',
    'Polishing markdown formatting & visual hierarchy...',
    'Cross-checking timestamps with video moments...',
    'Enhancing readability & conceptual clarity...',
    'Validating formula syntax and explanations...',
    'Synthesizing deep-dive section takeaways...',
    'Harmonizing chapter summaries & bullet points...',
    'Reviewing document structure for completeness...',
    'Optimizing reference links and source context...',
    'Performing semantic coherence checks...',
    'Packaging comprehensive study guide...',
    'Preparing interactive study workspace...',
    'Almost ready, finalizing your study notes...'
  ],
  summary: [
    // Core Generation Steps (1 - 7)
    'Analyzing video timeline & key moments...',
    'Identifying major lecture transitions & themes...',
    'Extracting primary learning objectives...',
    'Synthesizing executive summary & abstract...',
    'Constructing chapter-by-chapter outline...',
    'Compiling core takeaways & action items...',
    'Structuring curriculum hierarchy & outcomes...',
    // Refinement & Polishing Steps while waiting (8 - 20)
    'Refining executive summary conciseness...',
    'Polishing chapter timestamps & durations...',
    'Aligning takeaways with learning outcomes...',
    'Optimizing chapter description clarity...',
    'Balancing detail across lecture sections...',
    'Highlighting critical concepts & milestones...',
    'Verifying timeline consistency with video...',
    'Formatting dashboard cards & visual layout...',
    'Enhancing takeaway clarity & readability...',
    'Running comprehensive summary review...',
    'Finalizing executive insights & takeaways...',
    'Preparing summary dashboard cards...',
    'Almost ready, assembling your summary...'
  ],
  qa: [
    // Core Generation Steps (1 - 7)
    'Extracting full video transcript & timestamps...',
    'Cleaning speech-to-text transcript segments...',
    'Splitting lecture into semantic chunks...',
    'Generating transcript embeddings for search...',
    'Indexing video timeline into knowledge base...',
    'Connecting vector memory for interactive Q&A...',
    'Initializing neural question-answering assistant...',
    // Refinement & Polishing Steps while waiting (8 - 20)
    'Refining semantic retrieval index...',
    'Calibrating context window for video answers...',
    'Optimizing timestamp accuracy for answers...',
    'Fine-tuning prompt comprehension models...',
    'Pre-indexing key lecture question topics...',
    'Testing citation retrieval for video moments...',
    'Validating response streaming pipeline...',
    'Enhancing query understanding models...',
    'Configuring chat conversation memory...',
    'Performing latency optimization check...',
    'Finalizing assistant knowledge grounding...',
    'Preparing interactive chat companion...',
    'Almost ready, connecting your Q&A assistant...'
  ]
};

export default function VideoProcessingSkeleton({
  metadata = null,
  videoDuration = null,
  activeTab = 'notes',
  isCheckingCache = false
}) {
  const { isDark } = useTheme();

  const steps = TAB_STEPS[activeTab] || TAB_STEPS.notes;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Dynamic step progression: 7 seconds per step
  useEffect(() => {
    if (isCheckingCache) return;

    setCurrentStepIndex(0);
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, STEP_DURATION_MS);

    return () => clearInterval(interval);
  }, [isCheckingCache, steps.length]);

  const activeText = isCheckingCache
    ? 'Checking existing study records...'
    : steps[currentStepIndex];

  return (
    <div className="w-full space-y-4 pb-2 animate-in fade-in duration-300">
      {/* Clean Borderless Workspace Skeleton */}
      <div
        className={`rounded-xl transition-all duration-300 p-4 sm:p-6 space-y-6 ${
          isDark ? 'bg-zinc-950/20' : 'bg-orange-50/20'
        }`}
      >
        {/* Dynamic Status Text at Starting of Workspace */}
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

          {/* Header Skeleton */}
          <div className="space-y-2.5 pt-1">
            <Skeleton className="h-6 sm:h-7 w-3/5 rounded-lg" />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>
        </div>

        {/* Tab-Specific Skeleton Body */}
        {activeTab === 'summary' ? (
          <SummarySkeletonView isDark={isDark} />
        ) : activeTab === 'qa' ? (
          <QaSkeletonView isDark={isDark} />
        ) : (
          <NotesSkeletonView isDark={isDark} />
        )}
      </div>
    </div>
  );
}

/**
 * 1. Notes Tab Skeleton: Title, Abstract overview, Note chapters, Code/Formula box, References
 */
function NotesSkeletonView({ isDark }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview / Abstract Block */}
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

      {/* Chapters / Sections */}
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

      {/* Formula & Code Box */}
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

      {/* References Badges */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-36 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Summary Tab Skeleton: Abstract block, Chapter Timeline grid, Takeaways & Objectives cards
 */
function SummarySkeletonView({ isDark }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Executive Abstract Box */}
      <div
        className={`rounded-xl p-4 sm:p-5 space-y-3 ${
          isDark ? 'bg-zinc-900/30' : 'bg-orange-50/60'
        }`}
      >
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded bg-orange-500/30" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-5/6 rounded" />
        </div>
        <div className="pt-2 flex flex-wrap gap-2">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
      </div>

      {/* Summary Grid: Chapter Timeline (Left) & Takeaways Sidebar (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Side: Timeline Chapters */}
        <div className="xl:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`p-4 rounded-xl space-y-2.5 ${
                isDark ? 'bg-zinc-900/25' : 'bg-orange-50/45'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14 rounded-md bg-orange-500/20" />
                  <Skeleton className="h-4 w-40 rounded" />
                </div>
                <Skeleton className="h-3.5 w-12 rounded" />
              </div>
              <div className="space-y-1.5 pt-1 pl-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Key Takeaways & Core Objectives */}
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl space-y-3 ${
              isDark ? 'bg-zinc-900/25' : 'bg-orange-50/45'
            }`}
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-3.5 h-3.5 rounded bg-orange-500/30" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div className="space-y-2 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-2 h-2 rounded-full bg-orange-500/30 shrink-0" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              ))}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl space-y-3 ${
              isDark ? 'bg-zinc-900/25' : 'bg-orange-50/45'
            }`}
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-3.5 h-3.5 rounded bg-orange-500/30" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Q&A Tab Skeleton: Chat conversation message bubbles, suggested question starter pills, input bar
 */
function QaSkeletonView({ isDark }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Chat Messages Flow */}
      <div className="space-y-4 pt-1">
        {/* Assistant Welcome Bubble (Left) */}
        <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
          <Skeleton className="w-7 h-7 rounded-full bg-orange-500/30 shrink-0 mt-0.5" />
          <div
            className={`p-3.5 rounded-2xl rounded-tl-sm space-y-2 w-full ${
              isDark ? 'bg-zinc-900/40' : 'bg-orange-50/70'
            }`}
          >
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3.5 w-1/2 rounded" />
          </div>
        </div>

        {/* User Question Bubble (Right) */}
        <div className="flex items-start justify-end gap-3 pl-8">
          <div
            className={`p-3.5 rounded-2xl rounded-tr-sm space-y-1.5 max-w-[80%] sm:max-w-[70%] w-64 ${
              isDark ? 'bg-zinc-900/40' : 'bg-orange-100/70'
            }`}
          >
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </div>
          <Skeleton className="w-7 h-7 rounded-full shrink-0 mt-0.5" />
        </div>

        {/* Assistant Response Bubble (Left) */}
        <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%]">
          <Skeleton className="w-7 h-7 rounded-full shrink-0 mt-0.5" />
          <div
            className={`p-4 rounded-2xl rounded-tl-sm space-y-2.5 w-full ${
              isDark ? 'bg-zinc-900/40' : 'bg-orange-50/70'
            }`}
          >
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-11/12 rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
            <div className="pt-2 flex gap-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Topic Starter Chips */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-32 rounded" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-44 rounded-full" />
          <Skeleton className="h-7 w-52 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-full" />
        </div>
      </div>

      {/* Interactive Input Bar Skeleton */}
      <div
        className={`p-2.5 rounded-xl flex items-center gap-2.5 ${
          isDark ? 'bg-zinc-900/40' : 'bg-orange-50/70'
        }`}
      >
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg bg-orange-500/40 shrink-0" />
      </div>
    </div>
  );
}

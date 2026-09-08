import { CheckCircle2, X } from 'lucide-react';
import CurvyUnderline from './CurvyUnderline';
import SectionLabel from './SectionLabel';

export default function ComparisonSection({ isDark, headingClass, subClass }) {
  return (
    <div className="space-y-16">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <SectionLabel isDark={isDark}>Transparent Plans</SectionLabel>
        <h2 className={`text-2xl sm:text-3xl font-black ${headingClass}`}>
          Invest in your{' '}
          <span className="relative inline-block">
            <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>education</span>
            <CurvyUnderline />
          </span>
          , not distractions
        </h2>
        <p className={`text-sm max-w-lg mx-auto ${subClass}`}>One quiet platform. No advertisements. Unlimited study mentorship.</p>
      </div>

      {/* COMPARISON: Why Pathshala AI vs Others (2-Column Cards) */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h3 className={`text-lg sm:text-xl font-bold ${headingClass}`}>
            Why Students Choose{' '}
            <span className="relative inline-block">
              <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>Pathshala AI</span>
              <CurvyUnderline />
            </span>
          </h3>
          <p className={`text-xs sm:text-sm ${subClass}`}>
            See how a dedicated AI study OS outperforms cluttered video sites and generic note apps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Standard Platforms Card */}
          <div className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 ${isDark
              ? 'bg-zinc-950 border-zinc-800/80 shadow-xs'
              : 'bg-zinc-50 border-zinc-200/80 shadow-xs'
            }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    : 'bg-zinc-200/60 border-zinc-300/60 text-zinc-600'
                  }`}>
                  Traditional Way
                </span>
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Fragmented Study</span>
              </div>
              <div>
                <h4 className={`text-base sm:text-lg font-bold ${headingClass}`}>Standard Video Sites & Generic Tools</h4>
                <p className={`text-xs mt-1 leading-relaxed ${subClass}`}>Constant interruptions, noisy comment threads, and endless manual work.</p>
              </div>
              <ul className="space-y-3 pt-2">
                {[
                  'Frequent commercial video ads, popups & sidebar clickbait',
                  'Manual pausing, rewinding & handwriting notes for hours',
                  'Confusing comments or disconnected search for doubt clearing',
                  'Scattered browser bookmarks & lost lecture watch history',
                  'No built-in daily study planner or streak accountability',
                  'Hard-to-read video frames and manual math copying',
                  'No direct Hinglish/English contextual concept explanations'
                ].map(item => (
                  <li key={item} className={`flex items-start gap-2.5 text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <X className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pathshala AI Card */}
          <div className={`rounded-2xl border-2 p-6 sm:p-7 flex flex-col justify-between space-y-6 relative transition-all duration-300 ${isDark
              ? 'border-orange-500 bg-zinc-950 shadow-xl shadow-orange-500/10'
              : 'border-orange-600 bg-white shadow-md'
            }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-orange-600 text-white shadow-sm">
                  Recommended
                </span>
                <span className={`text-xs font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>All-in-One OS</span>
              </div>
              <div>
                <h4 className={`text-base sm:text-lg font-bold ${headingClass}`}>
                  Pathshala AI <span className={isDark ? 'text-orange-400' : 'text-orange-600'}>Learning OS</span>
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${subClass}`}>Purpose-built for student focus, fast retention, and deep exam clarity.</p>
              </div>
              <ul className="space-y-3 pt-2">
                {[
                  '100% Distraction-Free (Zero ads, popups, or recommendation clutter)',
                  'Instant structured lecture notes + LaTeX math equations + timestamps',
                  '24/7 Context-aware Guruji AI Mentor with deep video comprehension',
                  'Automated subject playlists with syllabus mastery checkmarks',
                  'Integrated daily study planner with priority task scheduling',
                  '99.4% LaTeX-accurate mathematical & scientific formula precision',
                  'Direct Hinglish & English interactive explanations anytime'
                ].map(item => (
                  <li key={item} className={`flex items-start gap-2.5 text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

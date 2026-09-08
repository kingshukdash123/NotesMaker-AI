import CurvyUnderline from './CurvyUnderline';
import BrowserFrame from './BrowserFrame';
import SectionLabel from './SectionLabel';
import FeatureRow from './FeatureRow';

export default function GurujiMentorSection({ isDark, headingClass, subClass }) {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="space-y-5">
          <div className="text-center md:text-left">
            <SectionLabel isDark={isDark}>24/7 Personal Academic Mentor</SectionLabel>
            <h2 className={`text-2xl sm:text-3xl font-black leading-tight ${headingClass}`}>
              Meet{' '}
              <span className="relative inline-block">
                <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>Guruji</span>
                <CurvyUnderline />
              </span>
              {' '}&mdash; your personal academic mentor
            </h2>
          </div>

          {/* Mobile & Tablet: Image between heading and description */}
          <div className="md:hidden pt-2 pb-1">
            <BrowserFrame
              src="/screenshots/guruji_chat.png"
              alt="Guruji Academic Mentor — Explaining complex concepts step-by-step"
              className={isDark ? 'border-zinc-800' : 'border-zinc-200'}
            />
          </div>

          <p className={`text-sm leading-relaxed ${subClass}`}>
            Guruji learns right alongside you. It understands the exact lecture you&apos;re watching, reads your notes, and remembers your study progress. Ask any doubt anytime &mdash; it already knows what you&apos;re working on.
          </p>
          <ul className="space-y-3">
            <FeatureRow isDark={isDark}>Solves complex physics equations, organic chemistry, and advanced mathematics</FeatureRow>
            <FeatureRow isDark={isDark}>Lesson-aware: answers questions specifically for the class you are watching</FeatureRow>
            <FeatureRow isDark={isDark}>Explains math and science step-by-step with clear formulas and diagrams</FeatureRow>
            <FeatureRow isDark={isDark}>Instant one-click study actions to clear doubts in seconds</FeatureRow>
          </ul>
          <div className="pt-2 space-y-2 text-center md:text-left">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              One-Click Clarification Prompts:
            </span>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {['Explain Simply', 'Step-by-Step Solution', 'Revision Checklist', 'Key Takeaways'].map((prompt) => (
                <span
                  key={prompt}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${isDark
                      ? 'bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:border-orange-500/50'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:border-orange-300'
                    }`}
                >
                  &ldquo;{prompt}&rdquo;
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <BrowserFrame
            src="/screenshots/guruji_chat.png"
            alt="Guruji Academic Mentor — Explaining complex concepts step-by-step"
            className={isDark ? 'border-zinc-800' : 'border-zinc-200'}
          />
        </div>
      </div>
    </section>
  );
}

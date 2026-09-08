import { ArrowRight } from 'lucide-react';
import CurvyUnderline from './CurvyUnderline';

export default function HeroSection({ isDark, onOpenAuthModal, headingClass, subClass }) {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto text-center space-y-7 my-auto">
        {/* Hero Main Heading */}
        <h1 className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] ${headingClass}`}>
          Study without distractions.{' '}
          <br className="hidden sm:block" />
          Master every lecture with{' '}
          <span className="relative inline-block">
            <span className="text-orange-500">focus.</span>
            <CurvyUnderline />
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${subClass}`}>
          Turn any video lecture into crystal-clear organized notes, instant formula breakdowns, and direct answers from your personal study mentor{' '}
          <strong className={isDark ? 'text-zinc-100 font-semibold' : 'text-zinc-900 font-semibold'}>Guruji</strong>
          {' '}&mdash; all in one quiet, focused workspace.
        </p>

        {/* Action CTAs: Free Trial + Sign In */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            id="hero-cta-trial"
            onClick={() => onOpenAuthModal('signup')}
            className="hero-rotating-border-btn group"
          >
            <div className="rotating-beam" />
            <div className="inner-content">
              <span>Start 7-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            id="hero-cta-signin"
            onClick={() => onOpenAuthModal('login')}
            className={`px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-white text-zinc-950 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-zinc-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Trust Footnote */}
        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Trusted by <span className={isDark ? 'text-zinc-300 font-semibold' : 'text-zinc-700 font-semibold'}>10,000+ students</span> preparing for Board Exams, JEE, NEET, GATE, UPSC &amp; University Degrees
        </p>
      </div>
    </section>
  );
}

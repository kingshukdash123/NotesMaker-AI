import { ArrowRight, CheckCircle2 } from 'lucide-react';
import CurvyUnderline from './CurvyUnderline';

export default function FinalCtaSection({ isDark, onOpenAuthModal, headingClass, subClass }) {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className={`relative overflow-hidden rounded-3xl border p-8 sm:p-14 text-center space-y-6 transition-all duration-300 ${isDark
          ? 'bg-gradient-to-br from-black via-zinc-900/70 to-black border-zinc-800/80 shadow-2xl'
          : 'bg-gradient-to-br from-white via-orange-50/50 to-white border-zinc-200/90 shadow-xl'
        }`}>
        {/* Diagonal Ambient Glow Backdrop */}
        <div className={`absolute top-0 right-1/4 -translate-y-1/3 w-[550px] h-[350px] rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-orange-500/15' : 'bg-orange-400/10'
          }`} />

        {/* Grid Overlay Texture with Elliptical Radial Mask */}
        <div className={`absolute inset-0 bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_92%)] pointer-events-none ${isDark
            ? 'bg-[linear-gradient(rgba(255,255,255,0.065)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.065)_1px,transparent_1px)]'
            : 'bg-[linear-gradient(rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.06)_1px,transparent_1px)]'
          }`} />

        {/* Guruji Mentor Avatar */}
        <div className="relative z-10 flex justify-center">
          <img
            src="/nova.png"
            alt="Guruji — AI Academic Mentor"
            width="64"
            height="64"
            loading="lazy"
            decoding="async"
            className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-lg shadow-orange-500/25"
          />
        </div>

        {/* Heading */}
        <h2 className={`relative z-10 text-2xl sm:text-4xl font-black leading-tight ${headingClass}`}>
          Ready to transform your{' '}
          <span className="relative inline-block">
            <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>study routine</span>
            <CurvyUnderline />
          </span>
          ?
        </h2>

        {/* Subtitle */}
        <p className={`relative z-10 text-sm max-w-lg mx-auto leading-relaxed ${subClass}`}>
          Join thousands of students who replaced video distractions with focused, structured learning. Start your 7-day free trial today &mdash; no credit card required.
        </p>

        {/* Action Buttons: Start Trial + High Contrast Sign In Button */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-1">
          <button
            type="button"
            id="final-cta-signup"
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
            id="final-cta-signin"
            onClick={() => onOpenAuthModal('login')}
            className={`px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2 ${isDark
                ? 'bg-white text-zinc-950 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-zinc-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            <span>Sign In</span>
          </button>
        </div>

        {/* Trust Guarantees */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-5 pt-2">
          {['No credit card required', '14-day money-back guarantee', 'Cancel anytime'].map(t => (
            <span key={t} className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>{t}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

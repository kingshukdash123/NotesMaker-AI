import { useTheme } from '../../context/ThemeContext';
import { ArrowRight } from 'lucide-react';

export default function HomeSection({ onOpenAuthModal }) {
  const { isDark } = useTheme();

  return (
    <div className="max-w-5xl mx-auto relative py-12 sm:py-20">
      <div className="space-y-8 relative z-10">
        {/* Hero Block */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h2 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-center px-2 ${
            isDark ? 'text-zinc-50' : 'text-orange-950'
          }`}>
            Welcome to{' '}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Pathshala A<span className="text-orange-500 font-bold"><i>I</i></span>
            </span>
          </h2>

          <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto ${
            isDark ? 'text-zinc-400' : 'text-orange-900/80 font-medium'
          }`}>
            Your all-in-one platform for distraction-free study and maximum productivity. Stream lectures without interruptions, generate structured notes, consult your AI mentor, and plan your study goals in one unified space.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 pt-6">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => onOpenAuthModal('signup')}
              className="hero-rotating-border-btn group"
            >
              <div className="rotating-beam" />
              <div className="inner-content">
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="hero-static-btn"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

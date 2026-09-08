import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import CurvyUnderline from './CurvyUnderline';
import LimitedTimeTimer from './LimitedTimeTimer';

export default function PricingSection({ isDark, onOpenAuthModal, headingClass, subClass }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className={`text-lg sm:text-xl font-bold ${headingClass}`}>
          Choose Your{' '}
          <span className="relative inline-block">
            <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>Plan</span>
            <CurvyUnderline />
          </span>
        </h3>
        <p className={`text-xs sm:text-sm ${subClass}`}>
          Start with a 7-day free trial. Upgrade or cancel anytime with one click.
        </p>
        <LimitedTimeTimer isDark={isDark} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {/* Starter Plan Card */}
        <div className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between space-y-7 transition-all duration-300 ${isDark
            ? 'bg-zinc-950 border-zinc-800/80 shadow-xs'
            : 'bg-white border-zinc-200/80 shadow-xs'
          }`}>
          <div className="space-y-6">
            {/* Header & Price Section */}
            <div className={`pb-5 border-b space-y-3 ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Starter
                </p>
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}>
                  7-Day Trial
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <p className={`text-3xl sm:text-4xl font-black tracking-tight ${headingClass}`}>Free</p>
                </div>
                <p className={`text-xs mt-1.5 ${subClass}`}>7-day full access trial &bull; No card required</p>
              </div>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-3">
              {[
                { text: '5 full lecture note sessions', included: true },
                { text: '50 Guruji mentor questions', included: true },
                { text: '3 subject playlists', included: true },
                { text: 'Standard LaTeX math precision', included: true },
                { text: 'Standard PDF note downloads', included: true },
                { text: 'Basic daily study planner tasks', included: true },
                { text: 'Unlimited lecture note sessions', included: false },
                { text: 'Unlimited 24/7 Guruji mentor chat', included: false },
                { text: 'High-precision LaTeX + formula sheets', included: false },
                { text: 'High-Res PDF & Markdown export', included: false },
                { text: 'Full academic year history retention', included: false },
                { text: 'Early access to upcoming AI features', included: false },
                { text: 'Dedicated priority VIP support', included: false },
              ].map(item => (
                <li key={item.text} className={`flex items-start gap-2.5 text-xs sm:text-sm ${item.included
                    ? isDark ? 'text-zinc-200 font-medium' : 'text-zinc-800 font-medium'
                    : isDark ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
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

          <button
            type="button"
            id="pricing-cta-starter"
            onClick={() => onOpenAuthModal('signup')}
            className={`w-full py-3 rounded-xl text-sm font-bold border transition cursor-pointer ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
          >
            Start Free Trial
          </button>
        </div>

        {/* Learner Plan Card */}
        <div className={`rounded-2xl border-2 p-6 sm:p-7 flex flex-col justify-between space-y-7 relative transition-all duration-300 ${isDark
            ? 'border-orange-500 bg-zinc-950 shadow-xl shadow-orange-500/10'
            : 'border-orange-600 bg-white shadow-xl'
          }`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-orange-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full tracking-wide uppercase shadow-md">
              Most Popular
            </span>
          </div>

          <div className="space-y-6">
            {/* Header & Price Section */}
            <div className={`pb-5 border-b space-y-3 ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  Learner
                </p>
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${isDark
                    ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                    : 'bg-orange-50 border-orange-200 text-orange-600'
                  }`}>
                  40% OFF
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <p className={`text-3xl sm:text-4xl font-black tracking-tight ${headingClass}`}>Rs.299</p>
                  <span className={`text-sm sm:text-base line-through font-semibold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Rs.499
                  </span>
                  <p className={`text-sm font-semibold ${subClass}`}>/month</p>
                </div>
                <p className={`text-xs mt-1.5 ${subClass}`}>Billed monthly &bull; Cancel anytime with 1-click</p>
              </div>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-3">
              {[
                { text: 'Unlimited lecture note sessions', included: true },
                { text: 'Unlimited 24/7 Guruji mentor chat', included: true },
                { text: 'Unlimited subject playlists', included: true },
                { text: 'High-precision LaTeX + formula sheets', included: true },
                { text: 'High-Res PDF & Markdown note export', included: true },
                { text: 'Full daily study planner + streak tracker', included: true },
                { text: 'Full academic year history retention', included: true },
                { text: 'Hinglish & English language explanations', included: true },
                { text: 'Fast email support (<2-4h response)', included: true },
                { text: '14-Day money-back guarantee', included: true },
                { text: '12-Month discounted annual pass', included: false },
                { text: 'Early access to upcoming AI features', included: false },
                { text: 'Dedicated priority VIP support', included: false },
              ].map(item => (
                <li key={item.text} className={`flex items-start gap-2.5 text-xs sm:text-sm ${item.included
                    ? isDark ? 'text-zinc-200 font-medium' : 'text-zinc-800 font-medium'
                    : isDark ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
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

          <button
            type="button"
            id="pricing-cta-learner"
            onClick={() => onOpenAuthModal('signup')}
            className="hero-rotating-border-btn w-full group py-3"
          >
            <div className="rotating-beam" />
            <div className="inner-content py-1">
              <span className="text-sm">Get Learner Plan</span>
              <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Scholar Plan Card */}
        <div className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between space-y-7 transition-all duration-300 ${isDark
            ? 'bg-zinc-950 border-zinc-800/80 shadow-xs'
            : 'bg-white border-zinc-200/80 shadow-xs'
          }`}>
          <div className="space-y-6">
            {/* Header & Price Section */}
            <div className={`pb-5 border-b space-y-3 ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Scholar
                </p>
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${isDark
                    ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                    : 'bg-orange-50 border-orange-200 text-orange-600'
                  }`}>
                  60% OFF
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <p className={`text-3xl sm:text-4xl font-black tracking-tight ${headingClass}`}>Rs.199</p>
                  <span className={`text-sm sm:text-base line-through font-semibold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Rs.499
                  </span>
                  <p className={`text-sm font-semibold ${subClass}`}>/month</p>
                </div>
                <p className={`text-xs mt-1.5 ${subClass}`}>
                  Billed annually (Rs.2,388/yr) &bull; 14-day refund policy
                </p>
              </div>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-3">
              {[
                { text: 'Unlimited lecture note sessions', included: true },
                { text: 'Unlimited 24/7 Priority Guruji chat', included: true },
                { text: 'Unlimited subject playlists', included: true },
                { text: 'High-precision LaTeX + fast-track AI', included: true },
                { text: 'High-Res PDF & Markdown note export', included: true },
                { text: 'Full daily study planner + priority tags', included: true },
                { text: 'Full academic year history retention', included: true },
                { text: 'Hinglish & English language explanations', included: true },
                { text: '12-Month uninterrupted full access', included: true },
                { text: 'Early access to upcoming AI features', included: true },
                { text: 'Dedicated priority VIP support', included: true },
                { text: '14-Day money-back guarantee', included: true },
              ].map(item => (
                <li key={item.text} className={`flex items-start gap-2.5 text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            id="pricing-cta-scholar"
            onClick={() => onOpenAuthModal('signup')}
            className={`w-full py-3 rounded-xl text-sm font-bold transition cursor-pointer ${isDark ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-black'
              }`}
          >
            Get Scholar Pass
          </button>
        </div>
      </div>
    </div>
  );
}

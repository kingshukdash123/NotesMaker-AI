import CurvyUnderline from './CurvyUnderline';
import BrowserFrame from './BrowserFrame';
import SectionLabel from './SectionLabel';
import FeatureRow from './FeatureRow';

export default function StudyHabitsSection({ isDark, headingClass, subClass }) {
  return (
    <section id="features-section" className="px-4 sm:px-6 pb-20">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="space-y-5">
          <div className="text-center md:text-left">
            <SectionLabel isDark={isDark}>Study Habits &amp; Consistency</SectionLabel>
            <h2 className={`text-2xl sm:text-3xl font-black leading-tight ${headingClass}`}>
              Build a{' '}
              <span className="relative inline-block">
                <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>study habit</span>
                <CurvyUnderline />
              </span>{' '}
              that outlasts motivation
            </h2>
          </div>

          {/* Mobile & Tablet: Image between heading and description */}
          <div className="md:hidden pt-2 pb-1">
            <BrowserFrame
              src="/screenshots/dashboard_analytics.png"
              alt="Pathshala AI Dashboard — Study Progress and Habit Tracker"
              className={isDark ? 'border-zinc-800' : 'border-zinc-200'}
            />
          </div>

          <p className={`text-sm leading-relaxed ${subClass}`}>
            Real learning is built on daily consistency, not last-minute cramming. Track your streaks, monitor your learning pace, and celebrate every single day you showed up to study.
          </p>
          <ul className="space-y-3">
            <FeatureRow isDark={isDark}>Visual study streak calendar to celebrate your daily momentum</FeatureRow>
            <FeatureRow isDark={isDark}>Weekly progress trends showing your learning consistency</FeatureRow>
            <FeatureRow isDark={isDark}>Streak milestones with motivating daily tips from Guruji</FeatureRow>
            <FeatureRow isDark={isDark}>Personalized student dashboard with live study clock &amp; daily targets</FeatureRow>
          </ul>
          <blockquote className={`italic text-sm border-l-2 border-orange-500 pl-4 py-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            &ldquo;Real learning comes when the competitive spirit has ceased.&rdquo;
          </blockquote>
        </div>
        <div className="hidden md:block">
          <BrowserFrame
            src="/screenshots/dashboard_analytics.png"
            alt="Pathshala AI Dashboard — Study Progress and Habit Tracker"
            className={isDark ? 'border-zinc-800' : 'border-zinc-200'}
          />
        </div>
      </div>
    </section>
  );
}

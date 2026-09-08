import CurvyUnderline from './CurvyUnderline';
import BrowserFrame from './BrowserFrame';
import SectionLabel from './SectionLabel';
import FeatureRow from './FeatureRow';

export default function StudyPlannerSection({ isDark, headingClass, subClass }) {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="space-y-5">
          <div className="text-center md:text-left">
            <SectionLabel isDark={isDark}>Daily Study Planner &amp; Schedule</SectionLabel>
            <h2 className={`text-2xl sm:text-3xl font-black leading-tight ${headingClass}`}>
              Plan every day with{' '}
              <span className="relative inline-block">
                <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>clarity &amp; purpose</span>
                <CurvyUnderline />
              </span>
            </h2>
          </div>

          {/* Mobile & Tablet: Image between heading and description */}
          <div className="md:hidden pt-2 pb-1">
            <BrowserFrame
              src="/screenshots/planner.png"
              alt="Pathshala AI Daily Study Planner — Task organization and priority schedule"
              className={isDark ? 'border-zinc-800' : 'border-zinc-200'}
            />
          </div>

          <p className={`text-sm leading-relaxed ${subClass}`}>
            Never wonder what to study next. Set daily targets, prioritize challenging topics with High, Medium, and Low tags, and build steady momentum day after day.
          </p>
          <ul className="space-y-3">
            <FeatureRow isDark={isDark}>Priority-tagged daily study tasks to tackle the most important topics first</FeatureRow>
            <FeatureRow isDark={isDark}>Live study task completion tracker to celebrate your daily productivity</FeatureRow>
            <FeatureRow isDark={isDark}>Visual calendar timeline to organize exam deadlines and revision cycles</FeatureRow>
            <FeatureRow isDark={isDark}>Directly integrates with your lecture notes and video study sessions</FeatureRow>
          </ul>
        </div>

        <div className="hidden md:block">
          <BrowserFrame
            src="/screenshots/planner.png"
            alt="Pathshala AI Daily Study Planner — Task organization and priority schedule"
            className={isDark ? 'border-zinc-800' : 'border-zinc-200'}
          />
        </div>
      </div>
    </section>
  );
}

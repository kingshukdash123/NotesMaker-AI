import CurvyUnderline from './CurvyUnderline';
import BrowserFrame from './BrowserFrame';
import SectionLabel from './SectionLabel';
import FeatureRow from './FeatureRow';

export default function LectureSpaceSection({ isDark, headingClass, subClass }) {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="hidden md:block">
          <BrowserFrame
            src="/screenshots/study_space.png"
            alt="Pathshala AI Study Space — Distraction-free video with real-time study notes"
            className={isDark ? 'border-zinc-700' : 'border-zinc-300'}
          />
        </div>
        <div className="space-y-5">
          <div className="text-center md:text-left">
            <SectionLabel isDark={isDark}>Distraction-Free Lecture Space</SectionLabel>
            <h2 className={`text-2xl sm:text-3xl font-black leading-tight ${headingClass}`}>
              Watch &amp; learn with{' '}
              <span className="relative inline-block">
                <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>zero ads</span>
                <CurvyUnderline />
              </span>,{' '}
              organized notes
            </h2>
          </div>

          {/* Mobile & Tablet: Image between heading and description */}
          <div className="md:hidden pt-2 pb-1">
            <BrowserFrame
              src="/screenshots/study_space.png"
              alt="Pathshala AI Study Space — Distraction-free video with real-time study notes"
              className={isDark ? 'border-zinc-700' : 'border-zinc-300'}
            />
          </div>

          <p className={`text-sm leading-relaxed ${subClass}`}>
            Paste any video lecture link to study in complete peace. Pathshala instantly creates neat, organized notes alongside the video &mdash; complete with important formulas, clear definitions, and clickable chapter timestamps.
          </p>
          <ul className="space-y-3">
            <FeatureRow isDark={isDark}>Interactive note timestamps &mdash; click any point to jump straight to that part of the video</FeatureRow>
            <FeatureRow isDark={isDark}>Important formulas and step-by-step solutions captured automatically</FeatureRow>
            <FeatureRow isDark={isDark}>Download ready-to-print PDF notes with a single click</FeatureRow>
            <FeatureRow isDark={isDark}>No ads, no video rabbit holes, and zero clickbait to steal your focus</FeatureRow>
          </ul>
        </div>
      </div>
    </section>
  );
}

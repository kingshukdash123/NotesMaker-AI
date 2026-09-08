import CurvyUnderline from './CurvyUnderline';
import BrowserFrame from './BrowserFrame';
import SectionLabel from './SectionLabel';
import FeatureRow from './FeatureRow';

export default function PlaylistsSection({ isDark, headingClass, subClass }) {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="hidden md:block">
          <BrowserFrame
            src="/screenshots/library_playlists.png"
            alt="Pathshala AI Library — Playlists with syllabus progress tracking"
            className={isDark ? 'border-zinc-700' : 'border-zinc-300'}
          />
        </div>
        <div className="space-y-5">
          <div className="text-center md:text-left">
            <SectionLabel isDark={isDark}>Subject Playlists &amp; Video Library</SectionLabel>
            <h2 className={`text-2xl sm:text-3xl font-black leading-tight ${headingClass}`}>
              Organize your entire{' '}
              <span className="relative inline-block">
                <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>syllabus</span>
                <CurvyUnderline />
              </span>
              {' '}into playlists
            </h2>
          </div>

          {/* Mobile & Tablet: Image between heading and description */}
          <div className="md:hidden pt-2 pb-1">
            <BrowserFrame
              src="/screenshots/library_playlists.png"
              alt="Pathshala AI Library — Playlists with syllabus progress tracking"
              className={isDark ? 'border-zinc-700' : 'border-zinc-300'}
            />
          </div>

          <p className={`text-sm leading-relaxed ${subClass}`}>
            Group related lecture videos into structured subject playlists, mark lectures as completed as you study, and keep your entire semester syllabus organized in one focused space.
          </p>
          <ul className="space-y-3">
            <FeatureRow isDark={isDark}>Custom subject playlists for JEE, NEET, University, Boards &amp; Competitive Exams</FeatureRow>
            <FeatureRow isDark={isDark}>Track watched videos and syllabus completion percentages at a glance</FeatureRow>
            <FeatureRow isDark={isDark}>Save entire video series from YouTube with zero distractions or algorithms</FeatureRow>
            <FeatureRow isDark={isDark}>Instant access to your lecture notes &amp; formulas linked directly to each playlist</FeatureRow>
          </ul>
        </div>
      </div>
    </section>
  );
}

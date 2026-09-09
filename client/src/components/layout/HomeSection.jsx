import { useTheme } from '../../context/ThemeContext';
import {
  HeroSection,
  StudyHabitsSection,
  LectureSpaceSection,
  GurujiMentorSection,
  PlaylistsSection,
  StudyPlannerSection,
  ComparisonSection,
  PricingSection,
  SupportBannerSection,
  FaqSection,
  FinalCtaSection,
} from '../home';

export default function HomeSection({ onOpenAuthModal }) {
  const { isDark } = useTheme();

  const headingClass = isDark ? 'text-zinc-50' : 'text-zinc-900';
  const subClass = isDark ? 'text-zinc-400' : 'text-zinc-600';

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* HERO SECTION */}
      <HeroSection
        isDark={isDark}
        onOpenAuthModal={onOpenAuthModal}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* STUDY HABITS & CONSISTENCY */}
      <div id="features" className="scroll-mt-24">
        <StudyHabitsSection
          isDark={isDark}
          headingClass={headingClass}
          subClass={subClass}
        />
      </div>

      {/* DISTRACTION-FREE LECTURE SPACE */}
      <LectureSpaceSection
        isDark={isDark}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* GURUJI ACADEMIC MENTOR */}
      <div id="mentor" className="scroll-mt-24">
        <GurujiMentorSection
          isDark={isDark}
          headingClass={headingClass}
          subClass={subClass}
        />
      </div>

      {/* SUBJECT PLAYLISTS & VIDEO LIBRARY */}
      <div id="library" className="scroll-mt-24">
        <PlaylistsSection
          isDark={isDark}
          headingClass={headingClass}
          subClass={subClass}
        />
      </div>

      {/* DAILY STUDY PLANNER & SCHEDULE */}
      <div id="planner" className="scroll-mt-24">
        <StudyPlannerSection
          isDark={isDark}
          headingClass={headingClass}
          subClass={subClass}
        />
      </div>

      {/* PRICING & VALUE */}
      <section id="pricing" className="px-4 sm:px-6 pb-20 space-y-16 scroll-mt-24">
        <ComparisonSection
          isDark={isDark}
          headingClass={headingClass}
          subClass={subClass}
        />

        <PricingSection
          isDark={isDark}
          onOpenAuthModal={onOpenAuthModal}
          headingClass={headingClass}
          subClass={subClass}
        />
      </section>

      {/* CONTACT & SUPPORT BANNER */}
      <div id="support" className="scroll-mt-24">
        <SupportBannerSection
          isDark={isDark}
          headingClass={headingClass}
          subClass={subClass}
        />
      </div>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <div id="faq" className="scroll-mt-24">
        <FaqSection
          isDark={isDark}
          headingClass={headingClass}
        />
      </div>

      {/* FINAL CTA */}
      <FinalCtaSection
        isDark={isDark}
        onOpenAuthModal={onOpenAuthModal}
        headingClass={headingClass}
        subClass={subClass}
      />
    </div>
  );
}

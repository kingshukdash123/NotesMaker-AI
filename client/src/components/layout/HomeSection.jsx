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
      <StudyHabitsSection
        isDark={isDark}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* DISTRACTION-FREE LECTURE SPACE */}
      <LectureSpaceSection
        isDark={isDark}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* GURUJI ACADEMIC MENTOR */}
      <GurujiMentorSection
        isDark={isDark}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* SUBJECT PLAYLISTS & VIDEO LIBRARY */}
      <PlaylistsSection
        isDark={isDark}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* DAILY STUDY PLANNER & SCHEDULE */}
      <StudyPlannerSection
        isDark={isDark}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* PRICING & VALUE */}
      <section className="px-4 sm:px-6 pb-20 space-y-16">
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
      <SupportBannerSection
        isDark={isDark}
        headingClass={headingClass}
        subClass={subClass}
      />

      {/* FREQUENTLY ASKED QUESTIONS */}
      <FaqSection
        isDark={isDark}
        headingClass={headingClass}
      />

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

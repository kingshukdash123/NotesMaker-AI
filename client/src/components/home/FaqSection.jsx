import CurvyUnderline from './CurvyUnderline';
import SectionLabel from './SectionLabel';
import FaqItem from './FaqItem';

export default function FaqSection({ isDark, headingClass }) {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="w-full">
        <div className="text-center mb-10 space-y-3">
          <SectionLabel isDark={isDark}>Got Questions?</SectionLabel>
          <h2 className={`text-2xl sm:text-3xl font-black ${headingClass}`}>
            Frequently Asked{' '}
            <span className="relative inline-block">
              <span className={isDark ? 'text-orange-400' : 'text-orange-500'}>Questions</span>
              <CurvyUnderline />
            </span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-5 items-start">
          <div className="space-y-4">
            <FaqItem
              isDark={isDark}
              q="Does Pathshala AI work with any video lecture?"
              a="Yes. Simply paste any video lecture link into your study space. Pathshala AI creates neat, structured notes from the class audio and allows Guruji to explain concepts and answer your questions directly from that lecture."
            />
            <FaqItem
              isDark={isDark}
              q="How accurate are the extracted formulas and math equations?"
              a="Extremely accurate. We precisely capture complex scientific equations, symbols, and formulas across physics, chemistry, and mathematics so you can revise with complete confidence without textbook hunting."
            />
            <FaqItem
              isDark={isDark}
              q="Can Guruji understand what I'm currently watching?"
              a="Yes. Guruji actively follows along with your lecture and notes. When you have a doubt, it gives you direct, relevant answers based on what your teacher just explained, rather than generic web search results."
            />
          </div>
          <div className="space-y-4">
            <FaqItem
              isDark={isDark}
              q="What happens after my 7-day free trial ends?"
              a="You can choose a plan that fits your study needs. Your notes, playlists, and study progress are always safely preserved so you never lose your hard work."
            />
            <FaqItem
              isDark={isDark}
              q="Can I cancel my subscription anytime?"
              a="Yes, anytime with one click from your settings. No lock-in contracts, no questions asked. We also provide a full 14-day money-back guarantee."
            />
            <FaqItem
              isDark={isDark}
              q="How do I contact customer support if I need help?"
              a="You can reach us directly anytime at support@pathshalaai.co.in. Our dedicated team is based in India and responds quickly in less than 2–4 hours to help you with your studies."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

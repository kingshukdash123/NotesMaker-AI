import { Headphones, Mail } from 'lucide-react';
import { SUPPORT_EMAIL } from '../../constants/companyConstants';

export default function SupportBannerSection({ isDark, headingClass, subClass }) {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className={`rounded-3xl border p-7 sm:p-9 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 transition-all duration-300 ${isDark
          ? 'bg-zinc-950 border-zinc-800/80 shadow-xl shadow-orange-500/5'
          : 'bg-white border-zinc-200/90 shadow-sm'
        }`}>
        <div className="flex flex-col sm:flex-row items-center md:items-start gap-5 text-center md:text-left">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDark
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25 shadow-md shadow-orange-500/5'
              : 'bg-orange-50 text-orange-600 border border-orange-200/80 shadow-xs'
            }`}>
            <Headphones className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                Direct Student Support
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                &lt; 2-4h response
              </span>
            </div>
            <h3 className={`text-lg sm:text-xl font-bold ${headingClass}`}>
              Have questions before starting?
            </h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${subClass}`}>
              Our friendly academic support team is ready to help you with study plans, billing, or features.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Pathshala%20AI%20Support`}
            id="home-contact-email"
            className="hero-rotating-border-btn group w-full md:w-auto"
          >
            <div className="rotating-beam" />
            <div className="inner-content py-1">
              <Mail className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">{SUPPORT_EMAIL}</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

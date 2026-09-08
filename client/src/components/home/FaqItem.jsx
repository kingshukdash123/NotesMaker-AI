import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FaqItem({ q, a, isDark }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${open
          ? isDark
            ? 'border-orange-500/60 bg-zinc-950 shadow-md shadow-orange-500/5'
            : 'border-orange-300 bg-orange-50 shadow-sm'
          : isDark
            ? 'border-zinc-800/80 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900 shadow-xs'
            : 'border-zinc-200/80 bg-white hover:border-zinc-300 shadow-xs hover:shadow-sm'
        }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer transition-colors ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}
      >
        <span className="text-sm sm:text-base font-bold">{q}</span>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${open
            ? isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-100 text-orange-600'
            : isDark ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
          }`}>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180 text-orange-500' : ''}`} />
        </div>
      </button>
      {open && (
        <div className={`px-6 pb-5 text-sm leading-relaxed border-t ${isDark ? 'border-zinc-900/80 text-zinc-400' : 'border-zinc-100 text-zinc-600'}`}>
          <div className="pt-4">{a}</div>
        </div>
      )}
    </div>
  );
}

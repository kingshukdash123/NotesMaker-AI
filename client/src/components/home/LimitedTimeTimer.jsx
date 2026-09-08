import { useState, useEffect } from 'react';

export default function LimitedTimeTimer({ isDark }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 58, seconds: 51 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 4, minutes: 58, seconds: 51 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2 = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center justify-center pt-3 pb-2">
      <div className={`inline-flex flex-wrap items-center justify-center gap-3 sm:gap-5 px-5 sm:px-8 py-3 sm:py-3.5 rounded-full border-2 shadow-2xl transition-all ${
        isDark 
          ? 'bg-zinc-950 border-orange-500/70 text-zinc-100 shadow-orange-500/15' 
          : 'bg-white border-orange-400 text-zinc-900 shadow-orange-500/15'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500"></span>
          </span>
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-orange-600 dark:text-orange-400">
            Limited Time Deal
          </span>
        </div>

        <span className={`hidden sm:inline font-bold ${isDark ? 'text-zinc-700' : 'text-orange-200'}`}>|</span>

        <div className="flex items-center gap-2.5">
          <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Ends in:
          </span>
          <div className="flex items-center gap-1.5 font-mono font-black text-sm sm:text-base md:text-lg">
            <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-bold shadow-xs ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              {format2(timeLeft.hours)}h
            </span>
            <span className="text-orange-500 font-black animate-pulse">:</span>
            <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-bold shadow-xs ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              {format2(timeLeft.minutes)}m
            </span>
            <span className="text-orange-500 font-black animate-pulse">:</span>
            <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-bold shadow-xs ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              {format2(timeLeft.seconds)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

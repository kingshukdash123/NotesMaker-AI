import React from 'react';
import BrandLogo from './BrandLogo';

/**
 * AppLoadingScreen - Clean, minimalist brand loading screen.
 * Displays the solid full brand logo with a smooth horizontal progress bar below it.
 */
export default function AppLoadingScreen({ isDark = true }) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 select-none ${
        isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-white text-zinc-900'
      }`}
      aria-label="Loading Pathshala AI"
      role="status"
    >
      {/* Solid Brand Logo (Clean & Steady, No Blinking) */}
      <div className="flex items-center justify-center">
        <BrandLogo
          variant="full"
          alt="Pathshala AI"
          width={171}
          height={32}
          className="h-8 w-[171px] max-w-[80vw] object-contain shrink-0"
        />
      </div>

      {/* Minimalist Horizontal Progress Bar */}
      <div
        className={`relative w-32 h-[3px] rounded-full overflow-hidden ${
          isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'
        }`}
        aria-hidden="true"
      >
        <div
          className={`absolute top-0 bottom-0 w-[45%] rounded-full ${
            isDark ? 'bg-[#f4f4f5]' : 'bg-[#09090b]'
          }`}
          style={{
            animation: 'preloaderSlide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            willChange: 'transform'
          }}
        />
      </div>

      <style>{`
        @keyframes preloaderSlide {
          0% { left: -45%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

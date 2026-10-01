import React from 'react';

export default function AppLoadingScreen({ isDark = true }) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center select-none transition-colors duration-200 ${
        isDark ? 'bg-black text-zinc-100' : 'bg-white text-zinc-900'
      }`}
      aria-label="Loading"
      role="status"
    >
      <div
        className={`w-5 h-5 border-2 rounded-full animate-spin ${
          isDark
            ? 'border-zinc-800 border-t-zinc-200'
            : 'border-zinc-200 border-t-zinc-800'
        }`}
        aria-hidden="true"
      />
    </div>
  );
}

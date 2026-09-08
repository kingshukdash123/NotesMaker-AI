import { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CONCISE_STEPS = [
  "► Downloading video audio & transcripts...",
  "► Partitioning video sections & syllabus...",
  "► Generating notes & summary dashboard...",
  "► Creating embeddings & indexing Pinecone...",
  "► Compiling interactive study workspace..."
];

export default function LoadingModal({ 
  isOpen,
  inline = false
}) {
  const { isDark } = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < CONCISE_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const renderCard = (bgClass, shadowClass, borderClass, paddingClass = "p-6") => {
    const defaultBg = bgClass || (isDark ? "bg-zinc-950/90 backdrop-blur-sm" : "bg-white");
    const defaultBorder = borderClass || (isDark ? "border-zinc-800" : "border-zinc-200");
    const defaultShadow = shadowClass || (isDark ? "shadow-2xl" : "shadow-xl");

    return (
      <div className={`w-full border ${defaultBorder} ${defaultBg} rounded-2xl ${paddingClass} ${defaultShadow} relative overflow-hidden flex flex-col items-center justify-center`}>
        {/* Premium Circular Spinner Area */}
        <div className="flex flex-col items-center justify-center py-4 text-center space-y-6 w-full">
          <div className="relative flex items-center justify-center">
            {/* Outer spinning gradient ring */}
            <div className="w-16 h-16 rounded-full border-[3px] border-orange-500/15 border-t-orange-500 border-r-orange-500 animate-spin"></div>
            {/* Inner pulsing orange circle */}
            <div className="absolute w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center animate-pulse">
              <Cpu className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className={`text-xs font-black flex items-center justify-center gap-2 tracking-wide uppercase ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              AI Synthesis Active
            </h3>
            <p className={`text-[10px] max-w-[250px] mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Structuring lecture chapters, indexing transcript vectors, and formatting study notes.
            </p>
          </div>

          {/* Clean Progress Tracker */}
          <div className={`w-full max-w-xs border rounded-xl p-3.5 space-y-2.5 ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'}`}>
            <div className={`flex items-center justify-between text-[9px] font-bold tracking-wider uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              <span>SYNTHESIS PROGRESS</span>
              <span className="text-orange-500 font-mono font-bold">{Math.round((currentStepIndex + 1) * 20)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-200 border-zinc-200'}`}>
              <div 
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500 rounded-full"
                style={{ width: `${(currentStepIndex + 1) * 20}%` }}
              />
            </div>

            <div className={`text-[9px] font-mono font-semibold tracking-tight text-center animate-pulse py-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {CONCISE_STEPS[currentStepIndex]}
            </div>
          </div>
        </div>

        {/* Bottom warning */}
        <p className={`text-[9px] font-bold tracking-wider text-center uppercase tracking-widest animate-pulse mt-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Please keep this workspace tab open.
        </p>
      </div>
    );
  };

  if (inline) {
    return <div className="mt-4 animate-fadeIn">{renderCard(isDark ? "bg-zinc-950/20" : "bg-white", "shadow-xs", isDark ? "border-zinc-900" : "border-zinc-200", "p-5")}</div>;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="max-w-sm w-full mx-4 relative z-10">
        {renderCard(isDark ? "bg-zinc-950/90 backdrop-blur-sm" : "bg-white", "shadow-2xl", isDark ? "border-zinc-800" : "border-zinc-200", "p-6")}
      </div>
    </div>
  );
}

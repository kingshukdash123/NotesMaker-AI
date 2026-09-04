import { AlertCircle, RefreshCw, ArrowRight, Radio, Cpu } from 'lucide-react';
import VideoProcessingSkeleton from './VideoProcessingSkeleton';
import { useTheme } from '../../context/ThemeContext';

export default function ProcessingGate({
  status = 'IDLE',
  error = '',
  onProcess,
  activeTab = 'notes',
  metadata = null,
  videoDuration = null
}) {
  const { isDark } = useTheme();

  const toolConfig = {
    notes: {
      title: 'Process Video to Generate Notes',
      description: 'Generate structured AI study notes with formulas, key concepts, and code highlights.',
      buttonLabel: 'Generate Study Notes',
    },
    summary: {
      title: 'Process Video to Generate Summary',
      description: 'Generate key takeaways, core learning objectives, and structured lecture outlines.',
      buttonLabel: 'Generate Summary',
    },
    qa: {
      title: 'Process Video to Enable Q&A',
      description: 'Index the video transcript to ask questions and chat with the AI video companion.',
      buttonLabel: 'Enable Video Q&A',
    },
  };

  const currentTool = toolConfig[activeTab] || toolConfig.notes;

  // Safeguard: Block ongoing live streams
  if (metadata?.is_live) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-2xl py-14 gap-4 animate-in fade-in duration-300 max-w-md w-full mx-auto transition ${
        isDark ? 'bg-zinc-950/20 border-zinc-900' : 'bg-orange-50/40 border-orange-100'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isDark ? 'bg-zinc-900 text-red-400' : 'bg-red-50 text-red-500'
        }`}>
          <Radio className="w-5 h-5 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
            Live stream in progress
          </h3>
          <p className={`text-[10px] sm:text-xs max-w-xs mx-auto leading-relaxed ${
            isDark ? 'text-zinc-550' : 'text-orange-900/60'
          }`}>
            Notes, summaries, and transcripts can only be generated once this livestream has concluded and is archived by YouTube.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'PROCESSING' || status === 'CHECKING_CACHE') {
    return (
      <div className="w-full h-full">
        <VideoProcessingSkeleton
          activeTab={activeTab}
          metadata={metadata}
          videoDuration={videoDuration}
          isCheckingCache={status === 'CHECKING_CACHE'}
        />
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-2xl py-14 gap-4 animate-in fade-in duration-300 max-w-md w-full mx-auto transition ${
        isDark ? 'bg-zinc-950/20 border-zinc-900' : 'bg-orange-50/40 border-orange-100'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isDark ? 'bg-zinc-900 text-red-400' : 'bg-red-50 text-red-500'
        }`}>
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
            Processing failed
          </h3>
          <p className="text-[10px] sm:text-xs text-red-400 max-w-xs mx-auto leading-relaxed">
            {error || 'An error occurred while processing this video. Please try again.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onProcess}
          className="btn-danger-subtle px-4 py-2 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Processing</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-2xl py-14 gap-4 animate-in fade-in duration-300 max-w-md w-full mx-auto transition ${
      isDark ? 'bg-zinc-950/20 border-zinc-900' : 'bg-orange-50/40 border-orange-100'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        isDark ? 'bg-zinc-900 text-orange-400' : 'bg-orange-100 text-orange-600'
      }`}>
        <Cpu className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
          {currentTool.title}
        </h3>
        <p className={`text-[10px] sm:text-xs max-w-xs mx-auto leading-relaxed ${
          isDark ? 'text-zinc-550' : 'text-orange-900/60'
        }`}>
          {currentTool.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onProcess}
        className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2"
      >
        <span>{currentTool.buttonLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
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
      <div className="border border-red-950/40 bg-red-950/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-4 py-10 max-w-md w-full mx-auto">
        <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-900/40 flex items-center justify-center text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-red-200">Processing failed</h3>
          <p className="text-xs text-red-400 leading-relaxed">
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
    <div className={`border rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-4 py-8 sm:py-10 max-w-md w-full mx-auto transition ${
      isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-orange-200 shadow-xs'
    }`}>
      <div className="space-y-1.5 text-center">
        <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
          isDark ? 'text-zinc-100' : 'text-orange-950'
        }`}>
          {currentTool.title}
        </h3>
        <p className={`text-xs max-w-xs mx-auto leading-relaxed ${
          isDark ? 'text-zinc-400' : 'text-orange-900/70'
        }`}>
          {currentTool.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onProcess}
        className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
      >
        <span>{currentTool.buttonLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

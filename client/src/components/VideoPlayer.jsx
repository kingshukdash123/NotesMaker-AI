import { useState, useEffect, useRef } from 'react';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Tabs from './Tabs';

export default function VideoPlayer({ 
  videoId, 
  videoUrl,
  metadata, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  isSaved, 
  onToggleSave, 
  isCheckingSaved, 
  hasNotes = false, 
  onBack, 
  isFullscreen = false,
  isVideoCollapsed = false,
  setIsVideoCollapsed
}) {
  const { isDark } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleSeek = (event) => {
      const seconds = event.detail?.seconds;
      if (typeof seconds === 'number' && iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        } catch (err) {
          console.warn('Failed to postMessage to YouTube iframe:', err);
        }
      }
    };

    window.addEventListener('seek-video', handleSeek);
    return () => {
      window.removeEventListener('seek-video', handleSeek);
    };
  }, []);

  if (!videoId) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl glass-panel min-h-[300px] border ${
        isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-orange-200/80'
      }`}>
        <PlayCircle className={`w-12 h-12 mb-3 animate-pulse ${isDark ? 'text-zinc-600' : 'text-orange-300'}`} />
        <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-orange-950'}`}>No video tutorial loaded</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0`;

  return (
    <div className={`flex flex-col min-h-0 border rounded-xl shadow-2xl glass-panel animate-in fade-in duration-300 ${
      isVideoCollapsed 
        ? 'overflow-visible w-full lg:w-14 lg:h-full lg:items-center lg:py-2.5 z-40' 
        : 'overflow-hidden w-full'
    } ${
      isDark ? 'bg-zinc-950/95 lg:bg-zinc-950/40 border-zinc-900 backdrop-blur-md' : 'bg-white/95 lg:bg-white border-orange-200/80 backdrop-blur-md'
    }`}>
      {/* Player Header with Back Button and Title */}
      <div className={`shrink-0 flex items-center justify-between px-3 py-2 border-b w-full ${
        isVideoCollapsed ? 'lg:px-0 lg:py-0 lg:border-b-0 lg:justify-center lg:mb-2' : ''
      } ${
        isDark ? 'bg-zinc-900/50 border-zinc-900' : 'bg-orange-50/50 border-orange-100'
      }`}>
        <div className={`flex items-center ${isVideoCollapsed ? 'lg:justify-center' : 'gap-2.5'}`}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-icon"
              title="Back to Discover"
              aria-label="Back to Discover"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className={`text-xs sm:text-sm font-bold ${isVideoCollapsed ? 'lg:hidden' : ''} ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
            Watch & Learn
          </h3>
        </div>
      </div>

      {/* Video Embed IFrame */}
      <div className={`relative w-full aspect-video bg-black video-player-surface shrink-0 border-b overflow-hidden transition-all duration-300 ${
        isVideoCollapsed ? 'hidden' : 'block'
      } ${
        isDark ? 'border-zinc-900' : 'border-orange-100'
      }`}>
        {!isLoaded && (
          <div className="absolute inset-0 skeleton-shimmer bg-zinc-900/90 z-10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-950/80 border border-zinc-800 flex items-center justify-center shadow-lg">
              <PlayCircle className="w-6 h-6 text-orange-500/70" />
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={metadata?.title || 'YouTube video player'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          className="w-full h-full"
        />
      </div>

      {/* Study Tools & Actions Tabs Bar */}
      <div className={`shrink-0 ${isVideoCollapsed ? 'px-3 py-2 lg:p-0 w-full lg:w-auto' : 'px-4 py-3 sm:py-3.5'} bg-transparent`}>
        <Tabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={currentUser}
          videoId={videoId}
          videoUrl={videoUrl}
          metadata={metadata}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          isCheckingSaved={isCheckingSaved}
          hasNotes={hasNotes}
          isVideoCollapsed={isVideoCollapsed}
          isVertical={isVideoCollapsed}
          onToggleCollapseVideo={() => setIsVideoCollapsed?.(!isVideoCollapsed)}
        />
      </div>
    </div>
  );
}

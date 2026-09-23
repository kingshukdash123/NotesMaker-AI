import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useVideoProcessor } from '../hooks/useVideoProcessor';
import { isVideoSaved, saveVideoToLibrary, removeVideoFromLibrary } from '../services/firebase/libraryService';
import { useTheme } from '../context/ThemeContext';

// Components
import ProcessingGate from '../components/video/ProcessingGate';
import VideoPlayer from '../components/VideoPlayer';
import NotesViewer from '../components/NotesViewer';
import SummaryOverview from '../components/SummaryOverview';
import VideoQa from '../components/VideoQa';


export default function VideoContentPage() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const { 
    activeVideoId,
    activeVideoUrl,
    activeVideoMetadata,
    activeVideoNoteResult,
    videoTab: activeTab,
    setVideoTab: setActiveTab,
    resetActiveVideo,
    isVideoFullscreen,
    setIsVideoFullscreen,
    isVideoCollapsed,
    setIsVideoCollapsed
  } = useApp();

  const { processStatus, processError, processVideo } = useVideoProcessor();
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset fullscreen state when leaving the video page
  useEffect(() => {
    return () => {
      setIsVideoFullscreen(false);
    };
  }, [setIsVideoFullscreen]);

  const handleToggleFullscreen = () => {
    setIsVideoFullscreen(prev => !prev);
  };

  // Check if video is saved in library
  useEffect(() => {
    if (!currentUser || !activeVideoId) return;

    const checkSavedStatus = async () => {
      setIsCheckingSaved(true);
      try {
        const saved = await isVideoSaved(currentUser.uid, activeVideoId);
        setIsSaved(saved);
      } catch (err) {
        console.error('Error checking saved status:', err);
      } finally {
        setIsCheckingSaved(false);
      }
    };

    checkSavedStatus();
  }, [activeVideoId, currentUser]);

  const handleToggleSave = async () => {
    if (!currentUser || !activeVideoId || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await removeVideoFromLibrary(currentUser.uid, activeVideoId);
        setIsSaved(false);
      } else {
        await saveVideoToLibrary(
          currentUser.uid, 
          activeVideoId, 
          activeVideoUrl || `https://www.youtube.com/watch?v=${activeVideoId}`, 
          activeVideoMetadata
        );
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasNotes = processStatus === 'COMPLETED';

  return (
    <div className={`flex-1 flex flex-col ${
      activeTab === 'qa' 
        ? 'overflow-hidden h-full pb-2 sm:pb-3 md:pb-6' 
        : 'overflow-y-auto md:overflow-hidden h-full pb-3 sm:pb-5 md:pb-0'
    } w-full custom-scrollbar pt-0 px-0 ${
      isVideoFullscreen ? 'md:p-4' : 'md:p-4 lg:p-6'
    }`}>
      {/* Main Grid: Player on left, Workspace tools on right */}
      <div className={`flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-4 lg:gap-6 min-w-0 min-h-0 ${
        activeTab === 'qa' ? 'h-full overflow-hidden' : 'md:min-h-0 md:overflow-hidden'
      }`}>
        {/* Left Side: Video Player with Tools (Adaptive Desktop Width & Mobile Sticky Header) */}
        <div className={`flex flex-col shrink-0 min-h-0 sticky top-0 z-30 md:static transition-all duration-300 ${
          isVideoCollapsed 
            ? 'w-full md:w-auto pt-2 pb-1.5 px-3 sm:pt-3 sm:pb-2 md:p-0 overflow-visible' 
            : 'w-full md:w-[48%] lg:w-[45%] xl:w-[42%] pt-2 pb-1.5 px-3 sm:pt-3 sm:pb-2 md:p-0'
        } ${
          isDark ? 'bg-black' : 'bg-white'
        }`}>
          <VideoPlayer 
            videoId={activeVideoId} 
            videoUrl={activeVideoUrl}
            metadata={activeVideoMetadata} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            isSaved={isSaved}
            onToggleSave={handleToggleSave}
            isCheckingSaved={isCheckingSaved || isSaving}
            hasNotes={hasNotes}
            onBack={resetActiveVideo}
            isFullscreen={isVideoFullscreen}
            onToggleFullscreen={() => handleToggleFullscreen(!isVideoFullscreen)}
            isVideoCollapsed={isVideoCollapsed}
            setIsVideoCollapsed={setIsVideoCollapsed}
          />
        </div>

        {/* Right Side: Workspace Content Pane */}
        <div className={`flex-1 min-w-0 flex flex-col h-full min-h-0 rounded-2xl relative border overflow-hidden mx-3 sm:mx-5 md:mx-0 ${
          isDark ? 'bg-zinc-950/20 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
        }`}>
          {hasNotes ? (
            /* Tools Dashboard Workspace */
            <div className={`flex-1 min-w-0 min-h-0 ${
              activeTab === 'qa' 
                ? 'flex flex-col h-full overflow-hidden p-0' 
                : 'overflow-y-auto custom-scrollbar p-3 sm:p-5'
            }`}>
              {activeTab === 'notes' && (
                <NotesViewer 
                  result={activeVideoNoteResult} 
                />
              )}
              {activeTab === 'summary' && (
                <SummaryOverview 
                  result={activeVideoNoteResult} 
                />
              )}
              {activeTab === 'qa' && (
                <VideoQa 
                  videoId={activeVideoId} 
                  currentUser={currentUser} 
                />
              )}
            </div>
          ) : (
            /* Process Video Access Gate / Skeleton Loader */
            <div className={`flex-1 min-w-0 min-h-0 flex ${
              processStatus === 'PROCESSING' || processStatus === 'CHECKING_CACHE'
                ? 'h-full overflow-y-auto custom-scrollbar p-2 sm:p-4'
                : 'items-center justify-center p-4 sm:p-6 min-h-[300px]'
            }`}>
              <ProcessingGate
                status={processStatus}
                error={processError}
                onProcess={() => processVideo()}
                activeTab={activeTab}
                metadata={activeVideoMetadata}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

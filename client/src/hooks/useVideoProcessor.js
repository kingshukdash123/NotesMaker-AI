import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { startNoteGeneration, getTaskStatus } from '../services/server/api';
import { saveNotes, getNoteByVideoId } from '../services/firebase/notesService';
import { useWatchHistory } from './useWatchHistory';

export function useVideoProcessor() {
  const { currentUser } = useAuth();
  const {
    activeVideoId,
    activeVideoUrl,
    activeVideoMetadata,
    setActiveVideoNoteResult,
    setActiveVideoNoteId,
    videoProcessStatus,
    setVideoProcessStatus,
    videoProcessError,
    setVideoProcessError,
    videoPipelineTaskId,
    setVideoPipelineTaskId,
    setProcessedVideoIds
  } = useApp();

  const { logWatchHistory } = useWatchHistory();
  const pollIntervalRef = useRef(null);
  const loggedVideoIdRef = useRef(null);

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Check if notes already exist in Firestore when activeVideoId changes
  useEffect(() => {
    if (!activeVideoId) {
      loggedVideoIdRef.current = null;
      return;
    }
    if (!currentUser) return;

    // Prevent duplicate calls on simultaneous mounts/Strict Mode triggers
    if (loggedVideoIdRef.current === activeVideoId) return;
    loggedVideoIdRef.current = activeVideoId;

    const checkExistingNotes = async () => {
      setVideoProcessStatus('CHECKING_CACHE');
      setVideoProcessError(null);
      try {
        const existingNote = await getNoteByVideoId(currentUser.uid, activeVideoId);
        if (existingNote) {
          setActiveVideoNoteResult(existingNote.result);
          setActiveVideoNoteId(existingNote.id);
          setVideoProcessStatus('COMPLETED');
          
          // Log to watch history as processed
          logWatchHistory(activeVideoId, activeVideoUrl, activeVideoMetadata, true);
        } else {
          setActiveVideoNoteResult(null);
          setActiveVideoNoteId(null);
          setVideoProcessStatus('IDLE');
          
          // Log to watch history as NOT processed yet
          logWatchHistory(activeVideoId, activeVideoUrl, activeVideoMetadata, false);
        }
      } catch (err) {
        console.error('Error checking existing notes cache:', err);
        setVideoProcessStatus('IDLE');
        
        // Log to watch history as NOT processed yet
        logWatchHistory(activeVideoId, activeVideoUrl, activeVideoMetadata, false);
      }
    };

    checkExistingNotes();
  }, [activeVideoId, currentUser, activeVideoUrl, activeVideoMetadata, logWatchHistory, setActiveVideoNoteId, setActiveVideoNoteResult, setVideoProcessError, setVideoProcessStatus]);

  const processVideo = async (targetUrl = activeVideoUrl, metadata = activeVideoMetadata) => {
    if (!currentUser) return;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    setVideoProcessStatus('PROCESSING');
    setVideoProcessError(null);
    setActiveVideoNoteResult(null);

    try {
      const idToken = await currentUser.getIdToken();
      const response = await startNoteGeneration(targetUrl, currentUser.uid, idToken);
      const taskId = response.task_id;
      setVideoPipelineTaskId(taskId);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await getTaskStatus(taskId);

          if (statusData.status === 'COMPLETED') {
            clearInterval(pollIntervalRef.current);
            const activeMetadata = statusData.metadata || metadata || {};
            setActiveVideoNoteResult(statusData.result);
            setVideoProcessStatus('COMPLETED');

            // Save to Firestore notes history
            try {
              const noteId = await saveNotes(currentUser.uid, targetUrl, activeMetadata, statusData.result);
              setActiveVideoNoteId(noteId);
              
              // Add to global processed set
              setProcessedVideoIds(prev => {
                const next = new Set(prev);
                next.add(activeVideoId);
                return next;
              });
              
              // Update watch history timestamp
              logWatchHistory(activeVideoId, targetUrl, activeMetadata);
            } catch (saveErr) {
              console.error('Error saving generated notes:', saveErr);
            }
          } else if (statusData.status === 'FAILED') {
            clearInterval(pollIntervalRef.current);
            setVideoProcessStatus('FAILED');
            setVideoProcessError(statusData.error || 'Notes generation failed.');
          }
        } catch (pollErr) {
          console.error('Error polling note generation status:', pollErr);
        }
      }, 2000);

    } catch (err) {
      setVideoProcessStatus('FAILED');
      setVideoProcessError(err.message || 'Failed to dispatch note generation task');
    }
  };

  return {
    processStatus: videoProcessStatus,
    processError: videoProcessError,
    pipelineTaskId: videoPipelineTaskId,
    processVideo
  };
}

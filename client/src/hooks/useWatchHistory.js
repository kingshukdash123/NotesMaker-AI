import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  logVideoOpen, 
  getUserWatchHistory, 
  deleteHistoryItem, 
  clearUserHistory 
} from '../services/firebase/historyService';

export function useWatchHistory() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const logWatchHistory = useCallback(async (videoId, videoUrl, metadata, notesGenerated = false) => {
    if (!currentUser || !videoId) return;
    await logVideoOpen(currentUser.uid, videoId, videoUrl, metadata, notesGenerated);
  }, [currentUser]);

  const fetchHistory = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const data = await getUserWatchHistory(currentUser.uid);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load watch history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const deleteItem = useCallback(async (historyId) => {
    if (!currentUser) return;
    try {
      await deleteHistoryItem(currentUser.uid, historyId);
      setHistory(prev => prev.filter(item => item.id !== historyId));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  }, [currentUser]);

  const clearAll = useCallback(async () => {
    if (!currentUser) return;
    try {
      await clearUserHistory(currentUser.uid);
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear watch history:', err);
    }
  }, [currentUser]);

  return {
    history,
    isLoading,
    logWatchHistory,
    fetchHistory,
    deleteItem,
    clearAll
  };
}

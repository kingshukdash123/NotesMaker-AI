import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveAssistantThread,
  getAssistantThreads,
  deleteAssistantThread,
  saveAssistantMessages,
  getAssistantMessages
} from '../services/firebase/assistantService';
import { streamAssistantChat } from '../services/server/assistantApi';

export function useAssistantChat(currentUser) {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState(null);

  const activeThreadIdRef = useRef(activeThreadId);

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  // Load threads on mount / auth change
  const loadThreads = useCallback(async () => {
    if (!currentUser) {
      setThreads([]);
      setActiveThreadId(null);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const data = await getAssistantThreads(currentUser.uid);
      setThreads(data);
      if (data.length > 0) {
        // Auto-select latest updated thread
        setActiveThreadId(data[0].threadId);
      }
    } catch (err) {
      console.error('Failed to load assistant threads:', err);
      setError('Could not load conversation history.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Load messages when activeThreadId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser || !activeThreadId) {
        setMessages([]);
        setSummary('');
        return;
      }
      setIsLoadingHistory(true);
      try {
        const data = await getAssistantMessages(currentUser.uid, activeThreadId);
        // Only update if the user hasn't switched threads in the meantime
        if (activeThreadIdRef.current === activeThreadId) {
          setMessages(data.messages);
          setSummary(data.summary);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Could not load messages.');
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadMessages();
  }, [currentUser, activeThreadId]);

  // Create new thread
  const createNewThread = useCallback(async (customTitle) => {
    if (!currentUser) return null;
    setIsLoading(true);
    const newThreadId = Math.random().toString(36).substring(2, 15);
    const newThread = {
      threadId: newThreadId,
      title: customTitle || 'New Chat',
      lastMessage: '',
      createdAt: new Date(),
    };

    try {
      await saveAssistantThread(currentUser.uid, newThreadId, newThread);
      await saveAssistantMessages(currentUser.uid, newThreadId, [], '');

      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(newThreadId);
      setMessages([]);
      setSummary('');
      return newThreadId;
    } catch (err) {
      console.error('Failed to create new thread:', err);
      setError('Failed to create a new chat.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Delete thread
  const deleteThread = useCallback(async (threadId) => {
    if (!currentUser || !threadId) return;
    try {
      await deleteAssistantThread(currentUser.uid, threadId);
      setThreads(prev => prev.filter(t => t.threadId !== threadId));
      if (activeThreadId === threadId) {
        const remaining = threads.filter(t => t.threadId !== threadId);
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].threadId);
        } else {
          setActiveThreadId(null);
          setMessages([]);
          setSummary('');
        }
      }
    } catch (err) {
      console.error('Failed to delete thread:', err);
      setError('Failed to delete chat.');
    }
  }, [currentUser, activeThreadId, threads]);

  // Update thread title / metadata
  const updateThreadMeta = useCallback(async (threadId, patch) => {
    if (!currentUser || !threadId) return;
    try {
      // Find the thread
      const thread = threads.find(t => t.threadId === threadId);
      if (!thread) return;

      const updatedThread = { ...thread, ...patch };
      await saveAssistantThread(currentUser.uid, threadId, updatedThread);
      setThreads(prev => prev.map(t => t.threadId === threadId ? updatedThread : t));
    } catch (err) {
      console.error('Failed to update thread metadata:', err);
    }
  }, [currentUser, threads]);

  // Send message
  const sendMessage = useCallback(async (content) => {
    if (!currentUser || !activeThreadId || !content.trim()) return;

    // Clear error
    setError(null);

    // Filter out any previous error turn from conversation history
    const cleanHistory = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].isError) {
        if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user') {
          cleanHistory.pop();
        }
      } else {
        cleanHistory.push(messages[i]);
      }
    }

    const userMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    const assistantPlaceholder = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    // 1. Update messages state optimistically with clean history, user message and placeholder
    const updatedMessages = [...cleanHistory, userMessage, assistantPlaceholder];
    setMessages(updatedMessages);
    setIsStreaming(true);

    // Update last message in the thread list preview
    setThreads(prev => prev.map(t =>
      t.threadId === activeThreadId
        ? { ...t, lastMessage: content.trim() }
        : t
    ));

    let accumulatedContent = '';
    let updatedSummary = summary;

    try {
      const idToken = await currentUser.getIdToken();
      const rawEmail = currentUser?.email || '';
      const emailPrefix = rawEmail.endsWith('@pathshala.ai')
        ? rawEmail.replace('@pathshala.ai', '')
        : (rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail);
      const rawName = (currentUser?.displayName && currentUser.displayName.trim()) || emailPrefix || '';
      const userName = rawName
        ? rawName.split(/[._]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : '';
      // Only send the last 4 messages (excluding the placeholder) for context
      const recentMessages = [...cleanHistory, userMessage].slice(-4);

      await streamAssistantChat(
        recentMessages,
        summary,
        currentUser.uid,
        idToken,
        (chunk) => {
          accumulatedContent += chunk;
          setMessages(prev => {
            const list = [...prev];
            if (list.length > 0) {
              const last = list[list.length - 1];
              if (last.role === 'assistant') {
                last.content = accumulatedContent;
              }
            }
            return list;
          });
        },
        (newSummary) => {
          updatedSummary = newSummary;
          setSummary(newSummary);
        },
        (err) => {
          throw err;
        },
        userName
      );

      // Streaming completed successfully
      setIsStreaming(false);

      const finalMessages = [...cleanHistory, userMessage, {
        role: 'assistant',
        content: accumulatedContent,
        timestamp: new Date().toISOString()
      }];

      // Save only successful messages and summary to Firestore
      await saveAssistantMessages(currentUser.uid, activeThreadId, finalMessages, updatedSummary);

      // Save lastMessage and updated time to thread
      const thread = threads.find(t => t.threadId === activeThreadId);
      if (thread) {
        await saveAssistantThread(currentUser.uid, activeThreadId, {
          ...thread,
          lastMessage: accumulatedContent.substring(0, 100)
        });
      }

    } catch (err) {
      console.error('Streaming failed:', err);
      setError(err.message || 'An error occurred during response generation.');
      setIsStreaming(false);

      // Update the placeholder with error text (in UI only, NOT saved to Firestore)
      setMessages(prev => {
        const list = [...prev];
        if (list.length > 0) {
          const last = list[list.length - 1];
          if (last.role === 'assistant') {
            last.content = 'An error occurred during response generation. Please check your keys or connection.';
            last.isError = true;
          }
        }
        return list;
      });
    }
  }, [currentUser, activeThreadId, messages, summary, threads]);

  // Clear thread messages and memory summary
  const clearThread = useCallback(async () => {
    if (!currentUser || !activeThreadId) return;
    try {
      await saveAssistantMessages(currentUser.uid, activeThreadId, [], '');
      setMessages([]);
      setSummary('');
      setThreads(prev => prev.map(t =>
        t.threadId === activeThreadId
          ? { ...t, lastMessage: '' }
          : t
      ));
    } catch (err) {
      console.error('Failed to clear thread:', err);
      setError('Failed to clear conversation history.');
    }
  }, [currentUser, activeThreadId]);

  return {
    threads,
    activeThreadId,
    messages,
    summary,
    isLoading,
    isStreaming,
    isLoadingHistory,
    error,
    createNewThread,
    selectThread: setActiveThreadId,
    deleteThread,
    updateThreadMeta,
    sendMessage,
    clearThread
  };
}

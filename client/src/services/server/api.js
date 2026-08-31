import {
  API_BASE_URL,
  triggerApiDisconnect,
  apiFetch
} from './serverHealth';

// Re-export for compatibility
export { API_BASE_URL, triggerApiDisconnect, apiFetch };

/**
 * Fetches YouTube video metadata.
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object>} Metadata object
 */
export async function fetchYoutubeMetadata(url) {
  const response = await apiFetch(`${API_BASE_URL}/youtube/metadata?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch video metadata (${response.status})`);
  }
  return response.json();
}

/**
 * Initiates the background notes generation pipeline.
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<{ task_id: string, status: string }>} Task creation response
 */
export async function startNoteGeneration(youtubeUrl, userId, idToken) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  const response = await apiFetch(`${API_BASE_URL}/notes/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ youtube_url: youtubeUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to start note generation (${response.status})`);
  }

  return response.json();
}

/**
 * Queries the current task status and results.
 * @param {string} taskId - Background task ID
 * @returns {Promise<Object>} Task state object
 */
export async function getTaskStatus(taskId) {
  const response = await apiFetch(`${API_BASE_URL}/notes/status/${taskId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch task status (${response.status})`);
  }
  return response.json();
}

/**
 * Asks a question about a video transcript using RAG.
 * @param {string} videoId - YouTube video ID
 * @param {string} question - Question to ask
 * @param {string} userId - Auth user ID
 * @param {string} idToken - Auth ID token
 * @returns {Promise<Object>} The answer and source references
 */
export async function askVideoQuestion(videoId, question, userId, idToken) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  const response = await apiFetch(`${API_BASE_URL}/notes/qa`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ video_id: videoId, question: question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to get an answer (${response.status})`);
  }

  return response.json();
}

/**
 * Sends a question regarding a video and streams the answer back.
 * @param {string} videoId - The YouTube video ID
 * @param {string} question - User question
 * @param {Array} history - Previous conversation messages
 * @param {Function} onChunk - Callback for when a text chunk is received
 * @param {Function} onDone - Callback for when stream completes
 * @param {Function} onError - Callback for handling errors during streaming
 * @param {string} [userId] - Optional authenticated user ID
 * @param {string} [idToken] - Optional auth token
 */
export async function askVideoQuestionStream(
  videoId,
  question,
  history,
  onChunk,
  onDone,
  onError,
  userId,
  idToken
) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/notes/qa`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        video_id: videoId,
        question: question,
        history: history.map(h => ({
          sender: h.sender,
          text: h.text
        }))
      }),
    });

    if (response.status >= 502 && response.status <= 504) {
      triggerApiDisconnect();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get an answer (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep unfinished line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'content') {
            accumulatedText += parsed.data;
            if (typeof onChunk === 'function') {
              onChunk(parsed.data);
            }
          } else if (parsed.type === 'error') {
            throw new Error(parsed.data);
          }
        } catch (e) {
          console.error('Error parsing stream line:', line, e);
          if (e.message && e.message !== 'Unexpected token') {
            throw e;
          }
        }
      }
    }

    if (typeof onDone === 'function') {
      onDone(accumulatedText);
    }
  } catch (err) {
    if (typeof onError === 'function') {
      onError(err);
    } else {
      throw err;
    }
  }
}

/**
 * Searches YouTube for educational content.
 * @param {string} query - The search term
 * @param {string} category - Category filter (e.g. 'all', 'science')
 * @param {string} pageToken - Optional pagination token
 * @returns {Promise<Object>} Search results and nextPageToken
 */
export async function searchYouTube(query, category = 'all', pageToken = '') {
  let url = `${API_BASE_URL}/youtube/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }
  const response = await apiFetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to search YouTube videos (${response.status})`);
  }
  return response.json();
}

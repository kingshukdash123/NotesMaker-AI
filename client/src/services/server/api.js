/**
 * API service for NotesMaker AI backend communication.
 */

const API_BASE_URL = '/api';

/**
 * Fetches YouTube video metadata.
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object>} Metadata object
 */
export async function fetchYoutubeMetadata(url) {
  const response = await fetch(`${API_BASE_URL}/youtube/metadata?url=${encodeURIComponent(url)}`);
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
export async function startNoteGeneration(youtubeUrl) {
  const response = await fetch(`${API_BASE_URL}/notes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(`${API_BASE_URL}/notes/status/${taskId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch task status (${response.status})`);
  }
  return response.json();
}

/**
 * Subscribes to SSE real-time log streaming for a task.
 * @param {string} taskId - Background task ID
 * @param {Function} onMessage - Callback for each log message string
 * @param {Function} onError - Callback for stream error
 * @returns {EventSource} The EventSource instance
 */
export function streamTaskLogs(taskId, onMessage, onError, onFinished) {
  const eventSource = new EventSource(`${API_BASE_URL}/notes/logs/${taskId}/stream`);

  const closeStream = () => {
    eventSource.close();
    if (onFinished) onFinished();
  };

  eventSource.addEventListener('close', () => {
    closeStream();
  });

  eventSource.onmessage = (event) => {
    if (event.data === '[STREAM_FINISHED]') {
      closeStream();
      return;
    }
    if (event.data && onMessage) {
      onMessage(event.data);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) {
      onError(err);
    }
  };

  return eventSource;
}

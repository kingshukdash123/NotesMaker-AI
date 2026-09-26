import { API_BASE_URL, triggerApiDisconnect } from './serverHealth';

/**
 * Streams the personal assistant chat response chunk by chunk.
 * Supports content chunks and summary updates.
 * @param {Array} messages - List of recent messages (role and content/text)
 * @param {string} summary - Current short term summary memory
 * @param {string} userId - Current user ID
 * @param {string} idToken - Auth ID token
 * @param {Function} onChunk - Callback for normal text chunks
 * @param {Function} onSummaryUpdate - Callback for final summary updates
 * @param {Function} onError - Callback for errors
 */
export async function streamAssistantChat(
  messages,
  summary,
  userId,
  idToken,
  onChunk,
  onSummaryUpdate,
  onError,
  userName = ''
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
    const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
          content: m.content || m.text
        })),
        summary: summary || '',
        user_name: userName || ''
      }),
    });

    if (response.status >= 502 && response.status <= 504) {
      triggerApiDisconnect();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get assistant response (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
            onChunk(parsed.data);
          } else if (parsed.type === 'summary_update') {
            onSummaryUpdate(parsed.data);
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
  } catch (err) {
    triggerApiDisconnect();
    if (onError) {
      onError(err);
    } else {
      throw err;
    }
  }
}

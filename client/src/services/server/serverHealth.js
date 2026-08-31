/**
 * Server health, spinning detection, and connection management service.
 */

// Get the API base URL from environment variables in production
// and fallback to /api for local development/proxies
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const DISCONNECT_EVENT_NAME = 'api:disconnected';

/**
 * Notifies the application that a server request failed due to connection/sleeping issue.
 */
export function triggerApiDisconnect() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DISCONNECT_EVENT_NAME));
  }
}

/**
 * Subscribes a listener to server disconnect events.
 * @param {Function} callback - Function called when server disconnects
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToApiDisconnect(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DISCONNECT_EVENT_NAME, callback);
  return () => window.removeEventListener(DISCONNECT_EVENT_NAME, callback);
}

/**
 * Helper to handle fetch requests and trigger disconnect modal on network or 502-504 server sleep errors.
 * @param {string} url - Request URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (response.status >= 502 && response.status <= 504) {
      triggerApiDisconnect();
    }
    return response;
  } catch (err) {
    triggerApiDisconnect();
    throw err;
  }
}

/**
 * Resiliently checks backend server health and wakes sleeping instances.
 * @param {boolean} [isManualRetry=false] - Whether this is an explicit user retry
 * @returns {Promise<boolean>} True if server is healthy
 */
export async function checkServerHealth(isManualRetry = false) {
  const maxAttempts = isManualRetry ? 8 : 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      let res;
      try {
        res = await fetch(`${API_BASE_URL}/health`, {
          cache: 'no-store',
          signal: controller.signal
        });
      } catch (fetchErr) {
        try {
          res = await fetch('http://127.0.0.1:8000/api/health', {
            cache: 'no-store',
            signal: controller.signal
          });
        } catch {
          throw fetchErr;
        }
      }
      clearTimeout(timeoutId);

      if (res && res.ok) {
        return true;
      }
    } catch {
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  return false;
}

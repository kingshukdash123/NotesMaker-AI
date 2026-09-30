/**
 * Formats an ISO date string or timestamp into a concise human-readable relative time.
 * @param {string|number|Date} dateString - The raw timestamp or date string
 * @returns {string} Formatted relative time (e.g. 'just now', '5m ago', '2h ago', '3d ago', '1mo ago', '2y ago')
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Extracts a clean single uppercase letter initial from a channel name.
 * @param {string} [channelName] - The creator or channel name
 * @returns {string} The first letter in uppercase (default: 'Y')
 */
export function getChannelInitial(channelName) {
  return (channelName || 'Y').trim().charAt(0).toUpperCase() || 'Y';
}

/**
 * Formats a raw view count number or string into a concise human-readable view count (e.g. '1.2M views', '450K views').
 * @param {number|string} views - The raw view count
 * @returns {string} Formatted view count string
 */
export function formatViews(views) {
  if (!views && views !== 0) return '';
  const num = typeof views === 'string' ? parseInt(views, 10) : views;
  if (isNaN(num) || num <= 0) return '';
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B views`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  }
  return `${num} views`;
}

/**
 * Formats a video duration in seconds or time string into standard 'MM:SS' or 'HH:MM:SS'.
 * @param {number|string} duration - Duration in seconds or formatted string
 * @returns {string} Formatted duration string
 */
export function formatVideoDuration(duration) {
  if (!duration) return '';
  if (typeof duration === 'string') {
    const trimmed = duration.trim();
    if (!trimmed || trimmed === '0:00' || trimmed === '00:00' || trimmed === '0:00:00' || trimmed === '0') {
      return '';
    }
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':').map((p) => parseInt(p, 10));
      if (parts.every((p) => isNaN(p) || p === 0)) {
        return '';
      }
      return trimmed;
    }
  }
  const sec = typeof duration === 'string' ? parseInt(duration, 10) : duration;
  if (isNaN(sec) || sec <= 0) return '';
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

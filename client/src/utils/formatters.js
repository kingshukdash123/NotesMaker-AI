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

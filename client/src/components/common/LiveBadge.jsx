import { Radio } from 'lucide-react';

/**
 * YouTube-style Live Broadcast Badge
 * Displays the antenna broadcast signal icon along with bold 'LIVE' text on red background.
 */
export default function LiveBadge({ className = '', size = 'sm' }) {
  const sizeClasses = size === 'xs' 
    ? 'text-[8.5px] px-1 py-0.5 gap-0.5 rounded-[3px]' 
    : size === 'md' 
    ? 'text-[11px] px-2 py-0.5 gap-1.5 rounded'
    : 'text-[9.5px] sm:text-[10px] px-1.5 py-0.5 gap-1 rounded';

  const iconSizes = size === 'xs' 
    ? 'w-2.5 h-2.5' 
    : size === 'md' 
    ? 'w-3.5 h-3.5' 
    : 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center font-black uppercase tracking-wider text-white bg-[#cc0000] shadow-sm select-none leading-none shrink-0 ${sizeClasses} ${className}`}
    >
      <Radio className={`${iconSizes} shrink-0 animate-pulse`} strokeWidth={2.8} />
      <span>LIVE</span>
    </span>
  );
}

/**
 * Base atomic Skeleton component with dark-mode glassmorphic styling and shimmer effect.
 * @param {Object} props
 * @param {string} [props.className] - Optional custom Tailwind classes
 */
export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton-shimmer bg-zinc-900/70 border border-zinc-800/40 rounded-lg ${className}`}
      {...props}
    />
  );
}

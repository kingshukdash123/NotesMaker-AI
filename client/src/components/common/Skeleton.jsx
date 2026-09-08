import { useTheme } from '../../context/ThemeContext';

/**
 * Base atomic Skeleton component with theme-adaptive styling and pulse animation.
 * @param {Object} props
 * @param {string} [props.className] - Optional custom Tailwind classes
 */
export default function Skeleton({ className = '', ...props }) {
  const { isDark } = useTheme();
  return (
    <div
      className={`animate-pulse rounded-lg transition-colors ${
        isDark ? 'bg-zinc-900/80' : 'bg-zinc-100'
      } ${className}`}
      {...props}
    />
  );
}

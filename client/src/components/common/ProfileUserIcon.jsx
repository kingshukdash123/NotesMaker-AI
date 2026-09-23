/**
 * ProfileUserIcon Component
 * Renders the user profile avatar with clean circle head and smooth curved dome shoulders.
 */
export default function ProfileUserIcon({ className = "w-5 h-5", strokeWidth = 1.8, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Circle head */}
      <circle cx="12" cy="8" r="4" />
      {/* Curved dome shoulders */}
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

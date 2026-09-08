export default function CurvyUnderline({ className = '' }) {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={`absolute bottom-[-6px] left-0 w-full pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M2 8 C30 2, 60 12, 100 6 C140 0, 170 10, 198 5"
        fill="none"
        stroke="#f97316"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

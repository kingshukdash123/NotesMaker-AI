export default function OrbitIcon({ className = "w-6 h-6", alt = "Orbit", ...props }) {
  return (
    <img
      src="/orbit-dp-resize.webp"
      alt={alt}
      width="28"
      height="28"
      decoding="async"
      fetchpriority="high"
      className={`rounded-full object-cover select-none pointer-events-none shrink-0 ${className}`}
      {...props}
    />
  );
}

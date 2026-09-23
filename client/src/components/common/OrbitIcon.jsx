export default function OrbitIcon({ className = "w-6 h-6", alt = "Orbit", ...props }) {
  return (
    <img
      src="/orbit-dp.png"
      alt={alt}
      width="28"
      height="28"
      loading="lazy"
      decoding="async"
      className={`rounded-full object-cover select-none pointer-events-none shrink-0 ${className}`}
      {...props}
    />
  );
}

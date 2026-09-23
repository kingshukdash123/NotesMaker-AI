export default function GurujiIcon({ className = "w-5 h-5", alt = "Guruji", ...props }) {
  return (
    <img
      src="/orbit.png"
      alt={alt}
      width="24"
      height="24"
      loading="lazy"
      decoding="async"
      className={`rounded-full object-cover select-none pointer-events-none shrink-0 ${className}`}
      {...props}
    />
  );
}

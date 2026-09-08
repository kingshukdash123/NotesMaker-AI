export default function SectionLabel({ children, isDark }) {
  return (
    <p className={`text-xs font-bold tracking-[0.18em] uppercase mb-3 ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>
      {children}
    </p>
  );
}

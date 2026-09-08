export default function BrowserFrame({ src, alt, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="flex-1 ml-3 h-5 rounded bg-zinc-800 flex items-center px-3">
          <span className="text-[10px] text-zinc-500 font-mono">pathshalaai.co.in</span>
        </div>
      </div>
      <img src={src} alt={alt} className="w-full h-auto object-cover object-top block" loading="lazy" />
    </div>
  );
}

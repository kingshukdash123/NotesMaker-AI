import { BookOpen, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import MarkdownRenderer from './common/MarkdownRenderer';

export default function NotesViewer({ result }) {
  const { isDark } = useTheme();

  if (!result || !result.draft_notes) return null;

  const draftNotes = result.draft_notes;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-10">
      <div className={`border shadow-lg rounded-xl transition-all duration-300 ${
        isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-orange-200/90'
      }`}>
        {/* Notes Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Markdown Notes Text */}
          {draftNotes.content && (
            <div className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-zinc-300' : 'text-orange-950'
            }`}>
              <MarkdownRenderer content={draftNotes.content} isDark={isDark} />
            </div>
          )}

          {/* References list */}
          {draftNotes.sections && draftNotes.sections.some(s => s.references && s.references.length > 0) && (
            <div className={`pt-5 border-t ${isDark ? 'border-zinc-800' : 'border-orange-100'}`}>
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
                isDark ? 'text-zinc-300' : 'text-orange-900'
              }`}>
                <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-orange-600'}`} /> Compiled Key References
              </h3>
              <ul className="flex flex-wrap gap-2">
                {draftNotes.sections.flatMap(s => s.references || []).map((ref, idx) => (
                  <li key={idx} className="max-w-full">
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition max-w-full break-all ${
                        isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                          : 'bg-orange-100/70 hover:bg-orange-100 text-orange-900 border-orange-200'
                      }`}
                    >
                      <span className="truncate">{ref.title}</span>
                      <ExternalLink className={`w-3 h-3 shrink-0 ${isDark ? 'text-zinc-500' : 'text-orange-500'}`} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

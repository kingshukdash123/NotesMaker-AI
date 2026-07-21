import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FileText, ListTree, Code, Copy, Download, Check, ExternalLink, 
  BookOpen, Target, Lightbulb, Hash, Layers 
} from 'lucide-react';

export default function NotesViewer({ result }) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'outline' | 'json'
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const draftNotes = result.draft_notes;
  const outline = result.lecture_outline;

  const handleCopyMarkdown = () => {
    let fullMd = '';
    if (draftNotes) {
      fullMd += `# ${draftNotes.title || 'Lecture Notes'}\n\n`;
      if (draftNotes.content) fullMd += `${draftNotes.content}\n\n`;
      
      const allReferences = draftNotes.sections ? draftNotes.sections.flatMap(s => s.references || []) : [];
      if (allReferences.length > 0) {
        fullMd += `## Key References\n\n`;
        allReferences.forEach((ref) => {
          fullMd += `- [${ref.title}](${ref.url})\n`;
        });
      }
    }
    navigator.clipboard.writeText(fullMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    let fullMd = '';
    if (draftNotes) {
      fullMd += `# ${draftNotes.title || 'Lecture Notes'}\n\n`;
      if (draftNotes.content) fullMd += `${draftNotes.content}\n\n`;
      
      const allReferences = draftNotes.sections ? draftNotes.sections.flatMap(s => s.references || []) : [];
      if (allReferences.length > 0) {
        fullMd += `## Key References\n\n`;
        allReferences.forEach((ref) => {
          fullMd += `- [${ref.title}](${ref.url})\n`;
        });
      }
    }
    const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(draftNotes?.title || 'notes').toLowerCase().replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-zinc-950 rounded-xl border border-zinc-800 shadow-xl overflow-hidden mb-12">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-zinc-800 bg-zinc-950 p-3 sm:p-4 gap-3">
        {/* Tab Buttons (shadcn segmented control) */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeTab === 'notes'
                ? 'bg-zinc-950 text-zinc-100 shadow-sm border border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generated Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeTab === 'outline'
                ? 'bg-zinc-950 text-zinc-100 shadow-sm border border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Lecture Outline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition ${
              activeTab === 'json'
                ? 'bg-zinc-950 text-zinc-100 shadow-sm border border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw Output</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-950 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Draft Notes */}
      {activeTab === 'notes' && (
        <div className="p-5 sm:p-8 space-y-6">
          {draftNotes ? (
            <>
              {/* Title & Overview Header */}
              <div className="border-b border-zinc-800 pb-5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 mb-2">
                  {draftNotes.title || 'Comprehensive Lecture Notes'}
                </h1>
                {draftNotes.content && (
                  <div className="markdown-content text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {draftNotes.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Render References compiled from all sections at the bottom if any */}
              {draftNotes.sections && draftNotes.sections.some(s => s.references && s.references.length > 0) && (
                <div className="pt-5 border-t border-zinc-800">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" /> Compiled Key References
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {draftNotes.sections.flatMap(s => s.references || []).map((ref, idx) => (
                      <li key={idx}>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition"
                        >
                          <span>{ref.title}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-zinc-500 italic text-xs">No notes data available.</div>
          )}
        </div>
      )}

      {/* Tab 2: Lecture Outline */}
      {activeTab === 'outline' && (
        <div className="p-5 sm:p-8 space-y-6">
          {outline ? (
            <>
              {/* Header Overview Card */}
              <div className="bg-zinc-900/60 p-5 rounded-lg border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-zinc-400" />
                    {outline.title || 'Structured Lecture Outline'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {outline.difficulty && (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800">
                        Difficulty: {outline.difficulty}
                      </span>
                    )}
                    {outline.lecture_type && (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {outline.lecture_type}
                      </span>
                    )}
                  </div>
                </div>

                {outline.overview && (
                  <div className="markdown-content text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded border border-zinc-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {outline.overview}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Learning Objectives */}
              {outline.learning_objectives && outline.learning_objectives.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-400" /> Learning Objectives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {outline.learning_objectives.map((obj, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-200 flex items-start gap-2.5"
                      >
                        <span className="w-4 h-4 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic Hierarchy */}
              {outline.topic_hierarchy && outline.topic_hierarchy.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" /> Curriculum & Topic Breakdown
                  </h3>
                  <div className="space-y-3">
                    {outline.topic_hierarchy.map((topic, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 space-y-2.5"
                      >
                        <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-zinc-400" />
                          {topic.title}
                        </h4>
                        {topic.bullets && topic.bullets.length > 0 && (
                          <ul className="space-y-1 pl-5 list-disc text-xs text-zinc-400 leading-relaxed">
                            {topic.bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Concepts Tags */}
              {outline.concepts && outline.concepts.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Core Technical Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {outline.concepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-300 text-xs border border-zinc-800"
                      >
                        ⚡ {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-zinc-500 italic text-xs">No outline data available.</div>
          )}
        </div>
      )}

      {/* Tab 3: Raw JSON */}
      {activeTab === 'json' && (
        <div className="p-5 bg-black font-mono text-xs overflow-x-auto">
          <pre className="text-zinc-300 leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

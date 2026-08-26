import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import katex from 'katex';
import { BookOpen, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

const preprocessMarkdown = (content) => {
  if (!content) return '';

  // 0. Restore LaTeX backslashes that were parsed as escape control characters (e.g. \t, \f, \b, \v)
  let processed = content
    .replace(/\x0c/g, '\\f') // Form Feed -> \f (e.g. \frac)
    .replace(/\x09/g, '\\t') // Horizontal Tab -> \t (e.g. \text, \theta)
    .replace(/\x08/g, '\\b') // Backspace -> \b (e.g. \beta, \begin)
    .replace(/\x0b/g, '\\v'); // Vertical Tab -> \v (e.g. \vec)

  // 1. Unescape any escaped dollar signs (e.g. \$ -> $)
  processed = processed.replace(/\\(\$)/g, '$1');

  // 2. Safe single-line delimiter balancing (does not cross lines or other dollar signs)
  processed = processed.replace(/\$\$([^\n$]+)\$(?!\$)/g, '$$$1$$');
  processed = processed.replace(/(?<!\$)\$([^\n$]+)\$\$/g, '$$$1$$');

  // 3. Convert all inline math $formula$ to custom code blocks `__INLINE_MATH__formula`
  processed = processed.replace(/(?<!\$)\$([^\n$]+)\$(?!\$)/g, (match, p1) => {
    if (p1.startsWith('$') || p1.endsWith('$')) return match;
    return '`__INLINE_MATH__' + p1 + '`';
  });

  return processed;
};

export default function NotesViewer({ result, isFullscreen = false, onToggleFullscreen, versionSuffix = '' }) {
  if (!result || !result.draft_notes) return null;

  const draftNotes = result.draft_notes;

  return (
    <div className={`bg-black border border-zinc-800 shadow-xl overflow-hidden transition-all duration-300 ${
      isFullscreen 
        ? 'w-full h-full rounded-xl overflow-y-auto flex-1 min-h-0' 
        : 'w-full rounded-xl mb-12'
    }`}>
      {/* Notes Content Body */}
      <div className="p-3 sm:p-8 space-y-6">
        {/* Title Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100 mb-2 leading-tight flex flex-wrap items-center gap-2.5">
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              {draftNotes.title || 'Comprehensive Lecture Notes'}
            </span>
            {versionSuffix && (
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-orange-950/40 border border-orange-900/30 text-orange-400 select-none">
                {versionSuffix.replace(/^\s*\|\s*/, '')}
              </span>
            )}
          </h1>
        </div>

        {/* Markdown Notes Text */}
        {draftNotes.content && (
          <div className="markdown-content text-sm sm:text-base text-zinc-300 leading-relaxed bg-black p-3 sm:p-6 rounded-lg border border-zinc-800">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]} 
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={{
                code({node, className, children, ...props}) {
                  const codeText = String(children);
                  if (codeText.startsWith('__INLINE_MATH__')) {
                    const formula = codeText.replace('__INLINE_MATH__', '');
                    try {
                      const html = katex.renderToString(formula, { 
                        displayMode: false,
                        throwOnError: false
                      });
                      return <span dangerouslySetInnerHTML={{ __html: html }} className="inline-block" />;
                    } catch (err) {
                      return <span className="text-red-400 font-semibold">{formula}</span>;
                    }
                  }
                  return <code className={className} {...props}>{children}</code>;
                }
              }}
            >
              {preprocessMarkdown(draftNotes.content)}
            </ReactMarkdown>
          </div>
        )}

        {/* References list */}
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-305 text-xs border border-zinc-800 transition"
                  >
                    <span>{ref.title}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

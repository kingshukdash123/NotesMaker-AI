import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { BookOpen, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

const preprocessMarkdown = (content) => {
  if (!content) return '';

  // 0. Restore LaTeX backslashes that were parsed as escape control characters (e.g. \t, \f, \b, \v)
  let processed = content
    .replace(/\x0c/g, '\\f') // Form Feed -> \f (e.g. \frac)
    .replace(/\x09/g, '\\t') // Horizontal Tab -> \t (e.g. \text, \theta)
    .replace(/\x08/g, '\\b') // Backspace -> \b (e.g. \beta, \begin)
    .replace(/\x0b/g, '\\v'); // Vertical Tab -> \v (e.g. \vec)

  // Convert standard LaTeX delimiters \( \) and \[ \] to $ and $$
  processed = processed
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // \[ ... \] -> $$ ... $$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');     // \( ... \) -> $ ... $

  // 1. Unescape any escaped dollar signs (e.g. \$ -> $)
  processed = processed.replace(/\\(\$)/g, '$1');

  // 2. Extract timestamps/citations trapped inside $$...$$ or $...$ math blocks before tokenizing
  processed = processed.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (match, mathBody) => {
      let extractedTimestamps = [];
      let cleanedMath = mathBody.replace(
        /(?:\s*(?:\\quad|\\qquad|\\hspace\{[^}]*\}|\\,|\\!|~|\s)+)?\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g,
        (tsMatch) => {
          const tsOnlyMatch = tsMatch.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
          if (tsOnlyMatch) {
            extractedTimestamps.push(tsOnlyMatch[0]);
          }
          return '';
        }
      ).trim();
      const suffix = extractedTimestamps.length > 0 ? ' ' + extractedTimestamps.join(' ') : '';
      return `$$${cleanedMath}$$${suffix}`;
    }
  );

  processed = processed.replace(
    /(?<!\$)\$([^$\n]+?)\$(?!\$)/g,
    (match, mathBody) => {
      let extractedTimestamps = [];
      let cleanedMath = mathBody.replace(
        /(?:\s*(?:\\quad|\\qquad|\\hspace\{[^}]*\}|\\,|\\!|~|\s)+)?\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g,
        (tsMatch) => {
          const tsOnlyMatch = tsMatch.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
          if (tsOnlyMatch) {
            extractedTimestamps.push(tsOnlyMatch[0]);
          }
          return '';
        }
      ).trim();
      const suffix = extractedTimestamps.length > 0 ? ' ' + extractedTimestamps.join(' ') : '';
      return `$${cleanedMath}$${suffix}`;
    }
  );

  // 3. Robust state machine to tokenize and replace inline math $...$
  let result = '';
  let i = 0;
  const len = processed.length;

  while (i < len) {
    // 3a. Skip code blocks (``` ... ```)
    if (processed.startsWith('```', i)) {
      const endIdx = processed.indexOf('```', i + 3);
      if (endIdx !== -1) {
        result += processed.substring(i, endIdx + 3);
        i = endIdx + 3;
      } else {
        result += processed.substring(i);
        break;
      }
      continue;
    }

    // 3b. Skip inline code (` ... `)
    if (processed[i] === '`') {
      const endIdx = processed.indexOf('`', i + 1);
      if (endIdx !== -1) {
        result += processed.substring(i, endIdx + 1);
        i = endIdx + 1;
      } else {
        result += processed[i];
        i++;
      }
      continue;
    }

    // 3c. Handle block math ($$ ... $$) — convert to __BLOCK_MATH__ token
    if (processed.startsWith('$$', i)) {
      let endIdx = -1;
      let nextSearchIdx = i + 2;

      // Look for the next $$ that forms a valid block (does not cross paragraphs or headings)
      while (true) {
        const foundIdx = processed.indexOf('$$', nextSearchIdx);
        if (foundIdx === -1) break;

        const innerText = processed.substring(i + 2, foundIdx);
        if (!innerText.includes('\n\n') && !innerText.includes('\r\n\r\n') && !innerText.includes('\n#') && !innerText.includes('\r\n#')) {
          endIdx = foundIdx;
          break;
        }
        // If it was invalid, keep searching from the next character
        nextSearchIdx = foundIdx + 1;
      }

      if (endIdx !== -1) {
        let mathContent = processed.substring(i + 2, endIdx).trim();
        // Fix single-backslash+newline to double-backslash+newline for LaTeX line breaks
        mathContent = mathContent.replace(/(?<!\\)\\\n/g, '\\\\\n');
        mathContent = mathContent.replace(/(?:\s*(?:\\quad|\\qquad|\\hspace\{[^}]*\}|\\,|\\!|~|\s)+)?\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g, '').trim();
        // Encode newlines so inline code block stays single-line
        const encoded = mathContent.replace(/\n/g, '§NL§');
        result += '`__BLOCK_MATH__' + encoded + '`';
        i = endIdx + 2;
        continue;
      }
    }

    // 3d. Handle inline math ($ ... $)
    if (processed[i] === '$') {
      // Find closing $ on the same line
      let endIdx = -1;
      for (let j = i + 1; j < len; j++) {
        if (processed[j] === '\n') {
          break; // Must be on the same line
        }
        if (processed[j] === '$') {
          endIdx = j;
          break;
        }
      }

      if (endIdx !== -1 && endIdx > i + 1) {
        let formula = processed.substring(i + 1, endIdx).trim();
        if (formula.length > 0) {
          formula = formula.replace(/(?:\s*(?:\\quad|\\qquad|\\hspace\{[^}]*\}|\\,|\\!|~|\s)+)?\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g, '').trim();
          result += '`__INLINE_MATH__' + formula + '`';
          i = endIdx + 1;
          continue;
        }
      }
    }

    result += processed[i];
    i++;
  }

  return result;
};

export default function NotesViewer({ result, isFullscreen = false, onToggleFullscreen, versionSuffix = '' }) {
  if (!result || !result.draft_notes) return null;

  const draftNotes = result.draft_notes;

  const cardContent = (
    <div className={`bg-black border border-zinc-800 shadow-xl overflow-hidden transition-all duration-300 ${isFullscreen
      ? 'w-full h-full rounded-xl overflow-y-auto flex-1 min-h-0'
      : 'w-full rounded-xl'
      }`}>
      {/* Notes Content Body */}
      <div className="p-3 sm:p-2 space-y-4">
        {/* Markdown Notes Text */}
        {draftNotes.content && (
          <div className="markdown-content text-sm sm:text-base text-zinc-300 leading-relaxed bg-black p-2 sm:p-4 rounded-lg overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, className, children, ...props }) {
                  const getRawText = (n) => {
                    if (typeof n === 'string') return n;
                    if (typeof n === 'number') return String(n);
                    if (Array.isArray(n)) return n.map(getRawText).join('');
                    if (n && n.props && n.props.children) {
                      return getRawText(n.props.children);
                    }
                    return '';
                  };
                  const codeText = getRawText(children);
                  // Block math (from $$ blocks)
                  if (codeText.startsWith('__BLOCK_MATH__')) {
                    const formula = codeText.replace('__BLOCK_MATH__', '').replace(/§NL§/g, '\n');
                    try {
                      const html = katex.renderToString(formula, {
                        displayMode: true,
                        throwOnError: false
                      });
                      return <span dangerouslySetInnerHTML={{ __html: html }} className="block my-4 overflow-x-auto" />;
                    } catch (err) {
                      return <div className="p-2 my-2 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono text-xs overflow-x-auto">{formula}</div>;
                    }
                  }
                  // Inline math (from $ blocks)
                  if (codeText.startsWith('__INLINE_MATH__')) {
                    const formula = codeText.replace('__INLINE_MATH__', '');
                    try {
                      const html = katex.renderToString(formula, {
                        displayMode: false,
                        throwOnError: false
                      });
                      return <span dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
                    } catch (err) {
                      return <code className="px-1 py-0.5 rounded bg-zinc-900 text-zinc-300 font-mono text-xs">{formula}</code>;
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

  if (isFullscreen) {
    return cardContent;
  }

  return (
    <div className="max-w-6xl mx-auto my-3 px-2 sm:px-0 w-full min-w-0 overflow-hidden">
      {cardContent}
    </div>
  );
}

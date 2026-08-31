import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Play } from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

/**
 * Converts a timestamp string (e.g. "23:44" or "01:23:45") to seconds.
 */
export function timestampToSeconds(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/[[\]()]/g, '').trim();
  const parts = clean.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Helper to process timestamp patterns in plain text blocks.
 */
function processTextTimestamps(str) {
  if (!str) return '';
  // 1. Bracketed timestamps: [12:34], [01:23:45], [02:15 - 04:30]
  str = str.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*[-–—]\s*(\d{1,2}:\d{2}(?::\d{2})?))?\]/g, (m, startTs, endTs) => {
    const sec = timestampToSeconds(startTs);
    const label = endTs ? `${startTs} - ${endTs}` : startTs;
    return `[${label}](#timestamp-${sec})`;
  });

  // 2. Parenthesized timestamps: (12:34), (01:23:45)
  str = str.replace(/\((\d{1,2}:\d{2}(?::\d{2})?)\)/g, (m, ts) => {
    const sec = timestampToSeconds(ts);
    return `[${ts}](#timestamp-${sec})`;
  });

  return str;
}

/**
 * Links timestamps outside code fences and math expressions.
 */
function linkifyTimestamps(text) {
  if (!text) return '';
  const regex = /(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$|\$(?!\$)[^$\n]+?\$(?!\$)|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;
  let result = '';

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    result += processTextTimestamps(before);
    result += match[0];
    lastIndex = regex.lastIndex;
  }
  result += processTextTimestamps(text.slice(lastIndex));
  return result;
}

/**
 * Universal math, timestamp, and markdown sanitizer.
 */
function sanitizeMarkdownAndMath(content) {
  if (!content || typeof content !== 'string') return '';

  // 1. Restore JSON control characters unescaped by parsers & normalize whitespace escapes
  let text = content
    .replaceAll(String.fromCharCode(12), '\\f')
    .replaceAll(String.fromCharCode(8), '\\b')
    .replaceAll(String.fromCharCode(11), '\\v')
    .replace(/\r\n/g, '\n')
    .replace(/\r(ight|ho|adical|ef|ound)\b/g, '\\r$1')
    .replaceAll(String.fromCharCode(13), '\\r')
    .replace(/\t(ext|heta|au|an|imes|o|ilde|riangle|op|frac|sum|int|cdot)\b/g, '\\t$1')
    // Fix broken \right when \r was completely stripped
    .replace(/(?<!\\)\bight([\])}>|])/g, '\\right$1');

  // 2. Trailing pipe delimiter artifacts ($| or $$|) -> $$ (use replacer function to avoid JS $$ escaping)
  text = text.replace(/\${1,2}\|/g, () => '$$');

  // 3. Trailing dashes attached to display math e.g. $$--- -> $$\n\n---
  text = text.replace(/\$\$(---+)/g, (_, dashes) => `$$\n\n${dashes}`);

  // 4. Triple or more dollar signs ($$$+) -> $$ (use replacer function to avoid JS $$ escaping)
  text = text.replace(/\${3,}/g, () => '$$');

  // 5. Standardize vector subscripts (e.g. \vec{P}{final} -> \vec{P}_{\text{final}}, \vec{a}0 -> \vec{a}_0)
  text = text
    .replace(/\\vec\{([a-zA-Z])\}\{([a-zA-Z]+)\}/g, '\\vec{$1}_{\\text{$2}}')
    .replace(/\\vec\{([a-zA-Z])\}\{\\text\{([a-zA-Z]+)\}\}/g, '\\vec{$1}_{\\text{$2}}')
    .replace(/\\vec\{([a-zA-Z])\}(\d+)/g, '\\vec{$1}_$2');

  // 6. Standardize LaTeX environments \[...\] -> $$...$$ and \(...\) -> $...$
  text = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `\n$$\n${m.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m.trim()}$`);

  // 7. Extract trapped video timestamps like [01:23] from display math blocks
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, body) => {
    const timestamps = [];
    const clean = body.replace(
      /(?:\s*(?:\\quad|\\qquad|\\hspace\{[^}]*\}|\\,|\\!|~|\s)+)?\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g,
      (ts) => {
        const m = ts.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
        if (m) timestamps.push(m[0]);
        return '';
      }
    ).trim();
    const suffix = timestamps.length > 0 ? '\n' + timestamps.join(' ') : '';
    return `\n$$\n${clean}\n$$${suffix}\n`;
  });

  // 8. Separate inline $$...$$ into its own display block (e.g. "Label: $$formula$$" -> "Label:\n\n$$\nformula\n$$\n")
  text = text.replace(/([^\n]+?)\s*\$\$([^\n]+?)\$\$/g, (match, prefix, math) => {
    if (!prefix.trim()) return `\n$$\n${math.trim()}\n$$\n`;
    return `${prefix.trim()}\n\n$$\n${math.trim()}\n$$\n`;
  });

  // 9. Clean all $$ blocks to strip any inner stray leading/trailing $
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, body) => {
    const clean = body.trim().replace(/^[$ \t]+|[$ \t]+$/g, '');
    return `\n$$\n${clean}\n$$\n`;
  });

  // 10. Fix ASCII diagram blocks
  text = text.replace(/^text\s*\n+([ \t]*[+|].*?(?:\n[ \t]*[+|].*?)*)$/gm, (_, box) => {
    return `\`\`\`text\n${box}\n\`\`\``;
  });

  // 11. Balance any single line that has an unclosed $$ (odd number of $$)
  const lines = text.split('\n');
  const fixedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed === '$$') return line;

    // Count double dollars
    const doubleDollars = (line.match(/\$\$/g) || []).length;
    if (doubleDollars % 2 === 1) {
      if (trimmed.endsWith('$$') && !trimmed.startsWith('$$')) {
        const colonIdx = line.lastIndexOf(':');
        if (colonIdx !== -1) {
          const lbl = line.slice(0, colonIdx + 1);
          const fml = line.slice(colonIdx + 1, -2).trim();
          return `${lbl}\n\n$$\n${fml}\n$$\n`;
        }
        return `\n$$\n${trimmed.slice(0, -2).trim()}\n$$\n`;
      }
      return `${line}\n$$`;
    }

    return line;
  });

  const balanced = fixedLines.join('\n').replace(/\n{3,}/g, '\n\n');

  // 12. Linkify all timestamps into interactive seek links
  return linkifyTimestamps(balanced);
}

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const preprocessed = sanitizeMarkdownAndMath(content);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              strict: false,
              trust: true
            }
          ],
          rehypeHighlight
        ]}
        components={{
          a: ({ href, children, ...props }) => {
            if (href && href.startsWith('#timestamp-')) {
              const seconds = parseInt(href.replace('#timestamp-', ''), 10);
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('seek-video', { detail: { seconds } }));
                  }}
                  className="inline-flex items-center gap-1 font-mono font-bold text-[9.5px] sm:text-[10.5px] leading-tight px-1.5 py-0.5 my-0.5 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 hover:text-orange-400 border border-orange-500/25 hover:border-orange-500/50 transition-all duration-150 cursor-pointer select-none active:scale-95 group align-baseline"
                  title={`Jump video to ${children}`}
                >
                  <Play className="w-2 h-2 fill-current text-orange-500 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="font-semibold tracking-tight">{children}</span>
                </button>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors font-medium"
                {...props}
              >
                {children}
              </a>
            );
          }
        }}
      >
        {preprocessed}
      </ReactMarkdown>
    </div>
  );
}

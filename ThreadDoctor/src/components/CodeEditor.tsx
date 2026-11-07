import { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onReset?: () => void;
  onChange?: (code: string) => void;
  editable?: boolean;
}

// Lightweight C++ syntax highlighter
const KEYWORDS = new Set([
  'int', 'void', 'return', 'for', 'while', 'if', 'else', 'struct', 'class',
  'public', 'private', 'protected', 'const', 'static', 'auto', 'new', 'delete',
  'true', 'false', 'nullptr', 'namespace', 'using', 'template', 'typename',
  'std', 'thread', 'mutex', 'lock_guard', 'unique_lock', 'condition_variable',
  'queue', 'vector', 'this', 'size', 'push', 'pop', 'front', 'empty', 'lock',
  'unlock', 'wait', 'notify_one', 'notify_all', 'sleep_for', 'chrono',
  'milliseconds', 'join', 'emplace_back', 'counting_semaphore', 'acquire',
  'release', 'string', 'cout', 'cin', 'endl', 'shared_ptr', 'unique_ptr',
  'atomic', 'ref', 'function',
]);

const PREPROCESSOR = /#[a-z]+/;

interface Token {
  text: string;
  type: 'plain' | 'keyword' | 'preprocessor' | 'string' | 'comment' | 'number' | 'function' | 'type';
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    const rest = line.slice(i);

    // Comment
    if (rest.startsWith('//')) {
      tokens.push({ text: rest, type: 'comment' });
      break;
    }

    // Preprocessor
    if (i === 0 && PREPROCESSOR.test(rest)) {
      const match = rest.match(/^#\w+/);
      if (match) {
        tokens.push({ text: match[0], type: 'preprocessor' });
        i += match[0].length;
        continue;
      }
    }

    // String
    if (rest[0] === '"') {
      const end = rest.indexOf('"', 1);
      const text = end >= 0 ? rest.slice(0, end + 1) : rest;
      tokens.push({ text, type: 'string' });
      i += text.length;
      continue;
    }

    // Char literal
    if (rest[0] === "'") {
      const end = rest.indexOf("'", 1);
      const text = end >= 0 ? rest.slice(0, end + 1) : rest;
      tokens.push({ text, type: 'string' });
      i += text.length;
      continue;
    }

    // Number
    const numMatch = rest.match(/^\d+\.?\d*/);
    if (numMatch) {
      tokens.push({ text: numMatch[0], type: 'number' });
      i += numMatch[0].length;
      continue;
    }

    // Identifier
    const idMatch = rest.match(/^[A-Za-z_]\w*/);
    if (idMatch) {
      const word = idMatch[0];
      const afterIdx = i + word.length;
      let j = afterIdx;
      while (j < n && line[j] === ' ') j++;
      const isCall = line[j] === '(';

      let type: Token['type'] = 'plain';
      if (KEYWORDS.has(word)) type = 'keyword';
      else if (isCall) type = 'function';
      else if (/^[A-Z]/.test(word)) type = 'type';

      tokens.push({ text: word, type });
      i += word.length;
      continue;
    }

    // Single char
    tokens.push({ text: rest[0], type: 'plain' });
    i += 1;
  }

  return tokens;
}

const TOKEN_CLASS: Record<Token['type'], string> = {
  plain: 'text-slate-300',
  keyword: 'text-accent',
  preprocessor: 'text-warning',
  string: 'text-success',
  comment: 'text-muted italic',
  number: 'text-warning',
  function: 'text-sky-400',
  type: 'text-emerald-400',
};

const SHARED_TEXT_STYLE = 'font-mono text-[13px] leading-[1.6] py-3 px-4 whitespace-pre-wrap break-words';
const TEXTAREA_STYLE = 'absolute inset-0 bg-transparent text-transparent caret-slate-100 resize-none outline-none border-0';

export function CodeEditor({ code, onReset, onChange, editable = false }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const lines = useMemo(() => code.split('\n'), [code]);
  const isEditable = editable && onChange;

  // Sync scroll: textarea → highlighted pre
  function handleScroll() {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  // Handle Tab key to insert spaces instead of changing focus
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange?.(newCode);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      });
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  // Focus the textarea when switching to editable mode
  useEffect(() => {
    if (isEditable && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditable]);

  return (
    <div className="flex flex-col h-full bg-bg-raised rounded-xl border border-border-subtle overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-panel">
        <span className="text-xs font-mono text-muted uppercase tracking-wider">main.cpp</span>
        <div className="flex items-center gap-1.5">
          {isEditable && (
            <span className="text-[10px] text-accent font-medium mr-1">editable</span>
          )}
          {onReset && (
            <button onClick={onReset} className="btn-ghost px-2 py-1 text-xs" title="Reset code">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          <button onClick={handleCopy} className="btn-ghost px-2 py-1 text-xs" title="Copy code">
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto font-mono text-[13px] leading-[1.6] relative">
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="select-none text-right py-3 px-3 text-muted/60 bg-bg-base/40 border-r border-border-subtle/50 sticky left-0 z-10">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code area — either read-only highlighted or editable with overlay */}
          <div className="flex-1 relative">
            {/* Highlighted code (always rendered as the visual layer) */}
            <pre
              ref={highlightRef}
              className={`${SHARED_TEXT_STYLE} overflow-auto ${isEditable ? 'pointer-events-none' : ''}`}
              aria-hidden={isEditable ? 'true' : undefined}
            >
              {lines.map((line, i) => {
                const tokens = tokenizeLine(line);
                return (
                  <div key={i} className="whitespace-pre min-h-[1.6em]">
                    {tokens.length === 0 ? (
                      <span> </span>
                    ) : (
                      tokens.map((tok, j) => (
                        <span key={j} className={TOKEN_CLASS[tok.type]}>
                          {tok.text}
                        </span>
                      ))
                    )}
                  </div>
                );
              })}
            </pre>

            {/* Transparent textarea overlay for editing */}
            {isEditable && (
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => onChange?.(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className={`${SHARED_TEXT_STYLE} ${TEXTAREA_STYLE} w-full h-full`}
                style={{ caretColor: '#e2e8f0' }}
              />
            )}
          </div>
        </div>
      </div>

      {editable && (
        <div className="px-3 py-1.5 border-t border-border-subtle bg-bg-panel text-[10px] text-muted text-center">
          {isEditable
            ? 'Edit the code above — Tab inserts 4 spaces'
            : 'Code is illustrative — simulations run deterministically in the browser'}
        </div>
      )}
    </div>
  );
}

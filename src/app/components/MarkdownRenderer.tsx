'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, PanelRight } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (title: string, content: string, language?: string) => void;
}

export default function MarkdownRenderer({ content, onOpenArtifact }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 text-[0.9375rem] leading-[1.75]">{children}</p>
        ),

        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold mt-5 mb-2 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-[0.9375rem] leading-[1.75]">{children}</li>
        ),

        // Strong / em
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/90">{children}</em>
        ),

        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-border pl-4 my-3 text-muted-foreground italic">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => <hr className="border-border my-4" />,

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-[3px] hover:text-primary/80 transition-colors duration-150"
          >
            {children}
          </a>
        ),

        // Inline code
        code: ({ children, className }) => {
          const isBlock = className?.startsWith('language-');
          if (isBlock) {
            // Block code is handled by pre
            return <code className={className}>{children}</code>;
          }
          return (
            <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-[0.875em] font-mono">
              {children}
            </code>
          );
        },

        // Code blocks (pre)
        pre: ({ children }) => {
          return <CodeBlock onOpenArtifact={onOpenArtifact}>{children}</CodeBlock>;
        },

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-lg border border-border">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border text-sm">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2.5 text-foreground/90 border-b border-border/50 text-sm">
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-muted/30 transition-colors duration-100">{children}</tr>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({
  children,
  onOpenArtifact,
}: {
  children: React.ReactNode;
  onOpenArtifact?: (title: string, content: string, language?: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  // Extract language and code text from children
  let language = '';
  let codeText = '';

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const props = child.props as { className?: string; children?: React.ReactNode };
      const className = props.className ?? '';
      const match = className.match(/language-(\w+)/);
      if (match) language = match[1];
      codeText = extractText(props.children);
    }
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border code-block-bg">
      {/* Code block header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20">
        <span className="text-xs font-medium text-muted-foreground/70 font-mono uppercase tracking-wider">
          {language || 'text'}
        </span>
        <div className="flex items-center gap-1.5">
          {onOpenArtifact && (
            <button
              onClick={() => onOpenArtifact(language ? `${language.toUpperCase()} Artifact` : 'Code Artifact', codeText, language)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-primary transition-colors duration-150 px-2 py-1 rounded hover:bg-white/5"
              aria-label="Open in Artifact panel"
            >
              <PanelRight size={12} />
              <span>Artifact</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150 px-2 py-1 rounded hover:bg-white/5"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono text-[0.8125rem] text-gray-200 whitespace-pre">
            {codeText}
          </code>
        </pre>
      </div>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return '';
}
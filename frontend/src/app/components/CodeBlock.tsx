'use client';

import React, { useState } from 'react';
import { Copy, Check, PanelRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  code: string;
  onOpenArtifact?: () => void;
}

const COLLAPSE_LINE_THRESHOLD = 15;

export default function CodeBlock({ language, code, onOpenArtifact }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isLong = code.split('\n').length > COLLAPSE_LINE_THRESHOLD;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-muted/40">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground font-mono">{language}</span>
        <div className="flex items-center gap-2">
          {isLong && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={collapsed ? 'Expand code' : 'Collapse code'}
            >
              {collapsed ? <ChevronsUpDown size={13} /> : <ChevronsDownUp size={13} />}
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
          {onOpenArtifact && (
            <button
              onClick={onOpenArtifact}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Open in side panel"
            >
              <PanelRight size={13} />
              Open in panel
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{ margin: 0, fontSize: '0.75rem', lineHeight: '1.6' }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
}

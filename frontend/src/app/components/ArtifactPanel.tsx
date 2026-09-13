'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  FileOutput,
  Code2,
  Eye,
  Columns,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Terminal,
  Trash2,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useChat } from '@/context/ChatContext';

interface ArtifactPanelProps {
  open?: boolean;
  title?: string;
  content?: string;
  language?: string;
  onClose?: () => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type LayoutMode = 'preview' | 'code' | 'split';

interface ConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default function ArtifactPanel(props: ArtifactPanelProps) {
  const { artifactPanelOpen, activeArtifact, closeArtifactPanel } = useChat();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [iframeKey, setIframeKey] = useState(0);

  const isOpen = props.open !== undefined ? props.open : artifactPanelOpen;
  const title = props.title || activeArtifact?.title || 'Artifact Studio';
  const content = props.content || activeArtifact?.content || '';
  const language = (props.language || activeArtifact?.language || '').toLowerCase();
  const handleClose = props.onClose || closeArtifactPanel;

  const isHtml = language === 'html' || content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html') || content.trim().includes('<div');
  const isSvg = language === 'svg' || content.trim().startsWith('<svg');

  // Default mode on load
  useEffect(() => {
    if (isHtml || isSvg) {
      setLayoutMode('preview');
    } else {
      setLayoutMode('code');
    }
  }, [content, language, isHtml, isSvg]);

  // Listen to sandbox console messages via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'artifact-sandbox-console') {
        const newLog: ConsoleLog = {
          id: Math.random().toString(36).substring(2, 9),
          type: event.data.type || 'log',
          message: typeof event.data.message === 'string' ? event.data.message : JSON.stringify(event.data.message),
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setConsoleLogs((prev) => [...prev.slice(-99), newLog]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sandbox injection wrapper to capture runtime errors and console outputs
  const sandboxHtml = useMemo(() => {
    if (!isHtml && !isSvg) return content;
    if (isSvg && !content.includes('<html')) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:24px;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f13;color:#fff;font-family:system-ui;}</style></head><body>${content}</body></html>`;
    }

    const consoleHook = `
      <script>
        (function() {
          function sendLog(type, args) {
            try {
              var message = Array.from(args).map(function(a) {
                if (typeof a === 'object') {
                  try { return JSON.stringify(a); } catch(e) { return String(a); }
                }
                return String(a);
              }).join(' ');
              window.parent.postMessage({ source: 'artifact-sandbox-console', type: type, message: message }, '*');
            } catch(e) {}
          }
          var _log = console.log, _warn = console.warn, _err = console.error, _info = console.info;
          console.log = function() { sendLog('log', arguments); _log.apply(console, arguments); };
          console.warn = function() { sendLog('warn', arguments); _warn.apply(console, arguments); };
          console.error = function() { sendLog('error', arguments); _err.apply(console, arguments); };
          console.info = function() { sendLog('info', arguments); _info.apply(console, arguments); };
          window.onerror = function(msg, url, line) {
            sendLog('error', ['[Runtime Error] ' + msg + ' (line ' + line + ')']);
            return false;
          };
        })();
      </script>
    `;

    if (content.includes('<head>')) {
      return content.replace('<head>', '<head>' + consoleHook);
    }
    return consoleHook + content;
  }, [content, isHtml, isSvg]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied artifact code to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language || (isHtml ? 'html' : isSvg ? 'svg' : 'txt');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'artifact'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as .${ext}`);
  };

  const handleExportPdf = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const cleanup = () => {
      if (printFrame.parentNode) document.body.removeChild(printFrame);
    };

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      cleanup();
      return;
    }

    doc.open();
    if (isHtml || isSvg) {
      doc.write(content);
    } else {
      doc.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
        <style>
          body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-word;
                 padding: 32px; font-size: 12px; line-height: 1.6; color: #1a1a1a; }
        </style>
        </head><body>${escapeHtml(content)}</body></html>`);
    }
    doc.close();

    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    setTimeout(cleanup, 1000);
  };

  const handleReloadSandbox = () => {
    setIframeKey((k) => k + 1);
    setConsoleLogs([]);
    toast.success('Sandbox reloaded');
  };

  if (!isOpen) return null;

  const deviceWidth =
    deviceMode === 'mobile' ? '375px' : deviceMode === 'tablet' ? '768px' : '100%';

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
        onClick={handleClose}
      />

      {/* Main Studio Panel */}
      <aside
        className={`
          fixed md:relative top-0 right-0 h-full z-40
          flex flex-col bg-card/95 backdrop-blur-[28px] border-l border-border
          shadow-2xl transition-all duration-300 ease-out
          ${expanded ? 'w-full md:w-[820px] lg:w-[960px]' : 'w-[95vw] md:w-[540px] lg:w-[620px]'}
        `}
      >
        {/* Apple Style Top Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {language || (isHtml ? 'HTML' : isSvg ? 'SVG' : 'CODE')}
            </span>
            <span className="text-sm font-semibold text-foreground truncate max-w-[180px] sm:max-w-[260px]">
              {title}
            </span>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopy}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleDownload}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              title="Download file"
            >
              <Download size={14} />
            </button>
            <button
              onClick={handleExportPdf}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              title="Print / Save PDF"
            >
              <FileOutput size={14} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              title={expanded ? 'Collapse' : 'Expand full width'}
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              title="Close panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Secondary Sub-Toolbar: Layout Modes & Device Framing */}
        {(isHtml || isSvg) && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/10 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/50">
              <button
                onClick={() => setLayoutMode('preview')}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                  layoutMode === 'preview'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye size={12} />
                Preview
              </button>
              <button
                onClick={() => setLayoutMode('code')}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                  layoutMode === 'code'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 size={12} />
                Code
              </button>
              <button
                onClick={() => setLayoutMode('split')}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                  layoutMode === 'split'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Columns size={12} />
                Split
              </button>
            </div>

            {/* Device Framing Toolbar (only when preview visible) */}
            {layoutMode !== 'code' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/60 border border-border/50">
                  <button
                    onClick={() => setDeviceMode('desktop')}
                    className={`p-1 rounded-md transition-all ${
                      deviceMode === 'desktop'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Desktop (100%)"
                  >
                    <Monitor size={13} />
                  </button>
                  <button
                    onClick={() => setDeviceMode('tablet')}
                    className={`p-1 rounded-md transition-all ${
                      deviceMode === 'tablet'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Tablet iPad (768px)"
                  >
                    <Tablet size={13} />
                  </button>
                  <button
                    onClick={() => setDeviceMode('mobile')}
                    className={`p-1 rounded-md transition-all ${
                      deviceMode === 'mobile'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Mobile iPhone (375px)"
                  >
                    <Smartphone size={13} />
                  </button>
                </div>

                {/* Reload Sandbox */}
                <button
                  onClick={handleReloadSandbox}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Reload sandbox"
                >
                  <RotateCcw size={12} />
                </button>

                {/* Toggle Console Drawer */}
                <button
                  onClick={() => setConsoleOpen(!consoleOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono transition-all ${
                    consoleOpen || consoleLogs.length > 0
                      ? 'bg-neutral-800 text-amber-300 border border-amber-400/30'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  title="Live Developer Console"
                >
                  <Terminal size={11} />
                  <span>{consoleLogs.length > 0 ? `Console (${consoleLogs.length})` : 'Console'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Display Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Split Mode: Left Side Code */}
          {layoutMode === 'split' && (
            <div className="w-1/2 border-r border-border overflow-auto scrollbar-thin bg-neutral-950/80">
              <pre className="p-4 text-xs font-mono text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                <code>{content}</code>
              </pre>
            </div>
          )}

          {/* Full Code Mode */}
          {layoutMode === 'code' && (
            <div className="w-full overflow-auto scrollbar-thin bg-neutral-950/80">
              <pre className="p-4 text-xs font-mono text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                <code>{content}</code>
              </pre>
            </div>
          )}

          {/* Preview Canvas Container */}
          {(layoutMode === 'preview' || layoutMode === 'split') && (
            <div
              className={`
                flex-1 flex flex-col items-center justify-center bg-neutral-950/40 p-2 overflow-auto scrollbar-thin
                ${deviceMode !== 'desktop' ? 'bg-neutral-900/50' : ''}
              `}
            >
              <div
                style={{
                  width: deviceWidth,
                  height: deviceMode !== 'desktop' ? '92%' : '100%',
                  maxHeight: deviceMode === 'mobile' ? '680px' : deviceMode === 'tablet' ? '820px' : '100%',
                  borderRadius: deviceMode !== 'desktop' ? '24px' : '0px',
                  boxShadow: deviceMode !== 'desktop' ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
                  border: deviceMode !== 'desktop' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  overflow: 'hidden',
                }}
                className="transition-all duration-300 relative bg-white"
              >
                <iframe
                  key={iframeKey}
                  srcDoc={sandboxHtml}
                  title={title}
                  sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Sandbox Developer Console Drawer */}
        {consoleOpen && (
          <div className="h-44 border-t border-border bg-neutral-950 text-neutral-200 flex flex-col shrink-0 font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-neutral-900">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                <Terminal size={12} className="text-amber-400" />
                <span>Sandbox Output Console</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConsoleLogs([])}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                  title="Clear console"
                >
                  <Trash2 size={12} />
                </button>
                <button
                  onClick={() => setConsoleOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                  title="Hide console"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-2 overflow-auto space-y-1 scrollbar-thin">
              {consoleLogs.length === 0 ? (
                <div className="text-neutral-500 italic text-[11px] p-2">
                  No logs captured. Console messages from your artifact will appear here in real time.
                </div>
              ) : (
                consoleLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 py-0.5 px-1.5 rounded text-[11.5px] leading-relaxed ${
                      log.type === 'error'
                        ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                        : log.type === 'warn'
                        ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-500'
                        : 'text-neutral-300 border-l-2 border-transparent'
                    }`}
                  >
                    <span className="text-neutral-500 text-[10px] shrink-0 select-none">
                      [{log.timestamp}]
                    </span>
                    <span className="break-all whitespace-pre-wrap">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

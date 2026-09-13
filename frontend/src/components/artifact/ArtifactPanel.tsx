import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CodeIcon,
  EyeIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  PdfIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from '../icons/PragnaIcon';

export interface ArtifactData {
  id?: string;
  title?: string;
  type?: string; // 'html' | 'svg' | 'markdown' | 'json' | 'code' | 'pdf' | 'document' | 'canvas' | string
  language?: string;
  format?: string;
  downloadUrl?: string;
  content?: string;
  canvasData?: any;
  metadata?: Record<string, any>;
}

export interface ArtifactPanelProps {
  artifact: ArtifactData | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface DetectedFileInfo {
  extension: string;
  mimeType: string;
  typeName: string;
  language: string;
  badgeColor: string;
}

/**
 * Intelligent file extension and MIME type detection
 */
export function detectArtifactFileInfo(title = '', content = '', explicitType = ''): DetectedFileInfo {
  const t = (explicitType || '').toLowerCase();
  const trimmed = (content || '').trim();

  // Document and Canvas explicit types
  if (t === 'pdf' || t === 'application/pdf') {
    return { extension: 'pdf', mimeType: 'application/pdf', typeName: 'PDF Document', language: 'pdf', badgeColor: '#ef4444' };
  }
  if (t === 'docx' || t === 'doc' || t === 'word') {
    return { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', typeName: 'Word Document', language: 'docx', badgeColor: '#3b82f6' };
  }
  if (t === 'xlsx' || t === 'xls' || t === 'excel' || t === 'spreadsheet') {
    return { extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', typeName: 'Excel Spreadsheet', language: 'xlsx', badgeColor: '#10b981' };
  }
  if (t === 'pptx' || t === 'ppt' || t === 'powerpoint' || t === 'presentation') {
    return { extension: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', typeName: 'PowerPoint Deck', language: 'pptx', badgeColor: '#f97316' };
  }
  if (t === 'canvas' || t === 'diagram' || t === 'tree' || t === 'flowchart' || t === 'timeline' || t === 'mindmap') {
    return { extension: 'json', mimeType: 'application/json;charset=utf-8', typeName: 'Interactive Canvas', language: 'json', badgeColor: '#d4af37' };
  }

  // Explicit code / markup type matching
  if (t === 'svg' || t === 'image/svg+xml') {
    return { extension: 'svg', mimeType: 'image/svg+xml;charset=utf-8', typeName: 'Vector SVG', language: 'xml', badgeColor: '#f59e0b' };
  }
  if (t === 'html' || t === 'htm' || t === 'web') {
    return { extension: 'html', mimeType: 'text/html;charset=utf-8', typeName: 'HTML5 Live', language: 'html', badgeColor: '#e06c75' };
  }
  if (t === 'md' || t === 'markdown') {
    return { extension: 'md', mimeType: 'text/markdown;charset=utf-8', typeName: 'Markdown Doc', language: 'markdown', badgeColor: '#61afef' };
  }
  if (t === 'json') {
    return { extension: 'json', mimeType: 'application/json;charset=utf-8', typeName: 'JSON Data', language: 'json', badgeColor: '#98c379' };
  }
  if (t === 'javascript' || t === 'js') {
    return { extension: 'js', mimeType: 'text/javascript;charset=utf-8', typeName: 'JavaScript', language: 'javascript', badgeColor: '#e5c07b' };
  }
  if (t === 'typescript' || t === 'ts') {
    return { extension: 'ts', mimeType: 'text/plain;charset=utf-8', typeName: 'TypeScript', language: 'typescript', badgeColor: '#56b6c2' };
  }
  if (t === 'python' || t === 'py') {
    return { extension: 'py', mimeType: 'text/x-python;charset=utf-8', typeName: 'Python Script', language: 'python', badgeColor: '#3572A5' };
  }
  if (t === 'css') {
    return { extension: 'css', mimeType: 'text/css;charset=utf-8', typeName: 'CSS Stylesheet', language: 'css', badgeColor: '#563d7c' };
  }

  // Content heuristic detection
  if (trimmed.startsWith('<svg') || (trimmed.includes('<svg') && trimmed.includes('</svg>'))) {
    return { extension: 'svg', mimeType: 'image/svg+xml;charset=utf-8', typeName: 'Vector Graphic', language: 'xml', badgeColor: '#f59e0b' };
  }

  if (
    trimmed.startsWith('<!DOCTYPE html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<body') ||
    (trimmed.includes('<div') && trimmed.includes('</div>')) ||
    (trimmed.includes('<button') && trimmed.includes('</button>'))
  ) {
    return { extension: 'html', mimeType: 'text/html;charset=utf-8', typeName: 'Interactive Web', language: 'html', badgeColor: '#e06c75' };
  }

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return { extension: 'json', mimeType: 'application/json;charset=utf-8', typeName: 'JSON Data', language: 'json', badgeColor: '#98c379' };
    } catch {
      // not valid json, continue
    }
  }

  if (
    trimmed.startsWith('# ') ||
    trimmed.startsWith('## ') ||
    trimmed.includes('### ') ||
    trimmed.includes('|---')
  ) {
    return { extension: 'md', mimeType: 'text/markdown;charset=utf-8', typeName: 'Document', language: 'markdown', badgeColor: '#61afef' };
  }

  return { extension: 'html', mimeType: 'text/html;charset=utf-8', typeName: 'Artifact Document', language: 'html', badgeColor: '#d4af37' };
}

/**
 * Builds the sandboxed iframe HTML preview with security and responsiveness
 */
function buildPreviewDocument(content = '', fileInfo: DetectedFileInfo, title = 'Artifact Preview'): string {
  const trimmed = content.trim();

  // Case 1: Pure SVG vector graphic
  if (fileInfo.extension === 'svg' || trimmed.startsWith('<svg')) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #1b1b22 0%, #0d0e12 100%);
      padding: 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: auto;
    }
    .svg-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 12px 36px rgba(0,0,0,0.55));
    }
    svg {
      max-width: 95%;
      max-height: 85vh;
      width: auto;
      height: auto;
      display: block;
    }
    @media print {
      body { background: #fff !important; }
      .svg-container { filter: none !important; }
    }
  </style>
</head>
<body>
  <div class="svg-container">
    ${trimmed}
  </div>
</body>
</html>`;
  }

  // Case 2: Complete HTML Document
  if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html')) {
    // Inject responsive meta and print stylesheet if missing
    let doc = trimmed;
    if (!doc.includes('viewport')) {
      doc = doc.replace(/<head>/i, '<head><meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
    // Inject print helper
    const printStyles = `
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      </style>
    `;
    if (doc.includes('</head>')) {
      doc = doc.replace('</head>', `${printStyles}</head>`);
    } else {
      doc = `${printStyles}${doc}`;
    }
    return doc;
  }

  // Case 3: Markdown or Plain text document
  if (fileInfo.extension === 'md') {
    // Simple fast HTML formatter for preview
    const formatted = trimmed
      .replace(/^### (.*$)/gim, '<h3 style="color:#f3c96a;margin:18px 0 8px 0;font-size:1.15em;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#f3c96a;margin:22px 0 10px 0;font-size:1.35em;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#f3c96a;margin:24px 0 12px 0;font-size:1.65em;border-bottom:1px solid rgba(212,175,55,0.3);padding-bottom:8px;">$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid #d4af37;padding-left:14px;color:#d8cbb0;margin:12px 0;font-style:italic;">$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff;">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre style="background:#141418;border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:8px;overflow-x:auto;color:#a8b2d1;font-size:13px;margin:14px 0;"><code>$2</code></pre>')
      .replace(/`([^`]+)`/gim, '<code style="background:rgba(255,255,255,0.1);color:#f3c96a;padding:2px 6px;border-radius:4px;font-size:12.5px;">$1</code>')
      .replace(/\n\n+/g, '<br/><br/>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 32px;
      line-height: 1.7;
      max-width: 860px;
      margin: 0 auto;
    }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid rgba(255,255,255,0.12); padding: 8px 12px; }
    th { background: rgba(255,255,255,0.06); color: #f3c96a; }
    @media print {
      body { background: #fff !important; color: #111 !important; }
      h1, h2, h3 { color: #000 !important; }
    }
  </style>
</head>
<body>
  <div>${formatted}</div>
</body>
</html>`;
  }

  // Case 4: Partial HTML snippet / Interactive Component
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: #ffffff;
      color: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      padding: 16px;
    }
    @media print {
      body { padding: 0 !important; background: #ffffff !important; color: #000 !important; }
    }
  </style>
</head>
<body>
  ${trimmed}
</body>
</html>`;
}

/**
 * Formats markdown text with headings, bullet points, and tables for rich document preview
 */
function renderMarkdownDocument(rawText: string) {
  if (!rawText) return null;
  const lines = rawText.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const flushTable = (key: number | string) => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1);
      elements.push(
        <div key={`table-${key}`} style={{ overflowX: 'auto', margin: '18px 0', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13.5px',
              textAlign: 'left',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(212,175,55,0.18)', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
                {header.map((col, cIdx) => (
                  <th key={cIdx} style={{ padding: '10px 14px', color: 'var(--pragna-gold-soft)', fontWeight: 700 }}>
                    {col.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    background: rIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '9px 14px', color: '#e6edf3' }}>
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.includes('---')) {
        return;
      }
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      inTable = true;
      return;
    }

    if (inTable) {
      flushTable(idx);
    }

    if (!trimmed) {
      elements.push(<div key={idx} style={{ height: '8px' }} />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} style={{ fontSize: '16px', fontWeight: 700, color: 'var(--pragna-gold-soft)', margin: '20px 0 8px 0' }}>
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} style={{ fontSize: '18px', fontWeight: 700, color: 'var(--pragna-gold-soft)', margin: '24px 0 10px 0', borderBottom: '1px solid rgba(212,175,55,0.25)', paddingBottom: '6px' }}>
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={idx} style={{ fontSize: '21px', fontWeight: 700, color: 'var(--pragna-gold-soft)', margin: '26px 0 12px 0', borderBottom: '1px solid rgba(212,175,55,0.35)', paddingBottom: '8px' }}>
          {trimmed.replace(/^#\s+/, '')}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const text = trimmed.replace(/^[-*•]\s+/, '');
      elements.push(
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', margin: '5px 0', paddingLeft: '6px' }}>
          <span style={{ color: 'var(--pragna-gold-soft)', fontWeight: 700, marginTop: '1px' }}>•</span>
          <span style={{ color: '#e6edf3', lineHeight: '1.65' }}>{text}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('> ')) {
      elements.push(
        <div key={idx} style={{ borderLeft: '3px solid #d4af37', padding: '8px 16px', background: 'rgba(212,175,55,0.08)', borderRadius: '0 8px 8px 0', margin: '14px 0', fontStyle: 'italic', color: '#f3c96a' }}>
          {trimmed.replace(/^>\s+/, '')}
        </div>
      );
      return;
    }

    elements.push(
      <p key={idx} style={{ margin: '0 0 10px 0', color: '#d8cbb0', lineHeight: '1.7' }}>
        {trimmed}
      </p>
    );
  });

  if (inTable) {
    flushTable('end');
  }

  return elements;
}

export default function ArtifactPanel({ artifact, isOpen, onClose }: ArtifactPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewportMode, setViewportMode] = useState<'responsive' | 'mobile' | 'tablet'>('responsive');
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Esc key listener to exit fullscreen or close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isOpen, onClose]);

  const title = artifact?.title || 'Interactive Artifact';
  const rawContent = artifact?.content || '';

  const fileInfo = useMemo(() => {
    return detectArtifactFileInfo(title, rawContent, artifact?.type || artifact?.language || '');
  }, [title, rawContent, artifact?.type, artifact?.language]);

  const isDocType = fileInfo.extension === 'pdf' || ['docx', 'xlsx', 'pptx'].includes(fileInfo.extension) || artifact?.format === 'pdf' || artifact?.type === 'document';

  const previewDoc = useMemo(() => {
    return buildPreviewDocument(rawContent, fileInfo, title);
  }, [rawContent, fileInfo, title]);

  // Line numbers count
  const lines = useMemo(() => {
    return rawContent.split('\n');
  }, [rawContent]);

  // Handle Direct Download with automatic file extension
  const handleDownload = () => {
    if (!artifact) return;
    if (artifact.downloadUrl) {
      const a = document.createElement('a');
      a.href = artifact.downloadUrl;
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'document';
      a.download = `${safeTitle}.${fileInfo.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (!rawContent) return;
    const blob = new Blob([rawContent], { type: fileInfo.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'artifact';
    a.download = `${safeTitle}.${fileInfo.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Export to PDF via clean printable frame
  const handleExportPdf = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      }
    } catch {
      // Cross-origin fallback or sandbox restriction
    }

    // Reliable fallback: Open dedicated printable window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(previewDoc);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
          printWindow.close();
        } catch {
          // ignore
        }
      }, 400);
    }
  };

  // Handle Copy Code
  const handleCopyCode = async () => {
    if (!rawContent) return;
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Refresh preview frame
  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Width style depending on fullscreen vs split-view
  const panelStyle = isFullscreen
    ? {
        position: 'fixed' as const,
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 60,
        background: '#0d0d11',
        display: 'flex',
        flexDirection: 'column' as const,
      }
    : isDesktop
    ? {
        position: 'relative' as const,
        height: '100%',
        width: 'min(780px, 50vw)',
        flexShrink: 0,
        zIndex: 30,
        background: 'var(--pragna-surface, #141419)',
        borderLeft: '1px solid var(--pragna-border, rgba(212,175,55,0.22))',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column' as const,
        backdropFilter: 'blur(16px)',
      }
    : {
        position: 'fixed' as const,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        maxWidth: '100vw',
        zIndex: 50,
        background: 'var(--pragna-surface, #141419)',
        display: 'flex',
        flexDirection: 'column' as const,
        backdropFilter: 'blur(16px)',
      };

  return (
    <AnimatePresence>
      {isOpen && artifact && (
        <>
          {/* Backdrop overlay (mobile or fullscreen) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-40 ${isFullscreen ? 'block' : 'lg:hidden'}`}
            onClick={isFullscreen ? () => setIsFullscreen(false) : onClose}
          />

          {/* Interactive Split-View / Fullscreen Panel */}
          <motion.div
            initial={isFullscreen ? { opacity: 0.8, scale: 0.98 } : { x: '100%' }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={isFullscreen ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={panelStyle}
            role="region"
            aria-label="Artifact side panel"
          >
            {/* Top Toolbar / Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid var(--pragna-border, rgba(255,255,255,0.08))',
                background: 'rgba(18,17,22,0.92)',
                backdropFilter: 'blur(12px)',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {/* Left Info: Icon, Title & Type Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.08))',
                    border: '1px solid rgba(212,175,55,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--pragna-gold-soft, #f3c96a)',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <CodeIcon />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '14.5px',
                        fontWeight: 650,
                        color: 'var(--pragna-text, #ffffff)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '260px',
                      }}
                      title={title}
                    >
                      {title}
                    </h3>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: 'rgba(212,175,55,0.15)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: fileInfo.badgeColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      .{fileInfo.extension}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--pragna-text-muted, #8e8e98)', marginTop: '2px' }}>
                    {fileInfo.typeName} • {lines.length} lines
                  </div>
                </div>
              </div>

              {/* Center Segmented Toggle: Preview vs Code */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '3px',
                  borderRadius: '9px',
                  border: '1px solid var(--pragna-border, rgba(255,255,255,0.08))',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: activeTab === 'preview' ? 650 : 500,
                    background: activeTab === 'preview' ? 'var(--pragna-surface-2, rgba(212,175,55,0.18))' : 'transparent',
                    color: activeTab === 'preview' ? 'var(--pragna-gold-soft, #f3c96a)' : 'var(--pragna-text-muted, #8e8e98)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <EyeIcon />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: activeTab === 'code' ? 650 : 500,
                    background: activeTab === 'code' ? 'var(--pragna-surface-2, rgba(212,175,55,0.18))' : 'transparent',
                    color: activeTab === 'code' ? 'var(--pragna-gold-soft, #f3c96a)' : 'var(--pragna-text-muted, #8e8e98)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <CodeIcon />
                  <span>Code</span>
                </button>
              </div>

              {/* Right Action Icons: Refresh, Export PDF, Download, Fullscreen, Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Refresh Preview */}
                {activeTab === 'preview' && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    title="Reload live preview"
                    style={{
                      padding: '7px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--pragna-text-muted, #a0a0a8)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:text-[var(--pragna-gold-soft)] hover:border-[rgba(212,175,55,0.35)]"
                  >
                    <RefreshCwIcon />
                  </button>
                )}

                {/* Export to PDF */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  title="Export to PDF"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 11px',
                    borderRadius: '8px',
                    border: '1px solid rgba(212,175,55,0.3)',
                    background: 'rgba(212,175,55,0.1)',
                    color: 'var(--pragna-gold-soft, #f3c96a)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:bg-[rgba(212,175,55,0.2)] hover:scale-[1.02]"
                >
                  <PdfIcon />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>

                {/* Direct Download with Detected File Extension */}
                <button
                  type="button"
                  onClick={handleDownload}
                  title={`Download .${fileInfo.extension} file`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 11px',
                    borderRadius: '8px',
                    border: '1px solid rgba(212,175,55,0.35)',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.08))',
                    color: 'var(--pragna-gold-soft, #f3c96a)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:scale-[1.02] hover:border-[var(--pragna-gold-soft)]"
                >
                  <DownloadIcon />
                  <span className="hidden sm:inline">.{fileInfo.extension}</span>
                </button>

                {/* Fullscreen Expander Button */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen'}
                  style={{
                    padding: '7px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: isFullscreen ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                    color: isFullscreen ? 'var(--pragna-gold-soft, #f3c96a)' : 'var(--pragna-text-muted, #a0a0a8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
                >
                  {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  title="Close artifact panel (Esc)"
                  style={{
                    padding: '7px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--pragna-text-muted, #8e8e98)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Main Interactive Workspace Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0d', display: 'flex' }}>
              {activeTab === 'preview' ? (
                /* Interactive Preview Viewport */
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#090a0f',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                  }}
                >
                  {isDocType ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0e0f14' }}>
                      {/* Document Toolbar Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 16px',
                          background: 'rgba(20, 20, 26, 0.96)',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          fontSize: '12px',
                          color: 'var(--pragna-text-muted)',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: fileInfo.extension === 'pdf' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                              color: fileInfo.badgeColor,
                              fontWeight: 700,
                              fontSize: '10px',
                              letterSpacing: '0.4px',
                            }}
                          >
                            {fileInfo.typeName.toUpperCase()}
                          </span>
                          <span
                            style={{
                              color: 'var(--pragna-text)',
                              fontWeight: 650,
                              maxWidth: '260px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={title}
                          >
                            {title}
                          </span>
                        </div>

                        {/* Right Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {artifact.downloadUrl && (
                            <a
                              href={artifact.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--pragna-text)',
                                textDecoration: 'none',
                                fontSize: '11.5px',
                                fontWeight: 500,
                                transition: 'all 0.12s ease',
                              }}
                              className="hover:bg-[rgba(255,255,255,0.12)]"
                            >
                              <ExternalLinkIcon size={12} />
                              <span>Open Tab</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={handleDownload}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              background: 'var(--pragna-gold-soft)',
                              color: 'var(--pragna-on-gold)',
                              border: 'none',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                            }}
                            className="hover:scale-105"
                          >
                            <DownloadIcon size={12} />
                            <span>Download {fileInfo.extension.toUpperCase()}</span>
                          </button>
                        </div>
                      </div>

                      {/* Rich Document Content Viewport */}
                      <div
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          padding: '24px 28px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: 'radial-gradient(ellipse at top, #14141d 0%, #0a0a0f 100%)',
                        }}
                        className="custom-scrollbar"
                      >
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '740px',
                            background: 'rgba(20, 20, 26, 0.88)',
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                            borderRadius: '16px',
                            padding: '28px 34px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(12px)',
                          }}
                        >
                          {/* Document Cover Header */}
                          <div style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '18px', marginBottom: '22px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(212, 175, 55, 0.15)',
                                  color: 'var(--pragna-gold-soft)',
                                  border: '1px solid rgba(212, 175, 55, 0.3)',
                                }}
                              >
                                {fileInfo.typeName}
                              </span>
                              {artifact.metadata?.page_count && (
                                <span style={{ fontSize: '12px', color: 'var(--pragna-text-muted)' }}>
                                  • {artifact.metadata.page_count} Pages
                                </span>
                              )}
                            </div>
                            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fffdf7', margin: 0, lineHeight: 1.3 }}>
                              {title}
                            </h1>
                          </div>

                          {/* Formatted Document Body */}
                          <div
                            style={{
                              color: '#d8cbb0',
                              fontSize: '14.5px',
                              lineHeight: '1.75',
                            }}
                          >
                            {rawContent ? (
                              renderMarkdownDocument(rawContent)
                            ) : (
                              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                <p style={{ color: 'var(--pragna-text-muted)', marginBottom: '16px' }}>
                                  Document successfully generated and ready for use.
                                </p>
                                {artifact.downloadUrl && (
                                  <button
                                    type="button"
                                    onClick={handleDownload}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '8px 16px',
                                      borderRadius: '8px',
                                      background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))',
                                      border: '1px solid rgba(212,175,55,0.4)',
                                      color: 'var(--pragna-gold-soft)',
                                      fontWeight: 650,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <DownloadIcon size={14} />
                                    <span>Download {fileInfo.extension.toUpperCase()}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      key={refreshKey}
                      ref={iframeRef}
                      srcDoc={previewDoc}
                      sandbox="allow-scripts allow-modals"
                      title={title}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: fileInfo.extension === 'svg' ? 'transparent' : '#ffffff',
                      }}
                    />
                  )}
                </div>
              ) : (
                /* Syntax-Highlighted Code View */
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    background: '#0d0e14',
                    overflow: 'hidden',
                  }}
                >
                  {/* Code Header Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '12px',
                      color: 'var(--pragna-text-muted, #a0a0a8)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--pragna-gold-soft, #f3c96a)', fontWeight: 600 }}>
                        {fileInfo.typeName}
                      </span>
                      <span>•</span>
                      <span>{rawContent.length} characters</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 11px',
                        borderRadius: '6px',
                        border: '1px solid rgba(212,175,55,0.25)',
                        background: 'rgba(212,175,55,0.12)',
                        color: copied ? '#4ade80' : 'var(--pragna-gold-soft, #f3c96a)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className="hover:bg-[rgba(212,175,55,0.22)]"
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  {/* Code Editor Body with Line Numbers */}
                  <div
                    style={{
                      flex: 1,
                      overflow: 'auto',
                      display: 'flex',
                      fontSize: '13px',
                      fontFamily: 'Consolas, "Fira Code", Monaco, "Cascadia Code", monospace',
                      lineHeight: '1.65',
                      padding: '12px 0',
                    }}
                    className="custom-scrollbar"
                  >
                    {/* Line Numbers Gutter */}
                    <div
                      style={{
                        padding: '0 12px 0 16px',
                        textAlign: 'right',
                        color: 'rgba(255,255,255,0.25)',
                        userSelect: 'none',
                        borderRight: '1px solid rgba(255,255,255,0.08)',
                        minWidth: '45px',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {lines.map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>

                    {/* Code Content */}
                    <div style={{ flex: 1, padding: '0 16px', overflowX: 'auto' }}>
                      <pre
                        style={{
                          margin: 0,
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          lineHeight: 'inherit',
                          color: '#e6edf3',
                          whiteSpace: 'pre',
                        }}
                      >
                        <code>{rawContent}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check, Download, FileText, ChevronDown } from 'lucide-react';
import { Message } from '../types/chat';
import MarkdownRenderer from './MarkdownRenderer';
import AppLogo from '@/components/ui/AppLogo';

interface MessageBubbleProps {
  message: Message;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  showDateSeparator?: boolean;
  dateSeparatorLabel?: string;
  onOpenArtifact?: (title: string, content: string, language?: string) => void;
  onRetry?: () => void;
}

function formatExactTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function formatInlineTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export default function MessageBubble({
  message,
  isLastMessage = false,
  isStreaming = false,
  showDateSeparator,
  dateSeparatorLabel,
  onOpenArtifact,
  onRetry,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [thumbState, setThumbState] = useState<'up' | 'down' | null>(null);
  const [openCitation, setOpenCitation] = useState<number | null>(null);
  const isThinking = message.role === 'assistant' && message.content === '' && message.isStreaming;
  const isErrorMessage = message.role === 'assistant' && (
    message.content.includes("Could not connect to the AI service") ||
    message.content.includes("Error:") ||
    message.content.startsWith("*(Error:")
  );

  const exactTimestamp = formatExactTimestamp(message.timestamp);
  const inlineTime = formatInlineTime(message.timestamp);

  // Detect any referenced or generated document files (.docx, .pdf, .xlsx, .csv, .pptx)
  const detectedDocFiles = useMemo(() => {
    if (message.role !== 'assistant' || !message.content) return [];
    const regex = /(?:Download Link:\s*\[?|File Name:\s*`?|generated_docs\/|\b)([a-zA-Z0-9_\- ]+\.(docx|pdf|xlsx|csv|pptx))\b/gi;
    const matches: { filename: string; ext: string }[] = [];
    const seen = new Set<string>();
    let m;
    while ((m = regex.exec(message.content)) !== null) {
      const clean = m[1].trim();
      const ext = m[2].toLowerCase();
      if (!seen.has(clean) && clean.length > 4) {
        seen.add(clean);
        matches.push({ filename: clean, ext });
      }
    }
    return matches;
  }, [message.content, message.role]);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Date separator for multi-day conversations */}
      {showDateSeparator && dateSeparatorLabel && (
        <div className="flex items-center gap-3 my-1.5">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[11px] text-muted-foreground/60 font-medium px-2.5 py-0.5 rounded-full bg-muted/40 border border-border/40 whitespace-nowrap">
            {dateSeparatorLabel}
          </span>
          <div className="flex-1 h-px bg-border/40" />
        </div>
      )}

      {message.role === 'user' ? (
        <div className="flex justify-end message-enter group/msg">
          <div className="flex flex-col items-end gap-0.5">
            <div className="relative max-w-[85%]">
              {/* Tooltip */}
              {exactTimestamp && (
                <div className="absolute -top-7 right-0 z-10 pointer-events-none opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150">
                  <div className="bg-popover text-popover-foreground text-[11px] px-2 py-0.5 rounded-md shadow-md border border-border/60 whitespace-nowrap">
                    {exactTimestamp}
                  </div>
                </div>
              )}
              <div className="px-4 py-2.5 rounded-2xl user-bubble-bg text-foreground text-sm leading-relaxed border border-border/50 shadow-sm">
                {message.images && message.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt={`Attached photo ${i + 1}`}
                        className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border/50"
                      />
                    ))}
                  </div>
                )}
                {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
              </div>
            </div>
            {/* Inline time */}
            {inlineTime && !message.isStreaming && (
              <span className="text-[10px] text-muted-foreground/40 pr-1 font-mono-data tracking-tight leading-none mt-0.5">{inlineTime}</span>
            )}
          </div>
        </div>
      ) : (
        /* Assistant message */
        <div className="message-enter group/msg">
          <div className="flex items-start gap-2.5">
            <div className="flex-shrink-0 w-6 h-6 mt-1 flex items-center justify-center">
              <AppLogo size={22} variant="shield" />
            </div>

            <div className="flex-1 min-w-0">
              {isThinking ? (
                <div className="inline-flex items-center gap-1.5 py-1.5 bg-transparent">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              ) : (
                <div className="relative">
                  {/* Tooltip */}
                  {exactTimestamp && !message.isStreaming && (
                    <div className="absolute -top-7 left-0 z-10 pointer-events-none opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150">
                      <div className="bg-popover text-popover-foreground text-[11px] px-2 py-0.5 rounded-md shadow-md border border-border/60 whitespace-nowrap">
                        {exactTimestamp}
                      </div>
                    </div>
                  )}

                  {/* Assistant response container bubble */}
                  <div className={`
                    relative text-sm leading-relaxed transition-all
                    ${isErrorMessage
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300 dark:text-rose-200 px-4 py-3 rounded-2xl'
                      : 'bg-transparent border-0 shadow-none text-foreground py-0.5'
                    }
                  `}>
                    <div className="prose-chat">
                      <MarkdownRenderer content={message.content} onOpenArtifact={onOpenArtifact} />
                      {message.isStreaming && (
                        <span className="streaming-cursor" aria-hidden="true" />
                      )}
                    </div>

                    {/* Detected Document Download Attachments */}
                    {!message.isStreaming && detectedDocFiles.length > 0 && (
                      <div className="mt-3.5 space-y-2">
                        {detectedDocFiles.map((doc) => (
                          <div
                            key={doc.filename}
                            className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-transparent hover:border-border/70 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-xs uppercase shrink-0">
                                {doc.ext}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-foreground truncate max-w-[280px]">
                                  {doc.filename}
                                </div>
                                <div className="text-[11px] text-muted-foreground/70">
                                  {doc.ext.toUpperCase()} Document &bull; Ready for download
                                </div>
                              </div>
                            </div>
                            <a
                              href={`/api/documents/download/${encodeURIComponent(doc.filename)}`}
                              download={doc.filename}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all active:scale-95 shrink-0 ml-3 no-underline"
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* RAG citations — passages this reply's [n] markers refer to */}
                    {!message.isStreaming && message.citations && message.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-start gap-1.5">
                        {message.citations.map((citation) => (
                          <div key={citation.index} className="flex flex-col">
                            <button
                              onClick={() =>
                                setOpenCitation(prev => (prev === citation.index ? null : citation.index))
                              }
                              className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-xs text-foreground hover:border-border transition-colors"
                            >
                              <span className="font-mono-data text-[10px] text-muted-foreground/80">
                                [{citation.index}]
                              </span>
                              <FileText size={12} className="text-muted-foreground shrink-0" />
                              <span className="max-w-[160px] truncate">{citation.filename}</span>
                              <ChevronDown
                                size={11}
                                className={`transition-transform ${openCitation === citation.index ? 'rotate-180' : ''}`}
                              />
                            </button>
                            {openCitation === citation.index && (
                              <div className="mt-1 max-w-[320px] p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground leading-snug">
                                {citation.snippet}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action row — only show when message is complete */}
              {!message.isStreaming && !isThinking && message.content && (
                <div className="flex items-center gap-1 mt-1.5 pl-0.5">
                  <div className="flex items-center gap-0.5 opacity-40 group-hover/msg:opacity-100 transition-opacity duration-200">
                    {!isErrorMessage && (
                      <>
                        <ActionButton
                          icon={copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          label={copied ? 'Copied!' : 'Copy response'}
                          onClick={copyMessage}
                        />
                        <ActionButton
                          icon={<ThumbsUp size={12} className={thumbState === 'up' ? 'text-primary fill-primary/20' : ''} />}
                          label="Good response"
                          onClick={() => setThumbState(prev => prev === 'up' ? null : 'up')}
                          active={thumbState === 'up'}
                        />
                        <ActionButton
                          icon={<ThumbsDown size={12} className={thumbState === 'down' ? 'text-rose-400 fill-rose-400/20' : ''} />}
                          label="Bad response"
                          onClick={() => setThumbState(prev => prev === 'down' ? null : 'down')}
                          active={thumbState === 'down'}
                        />
                      </>
                    )}
                    <ActionButton
                      icon={<RotateCcw size={12} className={isErrorMessage ? 'text-rose-400' : ''} />}
                      label="Retry response"
                      onClick={() => onRetry ? onRetry() : copyMessage()}
                      active={isErrorMessage}
                    />
                  </div>

                  {/* Inline time for assistant */}
                  {inlineTime && (
                    <span className="ml-1 text-[10px] text-muted-foreground/40 font-mono-data tracking-tight leading-none">{inlineTime}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({
  icon, label, onClick, active = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        p-1 rounded-md transition-all duration-150 active:scale-90
        ${active
          ? 'text-primary bg-primary/10' : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/60'
        }
      `}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check, Volume2, VolumeX } from 'lucide-react';
import { Message } from '../types/chat';
import MarkdownRenderer from './MarkdownRenderer';
import AppLogo from '@/components/ui/AppLogo';
import { detectIndianLanguage, cleanTextForSpeech } from '@/lib/indianLanguages';

interface MessageBubbleProps {
  message: Message;
  isLastMessage: boolean;
  isStreaming: boolean;
  showDateSeparator?: boolean;
  dateSeparatorLabel?: string;
  onOpenArtifact?: (title: string, content: string, language?: string) => void;
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
  isLastMessage,
  isStreaming,
  showDateSeparator,
  dateSeparatorLabel,
  onOpenArtifact,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [thumbState, setThumbState] = useState<'up' | 'down' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isThinking = message.role === 'assistant' && message.content === '' && message.isStreaming;

  const exactTimestamp = formatExactTimestamp(message.timestamp);
  const inlineTime = formatInlineTime(message.timestamp);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Second click stops talking
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    // First click: stop any currently playing speech and talk this message
    window.speechSynthesis.cancel();
    window.dispatchEvent(new CustomEvent('pragna:speech-started', { detail: { id: message.id } }));

    const cleanText = cleanTextForSpeech(message.content);
    if (!cleanText) return;

    const detected = detectIndianLanguage(cleanText);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = detected?.bcp47 || 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const exact = voices.find(v => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase()));
      const langPrefix = voices.find(v => detected && v.lang.toLowerCase().startsWith(detected.id.toLowerCase()));
      const indianVoice = voices.find(v => v.lang.toLowerCase().includes('-in'));
      const femaleVoice = voices.find(v => /female|zira|samantha|prerna|aditi|swara|shruti|kavya|lekha/i.test(v.name));

      utterance.voice = exact || langPrefix || indianVoice || femaleVoice || voices[0];
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, message.content, message.id, stopSpeaking]);

  // Synchronize speech state when another message bubble starts speaking
  useEffect(() => {
    const handleOtherSpeech = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id !== message.id) {
        setIsSpeaking(false);
      }
    };

    window.addEventListener('pragna:speech-started', handleOtherSpeech);
    return () => {
      window.removeEventListener('pragna:speech-started', handleOtherSpeech);
    };
  }, [message.id]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  return (
    <>
      {/* Date separator for multi-day conversations */}
      {showDateSeparator && dateSeparatorLabel && (
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground/60 font-medium px-2 py-0.5 rounded-full bg-muted/40 border border-border/40 whitespace-nowrap">
            {dateSeparatorLabel}
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
      )}

      {message.role === 'user' ? (
        <div className="flex justify-end message-enter group/msg">
          <div className="flex flex-col items-end gap-1">
            <div className="relative max-w-[85%]">
              {/* Tooltip */}
              {exactTimestamp && (
                <div className="absolute -top-8 right-0 z-10 pointer-events-none opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150">
                  <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md border border-border/60 whitespace-nowrap">
                    {exactTimestamp}
                  </div>
                </div>
              )}
              <div className="px-4 py-3 rounded-2xl user-bubble-bg text-foreground text-sm leading-relaxed border border-border/50 shadow-sm">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
            {/* Inline time */}
            {inlineTime && !message.isStreaming && (
              <span className="text-[11px] text-muted-foreground/50 pr-1">{inlineTime}</span>
            )}
          </div>
        </div>
      ) : (
        /* Assistant message */
        <div className="message-enter group/msg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 mt-0.5 flex items-center justify-center">
              <AppLogo size={24} variant="shield" />
            </div>

            <div className="flex-1 min-w-0">
              {isThinking ? (
                <div className="flex items-center gap-1.5 py-2">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              ) : (
                <div className="relative">
                  {/* Tooltip */}
                  {exactTimestamp && !message.isStreaming && (
                    <div className="absolute -top-8 left-0 z-10 pointer-events-none opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150">
                      <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md border border-border/60 whitespace-nowrap">
                        {exactTimestamp}
                      </div>
                    </div>
                  )}
                  <div className="prose-chat">
                    <MarkdownRenderer content={message.content} onOpenArtifact={onOpenArtifact} />
                    {message.isStreaming && (
                      <span className="streaming-cursor" aria-hidden="true" />
                    )}
                  </div>
                </div>
              )}

              {/* Action row — only show when message is complete */}
              {!message.isStreaming && !isThinking && message.content && (
                <div className="flex items-center gap-0.5 mt-3 -ml-1">
                  <ActionButton
                    icon={
                      isSpeaking ? (
                        <VolumeX size={14} className="text-primary animate-pulse" />
                      ) : (
                        <Volume2 size={14} />
                      )
                    }
                    label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                    onClick={toggleSpeech}
                    active={isSpeaking}
                  />
                  <ActionButton
                    icon={copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    label={copied ? 'Copied!' : 'Copy response'}
                    onClick={copyMessage}
                  />
                  <ActionButton
                    icon={<ThumbsUp size={14} className={thumbState === 'up' ? 'text-primary fill-primary/20' : ''} />}
                    label="Good response"
                    onClick={() => setThumbState(prev => prev === 'up' ? null : 'up')}
                    active={thumbState === 'up'}
                  />
                  <ActionButton
                    icon={<ThumbsDown size={14} className={thumbState === 'down' ? 'text-red-500 fill-red-500/20' : ''} />}
                    label="Bad response"
                    onClick={() => setThumbState(prev => prev === 'down' ? null : 'down')}
                    active={thumbState === 'down'}
                  />
                  <ActionButton
                    icon={<RotateCcw size={14} />}
                    label="Regenerate response"
                    onClick={() => {}}
                  />
                  {/* Inline time for assistant */}
                  {inlineTime && (
                    <span className="ml-1 text-[11px] text-muted-foreground/50">{inlineTime}</span>
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
        p-1.5 rounded-md transition-all duration-150 active:scale-90
        ${active
          ? 'text-primary bg-primary/10' : 'text-muted-foreground/60 hover:text-muted-foreground action-btn-hover'
        }
      `}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
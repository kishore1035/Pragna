'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Square, Paperclip, Mic } from 'lucide-react';
import { ModelOption } from '../types/chat';
import ModelSelector from './ModelSelector';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
}

export default function ChatInput({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  selectedModel,
  models,
  onSelectModel,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'cowork'>('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  const handleSend = useCallback(() => {
    if (!value.trim() || isStreaming) return;
    onSendMessage(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div
      className={`
        relative rounded-2xl border bg-card transition-all duration-200
        ${isFocused
          ? 'border-border shadow-md ring-2 ring-primary/10'
          : 'border-border/70 shadow-sm hover:border-border'
        }
      `}
    >
      {/* Textarea */}
      <div className="flex items-start gap-2 px-4 pt-3.5 pb-1">
        <button
          className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 transition-colors duration-150"
          aria-label="Attach file"
        >
          <Paperclip size={15} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Message the assistant..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40
            resize-none outline-none leading-relaxed min-h-[26px] max-h-[200px] py-0.5"
          aria-label="Message input"
        />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Left: mode tabs */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border/40">
            {(['chat', 'cowork'] as const).map((tab) => (
              <button
                key={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-150
                  ${activeTab === tab
                    ? 'bg-card text-foreground shadow-sm border border-border/40'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Right: model + voice + send */}
        <div className="flex items-center gap-1.5">
          <ModelSelector
            selectedModel={selectedModel}
            models={models}
            onSelectModel={onSelectModel}
            compact
          />

          <button
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 transition-colors duration-150"
            aria-label="Voice input"
          >
            <Mic size={14} />
          </button>

          {isStreaming ? (
            <button
              onClick={onStopStreaming}
              className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center
                hover:bg-foreground/80 transition-all duration-150 active:scale-90 flex-shrink-0 shadow-sm"
              aria-label="Stop generating"
            >
              <Square size={11} className="text-background fill-background" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200 active:scale-90 flex-shrink-0
                ${canSend
                  ? 'bg-primary hover:bg-primary/90 shadow-sm cursor-pointer'
                  : 'bg-muted cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              <ArrowUp size={14} className={canSend ? 'text-white' : 'text-muted-foreground/40'} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
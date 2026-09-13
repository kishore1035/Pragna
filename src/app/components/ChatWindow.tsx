'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PanelLeftOpen, Share2, ChevronDown, ArrowDown, Mic, Code2, LayoutGrid, Wrench, Search } from 'lucide-react';
import { Conversation, ModelOption } from '../types/chat';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';
import AppLogo from '@/components/ui/AppLogo';

interface ChatWindowProps {
  conversation: Conversation | null;
  isStreaming: boolean;
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  onNewConversation: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onOpenArtifact?: (title: string, content: string, language?: string) => void;
  onToggleArtifact?: () => void;
  isArtifactOpen?: boolean;
  onOpenCommandPalette?: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenTools?: () => void;
}

export default function ChatWindow({
  conversation,
  isStreaming,
  selectedModel,
  models,
  onSelectModel,
  onSendMessage,
  onStopStreaming,
  onNewConversation,
  onToggleSidebar,
  sidebarOpen,
  onOpenArtifact,
  onToggleArtifact,
  isArtifactOpen,
  onOpenCommandPalette,
  onOpenVoiceAssistant,
  onOpenTools,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distFromBottom < 80;
    isAtBottomRef.current = atBottom;
    setShowJumpToBottom(!atBottom && (conversation?.messages.length ?? 0) > 0);
  }, [conversation?.messages.length]);

  useEffect(() => {
    if (isStreaming && isAtBottomRef.current) {
      scrollToBottom(false);
    }
  });

  useEffect(() => {
    setTimeout(() => scrollToBottom(false), 50);
    setShowJumpToBottom(false);
  }, [conversation?.id, scrollToBottom]);

  const hasMessages = (conversation?.messages.length ?? 0) > 0;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full relative bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-12 flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 flex-shrink-0"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          {hasMessages && conversation ? (
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate max-w-[280px] lg:max-w-[400px]">
                {conversation.title}
              </span>
              <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
            </div>
          ) : (
            !sidebarOpen && (
              <div className="flex items-center gap-2">
                <AppLogo size={22} variant="shield" />
                <span className="text-sm font-bold text-foreground tracking-tight">Pragna</span>
              </div>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Command Palette */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-all"
              title="Command Palette (Cmd+K)"
            >
              <Search size={13} />
              <span className="hidden md:inline text-[0.6875rem] font-mono bg-muted-foreground/10 px-1 py-0.5 rounded">⌘K</span>
            </button>
          )}

          {/* Voice Assistant */}
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-all"
              title="Voice Assistant"
            >
              <Mic size={14} />
            </button>
          )}

          {/* Tools & Skills */}
          {onOpenTools && (
            <button
              onClick={onOpenTools}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-all"
              title="Tools & Skills"
            >
              <Wrench size={14} />
            </button>
          )}

          {/* Artifacts side panel toggle */}
          {onToggleArtifact && (
            <button
              onClick={onToggleArtifact}
              className={`p-1.5 rounded-lg border transition-all ${
                isArtifactOpen
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border/60'
              }`}
              title="Toggle Artifacts Side Panel"
            >
              <LayoutGrid size={14} />
            </button>
          )}

          {/* Plan badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/70 ml-1">
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[0.6875rem] font-medium tracking-wide">
              Free
            </span>
          </div>

          {hasMessages && (
            <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
              text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60
              transition-all duration-150 active:scale-95">
              <Share2 size={12} />
              Share
            </button>
          )}
        </div>
      </header>

      {/* Chat area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {hasMessages && conversation ? (
          <MessageList
            messages={conversation.messages}
            isStreaming={isStreaming}
            onOpenArtifact={onOpenArtifact}
          />
        ) : (
          <EmptyState
            onSendMessage={onSendMessage}
            selectedModel={selectedModel}
            models={models}
            onSelectModel={onSelectModel}
            onStopStreaming={onStopStreaming}
            isStreaming={isStreaming}
          />
        )}
      </div>

      {/* Jump to bottom pill */}
      {showJumpToBottom && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 jump-pill">
          <button
            onClick={() => scrollToBottom(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium
              bg-card border border-border shadow-md text-muted-foreground hover:text-foreground
              hover:bg-muted transition-all duration-150 active:scale-95"
          >
            <ArrowDown size={12} />
            Jump to latest
          </button>
        </div>
      )}

      {/* Input area — only shown when conversation is active */}
      {hasMessages && (
        <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-border/30 bg-background/60 backdrop-blur-sm">
          <div className="max-w-chat mx-auto">
            <ChatInput
              onSendMessage={onSendMessage}
              onStopStreaming={onStopStreaming}
              isStreaming={isStreaming}
              selectedModel={selectedModel}
              models={models}
              onSelectModel={onSelectModel}
            />
            <p className="text-center text-[0.6875rem] text-muted-foreground/50 mt-2 tracking-wide">
              Pragna may make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
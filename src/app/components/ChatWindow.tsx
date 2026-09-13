'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PanelLeftOpen, Share2, ChevronDown, ArrowDown, Mic, Code2, LayoutGrid, Wrench, Search } from 'lucide-react';
import { Conversation, ModelOption } from '../types/chat';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import PromptInput from '@/components/ui/ai-chat-input';
import EmptyState from './EmptyState';
import AppLogo from '@/components/ui/AppLogo';
import IndianLanguageSelector from '@/components/ui/IndianLanguageSelector';
import { IndianLanguage, DEFAULT_INDIAN_LANGUAGE } from '@/lib/indianLanguages';

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
  selectedLanguage?: IndianLanguage;
  onSelectLanguage?: (lang: IndianLanguage) => void;
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
  selectedLanguage = DEFAULT_INDIAN_LANGUAGE,
  onSelectLanguage,
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
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distFromBottom < 80;
    isAtBottomRef.current = atBottom;
    setShowJumpToBottom(!atBottom && distFromBottom > 200);
  }, []);

  // Auto-scroll when new content arrives if already near bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(false);
    }
  }, [conversation?.messages, isStreaming, scrollToBottom]);

  const hasMessages = (conversation?.messages.length ?? 0) > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
      {/* Top Header Bar */}
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-border/40 bg-background/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 min-w-0">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          {hasMessages && conversation ? (
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate max-w-[240px] lg:max-w-[360px]">
                {conversation.title}
              </span>
              <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
            </div>
          ) : (
            !sidebarOpen && (
              <div className="flex items-center">
                <AppLogo size={24} variant="full" />
              </div>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Indian Language Selector */}
          {onSelectLanguage && (
            <IndianLanguageSelector
              selectedLanguage={selectedLanguage}
              onSelectLanguage={onSelectLanguage}
              variant="compact"
              placement="bottom"
              align="right"
            />
          )}

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
              className="p-1.5 rounded-lg text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all"
              title="Talk to Pragna (Voice Assistant)"
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
              className={`p-1.5 rounded-lg transition-all border ${
                isArtifactOpen
                  ? 'text-primary bg-primary/10 border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border/60'
              }`}
              title="Toggle Artifact Panel"
            >
              <Code2 size={14} />
            </button>
          )}
        </div>
      </div>

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
            selectedLanguage={selectedLanguage}
            onSelectLanguage={onSelectLanguage}
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
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-border/30 bg-background/80 backdrop-blur-md">
          <div className="max-w-chat mx-auto flex flex-col items-center">
            {/* Active Language Bar */}
            {onSelectLanguage && (
              <div className="w-full flex items-center justify-between px-2 mb-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🇮🇳</span>
                  <span>Responding in: <strong className="text-foreground">{selectedLanguage.name} ({selectedLanguage.nativeName})</strong></span>
                </div>
                <IndianLanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={onSelectLanguage}
                  variant="compact"
                  placement="top"
                  align="right"
                />
              </div>
            )}

            <PromptInput
              onSubmit={(msg, meta) => {
                if (meta?.model && onSelectModel) {
                  const found = models.find(m => m.label === meta.model || m.id === meta.model);
                  if (found) onSelectModel(found);
                }
                onSendMessage(msg);
              }}
              placeholder={selectedLanguage.placeholder}
              initialModel={selectedModel?.label || "Tvarā"}
              models={models.map(m => m.label)}
              onModelChange={(modelLabel) => {
                const found = models.find(m => m.label === modelLabel || m.id === modelLabel);
                if (found && onSelectModel) onSelectModel(found);
              }}
              isStreaming={isStreaming}
              onStopStreaming={onStopStreaming}
              collapsedWidth={440}
              expandedWidth={720}
              bcp47={selectedLanguage?.bcp47}
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
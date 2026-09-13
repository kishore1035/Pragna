'use client';

import React, { useState, useEffect } from 'react';
import { ModelOption } from '../types/chat';
import PromptInput from '@/components/ui/ai-chat-input';
import AppLogo from '@/components/ui/AppLogo';

interface EmptyStateProps {
  onSendMessage: (content: string) => void;
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
}

const GREETING_HOUR_RANGES = [
  { min: 5, max: 11, label: 'Good morning' },
  { min: 11, max: 17, label: 'Good afternoon' },
  { min: 17, max: 21, label: 'Good evening' },
  { min: 21, max: 24, label: 'Good evening' },
  { min: 0, max: 5, label: 'Late night' },
];

export default function EmptyState({
  onSendMessage,
  selectedModel,
  models,
  onSelectModel,
  onStopStreaming,
  isStreaming,
}: EmptyStateProps) {
  const [greeting, setGreeting] = useState('Hello');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    const range = GREETING_HOUR_RANGES.find(r => {
      if (r.min === 0) return hour >= 0 && hour < r.max;
      return hour >= r.min && hour < r.max;
    });
    setGreeting(range?.label ?? 'Hello');
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center min-h-full px-4 py-16 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-8">

        {/* Greeting with Pragna Shield */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex items-center justify-center group mb-1">
            <AppLogo
              size={54}
              variant="shield"
              className="drop-shadow-[0_4px_24px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight leading-tight">
            {greeting}, <span className="gold-gradient-text">where should we start?</span>
          </h1>
        </div>

        {/* Centered PromptInput with Pragna Theme */}
        <div className="w-full flex justify-center py-2">
          <PromptInput
            onSubmit={(msg, meta) => {
              if (meta?.model && onSelectModel) {
                const found = models.find(m => m.label === meta.model || m.id === meta.model);
                if (found) onSelectModel(found);
              }
              onSendMessage(msg);
            }}
            placeholder="Ask Pragna anything..."
            initialModel={selectedModel?.label || "Tvarā"}
            models={models.map(m => m.label)}
            onModelChange={(modelLabel) => {
              const found = models.find(m => m.label === modelLabel || m.id === modelLabel);
              if (found && onSelectModel) onSelectModel(found);
            }}
            isStreaming={isStreaming}
            onStopStreaming={onStopStreaming}
            collapsedWidth={420}
            expandedWidth={720}
          />
        </div>

        <p className="text-center text-[0.6875rem] text-muted-foreground/40 tracking-wider">
          Pragna may make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
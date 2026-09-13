'use client';

import React, { useState, useEffect } from 'react';
import { Code2, BookOpen, PenLine, Zap } from 'lucide-react';
import { ModelOption } from '../types/chat';
import ChatInput from './ChatInput';
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

const SUGGESTED_PROMPTS = [
  {
    id: 'prompt-debug',
    category: 'Code',
    Icon: Code2,
    text: 'Debug my TypeScript function',
    detail: 'Paste your code and find subtle edge-case issues',
    accent: 'text-primary',
    bg: 'bg-card/80 hover:bg-card',
    iconBg: 'bg-primary/10 border border-primary/20',
    span: 'col-span-1',
  },
  {
    id: 'prompt-explain',
    category: 'Explain',
    Icon: BookOpen,
    text: 'Explain how React Server Components work',
    detail: 'Clear architectural breakdown with code samples',
    accent: 'text-primary',
    bg: 'bg-card/80 hover:bg-card',
    iconBg: 'bg-primary/10 border border-primary/20',
    span: 'col-span-1 sm:col-span-2',
  },
  {
    id: 'prompt-write',
    category: 'Reasoning',
    Icon: PenLine,
    text: 'Formulate an executive system design',
    detail: 'Scalable microservices, caching, and database strategy',
    accent: 'text-primary',
    bg: 'bg-card/80 hover:bg-card',
    iconBg: 'bg-primary/10 border border-primary/20',
    span: 'col-span-1 sm:col-span-2',
  },
  {
    id: 'prompt-review',
    category: 'Fast Assist',
    Icon: Zap,
    text: 'Analyze and summarize this document',
    detail: 'Extract key takeaways, metrics, and actionable items',
    accent: 'text-primary',
    bg: 'bg-card/80 hover:bg-card',
    iconBg: 'bg-primary/10 border border-primary/20',
    span: 'col-span-1',
  },
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
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center min-h-full px-4 py-10 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <div className="max-w-chat w-full mx-auto flex flex-col gap-7">

        {/* Greeting with Pragna Shield */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Pragna Shield Icon mark */}
          <div className="relative mb-1">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border shadow-premium-md flex items-center justify-center p-2 relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5 opacity-60 group-hover:opacity-100 transition-opacity" />
              <AppLogo size={36} variant="shield" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            {greeting}, <span className="gold-gradient-text">where should we start?</span>
          </h1>
          <p className="text-sm sm:text-[0.9375rem] text-muted-foreground max-w-sm leading-relaxed">
            Ask anything, brainstorm complex ideas, or choose a prompt to begin.
          </p>
        </div>

        {/* Centered input */}
        <div className="w-full">
          <ChatInput
            onSendMessage={onSendMessage}
            onStopStreaming={onStopStreaming}
            isStreaming={isStreaming}
            selectedModel={selectedModel}
            models={models}
            onSelectModel={onSelectModel}
          />
        </div>

        {/* Suggested prompts — asymmetric bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={prompt.id}
              onClick={() => onSendMessage(prompt.text)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`
                ${prompt.span} ${prompt.bg}
                flex flex-col items-start gap-2 px-4 py-4 rounded-2xl border border-border/70
                text-left transition-all duration-200 active:scale-[0.98] group
                hover:border-primary/40 hover:shadow-premium-sm
                prompt-card-enter
              `}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${prompt.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <prompt.Icon size={14} className={prompt.accent} strokeWidth={2} />
                </div>
                <span className={`text-[0.6875rem] font-semibold uppercase tracking-widest ${prompt.accent} opacity-90`}>
                  {prompt.category}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">{prompt.text}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{prompt.detail}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-[0.6875rem] text-muted-foreground/50 tracking-wide">
          Pragna may make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
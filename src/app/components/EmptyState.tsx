'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Code2, BookOpen, PenLine, Zap } from 'lucide-react';
import { ModelOption } from '../types/chat';
import ChatInput from './ChatInput';

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
  { min: 21, max: 24, label: 'Evening' },
  { min: 0, max: 5, label: 'Evening' },
];

const SUGGESTED_PROMPTS = [
  {
    id: 'prompt-debug',
    category: 'Code',
    Icon: Code2,
    text: 'Debug my TypeScript function',
    detail: 'Paste your code and describe what\'s going wrong',
    accent: 'text-amber-500',
    bg: 'bg-amber-500/8 hover:bg-amber-500/12',
    iconBg: 'bg-amber-500/10',
    span: 'col-span-1',
  },
  {
    id: 'prompt-explain',
    category: 'Explain',
    Icon: BookOpen,
    text: 'Explain how React Server Components work',
    detail: 'Clear breakdown with examples and when to use them',
    accent: 'text-sky-500',
    bg: 'bg-sky-500/8 hover:bg-sky-500/12',
    iconBg: 'bg-sky-500/10',
    span: 'col-span-1 sm:col-span-2',
  },
  {
    id: 'prompt-write',
    category: 'Write',
    Icon: PenLine,
    text: 'Write a technical blog post outline',
    detail: 'On a topic of your choice',
    accent: 'text-violet-500',
    bg: 'bg-violet-500/8 hover:bg-violet-500/12',
    iconBg: 'bg-violet-500/10',
    span: 'col-span-1 sm:col-span-2',
  },
  {
    id: 'prompt-review',
    category: 'Quick task',
    Icon: Zap,
    text: 'Summarize this article for me',
    detail: 'Paste any text and get a concise summary',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-500/8 hover:bg-emerald-500/12',
    iconBg: 'bg-emerald-500/10',
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

        {/* Greeting */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          {/* Icon mark */}
          <div className="relative mb-1">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={20} className="text-primary" strokeWidth={1.5} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>

          <h1 className="text-[1.75rem] font-semibold text-foreground tracking-tight leading-tight">
            {greeting}
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground max-w-xs leading-relaxed">
            Ask anything, or pick a prompt below to get started.
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
                flex flex-col items-start gap-2 px-4 py-4 rounded-2xl border border-border/60
                text-left transition-all duration-200 active:scale-[0.98] group
                hover:border-border hover:shadow-sm
                prompt-card-enter
              `}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${prompt.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <prompt.Icon size={14} className={prompt.accent} strokeWidth={2} />
                </div>
                <span className={`text-[0.6875rem] font-semibold uppercase tracking-widest ${prompt.accent} opacity-80`}>
                  {prompt.category}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">{prompt.text}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{prompt.detail}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-[0.6875rem] text-muted-foreground/40 tracking-wide">
          ClaudeChat may make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
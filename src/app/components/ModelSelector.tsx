'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Brain, Gauge, Sparkles, Cpu } from 'lucide-react';
import { ModelOption } from '../types/chat';
import { getModelConfig } from '@/lib/modelDisplayNames';

interface ModelSelectorProps {
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
  compact?: boolean;
}

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'deepseek-chat': <Zap size={13} />,
  'claude-sonnet-4-5': <Brain size={13} />,
  'claude-opus-4-5': <Sparkles size={13} />,
  'claude-haiku-3-5': <Gauge size={13} />,
  'google/gemma-4-31b-it:free': <Cpu size={13} />,
  'nvidia/nemotron-3-super-120b-a12b:free': <Gauge size={13} />,
};

export default function ModelSelector({
  selectedModel, models, onSelectModel, compact = false
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = getModelConfig(selectedModel.id) || getModelConfig(selectedModel.label);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        title={currentConfig?.tooltip || selectedModel.label}
        data-ascii={currentConfig?.asciiFallback}
        className={`
          flex items-center gap-1.5 rounded-lg text-muted-foreground
          hover:text-foreground hover:bg-muted transition-all duration-150
          ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
        `}
        aria-label={`Select model. Current: ${currentConfig?.tooltip || selectedModel.label}`}
        aria-expanded={open}
      >
        <span className="font-medium text-foreground">
          {currentConfig?.displayName ?? selectedModel.label}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-card border border-border rounded-xl shadow-premium-lg z-50 overflow-hidden">
          <div className="p-1.5">
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-border/40 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Model
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                Sanskrit Edition
              </span>
            </div>
            {models.map((model) => {
              const config = getModelConfig(model.id) || getModelConfig(model.label);
              const isSelected = selectedModel.id === model.id;
              return (
                <button
                  key={`model-${model.id}`}
                  onClick={() => {
                    onSelectModel(model);
                    setOpen(false);
                  }}
                  title={config?.tooltip || `${model.label} — ${model.description}`}
                  aria-label={config?.tooltip || model.label}
                  data-ascii={config?.asciiFallback}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-sm transition-colors duration-100 text-left ${
                    isSelected ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="text-primary flex-shrink-0">
                    {MODEL_ICONS[model.id] ?? <Brain size={13} />}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                    <p className="font-medium text-foreground text-xs truncate">
                      {config?.displayName ?? model.label}
                    </p>
                    {config?.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 ml-auto flex-shrink-0">
                        {config.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
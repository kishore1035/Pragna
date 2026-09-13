'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Brain, Gauge } from 'lucide-react';
import { ModelOption } from '../types/chat';

interface ModelSelectorProps {
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
  compact?: boolean;
}

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'claude-sonnet-4-5': <Brain size={13} />,
  'claude-opus-4-5': <Zap size={13} />,
  'claude-haiku-3-5': <Gauge size={13} />,
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

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`
          flex items-center gap-1 rounded-lg text-muted-foreground
          hover:text-foreground hover:bg-muted transition-all duration-150
          ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
        `}
        aria-label="Select model"
        aria-expanded={open}
      >
        <span className="font-medium">
          {compact ? selectedModel.label.split(' ').slice(1).join(' ') : selectedModel.label}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-1.5">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Model
            </p>
            {models.map((model) => (
              <button
                key={`model-${model.id}`}
                onClick={() => {
                  onSelectModel(model);
                  setOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors duration-100 text-left"
              >
                <span className="text-primary flex-shrink-0">
                  {MODEL_ICONS[model.id] ?? <Brain size={13} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{model.label}</p>
                  <p className="text-xs text-muted-foreground">{model.description}</p>
                </div>
                {selectedModel.id === model.id && (
                  <Check size={14} className="text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
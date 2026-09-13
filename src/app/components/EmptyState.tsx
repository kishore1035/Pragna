'use client';

import React, { useState, useEffect } from 'react';
import { ModelOption } from '../types/chat';
import PromptInput from '@/components/ui/ai-chat-input';
import AppLogo from '@/components/ui/AppLogo';
import IndianLanguageSelector from '@/components/ui/IndianLanguageSelector';
import { IndianLanguage, INDIAN_LANGUAGES, DEFAULT_INDIAN_LANGUAGE } from '@/lib/indianLanguages';
import { Globe } from 'lucide-react';

interface EmptyStateProps {
  onSendMessage: (content: string) => void;
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelectModel: (model: ModelOption) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  selectedLanguage?: IndianLanguage;
  onSelectLanguage?: (lang: IndianLanguage) => void;
}

const POPULAR_INDIAN_LANGUAGES = [
  'en-IN',
  'hi',
  'te',
  'ta',
  'ur',
  'bn',
  'mr',
  'kn',
  'ml',
  'gu',
  'pa',
];

export default function EmptyState({
  onSendMessage,
  selectedModel,
  models,
  onSelectModel,
  onStopStreaming,
  isStreaming,
  selectedLanguage = DEFAULT_INDIAN_LANGUAGE,
  onSelectLanguage,
}: EmptyStateProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`h-full flex flex-col items-center justify-center px-4 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      <div className="w-full max-w-chat flex flex-col items-center gap-6 text-center">
        {/* Pragna Logo & Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-500" />
            <AppLogo size={56} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {selectedLanguage.id !== 'en-IN' ? (
                <>
                  <span className="gold-gradient-text">{selectedLanguage.nativeName}</span> में प्रज्ञा से बात करें
                </>
              ) : (
                <>
                  Experience <span className="gold-gradient-text">Pragna</span>
                </>
              )}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            {selectedLanguage.greeting}
          </p>
        </div>

        {/* Indian Language Selector & Quick Chips */}
        {onSelectLanguage && (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
              {POPULAR_INDIAN_LANGUAGES.map((code) => {
                const lang = INDIAN_LANGUAGES.find((l) => l.id === code);
                if (!lang) return null;
                const isSelected = selectedLanguage.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => onSelectLanguage(lang)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${isSelected
                        ? 'bg-amber-400 text-neutral-950 font-semibold shadow-sm'
                        : 'bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                      }`}
                  >
                    <span>{lang.nativeName}</span>
                  </button>
                );
              })}

              <IndianLanguageSelector
                selectedLanguage={selectedLanguage}
                onSelectLanguage={onSelectLanguage}
                variant="compact"
              />
            </div>
          </div>
        )}

        {/* Centered PromptInput with Pragna Theme */}
        <div className="w-full flex justify-center py-2">
          <PromptInput
            onSubmit={(msg, meta) => {
              if (meta?.model && onSelectModel) {
                const found = models.find(
                  (m) => m.label === meta.model || m.id === meta.model
                );
                if (found) onSelectModel(found);
              }
              onSendMessage(msg);
            }}
            placeholder={selectedLanguage.placeholder}
            initialModel={selectedModel?.label || 'Tvarā'}
            models={models.map((m) => m.label)}
            onModelChange={(modelLabel) => {
              const found = models.find(
                (m) => m.label === modelLabel || m.id === modelLabel
              );
              if (found && onSelectModel) onSelectModel(found);
            }}
            isStreaming={isStreaming}
            onStopStreaming={onStopStreaming}
            collapsedWidth={420}
            expandedWidth={720}
            bcp47={selectedLanguage?.bcp47}
          />
        </div>

        <p className="text-center text-[0.6875rem] text-muted-foreground/40 tracking-wider">
          Pragna Indian Multilingual Companion • Responses formulated strictly in your chosen Indian language
        </p>
      </div>
    </div>
  );
}
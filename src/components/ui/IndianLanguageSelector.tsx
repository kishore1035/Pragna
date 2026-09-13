'use client';

import React, { useState, useRef, useEffect } from 'react';
import { INDIAN_LANGUAGES, IndianLanguage } from '@/lib/indianLanguages';
import { Globe, Check, Search, ChevronDown } from 'lucide-react';

export function IndiaFlagIcon({ className = 'w-4 h-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={`rounded-[2px] overflow-hidden shadow-xs shrink-0 inline-block align-middle ${className}`}
      aria-label="India Flag"
    >
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <rect y="10.66" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" strokeWidth="0.5" />
      <circle cx="12" cy="8" r="0.4" fill="#000080" />
    </svg>
  );
}

interface IndianLanguageSelectorProps {
  selectedLanguage: IndianLanguage;
  onSelectLanguage: (lang: IndianLanguage) => void;
  className?: string;
  variant?: 'pill' | 'compact' | 'modal';
  placement?: 'top' | 'bottom' | 'auto';
  align?: 'left' | 'right';
}

export default function IndianLanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  className = '',
  variant = 'pill',
  placement = 'auto',
  align = 'right',
}: IndianLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  // Placement class logic
  const isTop = placement === 'top' || (placement === 'auto' && variant === 'compact');
  const placementClass = isTop ? 'bottom-full mb-2' : 'top-full mt-2';
  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 shadow-sm bg-white/5 hover:bg-white/10 border-white/15 text-white/90 hover:text-white"
          title="Choose Indian Language"
        >
          <IndiaFlagIcon className="w-3.5 h-2.5 shrink-0" />
          <span className="whitespace-nowrap font-medium">
            {selectedLanguage.nativeName}
          </span>
          <span className="text-[10px] text-white/50 hidden sm:inline">
            ({selectedLanguage.name})
          </span>
          <ChevronDown
            className={`w-3 h-3 text-white/60 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : variant === 'modal' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 truncate">
            <IndiaFlagIcon className="w-4 h-3 shrink-0" />
            <span className="font-semibold text-amber-300">{selectedLanguage.name}</span>
            <span className="text-white/60">({selectedLanguage.nativeName})</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-white/50 ml-2 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-300 transition-all shadow-sm active:scale-95"
          title="Select Indian Language"
        >
          <IndiaFlagIcon className="w-3.5 h-2.5 shrink-0" />
          <span className="font-semibold">
            {selectedLanguage.name}
          </span>
          <span className="text-white/70 font-normal">
            ({selectedLanguage.nativeName})
          </span>
          <ChevronDown
            className={`w-3 h-3 text-amber-400/70 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${placementClass} ${alignClass} z-50 w-72 max-h-80 rounded-2xl bg-[#141418] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header & Search */}
          <div className="p-3 border-b border-white/10 bg-white/[0.04]">
            <div className="flex items-center justify-between pb-2 px-1">
              <div className="flex items-center gap-1.5">
                <IndiaFlagIcon className="w-3.5 h-2.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Indian Languages
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">
                {INDIAN_LANGUAGES.length} Languages
              </span>
            </div>
            <div className="relative flex items-center mt-1">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Hindi, Telugu, Tamil..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.08] transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* List of Languages */}
          <div className="overflow-y-auto flex-1 p-1.5 prompt-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-white/40">
                No matching Indian language found
              </div>
            ) : (
              filtered.map((lang) => {
                const isSelected = selectedLanguage.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      onSelectLanguage(lang);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30'
                        : 'text-white/80 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left truncate">
                      <IndiaFlagIcon className="w-3.5 h-2.5 shrink-0" />
                      <div className="flex flex-col truncate">
                        <span className="text-white/95 font-medium truncate">
                          {lang.nativeName}
                        </span>
                        <span className="text-[10px] text-white/50 truncate">
                          {lang.name} • {lang.script}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

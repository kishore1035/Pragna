'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

interface FolderTreeProps {
  activeFolder: string;
  onSelect: (id: string) => void;
  totalCount: number;
}

export default function FolderTree({ activeFolder, onSelect, totalCount }: FolderTreeProps) {
  const [expanded, setExpanded] = useState(true);

  const categories = [
    { id: 'all', name: 'All Conversations', icon: <MessageSquare size={15} />, count: totalCount },
  ];

  return (
    <div className="w-56 shrink-0 border-r border-border h-full flex flex-col bg-muted/30">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
        >
          <ChevronRight
            size={14}
            className={`transition-transform text-muted-foreground ${expanded ? 'rotate-90' : ''}`}
          />
          History
        </button>
      </div>

      {expanded && (
        <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                activeFolder === cat.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-md shrink-0 bg-primary/10 text-primary">
                {cat.icon}
              </span>
              <span className="flex-1 text-left truncate">{cat.name}</span>
              <span className="text-xs font-mono-data text-muted-foreground">{cat.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Storage / Summary indicator */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-xs text-muted-foreground mb-1">Total Saved Chats</p>
        <p className="text-xs font-semibold text-foreground">{totalCount} {totalCount === 1 ? 'conversation' : 'conversations'}</p>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MessageSquare,
  X,
  Clock,
  Trash2,
} from 'lucide-react';
import { ApiConversation } from '@/lib/api';
import { useChat } from '@/context/ChatContext';

interface ConversationListProps {
  conversations: ApiConversation[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  totalCount: number;
  onSelectConversation: (id: number) => Promise<void>;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString.includes('Z') ? isoString : isoString + 'Z');
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export default function ConversationList({
  conversations,
  searchQuery,
  onSearchChange,
  totalCount,
  onSelectConversation,
}: ConversationListProps) {
  const router = useRouter();
  const { deleteConversation } = useChat();

  const handleSelect = async (id: number) => {
    await onSelectConversation(id);
    router.push('/');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-border shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="px-5 py-2.5 border-b border-border shrink-0">
        <span className="text-xs text-muted-foreground font-mono-data">{totalCount} {totalCount === 1 ? 'conversation' : 'conversations'}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <MessageSquare size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No conversations found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'Try a different search term or clear the search.' : 'Start a new chat to see it here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className="group flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {conv.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-mono-data">
                    <Clock size={11} />
                    {formatDate(conv.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                  <Link
                    href="/"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(conv.id);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0 font-medium"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

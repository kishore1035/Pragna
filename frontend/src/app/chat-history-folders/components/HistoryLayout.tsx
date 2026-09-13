'use client';

import React, { useState, useMemo } from 'react';
import FolderTree from './FolderTree';
import ConversationList from './ConversationList';
import { useChat } from '@/context/ChatContext';

export default function HistoryLayout() {
  const { conversations, searchQuery, setSearchQuery, loadConversation } = useChat();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = conversations || [];
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.title?.toLowerCase()?.includes(q));
    }
    return list;
  }, [conversations, searchQuery]);

  return (
    <div className="flex h-full">
      <FolderTree
        activeFolder={activeFilter}
        onSelect={setActiveFilter}
        totalCount={conversations?.length || 0}
      />
      <ConversationList
        conversations={filtered}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={filtered.length}
        onSelectConversation={loadConversation}
      />
    </div>
  );
}

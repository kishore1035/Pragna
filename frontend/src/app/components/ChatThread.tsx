'use client';

import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { useChat } from '@/context/ChatContext';

interface ChatThreadProps {
  onOpenArtifact: (title: string, content: string, language?: string) => void;
}

export default function ChatThread({ onOpenArtifact }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming } = useChat();

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id ?? `pending-${i}`}
            message={{
              id: String(msg.id ?? i),
              role: msg.role,
              content: msg.content,
              timestamp: (msg as any).timestamp || new Date().toISOString(),
              isStreaming: isStreaming && i === messages.length - 1 && msg.role === 'assistant',
            }}
            onOpenArtifact={onOpenArtifact}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

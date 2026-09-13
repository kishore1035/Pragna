'use client';

import React from 'react';
import { Message } from '../types/chat';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  onOpenArtifact?: (title: string, content: string, language?: string) => void;
}

function getDateLabel(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDay.getTime() === today.getTime()) return 'Today';
    if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday';

    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: msgDay.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

function getDayKey(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  } catch {
    return '';
  }
}

export default function MessageList({ messages, isStreaming, onOpenArtifact }: MessageListProps) {
  return (
    <div className="max-w-chat mx-auto px-4 py-6 space-y-6">
      {messages.map((message, index) => {
        const currentDayKey = getDayKey(message.timestamp);
        const prevDayKey = index > 0 ? getDayKey(messages[index - 1].timestamp) : null;
        const showDateSeparator = currentDayKey !== '' && currentDayKey !== prevDayKey;
        const dateSeparatorLabel = showDateSeparator ? getDateLabel(message.timestamp) : undefined;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isLastMessage={index === messages.length - 1}
            isStreaming={isStreaming && index === messages.length - 1}
            showDateSeparator={showDateSeparator}
            dateSeparatorLabel={dateSeparatorLabel}
            onOpenArtifact={onOpenArtifact}
          />
        );
      })}
    </div>
  );
}
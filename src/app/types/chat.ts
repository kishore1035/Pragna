export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
  language?: string;
}

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

export interface ModelOption {
  id: string;
  label: string;
  description: string;
}
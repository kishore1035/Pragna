export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  images?: string[]; // base64 data URLs of attached photos
}

export interface Source {
  id: number;
  filename: string;
  chunkCount: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
  sources?: Source[];
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
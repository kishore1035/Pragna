'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ArtifactPanel from './ArtifactPanel';
import CommandPalette from './CommandPalette';
import VoiceAssistantModal from './VoiceAssistantModal';
import ToolsPanel from './ToolsPanel';
import { Conversation, Message, ModelOption } from '../types/chat';
import { generateId, getConversationTitle, groupConversationsByDate } from '../utils/chatUtils';
import { SANSKRIT_MODELS } from '@/lib/modelDisplayNames';

export const MODELS: ModelOption[] = SANSKRIT_MODELS.map((m) => ({
  id: m.id,
  label: m.displayName,
  description: m.subtitle,
}));

const STORAGE_KEY = 'claudechat_conversations';
const ACTIVE_KEY = 'claudechat_active';
const THEME_KEY = 'claudechat_theme';

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

function loadTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mimir-integrated feature states
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<{ title: string; content: string; language?: string } | null>(null);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);

  const handleOpenArtifact = useCallback((title: string, content: string, language?: string) => {
    setActiveArtifact({ title, content, language });
    setArtifactOpen(true);
  }, []);

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Load from localStorage after mount
  useEffect(() => {
    const savedConvs = loadConversations();
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    const savedTheme = loadTheme();
    setConversations(savedConvs);
    setActiveConversationId(savedActive);
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, mounted]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: generateId('conv'),
      title: 'New conversation',
      messages: [],
      model: selectedModel.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      saveConversations(updated);
      return updated;
    });
    setActiveConversationId(newConv.id);
    localStorage.setItem(ACTIVE_KEY, newConv.id);
  }, [selectedModel.id]);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveConversations(updated);
      return updated;
    });
    if (activeConversationId === id) {
      setActiveConversationId(null);
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [activeConversationId]);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c
      );
      saveConversations(updated);
      return updated;
    });
  }, []);

  // Backend integration point: replace simulateStream with real fetch to /api/chat
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    let convId = activeConversationId;
    let isNewConv = false;

    if (!convId) {
      const newConv: Conversation = {
        id: generateId('conv'),
        title: getConversationTitle(content),
        messages: [],
        model: selectedModel.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      convId = newConv.id;
      isNewConv = true;
      setConversations(prev => {
        const updated = [newConv, ...prev];
        saveConversations(updated);
        return updated;
      });
      setActiveConversationId(convId);
      localStorage.setItem(ACTIVE_KEY, convId);
    }

    const userMessage: Message = {
      id: generateId('msg'),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Add user message
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== convId) return c;
        const msgs = [...c.messages, userMessage];
        return {
          ...c,
          messages: msgs,
          title: isNewConv ? getConversationTitle(content) : c.title,
          updatedAt: new Date().toISOString(),
        };
      });
      saveConversations(updated);
      return updated;
    });

    setIsStreaming(true);

    const assistantMessageId = generateId('msg');
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    // Add empty assistant message (thinking state)
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== convId) return c;
        return { ...c, messages: [...c.messages, assistantMessage] };
      });
      saveConversations(updated);
      return updated;
    });

    // BACKEND INTEGRATION: Replace this simulation with:
    // const response = await fetch('/api/chat', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ messages: [...existingMessages, userMessage], model: selectedModel.id }),
    // });
    // const reader = response.body?.getReader();
    // const decoder = new TextDecoder();
    // while (true) {
    //   const { done, value } = await reader.read();
    //   if (done) break;
    //   const chunk = decoder.decode(value);
    //   // parse SSE chunks and append tokens
    let streamedAny = false;
    try {
      const currentConv = conversations.find(c => c.id === convId);
      const history = (currentConv?.messages || []).map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content });

      const customKey = typeof window !== 'undefined' ? localStorage.getItem('claudechat_custom_api_key') : null;
      let customPrompt = typeof window !== 'undefined' ? localStorage.getItem('claudechat_system_prompt') : null;
      if (customPrompt && (customPrompt.includes('Claude') || customPrompt.includes('Anthropic') || customPrompt.includes('helpful AI assistant.'))) {
        localStorage.removeItem('claudechat_system_prompt');
        customPrompt = null;
      }

      if (typeof window !== 'undefined') {
        const nameMatch = content.match(/\b(?:my name is|i am|call me|i'm)\s+([A-Za-z]{2,20})\b/i);
        if (nameMatch) {
          const candidate = nameMatch[1].trim();
          const invalid = ['a', 'an', 'the', 'here', 'just', 'trying', 'working', 'looking', 'sorry', 'fine', 'good', 'happy', 'busy', 'online', 'curious', 'not', 'asking', 'thinking', 'pragna', 'claude', 'assistant', 'bot'];
          if (!invalid.includes(candidate.toLowerCase())) {
            const formatted = candidate.charAt(0).toUpperCase() + candidate.slice(1);
            localStorage.setItem('claudechat_user_name', formatted);
          }
        }
      }

      const clientUserName = typeof window !== 'undefined' ? localStorage.getItem('claudechat_user_name') || 'Vinay' : 'Vinay';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          model: selectedModel.id,
          apiKey: customKey || undefined,
          systemPrompt: customPrompt || undefined,
          userName: clientUserName,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') break;
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const delta = data.choices?.[0]?.delta?.content || '';
                if (delta) {
                  streamedAny = true;
                  setConversations(prev => {
                    const updated = prev.map(c => {
                      if (c.id !== convId) return c;
                      return {
                        ...c,
                        messages: c.messages.map(m =>
                          m.id === assistantMessageId
                            ? { ...m, content: m.content + delta, isStreaming: true }
                            : m
                        ),
                      };
                    });
                    saveConversations(updated);
                    return updated;
                  });
                }
              } catch {
                // Ignore chunk parse error
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error from /api/chat:', err);
    }

    // If no stream tokens received (e.g. backend error or network failure)
    if (!streamedAny) {
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== convId) return c;
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: "Could not connect to the AI service. Please verify your connection or try again.", isStreaming: false }
                : m
            ),
          };
        });
        saveConversations(updated);
        return updated;
      });
    }

    // Mark streaming complete
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === assistantMessageId ? { ...m, isStreaming: false } : m
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      saveConversations(updated);
      return updated;
    });

    setIsStreaming(false);
  }, [activeConversationId, isStreaming, selectedModel.id, conversations]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    // Mark any streaming messages as complete
    setConversations(prev => {
      const updated = prev.map(c => ({
        ...c,
        messages: c.messages.map(m => ({ ...m, isStreaming: false })),
      }));
      saveConversations(updated);
      return updated;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const groupedConversations = groupConversationsByDate(conversations);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
        conversations={conversations}
        groupedConversations={groupedConversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenArtifacts={() => setArtifactOpen(p => !p)}
        onOpenVoice={() => setVoiceModalOpen(true)}
        onOpenTools={() => setToolsPanelOpen(true)}
        onOpenSearch={() => setCmdPaletteOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden min-w-0">
        <ChatWindow
          conversation={activeConversation}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          models={MODELS}
          onSelectModel={setSelectedModel}
          onSendMessage={sendMessage}
          onStopStreaming={stopStreaming}
          onNewConversation={createNewConversation}
          onToggleSidebar={() => setSidebarOpen(p => !p)}
          sidebarOpen={sidebarOpen}
          onOpenArtifact={handleOpenArtifact}
          onToggleArtifact={() => setArtifactOpen(p => !p)}
          isArtifactOpen={artifactOpen}
          onOpenCommandPalette={() => setCmdPaletteOpen(true)}
          onOpenVoiceAssistant={() => setVoiceModalOpen(true)}
          onOpenTools={() => setToolsPanelOpen(true)}
        />
        {/* Live Claude-style Artifact side panel */}
        <ArtifactPanel
          open={artifactOpen}
          title={activeArtifact?.title || 'Artifact Viewer'}
          content={activeArtifact?.content || ''}
          language={activeArtifact?.language || 'typescript'}
          onClose={() => setArtifactOpen(false)}
        />
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        open={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSendMessage={(text) => {
          setVoiceModalOpen(false);
          sendMessage(text);
        }}
      />

      {/* Tools & Skills Modal */}
      {toolsPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
            <ToolsPanel onClose={() => setToolsPanelOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
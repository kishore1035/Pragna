'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ArtifactPanel from './ArtifactPanel';
import CommandPalette from './CommandPalette';
import ToolsPanel from './ToolsPanel';
import { Conversation, Message, ModelOption, Source } from '../types/chat';
import { generateId, getConversationTitle, groupConversationsByDate } from '../utils/chatUtils';
import { SANSKRIT_MODELS } from '@/lib/modelDisplayNames';
import { getAuthToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

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
  const { user } = useAuth();
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
    // One-time backfill: earlier versions left conversations titled "New conversation"
    // even after real messages were sent into them. Derive a real title wherever we can.
    let backfilled = false;
    const fixedConvs = savedConvs.map(c => {
      if (c.title !== 'New conversation') return c;
      const firstUserMsg = c.messages.find(m => m.role === 'user');
      if (!firstUserMsg) return c;
      backfilled = true;
      return { ...c, title: getConversationTitle(firstUserMsg.content) };
    });
    if (backfilled) saveConversations(fixedConvs);

    const savedActive = localStorage.getItem(ACTIVE_KEY);
    const savedTheme = loadTheme();
    setConversations(fixedConvs);
    setActiveConversationId(savedActive);
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  // Poll scheduled reminders and surface the ones that fired while we weren't
  // watching (toast + a message dropped into whichever conversation is open).
  const activeConversationIdRef = React.useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!user) return;
    const seenCompletedIds = new Set<string | number>();
    let firstPoll = true;

    const poll = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch('/api/tools/scheduled', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const jobs: any[] = data?.jobs || [];
        const completed = jobs.filter(j => j.status === 'completed');

        if (firstPoll) {
          // Don't fire toasts for reminders that already completed before this
          // tab was open — just establish the baseline.
          completed.forEach(j => seenCompletedIds.add(j.id));
          firstPoll = false;
          return;
        }

        for (const job of completed) {
          if (seenCompletedIds.has(job.id)) continue;
          seenCompletedIds.add(job.id);
          toast(job.prompt, { icon: '⏰', duration: 10000 });

          const convId = activeConversationIdRef.current;
          if (convId) {
            setConversations(prev => {
              const updated = prev.map(c => {
                if (c.id !== convId) return c;
                const reminderMsg: Message = {
                  id: generateId('msg'),
                  role: 'assistant',
                  content: `⏰ **Reminder:** ${job.prompt}`,
                  timestamp: new Date().toISOString(),
                };
                return { ...c, messages: [...c.messages, reminderMsg], updatedAt: new Date().toISOString() };
              });
              saveConversations(updated);
              return updated;
            });
          }
        }
      } catch {
        // Network hiccup — just try again on the next tick.
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [user]);

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

  const attachSource = useCallback((source: Source) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== activeConversationIdRef.current) return c;
        if (c.sources?.some(s => s.id === source.id)) return c;
        return { ...c, sources: [...(c.sources || []), source] };
      });
      saveConversations(updated);
      return updated;
    });
  }, []);

  const removeSource = useCallback((sourceId: number) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== activeConversationIdRef.current) return c;
        return { ...c, sources: (c.sources || []).filter(s => s.id !== sourceId) };
      });
      saveConversations(updated);
      return updated;
    });
  }, []);

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
  const sendMessage = useCallback(async (content: string, images?: string[], newSources?: Source[]) => {
    if ((!content.trim() && !images?.length && !newSources?.length) || isStreaming) return;
    const titleSource = content.trim() || (images?.length ? 'Shared a photo' : 'Shared a file');

    let convId = activeConversationId;
    // "New conversation" is also true for a conversation pre-created empty by the
    // "+ New chat" button — not just one created in this very call — so its title
    // still gets derived from the first real message sent into it.
    let isNewConv = convId ? conversations.find(c => c.id === convId)?.messages.length === 0 : false;

    if (!convId) {
      const newConv: Conversation = {
        id: generateId('conv'),
        title: getConversationTitle(titleSource),
        messages: [],
        model: selectedModel.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: newSources?.length ? newSources : undefined,
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
    } else if (newSources?.length) {
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== convId) return c;
          const existing = c.sources || [];
          const merged = [...existing, ...newSources.filter(s => !existing.some(e => e.id === s.id))];
          return { ...c, sources: merged };
        });
        saveConversations(updated);
        return updated;
      });
    }

    const userMessage: Message = {
      id: generateId('msg'),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      images,
    };

    // Add user message
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== convId) return c;
        const msgs = [...c.messages, userMessage];
        return {
          ...c,
          messages: msgs,
          title: isNewConv ? getConversationTitle(titleSource) : c.title,
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
      const history = (currentConv?.messages || []).map(m => ({ role: m.role, content: m.content, images: m.images }));
      history.push({ role: 'user', content, images });
      // currentConv reflects state as of the last render — for a brand-new
      // conversation created earlier in this same call, its sources won't be
      // visible there yet, so fold in newSources directly rather than relying
      // solely on the (stale) conversations lookup.
      const effectiveSources = [
        ...(currentConv?.sources || []),
        ...((newSources || []).filter(s => !(currentConv?.sources || []).some(e => e.id === s.id))),
      ];

      const customKey = typeof window !== 'undefined' ? localStorage.getItem('claudechat_custom_api_key') : null;
      let customPrompt = typeof window !== 'undefined' ? localStorage.getItem('claudechat_system_prompt') : null;
      if (customPrompt && (customPrompt.includes('Claude') || customPrompt.includes('Anthropic') || customPrompt.includes('helpful AI assistant.'))) {
        localStorage.removeItem('claudechat_system_prompt');
        customPrompt = null;
      }

      if (typeof window !== 'undefined') {
        const nickMatch = content.match(/\b(?:my nickname is|nickname is|my nick is|call me nickname)\s+["']?([A-Za-z0-9_-]{2,30})["']?\b/i);
        if (nickMatch) {
          const formatted = nickMatch[1].trim();
          localStorage.setItem('claudechat_user_nickname', formatted.charAt(0).toUpperCase() + formatted.slice(1));
        }

        const nameMatch = content.match(/\b(?:my name is|i am|i'm)\s+([A-Za-z]{2,20})\b/i);
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
      const clientUserNickname = typeof window !== 'undefined' ? localStorage.getItem('claudechat_user_nickname') || undefined : undefined;

      const authToken = getAuthToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          messages: history,
          model: selectedModel.id,
          apiKey: customKey || undefined,
          systemPrompt: customPrompt || undefined,
          userName: clientUserName,
          userNickname: clientUserNickname,
          sourceDocumentIds: effectiveSources.length ? effectiveSources.map(s => s.id) : undefined,
        }),
        // Server-side retries/fallbacks can legitimately take a while; this is a
        // last-resort ceiling so a fully stuck request still surfaces an error
        // instead of leaving the UI stuck on "thinking" forever.
        signal: AbortSignal.timeout(90000),
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
          onOpenTools={() => setToolsPanelOpen(true)}
          sources={activeConversation?.sources}
          onAttachSource={attachSource}
          onRemoveSource={removeSource}
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
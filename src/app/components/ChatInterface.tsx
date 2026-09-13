'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ArtifactPanel from './ArtifactPanel';
import CommandPalette from './CommandPalette';
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

    // If no stream tokens received (e.g. offline or fallback needed)
    if (!streamedAny) {
      await simulateStream(content, (token) => {
        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map(m =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + token, isStreaming: true }
                  : m
              ),
            };
          });
          saveConversations(updated);
          return updated;
        });
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

// Simulated streaming responses with realistic AI-style content
async function simulateStream(userInput: string, onToken: (token: string) => void): Promise<void> {
  const responses = getMockResponse(userInput);
  const tokens = responses.split('');
  
  // Simulate thinking delay
  await new Promise(r => setTimeout(r, 400 + Math.floor(tokens.length * 0.1)));

  for (let i = 0; i < tokens.length; i++) {
    await new Promise(r => setTimeout(r, 8 + (tokens[i] === ' ' ? 2 : 0)));
    onToken(tokens[i]);
  }
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('code') || lower.includes('function') || lower.includes('javascript') || lower.includes('python') || lower.includes('typescript')) {
    return `Here's a clean implementation for that:

\`\`\`typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<ApiResponse<T>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      const data = await response.json();
      return { data, status: response.status, message: 'Success' };
    } catch (error) {
      if (attempt === retries) throw error;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
\`\`\`

**Key design decisions:**

1. **Generic type parameter** \`T\` makes it reusable across different response shapes
2. **Exponential backoff** prevents hammering the server on transient failures
3. **Structured return type** gives callers consistent access to status and data
4. **Re-throws on final attempt** so callers can handle the failure appropriately

You can extend this with request cancellation using \`AbortController\` if you need timeout support.`;
  }

  if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does')) {
    return `Great question. Let me break this down clearly.

## The Core Concept

At its heart, this is about understanding how **systems communicate** under uncertainty. There are three layers to consider:

### 1. The Signal Layer
This is where raw information travels — bytes, packets, tokens. The signal doesn't care about meaning; it just moves data from point A to point B.

### 2. The Interpretation Layer
Here's where things get interesting. The receiver must *decode* the signal and assign meaning. This requires:
- A shared **schema** or protocol
- Sufficient **context** to resolve ambiguity
- Error-correction when the signal degrades

### 3. The Action Layer
Finally, the interpreted meaning triggers a response. This response feeds back into the system, creating a loop.

> The most common failure mode isn't at the signal layer — it's at the interpretation layer, where two parties think they're speaking the same language but aren't.

**Practical implication:** Always validate your assumptions about shared context before assuming communication succeeded.`;
  }

  if (lower.includes('list') || lower.includes('best') || lower.includes('top') || lower.includes('recommend')) {
    return `Here are my top recommendations, ordered by impact:

## Tier 1: High Impact, Low Effort

1. **Start with the 80/20 rule** — Identify the 20% of work that produces 80% of results. Most people spend equal time on everything; ruthless prioritization is a superpower.

2. **Batch context-switching** — Every switch between tasks costs ~15 minutes of recovery time. Group similar work into blocks rather than mixing deep work with messages.

3. **Write things down immediately** — Working memory holds ~4 items at once. Offload to a trusted system the moment a thought arrives.

## Tier 2: High Impact, Higher Effort

4. **Build feedback loops** — The faster you get signal on whether something is working, the faster you can correct. This applies to code, writing, strategy, and relationships.

5. **Invest in your tools** — A developer who spends 2 hours learning their editor saves 10 minutes a day — that's a 4-day payback period. Compound this across years. 6. **Teach what you learn** — The act of explaining something reveals every gap in your understanding. It's the most efficient form of self-assessment.

## Tier 3: Compounding Over Time

7. **Build in public** — Sharing work-in-progress creates accountability, attracts collaborators, and generates feedback you'd never get otherwise.

8. **Maintain a decision log** — Record why you made key decisions. Future-you will thank present-you when reviewing what was known at the time.

Want me to go deeper on any of these?`;
  }

  if (lower.includes('help') || lower.includes('stuck') || lower.includes('problem') || lower.includes('issue')) {
    return `I'm here to help. Let's work through this systematically.

**First, let's clarify the situation:**

When you're stuck, it usually falls into one of three categories:

| Type | Symptoms | Approach |
|------|----------|----------|
| **Knowledge gap** | "I don't know how to do X" | Research, examples, documentation |
| **Decision paralysis** | "I know the options but can't choose" | Criteria matrix, reversibility check |
| **Execution block** | "I know what to do but can't start" | Time-box, reduce scope, change environment |

**My suggestion:** Describe the specific point where you're blocked — the more concrete, the better. Include: 1. What you're trying to achieve
2. What you've already tried
3. Where exactly things break down or feel unclear

The more precise the problem statement, the more useful my response will be. Vague questions get vague answers — let's make this concrete.`;
  }

  // Default thoughtful response
  return `That's a thoughtful prompt. Here's how I'd approach it:

The key insight is that most complex questions have **a simple frame and a complicated interior**. Finding the right frame is usually 80% of the work.

In this case, I'd suggest thinking about it along two axes:

**Axis 1: What you can control**
Focus your energy here. Systems, habits, decisions, responses — these are within your sphere of influence. Optimizing things outside this sphere is usually wasted effort.

**Axis 2: What matters in the long run**
Many things feel urgent but aren't important. The reverse — important but not urgent — is where most high-leverage work lives. Protecting time for non-urgent important work is one of the hardest and most valuable skills to develop.

Where these two axes intersect — things you control *and* that matter long-term — is where to direct sustained attention.

Is there a specific aspect of this you'd like me to explore further? I can go deeper on any part of this, provide concrete examples, or help you apply the framework to your specific situation.`;
}
import { NextRequest } from 'next/server';
import { AGENT_TOOLS_SCHEMA, executeTool } from '@/lib/agent-tools';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Map UI model IDs to reliable OpenRouter model slugs
const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
  'claude-opus-4-5': 'anthropic/claude-opus-4.5',
  'claude-haiku-3-5': 'anthropic/claude-sonnet-4.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
  'deepseek-v3': 'deepseek/deepseek-chat',
  'gemma-free': 'google/gemma-4-31b-it:free',
};

const SYSTEM_PROMPT = `You are Pragna, an intelligent, articulate, and thoughtful AI assistant created by EtherX Innovations.

Identity & Organization:
- Name: Pragna
- Company: EtherX Innovations
- Internal Team: IgniteX team
- Team Structure: Within the IgniteX team at EtherX Innovations, there were three specialized teams working on different breakthrough projects. One of those three teams created and developed Pragna.
- Product Interfaces: Pragna operates across three distinct interfaces:
  1. Pragna Chatbot — Conversational AI assistant for dialogue, knowledge synthesis, reasoning, and daily workflows.
  2. Pragna Code — Dedicated engineering and programming assistant for code generation, software architecture, debugging, refactoring, and technical tasks.
  3. Coword — Collaborative workspace and document intelligence interface for seamless teamwork, shared knowledge, and content co-creation.

Current Date: September 2026.

You have access to tools for live information retrieval and execution (web_search, web_extract, x_search, read_file, write_file, patch, search_files, terminal, run_python_code, todo, memory, kanban, image_generate).

MANDATORY RESPONSE FORMATTING RULES (follow these on EVERY response):
1. Use rich markdown formatting in ALL responses — never output plain unformatted paragraphs.
2. For any response with multiple points, categories, sections, or comparisons:
   - Use bold headers (e.g., **Section Name:**) to label each section.
   - Use bullet lists (- item) or numbered lists (1. item) for listing points.
   - Bold key terms, names, or important phrases using **bold**.
3. For short direct answers (single sentence): plain prose is fine.
4. For comparisons, ratings, analysis, opinions: ALWAYS use structured sections with bold headers and bullet points.
5. For lists of pros/cons, features, steps, options: ALWAYS use bullet points.
6. Never write walls of plain text — break up anything longer than 2 sentences into structured markdown.
7. When writing code, format it in standard markdown code blocks (\`\`\`language\n...\n\`\`\`).

MANDATORY WEB SEARCH RULES — FOLLOW THESE WITHOUT EXCEPTION:
You have a web_search tool. Your training data has a cutoff and IS OFTEN WRONG OR OUTDATED for real-world facts. The current date is September 2026.

You MUST call web_search BEFORE answering ANY question that involves:
- Current or "who is" political leaders (CM, PM, President, Governor, Mayor, CEO, etc.)
- Current news, recent events, latest scores, match results
- Current prices (stock, crypto, fuel, gold, etc.)
- Recent elections, appointments, resignations, deaths
- Any fact that could have changed since 2024

NEVER answer these from memory. Your training data is stale — if you answer without searching, you WILL give wrong information and embarrass yourself. Search first, then answer.

For timeless knowledge (math, history before 2024, how-to explanations, coding, general concepts) — no search needed.

CRITICAL TOOL & RESPONSE RULES:
1. NEVER expose raw tool invocations or metadata in your reply to the user.
2. Answer the question directly — NO preamble like "Based on the search results..." or "According to my web search...". Just state the answer.
3. STRICT NO-EMOJI RESTRICTION: Do NOT display or include any emojis anywhere in your replies under any circumstances.`;


function stripEmojis(text: string): string {
  if (!text) return '';
  return text.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
}

function sseChunk(content: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content: stripEmojis(content) } }],
  })}\n\n`;
}

// Keep this list TIGHT — false positives send chat through the slow non-streaming tool-deliberation loop.
// Only trigger for messages that CANNOT be answered without executing a real tool.
function queryNeedsTools(messages: any[]): boolean {
  if (!messages || messages.length === 0) return false;
  const last = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const triggers = [
    'search for ', 'google for ', 'browse to ', 'web search',
    'run python', 'run code', 'execute code', 'run this script',
    'open terminal', 'run in terminal',
    'write to file', 'save to file', 'read file',
    'add to kanban', 'add to todo',
  ];
  return triggers.some(t => last.includes(t));
}

function getMemoryFilePaths(): string[] {
  const baseDir = process.cwd().endsWith('frontend')
    ? process.cwd()
    : path.join(process.cwd(), 'frontend');
  return [path.join(baseDir, 'data', 'memories.json')];
}

// In-process memory cache to avoid reading memories.json on every single request
let _memoriesCache: { userName: string; userNickname: string; memories: string[] } | null = null;
let _memoriesCacheAge = 0;
const CACHE_TTL_MS = 5000; // refresh from disk every 5 seconds max

function loadMemoriesSync(): { userName: string; userNickname: string; memories: string[] } {
  const now = Date.now();
  if (_memoriesCache && (now - _memoriesCacheAge) < CACHE_TTL_MS) {
    return _memoriesCache;
  }
  const defaultData = {
    userName: 'Vinay',
    userNickname: '',
    memories: ["User's name is Vinay.", "User is creator and engineer at EtherX Innovations."],
  };
  for (const filePath of getMemoryFilePaths()) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const result = { ...defaultData, ...parsed };
        if (Array.isArray(parsed.memories) && parsed.memories.length > 0) result.memories = parsed.memories;
        _memoriesCache = result;
        _memoriesCacheAge = now;
        return result;
      }
    } catch {}
  }
  _memoriesCache = defaultData;
  _memoriesCacheAge = now;
  return defaultData;
}

// Async: refresh backend SQLite memories into the file cache (runs in background after response starts)
async function refreshMemoriesFromBackend(): Promise<void> {
  try {
    const res = await fetch('http://localhost:8000/api/memories', {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return;
    const backendMemories = await res.json();
    if (!Array.isArray(backendMemories)) return;

    const current = loadMemoriesSync();
    let changed = false;
    for (const item of backendMemories) {
      if (item.content && !current.memories.includes(item.content)) {
        current.memories.push(item.content);
        changed = true;
      }
      // Pull nickname from backend memories too
      if (!current.userNickname && item.content) {
        const m = item.content.match(/User's nickname is\s+([^.]+)/i);
        if (m) { current.userNickname = m[1].trim(); changed = true; }
      }
    }
    if (changed) {
      _memoriesCache = current;
      _memoriesCacheAge = Date.now();
      // Persist back to disk
      for (const filePath of getMemoryFilePaths()) {
        try {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
        } catch {}
      }
    }
  } catch {}
}

function getPersistentMemories(customUserName?: string, customUserNickname?: string): { userName: string; userNickname: string; promptBlock: string } {
  const data = loadMemoriesSync();
  const userName = customUserName || data.userName;
  let userNickname = customUserNickname || data.userNickname;

  // Pull nickname from memory facts if not set
  if (!userNickname) {
    for (const m of data.memories) {
      const nickMatch = m.match(/User's nickname is\s+([^.]+)/i);
      if (nickMatch) { userNickname = nickMatch[1].trim(); break; }
    }
  }

  const memoryLines = data.memories.map(m => `  • ${m}`).join('\n');
  const promptBlock = `\n\nUSER IDENTITY & PERSISTENT MEMORY (Always active across all conversations & tabs):
- User's Name: ${userName}
${userNickname ? `- User's Nickname: ${userNickname}` : ''}
- CRITICAL INSTRUCTIONS REGARDING USER IDENTITY & MEMORY:
  1. User's Legal/Given Name: ${userName}. When the user asks "what's my name", state their name is ${userName}.
  2. User's Nickname: ${userNickname ? `The user's established nickname is strictly "${userNickname}". State it accurately. Do NOT invent nicknames.` : 'Check the durable facts below for any recorded nickname.'}
  3. Durable facts you remember about ${userName}:
${memoryLines}
  4. NEVER confuse your name (Pragna) with the user's name (${userName}).`;

  return { userName, userNickname, promptBlock };
}


function updateMemoriesFromMessage(content: string) {
  if (!content) return;
  const targetPaths = getMemoryFilePaths();
  let data = {
    userName: 'Vinay',
    userNickname: '',
    memories: ["User's name is Vinay.", "User is creator and engineer at EtherX Innovations."]
  };

  for (const filePath of targetPaths) {
    try {
      if (fs.existsSync(filePath)) {
        const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        data = { ...data, ...loaded };
        if (Array.isArray(loaded.memories)) data.memories = loaded.memories;
        break;
      }
    } catch (e) {}
  }

  let changed = false;
  const newFactsToSync: string[] = [];

  // Check for nickname extraction
  const nickMatch = content.match(/\b(?:my nickname is|nickname is|my nick is|call me nickname|call me)\s+["']?([A-Za-z0-9_-]{2,30})["']?\b/i);
  if (nickMatch) {
    const candidate = nickMatch[1].trim();
    const invalid = ['a', 'an', 'the', 'here', 'just', 'trying', 'working', 'looking', 'sorry', 'fine', 'good', 'happy', 'busy', 'online', 'curious', 'not', 'asking', 'thinking', 'pragna', 'claude', 'assistant', 'bot', 'vinay'];
    if (!invalid.includes(candidate.toLowerCase())) {
      const formatted = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      data.userNickname = formatted;
      const fact = `User's nickname is ${formatted}.`;
      if (!data.memories.includes(fact)) {
        data.memories.unshift(fact);
        newFactsToSync.push(fact);
      }
      changed = true;
    }
  }

  // Check for name extraction
  const nameMatch = content.match(/\b(?:my name is|i am|i'm)\s+([A-Za-z]{2,20})\b/i);
  if (nameMatch) {
    const candidate = nameMatch[1].trim();
    const invalid = ['a', 'an', 'the', 'here', 'just', 'trying', 'working', 'looking', 'sorry', 'fine', 'good', 'happy', 'busy', 'online', 'curious', 'not', 'asking', 'thinking', 'pragna', 'claude', 'assistant', 'bot'];
    if (!invalid.includes(candidate.toLowerCase())) {
      const formatted = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      data.userName = formatted;
      const fact = `User's name is ${formatted}.`;
      if (!data.memories.includes(fact)) {
        data.memories.unshift(fact);
        newFactsToSync.push(fact);
      }
      changed = true;
    }
  }

  // Check for remember directives
  const remMatch = content.match(/\b(?:remember that|please remember|note that|keep in mind that)\s+(.{4,120})/i);
  if (remMatch) {
    const fact = remMatch[1].trim().replace(/[.!?]+$/, '');
    const entry = `User note: ${fact}.`;
    if (!data.memories.includes(entry)) {
      data.memories.push(entry);
      newFactsToSync.push(entry);
      changed = true;
    }
  }

  // Check for preferences
  const prefMatch = content.match(/\b(?:i live in|i am from|i'm from)\s+([^.,\n!]{2,50})/i);
  if (prefMatch) {
    const place = prefMatch[1].trim();
    const entry = `User is from ${place}.`;
    if (!data.memories.includes(entry)) {
      data.memories.push(entry);
      newFactsToSync.push(entry);
      changed = true;
    }
  }

  if (changed) {
    for (const filePath of targetPaths) {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      } catch (e) {
        console.error('Error saving memories.json to', filePath, e);
      }
    }
    // Invalidate in-process cache so next request reloads fresh data
    _memoriesCache = null;

    // Sync new facts to backend SQLite asynchronously
    for (const fact of newFactsToSync) {
      fetch('http://localhost:8000/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fact }),
      }).catch(() => {});
    }
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      model = 'deepseek-chat',
      temperature = 0.2,
      max_tokens = 4000,
      apiKey: customApiKey,
      enableTools = true,
      systemPrompt: customSystemPrompt,
      userName: clientUserName,
    } = body;

    const apiKey =
      customApiKey ||
      process.env.OPENROUTER_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      '';

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No API key configured. Please set OPENROUTER_API_KEY in .env.local or in Settings.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inspect user's last message for durable facts to persist
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    updateMemoriesFromMessage(lastUserMessage);

    // Retrieve memories synchronously from cache/disk (fast), refresh backend in background
    const { promptBlock } = getPersistentMemories(clientUserName, body.userNickname);
    refreshMemoriesFromBackend(); // fire-and-forget — updates cache for next request
    const baseSystemPrompt = customSystemPrompt || SYSTEM_PROMPT;
    const fullSystemPrompt = `${baseSystemPrompt}${promptBlock}`;



    let targetModel = MODEL_MAP[model] || model;

    const conversationHistory: any[] = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const ollamaKey = process.env.OLLAMA_API_KEY || '26a95f0c5431431d8338645cdde4998f.CyDoeN4fDrSTJum8dpfRglps';

        const sendText = (text: string) => {
          controller.enqueue(encoder.encode(sseChunk(text)));
        };

        // Stream Ollama response (no tools — fallback only)
        const pipeOllamaStream = async (res: Response) => {
          if (!res.body) return;
          const reader = res.body.getReader();
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
              if (!trimmed) continue;
              try {
                const data = JSON.parse(trimmed);
                const token = data.message?.content || '';
                if (token) sendText(token);
                if (data.done) return;
              } catch {}
            }
          }
        };

        // Stream OpenRouter response WITH tool call detection.
        // Returns accumulated tool calls if the model chose to call tools,
        // or null if it streamed a text answer (already sent via sendText).
        const streamWithTools = async (res: Response): Promise<any[] | null> => {
          if (!res.body) return null;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          const tcAcc: Record<number, { id: string; name: string; args: string }> = {};
          let hasToolCalls = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]' || trimmed.startsWith(':')) continue;
              if (!trimmed.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(trimmed.slice(6));
                const delta = data.choices?.[0]?.delta;
                if (!delta) continue;

                // Text token — send immediately
                if (delta.content) sendText(delta.content);

                // Tool call chunks — accumulate silently
                if (delta.tool_calls) {
                  hasToolCalls = true;
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!tcAcc[idx]) tcAcc[idx] = { id: '', name: '', args: '' };
                    if (tc.id) tcAcc[idx].id = tc.id;
                    if (tc.function?.name) tcAcc[idx].name += tc.function.name;
                    if (tc.function?.arguments) tcAcc[idx].args += tc.function.arguments;
                  }
                }
              } catch {}
            }
          }

          if (!hasToolCalls) return null;
          return Object.values(tcAcc).map(tc => ({
            id: tc.id,
            function: { name: tc.name, arguments: tc.args },
          }));
        };

        try {
          let activeModel = targetModel;
          const MAX_ROUNDS = 4;

          for (let round = 0; round < MAX_ROUNDS; round++) {
            // Try primary model first, then deepseek fallback
            let res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:4028',
                'X-Title': 'ClaudeChat',
              },
              body: JSON.stringify({
                model: activeModel,
                messages: conversationHistory,
                tools: AGENT_TOOLS_SCHEMA,
                tool_choice: 'auto',
                temperature,
                max_tokens: 1000,
                stream: true,
              }),
            });

            if (!res.ok && activeModel !== 'deepseek/deepseek-chat') {
              activeModel = 'deepseek/deepseek-chat';
              res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'http://localhost:4028',
                  'X-Title': 'ClaudeChat',
                },
                body: JSON.stringify({
                  model: activeModel,
                  messages: conversationHistory,
                  tools: AGENT_TOOLS_SCHEMA,
                  tool_choice: 'auto',
                  temperature,
                  max_tokens: 1000,
                  stream: true,
                }),
              });
            }

            // If both OpenRouter options fail — use Ollama (no tools)
            if (!res.ok) {
              const ollamaRes = await fetch('https://api.ollama.com/api/chat', {
                method: 'POST',
                headers: { Authorization: `Bearer ${ollamaKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'gemma4:cloud',
                  messages: conversationHistory.map((m: any) => ({ role: m.role, content: m.content || '' })),
                  stream: true,
                }),
              });
              if (ollamaRes.ok) await pipeOllamaStream(ollamaRes);
              break;
            }

            // Stream the response and detect tool calls
            const toolCalls = await streamWithTools(res);

            // No tools called — the answer was already streamed, we're done
            if (!toolCalls || toolCalls.length === 0) break;

            // Tools were called — execute them silently
            conversationHistory.push({
              role: 'assistant',
              content: null,
              tool_calls: toolCalls.map(tc => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.function.name, arguments: tc.function.arguments },
              })),
            });

            for (const tc of toolCalls) {
              const toolName = tc.function?.name;
              let toolArgs: Record<string, any> = {};
              try { toolArgs = JSON.parse(tc.function?.arguments || '{}'); } catch {}
              const result = await executeTool(toolName, toolArgs);
              conversationHistory.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: toolName,
                content: JSON.stringify(result),
              });
            }
            // Loop continues — next iteration streams the final answer
          }
        } catch (err: any) {
          console.error('Agent loop error:', err);
          sendText(`\n\n*(Error: ${err.message || 'Unknown error'})*\n`);
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });


    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

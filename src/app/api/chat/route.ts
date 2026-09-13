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

CRITICAL TOOL & RESPONSE RULES:
1. NEVER expose raw tool invocations or metadata in your reply to the user. Do not print things like "Tool Action:", "🔍", "⚡ Result:", function names, query strings, or raw result dumps. The tool call is strictly an internal background step — the user must ONLY see your final, natural-language answer.
2. Format:
   - Answer the question directly and conversationally, as if you already knew it.
   - Weave in citations/sources only if the user asks for them or it's clearly useful (e.g., "according to [source]").
   - NO preamble like "Based on the search results...", "According to my web search...", or "After checking..." — just answer directly.
3. Efficiency:
   - Before calling a tool, check if you already have sufficient information from earlier in the conversation to answer. If the user asks a near-duplicate or rephrased version of a question you already answered, reuse that answer instead of re-searching from scratch.
   - Only re-search if the topic is time-sensitive enough that the earlier result could be stale, or if the user is explicitly asking for a refresh.
4. When writing code, components, or artifacts, format them in standard markdown code blocks (\`\`\`language\n...\n\`\`\`).
5. STRICT NO-EMOJI RESTRICTION: Do NOT display or include any emojis, emoticons, or pictographic symbols anywhere in your replies under any circumstances. Keep all responses strictly text-based, clean, professional, and completely free of emojis.`;

function stripEmojis(text: string): string {
  if (!text) return '';
  return text.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
}

function sseChunk(content: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content: stripEmojis(content) } }],
  })}\n\n`;
}

// Quick heuristic to detect if the prompt asks for real-time external info or system actions
function queryNeedsTools(messages: any[]): boolean {
  if (!messages || messages.length === 0) return false;
  const last = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const triggers = [
    'who is', 'current', 'latest', 'today', '2026', '2025', 'minister', 'president', 'cm of',
    'news', 'price', 'stock', 'weather', 'search', 'google', 'find out', 'file', 'terminal',
    'run python', 'calculate', 'code', 'kanban', 'todo', 'memory'
  ];
  return triggers.some(t => last.includes(t));
}

function getPersistentMemories(customUserName?: string): { userName: string; promptBlock: string } {
  const filePath = path.join(process.cwd(), 'data', 'memories.json');
  let userName = customUserName || 'Vinay';
  let memories: string[] = ["User's name is Vinay.", "User is creator and engineer at EtherX Innovations."];

  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data.userName) userName = customUserName || data.userName;
      if (Array.isArray(data.memories) && data.memories.length > 0) memories = data.memories;
    }
  } catch (e) {
    console.error('Error loading memories.json:', e);
  }

  const memoryLines = memories.map(m => `  • ${m}`).join('\n');
  const promptBlock = `\n\nUSER IDENTITY & PERSISTENT MEMORY (Always active across all conversations & tabs):
- User's Name: ${userName}
- CRITICAL: You are conversing with ${userName}. When the user asks "what's my name", "whats my name", or asks who they are, you must ALWAYS state directly and accurately that their name is ${userName}.
- NEVER confuse your name (Pragna) with the user's name (${userName}). You are Pragna; the user is ${userName}.
- Durable facts you remember about ${userName}:
${memoryLines}`;

  return { userName, promptBlock };
}

function updateMemoriesFromMessage(content: string) {
  if (!content) return;
  const filePath = path.join(process.cwd(), 'data', 'memories.json');
  let data = { userName: 'Vinay', memories: ["User's name is Vinay.", "User is creator and engineer at EtherX Innovations."] };

  try {
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {}

  let changed = false;
  // Check for name extraction
  const nameMatch = content.match(/\b(?:my name is|i am|call me|i'm)\s+([A-Za-z]{2,20})\b/i);
  if (nameMatch) {
    const candidate = nameMatch[1].trim();
    const invalid = ['a', 'an', 'the', 'here', 'just', 'trying', 'working', 'looking', 'sorry', 'fine', 'good', 'happy', 'busy', 'online', 'curious', 'not', 'asking', 'thinking', 'pragna', 'claude', 'assistant', 'bot'];
    if (!invalid.includes(candidate.toLowerCase())) {
      const formatted = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      data.userName = formatted;
      const fact = `User's name is ${formatted}.`;
      if (!data.memories.includes(fact)) {
        data.memories.unshift(fact);
      }
      changed = true;
    }
  }

  // Check for remember directives
  const remMatch = content.match(/\b(?:remember that|please remember|note that|keep in mind that)\s+(.{4,100})/i);
  if (remMatch) {
    const fact = remMatch[1].trim().replace(/[.!?]+$/, '');
    const entry = `User note: ${fact}.`;
    if (!data.memories.includes(entry)) {
      data.memories.push(entry);
      changed = true;
    }
  }

  if (changed) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving memories.json:', e);
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

    // Retrieve active persistent memories and inject into system prompt
    const { promptBlock } = getPersistentMemories(clientUserName);
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

    const needsToolDeliberation = enableTools && queryNeedsTools(messages);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendText = (text: string) => {
          controller.enqueue(encoder.encode(sseChunk(text)));
        };

        const pipeStream = async (res: Response) => {
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
              if (!trimmed || trimmed.startsWith(':')) continue;
              if (trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const delta = data.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    sendText(delta);
                  }
                } catch {}
              }
            }
          }
        };

        try {
          let activeModel = targetModel;

          // Pure chat / code query: direct streaming without tool roundtrip
          if (!needsToolDeliberation) {
            let directRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                temperature,
                max_tokens: 2000,
                stream: true,
              }),
            });

            if (!directRes.ok && activeModel !== 'deepseek/deepseek-chat') {
              activeModel = 'deepseek/deepseek-chat';
              directRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                  temperature,
                  max_tokens: 2000,
                  stream: true,
                }),
              });
            }

            if (directRes.ok) {
              await pipeStream(directRes);
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
          }

          // Tool deliberation & silent background execution
          const MAX_ROUNDS = 3;
          let currentRound = 0;

          while (currentRound < MAX_ROUNDS) {
            currentRound++;

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
                temperature,
                max_tokens: Math.min(max_tokens, 2000),
              }),
            });

            // Fallback to deepseek-chat if model fails
            if (!res.ok) {
              if (activeModel !== 'deepseek/deepseek-chat') {
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
                    temperature,
                    max_tokens: Math.min(max_tokens, 2000),
                  }),
                });
              }

              if (!res.ok) {
                const failText = await res.text();
                sendText(`\n\n*(Error calling AI model: ${failText})*\n`);
                break;
              }
            }

            const data = await res.json();
            const choice = data.choices?.[0];
            const message = choice?.message;

            if (!message) break;

            const toolCalls = message.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
              conversationHistory.push({
                role: 'assistant',
                content: message.content || null,
                tool_calls: toolCalls,
              });

              for (const tc of toolCalls) {
                const toolName = tc.function?.name;
                let toolArgs: Record<string, any> = {};
                try {
                  toolArgs = JSON.parse(tc.function?.arguments || '{}');
                } catch {
                  toolArgs = {};
                }

                // Execute tool silently in background (DO NOT send tool banners or raw metadata to user)
                const result = await executeTool(toolName, toolArgs);

                conversationHistory.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: toolName,
                  content: JSON.stringify(result),
                });
              }

              // After tools are executed, stream ONLY the final natural language answer
              const finalStreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                  temperature,
                  max_tokens: Math.min(max_tokens, 3000),
                  stream: true,
                }),
              });

              if (finalStreamRes.ok) {
                await pipeStream(finalStreamRes);
              }
              break;
            }

            // No tools were called -> Stream the message directly
            if (message.content) {
              sendText(message.content);
            }
            break;
          }
        } catch (err: any) {
          console.error('Agent loop execution error:', err);
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

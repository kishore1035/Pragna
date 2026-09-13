import { NextRequest } from 'next/server';
import { AGENT_TOOLS_SCHEMA, executeTool } from '@/lib/agent-tools';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Map UI model IDs to reliable OpenRouter model slugs
const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
  'claude-opus-4-5': 'anthropic/claude-opus-4.5',
  'claude-haiku-3-5': 'anthropic/claude-sonnet-4.5', // Avoid 404
  'deepseek-chat': 'deepseek/deepseek-chat',
  'deepseek-v3': 'deepseek/deepseek-chat',
  'gemma-free': 'google/gemma-4-31b-it:free',
};

const SYSTEM_PROMPT = `You are Claude, an autonomous AI assistant with real-time tool execution capabilities.
Current Date: September 2026.

Available tools:
- web_search: Search live web for real-time information, 2026 events, current leaders, facts, news, documentation.
- web_extract: Extract and read clean markdown text from any web URL.
- x_search: Search posts and discussions on X / Twitter.
- read_file, write_file, patch, search_files: Inspect and edit local workspace files.
- terminal: Execute bash shell commands.
- run_python_code: Run Python 3 code in a real interpreter.
- todo, memory, kanban: Manage tasks, persistent notes, and project Kanban boards.
- image_generate: Create visual images using AI.

RULES:
1. ALWAYS use "web_search" when asked about current leaders, news, real-time facts, or events up to 2026. Never claim your knowledge cut off in 2024 if you can search the web!
2. Answer concisely, accurately, and articulately.
3. For code or artifacts, use markdown code blocks (\`\`\`language\\n...\\n\`\`\`).`;

function sseChunk(content: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content } }],
  })}\n\n`;
}

// Quick heuristic to detect if the prompt explicitly needs live external data / actions
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

    let targetModel = MODEL_MAP[model] || model;

    const conversationHistory: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
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

          // If the query does not ask for real-time/tools, stream DIRECTLY with low latency
          if (!needsToolDeliberation) {
            const directRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                max_tokens: Math.min(max_tokens, 4000),
                stream: true,
              }),
            });

            if (directRes.ok) {
              await pipeStream(directRes);
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
          }

          // Otherwise, run autonomous tool execution loop
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

            // Model fallback
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

                const argsSummary = Object.entries(toolArgs)
                  .map(([k, v]) => `${k}="${typeof v === 'string' ? v.slice(0, 35) : JSON.stringify(v)}"`)
                  .join(', ');

                // Send immediate visual status
                sendText(`> 🔍 **Tool Call**: \`${toolName}\` *(${argsSummary})*\n`);

                const result = await executeTool(toolName, toolArgs);

                sendText(`> ⚡ *Result*: ${result.summary || 'Completed'}\n\n`);

                conversationHistory.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: toolName,
                  content: JSON.stringify(result),
                });
              }

              // After tools are executed, stream the final synthesis DIRECTLY via OpenRouter SSE
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

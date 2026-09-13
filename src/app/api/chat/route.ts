import { NextRequest } from 'next/server';
import { AGENT_TOOLS_SCHEMA, executeTool } from '@/lib/agent-tools';

export const runtime = 'nodejs';
export const maxDuration = 120; // Allow sufficient time for multi-step autonomous tool execution

// Map UI model IDs to OpenRouter model slugs
const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
  'claude-opus-4-5': 'anthropic/claude-opus-4.5',
  'claude-haiku-3-5': 'anthropic/claude-haiku-4.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
  'deepseek-v3': 'deepseek/deepseek-chat',
  'gemma-free': 'google/gemma-4-31b-it:free',
};

const SYSTEM_PROMPT = `You are Claude, an autonomous AI assistant with full tool execution agency.
Current Date: September 2026.

You have access to powerful live tools:
- web_search: Search the live web for real-time information, 2026 events, leaders, news, facts, documentation.
- web_extract: Extract and read clean markdown text from any web URL.
- x_search: Search posts and discussions on X / Twitter.
- read_file, write_file, patch, search_files: Inspect and edit local workspace files.
- terminal: Execute bash shell commands.
- run_python_code: Run Python 3 code in a real interpreter.
- todo, memory, kanban: Manage tasks, persistent notes, and project Kanban boards.
- image_generate: Create visual images using AI.

AUTONOMOUS BEHAVIOR RULES:
1. ALWAYS use "web_search" when asked about current leaders, news, real-time facts, or events up to 2026. Never say your knowledge cut off in 2024 if you can search the web!
2. When answering, be articulate, accurate, concise, and structured.
3. When generating code, HTML, React components, or diagrams, format them in standard markdown code blocks (\`\`\`language\\n...\\n\`\`\`).
4. If you create interactive web apps or standalone HTML/JS/React components, make them runnable so the user can preview them directly in the Artifacts side panel.`;

/**
 * Format SSE delta chunk for OpenAI-compatible client
 */
function sseChunk(content: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content } }],
  })}\n\n`;
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

    // Create message array with system instructions
    const conversationHistory: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Create ReadableStream to stream SSE to client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendChunk = (text: string) => {
          controller.enqueue(encoder.encode(sseChunk(text)));
        };

        try {
          const MAX_ROUNDS = 5;
          let currentRound = 0;
          let activeModel = targetModel;

          while (currentRound < MAX_ROUNDS) {
            currentRound++;

            // Call OpenRouter with tools schema
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
                tools: enableTools ? AGENT_TOOLS_SCHEMA : undefined,
                temperature,
                max_tokens: Math.min(max_tokens, 4000),
              }),
            });

            // If selected model fails or has credit issue, automatically fall back to deepseek-chat
            if (!res.ok) {
              const errBody = await res.text();
              console.warn(`Model ${activeModel} failed: ${errBody}`);
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
                    tools: enableTools ? AGENT_TOOLS_SCHEMA : undefined,
                    temperature,
                    max_tokens: Math.min(max_tokens, 4000),
                  }),
                });
              }

              if (!res.ok) {
                const failText = await res.text();
                sendChunk(`\n\n*(Error calling AI model: ${failText})*\n`);
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }
            }

            const data = await res.json();
            const choice = data.choices?.[0];
            const message = choice?.message;

            if (!message) {
              break;
            }

            // Check if model invoked tool calls
            const toolCalls = message.tool_calls;
            if (toolCalls && toolCalls.length > 0 && enableTools) {
              // Append assistant tool call message to history
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

                // Render live status in chat
                const argsSummary = Object.entries(toolArgs)
                  .map(([k, v]) => `${k}="${typeof v === 'string' ? v.slice(0, 40) : JSON.stringify(v)}"`)
                  .join(', ');

                sendChunk(`> 🔍 **Tool Action**: \`${toolName}\` *(${argsSummary})*\n`);

                // Execute the tool
                const result = await executeTool(toolName, toolArgs);

                sendChunk(`> ⚡ *Result*: ${result.summary || 'Completed successfully'}\n\n`);

                // Feed tool result back to model
                conversationHistory.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: toolName,
                  content: JSON.stringify(result),
                });
              }

              // Proceed to next round so the model can synthesize with results
              continue;
            }

            // No tool calls -> Model delivered final message!
            // Stream the final content to the user
            const finalContent = message.content || '';
            if (finalContent) {
              // Break down into small word/line tokens for smooth live streaming feel
              const words = finalContent.split(/(?<=\s+)/);
              for (const word of words) {
                sendChunk(word);
                // Tiny delay to preserve natural fluid streaming animation
                await new Promise(r => setTimeout(r, 8));
              }
            }

            break;
          }
        } catch (err: any) {
          console.error('Agent loop execution error:', err);
          sendChunk(`\n\n*(Agent Error: ${err.message || 'Unknown error'})*\n`);
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

import { NextRequest } from 'next/server';
import { AGENT_TOOLS_SCHEMA, executeTool } from '@/lib/agent-tools';
import { buildIndianLanguageSystemPrompt, detectIndianLanguage, INDIAN_LANGUAGES } from '@/lib/indianLanguages';
import {
  getModelConfig,
  isModelIdentityQuery,
  getModelExplanation,
  SANSKRIT_MODELS,
} from '@/lib/modelDisplayNames';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Pool of Ollama Cloud API keys for high availability & round-robin rotation
const OLLAMA_KEYS = [
  process.env.OLLAMA_API_KEY,
  process.env.OLLAMA_API_KEY_2,
  process.env.OLLAMA_API_KEY_3,
  process.env.OLLAMA_API_KEY_4,
  process.env.OLLAMA_API_KEY_5,
  process.env.OLLAMA_API_KEY_6,
  process.env.OLLAMA_API_KEY_7,
].filter(Boolean) as string[];

let currentOllamaIndex = 0;
function getNextOllamaKey(): string {
  if (OLLAMA_KEYS.length === 0) return '';
  const key = OLLAMA_KEYS[currentOllamaIndex % OLLAMA_KEYS.length];
  currentOllamaIndex = (currentOllamaIndex + 1) % OLLAMA_KEYS.length;
  return key;
}

// Map UI model IDs to reliable slugs
const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
  'claude-opus-4-5': 'anthropic/claude-opus-4.5',
  'claude-haiku-3-5': 'anthropic/claude-sonnet-4.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
  'deepseek-v3': 'deepseek/deepseek-chat',
  'gemma-free': 'google/gemma-4-31b-it:free',
  'gemma4:cloud': 'gemma4:31b',
  'gemma4:31b-cloud': 'gemma4:31b',
  'gemma4:31b': 'gemma4:31b',
  'pragna-voice': 'gemma4:31b',
};

const DEFAULT_SYSTEM_PROMPT = `You are Pragna, a brilliant, articulate, empathetic, and thoughtful AI companion.
Current Date: September 2026.

You have access to tools for live information retrieval and execution (web_search, web_extract, x_search, read_file, write_file, patch, search_files, terminal, run_python_code, todo, memory, kanban, image_generate).

CRITICAL TOOL & RESPONSE RULES:
1. NEVER expose raw tool invocations or metadata in your reply to the user. Do not print things like "Tool Action:", "🔍", "⚡ Result:", function names, query strings, or raw result dumps. The tool call is strictly an internal background step — the user must ONLY see your final, natural-language answer.
2. Format:
   - Answer the question directly and conversationally.
   - Weave in citations/sources only if the user asks for them or it's clearly useful.
   - NO preamble like "Based on the search results..." — just answer directly.
3. When writing code, format in standard markdown code blocks (\`\`\`language\\n...\\n\`\`\`).`;

function sseChunk(content: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content } }],
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      messages = [],
      user_message,
      model = 'gemma4:31b',
      temperature = 0.6,
      max_tokens = 4000,
      apiKey: customApiKey,
      enableTools = true,
      systemPrompt: customSystemPrompt,
      language = 'en-IN',
      isVoice = false,
    } = body;

    // Support direct user_message string shorthand
    if ((!messages || messages.length === 0) && user_message) {
      messages = [{ role: 'user', content: user_message }];
    }

    const openRouterApiKey =
      customApiKey ||
      process.env.OPENROUTER_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      '';

    const hasOllama = OLLAMA_KEYS.length > 0;
    const isOllamaTarget =
      model.startsWith('gemma') ||
      model.includes('ollama') ||
      model === 'pragna-voice' ||
      (!openRouterApiKey && hasOllama);

    if (!openRouterApiKey && !hasOllama) {
      return new Response(
        JSON.stringify({
          error: 'No API key configured. Please set OLLAMA_API_KEY or OPENROUTER_API_KEY in .env.local or Settings.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let targetModel = MODEL_MAP[model] || model;
    if (isOllamaTarget && (targetModel.includes('/') || targetModel.startsWith('google/'))) {
      targetModel = 'gemma4:31b';
    }

    // --- INDIAN LANGUAGE SYSTEM PROMPT ENFORCEMENT ---
    const lastUserContent = messages[messages.length - 1]?.content || user_message || '';

    // --- ACTIVE MODEL IDENTITY & INQUIRY HANDLING ---
    const modelConfig = getModelConfig(model) || SANSKRIT_MODELS[0];
    const isModelInquiry = isModelIdentityQuery(lastUserContent);

    if (isModelInquiry) {
      let respLang = language;
      if (respLang === 'auto') {
        const autoDetected = detectIndianLanguage(lastUserContent);
        respLang = autoDetected.id;
      }
      const explanation = getModelExplanation(modelConfig, respLang);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const words = explanation.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + words[i];
            controller.enqueue(encoder.encode(sseChunk(chunk)));
            await new Promise((r) => setTimeout(r, 15));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const indianLangPrompt = buildIndianLanguageSystemPrompt(language, isVoice);

    let effectiveSystemPrompt = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
    if (!effectiveSystemPrompt.includes('STRICT INDIAN MULTILINGUAL PROJECT')) {
      effectiveSystemPrompt = `${indianLangPrompt}\n\n${effectiveSystemPrompt}`;
    }

    // Inject active model identity into system prompt
    const activeModelPrompt = `CRITICAL ACTIVE MODEL IDENTITY:
- You are operating as Pragna under the model persona: "${modelConfig.displayName}" (${modelConfig.sanskritScript} — Sanskrit for "${modelConfig.meaning}").
- Underlying Architecture: ${modelConfig.rawName} (Provider: ${modelConfig.provider.toUpperCase()}).
- Core Strengths: ${modelConfig.description}.
- When asked about your model or system, you must state that you are "${modelConfig.displayName}" (${modelConfig.sanskritScript}), powered by ${modelConfig.rawName}.`;

    effectiveSystemPrompt = `${activeModelPrompt}\n\n${effectiveSystemPrompt}`;

    if (language === 'auto') {
      const autoDetected = detectIndianLanguage(lastUserContent);
      if (autoDetected.id === 'en-IN') {
        effectiveSystemPrompt = `CRITICAL DIRECTIVE: The user input is in English. You MUST formulate your entire response in clear, articulate English as Pragna. Do NOT respond in Hindi or any other language unless explicitly requested.\n\n${effectiveSystemPrompt}`;
      } else if (autoDetected.id !== 'auto') {
        effectiveSystemPrompt = `CRITICAL DIRECTIVE: The user language is detected as ${autoDetected.name} (${autoDetected.nativeName}). You MUST answer exclusively in ${autoDetected.name} (${autoDetected.nativeName}) using ${autoDetected.script} script.\n\n${effectiveSystemPrompt}`;
      }
    } else if (language === 'en-IN') {
      effectiveSystemPrompt = `CRITICAL DIRECTIVE: MANDATORY LANGUAGE IS ENGLISH (Indian English).
Formulate your entire answer in natural, articulate, warm English as Pragna. Do NOT respond in Hindi or other languages unless explicitly asked.\n\n${effectiveSystemPrompt}`;
    } else {
      const explicitLang = INDIAN_LANGUAGES.find((l) => l.id === language);
      if (explicitLang && explicitLang.id !== 'auto' && explicitLang.id !== 'en-IN') {
        effectiveSystemPrompt = `CRITICAL DIRECTIVE: MANDATORY LANGUAGE IS ${explicitLang.name} (${explicitLang.nativeName}) IN ${explicitLang.script} SCRIPT.
Regardless of what language the user enters (even if the user greeting is in English like "HII", "hello", or any question), your reply MUST BE 100% IN ${explicitLang.name} (${explicitLang.nativeName}).
NEVER output English or Romanized script. Formulate your entire answer in ${explicitLang.name} (${explicitLang.nativeName}).\n\n${effectiveSystemPrompt}`;
      }
    }

    const conversationHistory: any[] = [
      { role: 'system', content: effectiveSystemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const needsToolDeliberation = !isOllamaTarget && enableTools && queryNeedsTools(messages);

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
          // --- OLLAMA CLOUD STREAMING HANDLER ---
          if (isOllamaTarget) {
            let success = false;
            const maxRetries = Math.min(OLLAMA_KEYS.length, 3);

            for (let attempt = 0; attempt < maxRetries; attempt++) {
              const key = getNextOllamaKey();
              try {
                const ollamaRes = await fetch('https://ollama.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: targetModel,
                    messages: conversationHistory,
                    temperature,
                    max_tokens: Math.min(max_tokens, 2000),
                    stream: true,
                  }),
                });

                if (ollamaRes.ok) {
                  await pipeStream(ollamaRes);
                  success = true;
                  break;
                } else {
                  console.warn(`Ollama attempt ${attempt + 1} failed: ${ollamaRes.status}`);
                }
              } catch (e) {
                console.warn(`Ollama attempt ${attempt + 1} threw error:`, e);
              }
            }

            if (!success && openRouterApiKey) {
              // Fallback to OpenRouter if Ollama attempts failed
              console.log('Falling back from Ollama to OpenRouter...');
            } else if (!success) {
              sendText('I apologize, I am temporarily having trouble connecting to my neural voice engine. Please check your Ollama API key.');
              return;
            } else {
              return;
            }
          }

          // --- OPENROUTER / ANTHROPIC HANDLER ---
          let activeModel = targetModel;

          if (!needsToolDeliberation) {
            let directRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:4028',
                'X-Title': 'PragnaAI',
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
                  Authorization: `Bearer ${openRouterApiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'http://localhost:4028',
                  'X-Title': 'PragnaAI',
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
                Authorization: `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:4028',
                'X-Title': 'PragnaAI',
              },
              body: JSON.stringify({
                model: activeModel,
                messages: conversationHistory,
                tools: AGENT_TOOLS_SCHEMA,
                temperature,
                max_tokens: Math.min(max_tokens, 2000),
              }),
            });

            if (!res.ok) {
              if (activeModel !== 'deepseek/deepseek-chat') {
                activeModel = 'deepseek/deepseek-chat';
                res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:4028',
                    'X-Title': 'PragnaAI',
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

                const result = await executeTool(toolName, toolArgs);

                conversationHistory.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: toolName,
                  content: JSON.stringify(result),
                });
              }

              const finalStreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${openRouterApiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'http://localhost:4028',
                  'X-Title': 'PragnaAI',
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

            if (message.content) {
              sendText(message.content);
            }
            break;
          }
        } catch (err: any) {
          console.error('Chat execution error:', err);
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

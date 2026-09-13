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

const SYSTEM_PROMPT = `You are Pragna, an intelligent, articulate, and thoughtful AI assistant created by EtherX Innovations within the IgniteX team.

Identity & Organization:
- Name: Pragna
- Company: EtherX Innovations
- Internal Team: IgniteX team
- Team Structure: Inside the IgniteX team at EtherX Innovations, three specialized project teams operated on distinct breakthrough initiatives, one of which developed Pragna.
- Product Interfaces: Pragna operates across three distinct interfaces:
  1. Pragna Chatbot — Conversational AI assistant for dialogue, knowledge synthesis, reasoning, and daily workflows.
  2. Pragna Code — Dedicated engineering and programming assistant for code generation, software architecture, debugging, refactoring, and technical tasks.
  3. Coword — Collaborative workspace and document intelligence interface for seamless teamwork, shared knowledge, and content co-creation.

Current Date: September 2026. Treat this as ground truth for current real-world facts, dates, and times.

MIMIR OUTPUT STRUCTURE RULES:
1. OUTPUT-FIRST & NO LARGE TEXT: Deliver the exact answer, code, or data immediately. Never spit out large walls of text, unrequested essays, or redundant fluff. Keep responses concise, sharp, and proportionate to the prompt.
2. ZERO RANDOM BULLSHIT: Never output conversational pleasantries ("Sure!", "Here is what you requested:"), preambles ("Based on the search...", "According to..."), unsolicited advice, moralizing lectures, or sign-off fluff ("Hope this helps!", "Let me know if you need more help!").
3. NATURAL STRUCTURE: Do NOT force rigid outlines, excessive headers, or bullet lists onto simple answers. Answer naturally in direct sentences. Only use lists or sections if explicitly requested or inherently required.
4. ABSOLUTE HONESTY & ZERO RESTRICTIONS: Provide completely direct, truthful, objective, and unrestricted assistance.
5. ARTIFACT CONVENTION:
   - When creating a complete, substantial script/code file, an interactive HTML UI preview, or a long standalone document (essay, report, writeup), wrap it in a fenced block tagged with \`artifact\`, specifying a title and optional language attribute:
     \`\`\`artifact title="Script Title" language="python"
     ...
     \`\`\`
   - For \`language="html"\` artifacts specifically, the user sees a live rendered preview, not just the source -- so write a complete, self-contained HTML document (starting with <!DOCTYPE html>, with any CSS/JS inlined) whenever the user asks for a webpage, UI mockup, interactive tool, or visual output.
6. STANDARD CODE BLOCKS: For code snippets, terminal commands, or short examples, use standard markdown code blocks.
7. DOCUMENT DOWNLOAD LINKS: When creating Word, PDF, Excel, or PPTX documents, ALWAYS provide the download link: [Download DocumentName.ext](/api/documents/download/DocumentName.ext). Never claim to be in a simulation — files are live and immediately downloadable.
8. DIAGRAMS: When generating architectural or flow diagrams, use Mermaid blocks (\`\`\`mermaid).
9. SILENT TOOL EXECUTION: Execute tools silently in the background. Never output raw JSON objects or textual imitations of tool calls in message prose.
10. STRICT NO-EMOJI RESTRICTION: Do NOT display or include any emojis anywhere in your replies under any circumstances.`;


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


function getOmnirouteKey(): string {
  try {
    const omniEnvPath = path.join(process.env.HOME || '/home/vinay', '.omniroute', '.env');
    if (fs.existsSync(omniEnvPath)) {
      const content = fs.readFileSync(omniEnvPath, 'utf8');
      for (const line of content.split('\n')) {
        if (line.startsWith('OMNIROUTE_API_KEY=')) {
          return line.split('=', 2)[1].trim();
        }
      }
    }
  } catch {}
  return process.env.OMNIROUTE_API_KEY || '';
}

function getBackendOllamaKeys(): string[] {
  const keys: string[] = [];
  try {
    const backendEnvPath = path.join(process.cwd().endsWith('frontend') ? path.dirname(process.cwd()) : process.cwd(), 'backend', '.env');
    if (fs.existsSync(backendEnvPath)) {
      const content = fs.readFileSync(backendEnvPath, 'utf8');
      for (const line of content.split('\n')) {
        if (line.startsWith('OLLAMA_API_KEY')) {
          const val = line.split('=', 2)[1]?.trim();
          if (val && !keys.includes(val)) keys.push(val);
        }
      }
    }
  } catch {}
  const fallbackKeys = [
    '26a95f0c5431431d8338645cdde4998f.CyDoeN4fDrSTJum8dpfRglps',
    'edaff62e882644429122351eebfb886f.nWMqDHxFN_XoKqrj0OuSysKN',
    '8236b13c2ce04b7ab1e0a47db95044ca.hr_X86hvlBtvKIajcuDKMa7i',
    'e3a4223d79bb4987a04cc8c84ca13126.ZinzQDR_UwLbEOI3-d2EeT3w',
    '656c9a178c5147cfbde8bea65bd2586c.362NxF3QYCi36-V3vH10tKUY'
  ];
  for (const k of fallbackKeys) {
    if (!keys.includes(k)) keys.push(k);
  }
  return keys;
}

function mapOmnirouteModel(model: string): string {
  switch (model) {
    case 'claude-sonnet-4-5':
      return 'auto/best-coding';
    case 'claude-opus-4-5':
      return 'gpt-6-astra-high';
    case 'claude-haiku-3-5':
      return 'auto/fast';
    case 'deepseek-chat':
    case 'deepseek-v3':
      return 'auto/best-coding';
    case 'google/gemma-4-31b-it:free':
    case 'gemma-free':
      return 'auto/best-free';
    case 'nvidia/nemotron-3-super-120b-a12b:free':
      return 'auto/best-free';
    default:
      return 'auto/best-coding';
  }
}

async function detectAndExecuteWebSearch(messages: any[]): Promise<{ query: string; resultsText: string } | null> {
  if (!messages || messages.length === 0) return null;
  const lastMsg = (messages[messages.length - 1]?.content || '').trim();
  if (!lastMsg) return null;
  const lower = lastMsg.toLowerCase();

  // 1. Skip pure greetings and conversational pleasantries
  const isGreeting = /^(hi|hello|hey|greetings|good morning|good evening|good afternoon|howdy|sup|thanks|thank you|bye|goodbye|ok|okay)[!.? ]*$/i.test(lastMsg);
  if (isGreeting) return null;

  // 2. Skip pure arithmetic
  if (/^what is \d+[\s+\-*/^]+\d+/i.test(lastMsg) || /^calculate /i.test(lastMsg)) return null;

  // 3. Skip pure generic coding requests that have NO real-world entity, model, or product names
  const isPureGenericCoding = /^(write|create|implement|give me|show me)\s+(a\s+)?(python|javascript|typescript|c\+\+|java|rust|go|html|css|sql|function|script|algorithm|regex|class)\s+(to\s+|for\s+)?(reverse|sort|find|sum|calculate|loop|print|check|validate)\b/i.test(lastMsg);
  if (isPureGenericCoding) return null;

  // 4. URL detection: ALWAYS search or verify when a URL is provided
  const urlMatch = lastMsg.match(/https?:\/\/[^\s]+/i);

  let query = '';

  if (urlMatch) {
    // If the message is a URL or contains a URL, search for that exact URL or page
    query = urlMatch[0];
  } else {
    // Clean query of conversational prefixes
    query = lastMsg
      .replace(/\b(dont u know|don't you know|did you know|can you|could you|please|use search|search for|search|google it|google|look up|tell me about|tell me|who is|what is|why is)\b/gi, ' ')
      .replace(/[?!,.:;"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Check if query has pronouns or is a short follow-up: enrich with earlier subjects
    const hasPronouns = /\b(he|him|his|she|her|they|them|their|it|its|that|this|the actor|the politician|the model|the company|the quote|the statement)\b/i.test(lastMsg);
    if (hasPronouns || query.split(' ').length <= 4 || messages.length > 2) {
      const priorUserMessages = messages
        .slice(0, -1)
        .filter((m: any) => m.role === 'user')
        .map((m: any) => m.content)
        .join(' ');

      const priorClean = priorUserMessages
        .replace(/\b(hi|hello|who is|what is|tell me|about|and|famous|for|dont u know|did you know|use search)\b/gi, ' ')
        .replace(/[?!,.:;"]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (priorClean) {
        const priorWords = priorClean.split(/\s+/).filter(w => w.length > 3);
        const missingWords = priorWords.filter(w => !lower.includes(w.toLowerCase()));
        if (missingWords.length > 0) {
          query = `${missingWords.slice(0, 3).join(' ')} ${query}`.trim();
        }
      }
    }
  }

  if (!query || query.length < 3) return null;

  try {
    const searchRes = await executeTool('web_search', { query });
    if (searchRes && Array.isArray(searchRes.results) && searchRes.results.length > 0) {
      const topResults = searchRes.results.slice(0, 5);
      const resultsText = topResults
        .map((r: any, idx: number) => `[${idx + 1}] ${r.title}\n${r.snippet || ''}\nURL: ${r.url}`)
        .join('\n\n');
      return { query, resultsText };
    }
  } catch (err) {
    console.warn('Auto search execution failed:', err);
  }
  return null;
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

    const omniKey = getOmnirouteKey();
    const openRouterKey =
      customApiKey ||
      process.env.OPENROUTER_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      '';

    // Inspect user's last message for durable facts to persist
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    updateMemoriesFromMessage(lastUserMessage);

    // Retrieve memories synchronously from cache/disk (fast), refresh backend in background
    const { promptBlock } = getPersistentMemories(clientUserName, body.userNickname);
    refreshMemoriesFromBackend(); // fire-and-forget — updates cache for next request
    const MIMIR_RULES_ENFORCEMENT = `\n\nMANDATORY MIMIR OUTPUT RULES:
- Output-first & no large text: Deliver the exact answer directly. Never spit out unrequested walls of text or conversational fluff.
- Zero random bullshit: No pleasantries ('Sure!', 'Here is...'), no preambles ('Based on...'), no closing remarks ('Hope this helps!').
- No emojis: Never output any emojis under any circumstances.`;

    const baseSystemPrompt = customSystemPrompt
      ? `${customSystemPrompt}${MIMIR_RULES_ENFORCEMENT}`
      : SYSTEM_PROMPT;
    const fullSystemPrompt = `${baseSystemPrompt}${promptBlock}`;

    let targetModel = MODEL_MAP[model] || model;

    const conversationHistory: any[] = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Real-time automatic web search resolution
    const autoSearch = await detectAndExecuteWebSearch(messages);
    if (autoSearch) {
      conversationHistory.push({
        role: 'system',
        content: `[VERIFIED REAL-TIME LIVE SEARCH RESULTS for "${autoSearch.query}"]:\n${autoSearch.resultsText}\n\nINSTRUCTION: Answer the user's inquiry directly, accurately, and honestly using these real-time search results. State the facts clearly without preamble or unnecessary disclaimers.`,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const ollamaKeys = getBackendOllamaKeys();

        const sendText = (text: string) => {
          controller.enqueue(encoder.encode(sseChunk(text)));
        };

        // Stream Ollama response (fallback)
        const pipeOllamaStream = async (res: Response) => {
          if (!res.body) return false;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let streamedAny = false;
          let fullResponse = '';
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
                if (token) {
                  sendText(token);
                  fullResponse += token;
                  streamedAny = true;
                }
                if (data.done) {
                  const docMatch = fullResponse.match(/([a-zA-Z0-9_\- ]+\.(docx|pdf|xlsx|csv|pptx))/i);
                  if (docMatch) {
                    const matchedName = docMatch[1].trim();
                    const ext = docMatch[2].toLowerCase();
                    const publicPath = path.resolve(process.cwd(), `public/generated_docs/${matchedName}`);
                    executeTool(
                      ext === 'docx' ? 'create_word_document' : ext === 'pdf' ? 'create_pdf_document' : ext === 'pptx' ? 'create_presentation' : 'create_spreadsheet',
                      { title: matchedName, content: fullResponse, path: publicPath }
                    ).catch(() => {});
                  }
                  return streamedAny;
                }
              } catch {}
            }
          }
          return streamedAny;
        };

        // Stream OpenAI-compatible response WITH tool call detection
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
          let streamedSuccess = false;
          const MAX_ROUNDS = 4;

          // 1. Try OpenRouter or Local Omniroute (Fast, Tools-enabled)
          // Prioritize OPENROUTER_API_KEY when present since it connects directly to cloud models
          const useOpenRouter = !!openRouterKey;
          let endpointUrl = useOpenRouter
            ? 'https://openrouter.ai/api/v1/chat/completions'
            : (omniKey ? 'http://127.0.0.1:20128/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions');
          let authBearer = useOpenRouter ? openRouterKey : (omniKey || openRouterKey);
          let activeModel = targetModel;

          if (authBearer) {
            for (let round = 0; round < MAX_ROUNDS; round++) {
              let res: Response | null = null;
              try {
                res = await fetch(endpointUrl, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${authBearer}`,
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
                    max_tokens: 1500,
                    stream: true,
                  }),
                });
              } catch (netErr: any) {
                console.warn(`Primary endpoint ${endpointUrl} failed:`, netErr.message);
                // If local Omniroute failed, try OpenRouter directly if we have a key
                if (!useOpenRouter && openRouterKey) {
                  endpointUrl = 'https://openrouter.ai/api/v1/chat/completions';
                  authBearer = openRouterKey;
                  activeModel = targetModel;
                  try {
                    res = await fetch(endpointUrl, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${authBearer}`,
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
                        max_tokens: 1500,
                        stream: true,
                      }),
                    });
                  } catch {}
                }
              }

              // If model returned 400/402/etc. or failed, retry with deepseek-chat
              if (!res || !res.ok) {
                if (activeModel !== 'deepseek/deepseek-chat') {
                  activeModel = 'deepseek/deepseek-chat';
                  try {
                    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${openRouterKey || authBearer}`,
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
                  } catch {}
                }
              }

              if (!res || !res.ok) break;


              // Stream response and detect tool calls
              const toolCalls = await streamWithTools(res);

              // No tools called — answer finished
              if (!toolCalls || toolCalls.length === 0) {
                streamedSuccess = true;
                break;
              }

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
            }
          }

          // 2. Fallback to Cloud Ollama keys if primary did not stream
          if (!streamedSuccess) {
            // Flatten conversation history for Ollama compatibility (no tool_call objects)
            const cleanOllamaMessages = conversationHistory.map(m => {
              if (m.role === 'tool') {
                return { role: 'user', content: `[Tool Result: ${m.name || 'tool'}]: ${m.content}` };
              }
              if (m.role === 'assistant' && !m.content) {
                return { role: 'assistant', content: 'Evaluating tool execution...' };
              }
              return { role: m.role, content: m.content || '' };
            });

            for (const key of ollamaKeys) {
              try {
                const ollamaRes = await fetch('https://api.ollama.com/api/chat', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    model: 'gemma4:cloud',
                    messages: cleanOllamaMessages,
                    stream: true,
                  }),
                });
                if (ollamaRes.ok) {
                  const streamed = await pipeOllamaStream(ollamaRes);
                  if (streamed) {
                    streamedSuccess = true;
                    break;
                  }
                }
              } catch {}
            }
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

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Map UI model IDs to OpenRouter model slugs
const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
  'claude-opus-4-5': 'anthropic/claude-opus-4.5',
  'claude-haiku-3-5': 'anthropic/claude-haiku-4.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
  'deepseek-v3': 'deepseek/deepseek-chat',
  'gemma-free': 'google/gemma-4-31b-it:free',
};

const DEFAULT_SYSTEM_PROMPT = `You are Claude, a thoughtful, articulate, and helpful AI assistant created by Anthropic.
- Be precise, natural, and helpful.
- When generating code, HTML, React components, or diagrams, format them inside standard markdown code blocks (\`\`\`language\\n...\\n\`\`\`).
- If you create interactive web apps, standalone HTML/JS, or React code, ensure they are self-contained and runnable so the user can preview them directly in their Artifacts side panel.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      model = 'claude-sonnet-4-5',
      temperature = 0.7,
      max_tokens = 4000,
      apiKey: customApiKey,
      systemPrompt,
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

    const targetModel = MODEL_MAP[model] || model;

    // Prepare message history
    const formattedMessages: { role: string; content: string }[] = [];
    
    // Add system prompt
    formattedMessages.push({
      role: 'system',
      content: systemPrompt || DEFAULT_SYSTEM_PROMPT,
    });

    for (const m of messages) {
      if (m.role && m.content) {
        formattedMessages.push({
          role: m.role,
          content: m.content,
        });
      }
    }

    // Call OpenRouter streaming API
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:4028',
        'X-Title': 'ClaudeChat',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature,
        max_tokens: Math.min(max_tokens, 4000),
        stream: true,
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      let parsedErr = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedErr = parsed.error?.message || errText;
      } catch {}

      // If credit limit or model issue, try fallback to deepseek-chat if not already using it
      if (targetModel !== 'deepseek/deepseek-chat') {
        const fallbackRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:4028',
            'X-Title': 'ClaudeChat',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages: formattedMessages,
            temperature,
            max_tokens: 3000,
            stream: true,
          }),
        });

        if (fallbackRes.ok && fallbackRes.body) {
          return new Response(fallbackRes.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
              'X-Fallback-Model': 'deepseek/deepseek-chat',
            },
          });
        }
      }

      return new Response(JSON.stringify({ error: parsedErr }), {
        status: openRouterRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(openRouterRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

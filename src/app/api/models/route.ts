import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasStabilityKey = Boolean(process.env.STABILITY_API_KEY);

  const models = [
    {
      id: 'claude-sonnet-4-5',
      name: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      slug: 'anthropic/claude-sonnet-4.5',
      description: 'Most intelligent & articulate model, ideal for coding and deep thinking',
      contextLength: 200000,
      badge: 'Recommended',
    },
    {
      id: 'claude-opus-4-5',
      name: 'Claude Opus 4.5',
      provider: 'Anthropic',
      slug: 'anthropic/claude-opus-4.5',
      description: 'Maximum depth of reasoning and synthesis for complex multidisciplinary challenges',
      contextLength: 200000,
      badge: 'Pro',
    },
    {
      id: 'claude-haiku-3-5',
      name: 'Claude Haiku 3.5',
      provider: 'Anthropic',
      slug: 'anthropic/claude-haiku-4.5',
      description: 'Lightweight, ultra-fast responses for quick tasks and drafts',
      contextLength: 200000,
      badge: 'Fast',
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek V3',
      provider: 'DeepSeek',
      slug: 'deepseek/deepseek-chat',
      description: 'Exceptional coding and general knowledge with high throughput',
      contextLength: 64000,
      badge: 'Popular',
    },
    {
      id: 'google-gemma-31b',
      name: 'Google Gemma 4 31B (Free)',
      provider: 'Google',
      slug: 'google/gemma-4-31b-it:free',
      description: 'Capable open-weights model accessible without credit consumption',
      contextLength: 32000,
      badge: 'Free',
    },
    {
      id: 'nvidia-nemotron-120b',
      name: 'Nvidia Nemotron 120B (Free)',
      provider: 'Nvidia',
      slug: 'nvidia/nemotron-3-super-120b-a12b:free',
      description: 'Large-scale reasoning model optimized for synthetic instruction',
      contextLength: 32000,
      badge: 'Free',
    },
  ];

  return NextResponse.json({
    models,
    keys: {
      openrouter: hasOpenRouterKey,
      anthropic: hasAnthropicKey,
      stability: hasStabilityKey,
    },
  });
}

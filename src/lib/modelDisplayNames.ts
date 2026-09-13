/**
 * Centralized Single Source of Truth for Model Display Names
 *
 * Maps Sanskrit display names to underlying model IDs and raw names:
 * - "Tvarā" (त्वरा — speed) → DeepSeek V3 (Fast)
 * - "Laghu" (लघु — light/nimble) → Claude Haiku 3.5
 * - "Sthira" (स्थिर — steady/stable) → Claude Sonnet 4.5
 * - "Pragya" (प्रज्ञा — deep wisdom) → Claude Opus 4.5
 * - "Manas" (मनस् — mind/intellect) → Google Gemma 4 31B
 * - "Bṛhat" (बृहत् — vast/immense) → Nvidia Nemotron 120B
 *
 * API calls, OpenRouter slugs, and model IDs stay 100% UNCHANGED.
 */

export interface SanskritModelConfig {
  /** The underlying API model identifier (e.g. 'deepseek-chat', 'claude-sonnet-4-5') */
  id: string;
  /** Real model display name for subtitles/tooltips */
  rawName: string;
  /** Primary display name with proper diacritics */
  displayName: string;
  /** ASCII fallback if fonts/browsers do not support diacritics */
  asciiFallback: string;
  /** Sanskrit Devanagari script representation */
  sanskritScript: string;
  /** Literal Sanskrit meaning */
  meaning: string;
  /** Formatted subtitle (e.g. "speed · DeepSeek V3 (Fast)") */
  subtitle: string;
  /** Full tooltip for hover state */
  tooltip: string;
  /** Attached badge (Fast, ACTIVE, Pro, Free) */
  badge?: string;
  /** High-level capability description */
  description: string;
  /** Provider key for icons and styling */
  provider: 'deepseek' | 'anthropic' | 'google' | 'nvidia';
}

/**
 * Preserved ordering of all available models
 */
export const SANSKRIT_MODELS: SanskritModelConfig[] = [
  {
    id: 'deepseek-chat',
    rawName: 'DeepSeek V3 (Fast)',
    displayName: 'Tvarā',
    asciiFallback: 'Tvara',
    sanskritScript: 'त्वरा',
    meaning: 'speed',
    subtitle: 'speed · DeepSeek V3 (Fast)',
    tooltip: 'Tvarā (त्वरा) — speed · DeepSeek V3 (Fast)',
    badge: 'Fast',
    description: 'Instant response, high intelligence & live tools',
    provider: 'deepseek',
  },
  {
    id: 'claude-sonnet-4-5',
    rawName: 'Claude Sonnet 4.5',
    displayName: 'Sthira',
    asciiFallback: 'Sthira',
    sanskritScript: 'स्थिर',
    meaning: 'steady/stable',
    subtitle: 'steady/stable · Claude Sonnet 4.5',
    tooltip: 'Sthira (स्थिर) — steady/stable · Claude Sonnet 4.5',
    badge: 'ACTIVE',
    description: 'Deep reasoning & articulate',
    provider: 'anthropic',
  },
  {
    id: 'claude-opus-4-5',
    rawName: 'Claude Opus 4.5',
    displayName: 'Pragya',
    asciiFallback: 'Pragya',
    sanskritScript: 'प्रज्ञा',
    meaning: 'deep wisdom',
    subtitle: 'deep wisdom · Claude Opus 4.5',
    tooltip: 'Pragya (प्रज्ञा) — deep wisdom · Claude Opus 4.5',
    badge: 'Pro',
    description: 'Complex multi-step tasks',
    provider: 'anthropic',
  },
  {
    id: 'claude-haiku-3-5',
    rawName: 'Claude Haiku 3.5',
    displayName: 'Laghu',
    asciiFallback: 'Laghu',
    sanskritScript: 'लघु',
    meaning: 'light/nimble',
    subtitle: 'light/nimble · Claude Haiku 3.5',
    tooltip: 'Laghu (लघु) — light/nimble · Claude Haiku 3.5',
    badge: 'Fast',
    description: 'Fast & efficient',
    provider: 'anthropic',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    rawName: 'Google Gemma 4 31B',
    displayName: 'Manas',
    asciiFallback: 'Manas',
    sanskritScript: 'मनस्',
    meaning: 'mind/intellect',
    subtitle: 'mind/intellect · Google Gemma 4 31B',
    tooltip: 'Manas (मनस्) — mind/intellect · Google Gemma 4 31B',
    badge: 'Free',
    description: 'Open weights (Free)',
    provider: 'google',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    rawName: 'Nvidia Nemotron 120B',
    displayName: 'Bṛhat',
    asciiFallback: 'Brihat',
    sanskritScript: 'बृहत्',
    meaning: 'vast/immense',
    subtitle: 'vast/immense · Nvidia Nemotron 120B',
    tooltip: 'Bṛhat (बृहत्) — vast/immense · Nvidia Nemotron 120B',
    badge: 'Free',
    description: 'High capability (Free)',
    provider: 'nvidia',
  },
];

/**
 * Normalizes an arbitrary model string (ID, display name, ASCII fallback, or raw name)
 * to its SanskritModelConfig object.
 */
export function getModelConfig(identifier?: string | null): SanskritModelConfig | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();

  // 1. Exact matches
  const exact = SANSKRIT_MODELS.find(
    (m) =>
      m.id.toLowerCase() === clean ||
      m.displayName.toLowerCase() === clean ||
      m.asciiFallback.toLowerCase() === clean ||
      m.rawName.toLowerCase() === clean
  );
  if (exact) return exact;

  // 2. Keyword heuristic matches
  return SANSKRIT_MODELS.find((m) => {
    const idLow = m.id.toLowerCase();
    const dispLow = m.displayName.toLowerCase();
    const asciiLow = m.asciiFallback.toLowerCase();
    const rawLow = m.rawName.toLowerCase();

    return (
      clean.includes(idLow) ||
      clean.includes(dispLow) ||
      clean.includes(asciiLow) ||
      clean.includes(rawLow) ||
      (m.id === 'deepseek-chat' && (clean.includes('deepseek') || clean.includes('tvara'))) ||
      (m.id === 'claude-sonnet-4-5' && clean.includes('sonnet')) ||
      (m.id === 'claude-opus-4-5' && clean.includes('opus')) ||
      (m.id === 'claude-haiku-3-5' && clean.includes('haiku')) ||
      (m.id === 'google/gemma-4-31b-it:free' && (clean.includes('gemma') || clean.includes('google') || clean.includes('manas'))) ||
      (m.id === 'nvidia/nemotron-3-super-120b-a12b:free' && (clean.includes('nemotron') || clean.includes('nvidia') || clean.includes('brihat') || clean.includes('bṛhat')))
    );
  });
}

/**
 * Returns Sanskrit display name, falling back to ASCII or original input.
 */
export function getSanskritDisplayName(identifier?: string | null): string {
  const config = getModelConfig(identifier);
  return config ? config.displayName : identifier || 'Tvarā';
}

/**
 * Returns ASCII fallback name.
 */
export function getModelAsciiFallback(identifier?: string | null): string {
  const config = getModelConfig(identifier);
  return config ? config.asciiFallback : identifier || 'Tvara';
}

/**
 * Returns subtitle string (meaning + real model name).
 */
export function getModelSubtitle(identifier?: string | null): string {
  const config = getModelConfig(identifier);
  return config ? config.subtitle : '';
}

/**
 * Returns tooltip string.
 */
export function getModelTooltip(identifier?: string | null): string {
  const config = getModelConfig(identifier);
  return config ? config.tooltip : identifier || '';
}

/**
 * Returns underlying API model ID given any display label or identifier.
 */
export function getUnderlyingModelId(identifier?: string | null): string {
  const config = getModelConfig(identifier);
  return config ? config.id : identifier || 'deepseek-chat';
}

/**
 * Detects whether the user's prompt is asking about what model/AI is being used.
 */
export function isModelIdentityQuery(text?: string | null): boolean {
  if (!text) return false;
  const q = text.toLowerCase().trim().replace(/[?!.,;:]+$/, '').trim();

  // Short direct questions
  if (/^(what|which)(\s+is)?\s+(the\s+)?(model|llm|ai|version)(\s+name)?$/i.test(q)) return true;

  const patterns = [
    /\b(what|which)\s+(model|version|llm|ai|engine)\b/i,
    /\b(what|which)\s+one\s+(am\s+i|are\s+you)\s+using\b/i,
    /\b(model|version|engine|llm)\s+(am\s+i|i\s+am|are\s+you|you\s+are|is\s+this|is\s+being|is\s+selected|currently)\s+(using|run|running|selected|active)\b/i,
    /\b(what|which)\s+(model|engine)\s+(am\s+i|i\s+am|are\s+you|you\s+are)\s+(using|on|running)\b/i,
    /\btell\s+me(\s+about)?\s+(what|which|the)?\s+(model|engine|version)\b/i,
    /\bwhat\s+model\s+i\s+am\s+using\b/i,
    /\bwhat\s+model\s+am\s+i\s+using\b/i,
    /\bwhat\s+model\s+are\s+you\s+using\b/i,
    /\bwhat('s|\s+is)\s+(your|this|the|my|selected|active)\s+model\b/i,
    /\bwhat\s+is\s+this\s+model\b/i,
    /\babout\s+(this|the|your)\s+model\b/i,
    /\bmodel\s+(kya|kaun|kaunsa|kounsa|kaisa)\b/i,
    /\b(kaunsa|kounsa|kya|kon)\s+model\b/i,
    /\b(ye|yeh|yehi)\s+model\b/i,
    /\b(ye|edhi|e)\s+model\b/i,
    /\bmodel\s+enti\b/i,
    /\b(enna|ennaa)\s+model\b/i,
    /\b(yava|yaava)\s+model\b/i,
    /\b(eta|ei)\s+ki\s+model\b/i,
    /\b(keda|kehda)\s+model\b/i,
    /\b(who|what)\s+are\s+you\s+powered\s+by\b/i,
  ];

  return patterns.some((p) => p.test(q));
}

/**
 * Returns a rich, culturally authentic explanation of the active model in the requested language.
 */
export function getModelExplanation(m: SanskritModelConfig, langId = 'en-IN'): string {
  const lang = (langId || 'en-IN').toLowerCase();

  const roleDescEn: Record<string, string> = {
    'deepseek-chat': 'Engineered for lightning-fast turnarounds, interactive coding, and live tool orchestration with supreme efficiency.',
    'claude-sonnet-4-5': 'Optimized for deep logical reasoning, articulate essay-quality writing, and nuanced multi-step precision.',
    'claude-opus-4-5': 'Premier flagship intelligence tailored for complex multi-layered problem solving, architectural design, and deep analysis.',
    'claude-haiku-3-5': 'Snappy, lightweight assistance designed for rapid turnarounds, quick lookups, and everyday productivity.',
    'google/gemma-4-31b-it:free': 'Open-weights powerhouse featuring rich multilingual grounding, empathetic dialogue, and versatile reasoning.',
    'nvidia/nemotron-3-super-120b-a12b:free': 'Massive scale 120B parameter model engineered for complex computational, scientific, and high-complexity analytical workflows.',
  };

  const roleEn = roleDescEn[m.id] || m.description;

  // Hindi
  if (lang === 'hi' || lang.startsWith('hi-')) {
    return `आप वर्तमान में **${m.displayName} (${m.sanskritScript})** मॉडल का उपयोग कर रहे हैं।

### सक्रिय मॉडल का विवरण:
- **मॉडल का नाम:** **${m.displayName}** (${m.sanskritScript})
- **संस्कृत अर्थ:** *'${m.meaning}'*
- **मूल आर्किटेक्चर:** **${m.rawName}** (${m.provider.toUpperCase()})
- **विशेषताएँ और क्षमता:** ${m.description}
- **प्रज्ञा (Pragna) में भूमिका:** ${roleEn}

मैं आपकी किस प्रकार सहायता कर सकती हूँ?`;
  }

  // Telugu
  if (lang === 'te' || lang.startsWith('te-')) {
    return `మీరు ప్రస్తుతం **${m.displayName} (${m.sanskritScript})** మోడల్‌ను ఉపయోగిస్తున్నారు.

### సక్రియాత్మక మోడల్ వివరాలు:
- **మోడల్ పేరు:** **${m.displayName}** (${m.sanskritScript})
- **సంస్కృతంలో అర్థం:** *'${m.meaning}'*
- **ప్రధాన ఆర్కిటెక్చర్:** **${m.rawName}** (${m.provider.toUpperCase()})
- **ముఖ్య సామర్థ్యాలు:** ${m.description}
- **ప్రజ్ఞ (Pragna) లో పాత్ర:** ${roleEn}

ప్రస్తుతం మీకు నేను ఏ విధంగా సహాయపడగలను?`;
  }

  // Tamil
  if (lang === 'ta' || lang.startsWith('ta-')) {
    return `நீங்கள் தற்போது **${m.displayName} (${m.sanskritScript})** மாதிரியைப் பயன்படுத்துகிறீர்கள்.

### செயலில் உள்ள மாதிரியின் விவரங்கள்:
- **மாதிரியின் பெயர்:** **${m.displayName}** (${m.sanskritScript})
- **சமஸ்கிருத பொருள்:** *'${m.meaning}'*
- **அடிப்படை கட்டமைப்பு:** **${m.rawName}** (${m.provider.toUpperCase()})
- **முக்கிய பலங்கள்:** ${m.description}
- **பிரக்ஞா (Pragna) வில் பங்கு:** ${roleEn}

நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?`;
  }

  // Bengali
  if (lang === 'bn' || lang.startsWith('bn-')) {
    return `আপনি বর্তমানে **${m.displayName} (${m.sanskritScript})** মডেলটি ব্যবহার করছেন।

### সক্রিয় মডেলের বিশদ বিবরণ:
- **মডেলের নাম:** **${m.displayName}** (${m.sanskritScript})
- **সংস্কৃত অর্থ:** *'${m.meaning}'*
- **মূল আর্কিটেকচার:** **${m.rawName}** (${m.provider.toUpperCase()})
- **প্রধান সক্ষমতা:** ${m.description}
- **প্রজ্ঞায় ভূমিকা:** ${roleEn}

আমি আপনাকে কীভাবে সাহায্য করতে পারি?`;
  }

  // Kannada
  if (lang === 'kn' || lang.startsWith('kn-')) {
    return `ನೀವು ಪ್ರಸ್ತುತ **${m.displayName} (${m.sanskritScript})** ಮಾದರಿಯನ್ನು ಬಳಸುತ್ತಿದ್ದೀರಿ.

### ಸಕ್ರಿಯ ಮಾದರಿಯ ವಿವರಗಳು:
- **ಮಾದರಿಯ ಹೆಸರು:** **${m.displayName}** (${m.sanskritScript})
- **ಸಂಸ್ಕೃತ ಅರ್ಥ:** *'${m.meaning}'*
- **ಮೂಲ ವಾಸ್ತುಶಿಲ್ಪ:** **${m.rawName}** (${m.provider.toUpperCase()})
- **ಪ್ರಮುಖ ಸಾಮರ್ಥ್ಯಗಳು:** ${m.description}
- **ಪ್ರಜ್ಞಾ (Pragna) ದಲ್ಲಿ ಪಾತ್ರ:** ${roleEn}

ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`;
  }

  // Malayalam
  if (lang === 'ml' || lang.startsWith('ml-')) {
    return `നിങ്ങൾ ഇപ്പോൾ **${m.displayName} (${m.sanskritScript})** മോഡലാണ് ഉപയോഗിക്കുന്നത്.

### സജീവമായ മോഡലിന്റെ വിവരങ്ങൾ:
- **മോഡലിന്റെ പേര്:** **${m.displayName}** (${m.sanskritScript})
- **സംസ്കൃത അർത്ഥം:** *'${m.meaning}'*
- **അടിസ്ഥാന ആർക്കിടെക്ചർ:** **${m.rawName}** (${m.provider.toUpperCase()})
- **പ്രധാന സവിശേഷതകൾ:** ${m.description}
- **പ്രജ്ഞയിലെ പങ്ക്:** ${roleEn}

ഞാൻ എങ്ങനെ സഹായിക്കണം?`;
  }

  // Marathi
  if (lang === 'mr' || lang.startsWith('mr-')) {
    return `तुम्ही सध्या **${m.displayName} (${m.sanskritScript})** मॉडेल वापरत आहात.

### सक्रिय मॉडेलचे तपशील:
- **मॉडेलचे नाव:** **${m.displayName}** (${m.sanskritScript})
- **संस्कृत अर्थ:** *'${m.meaning}'*
- **मूळ आर्किटेक्चर:** **${m.rawName}** (${m.provider.toUpperCase()})
- **मुख्य क्षमता:** ${m.description}
- **प्रज्ञा (Pragna) मधील भूमिका:** ${roleEn}

मी तुम्हाला कशी मदत करू शकते?`;
  }

  // Gujarati
  if (lang === 'gu' || lang.startsWith('gu-')) {
    return `તમે હાલમાં **${m.displayName} (${m.sanskritScript})** મોડેલનો ઉપયોગ કરી રહ્યા છો.

### સક્રિય મોડેલની વિગતો:
- **મોડેલનું નામ:** **${m.displayName}** (${m.sanskritScript})
- **સંસ્કૃત અર્થ:** *'${m.meaning}'*
- **મૂળ આર્કિટેક્ચર:** **${m.rawName}** (${m.provider.toUpperCase()})
- **મુખ્ય ક્ષમતાઓ:** ${m.description}
- **પ્રજ્ઞા (Pragna) માં ભૂમિકા:** ${roleEn}

હું તમારી કેવી રીતે મદદ કરી શકું?`;
  }

  // Urdu
  if (lang === 'ur' || lang.startsWith('ur-')) {
    return `آپ اس وقت **${m.displayName} (${m.sanskritScript})** ماڈل استعمال کر رہے ہیں۔

### فعال ماڈل کی تفصیلات:
- **ماڈل کا نام:** **${m.displayName}** (${m.sanskritScript})
- **سنسکرت معنی:** *'${m.meaning}'*
- **بنیادی آرکیٹیکچر:** **${m.rawName}** (${m.provider.toUpperCase()})
- **اہم خصوصیات:** ${m.description}
- **پراگیا (Pragna) میں کردار:** ${roleEn}

بتائیے، میں آپ کی کیا مدد کر سکتی ہوں؟`;
  }

  // English (Default)
  return `You are currently using **${m.displayName} (${m.sanskritScript})**.

### Active Model Specifications:
- **Model Name:** **${m.displayName}** (${m.sanskritScript})
- **Sanskrit Meaning:** *'${m.meaning}'*
- **Underlying Architecture:** **${m.rawName}** by ${m.provider.toUpperCase()}
- **Core Strengths:** ${m.description}
- **Role in Pragna:** ${roleEn}

How can **${m.displayName}** assist you today?`;
}

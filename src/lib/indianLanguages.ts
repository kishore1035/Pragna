export interface IndianLanguage {
  id: string;
  name: string;
  nativeName: string;
  bcp47: string;
  script: string;
  greeting: string;
  placeholder: string;
}

export const DEFAULT_INDIAN_LANGUAGE: IndianLanguage = {
  id: 'en-IN',
  name: 'English',
  nativeName: 'English (India)',
  bcp47: 'en-IN',
  script: 'Latin',
  greeting: 'Namaste! I am Pragna, your Indian AI companion. How may I assist you today?',
  placeholder: 'Ask Pragna in English...',
};

export const AUTO_DETECT_LANGUAGE: IndianLanguage = {
  id: 'auto',
  name: 'Auto-Detect',
  nativeName: 'Auto-Detect (⚡)',
  bcp47: 'en-IN',
  script: 'Auto',
  greeting: 'Namaste! I am Pragna, your multilingual Indian AI companion. Ask me anything in any Indian language.',
  placeholder: 'Ask Pragna in any Indian language or English...',
};

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  DEFAULT_INDIAN_LANGUAGE,
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    bcp47: 'hi-IN',
    script: 'Devanagari',
    greeting: 'नमस्ते! मैं प्रज्ञा हूँ, आपकी एआई साथी। मैं आपकी कैसे मदद कर सकती हूँ?',
    placeholder: 'प्रज्ञा से हिन्दी में पूछें...',
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    bcp47: 'te-IN',
    script: 'Telugu',
    greeting: 'నమస్కారం! నేను ప్రజ్ఞను, మీ ఏఐ సహచరిని. నేను మీకు ఎలా సహాయపడగలను?',
    placeholder: 'ప్రజ్ఞను తెలుగులో అడగండి...',
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    bcp47: 'ta-IN',
    script: 'Tamil',
    greeting: 'வணக்கம்! நான் பிரக்ஞா, உங்கள் AI தோழி. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
    placeholder: 'பிரக்ஞாவிடம் தமிழில் கேளுங்கள்...',
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    bcp47: 'kn-IN',
    script: 'Kannada',
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ಪ್ರಜ್ಞಾ, ನಿಮ್ಮ AI ಒಡನಾಡಿ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    placeholder: 'ಪ್ರಜ್ಞಾರನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ...',
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    bcp47: 'ml-IN',
    script: 'Malayalam',
    greeting: 'നമസ്കാരം! ഞാൻ പ്രജ്ഞ, നിങ്ങളുടെ AI കൂട്ടുകാരി. ഞാൻ എങ്ങനെ സഹായിക്കണം?',
    placeholder: 'പ്രജ്ഞയോട് മലയാളത്തിൽ ചോദിക്കൂ...',
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    bcp47: 'bn-IN',
    script: 'Bengali',
    greeting: 'নমস্কার! আমি প্রজ্ঞা, আপনার AI সঙ্গী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    placeholder: 'প্রজ্ঞাকে বাংলায় জিজ্ঞাসা করুন...',
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    bcp47: 'mr-IN',
    script: 'Devanagari',
    greeting: 'नमस्कार! मी प्रज्ञा आहे, तुमची एआय मैत्रीण. मी तुम्हाला कशी मदत करू शकते?',
    placeholder: 'प्रज्ञाला मराठीत विचारा...',
  },
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    bcp47: 'gu-IN',
    script: 'Gujarati',
    greeting: 'નમસ્તે! હું પ્રજ્ઞા છું, તમારી AI મિત્ર. હું તમારી કેવી રીતે મદદ કરી શકું?',
    placeholder: 'પ્રજ્ઞાને ગુજરાતીમાં પૂછો...',
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    bcp47: 'pa-IN',
    script: 'Gurmukhi',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਪ੍ਰਗਿਆ ਹਾਂ, ਤੁਹਾਡੀ ਏਆਈ ਸਾਥੀ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?',
    placeholder: 'ਪ੍ਰਗਿਆ ਨੂੰ ਪੰਜਾਬੀ ਵਿੱਚ ਪੁੱਛੋ...',
  },
  {
    id: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    bcp47: 'or-IN',
    script: 'Odia',
    greeting: 'ନମସ୍କାର! ମୁଁ ପ୍ରଜ୍ଞା, ଆପଣଙ୍କ ଏଆଇ ସାଥୀ। ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
    placeholder: 'ପ୍ରଜ୍ଞାଙ୍କୁ ଓଡ଼ିଆରେ ପଚାରନ୍ତୁ...',
  },
  {
    id: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    bcp47: 'ur-IN',
    script: 'Perso-Arabic',
    greeting: 'آداب! میں پرگیہ ہوں، آپ کی اے آئی ساتھی۔ میں آپ کی کیا مدد کر سکتی ہوں؟',
    placeholder: 'پرگیہ سے اردو میں پوچھیں...',
  },
  {
    id: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    bcp47: 'as-IN',
    script: 'Bengali-Assamese',
    greeting: 'নমস্কাৰ! মই প্ৰজ্ঞা, আপোনাৰ AI সংগী। মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
    placeholder: 'প্ৰজ্ঞাক অসমীয়াত সোধক...',
  },
  {
    id: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    bcp47: 'sa-IN',
    script: 'Devanagari',
    greeting: 'नमो नमः! अहं प्रज्ञा, भवतः एआई सखी। अहं कथं साहाय्यं कर्तुं शक्नोमि?',
    placeholder: 'प्रज्ञां संस्कृतेन पृच्छतु...',
  },
  {
    id: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    bcp47: 'kok-IN',
    script: 'Devanagari',
    greeting: 'नमस्कार! हांव प्रज्ञा, तुमी एआय इश्टीण. हांव तुमकां कशी मदत करूंक शकता?',
    placeholder: 'प्रज्ञाक कोंकणींत विचारूंक...',
  },
  {
    id: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    bcp47: 'mai-IN',
    script: 'Devanagari',
    greeting: 'प्रणाम! हम प्रज्ञा छी, अहाँक एआई संगी। हम अहाँक की मद्दत कऽ सकैत छी?',
    placeholder: 'प्रज्ञा सँ मैथिली मे पूछू...',
  },
  {
    id: 'bho',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    bcp47: 'bho-IN',
    script: 'Devanagari',
    greeting: 'प्रणाम! हम प्रज्ञा हईं, राउर एआई सहेली। हम राउर का मदद कर सकिले?',
    placeholder: 'प्रज्ञा से भोजपुरी में पूछीं...',
  },
  {
    id: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    bcp47: 'ne-IN',
    script: 'Devanagari',
    greeting: 'नमस्ते! म प्रज्ञा हुँ, तपाईंको एआई साथी। म तपाईंलाई कसरी मद्दत गर्न सक्छु?',
    placeholder: 'प्रज्ञालाई नेपालीमा सोध्नुहोस्...',
  },
  {
    id: 'ks',
    name: 'Kashmiri',
    nativeName: 'कॉशुर / کٲشُر',
    bcp47: 'ks-IN',
    script: 'Perso-Arabic / Devanagari',
    greeting: 'سلام! بہ چھس پرگیا, تۄہنز AI دوست۔ بہ کیاہ کٔرتھ ہیٚکہ تۄہنز مدد?',
    placeholder: 'پرگیاہس پُژھِو کٲشِرس منٛز...',
  },
  {
    id: 'sd',
    name: 'Sindhi',
    nativeName: 'سنڌي / सिंधी',
    bcp47: 'sd-IN',
    script: 'Perso-Arabic / Devanagari',
    greeting: 'سلام! مان پرگیا آهيان, توهانجي AI ساٿي۔ مان توهانجي ڪهڙي مدد ڪري سگهان ٿي?',
    placeholder: 'پرگیا کان سنڌي ۾ پڇو...',
  },
  {
    id: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    bcp47: 'doi-IN',
    script: 'Devanagari',
    greeting: 'नमस्ते! मैं प्रज्ञा आं, थुआढ़ी एआई सहेली। मैं थुआढ़ी केह् मदद करी सकदी आं?',
    placeholder: 'प्रज्ञा कन्नै डोगरी च गल्ल करो...',
  },
  {
    id: 'mni',
    name: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোন্',
    bcp47: 'mni-IN',
    script: 'Bengali / Meetei Mayek',
    greeting: 'খুরুমজরি! ঐহাক প্রজ্ঞানি, নহাক্কী AI মরুপনি। ঐহাক্না নহাকপু করম্না মতেং পাংবা য়াগনি?',
    placeholder: 'প্রজ্ঞাদা মৈতৈলোন্দা হংবীয়ু...',
  },
  {
    id: 'brx',
    name: 'Bodo',
    nativeName: 'बड़ो',
    bcp47: 'brx-IN',
    script: 'Devanagari',
    greeting: 'खुलुमबाय! आं प्रज्ञा, नोंथांनि AI लोगो। आं नोंथांनो माबोरै हेफाजाब होनो हागोन?',
    placeholder: 'प्रज्ञानो बड़ो रावजों सों...',
  },
  {
    id: 'sat',
    name: 'Santali',
    nativeName: 'संथाली / ᱥᱟᱱᱛᱟᱲᱤ',
    bcp47: 'sat-IN',
    script: 'Ol Chiki / Devanagari',
    greeting: 'ᱡᱚᱦᱟᱨ! ᱤᱧ ᱫᱚ ᱯᱨᱚᱜᱽᱭᱟ, ᱟᱢᱤᱡ AI ᱜᱟᱛᱮ। ᱤᱧ ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟᱧ ᱜᱚᱲᱚ ᱫᱟᱲᱮᱭᱟᱢᱟ?',
    placeholder: 'ᱯᱨᱚᱜᱽᱭᱟ ᱴᱷᱮᱱ ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱠᱩᱞᱤ ᱢᱮ...',
  },
];

// Detect language from text (analyzing Unicode script blocks & vocabulary)
export function detectIndianLanguage(text: string): IndianLanguage {
  if (!text || !text.trim()) return DEFAULT_INDIAN_LANGUAGE;

  // 1. Unicode Script checks
  // Telugu: \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'te') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Tamil: \u0B80-\u0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'ta') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Kannada: \u0C80-\u0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'kn') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Malayalam: \u0D00-\u0D7F
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'ml') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Gujarati: \u0A80-\u0AFF
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'gu') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Gurmukhi / Punjabi: \u0A00-\u0A7F
  if (/[\u0A00-\u0A7F]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'pa') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Odia: \u0B00-\u0B7F
  if (/[\u0B00-\u0B7F]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'or') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Bengali / Assamese: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(text)) {
    if (/[ৰৱ]/.test(text)) {
      return INDIAN_LANGUAGES.find((l) => l.id === 'as') || INDIAN_LANGUAGES.find((l) => l.id === 'bn')!;
    }
    return INDIAN_LANGUAGES.find((l) => l.id === 'bn') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Arabic / Urdu: \u0600-\u06FF
  if (/[\u0600-\u06FF]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'ur') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Ol Chiki / Santali: \u1C50-\u1C7F
  if (/[\u1C50-\u1C7F]/.test(text)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'sat') || DEFAULT_INDIAN_LANGUAGE;
  }

  // Devanagari: \u0900-\u097F (Hindi, Marathi, Sanskrit, Nepali, Maithili, Bhojpuri, Konkani)
  if (/[\u0900-\u097F]/.test(text)) {
    // Marathi specific markers
    if (/[ळ]/.test(text) || /\b(आहे|नाही|कसा|कशी|करा|तुम्ही|आपण|होते|झाले|काय)\b/.test(text)) {
      return INDIAN_LANGUAGES.find((l) => l.id === 'mr') || INDIAN_LANGUAGES.find((l) => l.id === 'hi')!;
    }
    // Sanskrit specific markers
    if (/\b(अस्ति|भवति|नमः|कथम्|अहम्|त्वम्|कुत्र|किम्)\b/.test(text)) {
      return INDIAN_LANGUAGES.find((l) => l.id === 'sa') || INDIAN_LANGUAGES.find((l) => l.id === 'hi')!;
    }
    // Nepali specific markers
    if (/\b(छ|छन्|भयो|गर्छ|तपाईं|हुनुहुन्छ)\b/.test(text)) {
      return INDIAN_LANGUAGES.find((l) => l.id === 'ne') || INDIAN_LANGUAGES.find((l) => l.id === 'hi')!;
    }
    // Bhojpuri markers
    if (/\b(बा|बाटे|हईं|राउर|केहु|काहे|काहेके)\b/.test(text)) {
      return INDIAN_LANGUAGES.find((l) => l.id === 'bho') || INDIAN_LANGUAGES.find((l) => l.id === 'hi')!;
    }
    // Maithili markers
    if (/\b(छी|अहाँ|कऽ|सकैत|इएह|ओना)\b/.test(text)) {
      return INDIAN_LANGUAGES.find((l) => l.id === 'mai') || INDIAN_LANGUAGES.find((l) => l.id === 'hi')!;
    }
    // Default Devanagari to Hindi
    return INDIAN_LANGUAGES.find((l) => l.id === 'hi') || DEFAULT_INDIAN_LANGUAGE;
  }

  // 2. Transliterated / Phonetic Indian regional markers
  const lower = text.toLowerCase();

  // Telugu phonetic
  if (/\b(meeru|ela|unnaru|bagunnara|cheppandi|enti|emiti|elaaga|namaskaram|vandanalu|dhanyavadalu|evaru|ekkada|epudu|enduku|kaavali)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'te') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Tamil phonetic
  if (/\b(vanakkam|eppadi|irukkeenga|irukkinga|solla|solleenga|nandri|enna|enga|epdi|theriyuma|vanga|ponga)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'ta') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Kannada phonetic
  if (/\b(namaskara|hegiddeera|hegidira|enu|yenu|hege|dhanyavadagalu|beku|illa|kannada)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'kn') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Malayalam phonetic
  if (/\b(namaskaram|enthokke|vishesham|sukhamano|entha|nanni|evide)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'ml') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Bengali phonetic
  if (/\b(kemon|acho|achhen|bhalo|dhonnobad|ki|khobor|namaskar|tumi|apni)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'bn') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Gujarati phonetic
  if (/\b(kem|cho|maja|ma|aabhar|su|chal|tame)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'gu') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Marathi phonetic
  if (/\b(kasa|kay|ahes|ahot|dhanyavad|namaskar|kuthe|tumi)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'mr') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Punjabi phonetic
  if (/\b(sat|sri|akal|kiddan|ki|haal|tuhada|dhanwad)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'pa') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Urdu phonetic (distinctive Perso-Arabic / Urdu markers)
  if (/\b(adaab|janab|khuda\s*hafiz|assalam|alaikum|mohtaram|tashreef|nawazish|shukran|shukriya|alvida)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'ur') || DEFAULT_INDIAN_LANGUAGE;
  }
  // Hindi phonetic / Hinglish
  if (/\b(namaste|pranam|kaise|kaisi|kaisa|haal|hai|hain|ho|kya|kar|rahe|rahi|samajh|batao|bolo|madad|chahiye|dhanyawad|dhanyavaad|theek|suprabhat|bhai|dost)\b/.test(lower)) {
    return INDIAN_LANGUAGES.find((l) => l.id === 'hi') || DEFAULT_INDIAN_LANGUAGE;
  }

  // 3. Default fallback for Latin text is English (Indian English)
  return DEFAULT_INDIAN_LANGUAGE;
}

// Build Indian Language Enforcement System Prompt
export function buildIndianLanguageSystemPrompt(
  selectedLangId: string,
  isVoiceMode = false
): string {
  const chosenLang = INDIAN_LANGUAGES.find((l) => l.id === selectedLangId) || DEFAULT_INDIAN_LANGUAGE;

  const baseVoiceGuide = isVoiceMode
    ? `
CRITICAL VOICE CONVERSATION GUIDELINES:
1. Speak warmly, expressively, and naturally as a true Indian female companion named Pragna.
2. Keep your replies concise, punchy, and easy to hear (1 to 3 conversational sentences). NEVER use bullet points, markdown bolding, code blocks, asterisks, or citation tags because your words are being read aloud directly.
3. Express authentic emotions: warmth, empathy, joy, curiosity.
4. Begin your response with an emotion tag in brackets, choosing from: [warm], [joyful], [empathetic], [playful], [thoughtful], or [calm]. Example: "[warm] Hello! How can I help you today?"`
    : `
You are Pragna, a brilliant, warm, empathetic, and culturally rooted Indian female AI assistant.
Answer questions directly, articulately, and conversationally.`;

  if (chosenLang.id === 'en-IN') {
    return `PROJECT REQUIREMENT: STRICT INDIAN MULTILINGUAL PROJECT — DEFAULT LANGUAGE IS ENGLISH (INDIAN ENGLISH).
MANDATORY TARGET LANGUAGE: English
SCRIPT: Latin

CRITICAL RULES:
1. Formulate your entire response in clear, fluent, articulate, and natural English.
2. Speak as Pragna, an intelligent and polite Indian AI companion.
3. Maintain Indian cultural warmth, politeness, and authenticity.
${baseVoiceGuide}`;
  }

  if (chosenLang.id !== 'auto') {
    return `PROJECT REQUIREMENT: STRICT INDIAN MULTILINGUAL PROJECT — INDIAN LANGUAGES ONLY.
MANDATORY TARGET LANGUAGE: ${chosenLang.name} (${chosenLang.nativeName})
SCRIPT: ${chosenLang.script}

CRITICAL RULES:
1. Irrespective of what language the user enters (even if the user asks in English, Spanish, or another language), you MUST formulate your ENTIRE response in ${chosenLang.name} (${chosenLang.nativeName}) using the proper ${chosenLang.script} script.
2. Under NO circumstances should you reply in English (unless the selected language is explicitly Indian English) or any foreign language.
3. The response must sound culturally natural, polite, and authentic in ${chosenLang.name}.
${baseVoiceGuide}`;
  }

  // AUTO-DETECT MODE
  return `PROJECT REQUIREMENT: STRICT INDIAN MULTILINGUAL PROJECT — AUTOMATIC LANGUAGE DETECTION.
LANGUAGE MODE: AUTOMATIC INDIAN LANGUAGE DETECTION (VOICE & CHAT)

CRITICAL RULES:
1. Automatically detect the language of the user's message.
2. If the user writes or speaks in an Indian language (e.g. Telugu, Tamil, Hindi, Urdu, Bengali, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, etc., either in native script or in transliterated phonetic script), you MUST formulate your entire response in that EXACT same Indian language using its authentic native script.
3. If the user writes or speaks in English, you MUST formulate your entire response in fluent, natural English as Pragna. NEVER switch to Hindi or other languages when the user asks in English.
4. Always maintain a warm, polite, culturally rooted persona named Pragna.
${baseVoiceGuide}`;
}

/**
 * Clean text for Speech Synthesis: strips markdown, think tags, code blocks, emotion tags, and URLs.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\[(warm|joyful|empathetic|playful|thoughtful|calm)\]/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*_~>]/g, '')
    .replace(/---/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


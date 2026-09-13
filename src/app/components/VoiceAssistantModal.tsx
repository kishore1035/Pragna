'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb';
import IndianLanguageSelector from '@/components/ui/IndianLanguageSelector';
import {
  INDIAN_LANGUAGES,
  IndianLanguage,
  DEFAULT_INDIAN_LANGUAGE,
  detectIndianLanguage,
} from '@/lib/indianLanguages';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  X,
  Heart,
  Smile,
  Lightbulb,
  Coffee,
  Globe,
} from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: number | null;
  onSendMessage?: (text: string) => void;
  initialLanguage?: IndianLanguage;
}

type EmotionType = 'warm' | 'joyful' | 'empathetic' | 'playful' | 'thoughtful' | 'calm';

interface EmotionConfig {
  label: string;
  badge: string;
  hue: number;
  pitch: number;
  rate: number;
  icon: typeof Sparkles;
  glowColor: string;
}

const EMOTION_MAP: Record<EmotionType, EmotionConfig> = {
  warm: {
    label: 'Warm & Welcoming',
    badge: '✨ Warm & Welcoming',
    hue: 35, // Amber / Honey Gold
    pitch: 1.12,
    rate: 1.0,
    icon: Sparkles,
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  joyful: {
    label: 'Joyful & Cheerful',
    badge: '🌟 Joyful & Cheerful',
    hue: 48, // Radiant Sunny Gold
    pitch: 1.18,
    rate: 1.06,
    icon: Smile,
    glowColor: 'rgba(234, 179, 8, 0.3)',
  },
  empathetic: {
    label: 'Empathetic & Caring',
    badge: '💖 Empathetic & Caring',
    hue: 335, // Soft Rose Quartz / Blossom
    pitch: 1.05,
    rate: 0.94,
    icon: Heart,
    glowColor: 'rgba(244, 114, 182, 0.25)',
  },
  playful: {
    label: 'Playful & Witty',
    badge: '😄 Playful & Witty',
    hue: 18, // Vibrant Peach / Coral
    pitch: 1.2,
    rate: 1.08,
    icon: Smile,
    glowColor: 'rgba(251, 146, 60, 0.3)',
  },
  thoughtful: {
    label: 'Thoughtful & Attentive',
    badge: '💡 Thoughtful & Attentive',
    hue: 265, // Deep Electric Violet
    pitch: 1.02,
    rate: 0.96,
    icon: Lightbulb,
    glowColor: 'rgba(168, 85, 247, 0.25)',
  },
  calm: {
    label: 'Calm & Serene',
    badge: '🌿 Calm & Serene',
    hue: 160, // Emerald / Soft Seafoam
    pitch: 1.04,
    rate: 0.95,
    icon: Coffee,
    glowColor: 'rgba(52, 211, 153, 0.25)',
  },
};

// Heuristic to detect emotion if model did not return explicit tag
function detectEmotion(text: string): EmotionType {
  const lower = text.toLowerCase();
  if (
    lower.includes('[joyful]') ||
    lower.includes('awesome') ||
    lower.includes('fantastic') ||
    lower.includes('congrat') ||
    lower.includes('excited') ||
    lower.includes('आनंद') ||
    lower.includes('సంతోషం') ||
    lower.includes('மகிழ்ச்சி')
  ) {
    return 'joyful';
  }
  if (
    lower.includes('[empathetic]') ||
    lower.includes('sorry') ||
    lower.includes('hear that') ||
    lower.includes('feel') ||
    lower.includes('चिंता') ||
    lower.includes('బాధ') ||
    lower.includes('ஆறுதல்')
  ) {
    return 'empathetic';
  }
  if (
    lower.includes('[playful]') ||
    lower.includes('haha') ||
    lower.includes('fun') ||
    lower.includes('joke') ||
    lower.includes('मजाक') ||
    lower.includes('సరదా') ||
    lower.includes('விளையாட்டு')
  ) {
    return 'playful';
  }
  if (
    lower.includes('[thoughtful]') ||
    lower.includes('fascinat') ||
    lower.includes('interest') ||
    lower.includes('ponder') ||
    lower.includes('विचार') ||
    lower.includes('ఆలోచన')
  ) {
    return 'thoughtful';
  }
  if (
    lower.includes('[calm]') ||
    lower.includes('relax') ||
    lower.includes('peace') ||
    lower.includes('शांत') ||
    lower.includes('ప్రశాంతం') ||
    lower.includes('அமைதி')
  ) {
    return 'calm';
  }
  return 'warm';
}

// Clean text for speech synthesis
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[(warm|joyful|empathetic|playful|thoughtful|calm)\]/gi, '')
    .replace(/\*+/g, '') // remove asterisks
    .replace(/#+/g, '') // remove markdown hashes
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove links keep text
    .replace(/https?:\/\/\S+/g, '') // remove urls
    .replace(/\s+/g, ' ')
    .trim();
}

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  conversationId,
  onSendMessage,
  initialLanguage = DEFAULT_INDIAN_LANGUAGE,
}: VoiceAssistantModalProps) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('warm');
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguage>(initialLanguage);
  const [detectedLanguage, setDetectedLanguage] = useState<IndianLanguage | null>(null);
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available speech synthesis female voices
  const [femaleVoices, setFemaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handsFreeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // Update initial language if prop changes
  useEffect(() => {
    if (initialLanguage) {
      setSelectedLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  // Load and filter browser female voices with Indian prioritization
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const all = window.speechSynthesis.getVoices();
    if (all.length === 0) return;

    // Filter Indian / female / natural voices
    const isIndianOrFemale = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      const l = v.lang.toLowerCase();
      return (
        l.includes('-in') ||
        l.startsWith('hi') ||
        l.startsWith('te') ||
        l.startsWith('ta') ||
        l.startsWith('mr') ||
        l.startsWith('bn') ||
        l.startsWith('gu') ||
        l.startsWith('kn') ||
        l.startsWith('ml') ||
        l.startsWith('pa') ||
        l.startsWith('ur') ||
        n.includes('swara') ||
        n.includes('kalpana') ||
        n.includes('shruti') ||
        n.includes('pallavi') ||
        n.includes('aarohi') ||
        n.includes('tanishaa') ||
        n.includes('dhwani') ||
        n.includes('sapna') ||
        n.includes('sobhana') ||
        n.includes('neerja') ||
        n.includes('female') ||
        n.includes('jenny') ||
        n.includes('aria') ||
        n.includes('zira')
      );
    };

    let voices = all.filter((v) => isIndianOrFemale(v));
    if (voices.length === 0) {
      voices = all.filter((v) => v.lang.startsWith('en'));
    }
    if (voices.length === 0) {
      voices = all;
    }

    setFemaleVoices(voices);

    // Pick top natural Indian or female voice if none selected
    if (!selectedVoiceName && voices.length > 0) {
      const preferred =
        voices.find((v) => v.lang.includes('-IN') && (v.name.includes('Natural') || v.name.includes('Online'))) ||
        voices.find((v) => v.lang.includes('-IN')) ||
        voices.find((v) => v.name.toLowerCase().includes('jenny') || v.name.toLowerCase().includes('aria')) ||
        voices[0];
      setSelectedVoiceName(preferred.name);
    }
  }, [selectedVoiceName]);

  useEffect(() => {
    isComponentMounted.current = true;
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      isComponentMounted.current = false;
    };
  }, [loadVoices]);

  // Haptic feedback
  const triggerHaptic = useCallback((pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }, []);

  // Stop current audio speech
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Interrupt anything active
  const interrupt = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (handsFreeTimeoutRef.current) {
      clearTimeout(handsFreeTimeoutRef.current);
      handsFreeTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    stopSpeech();
    triggerHaptic(10);
    setStatus('idle');
  }, [stopSpeech, triggerHaptic]);

  // Send query to AI backend and stream response with Indian language enforcement & emotional inflection
  const processUserQuery = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setStatus('idle');
        return;
      }

      setStatus('thinking');
      setErrorMsg(null);
      setAssistantReply('');

      try {
        // Determine target Indian language
        let effectiveLangId = selectedLanguage.id;
        if (selectedLanguage.id === 'auto') {
          const autoLang = detectIndianLanguage(text);
          if (autoLang.id !== 'auto') {
            setDetectedLanguage(autoLang);
            effectiveLangId = autoLang.id;
          }
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: text }],
            model: 'gemma4:31b',
            language: effectiveLangId,
            isVoice: true,
            temperature: 0.65,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to connect to Pragna neural voice engine');
        }

        let fullText = '';
        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':') || trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const token = data.choices?.[0]?.delta?.content || '';
                  if (token) {
                    fullText += token;
                    const detected = detectEmotion(fullText);
                    setCurrentEmotion(detected);

                    // Display text with bracket tag cleaned
                    const displayClean = fullText
                      .replace(/\[(warm|joyful|empathetic|playful|thoughtful|calm)\]/gi, '')
                      .trimStart();
                    setAssistantReply(displayClean);
                  }
                } catch {}
              }
            }
          }
        }

        const finalEmotion = detectEmotion(fullText);
        setCurrentEmotion(finalEmotion);

        const cleanSpoken = cleanTextForSpeech(fullText);

        if (onSendMessage && cleanSpoken) {
          onSendMessage(cleanSpoken);
        }

        if (cleanSpoken) {
          speakResponse(cleanSpoken, finalEmotion, effectiveLangId);
        } else {
          setStatus('idle');
        }
      } catch (err: any) {
        console.error('Voice processing error:', err);
        setErrorMsg(err?.message || 'Pragna encountered an issue responding.');
        setStatus('idle');
      }
    },
    [selectedLanguage, onSendMessage]
  );

  // Speak response using speech synthesis with emotional parameters & Indian accent/language
  const speakResponse = useCallback(
    (cleanText: string, emotion: EmotionType, langId: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) {
        setStatus('idle');
        return;
      }

      stopSpeech();
      setStatus('speaking');
      triggerHaptic([15, 20]);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const config = EMOTION_MAP[emotion] || EMOTION_MAP.warm;

      utterance.pitch = config.pitch;
      utterance.rate = config.rate;

      // Find best matching Indian voice
      const targetLang = INDIAN_LANGUAGES.find((l) => l.id === langId) || selectedLanguage;
      utterance.lang = targetLang.bcp47;

      if (femaleVoices.length > 0) {
        // Try exact language match
        const exactMatch = femaleVoices.find((v) =>
          v.lang.toLowerCase().startsWith(targetLang.bcp47.toLowerCase())
        );
        const prefixMatch = femaleVoices.find((v) =>
          v.lang.toLowerCase().startsWith(targetLang.id.toLowerCase())
        );
        const inMatch = femaleVoices.find((v) => v.lang.toLowerCase().includes('-in'));
        const userSelected = femaleVoices.find((v) => v.name === selectedVoiceName);

        utterance.voice = exactMatch || prefixMatch || inMatch || userSelected || femaleVoices[0];
      }

      utterance.onend = () => {
        if (!isComponentMounted.current) return;
        setStatus('idle');
        triggerHaptic(10);

        if (isHandsFree) {
          handsFreeTimeoutRef.current = setTimeout(() => {
            if (isComponentMounted.current && isOpen) {
              startListening();
            }
          }, 750);
        }
      };

      utterance.onerror = () => {
        if (!isComponentMounted.current) return;
        setStatus('idle');
      };

      window.speechSynthesis.speak(utterance);
    },
    [femaleVoices, selectedVoiceName, isMuted, isHandsFree, isOpen, selectedLanguage, stopSpeech, triggerHaptic]
  );

  // Start speech recognition listening with Indian language acoustic model
  const startListening = useCallback(() => {
    setErrorMsg(null);
    interrupt();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('Live Speech Recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;

      // Set language BCP-47 for Google acoustic model
      recognition.lang = selectedLanguage.bcp47;

      let accumulatedFinal = '';

      recognition.onstart = () => {
        setStatus('listening');
        setUserTranscript('');
        triggerHaptic([20, 20]);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            accumulatedFinal += (accumulatedFinal ? ' ' : '') + trans;
          } else {
            interim += trans;
          }
        }

        const liveText = (accumulatedFinal + ' ' + interim).trim();
        setUserTranscript(liveText);

        // Auto-detect Indian language in real-time as user speaks
        if (selectedLanguage.id === 'auto' && liveText.length > 2) {
          const detected = detectIndianLanguage(liveText);
          if (detected.id !== 'auto') {
            setDetectedLanguage(detected);
          }
        }

        // Reset silence detection timer
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Auto-submit after 1.3s silence
        if (liveText.length > 2) {
          silenceTimeoutRef.current = setTimeout(() => {
            try {
              recognition.stop();
            } catch {}
            processUserQuery(liveText);
          }, 1300);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'no-speech') return;
        console.warn('SpeechRecognition warning:', e.error);
        if (e.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone permissions.');
          setStatus('idle');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMsg('Could not activate microphone.');
      setStatus('idle');
    }
  }, [interrupt, selectedLanguage, detectedLanguage, triggerHaptic, processUserQuery]);

  // Manually finish speaking
  const handleDoneSpeaking = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (userTranscript.trim()) {
      processUserQuery(userTranscript);
    } else {
      setStatus('idle');
    }
  }, [userTranscript, processUserQuery]);

  // Auto-start on modal open
  useEffect(() => {
    if (isOpen) {
      setUserTranscript('');
      setAssistantReply('');
      setCurrentEmotion('warm');
      setDetectedLanguage(null);
      setTimeout(() => {
        startListening();
      }, 350);
    } else {
      interrupt();
    }
    return () => {
      interrupt();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentConfig = EMOTION_MAP[currentEmotion] || EMOTION_MAP.warm;
  const EmotionIcon = currentConfig.icon;

  const activeDisplayLang = selectedLanguage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[36px] transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center justify-between w-full max-w-lg p-7 mx-4 rounded-3xl bg-[rgba(15,15,19,0.95)] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-white select-none transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
          minHeight: '540px',
          boxShadow: `0 20px 80px ${currentConfig.glowColor}`,
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between w-full pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full animate-pulse transition-colors duration-500"
              style={{
                backgroundColor:
                  status === 'speaking'
                    ? '#34d399'
                    : status === 'listening'
                    ? '#fbbf24'
                    : status === 'thinking'
                    ? '#a78bfa'
                    : '#94a3b8',
              }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-widest text-white/90 uppercase">
                Pragna Voice Studio
              </span>
              <span className="text-[10px] text-amber-400/80 font-medium">
                Indian Multilingual Voice Assistant
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Emotion Badge */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-500 border border-white/10"
              style={{
                backgroundColor: currentConfig.glowColor,
                color: '#fff',
              }}
            >
              <EmotionIcon className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>{currentConfig.badge}</span>
            </div>

            {/* Mute toggle */}
            <button
              onClick={() => {
                if (!isMuted && status === 'speaking') stopSpeech();
                setIsMuted(!isMuted);
              }}
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
              className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Indian Language Selector Bar */}
        <div className="flex items-center justify-between w-full mt-2.5 px-3 py-1.5 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-medium text-white/70">Indian Language:</span>
          </div>

          <IndianLanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={(lang) => {
              setSelectedLanguage(lang);
              setDetectedLanguage(null);
              interrupt();
            }}
            variant="compact"
            placement="bottom"
            align="right"
          />
        </div>
        {/* 3D Voice-Powered Shader Orb */}
        <div
          className="relative flex flex-col items-center justify-center my-2 cursor-pointer group"
          onClick={
            status === 'speaking'
              ? interrupt
              : status === 'listening'
              ? handleDoneSpeaking
              : status === 'idle'
              ? startListening
              : undefined
          }
        >
          <div
            className="w-60 h-60 sm:w-64 sm:h-64 relative rounded-3xl overflow-hidden border border-white/10 bg-black/50 transition-all duration-700"
            style={{
              boxShadow: `0 0 60px ${currentConfig.glowColor}`,
            }}
          >
            <VoicePoweredOrb
              enableVoiceControl={status === 'listening' || status === 'speaking'}
              hue={status === 'speaking' ? currentConfig.hue : status === 'thinking' ? 260 : currentConfig.hue}
              className="w-full h-full"
            />
          </div>

          <div className="mt-2.5 flex items-center space-x-2">
            <span className="text-xs font-medium tracking-wide text-white/70 group-hover:text-white transition-colors">
              {status === 'listening' && `Listening in ${selectedLanguage.nativeName} (${selectedLanguage.name})... (Tap when done)`}
              {status === 'thinking' && 'Pragna is formulating thought in Indian language...'}
              {status === 'speaking' && 'Pragna is speaking — Tap to interrupt'}
              {status === 'idle' && 'Tap orb to start speaking with Pragna'}
            </span>
          </div>
        </div>

        {/* Live Conversation Transcript Display */}
        <div className="w-full flex flex-col items-center justify-center space-y-1.5 text-center px-4 min-h-[72px] max-h-[105px] overflow-y-auto">
          {userTranscript && (
            <p className="text-xs sm:text-sm font-medium text-amber-300/90 line-clamp-2 italic">
              "{userTranscript}"
            </p>
          )}
          {assistantReply && (
            <p className="text-xs sm:text-sm text-white/90 line-clamp-3 font-normal leading-relaxed">
              {assistantReply}
            </p>
          )}
          {!userTranscript && !assistantReply && status === 'idle' && (
            <p className="text-xs text-white/40 italic">
              "{activeDisplayLang.greeting}"
            </p>
          )}
          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          )}
        </div>

        {/* Bottom Quick Controls */}
        <div className="flex items-center justify-between w-full pt-3 mt-1 border-t border-white/5 text-xs">
          {/* Voice profile */}
          <div className="flex items-center space-x-2">
            {femaleVoices.length > 0 && (
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="max-w-[140px] truncate px-2.5 py-1 text-[11px] font-medium bg-white/5 border border-white/10 rounded-full text-white/80 focus:outline-none focus:border-amber-400/50 hover:bg-white/10 transition-colors"
                title="Select Indian Voice Profile"
              >
                {femaleVoices.map((v) => (
                  <option key={v.name} value={v.name} className="bg-neutral-900 text-white">
                    {v.name.replace('Microsoft ', '').replace('Online (Natural)', 'Natural')}
                  </option>
                ))}
              </select>
            )}

            {/* Hands-Free Toggle */}
            <button
              onClick={() => setIsHandsFree(!isHandsFree)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                isHandsFree
                  ? 'bg-amber-400/15 border border-amber-400/30 text-amber-300'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>Hands-Free {isHandsFree ? 'On' : 'Off'}</span>
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={status === 'listening' ? handleDoneSpeaking : status === 'speaking' ? interrupt : startListening}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-all shadow-lg ${
              status === 'listening'
                ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300 shadow-amber-400/20'
                : status === 'speaking'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-amber-400 text-neutral-950 hover:bg-amber-300 shadow-amber-400/25'
            }`}
          >
            {status === 'listening' ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Done Speaking</span>
              </>
            ) : status === 'speaking' ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Interrupt</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Talk to Pragna</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

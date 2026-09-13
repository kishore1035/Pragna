'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb';
import {
  fetchVoiceProfiles,
  VoiceProfile,
  getVoiceWebSocketUrl,
  synthesizeSpeech,
  transcribeAudio,
} from '@/lib/api';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: number | null;
  onSendMessage?: (text: string) => void;
}

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  conversationId,
  onSendMessage,
}: VoiceAssistantModalProps) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('en-US-AriaNeural');
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger Apple-style subtle audio-haptic feedback
  const triggerHaptic = useCallback((pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }, []);

  // Load available voice models on mount
  useEffect(() => {
    fetchVoiceProfiles().then((list) => {
      if (list.length > 0) {
        setVoices(list);
        const rec = list.find((v) => v.recommended);
        if (rec) setSelectedVoice(rec.id);
      }
    });
  }, []);

  // Stop all active audio / mic on close or interrupt
  const interrupt = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
    }
    triggerHaptic(10);
    setStatus('idle');
  }, [triggerHaptic]);

  // Clean up mic and audio context
  const cleanupMedia = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  // Start listening to microphone with visualizer
  const startListening = useCallback(async () => {
    setErrorMsg(null);
    interrupt();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyserRef.current = analyser;

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const fullAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (fullAudioBlob.size > 500) {
          handleAudioCaptured(fullAudioBlob);
        } else {
          setStatus('idle');
        }
      };

      mediaRecorder.start(250);
      setStatus('listening');
      triggerHaptic([20, 30, 20]);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setErrorMsg('Microphone access denied or unavailable.');
      setStatus('idle');
    }
  }, [interrupt, triggerHaptic]);

  // Handle captured audio blob -> send for transcription & AI response
  const handleAudioCaptured = async (audioBlob: Blob) => {
    setStatus('thinking');
    setAssistantReply('');
    try {
      // 1. Transcribe audio via /api/voice/stt
      const transcript = await transcribeAudio(audioBlob);
      if (!transcript.trim()) {
        setStatus('idle');
        return;
      }
      setUserTranscript(transcript);
      triggerHaptic(15);

      // Also notify parent to send message to chat if callback provided
      if (onSendMessage) {
        onSendMessage(transcript);
      }

      // 2. Call the main /api/chat endpoint with correct OpenAI messages format
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: transcript }],
          model: 'deepseek-chat',
          temperature: 0.7,
          max_tokens: 1000,
          enableTools: false,
          systemPrompt: 'You are a concise voice assistant. Keep answers short and conversational (2-3 sentences max) since the user is listening, not reading.',
        }),
      });

      // 3. Parse SSE stream — format is: data: {"choices":[{"delta":{"content":"..."}}]}
      let fullText = '';
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const delta = data.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  fullText += delta;
                  setAssistantReply((prev) => prev + delta);
                }
              } catch {}
            }
          }
        }
      } else if (!res.ok) {
        throw new Error(`Chat API error: ${res.status}`);
      }

      // 4. Play response via TTS (falls back to Web Speech API if backend TTS unavailable)
      if (fullText.trim()) {
        playAssistantSpeech(fullText);
      } else {
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('Voice processing error:', err);
      setErrorMsg('Failed to process voice query.');
      setStatus('idle');
    }
  };

  // Play synthesized assistant speech — tries backend TTS, falls back to Web Speech API
  const playAssistantSpeech = async (text: string) => {
    setStatus('speaking');
    try {
      // Try backend TTS first
      const audioBlob = await synthesizeSpeech(text, selectedVoice);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setStatus('idle');
        activeAudioRef.current = null;
        triggerHaptic(10);
        if (isHandsFree) {
          setTimeout(() => startListening(), 600);
        }
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        // Fallback to Web Speech API
        speakWithBrowser(text);
      };
      await audio.play();
    } catch {
      // Backend TTS unavailable — use browser Web Speech API
      speakWithBrowser(text);
    }
  };

  // Fallback: browser-native text-to-speech
  const speakWithBrowser = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('idle');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => {
      setStatus('idle');
      triggerHaptic(10);
      if (isHandsFree) {
        setTimeout(() => startListening(), 600);
      }
    };
    utterance.onerror = () => setStatus('idle');
    window.speechSynthesis.speak(utterance);
  };

  // Initial auto-start when opened
  useEffect(() => {
    if (isOpen) {
      setUserTranscript('');
      setAssistantReply('');
      startListening();
    } else {
      interrupt();
      cleanupMedia();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[32px] transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center justify-between w-full max-w-lg p-8 mx-4 rounded-3xl bg-[rgba(18,18,22,0.92)] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-white"
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '480px' }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
              Mimir Voice Studio
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Voice Model Selector */}
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-full text-white/80 focus:outline-none focus:border-amber-400/50 hover:bg-white/10 transition-colors"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id} className="bg-neutral-900 text-white">
                  {v.name}
                </option>
              ))}
            </select>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Voice-Powered 3D Shader Orb */}
        <div
          className="relative flex flex-col items-center justify-center my-4 cursor-pointer group"
          onClick={
            status === 'speaking'
              ? interrupt
              : status === 'listening'
              ? () => mediaRecorderRef.current?.stop()
              : status === 'idle'
              ? startListening
              : undefined
          }
        >
          <div className="w-64 h-64 sm:w-72 sm:h-72 relative rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.18)] border border-white/10 bg-black/40">
            <VoicePoweredOrb
              enableVoiceControl={status === 'listening'}
              hue={status === 'speaking' ? 140 : status === 'thinking' ? 240 : 35}
              className="w-full h-full"
            />
          </div>
          <span className="mt-3 text-xs font-medium tracking-wide text-white/60 group-hover:text-white/80 transition-colors">
            {status === 'listening' && 'Listening to you... (Tap orb when done)'}
            {status === 'thinking' && 'Synthesizing thought...'}
            {status === 'speaking' && 'Speaking — Tap orb to interrupt'}
            {status === 'idle' && 'Tap orb to speak'}
          </span>
        </div>

        {/* Live Conversation Transcript Display */}
        <div className="w-full flex flex-col items-center space-y-2 text-center px-4 min-h-[72px]">
          {userTranscript && (
            <p className="text-sm font-medium text-amber-300/90 line-clamp-2">
              "{userTranscript}"
            </p>
          )}
          {assistantReply && (
            <p className="text-sm text-white/80 line-clamp-3 font-normal leading-relaxed">
              {assistantReply}
            </p>
          )}
          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          )}
        </div>

        {/* Bottom Quick Controls */}
        <div className="flex items-center justify-between w-full pt-4 mt-2 border-t border-white/5">
          <button
            onClick={() => setIsHandsFree(!isHandsFree)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isHandsFree
                ? 'bg-amber-400/15 border border-amber-400/30 text-amber-300'
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <span>Hands-Free {isHandsFree ? 'On' : 'Off'}</span>
          </button>

          <button
            onClick={status === 'listening' ? () => mediaRecorderRef.current?.stop() : startListening}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-400 text-neutral-950 text-xs font-semibold hover:bg-amber-300 active:scale-95 shadow-[0_2px_12px_rgba(212,175,55,0.35)] transition-all"
          >
            {status === 'listening' ? 'Done Speaking' : 'Speak'}
          </button>
        </div>
      </div>
    </div>
  );
}

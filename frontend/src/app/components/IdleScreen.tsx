'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { BarChart2, Lightbulb, CheckSquare, Code2, Mic, MicOff, Paperclip, Send } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

interface SuggestionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const suggestions: SuggestionCard[] = [
  {
    icon: <BarChart2 size={20} className="text-muted-foreground" />,
    title: 'Synthesize Data',
    description: 'Turn my meeting notes into 5 key bullet points for the team.',
  },
  {
    icon: <Lightbulb size={20} className="text-muted-foreground" />,
    title: 'Creative Brainstorm',
    description: 'Generate 3 taglines for a new sustainable fashion brand.',
  },
  {
    icon: <CheckSquare size={20} className="text-muted-foreground" />,
    title: 'Check Facts',
    description: 'Compare key differences between GDPR and CCPA.',
  },
  {
    icon: <Code2 size={20} className="text-muted-foreground" />,
    title: 'Write Code',
    description: 'Build a React hook for debounced search input.',
  },
];

export default function IdleScreen() {
  const { sendMessage, uploadDocument } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInputValue((prev) => (prev ? prev + ' ' + transcript : transcript));
          }
        };

        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, sendMessage]);

  const handleSuggestion = (description: string) => {
    sendMessage(description);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((file) => uploadDocument(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin">
      {/* Greeting section */}
      <div className="flex flex-col items-center justify-center pt-14 pb-8 px-6">
        {/* Logo emblem */}
        <div className="relative mb-8 select-none group flex items-center justify-center" aria-hidden="true">
          <div className="w-52 h-52 flex items-center justify-center p-3 transition-all duration-300 transform group-hover:scale-105">
            <AppLogo size={170} className="w-full h-full object-contain drop-shadow-md" />
          </div>
        </div>

        {/* Greeting text */}
        <p className="text-2xl font-semibold mb-1 text-foreground/80">Hello, there</p>
        <h1 className="text-3xl font-bold text-foreground text-center leading-tight">
          How can I assist you today?
        </h1>
      </div>

      {/* Input + suggestion area */}
      <div className="w-full max-w-2xl mx-auto px-4 pb-8">
        {/* Input card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring/50 transition-all mb-3">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything…"
            rows={1}
            className="w-full px-4 pt-4 pb-2 text-sm text-foreground bg-transparent resize-none outline-none placeholder:text-muted-foreground leading-relaxed"
            style={{ minHeight: '56px', maxHeight: '160px' }}
          />

          {/* Toolbar row */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
              id="idle-file-upload"
            />
            <label
              htmlFor="idle-file-upload"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border bg-transparent hover:bg-muted px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Paperclip size={12} />
              Attach file
            </label>

            <div className="flex-1" />

            {speechSupported && (
              <button
                onClick={toggleRecording}
                title={isRecording ? 'Listening… click to stop' : 'Push-to-talk voice input'}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {isRecording ? <MicOff size={15} /> : <Mic size={15} className="opacity-90" />}
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
              title="Send (Enter)"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Suggestion cards */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {suggestions.map((card, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(card.description)}
              className="group flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-xl text-left hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">{card.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

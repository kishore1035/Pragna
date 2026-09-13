"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, ArrowLeft, Radio } from "lucide-react";

export default function VoicePoweredOrbPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDetected, setVoiceDetected] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0c] text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,0.06),transparent_70%)]" />

      {/* Top back navigation */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chat</span>
        </Link>
      </div>

      <div className="flex flex-col items-center space-y-8 z-10 max-w-xl w-full">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-medium">
            <Radio className={`w-3.5 h-3.5 ${isRecording ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
            <span>{isRecording ? (voiceDetected ? "Audio Detected • Pulsing" : "Listening...") : "Voice Assistant Standby"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">Voice-Powered Neural Orb</h1>
          <p className="text-sm text-neutral-400">
            Real-time WebGL shader reactivity powered by Web Audio API RMS analysis
          </p>
        </div>

        {/* Orb Container */}
        <div className="w-80 h-80 sm:w-96 sm:h-96 relative flex items-center justify-center">
          <VoicePoweredOrb
            enableVoiceControl={isRecording}
            className="rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.15)] border border-white/5"
            onVoiceDetected={setVoiceDetected}
          />
        </div>

        {/* Control Button */}
        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
              isRecording
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.4)]"
                : "bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_25px_rgba(212,175,55,0.3)]"
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5 mr-3" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-3" />
                Start Recording
              </>
            )}
          </Button>

          {/* Simple Instructions */}
          <p className="text-muted-foreground text-center text-xs max-w-md">
            Click the button to enable voice control. Speak to see the orb respond to your voice with subtle movements.
          </p>
        </div>
      </div>
    </div>
  );
}

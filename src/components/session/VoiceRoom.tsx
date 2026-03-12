"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Brain, Lightbulb, Loader2, X, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface VoiceRoomProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onIdeaDetected?: (idea: string) => void;
}

export const VoiceRoom = ({ sessionId, isOpen, onClose, onIdeaDetected }: VoiceRoomProps) => {
  const supabase = createSupabaseClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [detectedIdeas, setDetectedIdeas] = useState<{ text: string; saved: boolean }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar_url?: string } | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef("");

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("id, name, avatar_url").eq("id", user.id).single();
      if (data) setCurrentUser(data);
    };
    load();
  }, []);

  const analyzeBuffer = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 15) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/transcribe-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text.trim() }),
      });
      const { idea } = await res.json();

      if (idea) {
        setDetectedIdeas(prev => [{ text: idea, saved: false }, ...prev.slice(0, 4)]);

        // Save to DB + create idea card
        if (currentUser) {
          await supabase.from("voice_transcripts").insert({
            session_id: sessionId,
            content: text.trim(),
            speaker_id: currentUser.id,
            detected_idea: idea,
          });

          // Auto-create idea card on board
          const { data: newIdea } = await supabase.from("ideas").insert({
            session_id: sessionId,
            title: idea,
            description: "Captured from voice discussion",
            category: "Other",
            author_id: currentUser.id,
            is_ai_generated: true,
          }).select().single();

          if (newIdea) {
            await supabase.from("idea_history").insert({
              idea_id: newIdea.id,
              action_type: "created",
              description: "Auto-captured from voice discussion by AI",
            });
            // Mark as saved
            setDetectedIdeas(prev => prev.map((d, i) => i === 0 ? { ...d, saved: true } : d));
            onIdeaDetected?.(idea);
            toast.success("💡 Voice idea added to board!", { description: idea });
          }
        }
      }
    } catch (e) {
      console.error("Transcription error:", e);
    } finally {
      setIsAnalyzing(false);
      accumulatedRef.current = "";
    }
  }, [currentUser, sessionId, onIdeaDetected]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
          accumulatedRef.current += " " + t;
        } else {
          interim += t;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setTranscript(accumulatedRef.current.trim());
        // Debounce AI analysis — analyze after 3s of silence
        if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = setTimeout(() => {
          analyzeBuffer(accumulatedRef.current);
        }, 3000);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "aborted") {
        toast.error(`Mic error: ${e.error}`);
        setIsConnected(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still connected
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [analyzeBuffer]);

  const joinRoom = async () => {
    if (!currentUser) return;
    setIsConnected(true);
    startListening();
    toast.success("Joined voice room! Speak naturally — AI will capture ideas.");
  };

  const leaveRoom = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    setIsConnected(false);
    setTranscript("");
    setInterimTranscript("");
    toast.info("Left voice room");
  };

  const toggleMute = () => {
    setIsMuted(m => {
      if (!m) {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
      } else {
        startListening();
      }
      return !m;
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-5 w-80 z-50 bg-bg-elevated border border-border-default rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center gap-2 border-b border-border-subtle ${isConnected ? "bg-green-500/10" : ""}`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-text-disabled"}`} />
        <span className="text-sm font-semibold text-text-primary">
          {isConnected ? "Voice Room — Active" : "Voice Room"}
        </span>
        {isConnected && isAnalyzing && (
          <div className="flex items-center gap-1 ml-auto">
            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            <span className="text-[10px] text-indigo-400">analyzing...</span>
          </div>
        )}
        <button onClick={onClose} className="ml-auto text-text-disabled hover:text-text-primary transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* No Speech API warning */}
        {!speechSupported && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              Your browser doesn't support the Speech API. Use Chrome or Edge for voice features.
            </p>
          </div>
        )}

        {/* User card */}
        {currentUser && (
          <div className="flex items-center gap-2 py-2 px-3 bg-bg-base rounded-xl border border-border-subtle">
            <div className="relative">
              <Avatar name={currentUser.name} src={currentUser.avatar_url} size="sm" online={isConnected} />
              {isConnected && !isMuted && (
                <motion.div
                  className="absolute -inset-1 rounded-full border-2 border-green-400"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-text-primary">{currentUser.name}</div>
              <div className="text-[10px] text-text-tertiary">
                {!isConnected ? "Not connected" : isMuted ? "Muted" : "Speaking..."}
              </div>
            </div>
            {isConnected && !isMuted && (
              <div className="flex gap-0.5 items-end h-5">
                {[0, 1, 2, 3].map(i => (
                  <motion.div key={i} className="w-0.5 rounded-full bg-green-400"
                    animate={{ height: ["4px", (8 + i * 4) + "px", "4px"] }}
                    transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, delay: i * 0.1 }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live transcript */}
        {isConnected && (
          <div className="bg-bg-base rounded-xl p-3 border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-2">
              <Volume2 className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">Live Transcript</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed min-h-[32px] italic">
              {interimTranscript
                ? <span className="text-text-disabled">{interimTranscript}</span>
                : transcript
                ? <span>{transcript.slice(-200)}</span>
                : <span className="text-text-disabled">{isMuted ? "Muted — unmute to start." : "Start speaking..."}</span>
              }
            </p>
          </div>
        )}

        {/* AI-Detected Ideas */}
        {detectedIdeas.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">
              <Brain className="w-3 h-3 text-indigo-400" />
              AI-Detected Ideas ({detectedIdeas.length})
            </div>
            {detectedIdeas.map((idea, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2"
              >
                <Lightbulb className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                <span className="text-xs text-text-primary leading-snug flex-1">{idea.text}</span>
                {idea.saved && (
                  <span className="text-[9px] text-green-400 font-semibold shrink-0 mt-0.5">✓ Saved</span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* How it works hint */}
        {isConnected && detectedIdeas.length === 0 && !isAnalyzing && (
          <p className="text-[11px] text-text-disabled text-center px-2 leading-relaxed">
            Speak your ideas naturally. AI listens and auto-adds idea cards to the board after 3s of silence.
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 pt-1">
          {isConnected ? (
            <>
              <button
                onClick={toggleMute}
                disabled={!speechSupported}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isMuted
                    ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                    : "bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/15"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={leaveRoom}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                Leave
              </button>
            </>
          ) : (
            <button
              onClick={joinRoom}
              disabled={!speechSupported}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone className="w-4 h-4" />
              Join Voice Room
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

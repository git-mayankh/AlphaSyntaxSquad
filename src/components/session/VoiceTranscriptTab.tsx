"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Brain, Lightbulb, Loader2, Plus, AlertCircle } from "lucide-react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { Avatar } from "@/components/ui/Avatar";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface VoiceTranscriptTabProps {
  sessionId: string;
}

export const VoiceTranscriptTab = ({ sessionId }: VoiceTranscriptTabProps) => {
  const supabase = createSupabaseClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lkToken, setLkToken] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [detectedIdeas, setDetectedIdeas] = useState<{ id: string; text: string; saved: boolean }[]>([]);
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
  }, [supabase]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
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

      if (idea && currentUser) {
        // Save transcript log to DB
        await supabase.from("voice_transcripts").insert({
          session_id: sessionId,
          content: text.trim(),
          speaker_id: currentUser.id,
          detected_idea: idea,
        });

        const ideaId = Math.random().toString(36).substring(7);

        // Add to local state for manual review
        setDetectedIdeas(prev => [
          { id: ideaId, text: idea, saved: false },
          ...prev.slice(0, 9)
        ]);

        // Interactive Popup
        toast.custom((t) => (
          <div className="bg-bg-elevated border border-indigo-500/30 rounded-xl p-4 shadow-xl flex flex-col gap-3 w-[320px]">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500/20 p-1.5 rounded-md">
                <Brain className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-bold text-text-primary">AI Detected Idea</span>
            </div>
            <p className="text-sm text-text-secondary leading-snug">{idea}</p>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => {
                  toast.dismiss(t);
                  handleAddIdeaToBoard(ideaId, idea);
                }}
                className="flex-1 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Add to board
              </button>
              <button 
                onClick={() => toast.dismiss(t)}
                className="flex-1 py-1.5 bg-bg-surface text-text-secondary text-xs font-semibold rounded-lg hover:bg-bg-base transition-colors"
              >
                Ignore
              </button>
            </div>
          </div>
        ), { duration: 15000 });
      }
    } catch (e) {
      console.error("Transcription error:", e);
    } finally {
      setIsAnalyzing(false);
      accumulatedRef.current = "";
    }
  }, [currentUser, sessionId, supabase]); // handleAddIdeaToBoard will be correctly scoped or we can pass it down

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
        if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = setTimeout(() => {
          analyzeBuffer(accumulatedRef.current);
        }, 3000); // 3 seconds of silence triggers analysis
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "aborted") {
        toast.error(`Mic error: ${e.error}`);
        setIsConnected(false);
      }
    };

    recognition.onend = () => {
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
    
    try {
      const res = await fetch(`/api/livekit/token?room=${sessionId}&username=${encodeURIComponent(currentUser.name)}`);
      const data = await res.json();
      if (data.token) {
        setLkToken(data.token);
      }
    } catch (err) {
      console.error("Livekit token err", err);
    }

    startListening();
    toast.success("Joined voice room!");
  };

  const leaveRoom = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    setIsConnected(false);
    setLkToken("");
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

  const handleAddIdeaToBoard = async (detectedIdeaId: string, ideaText: string) => {
    if (!currentUser) return;
    
    // Create actual idea card in DB
    const { data: newIdea, error } = await supabase.from("ideas").insert({
      session_id: sessionId,
      title: ideaText,
      description: "Captured from voice discussion",
      category: "Other",
      author_id: currentUser.id,
      is_ai_generated: true,
      source: "voice", // Render the Voice Gen Badge
    }).select().single();

    if (error || !newIdea) {
      toast.error("Failed to add idea to board");
      return;
    }

    await supabase.from("idea_history").insert({
      idea_id: newIdea.id,
      action_type: "created",
      description: "Manually added from voice discussion suggestions",
    });

    setDetectedIdeas(prev => prev.map(d => d.id === detectedIdeaId ? { ...d, saved: true } : d));
    toast.success("Idea added to the canvas!");
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
        
        {/* Connection Widget */}
        <div className="bg-bg-base border border-border-subtle rounded-xl p-4 overflow-hidden relative">
          {!speechSupported && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                Browser doesn't support the Speech API. Use Chrome or Edge.
              </p>
            </div>
          )}

          {isConnected ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={currentUser?.name || "Me"} src={currentUser?.avatar_url} size="md" online={true} />
                  {!isMuted && (
                    <motion.div
                      className="absolute -inset-1 rounded-full border border-green-400"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-text-primary">Voice Activity</h4>
                  <p className="text-xs text-text-tertiary">
                    {isMuted ? "You are muted" : "Listening..."}
                  </p>
                </div>
                {isAnalyzing && (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={toggleMute}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isMuted ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isMuted ? "Unmute" : "Mute"}
                </button>
                <button
                  onClick={leaveRoom}
                  className="flex-1 py-1.5 bg-bg-elevated text-red-400 hover:bg-red-500/10 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  Leave
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">Join Voice Room</h4>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed px-2">
                Discuss with your team. Our AI will listen and suggest ideas in real-time.
              </p>
              <button
                onClick={joinRoom}
                disabled={!speechSupported}
                className="w-full py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-glow-indigo hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                Connect Audio
              </button>
            </div>
          )}
        </div>

        {/* Live Transcript Log */}
        {isConnected && (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Live Transcript
            </h4>
            <div className="bg-bg-base border border-border-subtle p-3 rounded-xl min-h-[60px] text-xs leading-relaxed italic text-text-secondary shadow-inner">
              {interimTranscript ? (
                <span className="text-text-disabled">{interimTranscript}</span>
              ) : transcript ? (
                <span>{transcript.slice(-300)}</span>
              ) : (
                <span className="text-text-disabled">{isMuted ? "Muted..." : "Waiting for speech..."}</span>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              AI Suggestions
            </h4>
            <span className="text-[10px] bg-bg-elevated text-text-secondary px-1.5 py-0.5 rounded-md border border-border-default">
              {detectedIdeas.length} found
            </span>
          </div>
          
          {detectedIdeas.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border-default rounded-xl">
              <p className="text-xs text-text-disabled">No ideas detected yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {detectedIdeas.map(idea => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bg-base border border-indigo-500/30 p-3 rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.05)] group"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-text-primary leading-relaxed font-medium">
                      {idea.text}
                    </p>
                  </div>
                  {idea.saved ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded w-fit ml-auto">
                      ✓ Added to Canvas
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddIdeaToBoard(idea.id, idea.text)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors rounded-lg text-xs font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      Add to Board
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LiveKit Hidden Audio Engine */}
      {lkToken && process.env.NEXT_PUBLIC_LIVEKIT_URL && (
        <LiveKitRoom
          video={false}
          audio={!isMuted}
          token={lkToken}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
        >
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </div>
  );
};

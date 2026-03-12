"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface SpeakingParticipant {
  id: string;
  name: string;
  avatar_url?: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
}

interface VoiceWidgetProps {
  isActive: boolean;
  participants: SpeakingParticipant[];
  isMuted: boolean;
  onMuteToggle: () => void;
  onLeave: () => void;
  onJoinClick: () => void;
}

export const VoiceWidget = ({ isActive, participants, isMuted, onMuteToggle, onLeave, onJoinClick }: VoiceWidgetProps) => {
  return (
    <AnimatePresence>
      {isActive ? (
        <motion.div
          key="active"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="voice-bubble"
          style={{ position: "fixed", bottom: 80, right: 20, zIndex: 200 }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.6)",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1B2E", fontFamily: "DM Sans, sans-serif" }}>
              🎙 Voice Room
            </span>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {participants.slice(0, 4).map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={p.name} src={p.avatar_url} size="sm" />
                    {p.isSpeaking && (
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        style={{
                          position: "absolute", inset: -3,
                          borderRadius: "50%",
                          border: "2px solid #22c55e",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(0,0,0,0.6)", fontFamily: "DM Sans, sans-serif", flex: 1 }}>
                    {p.name.split(" ")[0]}
                  </span>
                  {p.isMuted && <MicOff style={{ width: 10, height: 10, color: "rgba(0,0,0,0.35)" }} />}
                  {p.isSpeaking && (
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          animate={{ scaleY: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                          style={{ width: 2, height: 12, borderRadius: 2, background: "#22c55e", transformOrigin: "bottom" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={onMuteToggle}
              style={{
                flex: 1, padding: "6px 0",
                borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)",
                background: isMuted ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.04)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                fontSize: 11, fontWeight: 700, fontFamily: "DM Sans, sans-serif",
                color: isMuted ? "#ef4444" : "rgba(0,0,0,0.5)",
              }}
            >
              {isMuted ? <MicOff style={{ width: 12, height: 12 }} /> : <Mic style={{ width: 12, height: 12 }} />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={onLeave}
              style={{
                padding: "6px 10px",
                borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.08)",
                cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              <PhoneOff style={{ width: 12, height: 12, color: "#ef4444" }} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="inactive"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={onJoinClick}
          style={{
            position: "fixed", bottom: 80, right: 20, zIndex: 200,
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 16px",
            background: "white",
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 999,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            fontSize: 13, fontWeight: 700, fontFamily: "DM Sans, sans-serif",
            color: "rgba(0,0,0,0.6)",
          }}
        >
          <Mic style={{ width: 15, height: 15, color: "#5856D6" }} />
          Join Voice
        </motion.button>
      )}
    </AnimatePresence>
  );
};

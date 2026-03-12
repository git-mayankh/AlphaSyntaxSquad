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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 200,
            background: "#FFFFFF",
            padding: 14,
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #E5E7EB",
            minWidth: 200,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#22C55E",
                boxShadow: "0 0 6px rgba(34,197,94,0.4)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111111", fontFamily: "Inter, sans-serif" }}>
              Voice Room
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
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#6E6E73", fontFamily: "Inter, sans-serif", flex: 1 }}>
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
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={onMuteToggle}
              style={{
                flex: 1, padding: "8px 0",
                borderRadius: 8, border: "1px solid #E5E7EB",
                background: isMuted ? "rgba(239,68,68,0.06)" : "#F9F9FB",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
                color: isMuted ? "#EF4444" : "#111111",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { if (!isMuted) e.currentTarget.style.background = "#F4F4F6"; }}
              onMouseLeave={e => { if (!isMuted) e.currentTarget.style.background = "#F9F9FB"; }}
            >
              {isMuted ? <MicOff style={{ width: 14, height: 14 }} /> : <Mic style={{ width: 14, height: 14 }} />}
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onJoinClick}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 200,
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "999px",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif",
            color: "#111111",
          }}
        >
          <Mic style={{ width: 16, height: 16, color: "#7B6CF6" }} />
          Join Voice
        </motion.button>
      )}
    </AnimatePresence>
  );
};

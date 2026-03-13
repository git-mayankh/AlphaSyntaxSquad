"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinSessionModal = ({ isOpen, onClose }: JoinSessionModalProps) => {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (inviteCode: string) => {
    if (inviteCode.length !== 8 || loading) return;

    setLoading(true);
    try {
      // Look up session by invite code
      const { data, error } = await supabase
        .from("sessions")
        .select("id, title, status")
        .eq("invite_code", inviteCode)
        .single();

      if (error || !data) {
        toast.error("Invalid invite code. Please check and try again.");
        setLoading(false);
        return;
      }

      if (data.status === "closed") {
        toast.error("This session is closed and no longer accepting participants.");
        setLoading(false);
        return;
      }

      toast.success(`Joining "${data.title}"!`);
      onClose();
      setCode("");
      router.push(`/session/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join session");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.length === 8) {
      handleJoin(code);
    }
  }, [code]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join a Session" maxWidth="sm">
      <div className="p-8 flex flex-col items-center">
        <p className="text-text-secondary text-sm text-center mb-6">
          Enter the 8-character invite code shared by the session host.
        </p>
        
        <div className="relative w-full max-w-[280px]">
          <input
            autoFocus
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
            placeholder="A1B2C3D4"
            className="w-full bg-bg-surface border-2 border-border-default rounded-xl text-center text-text-primary text-[32px] tracking-widest font-mono p-4 outline-none focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all placeholder:text-border-strong uppercase"
            disabled={loading}
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-2.5 h-1 rounded-full ${i < code.length ? 'bg-indigo-500' : 'bg-border-subtle'} transition-colors duration-300`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

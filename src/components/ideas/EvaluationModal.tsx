"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
  currentScores?: { feasibility: number | null; market: number | null; innovation: number | null };
}

export const EvaluationModal = ({ isOpen, onClose, ideaId, ideaTitle, currentScores }: EvaluationModalProps) => {
  const [feasibility, setFeasibility] = useState(currentScores?.feasibility ?? 5);
  const [market, setMarket] = useState(currentScores?.market ?? 5);
  const [innovation, setInnovation] = useState(currentScores?.innovation ?? 5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createSupabaseClient();

  // Reset local state if props change
  useEffect(() => {
    if (isOpen) {
      setFeasibility(currentScores?.feasibility ?? 5);
      setMarket(currentScores?.market ?? 5);
      setInnovation(currentScores?.innovation ?? 5);
    }
  }, [isOpen, currentScores]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ 
          feasibility_score: feasibility,
          market_score: market,
          innovation_score: innovation
        })
        .eq('id', ideaId);

      if (error) throw error;
      toast.success("Scores updated successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save scores");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evaluate Idea">
      <div className="p-6 flex flex-col gap-6 bg-bg-base">
        <div>
          <h3 className="text-text-primary text-[15px] font-bold mb-1 line-clamp-1">{ideaTitle}</h3>
          <p className="text-text-secondary text-[13px]">Rate this idea from 1 to 10 on the following axes.</p>
        </div>

        <div className="flex flex-col gap-4">
          <ScoreSlider label="Feasibility" value={feasibility} onChange={setFeasibility} color="text-green-400" />
          <ScoreSlider label="Market Potential" value={market} onChange={setMarket} color="text-blue-400" />
          <ScoreSlider label="Innovation" value={innovation} onChange={setInnovation} color="text-purple-400" />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Evaluation
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ScoreSlider = ({ label, value, onChange, color }: { label: string, value: number, onChange: (v: number) => void, color: string }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center text-[13px] font-medium">
      <span className="text-text-primary">{label}</span>
      <span className={color}>{value}/10</span>
    </div>
    <input 
      type="range" min="1" max="10" value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full accent-indigo-500 cursor-pointer"
    />
  </div>
);

"use client";

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { IdeaCard, IdeaCardProps } from "@/components/ideas/IdeaCard";

interface Position {
  x: number;
  y: number;
}

interface IdeaNode extends IdeaCardProps {
  position: Position;
}

export interface IdeaCanvasProps {
  ideas: IdeaNode[];
  onAddIdea: () => void;
  onPositionChange?: (ideaId: string, x: number, y: number) => void;
}

export interface IdeaCanvasHandle {
  panToIdea: (id: string) => void;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

export const IdeaCanvas = forwardRef<IdeaCanvasHandle, IdeaCanvasProps>(({ ideas, onAddIdea, onPositionChange }, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState<Position>({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, Position>>({});

  useImperativeHandle(ref, () => ({
    panToIdea: (id: string) => {
      if (!canvasRef.current) return;
      const pos = positions[id] || ideas.find(i => i.id === id)?.position;
      if (!pos) return;
      
      const containerWidth = canvasRef.current.clientWidth;
      const containerHeight = canvasRef.current.clientHeight;
      
      // Target center of node: node is 340px wide, let's assume ~200px tall
      const nodeCenterX = pos.x + 170;
      const nodeCenterY = pos.y + 100;

      // New pan should center the node
      setPan({
        x: (containerWidth / 2) - (nodeCenterX * zoom),
        y: (containerHeight / 2) - (nodeCenterY * zoom)
      });
    }
  }));

  // Initialize positions from props
  useEffect(() => {
    const initial: Record<string, Position> = {};
    ideas.forEach((idea, i) => {
      if (!positions[idea.id]) {
        initial[idea.id] = idea.position || {
          x: 120 + (i % 4) * 380,
          y: 100 + Math.floor(i / 4) * 280,
        };
      }
    });
    if (Object.keys(initial).length > 0) {
      setPositions(prev => ({ ...initial, ...prev }));
    }
  }, [ideas]);

  // Canvas pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-card]")) return;
    setIsPanning(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastMouse]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  // Zoom with scroll wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);

  // Card dragging
  const handleCardMouseDown = useCallback((e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    setDraggingId(ideaId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = positions[ideaId] || { x: 0, y: 0 };

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / zoom;
      const dy = (me.clientY - startY) / zoom;
      setPositions(prev => ({
        ...prev,
        [ideaId]: { x: startPos.x + dx, y: startPos.y + dy }
      }));
    };

    const onUp = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / zoom;
      const dy = (me.clientY - startY) / zoom;
      const newPos = { x: startPos.x + dx, y: startPos.y + dy };
      setPositions(prev => ({ ...prev, [ideaId]: newPos }));
      onPositionChange?.(ideaId, newPos.x, newPos.y);
      setDraggingId(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [positions, zoom, onPositionChange]);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.08)_1px,transparent_0)] bg-[size:40px_40px] cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? "grabbing" : draggingId ? "grabbing" : "grab" }}
    >
      {/* Canvas transform layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
          width: "4000px",
          height: "3000px",
        }}
      >
        {ideas.map(idea => {
          const pos = positions[idea.id] || idea.position || { x: 100, y: 100 };
          return (
            <div
              key={idea.id}
              data-card="true"
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 340,
                zIndex: draggingId === idea.id ? 100 : 1,
                cursor: "grab",
                userSelect: "none",
              }}
              onMouseDown={(e) => handleCardMouseDown(e, idea.id)}
            >
              <motion.div
                animate={draggingId === idea.id ? { scale: 1.03, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" } : { scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <IdeaCard {...idea} />
              </motion.div>
            </div>
          );
        })}

        {/* Empty state */}
        {ideas.length === 0 && (
          <div className="absolute" style={{ left: "50%", top: "40%", transform: "translate(-50%,-50%)" }}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Plus className="w-10 h-10 text-indigo-400" />
              </div>
              <p className="text-text-secondary text-sm">Canvas is empty. Add your first idea!</p>
              <button
                onClick={onAddIdea}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors"
              >
                + Add Idea
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HUD Controls (bottom-right) */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 z-30">
        <div className="flex items-center bg-bg-elevated border border-border-default rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-text-secondary px-2 border-x border-border-subtle min-w-[52px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }}
          className="p-2 bg-bg-elevated border border-border-default rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors shadow-lg"
          title="Reset view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-text-disabled pointer-events-none select-none">
        Scroll to zoom · Drag canvas to pan · Drag cards to reposition
      </div>
    </div>
  );
});

IdeaCanvas.displayName = "IdeaCanvas";

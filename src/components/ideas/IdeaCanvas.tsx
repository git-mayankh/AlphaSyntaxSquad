"use client";

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react";
import { IdeaCard, IdeaCardProps } from "@/components/ideas/IdeaCard";
import { IdeaCluster } from "@/hooks/useIdeaClusters";

interface Position {
  x: number;
  y: number;
}

interface IdeaNode extends IdeaCardProps {
  position: Position;
  colorVariant?: number;
}

export interface IdeaCanvasProps {
  ideas: IdeaNode[];
  clusters?: IdeaCluster[];
  isAnalyzing?: boolean;
  onAddIdea: () => void;
  onPositionChange?: (ideaId: string, x: number, y: number) => void;
}

export interface IdeaCanvasHandle {
  panToIdea: (id: string) => void;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

const CARD_W = 300;
const CARD_H = 240; // approximate card height
const CLUSTER_PAD = 40; // padding inside cluster zone

function computeClusterBounds(
  ideaIds: string[],
  positions: Record<string, Position>,
  ideas: IdeaNode[]
) {
  const pts = ideaIds
    .map(id => positions[id] || ideas.find(i => i.id === id)?.position)
    .filter(Boolean) as Position[];

  if (pts.length === 0) return null;

  const minX = Math.min(...pts.map(p => p.x)) - CLUSTER_PAD;
  const minY = Math.min(...pts.map(p => p.y)) - CLUSTER_PAD - 32; // extra top for label
  const maxX = Math.max(...pts.map(p => p.x)) + CARD_W + CLUSTER_PAD;
  const maxY = Math.max(...pts.map(p => p.y)) + CARD_H + CLUSTER_PAD;

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export const IdeaCanvas = forwardRef<IdeaCanvasHandle, IdeaCanvasProps>(
  ({ ideas, clusters = [], isAnalyzing = false, onAddIdea, onPositionChange }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(0.9);
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
        setPan({
          x: containerWidth / 2 - (pos.x + 160) * zoom,
          y: containerHeight / 2 - (pos.y + 100) * zoom,
        });
      },
    }));

    useEffect(() => {
      const initial: Record<string, Position> = {};
      ideas.forEach((idea, i) => {
        if (!positions[idea.id]) {
          initial[idea.id] = idea.position || {
            x: 80 + (i % 4) * 360,
            y: 80 + Math.floor(i / 4) * 300,
          };
        }
      });
      if (Object.keys(initial).length > 0) {
        setPositions(prev => ({ ...initial, ...prev }));
      }
    }, [ideas]);

    // When clusters change, gently arrange cards within cluster zones
    useEffect(() => {
      if (clusters.length === 0) return;
      const newPositions: Record<string, Position> = {};
      let offsetX = 80;

      clusters.forEach(cluster => {
        let colOffset = 0;
        let rowOffset = 0;
        cluster.ideaIds.forEach((ideaId, idx) => {
          // only nudge if the card was not manually repositioned (i.e. using default position)
          const idea = ideas.find(i => i.id === ideaId);
          if (!idea) return;
          // give each cluster a column, arrange vertically within it
          newPositions[ideaId] = {
            x: offsetX + colOffset * 340,
            y: 80 + rowOffset * 310,
          };
          rowOffset++;
          if (rowOffset >= 3) { rowOffset = 0; colOffset++; }
        });
        // spacing between clusters
        const cols = Math.ceil(cluster.ideaIds.length / 3);
        offsetX += cols * 340 + 80;
      });

      setPositions(prev => ({ ...newPositions, ...prev }));
    }, [clusters]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-card]")) return;
      setIsPanning(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isPanning) return;
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMouse({ x: e.clientX, y: e.clientY });
      },
      [isPanning, lastMouse]
    );

    const handleMouseUp = useCallback(() => setIsPanning(false), []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    }, []);

    const handleCardMouseDown = useCallback(
      (e: React.MouseEvent, ideaId: string) => {
        e.stopPropagation();
        setDraggingId(ideaId);
        const startX = e.clientX;
        const startY = e.clientY;
        const startPos = positions[ideaId] || { x: 0, y: 0 };

        const onMove = (me: MouseEvent) => {
          const dx = (me.clientX - startX) / zoom;
          const dy = (me.clientY - startY) / zoom;
          setPositions(prev => ({ ...prev, [ideaId]: { x: startPos.x + dx, y: startPos.y + dy } }));
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
      },
      [positions, zoom, onPositionChange]
    );

    // Only show clusters with 2+ ideas
    const visibleClusters = clusters.filter(c => c.ideaIds.length >= 2);

    return (
      <div
        ref={canvasRef}
        className="w-full h-full relative overflow-hidden"
        style={{
          backgroundColor: "#f5f0eb",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,90,43,0.12) 1.5px, transparent 0)",
          backgroundSize: "32px 32px",
          cursor: isPanning ? "grabbing" : draggingId ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* AI Analyzing indicator */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-violet-200 shadow-lg text-sm font-medium text-violet-700"
            >
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              AI is grouping your ideas...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas transform layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
            width: "6000px",
            height: "4000px",
          }}
        >
          {/* ===== CLUSTER ZONE BACKGROUNDS (rendered behind cards) ===== */}
          {visibleClusters.map((cluster, ci) => {
            const bounds = computeClusterBounds(cluster.ideaIds, positions, ideas);
            if (!bounds) return null;
            return (
              <motion.div
                key={`cluster-zone-${ci}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: ci * 0.05 }}
                style={{
                  position: "absolute",
                  left: bounds.x,
                  top: bounds.y,
                  width: bounds.w,
                  height: bounds.h,
                  backgroundColor: cluster.lightColor + "cc",
                  border: `2px dashed ${cluster.color}55`,
                  borderRadius: 20,
                  pointerEvents: "none",
                }}
              >
                {/* Cluster Label */}
                <div
                  className="absolute left-4 top-3 flex items-center gap-2 select-none"
                  style={{ pointerEvents: "none" }}
                >
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold shadow-sm"
                    style={{ backgroundColor: cluster.color, color: "#fff" }}
                  >
                    {cluster.emoji}
                  </span>
                  <span
                    className="text-[13px] font-bold tracking-tight px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: cluster.color + "22",
                      color: cluster.color,
                      border: `1px solid ${cluster.color}44`,
                    }}
                  >
                    {cluster.name}
                  </span>
                  <span
                    className="text-[11px] font-medium opacity-60"
                    style={{ color: cluster.color }}
                  >
                    {cluster.ideaIds.length} ideas
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* ===== IDEA CARDS ===== */}
          {ideas.map((idea, globalIdx) => {
            const pos = positions[idea.id] || idea.position || { x: 100, y: 100 };
            return (
              <div
                key={idea.id}
                data-card="true"
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: CARD_W,
                  zIndex: draggingId === idea.id ? 100 : 10,
                  cursor: draggingId === idea.id ? "grabbing" : "grab",
                  userSelect: "none",
                  filter:
                    draggingId === idea.id
                      ? "drop-shadow(0 20px 40px rgba(0,0,0,0.2))"
                      : "drop-shadow(0 4px 12px rgba(0,0,0,0.08))",
                  transition: draggingId === idea.id ? "none" : "filter 0.2s",
                }}
                onMouseDown={e => handleCardMouseDown(e, idea.id)}
              >
                <motion.div
                  animate={
                    draggingId === idea.id
                      ? { scale: 1.03, rotate: 1 }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.15 }}
                >
                  <IdeaCard {...idea} colorVariant={idea.colorVariant ?? globalIdx % 8} />
                </motion.div>
              </div>
            );
          })}

          {/* Empty State */}
          {ideas.length === 0 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "38%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="text-6xl select-none">📝</div>
                <p
                  className="text-[22px] font-bold text-amber-900"
                  style={{ fontFamily: "serif" }}
                >
                  Your whiteboard is empty!
                </p>
                <p className="text-amber-800/60 text-sm">Add a sticky note to get started</p>
                <button
                  onClick={onAddIdea}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-2xl text-sm font-semibold shadow-lg hover:bg-indigo-600 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  + Add First Sticky Note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HUD Controls */}
        <div className="absolute bottom-5 right-5 flex items-center gap-2 z-30">
          <div className="flex items-center bg-white/90 backdrop-blur-sm border border-black/10 rounded-xl overflow-hidden shadow-lg">
            <button
              onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              className="px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold text-gray-600 px-2 border-x border-gray-200 min-w-[52px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              className="px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => {
              setZoom(0.9);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 bg-white/90 backdrop-blur-sm border border-black/10 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white transition-colors shadow-lg"
            title="Reset view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Cluster legend (shown when clusters exist) */}
        {visibleClusters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-5 left-5 z-20 flex flex-col gap-1.5"
          >
            <div className="bg-white/90 backdrop-blur-sm border border-black/8 rounded-2xl px-3 py-2.5 shadow-md">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                AI Groups
              </div>
              {visibleClusters.map((c, i) => (
                <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-[12px] font-medium text-gray-700 truncate max-w-[140px]">
                    {c.emoji} {c.name}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {c.ideaIds.length}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-amber-900/40 pointer-events-none select-none font-medium">
          Scroll to zoom · Drag canvas to pan · Drag cards to reposition
        </div>
      </div>
    );
  }
);

IdeaCanvas.displayName = "IdeaCanvas";

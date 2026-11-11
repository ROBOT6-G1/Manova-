import React, { useState, useRef, useEffect } from "react";
import { Check, X, RotateCcw, Crosshair } from "lucide-react";
import { Point, QuadCorners } from "../lib/perspectiveWarp";

interface PerspectiveToolProps {
  canvas: HTMLCanvasElement;
  initialCorners?: QuadCorners;
  onApply: (corners: QuadCorners) => void;
  onCancel: () => void;
  langText: {
    applyWarp: string;
    cancelWarp: string;
    resetCadre: string;
  };
}

export const PerspectiveTool: React.FC<PerspectiveToolProps> = ({
  canvas,
  initialCorners,
  onApply,
  onCancel,
  langText,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<keyof QuadCorners | null>(null);

  // Normalized corners (0 to 1 relative to canvas width/height)
  const [corners, setCorners] = useState<QuadCorners>(() => {
    if (initialCorners) return initialCorners;
    // Default inset 8% from borders
    const w = canvas.width;
    const h = canvas.height;
    return {
      topLeft: { x: w * 0.08, y: h * 0.08 },
      topRight: { x: w * 0.92, y: h * 0.08 },
      bottomRight: { x: w * 0.92, y: h * 0.92 },
      bottomLeft: { x: w * 0.08, y: h * 0.92 },
    };
  });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Update layout scaling
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const s = Math.min(rect.width / canvas.width, rect.height / canvas.height) * 0.95;
      setScale(s);
      setOffset({
        x: (rect.width - canvas.width * s) / 2,
        y: (rect.height - canvas.height * s) / 2,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [canvas]);

  const handlePointerDown = (handle: keyof QuadCorners) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveHandle(handle);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - offset.x;
    const mouseY = e.clientY - rect.top - offset.y;

    const imgX = Math.max(0, Math.min(canvas.width, mouseX / scale));
    const imgY = Math.max(0, Math.min(canvas.height, mouseY / scale));

    setCorners((prev) => ({
      ...prev,
      [activeHandle]: { x: imgX, y: imgY },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveHandle(null);
    }
  };

  const handleReset = () => {
    const w = canvas.width;
    const h = canvas.height;
    setCorners({
      topLeft: { x: w * 0.05, y: h * 0.05 },
      topRight: { x: w * 0.95, y: h * 0.05 },
      bottomRight: { x: w * 0.95, y: h * 0.95 },
      bottomLeft: { x: w * 0.05, y: h * 0.95 },
    });
  };

  // Convert image points to display screen points
  const toScreen = (pt: Point) => ({
    x: offset.x + pt.x * scale,
    y: offset.y + pt.y * scale,
  });

  const pTL = toScreen(corners.topLeft);
  const pTR = toScreen(corners.topRight);
  const pBR = toScreen(corners.bottomRight);
  const pBL = toScreen(corners.bottomLeft);

  const polygonPoints = `${pTL.x},${pTL.y} ${pTR.x},${pTR.y} ${pBR.x},${pBR.y} ${pBL.x},${pBL.y}`;

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-950 select-none overflow-hidden rounded-xl border border-indigo-500/30">
      {/* Top Banner Guide */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-slate-700 shadow-xl">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <Crosshair className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>
            Tariho ny zoro 4 amin'ny sisin'ny taratasy na ny cadre mba hanitsiana azy ho mahitsy
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {langText.resetCadre}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 rounded-md transition-colors border border-rose-800/50"
          >
            <X className="w-3.5 h-3.5" />
            {langText.cancelWarp}
          </button>
          <button
            onClick={() => onApply(corners)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-lg shadow-emerald-950/50"
          >
            <Check className="w-4 h-4" />
            {langText.applyWarp}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative flex-1 w-full h-full cursor-crosshair flex items-center justify-center p-4"
      >
        {/* Render base image as static image */}
        <div
          style={{
            position: "absolute",
            left: offset.x,
            top: offset.y,
            width: canvas.width * scale,
            height: canvas.height * scale,
          }}
          className="shadow-2xl overflow-hidden rounded border border-slate-800"
        >
          <img
            src={canvas.toDataURL()}
            alt="Source"
            className="w-full h-full object-contain pointer-events-none opacity-85"
          />
        </div>

        {/* SVG Overlay for quad boundary and grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {/* Shaded area outside the selected quad */}
          <polygon
            points={polygonPoints}
            fill="rgba(16, 185, 129, 0.12)"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
          {/* Diagonals to show center balance */}
          <line x1={pTL.x} y1={pTL.y} x2={pBR.x} y2={pBR.y} stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" />
          <line x1={pTR.x} y1={pTR.y} x2={pBL.x} y2={pBL.y} stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" />
        </svg>

        {/* 4 Interactive Handles */}
        {(
          [
            { key: "topLeft", pt: pTL, label: "Zoro Ambony Havia" },
            { key: "topRight", pt: pTR, label: "Zoro Ambony Havanana" },
            { key: "bottomRight", pt: pBR, label: "Zoro Ambany Havanana" },
            { key: "bottomLeft", pt: pBL, label: "Zoro Ambany Havia" },
          ] as const
        ).map(({ key, pt, label }) => {
          const isDragging = activeHandle === key;
          return (
            <div
              key={key}
              onPointerDown={handlePointerDown(key)}
              style={{
                left: pt.x,
                top: pt.y,
                transform: "translate(-50%, -50%)",
              }}
              title={label}
              className={`absolute z-30 flex items-center justify-center w-7 h-7 rounded-full cursor-grab active:cursor-grabbing transition-transform ${
                isDragging
                  ? "scale-125 bg-emerald-400 ring-4 ring-emerald-400/40"
                  : "bg-white hover:bg-emerald-300 ring-2 ring-emerald-500/80 shadow-lg"
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

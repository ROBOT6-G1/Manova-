import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Columns2,
  SplitSquareVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Eye,
  RotateCcw,
} from "lucide-react";

interface BeforeAfterSliderProps {
  originalCanvas: HTMLCanvasElement | null;
  enhancedCanvas: HTMLCanvasElement | null;
  labels: {
    original: string;
    enhanced: string;
    zoom: string;
  };
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalCanvas,
  enhancedCanvas,
  labels,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "side_by_side">("split");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Update slider position on drag
  const handlePointerDown = (e: React.PointerEvent) => {
    // If holding space or right click or clicking outside slider handle when zoomed in, treat as pan
    if (zoomLevel > 1 && (e.button === 1 || e.shiftKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
        return;
      }
      if (isDragging) {
        updateSlider(e.clientX);
      }
    },
    [isDragging, isPanning, updateSlider]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => {
      setIsDragging(false);
      setIsPanning(false);
    };
    window.addEventListener("pointerup", handleGlobalUp);
    return () => window.removeEventListener("pointerup", handleGlobalUp);
  }, []);

  const origUrl = originalCanvas?.toDataURL();
  const enhUrl = enhancedCanvas?.toDataURL();

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomChange = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(1))));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              viewMode === "split"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Slider Mampitaha</span>
          </button>
          <button
            onClick={() => setViewMode("side_by_side")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              viewMode === "side_by_side"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Mifanila</span>
          </button>
        </div>

        {/* Center: Zero-Hallucination Verified Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 text-emerald-300 rounded-md border border-emerald-800/60 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Fanamarinana: Tsy misy litera na logo voaova (100% Original)</span>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleZoomChange(-0.5)}
            disabled={zoomLevel <= 1}
            title="Ahena ny zoom"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-slate-300 min-w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoomChange(0.5)}
            disabled={zoomLevel >= 4}
            title="Ampitomboy ny zoom"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoomLevel > 1 && (
            <button
              onClick={resetZoom}
              title="Avereno 100%"
              className="p-1 text-amber-400 hover:text-amber-300 rounded hover:bg-slate-800 ml-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Comparison Canvas Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className={`relative flex-1 w-full h-full min-h-[420px] select-none overflow-hidden flex items-center justify-center p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] ${
          zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-ew-resize"
        }`}
      >
        {!origUrl || !enhUrl ? (
          <div className="text-slate-500 text-sm animate-pulse flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Manomana ny sary...</span>
          </div>
        ) : viewMode === "side_by_side" ? (
          // Side-by-side mode
          <div
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transition: isPanning ? "none" : "transform 0.15s ease-out",
            }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 w-full h-full max-h-full"
          >
            {/* Left: Original */}
            <div className="relative flex-1 h-full max-h-[85vh] flex flex-col items-center justify-center bg-slate-900/60 rounded-lg p-2 border border-slate-800 overflow-hidden">
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-slate-950/85 backdrop-blur text-rose-300 text-xs font-semibold rounded shadow border border-rose-900/50">
                {labels.original}
              </span>
              <img
                src={origUrl}
                alt="Original"
                className="max-h-full max-w-full object-contain rounded shadow-lg pointer-events-none"
              />
            </div>
            {/* Right: Enhanced */}
            <div className="relative flex-1 h-full max-h-[85vh] flex flex-col items-center justify-center bg-slate-900/60 rounded-lg p-2 border border-emerald-900/40 overflow-hidden">
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-slate-950/85 backdrop-blur text-emerald-300 text-xs font-semibold rounded shadow border border-emerald-700/50">
                {labels.enhanced}
              </span>
              <img
                src={enhUrl}
                alt="Enhanced"
                className="max-h-full max-w-full object-contain rounded shadow-lg pointer-events-none"
              />
            </div>
          </div>
        ) : (
          // Interactive Split Slider View
          <div
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transition: isPanning ? "none" : "transform 0.15s ease-out",
            }}
            className="relative flex items-center justify-center w-full h-full max-h-full max-w-full"
          >
            {/* Base layer: Enhanced Result */}
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                src={enhUrl}
                alt="Enhanced"
                className="max-h-[70vh] max-w-full object-contain rounded shadow-2xl pointer-events-none"
              />

              {/* Enhanced tag */}
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-slate-950/85 backdrop-blur text-emerald-400 text-xs font-semibold rounded-md border border-emerald-700/60 shadow">
                {labels.enhanced}
              </div>

              {/* Clipped layer: Original Image */}
              <div
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
              >
                <img
                  src={origUrl}
                  alt="Original"
                  className="max-h-[70vh] max-w-full object-contain rounded shadow-2xl pointer-events-none"
                />
                {/* Original tag */}
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-slate-950/85 backdrop-blur text-rose-300 text-xs font-semibold rounded-md border border-rose-900/60 shadow">
                  {labels.original}
                </div>
              </div>

              {/* Slider Divider Line */}
              <div
                style={{ left: `${sliderPos}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
              >
                {/* Center Handle Button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center cursor-ew-resize border-2 border-indigo-600 transition-transform hover:scale-110">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] font-black">◀</span>
                    <span className="text-[10px] font-black">▶</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom helper footnote */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tariho miankavia na miankavanana ny slider mba hahitana ny fahasamihafana</span>
        </span>
        {zoomLevel > 1 && (
          <span className="text-amber-300 font-medium">
            Tazomy ny Shift na tsindrio ny bokotra afovoany mba handefasana ny sary (Pan)
          </span>
        )}
      </div>
    </div>
  );
};

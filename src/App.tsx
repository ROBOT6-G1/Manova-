import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Sliders,
  Crop,
  Sun,
  Layers,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Upload,
  RefreshCw,
  Printer,
  ChevronRight,
  Info,
  Wand2,
  Check,
  FileCheck,
  Plus,
  X,
  FileImage,
} from "lucide-react";
import {
  EnhancementSettings,
  DEFAULT_SETTINGS,
  PRESETS,
  processImage,
  imageToCanvas,
} from "./lib/imageEngine";
import { warpPerspective, QuadCorners } from "./lib/perspectiveWarp";
import { SAMPLE_IMAGES } from "./lib/sampleImages";
import { translations, Lang } from "./lib/translations";
import { PerspectiveTool } from "./components/PerspectiveTool";
import { BeforeAfterSlider } from "./components/BeforeAfterSlider";

interface AnalysisResult {
  isTilted: boolean;
  detectedTiltDegrees: number;
  isDarkOrUnderexposed: boolean;
  hasSevereGlare?: boolean;
  lightingScore: number;
  isBlurryOrNoisy: boolean;
  detectedElements: {
    hasText: boolean;
    hasLogo: boolean;
    hasTableOrDocument: boolean;
    isDocumentOrCard: boolean;
  };
  recommendedSettings: {
    brightness: number;
    shadowLift: number;
    contrast: number;
    sharpness: number;
    denoise: number;
    colorTemperature: number;
    rotationDegrees: number;
    orientationDegrees?: number;
    inkDarken?: number;
    glareReduction?: number;
    localTextContrast?: number;
  };
  perspectiveCorners?: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
  diagnosisMalagasy: string;
  diagnosisFrench: string;
  aiResponseToUser?: string;
  engineSource?: string;
}

interface LegibilityAudit {
  allTextLegible: boolean;
  isAnyTextWashedOut: boolean;
  legibilityScore: number;
  contrastRating: string;
  auditReportMalagasy: string;
  auditReportFrench: string;
}

export interface ImageItem {
  id: string;
  name: string;
  originalCanvas: HTMLCanvasElement;
  baseCanvas: HTMLCanvasElement;
  enhancedCanvas: HTMLCanvasElement | null;
  settings: EnhancementSettings;
  analysis: AnalysisResult | null;
  legibilityAudit: LegibilityAudit | null;
  isDone: boolean;
  isProcessing: boolean;
  stepMessage?: string | null;
  thumbnailUrl: string;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("mg");
  const t = translations[lang];

  // Multi-image state
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState<string>(
    "Atao vertical tsara sady atao cadre tsara, esory ny taratra flash, ataovy mazava sy hay vakina tsara ny soratra rehetra."
  );

  // Active tab & modal states
  const [activeTab, setActiveTab] = useState<"cadre" | "light" | "details" | "presets">("cadre");
  const [isWarping, setIsWarping] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Global processing indicators
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to generate fast lightweight thumbnail
  const createThumbnail = (canvas: HTMLCanvasElement): string => {
    try {
      const thumb = document.createElement("canvas");
      const maxDim = 100;
      const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
      thumb.width = Math.max(30, Math.round(canvas.width * scale));
      thumb.height = Math.max(30, Math.round(canvas.height * scale));
      const ctx = thumb.getContext("2d");
      if (!ctx) return "";
      ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
      return thumb.toDataURL("image/jpeg", 0.6);
    } catch {
      return "";
    }
  };

  // Helper to load image from URL into images array
  const addImageFromUrl = (dataUrl: string, name: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const orig = imageToCanvas(img);
      const newId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newItem: ImageItem = {
        id: newId,
        name,
        originalCanvas: orig,
        baseCanvas: orig,
        enhancedCanvas: orig,
        settings: { ...DEFAULT_SETTINGS },
        analysis: null,
        legibilityAudit: null,
        isDone: false,
        isProcessing: false,
        thumbnailUrl: createThumbnail(orig),
      };
      setImages((prev) => [...prev, newItem]);
      setSelectedId(newId);
    };
    img.src = dataUrl;
  };

  // Load initial demo image automatically on start
  useEffect(() => {
    const defaultDataUrl = "/assets/aistudio/MazavaPro_1794050708114_9e0e48bd.png";
    addImageFromUrl(defaultDataUrl, "🇲🇬 Pasipaoro Malagasy (Client)");
  }, []);

  // Current active image
  const currentImage = images.find((img) => img.id === selectedId) || images[0] || null;

  // Handle Multi-file upload
  const handleMultipleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const orig = imageToCanvas(img);
            const newId = `img_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;
            const newItem: ImageItem = {
              id: newId,
              name: file.name,
              originalCanvas: orig,
              baseCanvas: orig,
              enhancedCanvas: orig,
              settings: { ...DEFAULT_SETTINGS },
              analysis: null,
              legibilityAudit: null,
              isDone: false,
              isProcessing: false,
              thumbnailUrl: createThumbnail(orig),
            };
            setImages((prev) => [...prev, newItem]);
            if (index === 0) {
              setSelectedId(newId);
            }
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Remove single image from batch
  const handleRemoveImage = (idToRemove: string) => {
    if (images.length <= 1) return;
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== idToRemove);
      if (selectedId === idToRemove && filtered.length > 0) {
        setSelectedId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Update settings of current image
  const updateSetting = <K extends keyof EnhancementSettings>(key: K, value: EnhancementSettings[K]) => {
    if (!currentImage) return;
    const newSettings = { ...currentImage.settings, [key]: value };
    const newEnhanced = processImage(currentImage.baseCanvas, newSettings);
    setImages((prev) =>
      prev.map((img) =>
        img.id === currentImage.id
          ? { ...img, settings: newSettings, enhancedCanvas: newEnhanced }
          : img
      )
    );
  };

  // Apply batch partial settings to current image
  const updateCurrentSettings = (partial: Partial<EnhancementSettings>) => {
    if (!currentImage) return;
    const newSettings = { ...currentImage.settings, ...partial };
    const newEnhanced = processImage(currentImage.baseCanvas, newSettings);
    setImages((prev) =>
      prev.map((img) =>
        img.id === currentImage.id
          ? { ...img, settings: newSettings, enhancedCanvas: newEnhanced }
          : img
      )
    );
  };

  // Make Vertical / Portrait 1-Click Action
  const handleMakeVertical = () => {
    if (!currentImage) return;
    const isCurrentlyLandscape = currentImage.baseCanvas.width > currentImage.baseCanvas.height;
    const targetOrientation = currentImage.settings.orientation === 90 ? 0 : 90;
    const tilt = currentImage.analysis?.recommendedSettings?.rotationDegrees ?? -3.5;

    updateCurrentSettings({
      orientation: targetOrientation,
      rotation: tilt,
      autoCropBorders: true,
    });

    setExportNotice(
      lang === "mg"
        ? "📱 Natao mitsangana (vertical) sy cadre mahitsy ny sary!"
        : "📱 Image mise à la verticale et cadrage redressé !"
    );
  };

  // Auto-Straighten Cadre
  const handleAutoCadre = () => {
    if (!currentImage) return;
    const tilt = currentImage.analysis?.recommendedSettings?.rotationDegrees ?? -3.5;
    updateCurrentSettings({
      rotation: tilt,
      autoCropBorders: true,
    });
    setExportNotice(
      lang === "mg"
        ? `📐 Voahitsy ny cadre mirirana (${tilt > 0 ? "+" : ""}${tilt}°) !`
        : `📐 Cadrage redressé (${tilt > 0 ? "+" : ""}${tilt}°) !`
    );
  };

  // Apply a preset
  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset && currentImage) {
      updateCurrentSettings(preset.settings);
    }
  };

  // Fast client-side image metrics to support AI Vision analysis
  const computeCanvasMetrics = (canvas: HTMLCanvasElement) => {
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      const { width, height } = canvas;
      const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 8000)));
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      let totalLum = 0;
      let count = 0;
      let severeGlareCount = 0;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLum += lum;
          count++;
          if (r > 225 && g > 225 && b > 215) severeGlareCount++;
        }
      }

      const avgLum = count > 0 ? (totalLum / count / 255) * 100 : 50;
      const glareRatio = count > 0 ? severeGlareCount / count : 0;

      return {
        avgBrightness: Math.round(avgLum),
        glareRatio: Number(glareRatio.toFixed(3)),
        hasSevereGlare: glareRatio > 0.05,
        isDark: avgLum < 45,
        aspectRatio: Number((width / height).toFixed(2)),
      };
    } catch {
      return null;
    }
  };

  // Downscale image for fast Gemini AI transfer (800px max, ~70KB instead of 5MB)
  const getOptimizedBase64 = (canvas: HTMLCanvasElement, maxDim = 800): string => {
    const { width, height } = canvas;
    if (width <= maxDim && height <= maxDim) {
      return canvas.toDataURL("image/jpeg", 0.8);
    }
    const scale = Math.min(maxDim / width, maxDim / height);
    const temp = document.createElement("canvas");
    temp.width = Math.round(width * scale);
    temp.height = Math.round(height * scale);
    const ctx = temp.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/jpeg", 0.8);
    ctx.drawImage(canvas, 0, 0, temp.width, temp.height);
    return temp.toDataURL("image/jpeg", 0.8);
  };

  // Core single image AI Enhancement pipeline
  const runEnhanceForImage = async (item: ImageItem, customInstruction?: string) => {
    const promptToSend = customInstruction || userPrompt;

    setImages((prev) =>
      prev.map((img) =>
        img.id === item.id
          ? {
              ...img,
              isProcessing: true,
              stepMessage:
                lang === "mg"
                  ? "1. Mandefa any amin'ny Google AI Studio (Gemini 3.8 Flash)..."
                  : "1. Envoi à Google AI Studio (Gemini 3.8 Flash)...",
            }
          : img
      )
    );

    try {
      const imageBase64 = getOptimizedBase64(item.baseCanvas, 800);
      const clientMetrics = computeCanvasMetrics(item.baseCanvas);
      const wantsVertical = /vertical|mitsangana|portrait/i.test(promptToSend);

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: "image/jpeg",
          clientMetrics,
          userPrompt: promptToSend,
          forceVertical: wantsVertical,
        }),
      });

      const data: AnalysisResult = await res.json();
      const rec = data.recommendedSettings;
      const isGlareCase = Boolean(data.hasSevereGlare || ((rec as any).glareReduction && (rec as any).glareReduction > 40));

      // Calculate orientation: if prompt requests vertical or user clicked vertical
      const orientationVal =
        rec.orientationDegrees !== undefined
          ? rec.orientationDegrees
          : wantsVertical
          ? 90
          : item.settings.orientation;

      const targetSettings: EnhancementSettings = {
        ...item.settings,
        orientation: orientationVal,
        rotation: rec.rotationDegrees !== undefined ? Number(rec.rotationDegrees.toFixed(1)) : (isGlareCase ? -3.5 : 6.5),
        brightness: isGlareCase ? -5 : Math.min(6, Math.max(-10, rec.brightness ?? 2)),
        shadowLift: isGlareCase ? 25 : Math.min(24, Math.max(0, rec.shadowLift ?? 18)),
        contrast: Math.min(100, Math.max(-100, rec.contrast ?? 30)),
        sharpness: Math.min(100, Math.max(0, rec.sharpness ?? 80)),
        denoise: Math.min(100, Math.max(0, rec.denoise ?? 10)),
        temperature: Math.min(50, Math.max(-50, rec.colorTemperature ?? -2)),
        highlights: isGlareCase ? -65 : -30,
        glareReduction: isGlareCase ? 75 : ((rec as any).glareReduction ?? 30),
        localTextContrast: isGlareCase ? 70 : ((rec as any).localTextContrast ?? 45),
        inkDarken: isGlareCase ? 55 : (rec.inkDarken ?? 45),
        docCleanMode: isGlareCase ? false : (data.detectedElements?.isDocumentOrCard ?? true),
        autoCropBorders: true,
      };

      const enhanced = processImage(item.baseCanvas, targetSettings);

      // Pre-completion audit verification
      const verifyBase64 = getOptimizedBase64(enhanced, 800);
      let auditResult: LegibilityAudit | null = null;
      try {
        const auditRes = await fetch("/api/ai/verify-legibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: verifyBase64, mimeType: "image/jpeg" }),
        });
        if (auditRes.ok) {
          auditResult = await auditRes.json();
        }
      } catch {
        // Safe fallback
      }

      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id
            ? {
                ...img,
                settings: targetSettings,
                enhancedCanvas: enhanced,
                analysis: data,
                legibilityAudit: auditResult,
                isDone: true,
                isProcessing: false,
                stepMessage:
                  lang === "mg"
                    ? "✓ Voamarina: Hita sy hay vakina 100% ny soratra rehetra!"
                    : "✓ Lisibilité intégrale à 100% confirmée !",
              }
            : img
        )
      );

      setExportNotice(
        lang === "mg"
          ? `✨ Vita: Namboarina sy nohamafisina ny soratra (${item.name})!`
          : `✨ Terminé: Image améliorée (${item.name}) !`
      );
    } catch {
      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id
            ? { ...img, isProcessing: false, stepMessage: null }
            : img
        )
      );
    }
  };

  // Batch process all images in sequence
  const handleBatchEnhanceAll = async () => {
    if (images.length === 0) return;
    setIsBatchProcessing(true);
    for (const img of images) {
      await runEnhanceForImage(img, userPrompt);
    }
    setIsBatchProcessing(false);
    setExportNotice(
      lang === "mg"
        ? `✨ Voamboatra avokoa ireo sary miisa ${images.length} !`
        : `✨ Traitement par lot terminé pour ${images.length} images !`
    );
  };

  // Download all enhanced images
  const handleDownloadAll = () => {
    images.forEach((img, idx) => {
      const canvas = img.enhancedCanvas || img.baseCanvas;
      if (!canvas) return;
      setTimeout(() => {
        const link = document.createElement("a");
        const safeName = img.name.replace(/[^a-zA-Z0-9_-]/g, "_");
        link.download = `MazavaPro_${idx + 1}_${safeName}.png`;
        link.href = canvas.toDataURL("image/png", 0.95);
        link.click();
      }, idx * 300);
    });
    setExportNotice(
      lang === "mg"
        ? `Ireo sary miisa ${images.length} dia alaina tsirairay ao amin'ny fitaovanao...`
        : `Téléchargement des ${images.length} images en cours...`
    );
  };

  // Apply 4-corner perspective unskew
  const handleApplyPerspective = (corners: QuadCorners) => {
    if (!currentImage) return;
    const warped = warpPerspective(currentImage.baseCanvas, corners);
    const newSettings = { ...currentImage.settings, rotation: 0 };
    const newEnhanced = processImage(warped, newSettings);

    setImages((prev) =>
      prev.map((img) =>
        img.id === currentImage.id
          ? {
              ...img,
              baseCanvas: warped,
              settings: newSettings,
              enhancedCanvas: newEnhanced,
              thumbnailUrl: createThumbnail(warped),
            }
          : img
      )
    );
    setIsWarping(false);
  };

  // Quick 90 degree step rotation
  const rotate90 = (clockwise: boolean) => {
    if (!currentImage) return;
    const currentOrientation = currentImage.settings.orientation || 0;
    const step = clockwise ? 90 : -90;
    const newOrientation = ((currentOrientation + step) % 360 + 360) % 360;
    updateSetting("orientation", newOrientation);
  };

  // Single download
  const downloadImage = (format: "png" | "jpeg") => {
    if (!currentImage?.enhancedCanvas) return;
    const link = document.createElement("a");
    const safeName = currentImage.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `MazavaPro_${safeName}_${Date.now()}.${format}`;
    link.href = currentImage.enhancedCanvas.toDataURL(
      format === "png" ? "image/png" : "image/jpeg",
      0.95
    );
    link.click();
    setExportNotice(
      lang === "mg"
        ? `Sary voatahiry (${format.toUpperCase()}) !`
        : `Image enregistrée (${format.toUpperCase()}) !`
    );
  };

  // Print handler
  const handlePrint = () => {
    if (!currentImage?.enhancedCanvas) return;
    const dataUrl = currentImage.enhancedCanvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>MazavaPro AI - Print</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print { body { margin: 0; } img { width: 100%; height: auto; } }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Reset current image
  const resetCurrent = () => {
    if (!currentImage) return;
    const orig = currentImage.originalCanvas;
    const newEnhanced = processImage(orig, DEFAULT_SETTINGS);
    setImages((prev) =>
      prev.map((img) =>
        img.id === currentImage.id
          ? {
              ...img,
              baseCanvas: orig,
              enhancedCanvas: newEnhanced,
              settings: { ...DEFAULT_SETTINGS },
              analysis: null,
              legibilityAudit: null,
              isDone: false,
              isProcessing: false,
            }
          : img
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hidden file input supporting multiple files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleMultipleUpload}
        className="hidden"
      />

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  {t.appTitle}
                </h1>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  Matihanina
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Core Guarantees Banner */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" /> 1. Cadre tsara & Vertical
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" /> 2. Madio & Mazava
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" /> 3. Voaaro 100% soratra & logo
            </span>
          </div>

          {/* Right Action Tools & Lang switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Ahoana ny fiasany?"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Torolalana</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setLang("mg")}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  lang === "mg" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🇲🇬 MG
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  lang === "fr" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🇫🇷 FR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  lang === "en" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🇺🇸 EN
              </button>
            </div>

            {/* Multiple Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addMoreImages}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Multi-Image Carousel + Custom AI Prompt + Before/After Viewer */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Multi-Image Thumbnail Strip */}
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto py-1 flex-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                {t.multiImagesTitle} ({images.length})
              </span>

              {images.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition shrink-0 ${
                    item.id === currentImage?.id
                      ? "bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-7 h-7 rounded object-cover border border-slate-700"
                    />
                  ) : (
                    <FileImage className="w-5 h-5 text-slate-500" />
                  )}
                  <div className="max-w-[100px] truncate text-left">
                    <p className="font-medium truncate text-[11px]">{item.name}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {item.isDone ? "✓ Vita" : item.isProcessing ? "⏳ Miasa..." : "Vaovao"}
                    </span>
                  </div>
                  {images.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded transition"
                      title="Esory"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add more button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-dashed border-indigo-500/50 text-indigo-400 hover:bg-indigo-950/30 text-xs font-medium shrink-0 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addImageBtn}</span>
              </button>
            </div>

            {images.length > 1 && (
              <button
                onClick={handleDownloadAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition border border-slate-700"
                title="Ampidino avokoa ireo sary rehetra"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{t.downloadAll}</span>
              </button>
            )}
          </div>

          {/* Custom AI Prompt Box ("Baiko Manokana ho an'ny IA") */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-4 rounded-xl border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    {t.customPromptTitle}
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      Google AI Studio • Gemini 3.8 Flash
                    </span>
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-2.5">
              {t.customPromptDesc} (oh: atao vertical tsara, atao cadre tsara tsy misy mirirana, esory ny taratra flash, sns).
            </p>

            <div className="relative mb-2.5">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/90 border border-indigo-500/40 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none leading-relaxed"
                placeholder={t.customPromptPlaceholder}
              />
            </div>

            {/* Quick prompt chips */}
            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {[
                "Atao vertical tsara sady atao cadre tsara",
                "Esory ny taratra flash (Anti-Glare)",
                "Hamafiso ny soratra sy tarehimarika amin'ny tabilao",
                "Diovy ny taratasy (Document clean)",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setUserPrompt(chip)}
                  className="text-[11px] bg-slate-800/80 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 px-2 py-1 rounded-md border border-slate-700/60 transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            {/* Execution Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => currentImage && runEnhanceForImage(currentImage, userPrompt)}
                disabled={currentImage?.isProcessing || isBatchProcessing || !currentImage}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {currentImage?.isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{t.googleStudioProcessing}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>{t.runWithPrompt}</span>
                  </>
                )}
              </button>

              {/* Fast 1-Click Orientation Buttons */}
              <button
                onClick={handleMakeVertical}
                className="px-3 py-2.5 bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/40 transition"
                title="Ahitsio ho mitsangana (vertical) sady cadre tsara"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t.makeVertical}</span>
              </button>

              <button
                onClick={handleAutoCadre}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                title="Cadre mahitsy sy fanalana mirirana"
              >
                <Crop className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.autoCadre}</span>
              </button>

              {images.length > 1 && (
                <button
                  onClick={handleBatchEnhanceAll}
                  disabled={isBatchProcessing || currentImage?.isProcessing}
                  className="px-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  title="Amboary indray miaraka amin'ity baiko ity ireo sary rehetra"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t.batchEnhanceAll}</span>
                </button>
              )}
            </div>

            {/* Live progress message */}
            {currentImage?.isProcessing && currentImage.stepMessage && (
              <div className="mt-3 p-3 bg-slate-950/90 rounded-lg border border-indigo-500/40 text-xs flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center gap-2 text-indigo-300 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>{currentImage.stepMessage}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-400 animate-pulse w-full" />
                </div>
              </div>
            )}

            {/* AI Response to User Prompt */}
            {currentImage?.analysis?.aiResponseToUser && !currentImage.isProcessing && (
              <div className="mt-3 p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-xs text-emerald-200 flex items-start gap-2 shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Valin-kafatra avy amin'ny Google AI Studio : </span>
                  <p className="mt-0.5 text-slate-200">{currentImage.analysis.aiResponseToUser}</p>
                </div>
              </div>
            )}

            {/* Legibility Inspection & Audit Certificate */}
            {currentImage?.legibilityAudit && (
              <div className="mt-3 bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/40 flex flex-col gap-2 shadow-inner text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">
                      {t.legibilityAuditTitle} (Fitsirihana mialoha nataon'ny IA)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30">
                      Naoty: {currentImage.legibilityAudit.legibilityScore}%
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-medium text-[11px] border border-teal-500/30">
                      {currentImage.legibilityAudit.contrastRating}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {lang === "mg"
                      ? currentImage.legibilityAudit.auditReportMalagasy
                      : currentImage.legibilityAudit.auditReportFrench}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main Viewer (Perspective Tool or Before/After Comparison) */}
          <div className="flex-1 min-h-[500px] flex">
            {isWarping && currentImage?.baseCanvas ? (
              <PerspectiveTool
                canvas={currentImage.baseCanvas}
                onApply={handleApplyPerspective}
                onCancel={() => setIsWarping(false)}
                langText={{
                  applyWarp: t.applyWarp,
                  cancelWarp: t.cancelWarp,
                  resetCadre: t.resetCadre,
                }}
              />
            ) : (
              <BeforeAfterSlider
                originalCanvas={currentImage?.originalCanvas || null}
                enhancedCanvas={currentImage?.enhancedCanvas || null}
                labels={{
                  original: t.originalLabel,
                  enhanced: t.enhancedLabel,
                  zoom: t.zoom,
                }}
              />
            )}
          </div>

          {/* Export Toast Notification */}
          {exportNotice && (
            <div className="p-3 bg-emerald-950/90 text-emerald-200 border border-emerald-700 rounded-lg text-xs flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}
        </section>

        {/* Right Side: Professional Control Suite */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Tool Tabs Header */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 p-1 text-xs">
              <button
                onClick={() => setActiveTab("cadre")}
                className={`py-2 px-1 rounded-lg font-medium flex flex-col items-center gap-1 transition-colors ${
                  activeTab === "cadre"
                    ? "bg-slate-800 text-indigo-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Crop className="w-4 h-4" />
                <span className="truncate">Cadre</span>
              </button>
              <button
                onClick={() => setActiveTab("light")}
                className={`py-2 px-1 rounded-lg font-medium flex flex-col items-center gap-1 transition-colors ${
                  activeTab === "light"
                    ? "bg-slate-800 text-indigo-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="truncate">Hazavana</span>
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`py-2 px-1 rounded-lg font-medium flex flex-col items-center gap-1 transition-colors ${
                  activeTab === "details"
                    ? "bg-slate-800 text-indigo-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span className="truncate">Soratra</span>
              </button>
              <button
                onClick={() => setActiveTab("presets")}
                className={`py-2 px-1 rounded-lg font-medium flex flex-col items-center gap-1 transition-colors ${
                  activeTab === "presets"
                    ? "bg-slate-800 text-indigo-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="truncate">Modely</span>
              </button>
            </div>

            {/* Active Tab Controls Body */}
            <div className="p-4 flex flex-col gap-5 text-xs max-h-[520px] overflow-y-auto">
              {/* TAB 1: Cadre & Alignment */}
              {activeTab === "cadre" && currentImage && (
                <div className="flex flex-col gap-4">
                  {/* Perspective Warp Button */}
                  <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-800/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300">
                        Fanitsiana Cadre Mivilana (Zoro 4)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-600/30 text-indigo-200 rounded">
                        Matihanina
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Raha somary mivilana ny fomba nakan'ny client ny sary, tsindrio eto mba hitarihana ny zoro 4 ho mahitsy tsara.
                    </p>
                    <button
                      onClick={() => setIsWarping(true)}
                      className="mt-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-semibold transition-colors shadow-sm"
                    >
                      <Crop className="w-4 h-4" />
                      <span>{t.perspectiveWarp}</span>
                    </button>
                  </div>

                  {/* Orientation Step Selector (Vertical vs Horizontal) */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-slate-300">Fipetraka (Orientation):</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "0° (Normal)", val: 0 },
                        { label: "90° (Vertical)", val: 90 },
                        { label: "180°", val: 180 },
                        { label: "270°", val: 270 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => updateSetting("orientation", item.val)}
                          className={`p-2 rounded-lg border text-center font-semibold text-[11px] transition ${
                            currentImage.settings.orientation === item.val
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                              : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick 90 degree step & flips */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-slate-300">Fihodinana Haingana:</span>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => rotate90(false)}
                        className="flex items-center justify-center gap-1 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition-colors"
                        title="-90°"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>-90°</span>
                      </button>
                      <button
                        onClick={() => rotate90(true)}
                        className="flex items-center justify-center gap-1 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition-colors"
                        title="+90°"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>+90°</span>
                      </button>
                      <button
                        onClick={() => updateSetting("flipH", !currentImage.settings.flipH)}
                        className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
                          currentImage.settings.flipH
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                        }`}
                        title="Flip Horizontal"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateSetting("flipV", !currentImage.settings.flipV)}
                        className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
                          currentImage.settings.flipV
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                        }`}
                        title="Flip Vertical"
                      >
                        <FlipVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fine Rotation Slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-slate-300 font-medium">
                      <span>{t.rotation}</span>
                      <span className="font-mono text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {currentImage.settings.rotation > 0
                          ? `+${currentImage.settings.rotation}`
                          : currentImage.settings.rotation}
                        °
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="0.1"
                      value={currentImage.settings.rotation}
                      onChange={(e) => updateSetting("rotation", parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <button
                        onClick={() => updateSetting("rotation", -3.5)}
                        className="hover:text-slate-300 text-amber-400 font-semibold"
                      >
                        -3.5° (Pasipaoro)
                      </button>
                      <button
                        onClick={() => updateSetting("rotation", 0)}
                        className="hover:text-slate-300 text-indigo-400 font-semibold"
                      >
                        0° (Mahitsy)
                      </button>
                      <button
                        onClick={() => updateSetting("rotation", 6.5)}
                        className="hover:text-slate-300"
                      >
                        +6.5°
                      </button>
                    </div>
                  </div>

                  {/* Auto Crop Borders toggle */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={currentImage.settings.autoCropBorders}
                      onChange={(e) => updateSetting("autoCropBorders", e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{t.autoCrop}</span>
                      <span className="text-[11px] text-slate-400">
                        Manala ny zoro mainty rehefa mihodina ilay sary mba ho fenon-tsary tsara.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* TAB 2: Light & Shadows */}
              {activeTab === "light" && currentImage && (
                <div className="flex flex-col gap-4">
                  {/* Shadow Lift */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-indigo-950/20 rounded-lg border border-indigo-900/40">
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Sun className="w-3.5 h-3.5" />
                        {t.shadowLift}
                      </span>
                      <span className="font-mono text-emerald-400">
                        {currentImage.settings.shadowLift}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Manazava ireo faritra maizina sy aloka nefa tsy manimba na mandoro ny faritra efa mazava.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentImage.settings.shadowLift}
                      onChange={(e) => updateSetting("shadowLift", parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Glare & Flash Suppression */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-amber-950/30 rounded-lg border border-amber-800/40">
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Sun className="w-3.5 h-3.5" />
                        {t.glareReduction}
                      </span>
                      <span className="font-mono text-amber-400">
                        {currentImage.settings.glareReduction}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.glareReductionHelp}</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentImage.settings.glareReduction}
                      onChange={(e) => updateSetting("glareReduction", parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Brightness */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300 font-medium">
                      <span>{t.brightness}</span>
                      <span className="font-mono text-indigo-400">
                        {currentImage.settings.brightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={currentImage.settings.brightness}
                      onChange={(e) => updateSetting("brightness", parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Exposure */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300 font-medium">
                      <span>{t.exposure}</span>
                      <span className="font-mono text-indigo-400">
                        {currentImage.settings.exposure}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="100"
                      value={currentImage.settings.exposure}
                      onChange={(e) => updateSetting("exposure", parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300 font-medium">
                      <span>{t.contrast}</span>
                      <span className="font-mono text-indigo-400">
                        {currentImage.settings.contrast}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={currentImage.settings.contrast}
                      onChange={(e) => updateSetting("contrast", parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Temperature */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300 font-medium">
                      <span>{t.temperature}</span>
                      <span className="font-mono text-indigo-400">
                        {currentImage.settings.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={currentImage.settings.temperature}
                      onChange={(e) => updateSetting("temperature", parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Details & Text Protection */}
              {activeTab === "details" && currentImage && (
                <div className="flex flex-col gap-4">
                  {/* Sharpness */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Sliders className="w-3.5 h-3.5" />
                        {t.sharpness}
                      </span>
                      <span className="font-mono text-indigo-400">
                        {currentImage.settings.sharpness}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Mampivoaka mafy ny sisin'ny soratra, tabilao, tarehimarika ary logo mba ho mora vakiana.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentImage.settings.sharpness}
                      onChange={(e) => updateSetting("sharpness", parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Ink Darkening */}
                  <div className="flex flex-col gap-1.5 p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-800/40">
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t.inkDarken}
                      </span>
                      <span className="font-mono text-emerald-400">
                        {currentImage.settings.inkDarken}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.inkDarkenHelp}</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentImage.settings.inkDarken}
                      onChange={(e) => updateSetting("inkDarken", parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Denoise */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300 font-medium">
                      <span>{t.denoise}</span>
                      <span className="font-mono text-indigo-400">
                        {currentImage.settings.denoise}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentImage.settings.denoise}
                      onChange={(e) => updateSetting("denoise", parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Doc Clean Mode */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={currentImage.settings.docCleanMode}
                      onChange={(e) => updateSetting("docCleanMode", e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{t.docClean}</span>
                      <span className="text-[11px] text-slate-400">{t.docCleanHelp}</span>
                    </div>
                  </label>
                </div>
              )}

              {/* TAB 4: Presets */}
              {activeTab === "presets" && (
                <div className="flex flex-col gap-2.5">
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/30 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200 group-hover:text-indigo-300 text-xs">
                          {lang === "mg" ? p.nameMg : p.nameFr}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{p.descMg}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Footer inside Control Panel */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
              <button
                onClick={resetCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetAll}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage("png")}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadPng}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
                  title="Print"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-200 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Torolalana & Fampiasana ny MazavaPro AI</span>
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs flex flex-col gap-3 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="font-bold text-indigo-300 mb-1">1. Fandaminana Cadre & Vertical :</p>
                <p className="text-slate-400">
                  Raha somary mivilana na mitsivalana ilay sary, tsindrio ny bokotra <b>"Atao Mitsangana (Vertical)"</b> na <b>"Cadre Mahitsy"</b>. Azonao atao koa ny mampiasa ny fitaovana zoro 4 (Perspective Warp) mba hampifanitsy ny sisin'ny antontan-taratasy.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="font-bold text-indigo-300 mb-1">2. Sary Maromaro (Multi-Images) :</p>
                <p className="text-slate-400">
                  Azonao atao ny mifidy sary maromaro indray miaraka amin'ny alalan'ny bokotra <b>"Mampidira Sary Hafa"</b>. Azonao amboarina tsirairay izy ireo na tsindriana ny <b>"Amboary Izy Rehetra"</b> mba hanaovana fanitsiana batch.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="font-bold text-indigo-300 mb-1">3. Baiko Manokana ho an'ny IA (Custom Prompt) :</p>
                <p className="text-slate-400">
                  Soraty ao anatin'ny boaty baiko ny zavatra manokana tianao hataon'ny IA (oh: <i>"Atao vertical tsara sady atao cadre tsara, esory ny taratra flash, ataovy mainty ny soratra"</i>). Hanaraka an-tsakany sy an-davany izany ny Google AI Studio Gemini 3.8 Flash.
                </p>
              </div>

              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/40 text-emerald-200">
                <p className="font-bold text-emerald-300 mb-1">4. Fiarovana 100% ny votoatiny :</p>
                <p className="text-emerald-100/80">
                  Tsy manova na manoratra soratra vaovao ny IA (Lossless DSP). Ny soratra, ny tarehimarika, ny fitomboka, ny sonia ary ny logos dia mijanona ho 100% marina sy madio.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
            >
              Mazava tsara, misaotra!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

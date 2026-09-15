"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/hooks/i18n/useT";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowsClockwise,
  ArrowsCounterClockwise,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  DownloadSimple,
  X,
  ArrowsOutSimple,
} from "@/lib/ui/icons";

interface ImageLightboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

export function ImageLightboxModal({ open, onOpenChange, src, alt }: ImageLightboxModalProps) {
  const t = useT();
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset visual state when opening a new modal / image
  useEffect(() => {
    if (open) {
      setRotation(0);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [open, src]);

  const handleReset = useCallback(() => {
    setRotation(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation((prev) => (prev - 90) % 360);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          handleZoomOut();
          break;
        case "r":
        case "R":
          e.preventDefault();
          handleRotateRight();
          break;
        case "l":
        case "L":
          e.preventDefault();
          handleRotateLeft();
          break;
        case "0":
          e.preventDefault();
          handleReset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleZoomIn, handleZoomOut, handleRotateRight, handleRotateLeft, handleReset]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Dragging / panning when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download image helper
  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt.replace(/[^a-zA-Z0-9_-]/g, "_") || "imagem";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-screen h-screen border-none bg-black/95 p-0 shadow-none flex flex-col justify-between overflow-hidden backdrop-blur-md rounded-none focus:outline-none"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>

        {/* Top Control Bar */}
        <div className="relative z-50 flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 backdrop-blur-md">
          <span className="text-sm font-medium text-white/90 truncate max-w-md" title={alt}>
            {alt || t("Imagem")}
          </span>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Rotate Left */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRotateLeft}
              className="text-white hover:bg-white/20 h-9 w-9 rounded-full"
              title={t("Girar 90° à esquerda (L)")}
              aria-label={t("Girar 90° à esquerda")}
            >
              <ArrowsCounterClockwise size={20} />
            </Button>

            {/* Rotate Right */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRotateRight}
              className="text-white hover:bg-white/20 h-9 w-9 rounded-full"
              title={t("Girar 90° à direita (R)")}
              aria-label={t("Girar 90° à direita")}
            >
              <ArrowsClockwise size={20} />
            </Button>

            <div className="h-4 w-px bg-white/20 mx-1" />

            {/* Zoom Out */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="text-white hover:bg-white/20 h-9 w-9 rounded-full disabled:opacity-40"
              title={t("Diminuir zoom (-)")}
              aria-label={t("Diminuir zoom")}
            >
              <MagnifyingGlassMinus size={20} />
            </Button>

            {/* Zoom level indicator */}
            <span className="text-xs font-mono text-white/80 min-w-[3.5rem] text-center select-none">
              {Math.round(scale * 100)}%
            </span>

            {/* Zoom In */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="text-white hover:bg-white/20 h-9 w-9 rounded-full disabled:opacity-40"
              title={t("Aumentar zoom (+)")}
              aria-label={t("Aumentar zoom")}
            >
              <MagnifyingGlassPlus size={20} />
            </Button>

            {/* Reset */}
            {(scale !== 1 || rotation !== 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-white/90 hover:bg-white/20 px-2 h-8 rounded-md flex items-center gap-1"
                title={t("Resetar visão (0)")}
              >
                <ArrowsOutSimple size={16} />
                <span>{t("Resetar")}</span>
              </Button>
            )}

            <div className="h-4 w-px bg-white/20 mx-1" />

            {/* Download */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 h-9 w-9 rounded-full"
              title={t("Baixar imagem")}
              aria-label={t("Baixar imagem")}
            >
              <DownloadSimple size={20} />
            </Button>

            {/* Close */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-red-500/30 h-9 w-9 rounded-full ml-1"
              title={t("Fechar (Esc)")}
              aria-label={t("Fechar")}
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Image Display Container */}
        <div
          className="relative flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
        >
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              className={cn(
                "max-h-[85vh] max-w-[90vw] object-contain rounded-md shadow-2xl transition-all select-none pointer-events-auto",
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

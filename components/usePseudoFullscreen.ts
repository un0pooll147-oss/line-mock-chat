"use client";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

// Pixel 10 Pro: 1280 x 2856, 20:9-class display.
export const PIXEL_10_PRO_ASPECT_RATIO = "1280 / 2856";

// One layout contract for every mode, including restored settings.
export function mockStageStyle(enabled: boolean, viewportHeight: string | number): CSSProperties {
  const viewport = typeof viewportHeight === "number" ? `${viewportHeight}px` : viewportHeight;
  return {
    position: enabled ? "fixed" : "relative",
    inset: enabled ? 0 : undefined,
    width: "100%",
    maxWidth: enabled ? "none" : 448,
    height: viewport,
    minHeight: viewport,
    maxHeight: viewport,
    margin: "0 auto",
    borderRadius: 0,
    overflow: "hidden",
    boxShadow: "none",
    backgroundColor: enabled ? "#000" : undefined,
    // Android browsers can report zero for env(safe-area-inset-*).
    // Fixed Pixel-sized fallbacks keep controls clear of the centered camera
    // cutout, rounded corners, and bottom gesture navigation area.
    paddingTop: enabled ? "max(env(safe-area-inset-top), 32px)" : 0,
    paddingRight: enabled ? "max(env(safe-area-inset-right), 8px)" : 0,
    paddingBottom: enabled ? "max(env(safe-area-inset-bottom), 24px)" : 0,
    paddingLeft: enabled ? "max(env(safe-area-inset-left), 8px)" : 0,
  };
}

export function usePseudoFullscreen(enabled: boolean, onExit: () => void) {
  const exitRef = useRef(onExit);
  exitRef.current = onExit;
  useEffect(() => {
    if (!enabled) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") exitRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [enabled]);
}

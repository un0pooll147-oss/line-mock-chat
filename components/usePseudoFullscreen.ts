"use client";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

// One layout contract for every mode, including restored settings.
export function mockStageStyle(enabled: boolean, viewportHeight: string | number): CSSProperties {
  const viewport = typeof viewportHeight === "number" ? `${viewportHeight}px` : viewportHeight;
  const height = enabled ? viewport : `min(860px, calc(${viewport} - 32px))`;
  return {
    position: enabled ? "fixed" : "relative",
    inset: enabled ? 0 : undefined,
    width: enabled ? "100%" : "calc(100% - 32px)",
    maxWidth: enabled ? "none" : 448,
    height, minHeight: height, maxHeight: height,
    margin: enabled ? 0 : "16px auto",
    borderRadius: enabled ? 0 : 20,
    overflow: "hidden",
    boxShadow: enabled ? "none" : "0 6px 28px rgba(0,0,0,0.18)",
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

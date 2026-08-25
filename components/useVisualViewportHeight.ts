"use client";

import { useEffect, useState } from "react";

export function useVisualViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState<string>("100dvh");

  useEffect(() => {
    let animationFrame = 0;

    const updateViewportHeight = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const nextHeight = Math.round(window.visualViewport?.height || window.innerHeight || 0);
        if (nextHeight > 0) setViewportHeight(`${nextHeight}px`);
      });
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);
    document.addEventListener("fullscreenchange", updateViewportHeight);
    document.addEventListener("webkitfullscreenchange", updateViewportHeight);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
      document.removeEventListener("fullscreenchange", updateViewportHeight);
      document.removeEventListener("webkitfullscreenchange", updateViewportHeight);
    };
  }, []);

  return viewportHeight;
}

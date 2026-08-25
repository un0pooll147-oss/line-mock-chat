"use client";

import { useCallback, useEffect, useRef } from "react";

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function hasFullscreenElement() {
  if (typeof document === "undefined") return false;
  const webkitDocument = document as WebkitDocument;
  return Boolean(document.fullscreenElement || webkitDocument.webkitFullscreenElement);
}

export function useNativeFullscreen(onExit: () => void) {
  const onExitRef = useRef(onExit);
  const wasFullscreenRef = useRef(false);
  onExitRef.current = onExit;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = hasFullscreenElement();
      if (wasFullscreenRef.current && !isFullscreen) onExitRef.current();
      wasFullscreenRef.current = isFullscreen;
    };

    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  return useCallback(async (enabled: boolean) => {
    if (typeof document === "undefined") return false;

    const webkitDocument = document as WebkitDocument;
    const target = document.documentElement as WebkitElement;

    try {
      if (enabled) {
        if (hasFullscreenElement()) return true;

        if (target.requestFullscreen) {
          await target.requestFullscreen({ navigationUI: "hide" });
        } else if (target.webkitRequestFullscreen) {
          await Promise.resolve(target.webkitRequestFullscreen());
        } else {
          return false;
        }

        wasFullscreenRef.current = true;
        return true;
      }

      if (!hasFullscreenElement()) return true;

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (webkitDocument.webkitExitFullscreen) {
        await Promise.resolve(webkitDocument.webkitExitFullscreen());
      } else {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);
}

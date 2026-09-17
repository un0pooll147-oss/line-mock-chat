"use client";

import { useCallback, useEffect, useRef } from "react";

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitHTMLElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isNativeFullscreenActive() {
  const fullscreenDocument = document as WebkitDocument;
  return Boolean(document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement);
}

/**
 * Notification mode alone uses the browser Fullscreen API so Android Chrome's
 * status and navigation bars can be hidden for a lock-screen recording.
 */
export function useNotificationNativeFullscreen(onExit: () => void) {
  const onExitRef = useRef(onExit);
  const wasFullscreenRef = useRef(false);
  onExitRef.current = onExit;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = isNativeFullscreenActive();
      if (wasFullscreenRef.current && !active) onExitRef.current();
      wasFullscreenRef.current = active;
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      if (isNativeFullscreenActive()) {
        const fullscreenDocument = document as WebkitDocument;
        const exit = document.exitFullscreen?.bind(document) ?? fullscreenDocument.webkitExitFullscreen?.bind(fullscreenDocument);
        void Promise.resolve(exit?.()).catch(() => undefined);
      }
    };
  }, []);

  return useCallback(async (enabled: boolean) => {
    try {
      const fullscreenDocument = document as WebkitDocument;
      if (enabled) {
        if (isNativeFullscreenActive()) {
          wasFullscreenRef.current = true;
          return true;
        }

        const target = document.documentElement as WebkitHTMLElement;
        if (target.requestFullscreen) {
          await target.requestFullscreen({ navigationUI: "hide" });
        } else if (target.webkitRequestFullscreen) {
          await target.webkitRequestFullscreen();
        } else {
          return false;
        }
        wasFullscreenRef.current = true;
        return true;
      }

      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (fullscreenDocument.webkitFullscreenElement && fullscreenDocument.webkitExitFullscreen) {
        await fullscreenDocument.webkitExitFullscreen();
      }
      wasFullscreenRef.current = false;
      return true;
    } catch {
      return false;
    }
  }, []);
}

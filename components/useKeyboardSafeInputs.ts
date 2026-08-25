"use client";

import { useEffect, useRef } from "react";

const EDITABLE_SELECTOR = [
  "input:not([type='file']):not([type='range']):not([type='checkbox']):not([type='radio'])",
  "textarea",
  "select",
  "[contenteditable='true']",
].join(",");

export function useKeyboardSafeInputs() {
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    const revealFocusedInput = () => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement) || !activeElement.matches(EDITABLE_SELECTOR)) return;

      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
      const rect = activeElement.getBoundingClientRect();
      const safeGap = 20;

      if (rect.top < viewportTop + safeGap || rect.bottom > viewportBottom - safeGap) {
        activeElement.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      }
    };

    const scheduleReveal = () => {
      clearTimers();
      window.requestAnimationFrame(revealFocusedInput);
      timersRef.current = [120, 280, 480].map((delay) => window.setTimeout(revealFocusedInput, delay));
    };

    document.addEventListener("focusin", scheduleReveal);
    window.visualViewport?.addEventListener("resize", scheduleReveal);
    window.visualViewport?.addEventListener("scroll", scheduleReveal);
    window.addEventListener("resize", scheduleReveal);

    return () => {
      clearTimers();
      document.removeEventListener("focusin", scheduleReveal);
      window.visualViewport?.removeEventListener("resize", scheduleReveal);
      window.visualViewport?.removeEventListener("scroll", scheduleReveal);
      window.removeEventListener("resize", scheduleReveal);
    };
  }, []);
}

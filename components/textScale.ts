import type { CSSProperties } from "react";

// 各モック画面の「文字サイズ」設定。
// 画面ルートに MOCK_TEXT_SCALE_CLASS を付け、--mock-ts に倍率を渡すと
// globals.css 側のルールで画面内の文字と行高だけが同じ比率で伸縮する。
// 設定パネルには効かないよう、必ずプレビュー側のツリーにだけクラスを付けること。

export const MIN_TEXT_SCALE = 80;
export const MAX_TEXT_SCALE = 160;
export const DEFAULT_TEXT_SCALE = 100;
export const MOCK_TEXT_SCALE_CLASS = "mock-text-scale";

export function clampTextScale(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return DEFAULT_TEXT_SCALE;
  return Math.max(MIN_TEXT_SCALE, Math.min(MAX_TEXT_SCALE, Math.round(num)));
}

export function textScaleStyle(value: unknown): CSSProperties {
  return { "--mock-ts": String(clampTextScale(value) / 100) } as CSSProperties;
}

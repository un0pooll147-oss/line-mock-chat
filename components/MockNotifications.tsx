"use client";

import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";

// Instagram / X / TikTok / チャットなど、通知モード以外の画面でも
// メッセージ通知バナーを割り込ませるための共通モジュール。
// 設定はモードをまたいで1つだけ持つ（一度決めればどの画面でも同じ通知が降ってくる）。

const STORAGE_KEY = "mock-notification-banner-settings-v1";

export type MockNotificationItem = {
  id: string;
  appName: string;
  groupName: string;
  sender: string;
  text: string;
  time: string;
  iconText: string;
  iconImage: string | null;
  delaySeconds: number;
};

export type MockNotificationConfig = {
  showStartButton: boolean;
  osType: "iphone" | "android";
  direction: "top" | "bottom";
  topOffset: number;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  autoHideSeconds: number;
  textScale: number;
  textColor: string;
  items: MockNotificationItem[];
};

export const MIN_NOTIFICATION_TEXT_SCALE = 80;
export const MAX_NOTIFICATION_TEXT_SCALE = 180;

// 100% のときのバナー各要素の基準サイズ(px)。
// 倍率を変えても崩れないよう、文字・アイコン・余白をすべてここから算出する。
const baseSizes = {
  appFont: 12,
  groupFont: 14,
  senderFont: 13,
  bodyFont: 14,
  timeFont: 11,
  iconFont: 14,
  iconSize: 40,
  cardPaddingX: 16,
  cardPaddingY: 12,
  rowGap: 12,
  lineGap: 2,
  stackGap: 12,
};

function clampTextScale(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 100;
  return Math.max(MIN_NOTIFICATION_TEXT_SCALE, Math.min(MAX_NOTIFICATION_TEXT_SCALE, Math.round(num)));
}

// 文字色は1色だけ選んでもらい、要素ごとの濃淡は不透明度で作る。
function toRgba(color: string, alpha: number) {
  const hex = (color || "#ffffff").trim();
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    const value = hex.slice(1);
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  return hex;
}

const createItem = (): MockNotificationItem => ({
  id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  appName: "LINE",
  groupName: "森田家",
  sender: "美咲",
  text: "今どこにいる？",
  time: "今",
  iconText: "美",
  iconImage: null,
  delaySeconds: 3,
});

export const defaultMockNotificationConfig: MockNotificationConfig = {
  showStartButton: false,
  osType: "iphone",
  direction: "top",
  topOffset: 56,
  soundEnabled: true,
  vibrateEnabled: false,
  autoHideSeconds: 0,
  textScale: 100,
  textColor: "#ffffff",
  items: [
    {
      id: "notif-default-1",
      appName: "LINE",
      groupName: "森田家",
      sender: "美咲",
      text: "今どこにいる？",
      time: "今",
      iconText: "美",
      iconImage: null,
      delaySeconds: 3,
    },
  ],
};

function normalizeItem(value: any, index: number): MockNotificationItem {
  return {
    id: typeof value?.id === "string" ? value.id : `notif-${index}`,
    appName: String(value?.appName ?? "LINE"),
    groupName: String(value?.groupName ?? ""),
    sender: String(value?.sender ?? ""),
    text: String(value?.text ?? ""),
    time: String(value?.time ?? "今"),
    iconText: String(value?.iconText ?? "美"),
    iconImage: typeof value?.iconImage === "string" ? value.iconImage : null,
    delaySeconds: Number.isFinite(Number(value?.delaySeconds)) ? Number(value.delaySeconds) : 0,
  };
}

function readStoredConfig(): MockNotificationConfig {
  if (typeof window === "undefined") return defaultMockNotificationConfig;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMockNotificationConfig;
    const parsed = JSON.parse(raw) as Partial<MockNotificationConfig>;
    const items = Array.isArray(parsed.items) ? parsed.items.map(normalizeItem) : defaultMockNotificationConfig.items;
    return {
      ...defaultMockNotificationConfig,
      ...parsed,
      osType: parsed.osType === "android" ? "android" : "iphone",
      direction: parsed.direction === "bottom" ? "bottom" : "top",
      topOffset: Number.isFinite(Number(parsed.topOffset)) ? Number(parsed.topOffset) : defaultMockNotificationConfig.topOffset,
      autoHideSeconds: Number.isFinite(Number(parsed.autoHideSeconds)) ? Number(parsed.autoHideSeconds) : 0,
      textScale: clampTextScale(parsed.textScale),
      textColor: typeof parsed.textColor === "string" ? parsed.textColor : defaultMockNotificationConfig.textColor,
      items: items.length > 0 ? items : defaultMockNotificationConfig.items,
    };
  } catch {
    return defaultMockNotificationConfig;
  }
}

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file-read-failed"));
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) resolve(reader.result);
      else reject(new Error("file-read-failed"));
    };
    reader.readAsDataURL(file);
  });
}

// 端末の写真をそのまま保存すると localStorage の上限を超えるため、読み込み時に縮小する。
async function readIconFile(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  if (file.type === "image/gif") return original;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onerror = () => resolve(original);
    img.onload = () => {
      try {
        const scale = Math.min(1, 320 / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(original);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const encoded = canvas.toDataURL("image/jpeg", 0.82);
        resolve(encoded.length < original.length ? encoded : original);
      } catch {
        resolve(original);
      }
    };
    img.src = original;
  });
}

export function useMockNotifications({ settingsOpen }: { settingsOpen: boolean }) {
  const [config, setConfigState] = useState<MockNotificationConfig>(defaultMockNotificationConfig);
  const [hydrated, setHydrated] = useState(false);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [armed, setArmed] = useState(true);

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setConfigState(readStoredConfig());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // アイコン画像で容量を超えたときは、画像を外して保存する。
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...config, items: config.items.map((item) => ({ ...item, iconImage: null })) }),
        );
      } catch {
        // 保存できなくても撮影は続けられるようにする。
      }
    }
  }, [config, hydrated]);

  // 設定を開き直したら、次のテイクに備えて開始ボタンとバナーを初期状態に戻す。
  useEffect(() => {
    if (!settingsOpen) return;
    setArmed(true);
    setShownIds([]);
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, [settingsOpen]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playChime = useCallback(() => {
    if (!config.soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      void ctx.resume?.();
      const tone = (frequency: number, delay: number, duration: number) => {
        window.setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = frequency;
          gain.gain.value = 0.05;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          window.setTimeout(() => osc.stop(), duration);
        }, delay);
      };
      tone(1046, 0, 150);
      tone(1318, 150, 190);
    } catch {
      // 音が出せない環境でも表示は続ける。
    }
  }, [config.soundEnabled]);

  const start = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
    setArmed(false);
    setShownIds([]);

    config.items
      .filter((item) => item.text.trim() || item.sender.trim())
      .forEach((item) => {
        const showAt = Math.max(0, Number(item.delaySeconds) || 0) * 1000;
        timersRef.current.push(
          setTimeout(() => {
            setShownIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
            playChime();
            if (config.vibrateEnabled && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(60);
            const hideAfter = Math.max(0, Number(config.autoHideSeconds) || 0);
            if (hideAfter > 0) {
              timersRef.current.push(
                setTimeout(() => setShownIds((prev) => prev.filter((id) => id !== item.id)), hideAfter * 1000),
              );
            }
          }, showAt),
        );
      });
  }, [config, playChime]);

  const reset = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
    setShownIds([]);
    setArmed(true);
  }, []);

  const setConfig = <K extends keyof MockNotificationConfig>(key: K, value: MockNotificationConfig[K]) =>
    setConfigState((prev) => ({ ...prev, [key]: value }));

  const updateItem = <K extends keyof MockNotificationItem>(id: string, key: K, value: MockNotificationItem[K]) =>
    setConfigState((prev) => ({ ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, [key]: value } : item)) }));

  const addItem = () => setConfigState((prev) => ({ ...prev, items: [...prev.items, createItem()] }));

  const removeItem = (id: string) =>
    setConfigState((prev) => ({ ...prev, items: prev.items.length <= 1 ? prev.items : prev.items.filter((item) => item.id !== id) }));

  const visibleItems = config.items.filter((item) => shownIds.includes(item.id));
  const active = visibleItems.length > 0;

  const overlay = active ? <MockNotificationStack config={config} items={visibleItems} /> : null;

  const startButton =
    config.showStartButton && armed ? (
      <button
        type="button"
        onClick={start}
        className="absolute bottom-[max(20px,calc(env(safe-area-inset-bottom)+12px))] left-1/2 z-[65] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-black/60 px-6 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition hover:bg-black/70 active:scale-95"
        aria-label="通知を開始"
      >
        <Bell className="h-5 w-5" />
        通知を開始
      </button>
    ) : null;

  const settingsSection = (
    <MockNotificationSettings
      config={config}
      setConfig={setConfig}
      updateItem={updateItem}
      addItem={addItem}
      removeItem={removeItem}
      onTest={start}
      onReset={reset}
    />
  );

  return { config, setConfig, start, reset, active, armed, overlay, startButton, settingsSection };
}

function MockNotificationStack({ config, items }: { config: MockNotificationConfig; items: MockNotificationItem[] }) {
  const isIphone = config.osType === "iphone";
  const cardClass = isIphone ? "border border-white/20 shadow-lg" : "border border-white/10 shadow-lg";
  const iconClass = isIphone
    ? "border border-white/40 text-black/80 shadow-sm"
    : "border border-black/5 text-zinc-800 shadow-sm";
  const cardBg = isIphone ? "rgba(255,255,255,0.18)" : "rgba(30,30,30,0.52)";
  const iconBg = isIphone ? "rgba(255,255,255,0.78)" : "rgba(240,240,240,0.92)";

  // 文字だけ大きくすると余白が詰まるので、アイコンと余白も同じ倍率で動かす。
  const scale = clampTextScale(config.textScale) / 100;
  const px = (base: number) => `${Math.round(base * scale * 100) / 100}px`;
  const color = (alpha: number) => toRgba(config.textColor, alpha);

  return (
    <div
      className={cls(
        "pointer-events-none absolute inset-x-0 z-[70] flex flex-col px-4",
        config.direction === "bottom" ? "bottom-0 flex-col-reverse pb-[max(28px,calc(env(safe-area-inset-bottom)+28px))]" : "top-0",
      )}
      style={{
        gap: px(baseSizes.stackGap),
        ...(config.direction === "top" ? { paddingTop: `${Math.max(0, Number(config.topOffset) || 0)}px` } : null),
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cls(
            "backdrop-blur-md",
            cardClass,
            config.direction === "bottom" ? "notification-enter-bottom" : "notification-enter-top",
          )}
          style={{
            backgroundColor: cardBg,
            padding: `${px(baseSizes.cardPaddingY)} ${px(baseSizes.cardPaddingX)}`,
            borderRadius: px(isIphone ? 22 : 18),
          }}
        >
          <div className="flex items-start" style={{ gap: px(baseSizes.rowGap) }}>
            <div
              className={cls("flex shrink-0 items-center justify-center overflow-hidden font-semibold", iconClass)}
              style={{
                backgroundColor: iconBg,
                height: px(baseSizes.iconSize),
                width: px(baseSizes.iconSize),
                fontSize: px(baseSizes.iconFont),
                borderRadius: isIphone ? px(12) : "9999px",
              }}
            >
              {item.iconImage ? (
                <img src={item.iconImage} alt="icon" className="h-full w-full object-cover" />
              ) : (
                <span>{item.iconText || "通"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate font-medium" style={{ fontSize: px(baseSizes.appFont), color: color(0.7) }}>{item.appName}</div>
                <div className="shrink-0" style={{ fontSize: px(baseSizes.timeFont), color: color(0.55) }}>{item.time}</div>
              </div>
              {item.groupName ? (
                <div className="truncate font-semibold" style={{ marginTop: px(baseSizes.lineGap), fontSize: px(baseSizes.groupFont), color: color(1) }}>{item.groupName}</div>
              ) : null}
              {item.sender ? (
                <div className="truncate" style={{ marginTop: px(baseSizes.lineGap), fontSize: px(baseSizes.senderFont), color: color(0.75) }}>{item.sender}</div>
              ) : null}
              <div className="break-words leading-snug" style={{ marginTop: px(baseSizes.lineGap), fontSize: px(baseSizes.bodyFont), color: color(0.95) }}>{item.text}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockNotificationSettings({
  config,
  setConfig,
  updateItem,
  addItem,
  removeItem,
  onTest,
  onReset,
}: {
  config: MockNotificationConfig;
  setConfig: <K extends keyof MockNotificationConfig>(key: K, value: MockNotificationConfig[K]) => void;
  updateItem: <K extends keyof MockNotificationItem>(id: string, key: K, value: MockNotificationItem[K]) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  onTest: () => void;
  onReset: () => void;
}) {
  const fieldClass = "w-full min-w-0 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none";
  const labelClass = "text-sm font-semibold text-black/70";
  const noteClass = "text-xs text-black/50";

  const handleIcon = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      updateItem(id, "iconImage", await readIconFile(file));
    } catch {
      // 読み込めない画像は無視して、文字アイコンのままにする。
    }
  };

  const toggle = (value: boolean, onChange: () => void, label: string) => (
    <button
      type="button"
      onClick={onChange}
      className={cls("relative h-6 w-11 shrink-0 rounded-full transition", value ? "bg-emerald-500" : "bg-black/20")}
      aria-label={label}
      aria-pressed={value}
    >
      <span className={cls("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", value ? "left-[22px]" : "left-0.5")} />
    </button>
  );

  return (
    <div className="space-y-3 text-black">
      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-xs leading-relaxed text-black/60">
        この画面を操作している最中に、メッセージ通知バナーを降らせられます。設定は全モード共通なので、
        一度作っておけばどの画面でも同じ通知が使えます。
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3">
        <div>
          <div className="text-sm font-medium">画面内に通知開始ボタンを出す</div>
          <div className={noteClass}>押すとボタンが消え、各通知の秒数どおりに表示されます</div>
        </div>
        {toggle(config.showStartButton, () => setConfig("showStartButton", !config.showStartButton), "通知開始ボタン")}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["iphone", "android"] as const).map((os) => (
          <button
            key={os}
            type="button"
            onClick={() => setConfig("osType", os)}
            className={cls(
              "rounded-2xl px-3 py-2 text-sm font-medium transition",
              config.osType === os ? "bg-black text-white" : "border border-black/10 bg-white text-black",
            )}
          >
            {os === "iphone" ? "iPhone風" : "Android風"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["top", "bottom"] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => setConfig("direction", dir)}
            className={cls(
              "rounded-2xl px-3 py-2 text-sm font-medium transition",
              config.direction === dir ? "bg-black text-white" : "border border-black/10 bg-white text-black",
            )}
          >
            {dir === "top" ? "上から表示" : "下から表示"}
          </button>
        ))}
      </div>

      {config.direction === "top" && (
        <label className="grid min-w-0 gap-1.5">
          <span className={labelClass}>上からの位置 {Math.max(0, Number(config.topOffset) || 0)}px</span>
          <input type="range" min="0" max="200" step="2" value={config.topOffset} onChange={(e) => setConfig("topOffset", Number(e.target.value))} className="w-full cursor-pointer" />
          <span className={noteClass}>ステータスバーやヘッダーに重ならない高さに合わせてください</span>
        </label>
      )}

      <label className="grid min-w-0 gap-1.5">
        <span className={labelClass}>文字サイズ {clampTextScale(config.textScale)}%</span>
        <input
          type="range"
          min={MIN_NOTIFICATION_TEXT_SCALE}
          max={MAX_NOTIFICATION_TEXT_SCALE}
          step={5}
          value={clampTextScale(config.textScale)}
          onChange={(e) => setConfig("textScale", Number(e.target.value))}
          className="w-full cursor-pointer"
        />
        <span className={noteClass}>文字に合わせてアイコン・余白・角丸もまとめて拡大するので、レイアウトは崩れません</span>
      </label>

      <div className="space-y-1.5">
        <div className={labelClass}>文字色</div>
        <div className="flex items-center gap-2">
          <input type="color" value={config.textColor} onChange={(e) => setConfig("textColor", e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-black/10 bg-transparent p-0" />
          <input value={config.textColor} onChange={(e) => setConfig("textColor", e.target.value)} className={fieldClass} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "白", value: "#ffffff" },
            { label: "黒", value: "#111111" },
            { label: "グレー", value: "#8e8e93" },
            { label: "青", value: "#0a84ff" },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setConfig("textColor", preset.value)}
              className={cls(
                "rounded-full border px-3 py-1.5 text-xs transition",
                config.textColor.toLowerCase() === preset.value ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/70",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className={noteClass}>アプリ名や時刻は、選んだ色を薄くして表示します</div>
      </div>

      <label className="grid min-w-0 gap-1.5">
        <span className={labelClass}>自動で消えるまでの秒数</span>
        <input type="number" min="0" step="0.5" value={config.autoHideSeconds} onChange={(e) => setConfig("autoHideSeconds", Number(e.target.value))} className={fieldClass} />
        <span className={noteClass}>0 にすると出したままになります</span>
      </label>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3">
        <div>
          <div className="text-sm font-medium">通知音</div>
          <div className={noteClass}>表示された瞬間に鳴らします</div>
        </div>
        {toggle(config.soundEnabled, () => setConfig("soundEnabled", !config.soundEnabled), "通知音")}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3">
        <div>
          <div className="text-sm font-medium">バイブ</div>
          <div className={noteClass}>対応端末のみ振動します</div>
        </div>
        {toggle(config.vibrateEnabled, () => setConfig("vibrateEnabled", !config.vibrateEnabled), "バイブ")}
      </div>

      {config.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-2xl border border-black/10 bg-black/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-black/70">通知 {index + 1}</div>
            {config.items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-black/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                削除
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid min-w-0 gap-1.5">
              <span className={labelClass}>アプリ名</span>
              <input value={item.appName} onChange={(e) => updateItem(item.id, "appName", e.target.value)} className={fieldClass} />
            </label>
            <label className="grid min-w-0 gap-1.5">
              <span className={labelClass}>表示までの秒数</span>
              <input type="number" min="0" step="0.1" value={item.delaySeconds} onChange={(e) => updateItem(item.id, "delaySeconds", Number(e.target.value))} className={fieldClass} />
            </label>
          </div>
          <label className="grid min-w-0 gap-1.5">
            <span className={labelClass}>グループ名</span>
            <input value={item.groupName} onChange={(e) => updateItem(item.id, "groupName", e.target.value)} placeholder="森田家" className={fieldClass} />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <span className={labelClass}>送信者名</span>
            <input value={item.sender} onChange={(e) => updateItem(item.id, "sender", e.target.value)} placeholder="美咲" className={fieldClass} />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <span className={labelClass}>本文</span>
            <textarea value={item.text} onChange={(e) => updateItem(item.id, "text", e.target.value)} className={cls(fieldClass, "min-h-[72px] resize-none")} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid min-w-0 gap-1.5">
              <span className={labelClass}>時刻表示</span>
              <input value={item.time} onChange={(e) => updateItem(item.id, "time", e.target.value)} placeholder="今" className={fieldClass} />
            </label>
            <label className="grid min-w-0 gap-1.5">
              <span className={labelClass}>文字アイコン</span>
              <input value={item.iconText} onChange={(e) => updateItem(item.id, "iconText", e.target.value.slice(0, 2))} className={fieldClass} />
            </label>
          </div>
          <div className="space-y-2">
            <div className={labelClass}>アイコン画像</div>
            <input type="file" accept="image/*" onChange={(e) => handleIcon(item.id, e)} className="w-full min-w-0 text-xs" />
            {item.iconImage ? (
              <div className="flex items-center gap-2">
                <img src={item.iconImage} alt="通知アイコン" className="h-12 w-12 rounded-xl border border-black/10 object-cover" />
                <button type="button" onClick={() => updateItem(item.id, "iconImage", null)} className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs">解除</button>
              </div>
            ) : (
              <div className={noteClass}>未設定なら文字アイコンを使います</div>
            )}
          </div>
        </div>
      ))}

      <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-medium">
        <Plus className="h-4 w-4" />
        通知を追加
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onTest} className="rounded-2xl bg-black px-3 py-2 text-sm font-medium text-white">この設定でテスト</button>
        <button type="button" onClick={onReset} className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-medium">表示をリセット</button>
      </div>
    </div>
  );
}

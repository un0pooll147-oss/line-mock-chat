"use client";

import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

// Instagram / X / TikTok など「本来は通話機能がない画面」でも、
// 撮影中に着信を割り込ませるための共通モジュール。
// 設定はモードをまたいで1つだけ持つ（一度決めればどの画面でも同じ着信が使える）。

const STORAGE_KEY = "mock-incoming-call-settings-v1";

export type IncomingCallToneType = "iphone" | "line" | "custom";
export type IncomingCallPhase = "idle" | "incoming" | "connecting" | "connected";

export type IncomingCallConfig = {
  showStartButton: boolean;
  mode: "voice" | "video";
  delaySeconds: number;
  connectSeconds: number;
  title: string;
  avatarLabel: string;
  avatarImage: string | null;
  bgColor: string;
  bgOpacity: number;
  toneEnabled: boolean;
  toneType: IncomingCallToneType;
  customToneName: string;
  customToneUrl: string | null;
  appLabel: string;
};

export const defaultIncomingCallConfig: IncomingCallConfig = {
  showStartButton: false,
  mode: "voice",
  delaySeconds: 5,
  connectSeconds: 1.5,
  title: "美咲",
  avatarLabel: "美",
  avatarImage: null,
  bgColor: "#000000",
  bgOpacity: 1,
  toneEnabled: true,
  toneType: "iphone",
  customToneName: "",
  customToneUrl: null,
  appLabel: "音声通話",
};

function readStoredConfig(): IncomingCallConfig {
  if (typeof window === "undefined") return defaultIncomingCallConfig;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultIncomingCallConfig;
    const parsed = JSON.parse(raw) as Partial<IncomingCallConfig>;
    return {
      ...defaultIncomingCallConfig,
      ...parsed,
      mode: parsed.mode === "video" ? "video" : "voice",
      toneType: parsed.toneType === "line" || parsed.toneType === "custom" ? parsed.toneType : "iphone",
      delaySeconds: Number.isFinite(Number(parsed.delaySeconds)) ? Number(parsed.delaySeconds) : defaultIncomingCallConfig.delaySeconds,
      connectSeconds: Number.isFinite(Number(parsed.connectSeconds)) ? Number(parsed.connectSeconds) : defaultIncomingCallConfig.connectSeconds,
      bgOpacity: Number.isFinite(Number(parsed.bgOpacity)) ? Number(parsed.bgOpacity) : defaultIncomingCallConfig.bgOpacity,
    };
  } catch {
    return defaultIncomingCallConfig;
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
async function readAvatarFile(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  if (file.type === "image/gif") return original;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onerror = () => resolve(original);
    img.onload = () => {
      try {
        const scale = Math.min(1, 640 / Math.max(img.width, img.height));
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

export function useIncomingCall({ settingsOpen }: { settingsOpen: boolean }) {
  const [config, setConfigState] = useState<IncomingCallConfig>(defaultIncomingCallConfig);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<IncomingCallPhase>("idle");
  const [armed, setArmed] = useState(true);

  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toneIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setConfigState(readStoredConfig());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // 画像や音源で容量を超えたときは、重いデータを外して保存する。
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, avatarImage: null, customToneUrl: null }));
      } catch {
        // 保存できなくても撮影は続けられるようにする。
      }
    }
  }, [config, hydrated]);

  // 設定を開き直したら、次のテイクに備えて開始ボタンを出し直す。
  useEffect(() => {
    if (settingsOpen) setArmed(true);
  }, [settingsOpen]);

  const stopTone = useCallback(() => {
    if (toneIntervalRef.current !== null) {
      window.clearInterval(toneIntervalRef.current);
      toneIntervalRef.current = null;
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      stopTone();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [clearTimers, stopTone]);

  const playTone = (frequency: number, duration: number) => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      void ctx.resume?.();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      window.setTimeout(() => osc.stop(), duration);
    } catch {
      // 音が出せない環境でも画面演出は続ける。
    }
  };

  const startTone = () => {
    if (!config.toneEnabled) return;
    stopTone();
    if (config.toneType === "custom" && config.customToneUrl) {
      try {
        if (!customAudioRef.current) customAudioRef.current = new Audio(config.customToneUrl);
        else customAudioRef.current.src = config.customToneUrl;
        customAudioRef.current.loop = true;
        customAudioRef.current.currentTime = 0;
        customAudioRef.current.play().catch(() => {});
      } catch {
        // 再生できないときは無音のまま続ける。
      }
      return;
    }
    const runPattern = () => {
      if (config.toneType === "line") {
        playTone(784, 120);
        window.setTimeout(() => playTone(988, 120), 160);
        window.setTimeout(() => playTone(1174, 180), 320);
        return;
      }
      playTone(1046, 160);
      window.setTimeout(() => playTone(1318, 180), 180);
    };
    runPattern();
    toneIntervalRef.current = window.setInterval(runPattern, config.toneType === "line" ? 1500 : 1800);
  };

  const start = useCallback(() => {
    clearTimers();
    setArmed(false);
    const delay = Math.max(0, Number(config.delaySeconds) || 0);
    const boot = () => {
      setPhase("incoming");
      startTone();
    };
    if (delay > 0) startTimerRef.current = setTimeout(boot, delay * 1000);
    else boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers, config]);

  const accept = () => {
    clearTimers();
    stopTone();
    setPhase("connecting");
    connectTimerRef.current = setTimeout(() => setPhase("connected"), Math.max(0, Number(config.connectSeconds) || 0) * 1000);
  };

  const end = () => {
    clearTimers();
    stopTone();
    setPhase("idle");
  };

  const setConfig = <K extends keyof IncomingCallConfig>(key: K, value: IncomingCallConfig[K]) =>
    setConfigState((prev) => ({ ...prev, [key]: value }));

  const active = phase !== "idle";

  const overlay = active ? (
    <IncomingCallOverlay config={config} phase={phase} onAccept={accept} onDecline={end} onEnd={end} />
  ) : null;

  const startButton =
    config.showStartButton && armed && !active ? (
      <button
        type="button"
        onClick={start}
        className="absolute bottom-[max(72px,calc(env(safe-area-inset-bottom)+64px))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-black/60 px-6 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition hover:bg-black/70 active:scale-95"
        aria-label="着信を開始"
      >
        {config.mode === "video" ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        着信を開始
        {Math.max(0, Number(config.delaySeconds) || 0) > 0 ? `（${Math.max(0, Number(config.delaySeconds) || 0)}秒後）` : ""}
      </button>
    ) : null;

  const settingsSection = <IncomingCallSettings config={config} setConfig={setConfig} onTest={start} />;

  return { config, setConfig, phase, active, armed, start, accept, end, overlay, startButton, settingsSection };
}

function IncomingCallOverlay({
  config,
  phase,
  onAccept,
  onDecline,
  onEnd,
}: {
  config: IncomingCallConfig;
  phase: IncomingCallPhase;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}) {
  const isIncoming = phase === "incoming";
  const statusText =
    phase === "incoming"
      ? config.mode === "video" ? "ビデオ通話の着信" : "音声通話の着信"
      : phase === "connecting"
        ? "接続中..."
        : "通話中";

  return (
    <div
      className="absolute inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden px-6 text-white"
      style={{ backgroundColor: config.bgColor, opacity: config.bgOpacity, touchAction: "none" }}
    >
      <div className="mb-6">
        {config.avatarImage ? (
          <img src={config.avatarImage} alt="avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-white/20" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-3xl font-semibold ring-4 ring-white/10">
            {config.avatarLabel || "着"}
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold">{config.title || "着信"}</div>
      <div className="mt-2 text-sm text-white/70">{config.appLabel || statusText}</div>
      <div className="mt-1 text-sm text-white/50">{statusText}</div>

      <div className={cls("mt-12 flex w-full max-w-xs items-center", isIncoming ? "justify-between" : "justify-center")}>
        {isIncoming ? (
          <>
            <button
              type="button"
              onClick={onDecline}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95"
              aria-label="拒否"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg active:scale-95"
              aria-label="応答"
            >
              {config.mode === "video" ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onEnd}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95"
            aria-label="通話終了"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
        )}
      </div>
    </div>
  );
}

function IncomingCallSettings({
  config,
  setConfig,
  onTest,
}: {
  config: IncomingCallConfig;
  setConfig: <K extends keyof IncomingCallConfig>(key: K, value: IncomingCallConfig[K]) => void;
  onTest: () => void;
}) {
  const fieldClass = "w-full min-w-0 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none";
  const labelClass = "text-sm font-semibold text-black/70";
  const noteClass = "text-xs text-black/50";

  const handleAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setConfig("avatarImage", await readAvatarFile(file));
    } catch {
      // 読み込めない画像は無視して、文字アイコンのままにする。
    }
  };

  const handleTone = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setConfig("customToneUrl", await readFileAsDataUrl(file));
      setConfig("customToneName", file.name);
      setConfig("toneType", "custom");
    } catch {
      // 読み込めない音源は無視する。
    }
  };

  return (
    <div className="space-y-3 text-black">
      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-xs leading-relaxed text-black/60">
        この画面を操作している最中に着信を割り込ませられます。設定は全モード共通なので、
        一度決めればチャット以外のどの画面でも同じ相手から着信します。
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3">
        <div>
          <div className="text-sm font-medium">画面内に着信開始ボタンを出す</div>
          <div className={noteClass}>押すとボタンが消え、指定秒数後に着信します</div>
        </div>
        <button
          type="button"
          onClick={() => setConfig("showStartButton", !config.showStartButton)}
          className={cls(
            "relative h-6 w-11 shrink-0 rounded-full transition",
            config.showStartButton ? "bg-emerald-500" : "bg-black/20",
          )}
          aria-label="着信開始ボタン"
          aria-pressed={config.showStartButton}
        >
          <span
            className={cls(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
              config.showStartButton ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
      </div>

      <div className="space-y-1.5">
        <div className={labelClass}>通話の種類</div>
        <div className="grid grid-cols-2 gap-2">
          {(["voice", "video"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setConfig("mode", mode)}
              className={cls(
                "rounded-2xl px-3 py-2 text-sm font-medium transition",
                config.mode === mode ? "bg-black text-white" : "border border-black/10 bg-white text-black",
              )}
            >
              {mode === "voice" ? "音声着信" : "ビデオ着信"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid min-w-0 gap-1.5">
          <span className={labelClass}>着信までの秒数</span>
          <input type="number" min="0" step="0.1" value={config.delaySeconds} onChange={(e) => setConfig("delaySeconds", Number(e.target.value))} className={fieldClass} />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className={labelClass}>通話中になるまでの秒数</span>
          <input type="number" min="0" step="0.1" value={config.connectSeconds} onChange={(e) => setConfig("connectSeconds", Number(e.target.value))} className={fieldClass} />
        </label>
      </div>

      <label className="grid min-w-0 gap-1.5">
        <span className={labelClass}>相手の名前</span>
        <input value={config.title} onChange={(e) => setConfig("title", e.target.value)} placeholder="美咲" className={fieldClass} />
      </label>

      <label className="grid min-w-0 gap-1.5">
        <span className={labelClass}>画面上部の表示</span>
        <input value={config.appLabel} onChange={(e) => setConfig("appLabel", e.target.value)} placeholder="音声通話" className={fieldClass} />
        <span className={noteClass}>「LINE 音声通話」「FaceTime」など、相手の名前の下に出す文言</span>
      </label>

      <label className="grid min-w-0 gap-1.5">
        <span className={labelClass}>相手のアイコン文字</span>
        <input value={config.avatarLabel} onChange={(e) => setConfig("avatarLabel", e.target.value.slice(0, 2))} placeholder="美" className={fieldClass} />
      </label>

      <div className="space-y-2">
        <div className={labelClass}>相手のアイコン画像</div>
        <input type="file" accept="image/*" onChange={handleAvatar} className="w-full min-w-0 text-xs" />
        {config.avatarImage ? (
          <div className="space-y-2">
            <img src={config.avatarImage} alt="着信アイコン" className="h-16 w-16 rounded-2xl border border-black/10 object-cover" />
            <button type="button" onClick={() => setConfig("avatarImage", null)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm">アイコン画像を解除</button>
          </div>
        ) : (
          <div className={noteClass}>未設定なら文字アイコンを使います</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid min-w-0 gap-1.5">
          <span className={labelClass}>着信画面 背景色</span>
          <input type="color" value={config.bgColor} onChange={(e) => setConfig("bgColor", e.target.value)} className="h-10 w-full cursor-pointer rounded-xl border border-black/10 bg-transparent p-0" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className={labelClass}>透明度 {Math.round(config.bgOpacity * 100)}%</span>
          <input type="range" min="0" max="1" step="0.01" value={config.bgOpacity} onChange={(e) => setConfig("bgOpacity", Number(e.target.value))} className="w-full cursor-pointer" />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3">
        <div>
          <div className="text-sm font-medium">着信音</div>
          <div className={noteClass}>着信画面が出ている間に鳴らします</div>
        </div>
        <button
          type="button"
          onClick={() => setConfig("toneEnabled", !config.toneEnabled)}
          className={cls("relative h-6 w-11 shrink-0 rounded-full transition", config.toneEnabled ? "bg-emerald-500" : "bg-black/20")}
          aria-label="着信音"
          aria-pressed={config.toneEnabled}
        >
          <span className={cls("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", config.toneEnabled ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      <label className="grid min-w-0 gap-1.5">
        <span className={labelClass}>着信音の種類</span>
        <select value={config.toneType} onChange={(e) => setConfig("toneType", e.target.value as IncomingCallToneType)} className={fieldClass}>
          <option value="iphone">iPhone風</option>
          <option value="line">LINE風</option>
          <option value="custom">アップロード音源</option>
        </select>
      </label>

      {config.toneType === "custom" && (
        <div className="space-y-2">
          <div className={labelClass}>着信音ファイル</div>
          <input type="file" accept="audio/*" onChange={handleTone} className="w-full min-w-0 text-xs" />
          <div className={noteClass}>{config.customToneName || "mp3 / wav / m4a などが使えます"}</div>
          {config.customToneUrl && (
            <button
              type="button"
              onClick={() => { setConfig("customToneUrl", null); setConfig("customToneName", ""); setConfig("toneType", "iphone"); }}
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
            >
              着信音を解除
            </button>
          )}
        </div>
      )}

      <button type="button" onClick={onTest} className="w-full rounded-2xl bg-black px-3 py-2 text-sm font-medium text-white">
        この設定で着信をテスト
      </button>
    </div>
  );
}

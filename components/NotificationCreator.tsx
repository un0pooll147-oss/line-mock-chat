"use client";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useVisualViewportHeight } from "./useVisualViewportHeight";
import { useNativeFullscreen } from "./useNativeFullscreen";
import { useKeyboardSafeInputs } from "./useKeyboardSafeInputs";
import { MAX_TEXT_SCALE, MIN_TEXT_SCALE, MOCK_TEXT_SCALE_CLASS, textScaleStyle } from "./textScale";
import {
  type LucideIcon,
  Clock3,
  Image as ImageIcon,
  MessageSquareMore,
  Palette,
  PlusCircle,
  Settings2,
  Trash2,
  UserCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Phone,
  Video,
  PhoneOff,
} from "lucide-react";

type OSType = "iphone" | "android";
type SettingsTab = "appearance" | "notifications" | "saved" | "screen" | "modes";
type NotificationDirection = "top" | "bottom";
type SoundPreset = "classic" | "digital" | "soft" | "upload";
type StartButtonAction = "notifications" | "incoming" | "outgoing";
type OutgoingToneType = "iphone" | "line" | "custom";

type Message = {
  id: number;
  appName: string;
  groupName: string;
  sender: string;
  text: string;
  time: string;
  iconText: string;
  iconImage?: string;
  delaySeconds: number;
  enabled: boolean;
  displayed: boolean;
  animatedAt: number | null;
};

type NotificationSettings = {
  osType: OSType;
  phoneTime: string;
  showStatusBar: boolean;
  lockscreenTime: string;
  lockscreenTimeSize: number;
  lockscreenDate: string;
  lockscreenDateSize: number;
  showLargeClock: boolean;
  groupName: string;
  selectedWallpaper: string;
  wallpaperBlur: number;
  notificationTextScale: number;
  uploadedWallpaper: string | null;
  messages: Message[];
  showSettingsButton: boolean;
  showStartButton: boolean;
  startButtonAction: StartButtonAction;
  notificationDirection: NotificationDirection;
  vibrateOnNotify: boolean;
  soundOnNotify: boolean;
  notificationSoundPreset: SoundPreset;
  uploadedSound: string | null;
  uploadedSoundName: string;
  fullScreenMode: boolean;
  deviceFrameMode: boolean;
  showCallButton: boolean;
  quickCallMode: "voice" | "video";
  incomingCallMode: "voice" | "video";
  incomingStartDelaySeconds: number;
  incomingCallTitle: string;
  incomingCallAvatarLabel: string;
  incomingCallAvatarImage: string | null;
  incomingToneEnabled: boolean;
  incomingToneType: OutgoingToneType;
  customIncomingToneName: string;
  customIncomingToneUrl: string | null;
  quickCallStartDelaySeconds: number;
  quickCallConnectSeconds: number;
  quickCallTitle: string;
  quickCallAvatarLabel: string;
  quickCallAvatarImage: string | null;
  incomingCallBgColor: string;
  incomingCallBgOpacity: number;
  outgoingCallBgColor: string;
  outgoingCallBgOpacity: number;
  outgoingToneEnabled: boolean;
  outgoingToneType: OutgoingToneType;
  customOutgoingToneName: string;
  customOutgoingToneUrl: string | null;
};

const STORAGE_KEY = "notification-mock-settings-v6";
const SAVED_NOTIFICATION_STORAGE_KEY = "notification-mock-saved-presets-v1";

type SavedNotificationPreset = {
  id: string;
  name: string;
  updatedAt: number;
  settings: NotificationSettings;
};

const getToastMeta = (message: string) => {
  if (message.includes("失敗")) {
    return {
      icon: "!",
      iconClassName: "bg-red-50 text-red-600 ring-1 ring-red-100",
      borderClassName: "border-red-100",
      subtitle: "保存できなかったため、もう一度お試しください。",
    };
  }

  if (message.includes("ありません")) {
    return {
      icon: "i",
      iconClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      borderClassName: "border-amber-100",
      subtitle: "操作できる項目がない状態です。",
    };
  }

  if (message.includes("削除")) {
    return {
      icon: "✓",
      iconClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      borderClassName: "border-slate-200",
      subtitle: "画面の内容を更新しました。",
    };
  }

  return {
    icon: "✓",
    iconClassName: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    borderClassName: "border-emerald-100",
    subtitle: "現在の設定をこの端末に反映しました。",
  };
};

const presetWallpapers: Record<string, string> = {
  // 既定の壁紙。ロック画面の見た目を実機に近づけるための写真素材。
  photoLake: "url(/notification-wallpaper-lake.webp)",
  simple: "linear-gradient(180deg, #7b8188 0%, #3d4349 35%, #111111 100%)",
  red: "linear-gradient(180deg, #ff6b6b 0%, #b91c1c 45%, #220a0a 100%)",
  blue: "linear-gradient(180deg, #7dd3fc 0%, #2563eb 45%, #081226 100%)",
  green: "linear-gradient(180deg, #86efac 0%, #15803d 45%, #07170d 100%)",
  yellow: "linear-gradient(180deg, #fde68a 0%, #f59e0b 45%, #2b1903 100%)",
  purple: "linear-gradient(180deg, #d8b4fe 0%, #7c3aed 45%, #18072a 100%)",
  brown: "linear-gradient(180deg, #d4a86a 0%, #8b5e3c 45%, #1a0e00 100%)",
  pink: "linear-gradient(180deg, #f9a8d4 0%, #db2777 45%, #2a0018 100%)",
};

const MAX_WALLPAPER_BLUR = 24;

function clampWallpaperBlur(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return defaultSettings.wallpaperBlur;
  return Math.max(0, Math.min(MAX_WALLPAPER_BLUR, Math.round(num)));
}

const MIN_NOTIFICATION_TEXT_SCALE = MIN_TEXT_SCALE;
const MAX_NOTIFICATION_TEXT_SCALE = MAX_TEXT_SCALE;

function clampNotificationTextScale(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return defaultSettings.notificationTextScale;
  return Math.max(MIN_NOTIFICATION_TEXT_SCALE, Math.min(MAX_NOTIFICATION_TEXT_SCALE, Math.round(num)));
}

// 100% のときの通知カード各要素の基準サイズ(px)。
// 倍率を変えても崩れないよう、文字・アイコン・余白をすべてここから算出する。
const notificationBaseSizes = {
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

const osThemes: Record<
  OSType,
  {
    notificationCard: string;
    cardRadius: number;
    iconWrap: string;
    iconRadius: number;
    appText: string;
    groupText: string;
    senderText: string;
    bodyText: string;
    timeText: string;
    topInset: string;
    largeClockTime: string;
    largeClockDate: string;
    notificationsTopWithClock: string;
    notificationsTopWithoutClock: string;
    showNotch: boolean;
    showHomeBar: boolean;
  }
> = {
  iphone: {
    notificationCard: "border border-white/20 shadow-lg",
    cardRadius: 22,
    iconWrap: "border border-white/40 text-black/80 shadow-sm",
    iconRadius: 12,
    appText: "text-white/70 font-medium",
    groupText: "font-semibold text-white",
    senderText: "text-white/75",
    bodyText: "text-white/95",
    timeText: "text-white/55",
    topInset: "pt-0",
    largeClockTime: "font-semibold text-white tracking-[-0.03em]",
    largeClockDate: "text-white/80",
    notificationsTopWithClock: "pt-[230px]",
    notificationsTopWithoutClock: "pt-[108px]",
    showNotch: true,
    showHomeBar: true,
  },
  android: {
    notificationCard: "border border-white/10 shadow-lg",
    cardRadius: 18,
    iconWrap: "border border-black/5 text-zinc-800 shadow-sm",
    iconRadius: 9999,
    appText: "text-white/65 font-medium",
    groupText: "font-semibold text-white",
    senderText: "text-white/70",
    bodyText: "text-white/90",
    timeText: "text-white/50",
    topInset: "pt-0",
    largeClockTime: "font-medium text-white tracking-[-0.02em]",
    largeClockDate: "text-white/75",
    notificationsTopWithClock: "pt-[205px]",
    notificationsTopWithoutClock: "pt-[88px]",
    showNotch: false,
    showHomeBar: false,
  },
};

const defaultMessages: Message[] = [
  {
    id: 1,
    appName: "LINE",
    groupName: "森田家",
    sender: "美咲",
    text: "新着メッセージがあります",
    time: "22:18",
    iconText: "森",
    delaySeconds: 1,
    enabled: true,
    displayed: true,
    animatedAt: null,
  },
];

const defaultSettings: NotificationSettings = {
  osType: "iphone",
  phoneTime: "22:18",
  showStatusBar: true,
  lockscreenTime: "22:18",
  lockscreenTimeSize: 88,
  lockscreenDate: "4月23日 木曜日",
  lockscreenDateSize: 16,
  showLargeClock: true,
  groupName: "森田家",
  selectedWallpaper: "photoLake",
  wallpaperBlur: 0,
  notificationTextScale: 125,
  uploadedWallpaper: null,
  messages: defaultMessages,
  showSettingsButton: true,
  showStartButton: true,
  startButtonAction: "notifications",
  notificationDirection: "top",
  vibrateOnNotify: false,
  soundOnNotify: false,
  notificationSoundPreset: "classic",
  uploadedSound: null,
  uploadedSoundName: "",
  fullScreenMode: false,
  deviceFrameMode: false,
  showCallButton: true,
  quickCallMode: "voice",
  incomingCallMode: "voice",
  incomingStartDelaySeconds: 3,
  incomingCallTitle: "",
  incomingCallAvatarLabel: "",
  incomingCallAvatarImage: null,
  incomingToneEnabled: true,
  incomingToneType: "iphone",
  customIncomingToneName: "",
  customIncomingToneUrl: null,
  quickCallStartDelaySeconds: 0,
  quickCallConnectSeconds: 2.5,
  quickCallTitle: "美咲",
  quickCallAvatarLabel: "美",
  quickCallAvatarImage: null,
  incomingCallBgColor: "#000000",
  incomingCallBgOpacity: 1,
  outgoingCallBgColor: "#000000",
  outgoingCallBgOpacity: 1,
  outgoingToneEnabled: true,
  outgoingToneType: "line",
  customOutgoingToneName: "",
  customOutgoingToneUrl: null,
};



function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// 端末で撮った写真をそのまま保存すると localStorage の容量を超えてエラーになるため、
// 読み込み時に縮小・再エンコードしてから使う。
const MAX_IMAGE_DIMENSION = 1280;
const MAX_LOSSLESS_LENGTH = 600000;

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

async function readImageFileAsDataUrl(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  // GIF は縮小するとアニメーションが失われるのでそのまま使う。
  if (file.type === "image/gif") return original;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onerror = () => resolve(original);
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
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
        const keepsAlpha = file.type === "image/png" || file.type === "image/webp";
        let encoded = keepsAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.82);
        // 透過付きでも大きすぎる場合は JPEG に落として容量を優先する。
        if (keepsAlpha && encoded.length > MAX_LOSSLESS_LENGTH) encoded = canvas.toDataURL("image/jpeg", 0.82);
        resolve(encoded.length < original.length ? encoded : original);
      } catch {
        resolve(original);
      }
    };
    img.src = original;
  });
}

function toRgba(color: string, alpha: number) {
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  const hex = color.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    const value = hex.slice(1);
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  if (/^#([0-9a-fA-F]{3})$/.test(hex)) {
    const value = hex.slice(1);
    const r = Number.parseInt(value[0] + value[0], 16);
    const g = Number.parseInt(value[1] + value[1], 16);
    const b = Number.parseInt(value[2] + value[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  return color;
}

function StatusPin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 2.94 3.16 6.58 4.06 7.56a.58.58 0 0 0 .88 0c.9-.98 4.06-4.62 4.06-7.56A4.5 4.5 0 0 0 8 1.5Zm0 6.1A1.6 1.6 0 1 1 8 4.4a1.6 1.6 0 0 1 0 3.2Z" />
    </svg>
  );
}

function StatusNfc({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12.5c1.2-1.1 1.8-2.2 1.8-3.5S5.2 6.6 4 5.5" />
      <path d="M7.2 14.1C8.9 12.6 9.8 10.9 9.8 9S8.9 5.4 7.2 3.9" />
      <path d="M10.7 15.2c2.2-1.9 3.3-4 3.3-6.2s-1.1-4.3-3.3-6.2" />
    </svg>
  );
}

function StatusSignal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} fill="none" aria-hidden="true">
      <rect x="1" y="9" width="2.4" height="4" rx="0.7" fill="currentColor" opacity="0.7" />
      <rect x="5.2" y="7" width="2.4" height="6" rx="0.7" fill="currentColor" opacity="0.82" />
      <rect x="9.4" y="4.5" width="2.4" height="8.5" rx="0.7" fill="currentColor" opacity="0.9" />
      <rect x="13.6" y="1.5" width="2.4" height="11.5" rx="0.7" fill="currentColor" />
      <path d="M18 3.2l-2.3 2.3m0-2.3L18 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.82" />
    </svg>
  );
}

function StatusWifi({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.3 5.2A12.2 12.2 0 0 1 10 2.5a12.2 12.2 0 0 1 7.7 2.7" strokeWidth="1.7" opacity="0.6" />
      <path d="M4.8 7.8A8.2 8.2 0 0 1 10 5.9a8.2 8.2 0 0 1 5.2 1.9" strokeWidth="1.7" opacity="0.82" />
      <path d="M7.4 10.2A4.4 4.4 0 0 1 10 9.3a4.4 4.4 0 0 1 2.6.9" strokeWidth="1.7" />
      <circle cx="10" cy="12" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StatusBattery({ className = "", level = 100 }: { className?: string; level?: number }) {
  const safeLevel = Math.max(0, Math.min(100, level));
  const fillWidth = 16 * (safeLevel / 100);
  return (
    <svg viewBox="0 0 30 14" className={className} fill="none" aria-hidden="true">
      <rect x="1" y="1.5" width="24" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <rect x="26.2" y="4.2" width="2.3" height="5.6" rx="1.1" fill="currentColor" />
      <rect x="3.2" y="3.6" width={fillWidth} height="6.8" rx="1.8" fill="currentColor" />
    </svg>
  );
}

function StatusCellDots({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 14" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="10.7" r="1.2" opacity="0.55" />
      <circle cx="7" cy="8.8" r="1.45" opacity="0.72" />
      <circle cx="11" cy="6.7" r="1.7" opacity="0.85" />
      <circle cx="15" cy="4.4" r="1.95" />
    </svg>
  );
}

function PhoneStatusBar({ osType: _osType, time, level = 100, className = "" }: { osType: OSType; time: string; level?: number; className?: string }) {
  return (
    <div className={cn("px-5", className)}>
      <div className="flex h-6 items-center justify-between text-[12px] font-semibold tracking-[-0.01em] opacity-[0.98] [text-shadow:0_1px_1px_rgba(0,0,0,0.12)]">
        <span className="tabular-nums">{time}</span>
        <div className="flex items-center gap-1.5">
          <StatusCellDots className="h-[10px] w-[17px]" />
          <StatusWifi className="h-[10px] w-[16px]" />
          <StatusBattery className="h-[11px] w-[24px]" level={level} />
        </div>
      </div>
    </div>
  );
}

function NotificationCallOverlay({
  visible,
  mode,
  phase,
  title,
  avatarImage,
  avatarLabel,
  backgroundColor,
  backgroundOpacity,
  onAccept,
  onDecline,
  onEnd,
}: {
  visible: boolean;
  mode: "voice" | "video" | null;
  phase: "idle" | "incoming" | "calling" | "connecting" | "connected";
  title: string;
  avatarImage?: string;
  avatarLabel: string;
  backgroundColor: string;
  backgroundOpacity: number;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}) {
  if (!visible || !mode) return null;
  const isIncoming = phase === "incoming";
  const isCalling = phase === "calling";
  const isConnecting = phase === "connecting";

  return (
    <div className="absolute inset-0 z-[70] flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 text-white" style={{ backgroundColor: toRgba(backgroundColor, backgroundOpacity) }}>
      <div className="mb-6">
        {avatarImage ? (
          <img src={avatarImage} alt="avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-white/20" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-3xl font-semibold ring-4 ring-white/10">
            {avatarLabel}
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold">{title}</div>
      <div className="mt-2 text-sm opacity-75">{mode === "video" ? "ビデオ通話" : "音声通話"}</div>
      <div className="mt-4 text-lg">{isIncoming ? "着信中…" : isCalling ? "発信中…" : isConnecting ? "接続中…" : "通話中"}</div>

      {isIncoming && (
        <div className="mt-10 flex items-center gap-8">
          <button type="button" onClick={onDecline} className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg transition active:scale-95" aria-label="拒否">
            <PhoneOff className="h-7 w-7" />
          </button>
          <button type="button" onClick={onAccept} className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#06C755] shadow-lg transition active:scale-95" aria-label="応答">
            {mode === "video" ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
          </button>
        </div>
      )}

      {(isCalling || isConnecting || phase === "connected") && (
        <button type="button" onClick={onEnd} className="mt-10 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-lg transition active:scale-95">
          通話終了
        </button>
      )}
    </div>
  );
}

function Button({
  children,
  className = "",
  variant = "default",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "outline"
      ? "border border-black/10 bg-white text-black hover:bg-black/[0.03]"
      : "bg-[#06C755] text-white hover:brightness-95";
  return (
    <button type={type as "button" | "submit" | "reset"} className={cn(base, styles, className)} {...props}>
      {children}
    </button>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      data-form-type="other"
      className={cn(
        "w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5",
        className,
      )}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      data-form-type="other"
      className={cn(
        "w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5",
        className,
      )}
    />
  );
}

function Label({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...props} className={cn("text-sm font-medium text-black/80", className)}>
      {children}
    </label>
  );
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn("relative h-7 w-12 rounded-full transition", checked ? "bg-[#06C755]" : "bg-black/15")}
      aria-pressed={checked}
    >
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition", checked ? "left-6" : "left-1")} />
    </button>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-black/80">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl px-2 py-2 text-xs font-medium transition",
        active ? "bg-white text-black shadow-sm" : "text-black/55",
      )}
    >
      {children}
    </button>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2">
      <input type="color" value={value} onChange={onChange} className="h-10 w-12 cursor-pointer rounded-xl border border-black/10 bg-transparent p-0" />
      <Input value={value} onChange={onChange} className="h-10" />
    </div>
  );
}

function FileInputRow({
  label,
  description,
  onChange,
  previewName,
}: {
  label: string;
  description: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  previewName?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
        <div className="mb-2 flex items-center gap-2 text-black/80">
          <ImageIcon className="h-4 w-4" />
          画像を選択
        </div>
        <input type="file" accept="image/*" onChange={onChange} className="block w-full text-sm text-black/70" />
      </label>
      <div className="text-xs text-black/50">{previewName || description}</div>
    </div>
  );
}

function normalizeMessages(messages: any[] | undefined): Message[] {
  if (!Array.isArray(messages) || messages.length === 0) return defaultSettings.messages;
  return messages.map((m, index) => ({
    id: typeof m.id === "number" ? m.id : Date.now() + index,
    appName: String(m.appName ?? "LINE"),
    groupName: String(m.groupName ?? defaultSettings.groupName),
    sender: String(m.sender ?? ""),
    text: String(m.text ?? ""),
    time: String(m.time ?? "今"),
    iconText: String(m.iconText ?? "森"),
    iconImage: m.iconImage || undefined,
    delaySeconds: Number.isFinite(Number(m.delaySeconds)) ? Number(m.delaySeconds) : 0,
    enabled: typeof m.enabled === "boolean" ? m.enabled : typeof m.visible === "boolean" ? m.visible : true,
    displayed: typeof m.displayed === "boolean" ? m.displayed : typeof m.visible === "boolean" ? m.visible : true,
    animatedAt: typeof m.animatedAt === "number" ? m.animatedAt : null,
  }));
}



function readSavedNotificationPresets(): SavedNotificationPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_NOTIFICATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => ({
        id: String(item?.id ?? `notification-preset-${index}`),
        name: String(item?.name ?? `保存通知 ${index + 1}`),
        updatedAt: Number.isFinite(Number(item?.updatedAt)) ? Number(item.updatedAt) : Date.now(),
        settings: {
          ...defaultSettings,
          ...(item?.settings || {}),
          messages: normalizeMessages(item?.settings?.messages),
        } as NotificationSettings,
      }))
      .filter((item) => item.name.trim());
  } catch {
    return [];
  }
}

function readStoredSettings(): NotificationSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const currentRaw = window.localStorage.getItem(STORAGE_KEY);
    const raw = currentRaw || window.localStorage.getItem("notification-mock-settings-v5") || window.localStorage.getItem("notification-mock-settings-v4") || window.localStorage.getItem("notification-mock-settings-v2");
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<NotificationSettings> & { messages?: any[] };
    return {
      ...defaultSettings,
      ...parsed,
      messages: normalizeMessages(parsed.messages),
      lockscreenTimeSize: currentRaw && Number.isFinite(Number(parsed.lockscreenTimeSize))
        ? Math.max(56, Math.min(132, Number(parsed.lockscreenTimeSize)))
        : defaultSettings.lockscreenTimeSize,
      lockscreenDateSize: Number.isFinite(Number(parsed.lockscreenDateSize))
        ? Math.max(12, Math.min(40, Number(parsed.lockscreenDateSize)))
        : defaultSettings.lockscreenDateSize,
      notificationDirection:
        parsed.notificationDirection === "bottom" || parsed.notificationDirection === "top"
          ? parsed.notificationDirection
          : defaultSettings.notificationDirection,
      notificationSoundPreset:
        parsed.notificationSoundPreset === "classic" ||
        parsed.notificationSoundPreset === "digital" ||
        parsed.notificationSoundPreset === "soft" ||
        parsed.notificationSoundPreset === "upload"
          ? parsed.notificationSoundPreset
          : defaultSettings.notificationSoundPreset,
      showStartButton: typeof parsed.showStartButton === "boolean" ? parsed.showStartButton : defaultSettings.showStartButton,
      startButtonAction:
        parsed.startButtonAction === "incoming" || parsed.startButtonAction === "outgoing" || parsed.startButtonAction === "notifications"
          ? parsed.startButtonAction
          : defaultSettings.startButtonAction,
      wallpaperBlur: clampWallpaperBlur(parsed.wallpaperBlur),
      notificationTextScale: clampNotificationTextScale(parsed.notificationTextScale),
      uploadedSound: typeof parsed.uploadedSound === "string" ? parsed.uploadedSound : defaultSettings.uploadedSound,
      uploadedSoundName: typeof parsed.uploadedSoundName === "string" ? parsed.uploadedSoundName : defaultSettings.uploadedSoundName,
      showCallButton: typeof parsed.showCallButton === "boolean" ? parsed.showCallButton : defaultSettings.showCallButton,
      quickCallMode: parsed.quickCallMode === "video" ? "video" : defaultSettings.quickCallMode,
      incomingCallMode: parsed.incomingCallMode === "video" ? "video" : defaultSettings.incomingCallMode,
      incomingStartDelaySeconds: Number.isFinite(Number(parsed.incomingStartDelaySeconds)) ? Number(parsed.incomingStartDelaySeconds) : defaultSettings.incomingStartDelaySeconds,
      incomingCallTitle: typeof parsed.incomingCallTitle === "string" ? parsed.incomingCallTitle : defaultSettings.incomingCallTitle,
      incomingCallAvatarLabel: typeof parsed.incomingCallAvatarLabel === "string" ? parsed.incomingCallAvatarLabel : defaultSettings.incomingCallAvatarLabel,
      incomingCallAvatarImage: typeof parsed.incomingCallAvatarImage === "string" ? parsed.incomingCallAvatarImage : defaultSettings.incomingCallAvatarImage,
      incomingToneEnabled: typeof parsed.incomingToneEnabled === "boolean" ? parsed.incomingToneEnabled : defaultSettings.incomingToneEnabled,
      incomingToneType: parsed.incomingToneType === "line" || parsed.incomingToneType === "custom" || parsed.incomingToneType === "iphone" ? parsed.incomingToneType : defaultSettings.incomingToneType,
      customIncomingToneName: typeof parsed.customIncomingToneName === "string" ? parsed.customIncomingToneName : defaultSettings.customIncomingToneName,
      customIncomingToneUrl: typeof parsed.customIncomingToneUrl === "string" ? parsed.customIncomingToneUrl : defaultSettings.customIncomingToneUrl,
      quickCallStartDelaySeconds: Number.isFinite(Number(parsed.quickCallStartDelaySeconds)) ? Number(parsed.quickCallStartDelaySeconds) : defaultSettings.quickCallStartDelaySeconds,
      quickCallConnectSeconds: Number.isFinite(Number(parsed.quickCallConnectSeconds)) ? Number(parsed.quickCallConnectSeconds) : defaultSettings.quickCallConnectSeconds,
      quickCallTitle: typeof parsed.quickCallTitle === "string" ? parsed.quickCallTitle : defaultSettings.quickCallTitle,
      quickCallAvatarLabel: typeof parsed.quickCallAvatarLabel === "string" ? parsed.quickCallAvatarLabel : defaultSettings.quickCallAvatarLabel,
      quickCallAvatarImage: typeof parsed.quickCallAvatarImage === "string" ? parsed.quickCallAvatarImage : defaultSettings.quickCallAvatarImage,
      incomingCallBgColor: typeof parsed.incomingCallBgColor === "string" ? parsed.incomingCallBgColor : defaultSettings.incomingCallBgColor,
      incomingCallBgOpacity: Number.isFinite(Number(parsed.incomingCallBgOpacity)) ? Number(parsed.incomingCallBgOpacity) : defaultSettings.incomingCallBgOpacity,
      outgoingCallBgColor: typeof parsed.outgoingCallBgColor === "string" ? parsed.outgoingCallBgColor : defaultSettings.outgoingCallBgColor,
      outgoingCallBgOpacity: Number.isFinite(Number(parsed.outgoingCallBgOpacity)) ? Number(parsed.outgoingCallBgOpacity) : defaultSettings.outgoingCallBgOpacity,
      outgoingToneEnabled: typeof parsed.outgoingToneEnabled === "boolean" ? parsed.outgoingToneEnabled : defaultSettings.outgoingToneEnabled,
      outgoingToneType: parsed.outgoingToneType === "iphone" || parsed.outgoingToneType === "custom" || parsed.outgoingToneType === "line" ? parsed.outgoingToneType : defaultSettings.outgoingToneType,
      customOutgoingToneName: typeof parsed.customOutgoingToneName === "string" ? parsed.customOutgoingToneName : defaultSettings.customOutgoingToneName,
      customOutgoingToneUrl: typeof parsed.customOutgoingToneUrl === "string" ? parsed.customOutgoingToneUrl : defaultSettings.customOutgoingToneUrl,
    };
  } catch {
    return defaultSettings;
  }
}

export default function NotificationCreator() {
  useKeyboardSafeInputs();
  const visualViewportHeight = useVisualViewportHeight();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [savedPresets, setSavedPresets] = useState<SavedNotificationPreset[]>([]);
  const [saveName, setSaveName] = useState("通知撮影セット");

  const [osType, setOsType] = useState<OSType>(defaultSettings.osType);
  const [phoneTime, setPhoneTime] = useState(defaultSettings.phoneTime);
  const [showStatusBar, setShowStatusBar] = useState(defaultSettings.showStatusBar);
  const [lockscreenTime, setLockscreenTime] = useState(defaultSettings.lockscreenTime);
  const [lockscreenTimeSize, setLockscreenTimeSize] = useState(defaultSettings.lockscreenTimeSize);
  const [lockscreenDate, setLockscreenDate] = useState(defaultSettings.lockscreenDate);
  const [lockscreenDateSize, setLockscreenDateSize] = useState(defaultSettings.lockscreenDateSize);
  const [showLargeClock, setShowLargeClock] = useState(defaultSettings.showLargeClock);
  const [groupName, setGroupName] = useState(defaultSettings.groupName);
  const [selectedWallpaper, setSelectedWallpaper] = useState(defaultSettings.selectedWallpaper);
  const [wallpaperBlur, setWallpaperBlur] = useState(defaultSettings.wallpaperBlur);
  const [notificationTextScale, setNotificationTextScale] = useState(defaultSettings.notificationTextScale);
  const [uploadedWallpaper, setUploadedWallpaper] = useState<string | null>(defaultSettings.uploadedWallpaper);
  const [messages, setMessages] = useState<Message[]>(defaultSettings.messages);
  const [showSettingsButton, setShowSettingsButton] = useState(defaultSettings.showSettingsButton);
  const [showStartButton, setShowStartButton] = useState(defaultSettings.showStartButton);
  const [startButtonAction, setStartButtonAction] = useState<StartButtonAction>(defaultSettings.startButtonAction);
  // 撮影中は開始ボタンを画面から消したいので、保存はせず実行中だけ持つ状態。
  const [startArmed, setStartArmed] = useState(true);
  const [notificationDirection, setNotificationDirection] = useState<NotificationDirection>(defaultSettings.notificationDirection);
  const [vibrateOnNotify, setVibrateOnNotify] = useState(defaultSettings.vibrateOnNotify);
  const [soundOnNotify, setSoundOnNotify] = useState(defaultSettings.soundOnNotify);
  const [notificationSoundPreset, setNotificationSoundPreset] = useState<SoundPreset>(defaultSettings.notificationSoundPreset);
  const [uploadedSound, setUploadedSound] = useState<string | null>(defaultSettings.uploadedSound);
  const [uploadedSoundName, setUploadedSoundName] = useState(defaultSettings.uploadedSoundName);
  const [fullScreenMode, setFullScreenMode] = useState(defaultSettings.fullScreenMode);
  const changeNativeFullscreen = useNativeFullscreen(() => setFullScreenMode(false));
  const [deviceFrameMode, setDeviceFrameMode] = useState(defaultSettings.deviceFrameMode);
  const [showCallButton, setShowCallButton] = useState(defaultSettings.showCallButton);
  const [quickCallMode, setQuickCallMode] = useState<"voice" | "video">(defaultSettings.quickCallMode);
  const [incomingCallMode, setIncomingCallMode] = useState<"voice" | "video">(defaultSettings.incomingCallMode);
  const [incomingStartDelaySeconds, setIncomingStartDelaySeconds] = useState(String(defaultSettings.incomingStartDelaySeconds));
  const [incomingCallTitle, setIncomingCallTitle] = useState(defaultSettings.incomingCallTitle);
  const [incomingCallAvatarLabel, setIncomingCallAvatarLabel] = useState(defaultSettings.incomingCallAvatarLabel);
  const [incomingCallAvatarImage, setIncomingCallAvatarImage] = useState<string | null>(defaultSettings.incomingCallAvatarImage);
  const [incomingToneEnabled, setIncomingToneEnabled] = useState(defaultSettings.incomingToneEnabled);
  const [incomingToneType, setIncomingToneType] = useState<OutgoingToneType>(defaultSettings.incomingToneType);
  const [customIncomingToneName, setCustomIncomingToneName] = useState(defaultSettings.customIncomingToneName);
  const [customIncomingToneUrl, setCustomIncomingToneUrl] = useState<string | null>(defaultSettings.customIncomingToneUrl);
  const [quickCallStartDelaySeconds, setQuickCallStartDelaySeconds] = useState(String(defaultSettings.quickCallStartDelaySeconds));
  const [quickCallConnectSeconds, setQuickCallConnectSeconds] = useState(String(defaultSettings.quickCallConnectSeconds));
  const [quickCallTitle, setQuickCallTitle] = useState(defaultSettings.quickCallTitle);
  const [quickCallAvatarLabel, setQuickCallAvatarLabel] = useState(defaultSettings.quickCallAvatarLabel);
  const [quickCallAvatarImage, setQuickCallAvatarImage] = useState<string | null>(defaultSettings.quickCallAvatarImage);
  const [incomingCallBgColor, setIncomingCallBgColor] = useState(defaultSettings.incomingCallBgColor);
  const [incomingCallBgOpacity, setIncomingCallBgOpacity] = useState(defaultSettings.incomingCallBgOpacity);
  const [outgoingCallBgColor, setOutgoingCallBgColor] = useState(defaultSettings.outgoingCallBgColor);
  const [outgoingCallBgOpacity, setOutgoingCallBgOpacity] = useState(defaultSettings.outgoingCallBgOpacity);
  const [outgoingToneEnabled, setOutgoingToneEnabled] = useState(defaultSettings.outgoingToneEnabled);
  const [outgoingToneType, setOutgoingToneType] = useState<OutgoingToneType>(defaultSettings.outgoingToneType);
  const [customOutgoingToneName, setCustomOutgoingToneName] = useState(defaultSettings.customOutgoingToneName);
  const [customOutgoingToneUrl, setCustomOutgoingToneUrl] = useState<string | null>(defaultSettings.customOutgoingToneUrl);
  const [toastMessage, setToastMessage] = useState("");
  const [callMode, setCallMode] = useState<"voice" | "video" | null>(null);
  const [callPhase, setCallPhase] = useState<"idle" | "incoming" | "calling" | "connecting" | "connected">("idle");
  const [callDirection, setCallDirection] = useState<"incoming" | "outgoing" | null>(null);

  const [form, setForm] = useState({ appName: "LINE", sender: "", text: "", time: "", iconText: "森", delaySeconds: "1" });
  const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);

  const playTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callConnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readStoredSettings();
    setOsType(stored.osType);
    setPhoneTime(stored.phoneTime);
    setShowStatusBar(stored.showStatusBar);
    setLockscreenTime(stored.lockscreenTime);
    setLockscreenTimeSize(stored.lockscreenTimeSize);
    setLockscreenDate(stored.lockscreenDate);
    setLockscreenDateSize(stored.lockscreenDateSize);
    setShowLargeClock(stored.showLargeClock);
    setGroupName(stored.groupName);
    setSelectedWallpaper(stored.selectedWallpaper);
    setWallpaperBlur(stored.wallpaperBlur);
    setNotificationTextScale(stored.notificationTextScale);
    setUploadedWallpaper(stored.uploadedWallpaper);
    setMessages(stored.messages);
    setShowSettingsButton(stored.showSettingsButton);
    setShowStartButton(stored.showStartButton);
    setStartButtonAction(stored.startButtonAction);
    setNotificationDirection(stored.notificationDirection);
    setVibrateOnNotify(stored.vibrateOnNotify);
    setSoundOnNotify(stored.soundOnNotify);
    setNotificationSoundPreset(stored.notificationSoundPreset);
    setUploadedSound(stored.uploadedSound);
    setUploadedSoundName(stored.uploadedSoundName);
    setFullScreenMode(stored.fullScreenMode);
    setDeviceFrameMode(stored.deviceFrameMode);
    setShowCallButton(stored.showCallButton);
    setQuickCallMode(stored.quickCallMode);
    setIncomingCallMode(stored.incomingCallMode);
    setIncomingStartDelaySeconds(String(stored.incomingStartDelaySeconds));
    setIncomingCallTitle(stored.incomingCallTitle);
    setIncomingCallAvatarLabel(stored.incomingCallAvatarLabel);
    setIncomingCallAvatarImage(stored.incomingCallAvatarImage);
    setIncomingToneEnabled(stored.incomingToneEnabled);
    setIncomingToneType(stored.incomingToneType);
    setCustomIncomingToneName(stored.customIncomingToneName);
    setCustomIncomingToneUrl(stored.customIncomingToneUrl);
    setQuickCallStartDelaySeconds(String(stored.quickCallStartDelaySeconds));
    setQuickCallConnectSeconds(String(stored.quickCallConnectSeconds));
    setQuickCallTitle(stored.quickCallTitle);
    setQuickCallAvatarLabel(stored.quickCallAvatarLabel);
    setQuickCallAvatarImage(stored.quickCallAvatarImage);
    setIncomingCallBgColor(stored.incomingCallBgColor);
    setIncomingCallBgOpacity(stored.incomingCallBgOpacity);
    setOutgoingCallBgColor(stored.outgoingCallBgColor);
    setOutgoingCallBgOpacity(stored.outgoingCallBgOpacity);
    setOutgoingToneEnabled(stored.outgoingToneEnabled);
    setOutgoingToneType(stored.outgoingToneType);
    setCustomOutgoingToneName(stored.customOutgoingToneName);
    setCustomOutgoingToneUrl(stored.customOutgoingToneUrl);
    setSavedPresets(readSavedNotificationPresets());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const payload: NotificationSettings = {
      osType,
      phoneTime,
      showStatusBar,
      lockscreenTime,
      lockscreenTimeSize,
      lockscreenDate,
      lockscreenDateSize,
      showLargeClock,
      groupName,
      selectedWallpaper,
      wallpaperBlur,
      notificationTextScale,
      uploadedWallpaper,
      messages,
      showSettingsButton,
      showStartButton,
      startButtonAction,
      notificationDirection,
      vibrateOnNotify,
      soundOnNotify,
      notificationSoundPreset,
      uploadedSound,
      uploadedSoundName,
      fullScreenMode,
      deviceFrameMode,
      showCallButton,
      quickCallMode,
      incomingCallMode,
      incomingStartDelaySeconds: Number.isFinite(Number(incomingStartDelaySeconds)) ? Number(incomingStartDelaySeconds) : 0,
      incomingCallTitle,
      incomingCallAvatarLabel,
      incomingCallAvatarImage,
      incomingToneEnabled,
      incomingToneType,
      customIncomingToneName,
      customIncomingToneUrl,
      quickCallStartDelaySeconds: Number.isFinite(Number(quickCallStartDelaySeconds)) ? Number(quickCallStartDelaySeconds) : 0,
      quickCallConnectSeconds: Number.isFinite(Number(quickCallConnectSeconds)) ? Number(quickCallConnectSeconds) : 0,
      quickCallTitle,
      quickCallAvatarLabel,
      quickCallAvatarImage,
      incomingCallBgColor,
      incomingCallBgOpacity,
      outgoingCallBgColor,
      outgoingCallBgOpacity,
      outgoingToneEnabled,
      outgoingToneType,
      customOutgoingToneName,
      customOutgoingToneUrl,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 画像や音声を入れると保存容量を超えることがあるため、
      // 画面表示はそのまま維持して、保存時だけ重いデータを外す。
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...payload,
            uploadedWallpaper: null,
            uploadedSound: null,
            customOutgoingToneUrl: null,
            quickCallAvatarImage: null,
            incomingCallAvatarImage: null,
            customIncomingToneUrl: null,
            messages: payload.messages.map((msg) => ({ ...msg, iconImage: undefined })),
          }),
        );
      } catch {
        // それでも保存できない場合は撮影用プレビューの継続を優先する。
      }
    }
  }, [
    hydrated,
    osType,
    phoneTime,
    showStatusBar,
    lockscreenTime,
    lockscreenTimeSize,
    lockscreenDate,
    lockscreenDateSize,
    showLargeClock,
    groupName,
    selectedWallpaper,
    wallpaperBlur,
    notificationTextScale,
    uploadedWallpaper,
    messages,
    showSettingsButton,
    showStartButton,
    startButtonAction,
    notificationDirection,
    vibrateOnNotify,
    soundOnNotify,
    notificationSoundPreset,
    uploadedSound,
    uploadedSoundName,
    fullScreenMode,
    deviceFrameMode,
    showCallButton,
    quickCallMode,
    incomingCallMode,
    incomingStartDelaySeconds,
    incomingCallTitle,
    incomingCallAvatarLabel,
    incomingCallAvatarImage,
    incomingToneEnabled,
    incomingToneType,
    customIncomingToneName,
    customIncomingToneUrl,
    quickCallStartDelaySeconds,
    quickCallConnectSeconds,
    quickCallTitle,
    quickCallAvatarLabel,
    quickCallAvatarImage,
    incomingCallBgColor,
    incomingCallBgOpacity,
    outgoingCallBgColor,
    outgoingCallBgOpacity,
    outgoingToneEnabled,
    outgoingToneType,
    customOutgoingToneName,
    customOutgoingToneUrl,
  ]);

  useEffect(() => {
    return () => {
      playTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
      playTimeoutsRef.current = [];
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (callStartTimerRef.current) clearTimeout(callStartTimerRef.current);
      if (callConnectTimerRef.current) clearTimeout(callConnectTimerRef.current);
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.currentTime = 0;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const theme = osThemes[osType];

  const safeWallpaperBlur = clampWallpaperBlur(wallpaperBlur);

  const bgStyle = useMemo<React.CSSProperties>(() => {
    const image =
      selectedWallpaper === "upload" && uploadedWallpaper
        ? `url(${uploadedWallpaper})`
        : presetWallpapers[selectedWallpaper] ?? presetWallpapers.simple;
    return {
      backgroundImage: image,
      backgroundSize: "cover",
      backgroundPosition: "center",
      // ぼかすと端が透けてしまうため、少し拡大して縁が出ないようにする。
      ...(safeWallpaperBlur > 0
        ? { filter: `blur(${safeWallpaperBlur}px)`, transform: `scale(${1 + safeWallpaperBlur / 200})` }
        : null),
    };
  }, [selectedWallpaper, uploadedWallpaper, safeWallpaperBlur]);

  const renderedNotifications = useMemo(() => {
    const enabledMessages = messages.filter((m) => m.enabled && m.displayed);
    const sorted = [...enabledMessages].sort((a, b) => a.delaySeconds - b.delaySeconds || a.id - b.id);
    return notificationDirection === "bottom" ? [...sorted].reverse() : sorted;
  }, [messages, notificationDirection]);

  const clearTimers = () => {
    playTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
    playTimeoutsRef.current = [];
  };

  // 設定を開き直したら、次のテイクに備えて開始ボタンを出し直す。
  useEffect(() => {
    if (settingsOpen) setStartArmed(true);
  }, [settingsOpen]);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (typeof window === "undefined") return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(""), 2200);
  };

  const ensureAudioContext = async () => {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playPresetNotificationSound = async (preset: Exclude<SoundPreset, "upload">) => {
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const presets: Record<Exclude<SoundPreset, "upload">, Array<{ frequency: number; duration: number; type: OscillatorType; gain: number }>> = {
      classic: [
        { frequency: 880, duration: 0.08, type: "sine", gain: 0.045 },
        { frequency: 1320, duration: 0.11, type: "sine", gain: 0.04 },
      ],
      digital: [
        { frequency: 1180, duration: 0.05, type: "square", gain: 0.028 },
        { frequency: 980, duration: 0.05, type: "square", gain: 0.025 },
        { frequency: 1320, duration: 0.08, type: "square", gain: 0.022 },
      ],
      soft: [
        { frequency: 740, duration: 0.1, type: "triangle", gain: 0.035 },
        { frequency: 990, duration: 0.13, type: "triangle", gain: 0.03 },
      ],
    };

    let offset = 0;
    presets[preset].forEach((tone) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = tone.type;
      oscillator.frequency.setValueAtTime(tone.frequency, ctx.currentTime + offset);
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gainNode.gain.exponentialRampToValueAtTime(tone.gain, ctx.currentTime + offset + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + tone.duration);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(ctx.currentTime + offset);
      oscillator.stop(ctx.currentTime + offset + tone.duration + 0.02);
      offset += tone.duration * 0.72;
    });
  };

  const playUploadedNotificationSound = () => {
    if (!uploadedSound) return;
    const audio = new Audio(uploadedSound);
    audio.preload = "auto";
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const playNotificationFeedback = () => {
    if (vibrateOnNotify && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([45]);
    }

    if (!soundOnNotify) return;

    if (notificationSoundPreset === "upload") {
      playUploadedNotificationSound();
      return;
    }

    playPresetNotificationSound(notificationSoundPreset);
  };

  const stopOutgoingTone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
    }
  };

  const playTone = (frequency = 880, duration = 180, gainValue = 0.05) => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      window.setTimeout(() => osc.stop(), duration);
    } catch {}
  };

  const playIphonePattern = () => {
    playTone(1046, 160, 0.05);
    window.setTimeout(() => playTone(1318, 180, 0.05), 180);
  };

  const playLinePattern = () => {
    playTone(784, 120, 0.05);
    window.setTimeout(() => playTone(988, 120, 0.05), 160);
    window.setTimeout(() => playTone(1174, 180, 0.05), 320);
  };

  const startCustomOutgoingTone = (url: string) => {
    if (!url) return;
    try {
      if (!customAudioRef.current) customAudioRef.current = new Audio(url);
      else customAudioRef.current.src = url;
      customAudioRef.current.loop = true;
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.play().catch(() => {});
    } catch {}
  };

  const startIncomingTone = () => {
    if (!incomingToneEnabled) return;
    stopOutgoingTone();
    if (incomingToneType === "custom" && customIncomingToneUrl) {
      startCustomOutgoingTone(customIncomingToneUrl);
      return;
    }
    const runPattern = () => {
      if (incomingToneType === "iphone") playIphonePattern();
      else playLinePattern();
    };
    runPattern();
    ringtoneIntervalRef.current = window.setInterval(runPattern, incomingToneType === "line" ? 1500 : 1800);
  };

  const startOutgoingTone = () => {
    if (!outgoingToneEnabled) return;
    stopOutgoingTone();
    if (outgoingToneType === "custom" && customOutgoingToneUrl) {
      startCustomOutgoingTone(customOutgoingToneUrl);
      return;
    }
    const runPattern = () => {
      if (outgoingToneType === "iphone") playIphonePattern();
      else playLinePattern();
    };
    runPattern();
    ringtoneIntervalRef.current = window.setInterval(runPattern, outgoingToneType === "line" ? 1500 : 1800);
  };

  const clearCallTimer = () => {
    if (callStartTimerRef.current) {
      clearTimeout(callStartTimerRef.current);
      callStartTimerRef.current = null;
    }
    if (callConnectTimerRef.current) {
      clearTimeout(callConnectTimerRef.current);
      callConnectTimerRef.current = null;
    }
  };

  // 発信と着信で相手の設定を別々に持てるようにする。
  // 未入力のときだけ、通知一覧の内容からの推測値にフォールバックする。
  const getCallProfile = (direction: "incoming" | "outgoing") => {
    const source = [...messages].filter((msg) => msg.enabled).sort((a, b) => a.id - b.id).at(-1) ?? defaultMessages[0];
    const fallbackTitle = source?.sender?.trim() || source?.groupName?.trim() || groupName || "着信";
    const fallbackLabel = (source?.iconText?.trim() || source?.sender?.trim() || groupName || "着").slice(0, 2);
    const title = direction === "incoming" ? incomingCallTitle : quickCallTitle;
    const label = direction === "incoming" ? incomingCallAvatarLabel : quickCallAvatarLabel;
    const image = direction === "incoming" ? incomingCallAvatarImage : quickCallAvatarImage;
    return {
      title: title.trim() || fallbackTitle,
      avatarLabel: (label.trim() || fallbackLabel).slice(0, 2),
      avatarImage: image || source?.iconImage || undefined,
    };
  };

  const startNotificationCall = (direction: "incoming" | "outgoing", mode: "voice" | "video", startDelaySeconds = 0, silent = false) => {
    clearCallTimer();
    setSettingsOpen(false);
    setStartArmed(false);

    const bootCall = () => {
      setCallDirection(direction);
      setCallMode(mode);
      if (direction === "incoming") {
        stopOutgoingTone();
        setCallPhase("incoming");
        void ensureAudioContext();
        startIncomingTone();
        return;
      }
      setCallPhase("calling");
      void ensureAudioContext();
      startOutgoingTone();
      callConnectTimerRef.current = setTimeout(() => {
        stopOutgoingTone();
        setCallPhase("connected");
      }, Math.max(0, Number(quickCallConnectSeconds) || 0) * 1000);
    };

    const delay = Math.max(0, Number(startDelaySeconds) || 0);
    if (delay > 0) {
      // 撮影用の開始ボタンから呼ばれたときは、画面にトーストを出さない。
      if (!silent) showToast(`${delay}秒後に${direction === "incoming" ? "着信します" : "発信します"}`);
      callStartTimerRef.current = setTimeout(bootCall, delay * 1000);
    } else {
      bootCall();
    }
  };

  const startQuickOutgoingCall = () => {
    startNotificationCall("outgoing", quickCallMode, Number(quickCallStartDelaySeconds) || 0);
  };

  const startQuickIncomingCall = () => {
    startNotificationCall("incoming", incomingCallMode, Number(incomingStartDelaySeconds) || 0);
  };

  const acceptNotificationCall = () => {
    clearCallTimer();
    stopOutgoingTone();
    setCallPhase("connecting");
    callConnectTimerRef.current = setTimeout(() => {
      setCallPhase("connected");
    }, 1200);
  };

  const endNotificationCall = () => {
    clearCallTimer();
    stopOutgoingTone();
    setCallPhase("idle");
    setCallMode(null);
    setCallDirection(null);
  };

  const handleOpenChatCallScreen = (direction: "incoming" | "outgoing", mode: "voice" | "video") => {
    const profile = getCallProfile(direction);
    try {
      window.localStorage.setItem(
        "line-mock-chat-call-bridge",
        JSON.stringify({
          direction,
          mode,
          title: profile.title,
          avatarLabel: profile.avatarLabel,
          avatarImage: profile.avatarImage || "",
          at: Date.now(),
        }),
      );
    } catch {}
    router.push("/");
  };

  const handleWallpaperUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setUploadedWallpaper(dataUrl);
      setSelectedWallpaper("upload");
    } catch {
      showToast("画像の読み込みに失敗しました");
    }
  };

  const handleIconUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploadedIcon(await readImageFileAsDataUrl(file));
    } catch {
      showToast("画像の読み込みに失敗しました");
    }
  };

  const handleQuickCallAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setQuickCallAvatarImage(await readImageFileAsDataUrl(file));
    } catch {
      showToast("画像の読み込みに失敗しました");
    }
  };

  const handleIncomingCallAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setIncomingCallAvatarImage(await readImageFileAsDataUrl(file));
    } catch {
      showToast("画像の読み込みに失敗しました");
    }
  };

  const handleIncomingToneUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setCustomIncomingToneUrl(await readFileAsDataUrl(file));
      setCustomIncomingToneName(file.name);
      setIncomingToneType("custom");
    } catch {
      showToast("音声の読み込みに失敗しました");
    }
  };

  const handleOutgoingToneUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setCustomOutgoingToneUrl(await readFileAsDataUrl(file));
      setCustomOutgoingToneName(file.name);
      setOutgoingToneType("custom");
    } catch {
      showToast("音声の読み込みに失敗しました");
    }
  };

  const handleExistingIconUpload = async (id: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, iconImage: dataUrl } : msg)));
    } catch {
      showToast("画像の読み込みに失敗しました");
    }
  };

  const handleSoundUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadedSound(await readFileAsDataUrl(file));
      setUploadedSoundName(file.name);
      setNotificationSoundPreset("upload");
    } catch {
      showToast("音声の読み込みに失敗しました");
    }
  };

  const addMessage = () => {
    if (!form.sender.trim() || !form.text.trim()) return;
    const delay = Math.max(0, Number(form.delaySeconds) || 0);
    const nextGroupName = groupName.trim() || "森田家";
    const msg: Message = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      appName: form.appName.trim() || "LINE",
      groupName: nextGroupName,
      sender: form.sender.trim(),
      text: form.text.trim(),
      time: form.time.trim() || "今",
      iconText: form.iconText.trim() || "森",
      iconImage: uploadedIcon ?? undefined,
      delaySeconds: delay,
      enabled: true,
      displayed: true,
      animatedAt: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setForm((prev) => ({ ...prev, sender: "", text: "", time: "" }));
    setUploadedIcon(null);
  };

  const deleteMessage = (id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMessage = (id: number, key: keyof Message, value: string | number | boolean | null | undefined) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  };

  const buildCurrentNotificationSettings = (): NotificationSettings => ({
    osType,
    phoneTime,
    showStatusBar,
    lockscreenTime,
    lockscreenTimeSize,
    lockscreenDate,
    lockscreenDateSize,
    showLargeClock,
    groupName,
    selectedWallpaper,
    wallpaperBlur,
    notificationTextScale,
    uploadedWallpaper,
    messages,
    showSettingsButton,
    showStartButton,
    startButtonAction,
    notificationDirection,
    vibrateOnNotify,
    soundOnNotify,
    notificationSoundPreset,
    uploadedSound,
    uploadedSoundName,
    fullScreenMode,
    deviceFrameMode,
    showCallButton,
    quickCallMode,
    incomingCallMode,
    incomingStartDelaySeconds: Number.isFinite(Number(incomingStartDelaySeconds)) ? Number(incomingStartDelaySeconds) : 0,
    incomingCallTitle,
    incomingCallAvatarLabel,
    incomingCallAvatarImage,
    incomingToneEnabled,
    incomingToneType,
    customIncomingToneName,
    customIncomingToneUrl,
    quickCallStartDelaySeconds: Number.isFinite(Number(quickCallStartDelaySeconds)) ? Number(quickCallStartDelaySeconds) : 0,
    quickCallConnectSeconds: Number.isFinite(Number(quickCallConnectSeconds)) ? Number(quickCallConnectSeconds) : 0,
    quickCallTitle,
    quickCallAvatarLabel,
    quickCallAvatarImage,
    incomingCallBgColor,
    incomingCallBgOpacity,
    outgoingCallBgColor,
    outgoingCallBgOpacity,
    outgoingToneEnabled,
    outgoingToneType,
    customOutgoingToneName,
    customOutgoingToneUrl,
  });

  const applyNotificationSettings = (next: NotificationSettings) => {
    setOsType(next.osType);
    setPhoneTime(next.phoneTime);
    setLockscreenTime(next.lockscreenTime);
    setLockscreenTimeSize(next.lockscreenTimeSize);
    setLockscreenDate(next.lockscreenDate);
    setLockscreenDateSize(next.lockscreenDateSize);
    setShowLargeClock(next.showLargeClock);
    setGroupName(next.groupName);
    setSelectedWallpaper(next.selectedWallpaper);
    setWallpaperBlur(next.wallpaperBlur);
    setNotificationTextScale(next.notificationTextScale);
    setUploadedWallpaper(next.uploadedWallpaper);
    setMessages(normalizeMessages(next.messages));
    setShowSettingsButton(next.showSettingsButton);
    setShowStartButton(next.showStartButton);
    setStartButtonAction(next.startButtonAction);
    setNotificationDirection(next.notificationDirection);
    setVibrateOnNotify(next.vibrateOnNotify);
    setSoundOnNotify(next.soundOnNotify);
    setNotificationSoundPreset(next.notificationSoundPreset);
    setUploadedSound(next.uploadedSound);
    setUploadedSoundName(next.uploadedSoundName);
    setFullScreenMode(next.fullScreenMode);
    setDeviceFrameMode(next.deviceFrameMode);
    setShowCallButton(next.showCallButton);
    setQuickCallMode(next.quickCallMode);
    setIncomingCallMode(next.incomingCallMode);
    setIncomingStartDelaySeconds(String(next.incomingStartDelaySeconds));
    setIncomingCallTitle(next.incomingCallTitle);
    setIncomingCallAvatarLabel(next.incomingCallAvatarLabel);
    setIncomingCallAvatarImage(next.incomingCallAvatarImage);
    setIncomingToneEnabled(next.incomingToneEnabled);
    setIncomingToneType(next.incomingToneType);
    setCustomIncomingToneName(next.customIncomingToneName);
    setCustomIncomingToneUrl(next.customIncomingToneUrl);
    setQuickCallStartDelaySeconds(String(next.quickCallStartDelaySeconds));
    setQuickCallConnectSeconds(String(next.quickCallConnectSeconds));
    setQuickCallTitle(next.quickCallTitle);
    setQuickCallAvatarLabel(next.quickCallAvatarLabel);
    setQuickCallAvatarImage(next.quickCallAvatarImage);
    setIncomingCallBgColor(next.incomingCallBgColor);
    setIncomingCallBgOpacity(next.incomingCallBgOpacity);
    setOutgoingCallBgColor(next.outgoingCallBgColor);
    setOutgoingCallBgOpacity(next.outgoingCallBgOpacity);
    setOutgoingToneEnabled(next.outgoingToneEnabled);
    setOutgoingToneType(next.outgoingToneType);
    setCustomOutgoingToneName(next.customOutgoingToneName);
    setCustomOutgoingToneUrl(next.customOutgoingToneUrl);
  };

  const persistSavedPresets = (items: SavedNotificationPreset[]) => {
    setSavedPresets(items);
    try {
      window.localStorage.setItem(SAVED_NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
    } catch {
      showToast("保存に失敗しました");
    }
  };

  const saveNotificationPresetAsNew = () => {
    const name = saveName.trim();
    if (!name) {
      showToast("保存名を入力してください");
      return;
    }
    const item: SavedNotificationPreset = {
      id: `notification-saved-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      updatedAt: Date.now(),
      settings: buildCurrentNotificationSettings(),
    };
    persistSavedPresets([item, ...savedPresets]);
    showToast("通知画面を保存しました");
  };

  const overwriteNotificationPreset = (id: string) => {
    persistSavedPresets(savedPresets.map((item) => item.id === id ? { ...item, updatedAt: Date.now(), settings: buildCurrentNotificationSettings() } : item));
    showToast("保存通知を上書きしました");
  };

  const loadNotificationPreset = (id: string) => {
    const item = savedPresets.find((preset) => preset.id === id);
    if (!item) return;
    applyNotificationSettings({ ...defaultSettings, ...item.settings, messages: normalizeMessages(item.settings.messages) });
    setSettingsOpen(false);
    showToast("保存通知を読み込みました");
  };

  const deleteNotificationPreset = (id: string) => {
    persistSavedPresets(savedPresets.filter((item) => item.id !== id));
    showToast("保存通知を削除しました");
  };

  const duplicateNotificationPreset = (id: string) => {
    const item = savedPresets.find((preset) => preset.id === id);
    if (!item) return;
    persistSavedPresets([{ ...item, id: `notification-saved-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: `${item.name} コピー`, updatedAt: Date.now() }, ...savedPresets]);
    showToast("保存通知を複製しました");
  };

  const playNotifications = () => {
    clearTimers();
    setSettingsOpen(false);
    // 撮影画面に開始ボタンが残らないようにする（設定側の「再生」から呼ばれた場合も同じ）。
    setStartArmed(false);
    void ensureAudioContext();
    setMessages((prev) => prev.map((m) => ({ ...m, displayed: false, animatedAt: null })));
    const enabledMessages = [...messages]
      .filter((m) => m.enabled)
      .sort((a, b) => a.delaySeconds - b.delaySeconds || a.id - b.id);

    enabledMessages.forEach((msg) => {
      const timer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === msg.id
              ? { ...item, displayed: true, animatedAt: Date.now() }
              : item,
          ),
        );
        playNotificationFeedback();
      }, Math.max(0, msg.delaySeconds) * 1000);
      playTimeoutsRef.current.push(timer);
    });
  };

  const startButtonDelaySeconds =
    startButtonAction === "incoming"
      ? Math.max(0, Number(incomingStartDelaySeconds) || 0)
      : Math.max(0, Number(quickCallStartDelaySeconds) || 0);

  const startButtonLabel =
    startButtonAction === "incoming" ? "着信を開始" : startButtonAction === "outgoing" ? "発信を開始" : "通知を開始";

  // 画面内の開始ボタン。押した瞬間にボタンを消してから、設定した秒数後に本番の演出が走る。
  const handleScreenStart = () => {
    setStartArmed(false);
    if (startButtonAction === "incoming") {
      startNotificationCall("incoming", incomingCallMode, Math.max(0, Number(incomingStartDelaySeconds) || 0), true);
      return;
    }
    if (startButtonAction === "outgoing") {
      startNotificationCall("outgoing", quickCallMode, Math.max(0, Number(quickCallStartDelaySeconds) || 0), true);
      return;
    }
    playNotifications();
  };

  const saveCurrentAsDefault = () => {
    if (typeof window === "undefined") {
      showToast("保存に失敗しました");
      return;
    }
    const payload: NotificationSettings = {
      osType,
      phoneTime,
      showStatusBar,
      lockscreenTime,
      lockscreenTimeSize,
      lockscreenDate,
      lockscreenDateSize,
      showLargeClock,
      groupName,
      selectedWallpaper,
      wallpaperBlur,
      notificationTextScale,
      uploadedWallpaper,
      messages,
      showSettingsButton,
      showStartButton,
      startButtonAction,
      notificationDirection,
      vibrateOnNotify,
      soundOnNotify,
      notificationSoundPreset,
      uploadedSound,
      uploadedSoundName,
      fullScreenMode,
      deviceFrameMode,
      showCallButton,
      quickCallMode,
      incomingCallMode,
      incomingStartDelaySeconds: Number.isFinite(Number(incomingStartDelaySeconds)) ? Number(incomingStartDelaySeconds) : 0,
      incomingCallTitle,
      incomingCallAvatarLabel,
      incomingCallAvatarImage,
      incomingToneEnabled,
      incomingToneType,
      customIncomingToneName,
      customIncomingToneUrl,
      quickCallStartDelaySeconds: Number.isFinite(Number(quickCallStartDelaySeconds)) ? Number(quickCallStartDelaySeconds) : 0,
      quickCallConnectSeconds: Number.isFinite(Number(quickCallConnectSeconds)) ? Number(quickCallConnectSeconds) : 0,
      quickCallTitle,
      quickCallAvatarLabel,
      quickCallAvatarImage,
      incomingCallBgColor,
      incomingCallBgOpacity,
      outgoingCallBgColor,
      outgoingCallBgOpacity,
      outgoingToneEnabled,
      outgoingToneType,
      customOutgoingToneName,
      customOutgoingToneUrl,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      showToast("既定の設定を保存しました");
    } catch {
      showToast("保存に失敗しました");
    }
  };

  const resetToDefault = () => {
    clearTimers();
    setOsType(defaultSettings.osType);
    setPhoneTime(defaultSettings.phoneTime);
    setShowStatusBar(defaultSettings.showStatusBar);
    setLockscreenTime(defaultSettings.lockscreenTime);
    setLockscreenTimeSize(defaultSettings.lockscreenTimeSize);
    setLockscreenDate(defaultSettings.lockscreenDate);
    setLockscreenDateSize(defaultSettings.lockscreenDateSize);
    setShowLargeClock(defaultSettings.showLargeClock);
    setGroupName(defaultSettings.groupName);
    setSelectedWallpaper(defaultSettings.selectedWallpaper);
    setWallpaperBlur(defaultSettings.wallpaperBlur);
    setNotificationTextScale(defaultSettings.notificationTextScale);
    setUploadedWallpaper(defaultSettings.uploadedWallpaper);
    setMessages(defaultSettings.messages);
    setShowSettingsButton(defaultSettings.showSettingsButton);
    setShowStartButton(defaultSettings.showStartButton);
    setStartButtonAction(defaultSettings.startButtonAction);
    setStartArmed(true);
    setNotificationDirection(defaultSettings.notificationDirection);
    setVibrateOnNotify(defaultSettings.vibrateOnNotify);
    setSoundOnNotify(defaultSettings.soundOnNotify);
    setNotificationSoundPreset(defaultSettings.notificationSoundPreset);
    setUploadedSound(defaultSettings.uploadedSound);
    setUploadedSoundName(defaultSettings.uploadedSoundName);
    setFullScreenMode(defaultSettings.fullScreenMode);
    setDeviceFrameMode(defaultSettings.deviceFrameMode);
    setShowCallButton(defaultSettings.showCallButton);
    setQuickCallMode(defaultSettings.quickCallMode);
    setIncomingCallMode(defaultSettings.incomingCallMode);
    setIncomingStartDelaySeconds(String(defaultSettings.incomingStartDelaySeconds));
    setIncomingCallTitle(defaultSettings.incomingCallTitle);
    setIncomingCallAvatarLabel(defaultSettings.incomingCallAvatarLabel);
    setIncomingCallAvatarImage(defaultSettings.incomingCallAvatarImage);
    setIncomingToneEnabled(defaultSettings.incomingToneEnabled);
    setIncomingToneType(defaultSettings.incomingToneType);
    setCustomIncomingToneName(defaultSettings.customIncomingToneName);
    setCustomIncomingToneUrl(defaultSettings.customIncomingToneUrl);
    setQuickCallStartDelaySeconds(String(defaultSettings.quickCallStartDelaySeconds));
    setQuickCallConnectSeconds(String(defaultSettings.quickCallConnectSeconds));
    setQuickCallTitle(defaultSettings.quickCallTitle);
    setQuickCallAvatarLabel(defaultSettings.quickCallAvatarLabel);
    setQuickCallAvatarImage(defaultSettings.quickCallAvatarImage);
    setIncomingCallBgColor(defaultSettings.incomingCallBgColor);
    setIncomingCallBgOpacity(defaultSettings.incomingCallBgOpacity);
    setOutgoingCallBgColor(defaultSettings.outgoingCallBgColor);
    setOutgoingCallBgOpacity(defaultSettings.outgoingCallBgOpacity);
    setOutgoingToneEnabled(defaultSettings.outgoingToneEnabled);
    setOutgoingToneType(defaultSettings.outgoingToneType);
    setCustomOutgoingToneName(defaultSettings.customOutgoingToneName);
    setCustomOutgoingToneUrl(defaultSettings.customOutgoingToneUrl);
    showToast("初期設定に戻しました");
  };

  const handleFullScreenModeChange = async (enabled: boolean) => {
    if (enabled) {
      setFullScreenMode(true);
      const success = await changeNativeFullscreen(true);
      if (!success) setFullScreenMode(false);
      return;
    }

    const success = await changeNativeFullscreen(false);
    if (success) setFullScreenMode(false);
  };

  const notifBg = osType === "iphone" ? "rgba(255,255,255,0.18)" : "rgba(30,30,30,0.52)";
  const iconBg = osType === "iphone" ? "rgba(255,255,255,0.78)" : "rgba(240,240,240,0.92)";
  const safeNotificationTextScale = clampNotificationTextScale(notificationTextScale);
  const notifScale = safeNotificationTextScale / 100;
  const notifPx = (base: number) => `${Math.round(base * notifScale * 100) / 100}px`;
  const notificationStackStyle: React.CSSProperties = { gap: notifPx(notificationBaseSizes.stackGap) };
  const notificationCardStyle: React.CSSProperties = {
    backgroundColor: notifBg,
    padding: `${notifPx(notificationBaseSizes.cardPaddingY)} ${notifPx(notificationBaseSizes.cardPaddingX)}`,
    borderRadius: notifPx(theme.cardRadius),
  };
  const notificationRowStyle: React.CSSProperties = { gap: notifPx(notificationBaseSizes.rowGap) };
  const notificationIconStyle: React.CSSProperties = {
    backgroundColor: iconBg,
    height: notifPx(notificationBaseSizes.iconSize),
    width: notifPx(notificationBaseSizes.iconSize),
    fontSize: notifPx(notificationBaseSizes.iconFont),
    borderRadius: theme.iconRadius >= 999 ? "9999px" : notifPx(theme.iconRadius),
  };
  const notificationLineStyle: React.CSSProperties = { marginTop: notifPx(notificationBaseSizes.lineGap) };
  const notificationAppStyle: React.CSSProperties = { fontSize: notifPx(notificationBaseSizes.appFont) };
  const notificationTimeStyle: React.CSSProperties = { fontSize: notifPx(notificationBaseSizes.timeFont) };
  const notificationGroupStyle: React.CSSProperties = { ...notificationLineStyle, fontSize: notifPx(notificationBaseSizes.groupFont) };
  const notificationSenderStyle: React.CSSProperties = { ...notificationLineStyle, fontSize: notifPx(notificationBaseSizes.senderFont) };
  const notificationBodyStyle: React.CSSProperties = { ...notificationLineStyle, fontSize: notifPx(notificationBaseSizes.bodyFont) };

  const renderNotificationCard = (msg: Message, extraClassName: string) => (
    <div
      key={`${msg.id}-${msg.animatedAt ?? "stable"}`}
      className={cn("backdrop-blur-md", theme.notificationCard, extraClassName)}
      style={notificationCardStyle}
    >
      <div className="flex items-start" style={notificationRowStyle}>
        <div
          className={cn("flex shrink-0 items-center justify-center overflow-hidden font-semibold", theme.iconWrap)}
          style={notificationIconStyle}
        >
          {msg.iconImage ? <img src={msg.iconImage} alt="icon" className="h-full w-full object-cover" /> : <span>{msg.iconText || "森"}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className={cn("min-w-0 truncate", theme.appText)} style={notificationAppStyle}>{msg.appName}</div>
            <div className={cn("shrink-0", theme.timeText)} style={notificationTimeStyle}>{msg.time}</div>
          </div>
          <div className={cn("truncate", theme.groupText)} style={notificationGroupStyle}>{msg.groupName}</div>
          <div className={cn("truncate", theme.senderText)} style={notificationSenderStyle}>{msg.sender}</div>
          <div className={cn("break-words leading-snug", theme.bodyText)} style={notificationBodyStyle}>{msg.text}</div>
        </div>
      </div>
    </div>
  );
  const topStackClass = showLargeClock ? "" : theme.notificationsTopWithoutClock;
  const safeLockscreenTimeSize = Math.max(56, Math.min(132, Number(lockscreenTimeSize) || defaultSettings.lockscreenTimeSize));
  const safeLockscreenDateSize = Math.max(12, Math.min(40, Number(lockscreenDateSize) || defaultSettings.lockscreenDateSize));
  const lockscreenClockTop = 110;
  const clockDateGap = 8;
  const notificationTopPadding = showLargeClock
    ? Math.min(360, lockscreenClockTop + safeLockscreenTimeSize + clockDateGap + safeLockscreenDateSize * 1.25 + 28)
    : undefined;

  const activeCallProfile = getCallProfile(callDirection === "incoming" ? "incoming" : "outgoing");
  const callOverlayBgColor = callDirection === "incoming" ? incomingCallBgColor : outgoingCallBgColor;
  const callOverlayBgOpacity = callDirection === "incoming" ? incomingCallBgOpacity : outgoingCallBgOpacity;

  const stageContainerStyle: React.CSSProperties = {
    height: visualViewportHeight,
    minHeight: visualViewportHeight,
    maxHeight: visualViewportHeight,
    width: "100%",
    maxWidth: "100vw",
    overflow: fullScreenMode ? "hidden" : undefined,
    position: "relative",
  };
  const previewShellClassName = cn(
    deviceFrameMode ? "p-1" : "p-0",
    fullScreenMode && "rounded-device-safe-shell",
  );
  const settingsButtonClassName = deviceFrameMode
    ? cn("absolute z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-2xl backdrop-blur-md transition hover:bg-black/55 active:scale-95", fullScreenMode ? "bottom-[max(32px,calc(env(safe-area-inset-bottom)+20px))] right-[max(32px,calc(env(safe-area-inset-right)+20px))]" : "bottom-[max(18px,env(safe-area-inset-bottom))] right-4")
    : cn("fixed z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-2xl backdrop-blur-md transition hover:bg-black/55 active:scale-95", fullScreenMode ? "bottom-[max(32px,calc(env(safe-area-inset-bottom)+20px))] right-[max(32px,calc(env(safe-area-inset-right)+20px))]" : "bottom-[max(18px,env(safe-area-inset-bottom))] right-4");
  const phoneButtonClassName = deviceFrameMode
    ? cn("absolute z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-white/[0.08] text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-white/[0.12] active:scale-95", fullScreenMode ? "bottom-[max(32px,calc(env(safe-area-inset-bottom)+20px))] left-[max(32px,calc(env(safe-area-inset-left)+20px))]" : "bottom-[max(18px,env(safe-area-inset-bottom))] left-4")
    : cn("fixed z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-white/[0.08] text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-white/[0.12] active:scale-95", fullScreenMode ? "bottom-[max(32px,calc(env(safe-area-inset-bottom)+20px))] left-[max(32px,calc(env(safe-area-inset-left)+20px))]" : "bottom-[max(18px,env(safe-area-inset-bottom))] left-4");
  const startButtonClassName = cn(
    deviceFrameMode ? "absolute" : "fixed",
    "left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/30 bg-black/55 px-6 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition hover:bg-black/65 active:scale-95",
    fullScreenMode
      ? "bottom-[max(46px,calc(env(safe-area-inset-bottom)+34px))]"
      : "bottom-[max(32px,calc(env(safe-area-inset-bottom)+14px))]",
  );
  const hiddenSettingsButtonClassName = deviceFrameMode
    ? cn("absolute z-10 h-20 w-20 opacity-0", fullScreenMode ? "bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))]" : "bottom-0 right-0")
    : cn("fixed z-10 h-20 w-20 opacity-0", fullScreenMode ? "bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))]" : "bottom-0 right-0");

  return (
    <div className={cn("flex flex-col bg-black", fullScreenMode ? "fixed inset-0 z-40 h-[100dvh] w-screen max-w-none" : "mx-auto max-w-md")} style={stageContainerStyle}>
      <div className={cn("relative flex-1 overflow-hidden", previewShellClassName)}>
        <div
          className={cn(
            "relative h-full min-h-0 w-full overflow-hidden bg-black text-white",
            MOCK_TEXT_SCALE_CLASS,
            deviceFrameMode && "rounded-[32px] border border-white/10 shadow-2xl",
            fullScreenMode && "rounded-device-safe-surface",
          )}
          style={textScaleStyle(safeNotificationTextScale)}
        >
          <div className="absolute inset-0" style={bgStyle} />
          <div className="absolute inset-0 bg-black/15" />

      {theme.showNotch && <div className="absolute left-1/2 top-3 z-20 h-[30px] w-[140px] -translate-x-1/2 rounded-full bg-black" />}

      {showStatusBar && (
        <PhoneStatusBar
          osType={osType}
          time={phoneTime}
          className={cn("absolute inset-x-0 top-0 z-20 text-white", theme.topInset)}
        />
      )}

      {showLargeClock && (
        <div
          className="absolute inset-x-0 top-0 z-10 flex flex-col items-center text-center"
          style={{ paddingTop: `${lockscreenClockTop}px`, gap: `${clockDateGap}px` }}
        >
          <div className={theme.largeClockTime} style={{ fontSize: `${safeLockscreenTimeSize}px`, lineHeight: 1 }}>{lockscreenTime}</div>
          <div className={theme.largeClockDate} style={{ fontSize: `${safeLockscreenDateSize}px`, lineHeight: 1.25 }}>{lockscreenDate}</div>
        </div>
      )}

      {notificationDirection === "top" ? (
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 h-full overflow-hidden px-4 pb-[max(18px,env(safe-area-inset-bottom))]",
            topStackClass,
          )}
          style={{ paddingTop: notificationTopPadding ? `${notificationTopPadding}px` : undefined }}
        >
          <div className="flex flex-col" style={notificationStackStyle}>
            {renderedNotifications.map((msg) => renderNotificationCard(msg, msg.animatedAt ? "notification-enter-top" : ""))}
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(28px,calc(env(safe-area-inset-bottom)+28px))]">
          <div className="flex max-h-[48dvh] flex-col-reverse overflow-hidden" style={notificationStackStyle}>
            {renderedNotifications.map((msg) => renderNotificationCard(msg, cn("pointer-events-auto", msg.animatedAt ? "notification-enter-bottom" : "")))}
          </div>
        </div>
      )}

      {theme.showHomeBar && (
        <div
          className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-[5px] w-[140px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.75)" }}
        />
      )}

          {showStartButton && startArmed && callPhase === "idle" && (
            <button
              type="button"
              onClick={handleScreenStart}
              className={startButtonClassName}
              aria-label={startButtonLabel}
            >
              <Clock3 className="h-5 w-5" />
              {startButtonLabel}
              {startButtonAction !== "notifications" && startButtonDelaySeconds > 0 ? `（${startButtonDelaySeconds}秒後）` : ""}
            </button>
          )}

          {showSettingsButton && showCallButton && (
            <button
              type="button"
              onClick={startQuickOutgoingCall}
              className={phoneButtonClassName}
              aria-label="通話発信"
            >
              {quickCallMode === "video" ? (
                <Video className="h-6 w-6 mix-blend-difference text-white" />
              ) : (
                <Phone className="h-6 w-6 mix-blend-difference text-white" />
              )}
            </button>
          )}

          {showSettingsButton && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={settingsButtonClassName}
              aria-label="設定を開く"
            >
              <Settings2 className="h-6 w-6" />
            </button>
          )}

          {!showSettingsButton && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={hiddenSettingsButtonClassName}
              aria-label="隠し設定ボタン"
            />
          )}

        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-x-0 top-0 z-50 bg-black/35" style={{ height: visualViewportHeight }}>
          <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-[#fafafa] px-4 pt-4 shadow-2xl text-black" style={{ maxHeight: visualViewportHeight }}>
            <div className="mb-4 shrink-0 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-black/70 transition hover:bg-black/[0.07]"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-lg font-semibold">設定</div>
              <div className="h-10 w-10" aria-hidden="true" />
            </div>
            <div className="grid shrink-0 grid-cols-5 rounded-2xl bg-black/5 p-1 text-center">
              <TabButton active={activeTab === "appearance"} onClick={() => setActiveTab("appearance")}>見た目</TabButton>
              <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")}>通知</TabButton>
              <TabButton active={activeTab === "saved"} onClick={() => setActiveTab("saved")}>保存</TabButton>
              <TabButton active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>画面・通知</TabButton>
              <TabButton active={activeTab === "modes"} onClick={() => setActiveTab("modes")}>モード</TabButton>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-[max(18px,calc(env(safe-area-inset-bottom)+18px))] pr-1 overscroll-contain">
            {activeTab === "appearance" && (
              <div className="space-y-4">
                <SectionCard icon={Palette} title="端末・見た目">
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setOsType("iphone")} variant={osType === "iphone" ? "default" : "outline"} className="w-full">iPhone風</Button>
                    <Button onClick={() => setOsType("android")} variant={osType === "android" ? "default" : "outline"} className="w-full">Android風</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                    <div>
                      <div className="text-sm font-medium">大きい時計を表示</div>
                      <div className="text-xs text-black/50">ロック画面らしい見せ方にします</div>
                    </div>
                    <Switch checked={showLargeClock} onCheckedChange={setShowLargeClock} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>大きい時計</Label><Input value={lockscreenTime} onChange={(e) => setLockscreenTime(e.target.value)} placeholder="9:41" inputMode="numeric" /></div>
                    <div className="space-y-2"><Label>日付表示</Label><Input value={lockscreenDate} onChange={(e) => setLockscreenDate(e.target.value)} placeholder="4月5日 日曜日" /></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>時間表示サイズ</Label>
                      <span className="text-xs font-medium text-black/50">{safeLockscreenTimeSize}px</span>
                    </div>
                    <Input
                      type="range"
                      min="56"
                      max="132"
                      step="1"
                      value={safeLockscreenTimeSize}
                      onChange={(e) => setLockscreenTimeSize(Number(e.target.value))}
                      aria-label="時間表示サイズ"
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-black/40">
                      <span>小さめ</span>
                      <span>大きめ</span>
                    </div>
                    <p className="text-xs leading-relaxed text-black/45">時計の大きさに合わせて、通知が重ならない位置へ自動で移動します。</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>文字サイズ</Label>
                      <span className="text-xs font-medium text-black/50">{safeNotificationTextScale}%</span>
                    </div>
                    <Input
                      type="range"
                      min={String(MIN_NOTIFICATION_TEXT_SCALE)}
                      max={String(MAX_NOTIFICATION_TEXT_SCALE)}
                      step="5"
                      value={safeNotificationTextScale}
                      onChange={(e) => setNotificationTextScale(Number(e.target.value))}
                      aria-label="文字サイズ"
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-black/40">
                      <span>小さめ</span>
                      <span>大きめ</span>
                    </div>
                    <p className="text-xs leading-relaxed text-black/45">通知カードは文字に合わせてアイコン・余白・角丸もまとめて拡大するので、レイアウトは崩れません。時計の大きさは上のスライダーで別に調整できます。</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>日付表示サイズ</Label>
                      <span className="text-xs font-medium text-black/50">{safeLockscreenDateSize}px</span>
                    </div>
                    <Input
                      type="range"
                      min="12"
                      max="40"
                      step="1"
                      value={safeLockscreenDateSize}
                      onChange={(e) => setLockscreenDateSize(Number(e.target.value))}
                      aria-label="日付表示サイズ"
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-black/40">
                      <span>小さめ</span>
                      <span>大きめ</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={ImageIcon} title="壁紙">
                  <div className="space-y-2">
                    <Label>プリセット壁紙</Label>
                    <select
                      value={selectedWallpaper}
                      onChange={(e) => setSelectedWallpaper(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="photoLake">写真（湖の夕景）</option>
                      <option value="simple">シンプル</option>
                      <option value="blue">青ベース</option>
                      <option value="red">赤ベース</option>
                      <option value="green">緑ベース</option>
                      <option value="yellow">黄色ベース</option>
                      <option value="purple">紫ベース</option>
                      <option value="brown">茶ベース</option>
                      <option value="pink">ピンクベース</option>
                      {uploadedWallpaper && <option value="upload">アップロード画像</option>}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>壁紙のぼかし</Label>
                      <span className="text-xs font-medium text-black/50">{safeWallpaperBlur === 0 ? "なし" : `${safeWallpaperBlur}px`}</span>
                    </div>
                    <Input
                      type="range"
                      min="0"
                      max={String(MAX_WALLPAPER_BLUR)}
                      step="1"
                      value={safeWallpaperBlur}
                      onChange={(e) => setWallpaperBlur(Number(e.target.value))}
                      aria-label="壁紙のぼかし"
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-black/40">
                      <span>くっきり</span>
                      <span>強くぼかす</span>
                    </div>
                    <p className="text-xs leading-relaxed text-black/45">背景だけをぼかします。通知カードや時計はぼけません。</p>
                  </div>
                  <FileInputRow label="壁紙画像" description="アップロードした画像を背景に使えます" onChange={handleWallpaperUpload} previewName={uploadedWallpaper ? "画像を選択済み" : undefined} />
                  {uploadedWallpaper && (
                    <Button onClick={() => { setUploadedWallpaper(null); setSelectedWallpaper(defaultSettings.selectedWallpaper); }} variant="outline" className="w-full">
                      アップロード壁紙を解除
                    </Button>
                  )}
                </SectionCard>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <SectionCard icon={Clock3} title="演出">
                  <div className="space-y-3">
                    <Button onClick={playNotifications} className="w-full"><Clock3 className="mr-2 h-4 w-4" />再生</Button>
                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-2 text-xs leading-relaxed text-black/55">
                      再生を押すと設定画面が閉じ、そのまま撮影画面に切り替わります。通知は各通知に設定した秒数で順番に表示されます。
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-3">
                      <div>
                        <div className="text-sm font-medium">画面内に開始ボタンを出す</div>
                        <div className="text-xs text-black/50">撮影画面の下部に置きます。押すとボタンが消え、設定した秒数後に演出が始まります</div>
                      </div>
                      <Switch checked={showStartButton} onCheckedChange={setShowStartButton} />
                    </div>
                    {showStartButton && (
                      <div className="space-y-2">
                        <Label>開始ボタンで起こすこと</Label>
                        <select
                          value={startButtonAction}
                          onChange={(e) => setStartButtonAction(e.target.value as StartButtonAction)}
                          className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                        >
                          <option value="notifications">通知を再生（各通知の秒数どおり）</option>
                          <option value="incoming">着信（通話設定の開始秒数どおり）</option>
                          <option value="outgoing">発信（通話設定の開始秒数どおり）</option>
                        </select>
                        <p className="text-xs leading-relaxed text-black/45">
                          ボタンは押した瞬間に消えるので、そのまま撮影に入れます。設定画面を開き直すと、次のテイク用にまた表示されます。
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setNotificationDirection("top")} variant={notificationDirection === "top" ? "default" : "outline"} className="w-full">
                        <ChevronDown className="mr-2 h-4 w-4" />上から表示
                      </Button>
                      <Button onClick={() => setNotificationDirection("bottom")} variant={notificationDirection === "bottom" ? "default" : "outline"} className="w-full">
                        <ChevronUp className="mr-2 h-4 w-4" />下から表示
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-3">
                      <div>
                        <div className="text-sm font-medium">通知タイミングでバイブ</div>
                        <div className="text-xs text-black/50">通知が表示される瞬間に端末バイブを鳴らします</div>
                      </div>
                      <Switch checked={vibrateOnNotify} onCheckedChange={setVibrateOnNotify} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-3">
                      <div>
                        <div className="text-sm font-medium">通知タイミングで通知音</div>
                        <div className="text-xs text-black/50">任意の通知音やアップロード音源を再生できます</div>
                      </div>
                      <Switch checked={soundOnNotify} onCheckedChange={setSoundOnNotify} />
                    </div>
                    <div className="space-y-2">
                      <Label>通知音の種類</Label>
                      <select
                        value={notificationSoundPreset}
                        onChange={(e) => setNotificationSoundPreset(e.target.value as SoundPreset)}
                        className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                      >
                        <option value="classic">クラシック</option>
                        <option value="digital">デジタル</option>
                        <option value="soft">ソフト</option>
                        <option value="upload">アップロード音源</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>通知音データ</Label>
                      <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
                        <div className="mb-2 flex items-center gap-2 text-black/80">
                          <Clock3 className="h-4 w-4" />
                          音源を選択
                        </div>
                        <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg" onChange={handleSoundUpload} className="block w-full text-sm text-black/70" />
                      </label>
                      <div className="text-xs text-black/50">{uploadedSoundName || "音楽データや効果音をアップロードして使えます"}</div>
                      {uploadedSound && (
                        <Button onClick={() => { setUploadedSound(null); setUploadedSoundName(""); if (notificationSoundPreset === "upload") setNotificationSoundPreset("classic"); }} variant="outline" className="w-full">
                          アップロード音源を解除
                        </Button>
                      )}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={MessageSquareMore} title="通知一覧">
                  <div className="space-y-3">
                    {messages.length === 0 && <div className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-black/45">通知はまだありません。</div>}
                    {messages.map((msg, index) => (
                      <div key={msg.id} className="rounded-2xl border border-black/10 bg-[#fafafa] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-black/80">通知 #{index + 1} ・ {msg.sender || "未設定"}</div>
                            <div className="mt-1 text-xs text-black/50">{msg.appName} / {msg.groupName} / {msg.delaySeconds}秒後</div>
                          </div>
                          <Button onClick={() => deleteMessage(msg.id)} variant="outline" className="border-red-200 px-3 py-1.5 text-xs text-red-500">
                            <Trash2 className="mr-1 h-3.5 w-3.5" />削除
                          </Button>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-3">
                            <div>
                              <div className="text-sm font-medium">この通知を使う</div>
                              <div className="text-xs text-black/50">再生時に表示する / しないを切り替えます</div>
                            </div>
                            <Switch checked={msg.enabled} onCheckedChange={(value) => updateMessage(msg.id, "enabled", value)} />
                          </div>

                          <div className="space-y-2"><Label>アプリ名</Label><Input value={msg.appName} onChange={(e) => updateMessage(msg.id, "appName", e.target.value)} /></div>
                          <div className="space-y-2"><Label>グループ名</Label><Input value={msg.groupName} onChange={(e) => updateMessage(msg.id, "groupName", e.target.value)} /></div>
                          <div className="space-y-2"><Label>送信者名</Label><Input value={msg.sender} onChange={(e) => updateMessage(msg.id, "sender", e.target.value)} /></div>
                          <div className="space-y-2"><Label>本文</Label><Textarea value={msg.text} onChange={(e) => updateMessage(msg.id, "text", e.target.value)} className="min-h-[90px] resize-none" /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>通知時刻</Label><Input value={msg.time} onChange={(e) => updateMessage(msg.id, "time", e.target.value)} inputMode="numeric" /></div>
                            <div className="space-y-2"><Label>表示までの秒数</Label><Input type="number" min="0" step="0.1" value={msg.delaySeconds} onChange={(e) => updateMessage(msg.id, "delaySeconds", Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)} inputMode="decimal" /></div>
                          </div>
                          <div className="space-y-2"><Label>文字アイコン</Label><Input value={msg.iconText} onChange={(e) => updateMessage(msg.id, "iconText", e.target.value)} /></div>
                          <div className="space-y-2">
                            <Label>アイコン画像</Label>
                            <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
                              <div className="mb-2 flex items-center gap-2 text-black/80">
                                <ImageIcon className="h-4 w-4" />
                                画像を選択して変更
                              </div>
                              <input type="file" accept="image/*" onChange={(e) => handleExistingIconUpload(msg.id, e)} className="block w-full text-sm text-black/70" />
                            </label>
                            {msg.iconImage ? (
                              <div className="space-y-2">
                                <img src={msg.iconImage} alt="通知アイコン" className="h-16 w-16 rounded-2xl border border-black/10 object-cover" />
                                <Button onClick={() => updateMessage(msg.id, "iconImage", undefined)} variant="outline" className="w-full">アイコン画像を解除</Button>
                              </div>
                            ) : (
                              <div className="text-xs text-black/50">画像を設定しない場合は文字アイコンを使います</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard icon={PlusCircle} title="通知を追加">
                  <div className="space-y-2"><Label>グループ名</Label><Input value={groupName} onChange={(e) => { const next = e.target.value; setGroupName(next); setMessages((prev) => prev.map((m) => ({ ...m, groupName: next }))); }} placeholder="森田家" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>アプリ名</Label><Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} placeholder="LINE" /></div>
                    <div className="space-y-2"><Label>送信者名</Label><Input value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} placeholder="美咲" /></div>
                  </div>
                  <div className="space-y-2"><Label>メッセージ</Label><Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="メッセージ内容" className="min-h-[110px] resize-none" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>通知時刻</Label><Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="22:18" inputMode="numeric" /></div>
                    <div className="space-y-2"><Label>表示までの秒数</Label><Input type="number" min="0" step="0.1" value={form.delaySeconds} onChange={(e) => setForm({ ...form, delaySeconds: e.target.value })} placeholder="1" inputMode="decimal" /></div>
                  </div>
                  <div className="space-y-2"><Label>文字アイコン</Label><Input value={form.iconText} onChange={(e) => setForm({ ...form, iconText: e.target.value })} placeholder="森" /></div>
                  <FileInputRow label="アイコン画像" description="画像を選ばない場合は文字アイコンを使います" onChange={handleIconUpload} previewName={uploadedIcon ? "画像を選択済み" : undefined} />
                  <Button onClick={addMessage} className="w-full justify-center"><PlusCircle className="mr-2 h-4 w-4" />通知を追加</Button>
                </SectionCard>
              </div>
            )}

            {activeTab === "saved" && (
              <div className="space-y-4">
                <SectionCard icon={MessageSquareMore} title="通知画面を保存">
                  <div className="rounded-2xl bg-black/[0.04] p-3 text-xs leading-relaxed text-black/55">
                    通知内容・壁紙・ロック画面・通話設定を名前付きで保存できます。撮影カットごとに切り替えられます。
                  </div>
                  <div className="space-y-2"><Label>保存名</Label><Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="例：森田家_通知_夜" /></div>
                  <Button onClick={saveNotificationPresetAsNew} className="w-full justify-center">新規保存</Button>
                </SectionCard>

                <SectionCard icon={Clock3} title={`保存一覧 (${savedPresets.length})`}>
                  {savedPresets.length === 0 ? (
                    <div className="py-6 text-center text-sm text-black/45">保存済みの通知画面はありません</div>
                  ) : (
                    <div className="space-y-3">
                      {savedPresets.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-black/10 bg-[#fafafa] p-3">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-black/80">{item.name}</div>
                              <div className="mt-1 text-xs text-black/45">{new Date(item.updatedAt).toLocaleString("ja-JP")}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => loadNotificationPreset(item.id)} className="justify-center">読み込み</Button>
                            <Button onClick={() => overwriteNotificationPreset(item.id)} variant="outline" className="justify-center">上書き</Button>
                            <Button onClick={() => duplicateNotificationPreset(item.id)} variant="outline" className="justify-center">複製</Button>
                            <Button onClick={() => deleteNotificationPreset(item.id)} variant="outline" className="justify-center text-red-600">削除</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {activeTab === "modes" && (
              <div className="space-y-4">
                <SectionCard icon={Settings2} title="モード切り替え">
                  <div className="text-sm text-black/55">
                    各画面作成モードへ切り替えます。通知内容を保存してから切り替えると安心です。
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button onClick={() => router.push("/")} variant="outline" className="w-full justify-center">チャットモードへ</Button>
                    <Button className="w-full justify-center">通知画面モード</Button>
                    <Button onClick={() => router.push("/instagram")} variant="outline" className="w-full justify-center">Instagramモードへ</Button>
                    <Button onClick={() => router.push("/x")} variant="outline" className="w-full justify-center">Xモードへ</Button>
                    <Button onClick={() => router.push("/tiktok")} variant="outline" className="w-full justify-center">TikTokモードへ</Button>
                  </div>
                </SectionCard>
              </div>
            )}



            {activeTab === "screen" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={saveCurrentAsDefault} variant="outline" className="w-full justify-center">規定の設定にする</Button>
                  <Button onClick={resetToDefault} variant="outline" className="w-full justify-center">初期設定に戻す</Button>
                </div>

                <SectionCard icon={Settings2} title="画面操作">
                  <div className="space-y-2"><Label>ステータスバー時刻</Label><Input value={phoneTime} onChange={(e) => setPhoneTime(e.target.value)} placeholder="9:41" inputMode="numeric" /></div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">ステータスバー表示</div><div className="text-xs text-black/50">端末上部の時刻・電波アイコンを表示</div></div><Switch checked={showStatusBar} onCheckedChange={setShowStatusBar} /></div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                    <div>
                      <div className="text-sm font-medium">フルスクリーンモード</div>
                      <div className="text-xs text-black/50">ブラウザUIも隠して完全全画面にします。Chromeの案内は数秒後に自動で消えます</div>
                    </div>
                    <Switch checked={fullScreenMode} onCheckedChange={(value) => { void handleFullScreenModeChange(value); }} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                    <div>
                      <div className="text-sm font-medium">デバイスフレーム</div>
                      <div className="text-xs text-black/50">黒フチのスマホフレーム内で表示します。</div>
                    </div>
                    <Switch checked={deviceFrameMode} onCheckedChange={setDeviceFrameMode} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                    <div>
                      <div className="text-sm font-medium">右下の設定ボタン表示</div>
                      <div className="text-xs text-black/50">撮影前に消せます。非表示時も右下をタップすると再度開けます。</div>
                    </div>
                    <Switch checked={showSettingsButton} onCheckedChange={setShowSettingsButton} />
                  </div>
                  <Button onClick={() => setSettingsOpen(false)} className="w-full">設定を閉じて撮影画面に戻る</Button>
                </SectionCard>

                <SectionCard icon={Phone} title="通話：共通">
                  <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-xs leading-relaxed text-black/60">
                    発信（自分からかける）と着信（相手からかかってくる）は、下の2つのカードで別々に設定します。
                    名前・アイコン・秒数・音は、それぞれ独立して保存されます。
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                    <div>
                      <div className="text-sm font-medium">電話ボタンを表示</div>
                      <div className="text-xs text-black/50">画面左下の通話ボタン。押すと「発信」の設定で発信します</div>
                    </div>
                    <Switch checked={showCallButton} onCheckedChange={setShowCallButton} />
                  </div>
                  <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-3 text-xs text-black/55">
                    チャット画面側の通話演出を使いたいときは、下のボタンから連携できます。
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleOpenChatCallScreen("incoming", "voice")} variant="outline" className="w-full">チャット側で音声着信</Button>
                    <Button onClick={() => handleOpenChatCallScreen("outgoing", "voice")} variant="outline" className="w-full">チャット側で音声発信</Button>
                  </div>
                </SectionCard>

                <SectionCard icon={Phone} title="発信（自分からかける）">
                  <div className="space-y-2">
                    <Label>通話の種類</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setQuickCallMode("voice")} variant={quickCallMode === "voice" ? "default" : "outline"} className="w-full">音声発信</Button>
                      <Button onClick={() => setQuickCallMode("video")} variant={quickCallMode === "video" ? "default" : "outline"} className="w-full">ビデオ発信</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>発信までの秒数</Label><Input type="number" min="0" step="0.1" value={quickCallStartDelaySeconds} onChange={(e) => setQuickCallStartDelaySeconds(e.target.value)} /><div className="text-xs text-black/50">ボタンを押してから発信画面が出るまで</div></div>
                    <div className="space-y-2"><Label>通話中になるまでの秒数</Label><Input type="number" min="0" step="0.1" value={quickCallConnectSeconds} onChange={(e) => setQuickCallConnectSeconds(e.target.value)} /><div className="text-xs text-black/50">発信中から通話中に切り替わるまで</div></div>
                  </div>
                  <div className="space-y-2"><Label>相手の名前</Label><Input value={quickCallTitle} onChange={(e) => setQuickCallTitle(e.target.value)} placeholder="美咲" /></div>
                  <div className="space-y-2"><Label>相手のアイコン文字</Label><Input value={quickCallAvatarLabel} onChange={(e) => setQuickCallAvatarLabel(e.target.value.slice(0, 2))} placeholder="美" /></div>
                  <div className="space-y-2">
                    <Label>相手のアイコン画像</Label>
                    <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
                      <div className="mb-2 flex items-center gap-2 text-black/80"><ImageIcon className="h-4 w-4" />画像を選択して変更</div>
                      <input type="file" accept="image/*" onChange={handleQuickCallAvatarUpload} className="block w-full text-sm text-black/70" />
                    </label>
                    {quickCallAvatarImage ? (
                      <div className="space-y-2">
                        <img src={quickCallAvatarImage} alt="発信アイコン" className="h-16 w-16 rounded-2xl border border-black/10 object-cover" />
                        <Button onClick={() => setQuickCallAvatarImage(null)} variant="outline" className="w-full">アイコン画像を解除</Button>
                      </div>
                    ) : (
                      <div className="text-xs text-black/50">未設定なら文字アイコン、それも空なら通知の内容から自動で決まります</div>
                    )}
                  </div>
                  <div className="space-y-2"><Label>発信画面 背景色</Label><ColorSwatch value={outgoingCallBgColor} onChange={(e) => setOutgoingCallBgColor(e.target.value)} /></div>
                  <div className="space-y-2"><Label>発信画面の透明度</Label><Input type="range" min="0" max="1" step="0.01" value={outgoingCallBgOpacity} onChange={(e) => setOutgoingCallBgOpacity(Number(e.target.value))} /><div className="text-xs text-black/50">{Math.round(outgoingCallBgOpacity * 100)}%</div></div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">発信音</div><div className="text-xs text-black/50">発信中に鳴らす</div></div><Switch checked={outgoingToneEnabled} onCheckedChange={setOutgoingToneEnabled} /></div>
                  <div className="space-y-2"><Label>発信音の種類</Label><select value={outgoingToneType} onChange={(e) => setOutgoingToneType(e.target.value as OutgoingToneType)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"><option value="iphone">iPhone風</option><option value="line">LINE風</option><option value="custom">アップロード音源</option></select></div>
                  {outgoingToneType === "custom" && (
                    <div className="space-y-2">
                      <Label>発信音ファイル</Label>
                      <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
                        <div className="mb-2 flex items-center gap-2 text-black/80"><MessageSquareMore className="h-4 w-4" />音源をアップロード</div>
                        <input type="file" accept="audio/*" onChange={handleOutgoingToneUpload} className="block w-full text-sm text-black/70" />
                      </label>
                      <div className="text-xs text-black/50">{customOutgoingToneName || "mp3 / wav / m4a などが使えます"}</div>
                      {customOutgoingToneUrl && <Button onClick={() => { setCustomOutgoingToneUrl(null); setCustomOutgoingToneName(""); if (outgoingToneType === "custom") setOutgoingToneType("line"); }} variant="outline" className="w-full">発信音を解除</Button>}
                    </div>
                  )}
                  <Button onClick={startQuickOutgoingCall} className="w-full justify-center">{quickCallMode === "video" ? <Video className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}この設定で発信する</Button>
                </SectionCard>

                <SectionCard icon={PhoneOff} title="着信（相手からかかってくる）">
                  <div className="space-y-2">
                    <Label>通話の種類</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setIncomingCallMode("voice")} variant={incomingCallMode === "voice" ? "default" : "outline"} className="w-full">音声着信</Button>
                      <Button onClick={() => setIncomingCallMode("video")} variant={incomingCallMode === "video" ? "default" : "outline"} className="w-full">ビデオ着信</Button>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>着信までの秒数</Label><Input type="number" min="0" step="0.1" value={incomingStartDelaySeconds} onChange={(e) => setIncomingStartDelaySeconds(e.target.value)} /><div className="text-xs text-black/50">画面内の開始ボタンを押してから着信画面が出るまで</div></div>
                  <div className="space-y-2"><Label>相手の名前</Label><Input value={incomingCallTitle} onChange={(e) => setIncomingCallTitle(e.target.value)} placeholder="美咲" /></div>
                  <div className="space-y-2"><Label>相手のアイコン文字</Label><Input value={incomingCallAvatarLabel} onChange={(e) => setIncomingCallAvatarLabel(e.target.value.slice(0, 2))} placeholder="美" /></div>
                  <div className="space-y-2">
                    <Label>相手のアイコン画像</Label>
                    <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
                      <div className="mb-2 flex items-center gap-2 text-black/80"><ImageIcon className="h-4 w-4" />画像を選択して変更</div>
                      <input type="file" accept="image/*" onChange={handleIncomingCallAvatarUpload} className="block w-full text-sm text-black/70" />
                    </label>
                    {incomingCallAvatarImage ? (
                      <div className="space-y-2">
                        <img src={incomingCallAvatarImage} alt="着信アイコン" className="h-16 w-16 rounded-2xl border border-black/10 object-cover" />
                        <Button onClick={() => setIncomingCallAvatarImage(null)} variant="outline" className="w-full">アイコン画像を解除</Button>
                      </div>
                    ) : (
                      <div className="text-xs text-black/50">未設定なら文字アイコン、それも空なら通知の内容から自動で決まります</div>
                    )}
                  </div>
                  <div className="space-y-2"><Label>着信画面 背景色</Label><ColorSwatch value={incomingCallBgColor} onChange={(e) => setIncomingCallBgColor(e.target.value)} /></div>
                  <div className="space-y-2"><Label>着信画面の透明度</Label><Input type="range" min="0" max="1" step="0.01" value={incomingCallBgOpacity} onChange={(e) => setIncomingCallBgOpacity(Number(e.target.value))} /><div className="text-xs text-black/50">{Math.round(incomingCallBgOpacity * 100)}%</div></div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">着信音</div><div className="text-xs text-black/50">着信画面が出ている間に鳴らす</div></div><Switch checked={incomingToneEnabled} onCheckedChange={setIncomingToneEnabled} /></div>
                  <div className="space-y-2"><Label>着信音の種類</Label><select value={incomingToneType} onChange={(e) => setIncomingToneType(e.target.value as OutgoingToneType)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"><option value="iphone">iPhone風</option><option value="line">LINE風</option><option value="custom">アップロード音源</option></select></div>
                  {incomingToneType === "custom" && (
                    <div className="space-y-2">
                      <Label>着信音ファイル</Label>
                      <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
                        <div className="mb-2 flex items-center gap-2 text-black/80"><MessageSquareMore className="h-4 w-4" />音源をアップロード</div>
                        <input type="file" accept="audio/*" onChange={handleIncomingToneUpload} className="block w-full text-sm text-black/70" />
                      </label>
                      <div className="text-xs text-black/50">{customIncomingToneName || "mp3 / wav / m4a などが使えます"}</div>
                      {customIncomingToneUrl && <Button onClick={() => { setCustomIncomingToneUrl(null); setCustomIncomingToneName(""); if (incomingToneType === "custom") setIncomingToneType("iphone"); }} variant="outline" className="w-full">着信音を解除</Button>}
                    </div>
                  )}
                  <Button onClick={startQuickIncomingCall} className="w-full justify-center">{incomingCallMode === "video" ? <Video className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}この設定で着信する</Button>
                </SectionCard>


              </div>
            )}
          </div>
          </div>
        </div>
      )}

      <NotificationCallOverlay
        visible={callPhase !== "idle" && Boolean(callMode)}
        mode={callMode}
        phase={callPhase}
        title={activeCallProfile.title}
        avatarImage={activeCallProfile.avatarImage}
        avatarLabel={activeCallProfile.avatarLabel}
        backgroundColor={callOverlayBgColor}
        backgroundOpacity={callOverlayBgOpacity}
        onAccept={acceptNotificationCall}
        onDecline={endNotificationCall}
        onEnd={endNotificationCall}
      />

      {toastMessage && typeof document !== "undefined"
        ? (() => {
            const toastMeta = getToastMeta(toastMessage);

            return createPortal(
              <div className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-[9999] flex justify-center px-3">
                <div
                  className={`w-full max-w-md overflow-hidden rounded-2xl border bg-white/96 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-md ${toastMeta.borderClassName}`}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${toastMeta.iconClassName}`}
                    >
                      {toastMeta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold leading-5 text-slate-900">{toastMessage}</div>
                      <div className="mt-0.5 text-[11px] leading-4 text-slate-500">{toastMeta.subtitle}</div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-black/5">
                    <div className="h-full w-full bg-black/20" />
                  </div>
                </div>
              </div>,
              document.body,
            );
          })()
        : null}
    </div>
  );
}

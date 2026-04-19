"use client";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
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
  lockscreenDate: string;
  showLargeClock: boolean;
  groupName: string;
  selectedWallpaper: string;
  uploadedWallpaper: string | null;
  messages: Message[];
  showSettingsButton: boolean;
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

const STORAGE_KEY = "notification-mock-settings-v5";
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
  simple: "linear-gradient(180deg, #7b8188 0%, #3d4349 35%, #111111 100%)",
  red: "linear-gradient(180deg, #ff6b6b 0%, #b91c1c 45%, #220a0a 100%)",
  blue: "linear-gradient(180deg, #7dd3fc 0%, #2563eb 45%, #081226 100%)",
  green: "linear-gradient(180deg, #86efac 0%, #15803d 45%, #07170d 100%)",
  yellow: "linear-gradient(180deg, #fde68a 0%, #f59e0b 45%, #2b1903 100%)",
  purple: "linear-gradient(180deg, #d8b4fe 0%, #7c3aed 45%, #18072a 100%)",
  brown: "linear-gradient(180deg, #d4a86a 0%, #8b5e3c 45%, #1a0e00 100%)",
  pink: "linear-gradient(180deg, #f9a8d4 0%, #db2777 45%, #2a0018 100%)",
};

const osThemes: Record<
  OSType,
  {
    notificationCard: string;
    iconWrap: string;
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
    notificationCard: "rounded-[22px] border border-white/20 shadow-lg",
    iconWrap: "rounded-[12px] border border-white/40 text-black/80 shadow-sm",
    appText: "text-[12px] text-white/70 font-medium",
    groupText: "text-[14px] font-semibold text-white",
    senderText: "text-[13px] text-white/75",
    bodyText: "text-[14px] text-white/95",
    timeText: "text-[11px] text-white/55",
    topInset: "pt-[max(18px,env(safe-area-inset-top))]",
    largeClockTime: "text-[52px] font-semibold text-white tracking-[-0.03em]",
    largeClockDate: "mt-1 text-[15px] text-white/80",
    notificationsTopWithClock: "pt-[230px]",
    notificationsTopWithoutClock: "pt-[108px]",
    showNotch: true,
    showHomeBar: true,
  },
  android: {
    notificationCard: "rounded-[18px] border border-white/10 shadow-lg",
    iconWrap: "rounded-full border border-black/5 text-zinc-800 shadow-sm",
    appText: "text-[12px] text-white/65 font-medium",
    groupText: "text-[14px] font-semibold text-white",
    senderText: "text-[13px] text-white/70",
    bodyText: "text-[14px] text-white/90",
    timeText: "text-[11px] text-white/50",
    topInset: "pt-[max(14px,env(safe-area-inset-top))]",
    largeClockTime: "text-[46px] font-medium text-white tracking-[-0.02em]",
    largeClockDate: "mt-1 text-[14px] text-white/75",
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
  lockscreenDate: "4月23日 木曜日",
  showLargeClock: true,
  groupName: "森田家",
  selectedWallpaper: "simple",
  uploadedWallpaper: null,
  messages: defaultMessages,
  showSettingsButton: true,
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



function requestDocumentFullscreen() {
  if (typeof document === "undefined") return;
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  if (document.fullscreenElement) return;
  if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  }
}

function exitDocumentFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
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
    <div className={cn("px-5 pt-0.5", className)}>
      <div className="flex h-8 items-center justify-between text-[12px] font-semibold tracking-[-0.01em] opacity-[0.98] [text-shadow:0_1px_1px_rgba(0,0,0,0.12)]">
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

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
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
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("notification-mock-settings-v4") || window.localStorage.getItem("notification-mock-settings-v2");
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<NotificationSettings> & { messages?: any[] };
    return {
      ...defaultSettings,
      ...parsed,
      messages: normalizeMessages(parsed.messages),
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
      uploadedSound: typeof parsed.uploadedSound === "string" ? parsed.uploadedSound : defaultSettings.uploadedSound,
      uploadedSoundName: typeof parsed.uploadedSoundName === "string" ? parsed.uploadedSoundName : defaultSettings.uploadedSoundName,
      showCallButton: typeof parsed.showCallButton === "boolean" ? parsed.showCallButton : defaultSettings.showCallButton,
      quickCallMode: parsed.quickCallMode === "video" ? "video" : defaultSettings.quickCallMode,
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
  const [lockscreenDate, setLockscreenDate] = useState(defaultSettings.lockscreenDate);
  const [showLargeClock, setShowLargeClock] = useState(defaultSettings.showLargeClock);
  const [groupName, setGroupName] = useState(defaultSettings.groupName);
  const [selectedWallpaper, setSelectedWallpaper] = useState(defaultSettings.selectedWallpaper);
  const [uploadedWallpaper, setUploadedWallpaper] = useState<string | null>(defaultSettings.uploadedWallpaper);
  const [messages, setMessages] = useState<Message[]>(defaultSettings.messages);
  const [showSettingsButton, setShowSettingsButton] = useState(defaultSettings.showSettingsButton);
  const [notificationDirection, setNotificationDirection] = useState<NotificationDirection>(defaultSettings.notificationDirection);
  const [vibrateOnNotify, setVibrateOnNotify] = useState(defaultSettings.vibrateOnNotify);
  const [soundOnNotify, setSoundOnNotify] = useState(defaultSettings.soundOnNotify);
  const [notificationSoundPreset, setNotificationSoundPreset] = useState<SoundPreset>(defaultSettings.notificationSoundPreset);
  const [uploadedSound, setUploadedSound] = useState<string | null>(defaultSettings.uploadedSound);
  const [uploadedSoundName, setUploadedSoundName] = useState(defaultSettings.uploadedSoundName);
  const [fullScreenMode, setFullScreenMode] = useState(defaultSettings.fullScreenMode);
  const [deviceFrameMode, setDeviceFrameMode] = useState(defaultSettings.deviceFrameMode);
  const [showCallButton, setShowCallButton] = useState(defaultSettings.showCallButton);
  const [quickCallMode, setQuickCallMode] = useState<"voice" | "video">(defaultSettings.quickCallMode);
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
    setLockscreenDate(stored.lockscreenDate);
    setShowLargeClock(stored.showLargeClock);
    setGroupName(stored.groupName);
    setSelectedWallpaper(stored.selectedWallpaper);
    setUploadedWallpaper(stored.uploadedWallpaper);
    setMessages(stored.messages);
    setShowSettingsButton(stored.showSettingsButton);
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
      lockscreenDate,
      showLargeClock,
      groupName,
      selectedWallpaper,
      uploadedWallpaper,
      messages,
      showSettingsButton,
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    osType,
    phoneTime,
    showStatusBar,
    lockscreenTime,
    lockscreenDate,
    showLargeClock,
    groupName,
    selectedWallpaper,
    uploadedWallpaper,
    messages,
    showSettingsButton,
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

  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    if (fullScreenMode) {
      const handlePointer = () => {
        requestDocumentFullscreen();
      };
      document.addEventListener("pointerdown", handlePointer, { once: true });
      return () => document.removeEventListener("pointerdown", handlePointer);
    }
    exitDocumentFullscreen();
  }, [hydrated, fullScreenMode]);

  const theme = osThemes[osType];

  const bgStyle = useMemo<React.CSSProperties>(() => {
    if (selectedWallpaper === "upload" && uploadedWallpaper) {
      return { backgroundImage: `url(${uploadedWallpaper})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    return {
      backgroundImage: presetWallpapers[selectedWallpaper] ?? presetWallpapers.simple,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }, [selectedWallpaper, uploadedWallpaper]);

  const renderedNotifications = useMemo(() => {
    const enabledMessages = messages.filter((m) => m.enabled && m.displayed);
    const sorted = [...enabledMessages].sort((a, b) => a.delaySeconds - b.delaySeconds || a.id - b.id);
    return notificationDirection === "bottom" ? [...sorted].reverse() : sorted;
  }, [messages, notificationDirection]);

  const clearTimers = () => {
    playTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
    playTimeoutsRef.current = [];
  };

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

  const getCallProfile = () => {
    const source = [...messages].filter((msg) => msg.enabled).sort((a, b) => a.id - b.id).at(-1) ?? defaultMessages[0];
    const fallbackTitle = source?.sender?.trim() || source?.groupName?.trim() || groupName || "着信";
    const fallbackLabel = (source?.iconText?.trim() || source?.sender?.trim() || groupName || "着").slice(0, 2);
    return {
      title: quickCallTitle.trim() || fallbackTitle,
      avatarLabel: (quickCallAvatarLabel.trim() || fallbackLabel).slice(0, 2),
      avatarImage: quickCallAvatarImage || source?.iconImage || undefined,
    };
  };

  const startNotificationCall = (direction: "incoming" | "outgoing", mode: "voice" | "video", startDelaySeconds = 0) => {
    clearCallTimer();
    setSettingsOpen(false);
    if (fullScreenMode) requestDocumentFullscreen();

    const bootCall = () => {
      setCallDirection(direction);
      setCallMode(mode);
      if (direction === "incoming") {
        stopOutgoingTone();
        setCallPhase("incoming");
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
      showToast(`${delay}秒後に発信します`);
      callStartTimerRef.current = setTimeout(bootCall, delay * 1000);
    } else {
      bootCall();
    }
  };

  const startQuickOutgoingCall = () => {
    startNotificationCall("outgoing", quickCallMode, Number(quickCallStartDelaySeconds) || 0);
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
    const profile = getCallProfile();
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

  const handleWallpaperUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedWallpaper(reader.result);
        setSelectedWallpaper("upload");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleIconUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedIcon(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleQuickCallAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQuickCallAvatarImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOutgoingToneUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomOutgoingToneUrl(reader.result);
        setCustomOutgoingToneName(file.name);
        setOutgoingToneType("custom");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleExistingIconUpload = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, iconImage: reader.result as string } : msg)));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSoundUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedSound(reader.result);
        setUploadedSoundName(file.name);
        setNotificationSoundPreset("upload");
      }
    };
    reader.readAsDataURL(file);
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
    lockscreenDate,
    showLargeClock,
    groupName,
    selectedWallpaper,
    uploadedWallpaper,
    messages,
    showSettingsButton,
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
    setLockscreenDate(next.lockscreenDate);
    setShowLargeClock(next.showLargeClock);
    setGroupName(next.groupName);
    setSelectedWallpaper(next.selectedWallpaper);
    setUploadedWallpaper(next.uploadedWallpaper);
    setMessages(normalizeMessages(next.messages));
    setShowSettingsButton(next.showSettingsButton);
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
    if (fullScreenMode) requestDocumentFullscreen();
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
      lockscreenDate,
      showLargeClock,
      groupName,
      selectedWallpaper,
      uploadedWallpaper,
      messages,
      showSettingsButton,
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
    setLockscreenDate(defaultSettings.lockscreenDate);
    setShowLargeClock(defaultSettings.showLargeClock);
    setGroupName(defaultSettings.groupName);
    setSelectedWallpaper(defaultSettings.selectedWallpaper);
    setUploadedWallpaper(defaultSettings.uploadedWallpaper);
    setMessages(defaultSettings.messages);
    setShowSettingsButton(defaultSettings.showSettingsButton);
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

  const notifBg = osType === "iphone" ? "rgba(255,255,255,0.18)" : "rgba(30,30,30,0.52)";
  const iconBg = osType === "iphone" ? "rgba(255,255,255,0.78)" : "rgba(240,240,240,0.92)";
  const topStackClass = showLargeClock ? theme.notificationsTopWithClock : theme.notificationsTopWithoutClock;

  const callOverlayBgColor = callDirection === "incoming" ? incomingCallBgColor : outgoingCallBgColor;
  const callOverlayBgOpacity = callDirection === "incoming" ? incomingCallBgOpacity : outgoingCallBgOpacity;

  const stageContainerStyle: React.CSSProperties = {
    height: fullScreenMode ? "100dvh" : undefined,
    minHeight: fullScreenMode ? undefined : "100dvh",
    width: "100%",
    maxWidth: "100vw",
    overflow: fullScreenMode ? "hidden" : undefined,
    position: "relative",
  };
  const previewShellClassName = deviceFrameMode ? "p-4" : "p-0";
  const settingsButtonClassName = deviceFrameMode
    ? "absolute bottom-[max(18px,env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-2xl backdrop-blur-md transition hover:bg-black/55 active:scale-95"
    : "fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-2xl backdrop-blur-md transition hover:bg-black/55 active:scale-95";
  const phoneButtonClassName = deviceFrameMode
    ? "absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-white/[0.08] text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-white/[0.12] active:scale-95"
    : "fixed bottom-[max(18px,env(safe-area-inset-bottom))] left-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-white/[0.08] text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md transition hover:bg-white/[0.12] active:scale-95";
  const hiddenSettingsButtonClassName = deviceFrameMode
    ? "absolute bottom-0 right-0 z-10 h-20 w-20 opacity-0"
    : "fixed bottom-0 right-0 z-10 h-20 w-20 opacity-0";

  return (
    <div className={cn("flex flex-col bg-black", fullScreenMode ? "max-w-none" : "mx-auto max-w-md")} style={stageContainerStyle}>
      <div className={cn("relative flex-1 overflow-hidden", previewShellClassName)}>
        <div className={cn("relative h-full min-h-[100dvh] w-full overflow-hidden bg-black text-white", deviceFrameMode && "rounded-[32px] border border-white/10 shadow-2xl")}> 
          <div className="absolute inset-0" style={bgStyle} />
          <div className="absolute inset-0 bg-black/15" />

      {theme.showNotch && <div className="absolute left-1/2 top-3 z-20 h-[30px] w-[140px] -translate-x-1/2 rounded-full bg-black" />}

      {showStatusBar && (
        <PhoneStatusBar
          osType={osType}
          time={phoneTime}
          className={cn("absolute inset-x-0 top-0 z-20 pb-3 text-white", theme.topInset)}
        />
      )}

      {showLargeClock && (
        <div className="absolute inset-x-0 top-0 z-10 pt-[92px] text-center">
          <div className={theme.largeClockTime}>{lockscreenTime}</div>
          <div className={theme.largeClockDate}>{lockscreenDate}</div>
        </div>
      )}

      {notificationDirection === "top" ? (
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 h-full overflow-hidden px-4 pb-[max(18px,env(safe-area-inset-bottom))]",
            topStackClass,
          )}
        >
          <div className="space-y-3">
            {renderedNotifications.map((msg) => (
              <div
                key={`${msg.id}-${msg.animatedAt ?? "stable"}`}
                className={cn(
                  "px-4 py-3 backdrop-blur-md",
                  theme.notificationCard,
                  msg.animatedAt ? "notification-enter-top" : "",
                )}
                style={{ backgroundColor: notifBg }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn("flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-sm font-semibold", theme.iconWrap)}
                    style={{ backgroundColor: iconBg }}
                  >
                    {msg.iconImage ? <img src={msg.iconImage} alt="icon" className="h-full w-full object-cover" /> : <span>{msg.iconText || "森"}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={theme.appText}>{msg.appName}</div>
                      <div className={theme.timeText}>{msg.time}</div>
                    </div>
                    <div className={cn("mt-0.5 truncate", theme.groupText)}>{msg.groupName}</div>
                    <div className={cn("mt-0.5 truncate", theme.senderText)}>{msg.sender}</div>
                    <div className={cn("mt-0.5 break-words leading-snug", theme.bodyText)}>{msg.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(28px,calc(env(safe-area-inset-bottom)+28px))]">
          <div className="flex max-h-[48dvh] flex-col-reverse gap-3 overflow-hidden">
            {renderedNotifications.map((msg) => (
              <div
                key={`${msg.id}-${msg.animatedAt ?? "stable"}`}
                className={cn(
                  "pointer-events-auto px-4 py-3 backdrop-blur-md",
                  theme.notificationCard,
                  msg.animatedAt ? "notification-enter-bottom" : "",
                )}
                style={{ backgroundColor: notifBg }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn("flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-sm font-semibold", theme.iconWrap)}
                    style={{ backgroundColor: iconBg }}
                  >
                    {msg.iconImage ? <img src={msg.iconImage} alt="icon" className="h-full w-full object-cover" /> : <span>{msg.iconText || "森"}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={theme.appText}>{msg.appName}</div>
                      <div className={theme.timeText}>{msg.time}</div>
                    </div>
                    <div className={cn("mt-0.5 truncate", theme.groupText)}>{msg.groupName}</div>
                    <div className={cn("mt-0.5 truncate", theme.senderText)}>{msg.sender}</div>
                    <div className={cn("mt-0.5 break-words leading-snug", theme.bodyText)}>{msg.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {theme.showHomeBar && (
        <div
          className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-[5px] w-[140px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.75)" }}
        />
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
        <div className="fixed inset-0 z-50 bg-black/35">
          <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[86vh] w-full max-w-md flex-col rounded-t-[28px] bg-[#fafafa] px-4 pt-4 shadow-2xl text-black">
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
              <TabButton active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>画面</TabButton>
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
                </SectionCard>

                <SectionCard icon={ImageIcon} title="壁紙">
                  <div className="space-y-2">
                    <Label>プリセット壁紙</Label>
                    <select
                      value={selectedWallpaper}
                      onChange={(e) => setSelectedWallpaper(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    >
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
                  <FileInputRow label="壁紙画像" description="アップロードした画像を背景に使えます" onChange={handleWallpaperUpload} previewName={uploadedWallpaper ? "画像を選択済み" : undefined} />
                  {uploadedWallpaper && (
                    <Button onClick={() => { setUploadedWallpaper(null); setSelectedWallpaper("simple"); }} variant="outline" className="w-full">
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
                      <div className="text-xs text-black/50">余白や中央寄せを解除して、画面いっぱいに表示します。</div>
                    </div>
                    <Switch checked={fullScreenMode} onCheckedChange={(value) => { setFullScreenMode(value); if (value) requestDocumentFullscreen(); else exitDocumentFullscreen(); }} />
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

                <SectionCard icon={Phone} title="通話設定">
                  <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-xs text-black/60">
                    右下の電話ボタンから、今の設定でそのまま発信できます。名前・アイコン・秒数を決めておくと撮影で使いやすいです。
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                    <div>
                      <div className="text-sm font-medium">電話ボタンを表示</div>
                      <div className="text-xs text-black/50">画面左下に通話ボタンを表示します。</div>
                    </div>
                    <Switch checked={showCallButton} onCheckedChange={setShowCallButton} />
                  </div>
                  <div className="space-y-2">
                    <Label>通話の種類</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setQuickCallMode("voice")} variant={quickCallMode === "voice" ? "default" : "outline"} className="w-full">音声発信</Button>
                      <Button onClick={() => setQuickCallMode("video")} variant={quickCallMode === "video" ? "default" : "outline"} className="w-full">ビデオ発信</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>発信開始までの秒数</Label><Input type="number" min="0" step="0.1" value={quickCallStartDelaySeconds} onChange={(e) => setQuickCallStartDelaySeconds(e.target.value)} /><div className="text-xs text-black/50">電話ボタンを押してから発信画面が出るまで</div></div>
                    <div className="space-y-2"><Label>通話中になるまでの秒数</Label><Input type="number" min="0" step="0.1" value={quickCallConnectSeconds} onChange={(e) => setQuickCallConnectSeconds(e.target.value)} /><div className="text-xs text-black/50">発信中から通話中に切り替わるまで</div></div>
                  </div>
                  <div className="space-y-2"><Label>発信画面 背景色</Label><ColorSwatch value={outgoingCallBgColor} onChange={(e) => setOutgoingCallBgColor(e.target.value)} /></div>
                  <div className="space-y-2"><Label>発信画面の透明度</Label><Input type="range" min="0" max="1" step="0.01" value={outgoingCallBgOpacity} onChange={(e) => setOutgoingCallBgOpacity(Number(e.target.value))} /><div className="text-xs text-black/50">{Math.round(outgoingCallBgOpacity * 100)}%</div></div>
                  <div className="space-y-2"><Label>着信画面 背景色</Label><ColorSwatch value={incomingCallBgColor} onChange={(e) => setIncomingCallBgColor(e.target.value)} /></div>
                  <div className="space-y-2"><Label>着信画面の透明度</Label><Input type="range" min="0" max="1" step="0.01" value={incomingCallBgOpacity} onChange={(e) => setIncomingCallBgOpacity(Number(e.target.value))} /><div className="text-xs text-black/50">{Math.round(incomingCallBgOpacity * 100)}%</div></div>
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">発信音（ダミー）</div><div className="text-xs text-black/50">発信中に音を鳴らす</div></div><Switch checked={outgoingToneEnabled} onCheckedChange={setOutgoingToneEnabled} /></div>
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
                  <div className="space-y-2"><Label>相手の名前</Label><Input value={quickCallTitle} onChange={(e) => setQuickCallTitle(e.target.value)} placeholder="美咲" /></div>
                  <div className="space-y-2"><Label>相手のアイコン文字</Label><Input value={quickCallAvatarLabel} onChange={(e) => setQuickCallAvatarLabel(e.target.value.slice(0, 2))} placeholder="美" /></div>
                  <div className="space-y-2">
                    <Label>相手のアイコン画像</Label>
                    <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
                      <div className="mb-2 flex items-center gap-2 text-black/80">
                        <ImageIcon className="h-4 w-4" />
                        画像を選択して変更
                      </div>
                      <input type="file" accept="image/*" onChange={handleQuickCallAvatarUpload} className="block w-full text-sm text-black/70" />
                    </label>
                    {quickCallAvatarImage ? (
                      <div className="space-y-2">
                        <img src={quickCallAvatarImage} alt="通話アイコン" className="h-16 w-16 rounded-2xl border border-black/10 object-cover" />
                        <Button onClick={() => setQuickCallAvatarImage(null)} variant="outline" className="w-full">アイコン画像を解除</Button>
                      </div>
                    ) : (
                      <div className="text-xs text-black/50">画像を設定しない場合は文字アイコンを使います</div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button onClick={startQuickOutgoingCall} className="w-full justify-center">{quickCallMode === "video" ? <Video className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}今の設定で発信</Button>
                    <Button onClick={() => startNotificationCall("incoming", quickCallMode)} variant="outline" className="w-full justify-center">{quickCallMode === "video" ? <Video className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}今の設定で着信</Button>
                  </div>
                  <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-3 text-xs text-black/55">
                    チャット画面側の通話演出を使いたいときは、下のボタンから連携できます。
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleOpenChatCallScreen("incoming", "voice")} variant="outline" className="w-full">チャット側で音声着信</Button>
                    <Button onClick={() => handleOpenChatCallScreen("outgoing", "voice")} variant="outline" className="w-full">チャット側で音声発信</Button>
                  </div>
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
        title={getCallProfile().title}
        avatarImage={getCallProfile().avatarImage}
        avatarLabel={getCallProfile().avatarLabel}
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

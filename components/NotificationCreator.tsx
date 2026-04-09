"use client";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";

type OSType = "iphone" | "android";
type SettingsTab = "appearance" | "notifications" | "screen";
type NotificationDirection = "top" | "bottom";
type SoundPreset = "classic" | "digital" | "soft" | "upload";

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
};

const STORAGE_KEY = "notification-mock-settings-v3";

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
  phoneTime: "9:41",
  lockscreenTime: "9:41",
  lockscreenDate: "4月5日 日曜日",
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
};

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
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

function PhoneStatusBar({ osType, time, level = 100, className = "" }: { osType: OSType; time: string; level?: number; className?: string }) {
  if (osType === "iphone") {
    return (
      <div className={cn("flex items-center justify-between px-6 text-[13px] font-semibold tracking-[-0.01em] [text-shadow:0_1px_2px_rgba(0,0,0,0.22)]", className)}>
        <div className="min-w-[52px] pl-1 tabular-nums">{time}</div>
        <div className="flex items-center gap-1.5">
          <StatusCellDots className="h-[11px] w-[18px]" />
          <StatusWifi className="h-[11px] w-[17px]" />
          <StatusBattery className="h-[12px] w-[25px]" level={level} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between px-4 text-[13px] font-semibold tracking-[-0.015em] [text-shadow:0_1px_2px_rgba(0,0,0,0.18)]", className)}>
      <div className="flex items-center gap-2.5">
        <span className="tabular-nums">{time}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusSignal className="h-[12px] w-[18px] opacity-95" />
        <StatusWifi className="h-[12px] w-[18px] opacity-95" />
        <StatusBattery className="h-[12px] w-[26px] opacity-95" level={level} />
      </div>
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

function readStoredSettings(): NotificationSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("notification-mock-settings-v2");
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

  const [osType, setOsType] = useState<OSType>(defaultSettings.osType);
  const [phoneTime, setPhoneTime] = useState(defaultSettings.phoneTime);
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

  const [form, setForm] = useState({ appName: "LINE", sender: "", text: "", time: "", iconText: "森", delaySeconds: "1" });
  const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);

  const playTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = readStoredSettings();
    setOsType(stored.osType);
    setPhoneTime(stored.phoneTime);
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
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const payload: NotificationSettings = {
      osType,
      phoneTime,
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
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    osType,
    phoneTime,
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
  ]);

  useEffect(() => {
    return () => {
      playTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
      playTimeoutsRef.current = [];
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

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


  const handleWallpaperUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedWallpaper(URL.createObjectURL(file));
    setSelectedWallpaper("upload");
  };

  const handleIconUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedIcon(URL.createObjectURL(file));
  };


  const handleExistingIconUpload = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, iconImage: objectUrl } : msg)));
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

  const playNotifications = () => {
    clearTimers();
    setSettingsOpen(false);
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

  const resetToDefault = () => {
    clearTimers();
    setOsType(defaultSettings.osType);
    setPhoneTime(defaultSettings.phoneTime);
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
  };

  const notifBg = osType === "iphone" ? "rgba(255,255,255,0.18)" : "rgba(30,30,30,0.52)";
  const iconBg = osType === "iphone" ? "rgba(255,255,255,0.78)" : "rgba(240,240,240,0.92)";
  const topStackClass = showLargeClock ? theme.notificationsTopWithClock : theme.notificationsTopWithoutClock;

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

      <PhoneStatusBar
        osType={osType}
        time={phoneTime}
        className={cn("absolute inset-x-0 top-0 z-20 pb-3 text-white", theme.topInset)}
      />

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
        <div className="fixed inset-0 z-40 bg-[#f5f5f5] text-black">
          <div className="sticky top-0 z-20 border-b border-black/10 bg-[#f5f5f5]/95 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-black/70 transition hover:bg-black/[0.07]"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-sm font-semibold text-black/75">通知画面設定</div>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black/[0.04] px-4 text-sm font-medium text-black/70 transition hover:bg-black/[0.07] whitespace-nowrap"
                aria-label="チャット画面に戻る"
              >
                <span className="text-base">←</span>
                <span>チャット画面に戻る</span>
              </button>
            </div>
            <div className="grid grid-cols-3 rounded-2xl bg-black/5 p-1 text-center">
              <TabButton active={activeTab === "appearance"} onClick={() => setActiveTab("appearance")}>見た目</TabButton>
              <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")}>通知</TabButton>
              <TabButton active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>画面</TabButton>
            </div>
          </div>

          <div className="h-[calc(100dvh-116px)] overflow-y-auto px-4 py-4">
            {activeTab === "appearance" && (
              <div className="space-y-4">
                <SectionCard icon={Palette} title="端末・見た目">
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setOsType("iphone")} variant={osType === "iphone" ? "default" : "outline"} className="w-full">iPhone風</Button>
                    <Button onClick={() => setOsType("android")} variant={osType === "android" ? "default" : "outline"} className="w-full">Android風</Button>
                  </div>
                  <div className="space-y-2"><Label>ステータスバー時刻</Label><Input value={phoneTime} onChange={(e) => setPhoneTime(e.target.value)} placeholder="9:41" inputMode="numeric" /></div>
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

            {activeTab === "screen" && (
              <div className="space-y-4">
                <SectionCard icon={Settings2} title="画面操作">
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                    <div>
                      <div className="text-sm font-medium">フルスクリーンモード</div>
                      <div className="text-xs text-black/50">余白や中央寄せを解除して、画面いっぱいに表示します。</div>
                    </div>
                    <Switch checked={fullScreenMode} onCheckedChange={setFullScreenMode} />
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
                  <Button onClick={() => router.push("/")} variant="outline" className="w-full"><span className="mr-2">←</span>チャット画面へ戻る</Button>
                </SectionCard>

                <SectionCard icon={UserCircle2} title="リセット">
                  <div className="text-sm text-black/60">通知画面の見た目や通知内容を初期状態に戻します。</div>
                  <Button onClick={resetToDefault} variant="outline" className="w-full">通知画面を初期設定に戻す</Button>
                </SectionCard>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

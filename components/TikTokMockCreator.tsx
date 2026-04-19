"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  Heart,
  Home,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Palette,
  Plus,
  Search,
  Send,
  Settings2,
  Share2,
  Trash2,
  Upload,
  UserCircle2,
  X,
} from "lucide-react";

type TikTokThemeKey = "basic" | "dark";
type SettingsTab = "create" | "comments" | "saved" | "screen" | "modes";

type TikTokComment = {
  id: string;
  username: string;
  displayName: string;
  avatarLabel: string;
  avatarImage: string | null;
  text: string;
  likeCount: string;
  liked: boolean;
  time: string;
};

type TikTokSettings = {
  themeKey: TikTokThemeKey;
  appName: string;
  username: string;
  displayName: string;
  avatarLabel: string;
  avatarImage: string | null;
  mediaItems: string[];
  currentMediaIndex: number;
  caption: string;
  musicTitle: string;
  postTime: string;
  likeCount: string;
  commentCount: string;
  saveCount: string;
  shareCount: string;
  liked: boolean;
  saved: boolean;
  following: boolean;
  runtimeCommentUsername: string;
  runtimeCommentDisplayName: string;
  runtimeCommentAvatarLabel: string;
  runtimeCommentAvatarImage: string | null;
  runtimeCommentText: string;
  comments: TikTokComment[];
  deviceTime: string;
  fullScreenMode: boolean;
  deviceFrameMode: boolean;
  showStatusBar: boolean;
  showSettingsButton: boolean;
};

type SavedTikTokPreset = {
  id: string;
  name: string;
  updatedAt: number;
  settings: TikTokSettings;
};

const STORAGE_KEY = "tiktok-mock-settings-v1";
const DEFAULT_STORAGE_KEY = "tiktok-mock-default-settings-v1";
const SAVED_STORAGE_KEY = "tiktok-mock-saved-presets-v1";

const themes: Record<TikTokThemeKey, {
  label: string;
  root: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  overlay: string;
  button: string;
}> = {
  basic: {
    label: "基本",
    root: "bg-black",
    surface: "bg-white",
    text: "text-white",
    muted: "text-white/70",
    border: "border-white/15",
    overlay: "from-black/20 via-transparent to-black/80",
    button: "bg-white text-black",
  },
  dark: {
    label: "ダークテーマ",
    root: "bg-neutral-950",
    surface: "bg-neutral-950",
    text: "text-white",
    muted: "text-white/60",
    border: "border-white/10",
    overlay: "from-black/35 via-transparent to-black/90",
    button: "bg-white text-black",
  },
};

const defaultSettings: TikTokSettings = {
  themeKey: "basic",
  appName: "TokTok",
  username: "haru_scene",
  displayName: "春",
  avatarLabel: "春",
  avatarImage: null,
  mediaItems: [],
  currentMediaIndex: 0,
  caption: "今日の撮影、忘れられない一日になった。#film #shortdrama",
  musicTitle: "original sound - haru_scene",
  postTime: "2時間前",
  likeCount: "1280",
  commentCount: "24",
  saveCount: "58",
  shareCount: "13",
  liked: false,
  saved: false,
  following: false,
  runtimeCommentUsername: "guest_user",
  runtimeCommentDisplayName: "ゲスト",
  runtimeCommentAvatarLabel: "ゲ",
  runtimeCommentAvatarImage: null,
  runtimeCommentText: "この動画、空気感すごい",
  comments: [
    {
      id: "comment-1",
      username: "ren_movie",
      displayName: "蓮",
      avatarLabel: "蓮",
      avatarImage: null,
      text: "ラストの表情が良すぎる。",
      likeCount: "12",
      liked: false,
      time: "5分前",
    },
    {
      id: "comment-2",
      username: "mika_camera",
      displayName: "美香",
      avatarLabel: "美",
      avatarImage: null,
      text: "これ撮影用の画面とは思えない。",
      likeCount: "7",
      liked: false,
      time: "12分前",
    },
  ],
  deviceTime: "22:18",
  fullScreenMode: false,
  deviceFrameMode: false,
  showStatusBar: true,
  showSettingsButton: true,
};

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
const isVideoUrl = (url: string | null | undefined) => Boolean(url && (url.startsWith("data:video/") || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)));

function adjustCountText(value: string, delta: number) {
  const compact = value.replace(/,/g, "").trim();
  const number = Number.parseInt(compact, 10);
  if (!Number.isFinite(number)) return value;
  return String(Math.max(0, number + delta));
}

const readStoredSettings = (): TikTokSettings => {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    const merged = { ...defaultSettings, ...parsed } as TikTokSettings;
    if (merged.themeKey !== "dark") merged.themeKey = "basic";
    if (!Array.isArray(merged.mediaItems)) merged.mediaItems = [];
    merged.mediaItems = merged.mediaItems.slice(0, 4);
    if (!Array.isArray(merged.comments)) merged.comments = defaultSettings.comments;
    if (!Number.isFinite(Number(merged.currentMediaIndex))) merged.currentMediaIndex = 0;
    merged.currentMediaIndex = Math.max(0, Math.min(merged.currentMediaIndex, Math.max(merged.mediaItems.length - 1, 0)));
    return merged;
  } catch {
    return defaultSettings;
  }
};


const normalizeTikTokSettings = (value: Partial<TikTokSettings> | null | undefined): TikTokSettings => {
  const merged = { ...defaultSettings, ...(value || {}) } as TikTokSettings;
  if (merged.themeKey !== "dark") merged.themeKey = "basic";
  if (!Array.isArray(merged.mediaItems)) merged.mediaItems = [];
  merged.mediaItems = merged.mediaItems.slice(0, 4);
  if (!Array.isArray(merged.comments)) merged.comments = defaultSettings.comments;
  if (!Number.isFinite(Number(merged.currentMediaIndex))) merged.currentMediaIndex = 0;
  merged.currentMediaIndex = Math.max(0, Math.min(merged.currentMediaIndex, Math.max(merged.mediaItems.length - 1, 0)));
  return merged;
};

const readStoredDefaultSettings = (): TikTokSettings => {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(DEFAULT_STORAGE_KEY);
    return raw ? normalizeTikTokSettings(JSON.parse(raw)) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

const readSavedPresets = (): SavedTikTokPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => ({
      id: String(item?.id ?? `tiktok-preset-${index}`),
      name: String(item?.name ?? `保存TikTok ${index + 1}`),
      updatedAt: Number.isFinite(Number(item?.updatedAt)) ? Number(item.updatedAt) : Date.now(),
      settings: { ...defaultSettings, ...(item?.settings || {}) } as TikTokSettings,
    }));
  } catch {
    return [];
  }
};

function Button({ children, className = "", variant = "default", type = "button", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "dark" }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles = variant === "outline" ? "border border-black/10 bg-white text-black hover:bg-black/[0.03]" : variant === "dark" ? "bg-black text-white hover:bg-black/85" : "bg-[#06C755] text-white hover:brightness-95";
  return <button type={type} className={cn(base, styles, className)} {...props}>{children}</button>;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} autoComplete="off" className={cn("w-full min-w-0 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5", className)} />;
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-[96px] w-full min-w-0 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5", className)} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-black/80">{children}</label>;
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (next: boolean) => void }) {
  return (
    <button type="button" onClick={() => onCheckedChange(!checked)} className={cn("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-[#06C755]" : "bg-black/15")} aria-pressed={checked}>
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition", checked ? "left-6" : "left-1")} />
    </button>
  );
}

function FileButton({ children, accept, onFile }: { children: React.ReactNode; accept: string; onFile: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition active:scale-[0.98]">
      <Upload className="mr-2 h-4 w-4" />
      {children}
      <input type="file" accept={accept} onChange={onFile} className="hidden" />
    </label>
  );
}

function MultiFileButton({ children, accept, onFiles }: { children: React.ReactNode; accept: string; onFiles: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition active:scale-[0.98]">
      <Upload className="mr-2 h-4 w-4" />
      {children}
      <input type="file" accept={accept} multiple onChange={onFiles} className="hidden" />
    </label>
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
    <button type="button" onClick={onClick} className={cn("rounded-2xl px-2 py-2 text-xs font-medium transition", active ? "bg-white text-black shadow-sm" : "text-black/55")}>
      {children}
    </button>
  );
}

function Avatar({ label, image, size = "h-10 w-10" }: { label: string; image: string | null; size?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 via-pink-500 to-red-500 text-sm font-bold text-white", size)}>
      {image ? <img src={image} alt="avatar" className="h-full w-full object-cover" /> : <span>{label || "T"}</span>}
    </div>
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

function StatusBar({ time, className = "text-white" }: { time: string; className?: string }) {
  return (
    <div className={cn("px-5 pt-0.5", className)}>
      <div className="flex h-8 items-center justify-between text-[12px] font-semibold tracking-[-0.01em] opacity-[0.98] [text-shadow:0_1px_1px_rgba(0,0,0,0.4)]">
        <span className="tabular-nums">{time}</span>
        <div className="flex items-center gap-1.5">
          <StatusCellDots className="h-[10px] w-[17px]" />
          <StatusWifi className="h-[10px] w-[16px]" />
          <StatusBattery className="h-[11px] w-[24px]" level={100} />
        </div>
      </div>
    </div>
  );
}

function MediaView({ url, className = "" }: { url: string | null; className?: string }) {
  if (!url) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-black text-white/50", className)}>
        <div className="text-center text-sm">
          <ImageIcon className="mx-auto mb-2 h-10 w-10" />
          動画 / 画像をアップロード
        </div>
      </div>
    );
  }
  if (isVideoUrl(url)) {
    return <video src={url} className={cn("h-full w-full object-cover", className)} autoPlay loop muted playsInline />;
  }
  return <img src={url} alt="投稿メディア" className={cn("h-full w-full object-cover", className)} />;
}

function ActionButton({ icon, count, active, onClick, label }: { icon: React.ReactNode; count: string; active?: boolean; onClick?: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 text-white drop-shadow" aria-label={label}>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-black/25 backdrop-blur", active && "text-red-500")}>{icon}</div>
      <span className="text-[11px] font-semibold leading-none">{count}</span>
    </button>
  );
}

function TikTokScreen({ settings, setSettings, onOpenSettings, commentsOpen, setCommentsOpen, isFullScreen }: {
  settings: TikTokSettings;
  setSettings: React.Dispatch<React.SetStateAction<TikTokSettings>>;
  onOpenSettings: () => void;
  commentsOpen: boolean;
  setCommentsOpen: (next: boolean) => void;
  isFullScreen: boolean;
}) {
  const theme = themes[settings.themeKey] || themes.basic;
  const media = (settings.mediaItems || []).slice(0, 4);
  const currentUrl = media[settings.currentMediaIndex] || null;
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const goMedia = (delta: number) => {
    if (media.length <= 1) return;
    setSettings((prev) => ({ ...prev, currentMediaIndex: (prev.currentMediaIndex + delta + media.length) % media.length }));
  };
  const handleTouchEnd = (event: any) => {
    if (touchStartX === null || media.length <= 1) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const distance = touchEndX - touchStartX;
    if (Math.abs(distance) > 45) {
      goMedia(distance > 0 ? -1 : 1);
    }
    setTouchStartX(null);
  };

  const toggleLike = () => {
    setSettings((prev) => ({ ...prev, liked: !prev.liked, likeCount: adjustCountText(prev.likeCount, prev.liked ? -1 : 1) }));
  };

  const toggleSave = () => {
    setSettings((prev) => ({ ...prev, saved: !prev.saved, saveCount: adjustCountText(prev.saveCount, prev.saved ? -1 : 1) }));
  };

  return (
    <div
      className={cn("relative h-full min-h-0 w-full overflow-hidden", theme.root, theme.text)}
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={handleTouchEnd}
    >
      <MediaView url={currentUrl} />
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b", theme.overlay)} />

      {settings.showStatusBar && <div className="absolute left-0 right-0 top-0 z-20"><StatusBar time={settings.deviceTime} /></div>}

      <header className={cn("absolute left-0 right-0 z-20 px-3", settings.showStatusBar ? "top-9" : "top-3")}>
        <div className="grid grid-cols-[54px_1fr_88px] items-center gap-1 text-white drop-shadow">
          <div className="flex items-center">
            <span className="rounded-full border border-white/70 px-2 py-0.5 text-[11px] font-extrabold leading-none tracking-tight">LIVE</span>
          </div>
          <div className="flex min-w-0 items-center justify-center gap-3 overflow-hidden text-[13px] font-bold text-white/70">
            {["探す", "ミニドラマ", "フォロー中", "ショップ", "おすすめ"].map((label) => (
              <span key={label} className={cn("relative shrink-0 pb-1", label === "おすすめ" && "text-white")}>
                {label}
                {label === "おすすめ" && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-white" />}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur" aria-label="検索">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" onClick={onOpenSettings} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur" aria-label="設定">
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {media.length > 1 && (
        <>
          <button type="button" onClick={() => goMedia(-1)} className="absolute left-0 top-20 z-10 h-[calc(100%-160px)] w-1/3" aria-label="前のメディア" />
          <button type="button" onClick={() => goMedia(1)} className="absolute right-0 top-20 z-10 h-[calc(100%-160px)] w-1/3" aria-label="次のメディア" />
          <div className={cn("absolute right-4 z-20 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur", settings.showStatusBar ? "top-[88px]" : "top-[52px]")}>
            {settings.currentMediaIndex + 1}/{media.length}
          </div>
          <div className="absolute left-1/2 top-20 z-20 flex -translate-x-1/2 gap-1">
            {media.map((_, index) => <span key={index} className={cn("h-1.5 w-1.5 rounded-full", index === settings.currentMediaIndex ? "bg-white" : "bg-white/35")} />)}
          </div>
        </>
      )}

      <div className="absolute bottom-20 right-3 z-20 flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar label={settings.avatarLabel} image={settings.avatarImage} size="h-12 w-12" />
          <button type="button" onClick={() => setSettings((prev) => ({ ...prev, following: !prev.following }))} className={cn("absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-white shadow", settings.following ? "bg-neutral-700" : "bg-red-500")}>
            {settings.following ? "✓" : <Plus className="h-4 w-4" />}
          </button>
        </div>
        <ActionButton icon={<Heart className={cn("h-7 w-7", settings.liked && "fill-current")} />} count={settings.likeCount} active={settings.liked} onClick={toggleLike} label="いいね" />
        <ActionButton icon={<MessageCircle className="h-7 w-7" />} count={settings.commentCount || "0"} onClick={() => setCommentsOpen(true)} label="コメント" />
        <ActionButton icon={<Bookmark className={cn("h-7 w-7", settings.saved && "fill-current")} />} count={settings.saveCount} active={settings.saved} onClick={toggleSave} label="保存" />
        <ActionButton icon={<Share2 className="h-7 w-7" />} count={settings.shareCount} label="シェア" />
      </div>

      <div className="absolute bottom-16 left-4 right-20 z-20 space-y-2 text-white drop-shadow">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">@{settings.username}</span>
          <span className="text-xs text-white/65">{settings.postTime}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{settings.caption}</p>
        <div className="flex items-center gap-2 text-xs text-white/85">
          <Music2 className="h-4 w-4" />
          <span className="truncate">{settings.musicTitle}</span>
        </div>
      </div>

      <nav className="absolute bottom-0 left-0 right-0 z-20 grid h-14 grid-cols-5 items-center border-t border-white/10 bg-black/35 text-white backdrop-blur-md">
        <button className="flex flex-col items-center gap-0.5 text-[10px]"><Home className="h-5 w-5" />ホーム</button>
        <button className="flex flex-col items-center gap-0.5 text-[10px]"><UserCircle2 className="h-5 w-5" />友達</button>
        <button className="mx-auto flex flex-col items-center gap-0.5 text-[10px]">
          <span className="flex h-8 w-12 items-center justify-center rounded-xl bg-white text-black"><Plus className="h-5 w-5" /></span>
          投稿
        </button>
        <button className="flex flex-col items-center gap-0.5 text-[10px]"><MessageCircle className="h-5 w-5" />メッセージ</button>
        <button className="flex flex-col items-center gap-0.5 text-[10px]"><UserCircle2 className="h-5 w-5" />プロフィール</button>
      </nav>

      {commentsOpen && <CommentsSheet settings={settings} setSettings={setSettings} onClose={() => setCommentsOpen(false)} />}
    </div>
  );
}

function CommentsSheet({ settings, setSettings, onClose }: { settings: TikTokSettings; setSettings: React.Dispatch<React.SetStateAction<TikTokSettings>>; onClose: () => void }) {
  const sendComment = () => {
    const text = settings.runtimeCommentText.trim();
    if (!text) return;
    const comment: TikTokComment = {
      id: `comment-${Date.now()}`,
      username: settings.runtimeCommentUsername || "guest_user",
      displayName: settings.runtimeCommentDisplayName || "ゲスト",
      avatarLabel: settings.runtimeCommentAvatarLabel || "ゲ",
      avatarImage: settings.runtimeCommentAvatarImage || null,
      text,
      likeCount: "0",
      liked: false,
      time: "たった今",
    };
    setSettings((prev) => ({ ...prev, comments: [comment, ...prev.comments], commentCount: adjustCountText(prev.commentCount, 1), runtimeCommentText: "" }));
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/25">
      <div className="max-h-[72%] w-full overflow-hidden rounded-t-[28px] bg-white text-black shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <div className="w-9" />
          <div className="text-sm font-bold">コメント {settings.commentCount || "0"}件</div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[42vh] space-y-4 overflow-y-auto px-4 py-4">
          {settings.comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar label={comment.avatarLabel} image={comment.avatarImage} size="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-black/45"><span className="font-semibold text-black/60">{comment.username}</span><span>{comment.time}</span></div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{comment.text}</p>
              </div>
              <button type="button" onClick={() => setSettings((prev) => ({ ...prev, comments: prev.comments.map((item) => item.id === comment.id ? { ...item, liked: !item.liked, likeCount: adjustCountText(item.likeCount, item.liked ? -1 : 1) } : item) }))} className={cn("flex flex-col items-center text-[11px] text-black/45", comment.liked && "text-red-500")}>
                <Heart className={cn("h-4 w-4", comment.liked && "fill-current")} />
                {comment.likeCount}
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-black/10 px-3 py-3">
          <Avatar label={settings.runtimeCommentAvatarLabel} image={settings.runtimeCommentAvatarImage} size="h-8 w-8" />
          <Input value={settings.runtimeCommentText} onChange={(e) => setSettings((prev) => ({ ...prev, runtimeCommentText: e.target.value }))} placeholder="コメントを追加" className="rounded-full" />
          <button type="button" onClick={sendComment} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

export default function TikTokMockCreator() {
  const router = useRouter();
  const [settings, setSettings] = useState<TikTokSettings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("create");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SavedTikTokPreset[]>([]);
  const [presetName, setPresetName] = useState("TikTok撮影用");

  useEffect(() => {
    setSettings(readStoredSettings());
    setSavedPresets(readSavedPresets());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // 動画など大きいファイルはブラウザの保存容量を超えることがあるため、
      // 画面上の表示は維持しつつ、保存時だけメディアを除外してクラッシュを防ぐ。
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, mediaItems: [], currentMediaIndex: 0 }));
      } catch {
        // 保存できない場合も撮影用プレビューは継続する。
      }
    }
  }, [settings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedPresets));
    } catch {
      const slimPresets = savedPresets.map((preset) => ({
        ...preset,
        settings: { ...preset.settings, mediaItems: [], currentMediaIndex: 0 },
      }));
      try {
        window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(slimPresets));
      } catch {
        // 保存容量超過時は無視する。
      }
    }
  }, [savedPresets, isHydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const isBrowserFullscreen = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
      if (!isBrowserFullscreen) {
        setSettings((prev) => prev.fullScreenMode ? { ...prev, fullScreenMode: false } : prev);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener);
    };
  }, []);

  const update = <K extends keyof TikTokSettings>(key: K, value: TikTokSettings[K]) => setSettings((prev) => ({ ...prev, [key]: value }));

  const requestBrowserFullscreen = async (enabled: boolean) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    const doc = document as Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };
    try {
      if (enabled) {
        if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
          const request = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root);
          await request?.();
        }
      } else if (document.fullscreenElement || doc.webkitFullscreenElement) {
        const exit = document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(doc);
        await exit?.();
      }
    } catch {
      // ブラウザ側で許可されない場合も、アプリ内の撮影用表示は切り替える。
    }
  };


  const saveCurrentAsDefaultSettings = () => {
    try { window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(settings)); } catch {}
  };

  const resetToStoredDefaultSettings = () => {
    setSettings(readStoredDefaultSettings());
  };

  const resetToInitialSettings = () => {
    try { window.localStorage.removeItem(DEFAULT_STORAGE_KEY); } catch {}
    setSettings(defaultSettings);
  };

  const setFullScreenMode = (value: boolean) => {
    update("fullScreenMode", value);
    void requestBrowserFullscreen(value);
  };

  const readFile = (file: File, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFile(file, (url) => update("avatarImage", url));
    event.target.value = "";
  };

  const onRuntimeAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFile(file, (url) => update("runtimeCommentAvatarImage", url));
    event.target.value = "";
  };

  const onMediaFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setSettings((prev) => {
      const remaining = Math.max(0, 4 - prev.mediaItems.length);
      if (remaining === 0) return prev;
      Promise.all(files.slice(0, remaining).map((file) => new Promise<string>((resolve) => readFile(file, resolve)))).then((urls) => {
        setSettings((current) => ({
          ...current,
          mediaItems: [...current.mediaItems, ...urls].slice(0, 4),
          currentMediaIndex: current.mediaItems.length ? Math.min(current.currentMediaIndex, 3) : 0,
        }));
      });
      return prev;
    });
    event.target.value = "";
  };

  const savePreset = () => {
    const name = presetName.trim() || `TikTok保存 ${savedPresets.length + 1}`;
    const preset: SavedTikTokPreset = { id: `tiktok-${Date.now()}`, name, updatedAt: Date.now(), settings };
    setSavedPresets((prev) => [preset, ...prev]);
  };

  const overwritePreset = (id: string) => {
    setSavedPresets((prev) => prev.map((preset) => preset.id === id ? { ...preset, settings, updatedAt: Date.now() } : preset));
  };

  const duplicatePreset = (preset: SavedTikTokPreset) => {
    setSavedPresets((prev) => [{ ...preset, id: `tiktok-${Date.now()}`, name: `${preset.name} コピー`, updatedAt: Date.now() }, ...prev]);
  };

  const deletePreset = (id: string) => setSavedPresets((prev) => prev.filter((preset) => preset.id !== id));

  const screen = (
    <TikTokScreen
      settings={settings}
      setSettings={setSettings}
      onOpenSettings={() => setSettingsOpen(true)}
      commentsOpen={commentsOpen}
      setCommentsOpen={setCommentsOpen}
      isFullScreen={settings.fullScreenMode}
    />
  );

  return (
    <main className={cn("min-h-screen overflow-hidden bg-black", settings.fullScreenMode ? "fixed inset-0 z-50" : "")}>
      <div className={cn("relative flex h-[100dvh] w-full flex-col bg-black", settings.fullScreenMode ? "max-w-none" : "mx-auto max-w-md")}>
        <div className={cn("relative flex-1 overflow-hidden", settings.deviceFrameMode ? "p-4" : "p-0")}>
          <div className={cn("relative h-full min-h-0 w-full overflow-hidden bg-black text-white", settings.deviceFrameMode && "rounded-[32px] border border-white/10 shadow-2xl")}>
            {screen}
          </div>
        </div>

        {settings.showSettingsButton && (
          <button type="button" onClick={() => setSettingsOpen(true)} className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-2xl ring-1 ring-white/20" aria-label="設定を開く">
            <Settings2 className="h-6 w-6" />
          </button>
        )}

        {settingsOpen && (
          <div className="fixed inset-0 z-[70] flex items-end bg-black/35 md:items-center md:justify-center">
            <div className="max-h-[88vh] w-full overflow-hidden rounded-t-[28px] bg-[#f6f6f6] shadow-2xl md:max-w-[520px] md:rounded-[28px]">
              <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
                <div className="w-10" />
                <div className="text-base font-bold">設定</div>
                <button type="button" onClick={() => setSettingsOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-black"><X className="h-5 w-5" /></button>
              </div>

              <div className="border-b border-black/10 bg-[#f0f0f0] px-3 py-2">
                <div className="grid grid-cols-5 gap-1 rounded-3xl bg-black/[0.04] p-1">
                  <TabButton active={activeTab === "create"} onClick={() => setActiveTab("create")}>作成</TabButton>
                  <TabButton active={activeTab === "comments"} onClick={() => setActiveTab("comments")}>コメント</TabButton>
                  <TabButton active={activeTab === "saved"} onClick={() => setActiveTab("saved")}>保存</TabButton>
                  <TabButton active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>画面</TabButton>
                  <TabButton active={activeTab === "modes"} onClick={() => setActiveTab("modes")}>モード</TabButton>
                </div>
              </div>

              <div className="max-h-[68vh] space-y-4 overflow-y-auto overflow-x-hidden p-4">
                {activeTab === "create" && (
                  <>
                    <SectionCard icon={Palette} title="基本設定">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>アプリ名</Label><Input value={settings.appName} onChange={(e) => update("appName", e.target.value)} /></div>
                        <div className="space-y-1"><Label>テーマ</Label><select value={settings.themeKey} onChange={(e) => update("themeKey", e.target.value as TikTokThemeKey)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm">{Object.entries(themes).map(([key, theme]) => <option key={key} value={key}>{theme.label}</option>)}</select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>表示名</Label><Input value={settings.displayName} onChange={(e) => update("displayName", e.target.value)} /></div>
                        <div className="space-y-1"><Label>ユーザー名</Label><Input value={settings.username} onChange={(e) => update("username", e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                        <div className="space-y-1"><Label>アイコン文字</Label><Input value={settings.avatarLabel} onChange={(e) => update("avatarLabel", e.target.value)} /></div>
                        <FileButton accept="image/*" onFile={onAvatarFile}>アイコン画像</FileButton>
                      </div>
                      {settings.avatarImage && <Button variant="outline" onClick={() => update("avatarImage", null)} className="w-full">アイコン画像を削除</Button>}
                    </SectionCard>

                    <SectionCard icon={ImageIcon} title="投稿メディア">
                      <div className="flex flex-wrap gap-2">
                        <MultiFileButton accept="image/*,video/*" onFiles={onMediaFiles}>画像 / 動画を追加（最大4）</MultiFileButton>
                        <Button variant="outline" onClick={() => update("mediaItems", [])}>全削除</Button>
                      </div>
                      {settings.mediaItems.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {settings.mediaItems.map((item, index) => (
                            <button key={`${item}-${index}`} type="button" onClick={() => update("currentMediaIndex", index)} className={cn("relative aspect-[9/16] overflow-hidden rounded-2xl border", index === settings.currentMediaIndex ? "border-black" : "border-black/10")}> 
                              <MediaView url={item} />
                              <span className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{index + 1}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard icon={Music2} title="投稿内容">
                      <div className="space-y-1"><Label>キャプション</Label><Textarea value={settings.caption} onChange={(e) => update("caption", e.target.value)} /></div>
                      <div className="space-y-1"><Label>音源表記</Label><Input value={settings.musicTitle} onChange={(e) => update("musicTitle", e.target.value)} /></div>
                      <div className="space-y-1"><Label>投稿時間</Label><Input value={settings.postTime} onChange={(e) => update("postTime", e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>いいね数</Label><Input value={settings.likeCount} onChange={(e) => update("likeCount", e.target.value)} /></div>
                        <div className="space-y-1"><Label>コメント数</Label><Input value={settings.commentCount} onChange={(e) => update("commentCount", e.target.value)} /></div>
                        <div className="space-y-1"><Label>保存数</Label><Input value={settings.saveCount} onChange={(e) => update("saveCount", e.target.value)} /></div>
                        <div className="space-y-1"><Label>シェア数</Label><Input value={settings.shareCount} onChange={(e) => update("shareCount", e.target.value)} /></div>
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">いいね済み</div><div className="text-xs text-black/50">ハートを赤く表示</div></div><Switch checked={settings.liked} onCheckedChange={(value) => update("liked", value)} /></div>
                        <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">保存済み</div><div className="text-xs text-black/50">保存アイコンをON表示</div></div><Switch checked={settings.saved} onCheckedChange={(value) => update("saved", value)} /></div>
                        <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">フォロー中</div><div className="text-xs text-black/50">プロフィール横の＋をチェック表示</div></div><Switch checked={settings.following} onCheckedChange={(value) => update("following", value)} /></div>
                      </div>
                    </SectionCard>
                  </>
                )}

                {activeTab === "comments" && (
                  <>
                    <SectionCard icon={MessageCircle} title="送信ユーザー">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>表示名</Label><Input value={settings.runtimeCommentDisplayName} onChange={(e) => update("runtimeCommentDisplayName", e.target.value)} /></div>
                        <div className="space-y-1"><Label>ユーザー名</Label><Input value={settings.runtimeCommentUsername} onChange={(e) => update("runtimeCommentUsername", e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                        <div className="space-y-1"><Label>アイコン文字</Label><Input value={settings.runtimeCommentAvatarLabel} onChange={(e) => update("runtimeCommentAvatarLabel", e.target.value)} /></div>
                        <FileButton accept="image/*" onFile={onRuntimeAvatarFile}>アイコン画像</FileButton>
                      </div>
                    </SectionCard>
                    <SectionCard icon={MessageCircle} title="コメント一覧">
                      {settings.comments.map((comment) => (
                        <div key={comment.id} className="space-y-2 rounded-2xl border border-black/10 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={comment.displayName} onChange={(e) => setSettings((prev) => ({ ...prev, comments: prev.comments.map((item) => item.id === comment.id ? { ...item, displayName: e.target.value } : item) }))} placeholder="表示名" />
                            <Input value={comment.username} onChange={(e) => setSettings((prev) => ({ ...prev, comments: prev.comments.map((item) => item.id === comment.id ? { ...item, username: e.target.value } : item) }))} placeholder="ユーザー名" />
                          </div>
                          <Textarea value={comment.text} onChange={(e) => setSettings((prev) => ({ ...prev, comments: prev.comments.map((item) => item.id === comment.id ? { ...item, text: e.target.value } : item) }))} />
                          <div className="grid grid-cols-3 gap-2">
                            <Input value={comment.time} onChange={(e) => setSettings((prev) => ({ ...prev, comments: prev.comments.map((item) => item.id === comment.id ? { ...item, time: e.target.value } : item) }))} placeholder="時間" />
                            <Input value={comment.likeCount} onChange={(e) => setSettings((prev) => ({ ...prev, comments: prev.comments.map((item) => item.id === comment.id ? { ...item, likeCount: e.target.value } : item) }))} placeholder="いいね" />
                            <Button variant="outline" onClick={() => setSettings((prev) => ({ ...prev, comments: prev.comments.filter((item) => item.id !== comment.id) }))}><Trash2 className="mr-1 h-4 w-4" />削除</Button>
                          </div>
                        </div>
                      ))}
                      <Button className="w-full" onClick={() => setSettings((prev) => ({ ...prev, comments: [{ ...defaultSettings.comments[0], id: `comment-${Date.now()}` }, ...prev.comments] }))}>コメントを追加</Button>
                    </SectionCard>
                  </>
                )}

                {activeTab === "saved" && (
                  <SectionCard icon={Bookmark} title="保存">
                    <div className="grid grid-cols-[1fr_auto] gap-2"><Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="保存名" /><Button onClick={savePreset}>保存</Button></div>
                    {savedPresets.length === 0 ? <p className="text-sm text-black/50">保存データはまだありません。</p> : savedPresets.map((preset) => (
                      <div key={preset.id} className="rounded-2xl border border-black/10 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-sm font-semibold">{preset.name}</div><div className="text-xs text-black/45">{new Date(preset.updatedAt).toLocaleString()}</div></div></div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" onClick={() => setSettings(preset.settings)}>読み込み</Button>
                          <Button variant="outline" onClick={() => overwritePreset(preset.id)}>上書き</Button>
                          <Button variant="outline" onClick={() => duplicatePreset(preset)}>複製</Button>
                          <Button variant="outline" onClick={() => deletePreset(preset.id)}>削除</Button>
                        </div>
                      </div>
                    ))}
                  </SectionCard>
                )}

                {activeTab === "screen" && (
                  <>
                    <SectionCard icon={Palette} title="規定・初期化">
                      <div className="grid grid-cols-1 gap-2">
                        <Button variant="outline" onClick={saveCurrentAsDefaultSettings}>規定の設定にする</Button>
                        <Button variant="outline" onClick={resetToStoredDefaultSettings}>規定の設定に戻す</Button>
                        <Button variant="outline" onClick={resetToInitialSettings}>初期設定に戻す</Button>
                      </div>
                    </SectionCard>
                    <SectionCard icon={Settings2} title="画面表示">
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">フルスクリーンモード</div><div className="text-xs text-black/50">URLバーや余白を減らして撮影向きにします</div></div><Switch checked={settings.fullScreenMode} onCheckedChange={setFullScreenMode} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">端末フレーム</div><div className="text-xs text-black/50">黒いスマホ枠を表示します</div></div><Switch checked={settings.deviceFrameMode} onCheckedChange={(value) => update("deviceFrameMode", value)} /></div>
                    <div className="space-y-1"><Label>ステータスバー時刻</Label><Input value={settings.deviceTime} onChange={(e) => update("deviceTime", e.target.value)} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">ステータスバー表示</div><div className="text-xs text-black/50">端末上部の時刻・電波アイコンを表示</div></div><Switch checked={settings.showStatusBar} onCheckedChange={(value) => update("showStatusBar", value)} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">設定ボタン表示</div><div className="text-xs text-black/50">撮影時はOFFにできます。右上三点リーダでも設定画面が出ます</div></div><Switch checked={settings.showSettingsButton} onCheckedChange={(value) => update("showSettingsButton", value)} /></div>
                    </SectionCard>
                  </>
                )}

                {activeTab === "modes" && (
                  <SectionCard icon={Settings2} title="モード切り替え">
                    <div className="grid gap-2">
                      <Button variant="outline" onClick={() => router.push("/")}>チャットモードへ</Button>
                      <Button variant="outline" onClick={() => router.push("/notification")}>通知画面モードへ</Button>
                      <Button variant="outline" onClick={() => router.push("/instagram")}>Instagramモードへ</Button>
                      <Button variant="outline" onClick={() => router.push("/x")}>Xモードへ</Button>
                      <Button>TikTokモード</Button>
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

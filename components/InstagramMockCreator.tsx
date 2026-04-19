"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Heart,
  Home,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Palette,
  Plus,
  Repeat2,
  Search,
  Send,
  Settings2,
  Trash2,
  Upload,
  UserCircle2,
  X,
} from "lucide-react";

type InstagramScreenType = "post" | "story";
type SettingsTab = "create" | "comments" | "saved" | "screen" | "modes";
type InstagramThemeKey = "instagram" | "dark";

type InstagramComment = {
  id: string;
  username: string;
  displayName: string;
  avatarLabel: string;
  avatarImage: string | null;
  text: string;
  likeCount: string;
  visible: boolean;
};

type InstagramSettings = {
  screenType: InstagramScreenType;
  themeKey: InstagramThemeKey;
  appName: string;
  username: string;
  displayName: string;
  avatarLabel: string;
  avatarImage: string | null;
  postImage: string | null;
  postImages: string[];
  caption: string;
  likeCount: string;
  postLiked: boolean;
  commentCount: string;
  repostCount: string;
  comments: InstagramComment[];
  runtimeCommentUsername: string;
  runtimeCommentDisplayName: string;
  runtimeCommentAvatarLabel: string;
  runtimeCommentAvatarImage: string | null;
  postTime: string;
  storyImage: string | null;
  storyImages: string[];
  storyText: string;
  storyShowText: boolean;
  storyTextX: number;
  storyTextY: number;
  storyTextSize: number;
  storyDurationSeconds: number;
  storyReplyPlaceholder: string;
  storyLiked: boolean;
  storyMessages: string[];
  deviceTime: string;
  showStatusBar: boolean;
  fullScreenMode: boolean;
  deviceFrameMode: boolean;
  showSettingsButton: boolean;
  bgColor: string;
};

const STORAGE_KEY = "instagram-mock-settings-v2";
const DEFAULT_STORAGE_KEY = "instagram-mock-default-settings-v1";
const SAVED_INSTAGRAM_STORAGE_KEY = "instagram-mock-saved-presets-v1";

type SavedInstagramPreset = {
  id: string;
  name: string;
  updatedAt: number;
  settings: InstagramSettings;
};

const instagramThemes: Record<InstagramThemeKey, {
  label: string;
  root: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  icon: string;
  avatar: string;
  emptyImage: string;
}> = {
  instagram: { label: "基本", root: "bg-white", surface: "bg-white", surfaceAlt: "bg-white", text: "text-black", muted: "text-black/55", border: "border-black/10", icon: "text-black", avatar: "bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-300", emptyImage: "bg-gradient-to-br from-neutral-100 to-neutral-300 text-black/45" },
  dark: { label: "ダークテーマ", root: "bg-neutral-950", surface: "bg-neutral-950", surfaceAlt: "bg-neutral-900", text: "text-white", muted: "text-white/55", border: "border-white/10", icon: "text-white", avatar: "bg-gradient-to-br from-neutral-700 via-neutral-500 to-neutral-300", emptyImage: "bg-gradient-to-br from-neutral-900 to-neutral-700 text-white/45" }
};


const defaultSettings: InstagramSettings = {
  screenType: "post",
  themeKey: "instagram",
  appName: "Picgram",
  username: "misaki_film",
  displayName: "美咲",
  avatarLabel: "美",
  avatarImage: null,
  postImage: null,
  postImages: [],
  caption: "今日の撮影、少しだけ特別な時間だった。",
  likeCount: "128",
  postLiked: false,
  commentCount: "12",
  repostCount: "3",
  comments: [
    {
      id: "comment-default-1",
      username: "ayaka_photo",
      displayName: "彩花",
      avatarLabel: "彩",
      avatarImage: null,
      text: "この写真、空気感めっちゃいい。",
      likeCount: "4",
      visible: true,
    },
    {
      id: "comment-default-2",
      username: "ren_movie",
      displayName: "蓮",
      avatarLabel: "蓮",
      avatarImage: null,
      text: "今日の現場、ほんと良かったね。",
      likeCount: "2",
      visible: true,
    },
  ],
  runtimeCommentUsername: "guest_user",
  runtimeCommentDisplayName: "ゲスト",
  runtimeCommentAvatarLabel: "ゲ",
  runtimeCommentAvatarImage: null,
  postTime: "22:18",
  storyImage: null,
  storyImages: [],
  storyText: "今日はありがとう。",
  storyShowText: true,
  storyTextX: 50,
  storyTextY: 50,
  storyTextSize: 24,
  storyDurationSeconds: 5,
  storyReplyPlaceholder: "メッセージを送信",
  storyLiked: false,
  storyMessages: [],
  deviceTime: "22:18",
  showStatusBar: true,
  fullScreenMode: false,
  deviceFrameMode: false,
  showSettingsButton: true,
  bgColor: "#ffffff",
};

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const isVideoUrl = (url: string | null | undefined) => Boolean(url && (url.startsWith("data:video/") || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)));


const normalizeInstagramSettings = (value: Partial<InstagramSettings> | null | undefined): InstagramSettings => {
  const merged = { ...defaultSettings, ...(value || {}) } as InstagramSettings;
  if (merged.themeKey !== "dark") merged.themeKey = "instagram";
  if ((!merged.postImages || merged.postImages.length === 0) && merged.postImage) merged.postImages = [merged.postImage];
  if ((!merged.storyImages || merged.storyImages.length === 0) && merged.storyImage) merged.storyImages = [merged.storyImage];
  if (!Array.isArray(merged.postImages)) merged.postImages = [];
  if (!Array.isArray(merged.storyImages)) merged.storyImages = [];
  if (!Array.isArray(merged.comments)) merged.comments = defaultSettings.comments;
  if (!Array.isArray(merged.storyMessages)) merged.storyMessages = [];
  return merged;
};

const readStoredDefaultSettings = (): InstagramSettings => {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(DEFAULT_STORAGE_KEY);
    return raw ? normalizeInstagramSettings(JSON.parse(raw)) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

const readStoredSettings = (): InstagramSettings => {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("instagram-mock-settings-v1");
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    const merged = { ...defaultSettings, ...parsed } as InstagramSettings;
    if (merged.themeKey !== "dark") merged.themeKey = "instagram";
    if ((!merged.postImages || merged.postImages.length === 0) && merged.postImage) {
      merged.postImages = [merged.postImage];
    }
    if ((!merged.storyImages || merged.storyImages.length === 0) && merged.storyImage) {
      merged.storyImages = [merged.storyImage];
    }
    if (!Array.isArray(merged.storyImages)) merged.storyImages = [];
    if (typeof merged.storyShowText !== "boolean") merged.storyShowText = defaultSettings.storyShowText;
    if (!Number.isFinite(Number(merged.storyTextX))) merged.storyTextX = defaultSettings.storyTextX;
    if (!Number.isFinite(Number(merged.storyTextY))) merged.storyTextY = defaultSettings.storyTextY;
    if (!Number.isFinite(Number(merged.storyTextSize))) merged.storyTextSize = defaultSettings.storyTextSize;
    if (!Number.isFinite(Number(merged.storyDurationSeconds)) || Number(merged.storyDurationSeconds) <= 0) merged.storyDurationSeconds = defaultSettings.storyDurationSeconds;
    if (!Array.isArray(merged.storyMessages)) {
      merged.storyMessages = [];
    }
    if (typeof merged.runtimeCommentUsername !== "string") merged.runtimeCommentUsername = defaultSettings.runtimeCommentUsername;
    if (typeof merged.runtimeCommentDisplayName !== "string") merged.runtimeCommentDisplayName = defaultSettings.runtimeCommentDisplayName;
    if (typeof merged.runtimeCommentAvatarLabel !== "string") merged.runtimeCommentAvatarLabel = defaultSettings.runtimeCommentAvatarLabel;
    if (typeof merged.runtimeCommentAvatarImage !== "string") merged.runtimeCommentAvatarImage = null;
    return merged;
  } catch {
    return defaultSettings;
  }
};

const readSavedInstagramPresets = (): SavedInstagramPreset[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_INSTAGRAM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => ({
        id: String(item?.id ?? `instagram-preset-${index}`),
        name: String(item?.name ?? `保存Instagram ${index + 1}`),
        updatedAt: Number.isFinite(Number(item?.updatedAt)) ? Number(item.updatedAt) : Date.now(),
        settings: { ...defaultSettings, ...(item?.settings || {}) } as InstagramSettings,
      }))
      .filter((item) => item.name.trim());
  } catch {
    return [];
  }
};

function Button({ children, className = "", variant = "default", type = "button", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "dark" }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "outline"
      ? "border border-black/10 bg-white text-black hover:bg-black/[0.03]"
      : variant === "dark"
        ? "bg-black text-white hover:bg-black/85"
        : "bg-[#06C755] text-white hover:brightness-95";
  return <button type={type} className={cn(base, styles, className)} {...props}>{children}</button>;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} autoComplete="off" className={cn("w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5", className)} />;
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-[96px] w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5", className)} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-black/80">{children}</label>;
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (next: boolean) => void }) {
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
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-2xl px-2 py-2 text-xs font-medium transition", active ? "bg-white text-black shadow-sm" : "text-black/55")}
    >
      {children}
    </button>
  );
}

function Avatar({ label, image, size = "h-9 w-9", themeKey = "instagram" }: { label: string; image: string | null; size?: string; themeKey?: InstagramThemeKey }) {
  const theme = instagramThemes[themeKey] || instagramThemes.instagram;
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white", theme.avatar, size)}>
      {image ? <img src={image} alt="avatar" className="h-full w-full object-cover" /> : <span>{label || "美"}</span>}
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

function StatusBar({ time, className = "text-black" }: { time: string; className?: string }) {
  return (
    <div className={cn("px-5 pt-0.5", className)}>
      <div className="flex h-8 items-center justify-between text-[12px] font-semibold tracking-[-0.01em] opacity-[0.98] [text-shadow:0_1px_1px_rgba(0,0,0,0.12)]">
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

function adjustCountText(value: string, delta: number) {
  const compact = value.replace(/,/g, "").trim();
  const number = Number.parseInt(compact, 10);
  if (!Number.isFinite(number)) return value;
  return String(Math.max(0, number + delta));
}

function visibleCommentCount(comments: InstagramComment[]) {
  return (comments || []).filter((comment) => comment.visible !== false).length;
}

function EmptyImage({ label, themeKey = "instagram" }: { label: string; themeKey?: InstagramThemeKey }) {
  const theme = instagramThemes[themeKey] || instagramThemes.instagram;
  return (
    <div className={cn("flex aspect-square w-full items-center justify-center text-center text-sm", theme.emptyImage)}>
      <div>
        <ImageIcon className="mx-auto mb-2 h-8 w-8" />
        {label}
      </div>
    </div>
  );
}

function InstagramPostPreview({ settings, setSettings, onOpenSettings }: { settings: InstagramSettings; setSettings: React.Dispatch<React.SetStateAction<InstagramSettings>>; onOpenSettings: () => void }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const theme = instagramThemes[settings.themeKey || "instagram"] || instagramThemes.instagram;
  const visibleComments = (settings.comments || []).filter((comment) => comment.visible !== false);
  const postImages = settings.postImages?.length ? settings.postImages : settings.postImage ? [settings.postImage] : [];
  const safeImageIndex = postImages.length ? Math.min(activeImageIndex, postImages.length - 1) : 0;
  const currentPostImage = postImages[safeImageIndex] || null;
  const commentCountLabel = String(visibleCommentCount(settings.comments || []));

  const togglePostLike = () => {
    setSettings((prev) => ({
      ...prev,
      postLiked: !prev.postLiked,
      likeCount: adjustCountText(prev.likeCount, prev.postLiked ? -1 : 1),
    }));
  };

  const submitRuntimeComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    const nextComment: InstagramComment = {
      id: `runtime-comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      username: settings.runtimeCommentUsername.trim() || "guest_user",
      displayName: settings.runtimeCommentDisplayName.trim(),
      avatarLabel: settings.runtimeCommentAvatarLabel.trim().slice(0, 2) || "ゲ",
      avatarImage: settings.runtimeCommentAvatarImage,
      text,
      likeCount: "0",
      visible: true,
    };
    setSettings((prev) => {
      const nextComments = [...(prev.comments || []), nextComment];
      return {
        ...prev,
        comments: nextComments,
        commentCount: String(visibleCommentCount(nextComments)),
      };
    });
    setCommentDraft("");
    setCommentsOpen(true);
  };

  return (
    <div className={cn("relative flex h-full flex-col", theme.root, theme.text)}>
      {settings.showStatusBar && <StatusBar time={settings.deviceTime} className={theme.text} />}
      <div className={cn("flex h-12 items-center justify-between border-b px-4", theme.surface, theme.border)}>
        <div className="text-[22px] font-bold tracking-tight">{settings.appName || "Picgram"}</div>
        <div className="flex items-center gap-4"><Heart className="h-6 w-6" /><MessageCircle className="h-6 w-6" /></div>
      </div>
      <div className={cn("flex-1 overflow-y-auto", theme.surface)}>
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar label={settings.avatarLabel} image={settings.avatarImage} themeKey={settings.themeKey} />
            <div>
              <div className="text-sm font-semibold leading-tight">{settings.username}</div>
              <div className={cn("text-xs", theme.muted)}>{settings.displayName}</div>
            </div>
          </div>
          <button type="button" onClick={onOpenSettings} className="rounded-full p-1 transition hover:bg-black/5" aria-label="設定を開く"><MoreHorizontal className="h-5 w-5" /></button>
        </div>

        <div className="relative">
          {currentPostImage ? (
            isVideoUrl(currentPostImage) ? (
              <video src={currentPostImage} className="aspect-square w-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <img src={currentPostImage} alt="post" className="aspect-square w-full object-cover" />
            )
          ) : (
            <EmptyImage label="投稿画像・動画を設定できます" themeKey={settings.themeKey} />
          )}

          {postImages.length > 1 && (
            <>
              <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                {safeImageIndex + 1}/{postImages.length}
              </div>
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length)}
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95"
                aria-label="前の画像"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev + 1) % postImages.length)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95"
                aria-label="次の画像"
              >
                ›
              </button>
            </>
          )}
        </div>

        {postImages.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {postImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                className={cn("h-1.5 w-1.5 rounded-full", index === safeImageIndex ? "bg-blue-500" : "bg-black/20")}
                aria-label={`画像${index + 1}を表示`}
              />
            ))}
          </div>
        )}

        <div className="space-y-2 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button type="button" onClick={togglePostLike} className="rounded-full active:scale-95" aria-label="いいね">
                <Heart className={cn("h-6 w-6", settings.postLiked && "fill-red-500 text-red-500")} />
              </button>
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className={cn("flex items-center gap-1.5 rounded-full active:scale-95", theme.icon)}
                aria-label="コメント欄を開く"
              >
                <MessageCircle className="h-6 w-6" />
                <span className="text-xs font-semibold leading-none">{commentCountLabel}</span>
              </button>
              <div className="flex items-center gap-1.5">
                <Repeat2 className="h-6 w-6" />
                <span className="text-xs font-semibold leading-none">{settings.repostCount}</span>
              </div>
              <Send className="h-6 w-6" />
            </div>
            <Bookmark className="h-6 w-6" />
          </div>
          <div className="text-sm font-semibold">いいね！{settings.likeCount}件</div>
          <div className="text-sm leading-relaxed"><span className="font-semibold">{settings.username}</span> {settings.caption}</div>
          <div className={cn("text-xs uppercase", theme.muted)}>{settings.postTime}</div>
        </div>
      </div>

      <div className={cn("flex h-12 items-center justify-around border-t", theme.border, theme.surface, theme.icon)}>
        <Home className="h-6 w-6" /><Search className="h-6 w-6" /><Plus className="h-6 w-6" /><MessageCircle className="h-6 w-6" /><Avatar label={settings.avatarLabel} image={settings.avatarImage} size="h-6 w-6" themeKey={settings.themeKey} />
      </div>

      {commentsOpen && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/25">
          <button type="button" aria-label="コメント欄を閉じる" className="absolute inset-0" onClick={() => setCommentsOpen(false)} />
          <div className={cn("relative z-10 flex max-h-[72%] w-full flex-col overflow-hidden rounded-t-[28px] shadow-2xl", theme.surface, theme.text)}>
            <div className={cn("flex shrink-0 items-center justify-between border-b px-4 py-3", theme.border)}>
              <div>
                <div className="text-sm font-semibold">コメント</div>
                <div className={cn("text-xs", theme.muted)}>{commentCountLabel}件</div>
              </div>
              <button type="button" onClick={() => setCommentsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {visibleComments.length === 0 ? (
                <div className={cn("py-8 text-center text-sm", theme.muted)}>表示中のコメントはありません</div>
              ) : (
                <div className="space-y-4">
                  {visibleComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar label={comment.avatarLabel} image={comment.avatarImage} size="h-9 w-9" themeKey={settings.themeKey} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{comment.username}</span>
                          {comment.displayName && <span className={cn("text-xs", theme.muted)}>{comment.displayName}</span>}
                        </div>
                        <div className={cn("break-words text-sm leading-relaxed", theme.text)}>{comment.text}</div>
                        <div className={cn("mt-1 text-xs", theme.muted)}>いいね！{comment.likeCount}件</div>
                      </div>
                      <Heart className={cn("mt-1 h-4 w-4 shrink-0", theme.muted)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={cn("flex shrink-0 items-center gap-2 border-t px-3 py-3", theme.border)}>
              <Avatar label={settings.runtimeCommentAvatarLabel} image={settings.runtimeCommentAvatarImage} size="h-8 w-8" themeKey={settings.themeKey} />
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitRuntimeComment(); }}
                placeholder="コメントを追加..."
                className={cn("min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none", theme.border, theme.surfaceAlt, theme.text)}
              />
              <button type="button" onClick={submitRuntimeComment} className="rounded-full px-3 py-2 text-sm font-semibold text-blue-500 active:scale-95">投稿</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InstagramStoryPreview({ settings, setSettings, onOpenSettings }: { settings: InstagramSettings; setSettings: React.Dispatch<React.SetStateAction<InstagramSettings>>; onOpenSettings: () => void }) {
  const [messageDraft, setMessageDraft] = useState("");
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const storyImages = settings.storyImages?.length ? settings.storyImages : settings.storyImage ? [settings.storyImage] : [];
  const storyCount = Math.max(1, storyImages.length);
  const safeStoryIndex = storyImages.length ? Math.min(activeStoryIndex, storyImages.length - 1) : 0;
  const currentStoryImage = storyImages[safeStoryIndex] || null;
  const durationMs = Math.max(1, Number(settings.storyDurationSeconds) || 5) * 1000;
  const showText = settings.storyShowText !== false && settings.storyText.trim().length > 0;
  const textX = Math.max(0, Math.min(100, Number(settings.storyTextX) || 50));
  const textY = Math.max(0, Math.min(100, Number(settings.storyTextY) || 50));
  const textSize = Math.max(12, Math.min(72, Number(settings.storyTextSize) || 24));

  const currentStoryIsVideo = isVideoUrl(currentStoryImage);

  const storyStyle = currentStoryImage && !currentStoryIsVideo
    ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.18), rgba(0,0,0,.28)), url(${currentStoryImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, #f97316, #db2777, #7c3aed)" };

  useEffect(() => {
    setActiveStoryIndex((prev) => Math.min(prev, Math.max(0, storyImages.length - 1)));
  }, [storyImages.length]);

  useEffect(() => {
    setStoryProgress(0);
    startedAtRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAtRef.current;
      const nextProgress = Math.min(100, (elapsed / durationMs) * 100);
      setStoryProgress(nextProgress);

      if (nextProgress >= 100) {
        if (storyImages.length > 1) {
          setActiveStoryIndex((prev) => (prev + 1) % storyImages.length);
        } else {
          startedAtRef.current = now;
          setStoryProgress(0);
        }
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [safeStoryIndex, durationMs, storyImages.length]);

  const goPrevStory = () => {
    setActiveStoryIndex((prev) => (prev - 1 + storyCount) % storyCount);
  };

  const goNextStory = () => {
    setActiveStoryIndex((prev) => (prev + 1) % storyCount);
  };

  const toggleStoryLike = () => {
    setSettings((prev) => ({ ...prev, storyLiked: !prev.storyLiked }));
  };

  const submitStoryMessage = () => {
    const text = messageDraft.trim();
    if (!text) return;
    setSettings((prev) => ({ ...prev, storyMessages: [...(prev.storyMessages || []), text] }));
    setMessageDraft("");
  };

  const storyMessages = settings.storyMessages || [];

  const deleteStoryMessage = (targetIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      storyMessages: (prev.storyMessages || []).filter((_, index) => index !== targetIndex),
    }));
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-black text-white" style={storyStyle}>
      {currentStoryIsVideo && currentStoryImage && (
        <>
          <video src={currentStoryImage} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}
      {settings.showStatusBar && <StatusBar time={settings.deviceTime} className="relative z-10 text-white" />}
      <div className="relative z-10 px-3 pt-2">
        <div className="flex gap-1">
          {Array.from({ length: storyCount }).map((_, index) => {
            const width = index < safeStoryIndex ? 100 : index === safeStoryIndex ? storyProgress : 0;
            return (
              <div key={index} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar label={settings.avatarLabel} image={settings.avatarImage} themeKey={settings.themeKey} />
            <div className="text-sm font-semibold drop-shadow">{settings.username}</div>
            <div className="text-xs text-white/75">今</div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur active:scale-95"
            aria-label="設定を開く"
          >
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>
      </div>

      {storyCount > 1 && (
        <>
          <button
            type="button"
            onClick={goPrevStory}
            className="absolute left-0 top-20 z-10 h-[calc(100%-170px)] w-1/3"
            aria-label="前のストーリー"
          />
          <button
            type="button"
            onClick={goNextStory}
            className="absolute right-0 top-20 z-10 h-[calc(100%-170px)] w-1/3"
            aria-label="次のストーリー"
          />
          <div className="absolute right-3 top-16 z-10 rounded-full bg-black/45 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            {safeStoryIndex + 1}/{storyCount}
          </div>
        </>
      )}

      <div className="relative flex-1">
        {showText && (
          <div
            className="absolute z-10 max-w-[86%] -translate-x-1/2 -translate-y-1/2 whitespace-pre-wrap rounded-3xl bg-white/90 px-5 py-4 text-center font-bold leading-relaxed text-black shadow-2xl"
            style={{ left: `${textX}%`, top: `${textY}%`, fontSize: `${textSize}px` }}
          >
            {settings.storyText}
          </div>
        )}
      </div>

{storyMessages.length > 0 && (
        <div className="relative z-20 mx-4 mb-3 flex max-h-28 flex-col items-end gap-2 overflow-y-auto">
          {storyMessages.map((message, index) => (
            <div key={`${message}-${index}`} className="flex max-w-[86%] items-center gap-2">
              <div className="min-w-0 rounded-2xl bg-white/90 px-3 py-2 text-xs font-medium text-black shadow-lg">
                送信済み：{message}
              </div>
              <button
                type="button"
                onClick={() => deleteStoryMessage(index)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur active:scale-95"
                aria-label="送信済みメッセージを削除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative z-20 flex items-center gap-3 px-4 pb-5">
        <input
          value={messageDraft}
          onChange={(e) => setMessageDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitStoryMessage(); }}
          placeholder={settings.storyReplyPlaceholder || "メッセージを送信"}
          className="min-w-0 flex-1 rounded-full border border-white/80 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/75 outline-none backdrop-blur"
        />
        <button type="button" onClick={toggleStoryLike} className="rounded-full active:scale-95" aria-label="ストーリーにいいね">
          <Heart className={cn("h-7 w-7", settings.storyLiked && "fill-red-500 text-red-500")} />
        </button>
        <button type="button" onClick={submitStoryMessage} className="rounded-full active:scale-95" aria-label="メッセージを送信">
          <Send className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

export default function InstagramMockCreator() {
  const router = useRouter();
  const [settings, setSettings] = useState<InstagramSettings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("create");
  const [savedPresets, setSavedPresets] = useState<SavedInstagramPreset[]>([]);
  const [saveName, setSaveName] = useState("Instagram撮影セット");

  useEffect(() => {
    setSettings(readStoredSettings());
    setSavedPresets(readSavedInstagramPresets());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage may be unavailable in private mode. The app still works for the current session.
    }
  }, [settings]);

  const update = <K extends keyof InstagramSettings>(key: K, value: InstagramSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>, key: "avatarImage" | "postImage" | "storyImage" | "runtimeCommentAvatarImage") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      if (key === "postImage") {
        setSettings((prev) => ({ ...prev, postImage: result, postImages: [result] }));
        return;
      }
      if (key === "storyImage") {
        setSettings((prev) => ({ ...prev, storyImage: result, storyImages: [result] }));
        return;
      }
      update(key, result as InstagramSettings[typeof key]);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handlePostImagesUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    if (files.length === 0) return;

    Promise.all(files.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    }))).then((images) => {
      setSettings((prev) => ({
        ...prev,
        postImage: images[0] || prev.postImage,
        postImages: images,
      }));
    });
    event.target.value = "";
  };


  const handleStoryImagesUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    if (files.length === 0) return;

    Promise.all(files.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    }))).then((images) => {
      setSettings((prev) => ({
        ...prev,
        storyImage: images[0] || prev.storyImage,
        storyImages: images,
      }));
    });
    event.target.value = "";
  };

  const updateComment = <K extends keyof InstagramComment>(id: string, key: K, value: InstagramComment[K]) => {
    setSettings((prev) => ({
      ...prev,
      comments: (prev.comments || []).map((comment) => comment.id === id ? { ...comment, [key]: value } : comment),
    }));
  };

  const addComment = () => {
    const nextComment: InstagramComment = {
      id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      username: settings.runtimeCommentUsername.trim() || "guest_user",
      displayName: settings.runtimeCommentDisplayName.trim(),
      avatarLabel: settings.runtimeCommentAvatarLabel.trim().slice(0, 2) || "ゲ",
      avatarImage: settings.runtimeCommentAvatarImage,
      text: "コメントを入力",
      likeCount: "0",
      visible: true,
    };
    setSettings((prev) => ({ ...prev, comments: [...(prev.comments || []), nextComment] }));
  };

  const deleteComment = (id: string) => {
    setSettings((prev) => ({ ...prev, comments: (prev.comments || []).filter((comment) => comment.id !== id) }));
  };

  const handleCommentImageUpload = (event: ChangeEvent<HTMLInputElement>, id: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateComment(id, "avatarImage", String(reader.result));
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const persistSavedPresets = (items: SavedInstagramPreset[]) => {
    setSavedPresets(items);
    try {
      window.localStorage.setItem(SAVED_INSTAGRAM_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  const saveInstagramPresetAsNew = () => {
    const name = saveName.trim();
    if (!name) return;
    const item: SavedInstagramPreset = {
      id: `instagram-saved-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      updatedAt: Date.now(),
      settings,
    };
    persistSavedPresets([item, ...savedPresets]);
  };

  const overwriteInstagramPreset = (id: string) => {
    persistSavedPresets(savedPresets.map((item) => item.id === id ? { ...item, updatedAt: Date.now(), settings } : item));
  };

  const loadInstagramPreset = (id: string) => {
    const item = savedPresets.find((preset) => preset.id === id);
    if (!item) return;
    setSettings({ ...defaultSettings, ...item.settings, themeKey: item.settings.themeKey === "dark" ? "dark" : "instagram" });
    setSettingsOpen(false);
  };

  const deleteInstagramPreset = (id: string) => {
    persistSavedPresets(savedPresets.filter((item) => item.id !== id));
  };

  const duplicateInstagramPreset = (id: string) => {
    const item = savedPresets.find((preset) => preset.id === id);
    if (!item) return;
    persistSavedPresets([{ ...item, id: `instagram-saved-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: `${item.name} コピー`, updatedAt: Date.now() }, ...savedPresets]);
  };


  const saveCurrentAsDefaultSettings = () => {
    try {
      window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  };

  const resetToStoredDefaultSettings = () => {
    setSettings(readStoredDefaultSettings());
  };

  const resetToInitialSettings = () => {
    try { window.localStorage.removeItem(DEFAULT_STORAGE_KEY); } catch {}
    setSettings(defaultSettings);
  };

  const enterFullscreenIfNeeded = async (enabled: boolean) => {
    update("fullScreenMode", enabled);
    if (enabled && typeof document !== "undefined" && !document.fullscreenElement) {
      try { await document.documentElement.requestFullscreen(); } catch {}
    }
    if (!enabled && typeof document !== "undefined" && document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
  };

  const screen = (
    <div className="h-full w-full overflow-hidden rounded-[inherit] bg-white">
      {settings.screenType === "post" ? <InstagramPostPreview settings={settings} setSettings={setSettings} onOpenSettings={() => setSettingsOpen(true)} /> : <InstagramStoryPreview settings={settings} setSettings={setSettings} onOpenSettings={() => setSettingsOpen(true)} />}
    </div>
  );

  const stage = settings.deviceFrameMode ? (
    <div className={cn("mx-auto flex h-[100dvh] min-h-0 flex-col bg-black", settings.fullScreenMode ? "max-w-none" : "max-w-md")}>
      <div className="relative h-full min-h-0 flex-1 overflow-hidden p-4">
        <div className="relative h-full min-h-0 w-full overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl">
          {screen}
        </div>
      </div>
    </div>
  ) : (
    <div className={cn("mx-auto h-[100dvh] min-h-0 w-full overflow-hidden bg-white", settings.fullScreenMode ? "max-w-none" : "max-w-md")} style={{ backgroundColor: settings.bgColor }}>
      {screen}
    </div>
  );

  return (
    <div className="relative min-h-[100dvh] bg-[#f2f2f2]">
      {stage}

      {settings.showSettingsButton && (
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-black/75 text-white shadow-xl backdrop-blur transition active:scale-95"
          aria-label="設定を開く"
        >
          <Settings2 className="h-5 w-5" />
        </button>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/35">
          <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[86vh] w-full max-w-md flex-col rounded-t-[28px] bg-[#fafafa] px-4 pt-4 shadow-2xl">
            <div className="mb-4 shrink-0 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setSettingsOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-black/70 transition hover:bg-black/[0.07]" aria-label="閉じる"><X className="h-5 w-5" /></button>
              <div className="text-lg font-semibold">設定</div>
              <div className="h-10 w-10" aria-hidden="true" />
            </div>

            <div className="grid shrink-0 grid-cols-5 rounded-2xl bg-black/5 p-1 text-center">
              <TabButton active={activeTab === "create"} onClick={() => setActiveTab("create")}>作成</TabButton>
              <TabButton active={activeTab === "comments"} onClick={() => setActiveTab("comments")}>コメント</TabButton>
              <TabButton active={activeTab === "saved"} onClick={() => setActiveTab("saved")}>保存</TabButton>
              <TabButton active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>画面</TabButton>
              <TabButton active={activeTab === "modes"} onClick={() => setActiveTab("modes")}>モード</TabButton>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pb-[max(18px,calc(env(safe-area-inset-bottom)+18px))] pr-1">
              {activeTab === "create" && (
                <div className="space-y-4">
                  <SectionCard icon={ImageIcon} title="作成する画面">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => update("screenType", "post")} variant={settings.screenType === "post" ? "default" : "outline"}>投稿画面</Button>
                      <Button onClick={() => update("screenType", "story")} variant={settings.screenType === "story" ? "default" : "outline"}>ストーリー</Button>
                    </div>
                  </SectionCard>

                  <SectionCard icon={UserCircle2} title="アカウント / アプリ名">
                    <div className="space-y-2"><Label>アプリ名（架空名に変更できます）</Label><Input value={settings.appName} onChange={(e) => update("appName", e.target.value)} placeholder="Picgram" /></div>
                    <div className="space-y-2"><Label>テーマ</Label><select value={settings.themeKey} onChange={(e) => update("themeKey", e.target.value as InstagramThemeKey)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5">{(Object.keys(instagramThemes) as InstagramThemeKey[]).map((key) => <option key={key} value={key}>{instagramThemes[key].label}</option>)}</select></div>
                    <div className="space-y-2"><Label>ユーザー名</Label><Input value={settings.username} onChange={(e) => update("username", e.target.value)} /></div>
                    <div className="space-y-2"><Label>表示名</Label><Input value={settings.displayName} onChange={(e) => update("displayName", e.target.value)} /></div>
                    <div className="space-y-2"><Label>アイコン文字</Label><Input value={settings.avatarLabel} onChange={(e) => update("avatarLabel", e.target.value.slice(0, 2))} /></div>
                    <div className="flex items-center gap-3"><FileButton accept="image/*" onFile={(e) => handleImageUpload(e, "avatarImage")}>アイコン画像</FileButton><Button variant="outline" onClick={() => update("avatarImage", null)}>解除</Button></div>
                  </SectionCard>

                  {settings.screenType === "post" ? (
                    <SectionCard icon={ImageIcon} title="投稿内容">
                      <div className="flex flex-wrap items-center gap-3"><FileButton accept="image/*,video/*" onFile={(e) => handleImageUpload(e, "postImage")}>投稿メディア</FileButton><MultiFileButton accept="image/*,video/*" onFiles={handlePostImagesUpload}>複数メディア</MultiFileButton><Button variant="outline" onClick={() => setSettings((prev) => ({ ...prev, postImage: null, postImages: [] }))}>解除</Button></div><div className="text-xs text-black/50">画像・動画を複数選ぶと、投稿画面で左右ボタンとドットが表示されます。</div>
                      <div className="space-y-2"><Label>キャプション</Label><Textarea value={settings.caption} onChange={(e) => update("caption", e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-3"><div className="space-y-2"><Label>いいね数</Label><Input value={settings.likeCount} onChange={(e) => update("likeCount", e.target.value)} /></div><div className="space-y-2"><Label>コメント数</Label><Input value={settings.commentCount} onChange={(e) => update("commentCount", e.target.value)} /></div><div className="space-y-2"><Label>リポスト数</Label><Input value={settings.repostCount} onChange={(e) => update("repostCount", e.target.value)} /></div></div>
                      <div className="space-y-2"><Label>投稿時刻</Label><Input value={settings.postTime} onChange={(e) => update("postTime", e.target.value)} /></div>
                    </SectionCard>
                  ) : (
                    <SectionCard icon={ImageIcon} title="ストーリー内容">
                      <div className="flex flex-wrap items-center gap-3">
                        <FileButton accept="image/*,video/*" onFile={(e) => handleImageUpload(e, "storyImage")}>背景メディア</FileButton>
                        <MultiFileButton accept="image/*,video/*" onFiles={handleStoryImagesUpload}>複数メディア</MultiFileButton>
                        <Button variant="outline" onClick={() => setSettings((prev) => ({ ...prev, storyImage: null, storyImages: [] }))}>解除</Button>
                      </div>
                      <div className="text-xs text-black/50">画像・動画を複数選ぶと、枚数に合わせて上部バーが増減し、自動で次のメディアへ進みます。</div>
                      <div className="space-y-2"><Label>バーがいっぱいになる秒数</Label><Input type="number" min="1" step="0.5" value={settings.storyDurationSeconds} onChange={(e) => update("storyDurationSeconds", Number(e.target.value) || 1)} /></div>
                      <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">テキストを表示する</div><div className="text-xs text-black/50">OFFにすると画像だけのストーリーになります</div></div><Switch checked={settings.storyShowText !== false} onCheckedChange={(v) => update("storyShowText", v)} /></div>
                      <div className="space-y-2"><Label>テキスト</Label><Textarea value={settings.storyText} onChange={(e) => update("storyText", e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2"><Label>横位置 %</Label><Input type="number" min="0" max="100" value={settings.storyTextX} onChange={(e) => update("storyTextX", Number(e.target.value) || 0)} /></div>
                        <div className="space-y-2"><Label>縦位置 %</Label><Input type="number" min="0" max="100" value={settings.storyTextY} onChange={(e) => update("storyTextY", Number(e.target.value) || 0)} /></div>
                        <div className="space-y-2"><Label>文字サイズ</Label><Input type="number" min="12" max="72" value={settings.storyTextSize} onChange={(e) => update("storyTextSize", Number(e.target.value) || 12)} /></div>
                      </div>
                      <div className="space-y-2"><Label>返信欄</Label><Input value={settings.storyReplyPlaceholder} onChange={(e) => update("storyReplyPlaceholder", e.target.value)} /></div>
                    </SectionCard>
                  )}
                </div>
              )}

              {activeTab === "comments" && (
                <div className="space-y-4">
                  <SectionCard icon={MessageCircle} title="コメント欄">
                    <div className="rounded-2xl bg-black/[0.04] p-3 text-xs leading-relaxed text-black/55">
                      投稿画面のコメントアイコンを押すと、画面下部にコメント欄が表示されます。コメント数の表示は「作成」タブで変更できます。
                    </div>
                    <div className="space-y-3 rounded-2xl border border-black/10 bg-white p-3">
                      <div className="text-sm font-semibold text-black/80">撮影中に送信するコメントのユーザー</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2"><Label>ユーザー名</Label><Input value={settings.runtimeCommentUsername} onChange={(e) => update("runtimeCommentUsername", e.target.value)} /></div>
                        <div className="space-y-2"><Label>表示名</Label><Input value={settings.runtimeCommentDisplayName} onChange={(e) => update("runtimeCommentDisplayName", e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                        <div className="space-y-2"><Label>アイコン文字</Label><Input value={settings.runtimeCommentAvatarLabel} onChange={(e) => update("runtimeCommentAvatarLabel", e.target.value.slice(0, 2))} /></div>
                        <Avatar label={settings.runtimeCommentAvatarLabel} image={settings.runtimeCommentAvatarImage} size="h-11 w-11" themeKey={settings.themeKey} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <FileButton accept="image/*" onFile={(e) => handleImageUpload(e, "runtimeCommentAvatarImage")}>送信者アイコン画像</FileButton>
                        <Button variant="outline" onClick={() => update("runtimeCommentAvatarImage", null)}>解除</Button>
                      </div>
                    </div>
                    <Button className="w-full" onClick={addComment}>表示用コメントを追加</Button>
                  </SectionCard>

                  {(settings.comments || []).length === 0 ? (
                    <SectionCard icon={MessageCircle} title="コメント一覧">
                      <div className="py-6 text-center text-sm text-black/45">コメントはまだありません</div>
                    </SectionCard>
                  ) : (
                    (settings.comments || []).map((comment, index) => (
                      <SectionCard key={comment.id} icon={MessageCircle} title={`コメント ${index + 1}`}>
                        <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                          <div>
                            <div className="text-sm font-medium">表示する</div>
                            <div className="text-xs text-black/50">OFFにするとコメント欄に出ません</div>
                          </div>
                          <Switch checked={comment.visible !== false} onCheckedChange={(v) => updateComment(comment.id, "visible", v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>ユーザー名</Label><Input value={comment.username} onChange={(e) => updateComment(comment.id, "username", e.target.value)} /></div>
                          <div className="space-y-2"><Label>表示名</Label><Input value={comment.displayName} onChange={(e) => updateComment(comment.id, "displayName", e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>アイコン文字</Label><Input value={comment.avatarLabel} onChange={(e) => updateComment(comment.id, "avatarLabel", e.target.value.slice(0, 2))} /></div>
                          <div className="space-y-2"><Label>いいね数</Label><Input value={comment.likeCount} onChange={(e) => updateComment(comment.id, "likeCount", e.target.value)} /></div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <FileButton accept="image/*" onFile={(e) => handleCommentImageUpload(e, comment.id)}>アイコン画像</FileButton>
                          <Button variant="outline" onClick={() => updateComment(comment.id, "avatarImage", null)}>解除</Button>
                        </div>
                        <div className="space-y-2"><Label>コメント本文</Label><Textarea value={comment.text} onChange={(e) => updateComment(comment.id, "text", e.target.value)} /></div>
                        <Button variant="outline" className="w-full text-red-600" onClick={() => deleteComment(comment.id)}><Trash2 className="mr-2 h-4 w-4" />このコメントを削除</Button>
                      </SectionCard>
                    ))
                  )}
                </div>
              )}


              {activeTab === "saved" && (
                <div className="space-y-4">
                  <SectionCard icon={MessageCircle} title="Instagram画面を保存">
                    <div className="rounded-2xl bg-black/[0.04] p-3 text-xs leading-relaxed text-black/55">
                      投稿・ストーリー・コメント・画像・テーマを名前付きで保存できます。撮影パターンを複数作る時に使います。
                    </div>
                    <div className="space-y-2"><Label>保存名</Label><Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="例：美咲_投稿画面_夜" /></div>
                    <Button className="w-full" onClick={saveInstagramPresetAsNew}>新規保存</Button>
                  </SectionCard>

                  <SectionCard icon={MessageCircle} title={`保存一覧 (${savedPresets.length})`}>
                    {savedPresets.length === 0 ? (
                      <div className="py-6 text-center text-sm text-black/45">保存済みのInstagram画面はありません</div>
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
                              <Button onClick={() => loadInstagramPreset(item.id)} className="justify-center">読み込み</Button>
                              <Button onClick={() => overwriteInstagramPreset(item.id)} variant="outline" className="justify-center">上書き</Button>
                              <Button onClick={() => duplicateInstagramPreset(item.id)} variant="outline" className="justify-center">複製</Button>
                              <Button onClick={() => deleteInstagramPreset(item.id)} variant="outline" className="justify-center text-red-600">削除</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}

              {activeTab === "screen" && (
                <div className="space-y-4">
                  <SectionCard icon={Settings2} title="撮影表示">
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">フルスクリーンモード</div><div className="text-xs text-black/50">URLバーや余白を減らして撮影向きにします</div></div><Switch checked={settings.fullScreenMode} onCheckedChange={enterFullscreenIfNeeded} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">デバイスフレーム</div><div className="text-xs text-black/50">黒フチのスマホ画面として表示</div></div><Switch checked={settings.deviceFrameMode} onCheckedChange={(v) => update("deviceFrameMode", v)} /></div>
                    <div className="space-y-2"><Label>ステータスバー時刻</Label><Input value={settings.deviceTime} onChange={(e) => update("deviceTime", e.target.value)} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">ステータスバー表示</div><div className="text-xs text-black/50">端末上部の時刻・電波アイコンを表示</div></div><Switch checked={settings.showStatusBar} onCheckedChange={(v) => update("showStatusBar", v)} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">設定ボタン表示</div><div className="text-xs text-black/50">撮影時はOFFにできます。右上三点リーダで設定画面が出ます</div></div><Switch checked={settings.showSettingsButton} onCheckedChange={(v) => update("showSettingsButton", v)} /></div>
                  </SectionCard>

                  <SectionCard icon={Palette} title="規定・初期化">
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" className="w-full" onClick={saveCurrentAsDefaultSettings}>規定の設定にする</Button>
                      <Button variant="outline" className="w-full" onClick={resetToStoredDefaultSettings}>規定の設定に戻す</Button>
                      <Button variant="outline" className="w-full" onClick={resetToInitialSettings}>初期設定に戻す</Button>
                    </div>
                  </SectionCard>
                </div>
              )}

              {activeTab === "modes" && (
                <SectionCard icon={Settings2} title="モード切り替え">
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" onClick={() => router.push("/")}>チャットモードへ</Button>
                    <Button variant="outline" onClick={() => router.push("/notification")}>通知画面モードへ</Button>
                    <Button>Instagramモード</Button>
                    <Button variant="outline" onClick={() => router.push("/x")}>Xモードへ</Button>
                    <Button variant="outline" onClick={() => router.push("/tiktok")}>TikTokモードへ</Button>
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

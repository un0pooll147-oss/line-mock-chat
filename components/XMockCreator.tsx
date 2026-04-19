"use client";

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Bookmark,
  Check,
  Heart,
  Home,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Palette,
  Pin,
  Repeat2,
  Search,
  Send,
  Settings2,
  Trash2,
  Upload,
  UserCircle2,
  X as XIcon,
} from "lucide-react";

type XScreenType = "post" | "timeline" | "notifications" | "profile";
type XThemeKey = "light" | "dark";
type SettingsTab = "create" | "replies" | "timeline" | "notifications" | "profile" | "saved" | "screen" | "modes";


type TimelinePost = {
  id: string;
  displayName: string;
  username: string;
  avatarLabel: string;
  avatarImage: string | null;
  verified: boolean;
  text: string;
  time: string;
  images: string[];
  currentImageIndex: number;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  viewCount: string;
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
};

type NotificationItem = {
  id: string;
  kind: "reply" | "like" | "repost" | "follow" | "custom";
  displayName: string;
  username: string;
  avatarLabel: string;
  avatarImage: string | null;
  title: string;
  text: string;
  time: string;
};

type ReplyItem = {
  id: string;
  username: string;
  displayName: string;
  avatarLabel: string;
  avatarImage: string | null;
  text: string;
  time: string;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  viewCount: string;
  liked: boolean;
  reposted: boolean;
};

type SavedPreset = {
  id: string;
  name: string;
  savedAt: string;
  settings: XSettings;
};

type XSettings = {
  screenType: XScreenType;
  themeKey: XThemeKey;
  appName: string;
  showScreenLabel: boolean;
  displayName: string;
  username: string;
  verified: boolean;
  avatarLabel: string;
  avatarImage: string | null;
  postText: string;
  postTime: string;
  postDate: string;
  postImages: string[];
  currentImageIndex: number;
  replyCount: number;
  repostCount: number;
  quoteCount: number;
  likeCount: number;
  viewCount: string;
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
  replyUserName: string;
  replyDisplayName: string;
  replyAvatarLabel: string;
  replyAvatarImage: string | null;
  replyInput: string;
  replyTime: string;
  replies: ReplyItem[];
  notificationTitle: string;
  notificationText: string;
  timelinePosts: TimelinePost[];
  notifications: NotificationItem[];
  profileBio: string;
  profileLocation: string;
  profileJoined: string;
  profileFollowingCount: string;
  profileFollowerCount: string;
  profilePostCount: string;
  profileCoverImage: string | null;
  profileFollowed: boolean;
  profilePinnedLabelVisible: boolean;
  profilePosts: TimelinePost[];
  deviceTime: string;
  showStatusBar: boolean;
  fullScreenMode: boolean;
  deviceFrameMode: boolean;
  showSettingsButton: boolean;
  bgColor: string;
};

const STORAGE_KEY = "x-mock-settings-v1";
const DEFAULT_STORAGE_KEY = "x-mock-default-settings-v1";
const SAVED_STORAGE_KEY = "x-mock-saved-presets-v1";

const initialSettings: XSettings = {
  screenType: "timeline",
  themeKey: "light",
  appName: "Postly",
  showScreenLabel: true,
  displayName: "青井 映",
  username: "aoi_scene",
  verified: false,
  avatarLabel: "A",
  avatarImage: null,
  postText: "誰かの何気ない投稿が、人生を少しだけ変えることがある。\n\nこれは、映画の中の架空SNS画面です。",
  postTime: "21:12",
  postDate: "2026年4月18日",
  postImages: [],
  currentImageIndex: 0,
  replyCount: 12,
  repostCount: 48,
  quoteCount: 6,
  likeCount: 394,
  viewCount: "8,245",
  liked: false,
  reposted: false,
  bookmarked: false,
  replyUserName: "guest_user",
  replyDisplayName: "Guest",
  replyAvatarLabel: "G",
  replyAvatarImage: null,
  replyInput: "これ、続きが気になる。",
  replyTime: "今",
  replies: [
    { id: "r1", username: "ren_film", displayName: "Ren", avatarLabel: "R", avatarImage: null, text: "この一文だけで物語が始まりそう。", time: "3分", replyCount: 1, repostCount: 2, likeCount: 4, viewCount: "128", liked: false, reposted: false },
    { id: "r2", username: "mika_story", displayName: "Mika", avatarLabel: "M", avatarImage: null, text: "撮影用ならかなり自然に見えるね。", time: "12分", replyCount: 0, repostCount: 1, likeCount: 9, viewCount: "342", liked: false, reposted: false },
  ],
  notificationTitle: "新しい通知",
  notificationText: "あなたの投稿に新しい返信がありました",
  timelinePosts: [
    { id: "t1", displayName: "sample user", username: "sample", avatarLabel: "S", avatarImage: null, verified: false, text: "撮影用のタイムライン投稿。背景として自然に流せます。", time: "18分", images: [], currentImageIndex: 0, replyCount: 12, repostCount: 24, likeCount: 85, viewCount: "1,902", liked: false, reposted: false, bookmarked: false },
    { id: "t2", displayName: "news mock", username: "news_mock", avatarLabel: "N", avatarImage: null, verified: false, text: "これは架空SNSの画面です。実在サービス名を避けて撮影できます。", time: "31分", images: [], currentImageIndex: 0, replyCount: 4, repostCount: 18, likeCount: 64, viewCount: "842", liked: false, reposted: false, bookmarked: false },
  ],
  notifications: [
    { id: "n1", kind: "like", displayName: "sample user", username: "sample", avatarLabel: "S", avatarImage: null, title: "いいねされました", text: "あなたの投稿にいいねしました", time: "2分" },
    { id: "n2", kind: "repost", displayName: "news mock", username: "news_mock", avatarLabel: "N", avatarImage: null, title: "リポストされました", text: "あなたの投稿がリポストされました", time: "12分" },
    { id: "n3", kind: "reply", displayName: "Guest", username: "guest_user", avatarLabel: "G", avatarImage: null, title: "新しい返信", text: "これ、続きが気になる。", time: "今" },
  ],
  profileBio: "映画・撮影用の架空SNSアカウント。これは実在サービスではありません。",
  profileLocation: "Tokyo, Japan",
  profileJoined: "2026年4月から利用しています",
  profileFollowingCount: "128",
  profileFollowerCount: "3,482",
  profilePostCount: "248",
  profileCoverImage: null,
  profileFollowed: false,
  profilePinnedLabelVisible: true,
  profilePosts: [
    { id: "p1", displayName: "青井 映", username: "aoi_scene", avatarLabel: "A", avatarImage: null, verified: false, text: "プロフィール画面の一番上に表示する投稿です。固定表記はON/OFFできます。", time: "2時間", images: [], currentImageIndex: 0, replyCount: 3, repostCount: 12, likeCount: 64, viewCount: "1,248", liked: false, reposted: false, bookmarked: false },
    { id: "p2", displayName: "青井 映", username: "aoi_scene", avatarLabel: "A", avatarImage: null, verified: false, text: "撮影用のプロフィール投稿。スクロールした時の自然な量を最初から用意しています。", time: "6時間", images: [], currentImageIndex: 0, replyCount: 1, repostCount: 5, likeCount: 32, viewCount: "728", liked: false, reposted: false, bookmarked: false },
    { id: "p3", displayName: "青井 映", username: "aoi_scene", avatarLabel: "A", avatarImage: null, verified: false, text: "現場終わり。夜の空気だけ少し持って帰る。", time: "1日", images: [], currentImageIndex: 0, replyCount: 4, repostCount: 18, likeCount: 141, viewCount: "3,502", liked: false, reposted: false, bookmarked: false },
    { id: "p4", displayName: "青井 映", username: "aoi_scene", avatarLabel: "A", avatarImage: null, verified: false, text: "言葉にする前の沈黙が、いちばん芝居になる瞬間がある。", time: "2日", images: [], currentImageIndex: 0, replyCount: 7, repostCount: 22, likeCount: 203, viewCount: "5,801", liked: false, reposted: false, bookmarked: false },
    { id: "p5", displayName: "青井 映", username: "aoi_scene", avatarLabel: "A", avatarImage: null, verified: false, text: "新しい作品の準備中。画面に映らない時間が、画面を強くする。", time: "4日", images: [], currentImageIndex: 0, replyCount: 2, repostCount: 9, likeCount: 88, viewCount: "2,190", liked: false, reposted: false, bookmarked: false },
    { id: "p6", displayName: "青井 映", username: "aoi_scene", avatarLabel: "A", avatarImage: null, verified: false, text: "今日は少しだけ遠回りして帰る。そういう日があっていい。", time: "1週間", images: [], currentImageIndex: 0, replyCount: 0, repostCount: 3, likeCount: 45, viewCount: "980", liked: false, reposted: false, bookmarked: false },
  ],
  deviceTime: "21:12",
  showStatusBar: true,
  fullScreenMode: false,
  deviceFrameMode: false,
  showSettingsButton: true,
  bgColor: "#e5e7eb",
};

const themes: Record<XThemeKey, {
  label: string;
  page: string;
  phone: string;
  panel: string;
  text: string;
  sub: string;
  border: string;
  button: string;
  accent: string;
  soft: string;
  input: string;
}> = {
  light: {
    label: "基本",
    page: "bg-slate-100",
    phone: "bg-white",
    panel: "bg-white",
    text: "text-slate-950",
    sub: "text-slate-500",
    border: "border-slate-200",
    button: "bg-slate-950 text-white",
    accent: "text-sky-500",
    soft: "bg-slate-50",
    input: "bg-white border-slate-200 text-slate-950 placeholder:text-slate-400",
  },
  dark: {
    label: "ダークテーマ",
    page: "bg-zinc-950",
    phone: "bg-black",
    panel: "bg-black",
    text: "text-zinc-50",
    sub: "text-zinc-500",
    border: "border-zinc-800",
    button: "bg-zinc-50 text-zinc-950",
    accent: "text-sky-400",
    soft: "bg-zinc-900",
    input: "bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-500",
  }
};

function normalizeXSettings(value: Partial<XSettings> | null | undefined): XSettings {
  const merged = { ...initialSettings, ...(value || {}) } as XSettings;
  if (merged.themeKey !== "dark") merged.themeKey = "light";
  if ((merged as any).screenType === "detail") merged.screenType = "post";
  if ((merged as any).screenType === "search") merged.screenType = "timeline";
  if (!["post", "timeline", "notifications", "profile"].includes(merged.screenType)) merged.screenType = "timeline";
  if (!Array.isArray(merged.profilePosts)) merged.profilePosts = [];
  if (typeof (merged as any).profileFollowed !== "boolean") merged.profileFollowed = false;
  if (!(merged as any).replyTime) merged.replyTime = "今";
  if (typeof (merged as any).showScreenLabel !== "boolean") merged.showScreenLabel = true;
  if (typeof (merged as any).profilePinnedLabelVisible !== "boolean") merged.profilePinnedLabelVisible = true;
  merged.postImages = Array.isArray(merged.postImages) ? merged.postImages.slice(0, 4) : [];
  merged.replies = (merged.replies || []).map((reply: any) => ({
    ...reply,
    replyCount: typeof reply.replyCount === "number" ? reply.replyCount : 0,
    repostCount: typeof reply.repostCount === "number" ? reply.repostCount : 0,
    likeCount: typeof reply.likeCount === "number" ? reply.likeCount : 0,
    viewCount: typeof reply.viewCount === "string" ? reply.viewCount : "0",
    liked: typeof reply.liked === "boolean" ? reply.liked : false,
    reposted: typeof reply.reposted === "boolean" ? reply.reposted : false,
  }));
  merged.timelinePosts = (merged.timelinePosts || []).map((post: any) => ({ ...post, images: Array.isArray(post.images) ? post.images.slice(0, 4) : [] }));
  merged.profilePosts = (merged.profilePosts || []).map((post: any) => ({ ...post, time: post.time === "固定" ? "2026年4月18日 21:00" : post.time, images: Array.isArray(post.images) ? post.images.slice(0, 4) : [] }));
  return merged;
}


function readStoredDefaultSettings(): XSettings {
  if (typeof window === "undefined") return initialSettings;
  try {
    const raw = localStorage.getItem(DEFAULT_STORAGE_KEY);
    return raw ? normalizeXSettings(JSON.parse(raw)) : initialSettings;
  } catch {
    return initialSettings;
  }
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

function ChatStatusBar({ time, className = "" }: { time: string; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[12px] font-semibold tracking-[-0.01em] opacity-[0.98] [text-shadow:0_1px_1px_rgba(0,0,0,0.12)]">
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

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function readImageFile(file: File, callback: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(typeof reader.result === "string" ? reader.result : "");
  reader.readAsDataURL(file);
}

function readImageFiles(files: FileList | null, callback: (dataUrls: string[]) => void) {
  if (!files || files.length === 0) return;
  const fileArray = Array.from(files);
  Promise.all(
    fileArray.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(file);
        })
    )
  ).then((urls) => callback(urls.filter(Boolean)));
}

function isVideoUrl(url: string) {
  return url.startsWith("data:video/") || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function Avatar({ image, label, size = "h-11 w-11", className = "" }: { image: string | null; label: string; size?: string; className?: string }) {
  return (
    <div className={cls(size, "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white", className)}>
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span>{label || "U"}</span>}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", className = "", disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "outline" | "ghost" | "danger"; className?: string; disabled?: boolean }) {
  const base = "inline-flex min-h-10 min-w-0 max-w-full items-center justify-center gap-2 whitespace-normal break-words rounded-2xl px-4 py-2 text-center text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45";
  const styles = variant === "primary" ? "bg-black text-white hover:bg-black/85" : variant === "danger" ? "bg-red-500 text-white hover:bg-red-600" : variant === "ghost" ? "bg-transparent text-black hover:bg-black/5" : "border border-black/10 bg-white text-black hover:bg-black/5";
  return <button type="button" onClick={onClick} disabled={disabled} className={cls(base, styles, className)}>{children}</button>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70">
      <span>{label}</span>
      <input value={value} type={type} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-black/10" />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70">
      <span>{label}</span>
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-black/10" />
    </label>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-black/75"><Icon className="h-4 w-4" />{title}</div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cls("min-w-0 rounded-full px-2.5 py-2 text-xs font-bold leading-tight transition", active ? "bg-black text-white" : "bg-white text-black/60 hover:bg-black/5")}>{children}</button>;
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={cls("relative h-7 w-12 rounded-full transition", checked ? "bg-black" : "bg-black/15")}>
      <span className={cls("absolute top-1 h-5 w-5 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
    </button>
  );
}

function ActionStat({ icon: Icon, value, active, activeClass, onClick }: { icon: React.ElementType; value: string | number; active?: boolean; activeClass?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cls("flex items-center gap-1.5 text-xs transition", active ? activeClass : "text-current opacity-70 hover:opacity-100")}>
      <Icon className={cls("h-[18px] w-[18px]", active ? "fill-current" : "")} />
      <span>{value}</span>
    </button>
  );
}

function MediaTile({ url, className = "" }: { url: string; className?: string }) {
  return isVideoUrl(url) ? (
    <video src={url} className={cls("h-full w-full object-cover", className)} autoPlay muted loop playsInline />
  ) : (
    <img src={url} alt="投稿メディア" className={cls("h-full w-full object-cover", className)} />
  );
}

function ImageGrid({ images }: { images: string[]; currentImageIndex?: number; setCurrentImageIndex?: (index: number) => void }) {
  const visibleImages = images.slice(0, 4);
  if (visibleImages.length === 0) return null;

  if (visibleImages.length === 1) {
    return (
      <div className="mt-3 overflow-hidden rounded-3xl border border-current/10 bg-black">
        <MediaTile url={visibleImages[0]} className="aspect-[16/10]" />
      </div>
    );
  }

  if (visibleImages.length === 2) {
    return (
      <div className="mt-3 grid aspect-[16/10] grid-cols-2 gap-0.5 overflow-hidden rounded-3xl border border-current/10 bg-black">
        {visibleImages.map((url, index) => <MediaTile key={index} url={url} />)}
      </div>
    );
  }

  if (visibleImages.length === 3) {
    return (
      <div className="mt-3 grid aspect-[16/10] grid-cols-2 gap-0.5 overflow-hidden rounded-3xl border border-current/10 bg-black">
        <MediaTile url={visibleImages[0]} className="row-span-2" />
        <MediaTile url={visibleImages[1]} />
        <MediaTile url={visibleImages[2]} />
      </div>
    );
  }

  return (
    <div className="mt-3 grid aspect-[16/10] grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-3xl border border-current/10 bg-black">
      {visibleImages.map((url, index) => <MediaTile key={index} url={url} />)}
    </div>
  );
}

export default function XMockCreator() {
  const router = useRouter();
  const [settings, setSettings] = useState<XSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<SettingsTab>("create");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [replyPanelOpen, setReplyPanelOpen] = useState(false);
  const [presetName, setPresetName] = useState("X投稿_01");
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);

  const theme = themes[settings.themeKey] || themes.light;
  const statusBarVisible = settings.showStatusBar;
  const displayReplyCount = settings.replyCount + settings.replies.length;
  const displayLikeCount = settings.likeCount + (settings.liked ? 1 : 0);
  const displayRepostCount = settings.repostCount + (settings.reposted ? 1 : 0);

  const update = <K extends keyof XSettings>(key: K, value: XSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const clampMedia = (items: string[]) => items.slice(0, 4);

  const parseCount = (value: string) => {
    const parsed = Number(String(value).replace(/[^0-9-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCount = (value: number) => Math.max(0, value).toLocaleString("ja-JP");

  const toggleProfileFollow = () => {
    setSettings((prev) => {
      const nextFollowed = !prev.profileFollowed;
      const current = parseCount(prev.profileFollowerCount);
      return {
        ...prev,
        profileFollowed: nextFollowed,
        profileFollowerCount: formatCount(current + (nextFollowed ? 1 : -1)),
      };
    });
  };

  const screenLabel = (type: XScreenType) => {
    if (type === "post") return "ポスト";
    if (type === "notifications") return "通知";
    if (type === "profile") return "プロフィール";
    return "タイムライン";
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings(normalizeXSettings(JSON.parse(saved)));
      const presets = localStorage.getItem(SAVED_STORAGE_KEY);
      if (presets) setSavedPresets(JSON.parse(presets));
    } catch {
      // localStorageが使えない環境では初期値のまま表示
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    try { localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedPresets)); } catch {}
  }, [savedPresets]);

  const addReply = () => {
    const text = settings.replyInput.trim();
    if (!text) return;
    const reply: ReplyItem = {
      id: String(Date.now()),
      username: settings.replyUserName || "guest_user",
      displayName: settings.replyDisplayName || "Guest",
      avatarLabel: settings.replyAvatarLabel || "G",
      avatarImage: settings.replyAvatarImage,
      text,
      time: settings.replyTime || "今",
      replyCount: 0,
      repostCount: 0,
      likeCount: 0,
      viewCount: "0",
      liked: false,
      reposted: false,
    };
    update("replies", [reply, ...settings.replies]);
    update("replyInput", "");
    setReplyPanelOpen(true);
  };

  const deleteReply = (id: string) => update("replies", settings.replies.filter((reply) => reply.id !== id));

  const updateReply = <K extends keyof ReplyItem>(id: string, key: K, value: ReplyItem[K]) => {
    update("replies", settings.replies.map((reply) => reply.id === id ? { ...reply, [key]: value } : reply));
  };

  const updateTimelinePost = <K extends keyof TimelinePost>(id: string, key: K, value: TimelinePost[K]) => {
    update("timelinePosts", settings.timelinePosts.map((post) => post.id === id ? { ...post, [key]: value } : post));
  };

  const addTimelinePost = () => {
    const post: TimelinePost = {
      id: String(Date.now()),
      displayName: "new user",
      username: "new_user",
      avatarLabel: "N",
      avatarImage: null,
      verified: false,
      text: "新しいタイムライン投稿です。",
      time: "今",
      images: [],
      currentImageIndex: 0,
      replyCount: 0,
      repostCount: 0,
      likeCount: 0,
      viewCount: "0",
      liked: false,
      reposted: false,
      bookmarked: false,
    };
    update("timelinePosts", [post, ...settings.timelinePosts]);
  };

  const deleteTimelinePost = (id: string) => update("timelinePosts", settings.timelinePosts.filter((post) => post.id !== id));

  const updateProfilePost = <K extends keyof TimelinePost>(id: string, key: K, value: TimelinePost[K]) => {
    update("profilePosts", settings.profilePosts.map((post) => post.id === id ? { ...post, [key]: value } : post));
  };

  const addProfilePost = () => {
    const post: TimelinePost = {
      id: String(Date.now()),
      displayName: settings.displayName || "profile user",
      username: settings.username || "profile_user",
      avatarLabel: settings.avatarLabel || "P",
      avatarImage: settings.avatarImage,
      verified: settings.verified,
      text: "プロフィール専用の新しい投稿です。",
      time: "今",
      images: [],
      currentImageIndex: 0,
      replyCount: 0,
      repostCount: 0,
      likeCount: 0,
      viewCount: "0",
      liked: false,
      reposted: false,
      bookmarked: false,
    };
    update("profilePosts", [post, ...settings.profilePosts]);
  };

  const deleteProfilePost = (id: string) => update("profilePosts", settings.profilePosts.filter((post) => post.id !== id));

  const updateNotification = <K extends keyof NotificationItem>(id: string, key: K, value: NotificationItem[K]) => {
    update("notifications", settings.notifications.map((item) => item.id === id ? { ...item, [key]: value } : item));
  };

  const addNotification = () => {
    const item: NotificationItem = {
      id: String(Date.now()),
      kind: "custom",
      displayName: "new user",
      username: "new_user",
      avatarLabel: "N",
      avatarImage: null,
      title: "新しい通知",
      text: "通知文を入力できます。",
      time: "今",
    };
    update("notifications", [item, ...settings.notifications]);
  };

  const deleteNotification = (id: string) => update("notifications", settings.notifications.filter((item) => item.id !== id));

  const toggleReplyLike = (id: string) => {
    update("replies", settings.replies.map((reply) => reply.id === id ? { ...reply, liked: !reply.liked, likeCount: reply.likeCount + (reply.liked ? -1 : 1) } : reply));
  };

  const savePreset = () => {
    const name = presetName.trim() || `X保存_${savedPresets.length + 1}`;
    const preset: SavedPreset = { id: String(Date.now()), name, savedAt: new Date().toLocaleString("ja-JP"), settings };
    setSavedPresets((prev) => [preset, ...prev]);
  };

  const overwritePreset = (id: string) => {
    setSavedPresets((prev) => prev.map((preset) => preset.id === id ? { ...preset, settings, savedAt: new Date().toLocaleString("ja-JP") } : preset));
  };

  const duplicatePreset = (preset: SavedPreset) => {
    setSavedPresets((prev) => [{ ...preset, id: String(Date.now()), name: `${preset.name}_コピー`, savedAt: new Date().toLocaleString("ja-JP") }, ...prev]);
  };

  const removePreset = (id: string) => setSavedPresets((prev) => prev.filter((preset) => preset.id !== id));


  const saveCurrentAsDefaultSettings = () => {
    try { localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(settings)); } catch {}
  };

  const resetToStoredDefaultSettings = () => {
    setSettings(readStoredDefaultSettings());
  };

  const resetToInitialSettings = () => {
    try { localStorage.removeItem(DEFAULT_STORAGE_KEY); } catch {}
    setSettings(initialSettings);
  };

  const setFullscreenMode = async (enabled: boolean) => {
    update("fullScreenMode", enabled);
    if (typeof document === "undefined") return;
    try {
      if (enabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      if (!enabled && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // iOS Safariなど、Fullscreen API非対応環境ではアプリ内表示だけ切り替える
    }
  };

  const header = (
    <>
      {statusBarVisible && <ChatStatusBar time={settings.deviceTime} className="px-5 pb-2 pt-3" />}
      <div className={cls("relative flex h-[54px] items-center justify-center border-b px-4", theme.border)}>
        <button type="button" className="absolute left-4 grid h-9 w-9 place-items-center rounded-full active:bg-current/5" aria-label="戻る">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 max-w-[62%] text-center">
          <div className="truncate text-[16px] font-black leading-tight">{settings.appName}</div>
          {settings.showScreenLabel && <div className={cls("mt-0.5 text-[10px]", theme.sub)}>{screenLabel(settings.screenType)}</div>}
        </div>
        <div className="absolute right-4 flex items-center gap-3">
          <Search className="h-5 w-5" />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-full transition active:bg-current/10"
            aria-label="設定を開く"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );

  const postBlock = (compact = false) => (
    <article className={cls("border-b px-4 py-4", theme.border)}>
      <div className="flex items-start gap-3">
        <Avatar image={settings.avatarImage} label={settings.avatarLabel} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-[15px] font-black">{settings.displayName}</span>
            {settings.verified && <span className="grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-white"><Check className="h-3 w-3" /></span>}
            <span className={cls("truncate text-sm", theme.sub)}>@{settings.username}</span>
            <span className={cls("text-sm", theme.sub)}>· {settings.postTime}</span>
          </div>
          <div className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{settings.postText}</div>
          <ImageGrid images={settings.postImages} currentImageIndex={settings.currentImageIndex} setCurrentImageIndex={(index) => update("currentImageIndex", index)} />
          {!compact && (
            <div className={cls("mt-3 flex items-center gap-1 border-b pb-3 text-xs", theme.border, theme.sub)}>
              <span>{settings.postTime}</span><span>·</span><span>{settings.postDate}</span><span>·</span><span className={theme.text}>{settings.viewCount}</span><span>件の表示</span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <ActionStat icon={MessageCircle} value={displayReplyCount} onClick={() => setReplyPanelOpen((prev) => !prev)} />
            <ActionStat icon={Repeat2} value={displayRepostCount} active={settings.reposted} activeClass="text-green-500" onClick={() => update("reposted", !settings.reposted)} />
            <ActionStat icon={Heart} value={displayLikeCount} active={settings.liked} activeClass="text-pink-500" onClick={() => update("liked", !settings.liked)} />
            <ActionStat icon={BarChart3} value={settings.viewCount} />
            <button type="button" onClick={() => update("bookmarked", !settings.bookmarked)} className={cls("transition", settings.bookmarked ? "text-sky-500" : "opacity-70 hover:opacity-100")}><Bookmark className={cls("h-[18px] w-[18px]", settings.bookmarked ? "fill-current" : "")} /></button>
          </div>
        </div>
      </div>
    </article>
  );

  const replyComposer = (
    <div className={cls("border-b px-4 py-3", theme.border)}>
      <div className="flex gap-3">
        <Avatar image={settings.replyAvatarImage} label={settings.replyAvatarLabel} size="h-9 w-9" />
        <div className="flex-1">
          <input value={settings.replyInput} onChange={(e) => update("replyInput", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addReply(); }} placeholder="返信をポスト" className={cls("w-full rounded-full border px-4 py-2 text-sm outline-none", theme.input)} />
          <div className="mt-2 flex justify-end"><button type="button" onClick={addReply} className={cls("rounded-full px-4 py-1.5 text-xs font-black", theme.button)}>返信</button></div>
        </div>
      </div>
    </div>
  );

  const repliesBlock = (
    <div>
      {replyPanelOpen && replyComposer}
      {settings.replies.map((reply) => (
        <article key={reply.id} className={cls("border-b px-4 py-3", theme.border)}>
          <div className="flex gap-3">
            <Avatar image={reply.avatarImage} label={reply.avatarLabel} size="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-black">{reply.displayName}</span>
                <span className={cls("truncate text-xs", theme.sub)}>@{reply.username}</span>
                <span className={cls("text-xs", theme.sub)}>· {reply.time}</span>
                <button type="button" onClick={() => deleteReply(reply.id)} className="ml-auto opacity-50 hover:text-red-500 hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{reply.text}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <button type="button" className={cls(theme.sub, "flex items-center gap-1")}><MessageCircle className="h-4 w-4" />{reply.replyCount}</button>
                <button type="button" onClick={() => updateReply(reply.id, "reposted", !reply.reposted)} className={cls("flex items-center gap-1", reply.reposted ? "text-green-500" : theme.sub)}><Repeat2 className="h-4 w-4" />{reply.repostCount + (reply.reposted ? 1 : 0)}</button>
                <button type="button" onClick={() => toggleReplyLike(reply.id)} className={cls("flex items-center gap-1", reply.liked ? "text-pink-500" : theme.sub)}><Heart className={cls("h-4 w-4", reply.liked ? "fill-current" : "")} />{reply.likeCount}</button>
                <span className={cls(theme.sub, "flex items-center gap-1")}><BarChart3 className="h-4 w-4" />{reply.viewCount}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const timelinePostBlock = (post: TimelinePost, updater: <K extends keyof TimelinePost>(id: string, key: K, value: TimelinePost[K]) => void = updateTimelinePost) => (
    <article key={post.id} className={cls("border-b px-4 py-4", theme.border)}>
      <div className="flex items-start gap-3">
        <Avatar image={post.avatarImage} label={post.avatarLabel} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-[15px] font-black">{post.displayName}</span>
            {post.verified && <span className="grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-white"><Check className="h-3 w-3" /></span>}
            <span className={cls("truncate text-sm", theme.sub)}>@{post.username}</span>
            <span className={cls("text-sm", theme.sub)}>· {post.time}</span>
          </div>
          <div className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{post.text}</div>
          <ImageGrid images={post.images} currentImageIndex={post.currentImageIndex} setCurrentImageIndex={(index) => updater(post.id, "currentImageIndex", index)} />
          <div className="mt-3 flex items-center justify-between">
            <ActionStat icon={MessageCircle} value={post.replyCount} />
            <ActionStat icon={Repeat2} value={post.repostCount + (post.reposted ? 1 : 0)} active={post.reposted} activeClass="text-green-500" onClick={() => updater(post.id, "reposted", !post.reposted)} />
            <ActionStat icon={Heart} value={post.likeCount + (post.liked ? 1 : 0)} active={post.liked} activeClass="text-pink-500" onClick={() => updater(post.id, "liked", !post.liked)} />
            <ActionStat icon={BarChart3} value={post.viewCount} />
            <button type="button" onClick={() => updater(post.id, "bookmarked", !post.bookmarked)} className={cls("transition", post.bookmarked ? "text-sky-500" : "opacity-70 hover:opacity-100")}><Bookmark className={cls("h-[18px] w-[18px]", post.bookmarked ? "fill-current" : "")} /></button>
          </div>
        </div>
      </div>
    </article>
  );

  const profileScreen = (
    <div>
      <div className="relative">
        <div className={cls("h-32 w-full overflow-hidden", settings.profileCoverImage ? "bg-black" : "bg-gradient-to-br from-sky-200 via-indigo-200 to-slate-300")}>
          {settings.profileCoverImage && <img src={settings.profileCoverImage} alt="プロフィールカバー" className="h-full w-full object-cover" />}
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar image={settings.avatarImage} label={settings.avatarLabel} size="h-20 w-20" className="border-4 border-current/10" />
            <button
              type="button"
              onClick={toggleProfileFollow}
              className={cls("rounded-full border px-4 py-1.5 text-sm font-black transition", settings.profileFollowed ? "bg-transparent" : theme.button, settings.profileFollowed ? theme.border : "border-transparent")}
            >
              {settings.profileFollowed ? "フォロー中" : "フォロー"}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <h2 className="text-xl font-black leading-tight">{settings.displayName}</h2>
            {settings.verified && <span className="grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-white"><Check className="h-3.5 w-3.5" /></span>}
          </div>
          <div className={cls("text-sm", theme.sub)}>@{settings.username}</div>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{settings.profileBio}</div>
          <div className={cls("mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs", theme.sub)}>
            <span>{settings.profileLocation}</span>
            <span>{settings.profileJoined}</span>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <span><b>{settings.profileFollowingCount}</b> <span className={theme.sub}>フォロー中</span></span>
            <span><b>{settings.profileFollowerCount}</b> <span className={theme.sub}>フォロワー</span></span>
          </div>
        </div>
        <div className={cls("grid grid-cols-3 border-b text-center text-sm font-bold", theme.border)}>
          <div className="border-b-2 border-current py-3">ポスト</div>
          <div className={cls("py-3", theme.sub)}>返信</div>
          <div className={cls("py-3", theme.sub)}>メディア</div>
        </div>
      </div>
      {settings.profilePosts.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm opacity-50">プロフィール投稿はありません</div>
      ) : settings.profilePosts.map((post, index) => (
        <div key={post.id}>
          {index === 0 && settings.profilePinnedLabelVisible && (
            <div className={cls("flex items-center gap-2 px-4 pt-3 text-xs font-bold", theme.sub)}>
              <Pin className="h-3.5 w-3.5" />固定されたポスト
            </div>
          )}
          {timelinePostBlock(post, updateProfilePost)}
        </div>
      ))}
    </div>
  );
  const searchScreen = (
    <div>
      <div className={cls("border-b px-4 py-3", theme.border)}>
        <div className={cls("rounded-full px-4 py-2 text-sm", theme.soft, theme.sub)}>検索</div>
      </div>
      <div className={cls("border-b px-4 py-3 text-sm font-black", theme.border)}>話題のポスト</div>
      {settings.timelinePosts.map((post) => timelinePostBlock(post))}
    </div>
  );

  const notificationsScreen = (
    <div>
      <div className={cls("border-b px-4 py-3 text-sm font-black", theme.border)}>通知</div>
      {settings.notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm opacity-50">通知はありません</div>
      ) : settings.notifications.map((item) => (
        <article key={item.id} className={cls("border-b px-4 py-4", theme.border)}>
          <div className="flex gap-3">
            <Avatar image={item.avatarImage} label={item.avatarLabel} size="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-black">{item.displayName}</span>
                <span className={cls("truncate text-xs", theme.sub)}>@{item.username}</span>
                <span className={cls("text-xs", theme.sub)}>· {item.time}</span>
              </div>
              <div className="mt-1 text-sm font-bold">{item.title}</div>
              <div className={cls("mt-1 text-sm", theme.sub)}>{item.text}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const bottomNav = (
    <div className={cls("absolute inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t px-3 py-2", theme.border, theme.panel)}>
      <button type="button" onClick={() => update("screenType", "timeline")} className={cls("grid place-items-center rounded-2xl py-2 transition active:bg-current/10", settings.screenType === "timeline" ? theme.accent : theme.sub)} aria-label="ホーム / タイムライン">
        <Home className="h-5 w-5" />
      </button>
      <button type="button" className={cls("grid place-items-center rounded-2xl py-2 transition", theme.sub)} aria-label="検索（機能なし）">
        <Search className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => update("screenType", "post")} className={cls("grid place-items-center rounded-2xl py-2 transition active:bg-current/10", settings.screenType === "post" ? theme.accent : theme.sub)} aria-label="ポスト">
        <MessageCircle className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => update("screenType", "notifications")} className={cls("grid place-items-center rounded-2xl py-2 transition active:bg-current/10", settings.screenType === "notifications" ? theme.accent : theme.sub)} aria-label="通知">
        <Bell className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => update("screenType", "profile")} className={cls("grid place-items-center rounded-2xl py-2 transition active:bg-current/10", settings.screenType === "profile" ? theme.accent : theme.sub)} aria-label="プロフィール">
        <UserCircle2 className="h-5 w-5" />
      </button>
    </div>
  );

  const phoneContent = (
    <div className={cls("relative h-full overflow-hidden", theme.phone, theme.text)}>
      {header}
      <div className={cls(statusBarVisible ? "h-[calc(100%-86px)]" : "h-[calc(100%-54px)]", "overflow-y-auto pb-24")}>
        {settings.screenType === "profile" ? profileScreen : settings.screenType === "notifications" ? notificationsScreen : settings.screenType === "post" ? (
          <>
            {postBlock(false)}
            {repliesBlock}
          </>
        ) : (
          <>
            <div className={cls("border-b px-4 py-3 text-sm font-black", theme.border)}>おすすめ</div>
            {postBlock(true)}
            {replyPanelOpen && repliesBlock}
            {settings.timelinePosts.map((post) => timelinePostBlock(post))}
          </>
        )}
      </div>
      {bottomNav}
      {!settingsOpen && settings.showSettingsButton && (
        <button type="button" onClick={() => setSettingsOpen(true)} className="absolute bottom-20 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-black text-white shadow-lg"><Settings2 className="h-5 w-5" /></button>
      )}
    </div>
  );

  const phone = settings.deviceFrameMode ? (
    <div className={cls("mx-auto flex h-[100dvh] min-h-0 flex-col bg-black", settings.fullScreenMode ? "max-w-none" : "max-w-md")}>
      <div className="relative h-full min-h-0 flex-1 overflow-hidden p-4">
        <div className="relative h-full min-h-0 w-full overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl">
          {phoneContent}
        </div>
      </div>
    </div>
  ) : (
    <div className={cls("mx-auto h-[100dvh] min-h-0 w-full overflow-hidden bg-white", settings.fullScreenMode ? "max-w-none" : "max-w-md")} style={{ backgroundColor: settings.bgColor || undefined }}>
      {phoneContent}
    </div>
  );

  return (
    <main className={cls("relative min-h-[100dvh]", theme.page)} style={{ backgroundColor: settings.bgColor || undefined }}>
      {phone}

        {settingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/35">
            <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[86vh] w-full max-w-md min-w-0 flex-col overflow-hidden rounded-t-[28px] bg-[#fafafa] px-4 pt-4 text-black shadow-2xl">
              <div className="mb-4 shrink-0 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setSettingsOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-black/70 transition hover:bg-black/[0.07]" aria-label="閉じる"><XIcon className="h-5 w-5" /></button>
                <div className="text-lg font-semibold">設定</div>
                <div className="h-10 w-10" aria-hidden="true" />
              </div>

              <div className="grid shrink-0 grid-cols-4 gap-1 rounded-2xl bg-black/5 p-1 text-center">
              <TabButton active={activeTab === "create"} onClick={() => setActiveTab("create")}>作成</TabButton>
              <TabButton active={activeTab === "replies"} onClick={() => setActiveTab("replies")}>返信</TabButton>
                <TabButton active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")}>TL</TabButton>
              <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")}>通知</TabButton>
              <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>プロフィール</TabButton>
              <TabButton active={activeTab === "saved"} onClick={() => setActiveTab("saved")}>保存</TabButton>
              <TabButton active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>画面</TabButton>
              <TabButton active={activeTab === "modes"} onClick={() => setActiveTab("modes")}>モード</TabButton>
            </div>

              <div className="mt-4 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-[max(18px,calc(env(safe-area-inset-bottom)+18px))] pr-1">
                <div className="grid gap-4">
              {activeTab === "create" && (
                <>
                  <SectionCard icon={Palette} title="表示タイプ / テーマ">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(["timeline", "post", "notifications", "profile"] as XScreenType[]).map((type) => <Button key={type} variant={settings.screenType === type ? "primary" : "outline"} onClick={() => update("screenType", type)} className="px-2">{screenLabel(type)}</Button>)}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(Object.keys(themes) as XThemeKey[]).map((key) => <Button key={key} variant={settings.themeKey === key ? "primary" : "outline"} onClick={() => update("themeKey", key)}>{themes[key].label}</Button>)}
                    </div>
                    <Field label="アプリ名" value={settings.appName} onChange={(v) => update("appName", v)} />
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-black/10 p-3"><div className="min-w-0"><div className="text-sm font-bold">画面名表記</div><div className="text-xs text-black/50">Postly下の「タイムライン / ポスト / 通知 / プロフィール」を表示</div></div><Switch checked={settings.showScreenLabel} onChange={(v) => update("showScreenLabel", v)} /></div>
                  </SectionCard>

                  <SectionCard icon={UserCircle2} title="投稿ユーザー">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="表示名" value={settings.displayName} onChange={(v) => update("displayName", v)} />
                      <Field label="ユーザー名" value={settings.username} onChange={(v) => update("username", v)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="アイコン文字" value={settings.avatarLabel} onChange={(v) => update("avatarLabel", v.slice(0, 2))} />
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>アイコン画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => update("avatarImage", url))} className="w-full min-w-0 text-xs" /></label>
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-bold">認証バッジ</div><div className="text-xs text-black/50">青いチェックを表示</div></div><Switch checked={settings.verified} onChange={(v) => update("verified", v)} /></div>
                  </SectionCard>

                  <SectionCard icon={MessageCircle} title="投稿内容">
                    <TextArea label="本文" value={settings.postText} onChange={(v) => update("postText", v)} rows={5} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="投稿時刻" value={settings.postTime} onChange={(v) => update("postTime", v)} />
                      <Field label="投稿日" value={settings.postDate} onChange={(v) => update("postDate", v)} />
                    </div>
                    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>投稿メディア（画像 / 動画・最大4枚）</span><input type="file" accept="image/*,video/*" multiple onChange={(e) => readImageFiles(e.target.files, (urls) => { update("postImages", clampMedia([...settings.postImages, ...urls])); update("currentImageIndex", 0); })} className="w-full min-w-0 text-xs" /></label>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => update("postImages", [])}><Trash2 className="h-4 w-4" />メディアを全削除</Button>
                      <Button variant="outline" onClick={() => update("currentImageIndex", 0)}><ImageIcon className="h-4 w-4" />1枚目へ</Button>
                    </div>
                  </SectionCard>

                  <SectionCard icon={BarChart3} title="数値 / 操作状態">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="返信数" type="number" value={String(settings.replyCount)} onChange={(v) => update("replyCount", Number(v) || 0)} />
                      <Field label="リポスト数" type="number" value={String(settings.repostCount)} onChange={(v) => update("repostCount", Number(v) || 0)} />
                      <Field label="引用数" type="number" value={String(settings.quoteCount)} onChange={(v) => update("quoteCount", Number(v) || 0)} />
                      <Field label="いいね数" type="number" value={String(settings.likeCount)} onChange={(v) => update("likeCount", Number(v) || 0)} />
                      <Field label="表示数" value={settings.viewCount} onChange={(v) => update("viewCount", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Button variant={settings.liked ? "primary" : "outline"} onClick={() => update("liked", !settings.liked)}>いいね</Button>
                      <Button variant={settings.reposted ? "primary" : "outline"} onClick={() => update("reposted", !settings.reposted)}>リポスト</Button>
                      <Button variant={settings.bookmarked ? "primary" : "outline"} onClick={() => update("bookmarked", !settings.bookmarked)}>保存</Button>
                    </div>
                  </SectionCard>
                </>
              )}

              {activeTab === "replies" && (
                <>
                  <SectionCard icon={Send} title="返信するユーザー">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="表示名" value={settings.replyDisplayName} onChange={(v) => update("replyDisplayName", v)} />
                      <Field label="ユーザー名" value={settings.replyUserName} onChange={(v) => update("replyUserName", v)} />
                      <Field label="アイコン文字" value={settings.replyAvatarLabel} onChange={(v) => update("replyAvatarLabel", v.slice(0, 2))} />
                      <Field label="返信時間" value={settings.replyTime} onChange={(v) => update("replyTime", v)} />
                    </div>
                    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>アイコン画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => update("replyAvatarImage", url))} className="w-full min-w-0 text-xs" /></label>
                    <TextArea label="送信する返信" value={settings.replyInput} onChange={(v) => update("replyInput", v)} rows={3} />
                    <Button onClick={addReply}><Send className="h-4 w-4" />返信を送信</Button>
                  </SectionCard>

                  <SectionCard icon={MessageCircle} title="返信一覧">
                    {settings.replies.length === 0 ? <p className="text-sm text-black/50">返信はまだありません。</p> : settings.replies.map((reply, index) => (
                      <div key={reply.id} className="grid gap-3 rounded-3xl border border-black/10 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-black"><Avatar image={reply.avatarImage} label={reply.avatarLabel} size="h-7 w-7" />返信 {index + 1}</div>
                          <Button variant="danger" onClick={() => deleteReply(reply.id)}><Trash2 className="h-4 w-4" />削除</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="表示名" value={reply.displayName} onChange={(v) => updateReply(reply.id, "displayName", v)} />
                          <Field label="ユーザー名" value={reply.username} onChange={(v) => updateReply(reply.id, "username", v)} />
                          <Field label="アイコン文字" value={reply.avatarLabel} onChange={(v) => updateReply(reply.id, "avatarLabel", v.slice(0, 2))} />
                          <Field label="返信時間" value={reply.time} onChange={(v) => updateReply(reply.id, "time", v)} />
                          <Field label="返信数" type="number" value={String(reply.replyCount)} onChange={(v) => updateReply(reply.id, "replyCount", Number(v) || 0)} />
                          <Field label="リポスト数" type="number" value={String(reply.repostCount)} onChange={(v) => updateReply(reply.id, "repostCount", Number(v) || 0)} />
                          <Field label="いいね数" type="number" value={String(reply.likeCount)} onChange={(v) => updateReply(reply.id, "likeCount", Number(v) || 0)} />
                          <Field label="表示数" value={reply.viewCount} onChange={(v) => updateReply(reply.id, "viewCount", v)} />
                        </div>
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>アイコン画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => updateReply(reply.id, "avatarImage", url))} className="w-full min-w-0 text-xs" /></label>
                        <TextArea label="返信本文" value={reply.text} onChange={(v) => updateReply(reply.id, "text", v)} rows={3} />
                        <div className="flex flex-wrap gap-2">
                          <Button variant={reply.liked ? "primary" : "outline"} onClick={() => toggleReplyLike(reply.id)}>いいねON/OFF</Button>
                          <Button variant={reply.reposted ? "primary" : "outline"} onClick={() => updateReply(reply.id, "reposted", !reply.reposted)}>リポストON/OFF</Button>
                        </div>
                      </div>
                    ))}
                  </SectionCard>
                </>
              )}

              {activeTab === "timeline" && (
                <>
                  <SectionCard icon={MessageCircle} title="タイムライン投稿一覧">
                    <Button onClick={addTimelinePost}>投稿を追加</Button>
                    {settings.timelinePosts.length === 0 ? <p className="text-sm text-black/50">タイムライン投稿はありません。</p> : settings.timelinePosts.map((post, index) => (
                      <div key={post.id} className="grid gap-3 rounded-3xl border border-black/10 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-black">タイムライン投稿 {index + 1}</div>
                          <Button variant="danger" onClick={() => deleteTimelinePost(post.id)}><Trash2 className="h-4 w-4" />削除</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="表示名" value={post.displayName} onChange={(v) => updateTimelinePost(post.id, "displayName", v)} />
                          <Field label="ユーザー名" value={post.username} onChange={(v) => updateTimelinePost(post.id, "username", v)} />
                          <Field label="アイコン文字" value={post.avatarLabel} onChange={(v) => updateTimelinePost(post.id, "avatarLabel", v.slice(0, 2))} />
                          <Field label="投稿時間" value={post.time} onChange={(v) => updateTimelinePost(post.id, "time", v)} />
                        </div>
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>アイコン画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => updateTimelinePost(post.id, "avatarImage", url))} className="w-full min-w-0 text-xs" /></label>
                        <TextArea label="本文" value={post.text} onChange={(v) => updateTimelinePost(post.id, "text", v)} rows={4} />
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>投稿メディア（画像 / 動画・最大4枚）</span><input type="file" accept="image/*,video/*" multiple onChange={(e) => readImageFiles(e.target.files, (urls) => { updateTimelinePost(post.id, "images", clampMedia([...post.images, ...urls])); updateTimelinePost(post.id, "currentImageIndex", 0); })} className="w-full min-w-0 text-xs" /></label>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => updateTimelinePost(post.id, "images", [])}>メディアを全削除</Button>
                          <Button variant={post.verified ? "primary" : "outline"} onClick={() => updateTimelinePost(post.id, "verified", !post.verified)}>認証バッジ</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="返信数" type="number" value={String(post.replyCount)} onChange={(v) => updateTimelinePost(post.id, "replyCount", Number(v) || 0)} />
                          <Field label="リポスト数" type="number" value={String(post.repostCount)} onChange={(v) => updateTimelinePost(post.id, "repostCount", Number(v) || 0)} />
                          <Field label="いいね数" type="number" value={String(post.likeCount)} onChange={(v) => updateTimelinePost(post.id, "likeCount", Number(v) || 0)} />
                          <Field label="表示数" value={post.viewCount} onChange={(v) => updateTimelinePost(post.id, "viewCount", v)} />
                        </div>
                      </div>
                    ))}
                  </SectionCard>
                </>
              )}

              {activeTab === "notifications" && (
                <SectionCard icon={Bell} title="通知設定">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={addNotification}>通知を追加</Button>
                    <Button variant="outline" onClick={() => update("screenType", "notifications")}>通知画面を表示</Button>
                  </div>
                  <p className="text-sm text-black/50">通知画面に表示する内容を自由に作成・編集できます。</p>
                  {settings.notifications.length === 0 ? <p className="text-sm text-black/50">通知はありません。</p> : settings.notifications.map((item, index) => (
                    <div key={item.id} className="grid gap-3 rounded-3xl border border-black/10 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-black"><Avatar image={item.avatarImage} label={item.avatarLabel} size="h-7 w-7" />通知 {index + 1}</div>
                        <Button variant="danger" onClick={() => deleteNotification(item.id)}><Trash2 className="h-4 w-4" />削除</Button>
                      </div>
                      <label className="grid gap-1.5 text-sm font-semibold text-black/70">
                        <span>通知タイプ</span>
                        <select
                          value={item.kind}
                          onChange={(e) => updateNotification(item.id, "kind", e.target.value as NotificationItem["kind"])}
                          className="w-full min-w-0 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                        >
                          <option value="reply">返信</option>
                          <option value="like">いいね</option>
                          <option value="repost">リポスト</option>
                          <option value="follow">フォロー</option>
                          <option value="custom">カスタム</option>
                        </select>
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="表示名" value={item.displayName} onChange={(v) => updateNotification(item.id, "displayName", v)} />
                        <Field label="ユーザー名" value={item.username} onChange={(v) => updateNotification(item.id, "username", v)} />
                        <Field label="アイコン文字" value={item.avatarLabel} onChange={(v) => updateNotification(item.id, "avatarLabel", v.slice(0, 2))} />
                        <Field label="通知時間" value={item.time} onChange={(v) => updateNotification(item.id, "time", v)} />
                      </div>
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>アイコン画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => updateNotification(item.id, "avatarImage", url))} className="w-full min-w-0 text-xs" /></label>
                      <Field label="通知タイトル" value={item.title} onChange={(v) => updateNotification(item.id, "title", v)} />
                      <TextArea label="通知本文" value={item.text} onChange={(v) => updateNotification(item.id, "text", v)} rows={3} />
                    </div>
                  ))}
                </SectionCard>
              )}

              {activeTab === "profile" && (
                <>
                  <SectionCard icon={UserCircle2} title="プロフィール画面">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="表示名" value={settings.displayName} onChange={(v) => update("displayName", v)} />
                      <Field label="ユーザー名" value={settings.username} onChange={(v) => update("username", v)} />
                      <Field label="アイコン文字" value={settings.avatarLabel} onChange={(v) => update("avatarLabel", v.slice(0, 2))} />
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>アイコン画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => update("avatarImage", url))} className="w-full min-w-0 text-xs" /></label>
                    </div>
                    <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>カバー画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => update("profileCoverImage", url))} className="w-full min-w-0 text-xs" /></label>
                    <TextArea label="プロフィール文" value={settings.profileBio} onChange={(v) => update("profileBio", v)} rows={4} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="場所" value={settings.profileLocation} onChange={(v) => update("profileLocation", v)} />
                      <Field label="開始日" value={settings.profileJoined} onChange={(v) => update("profileJoined", v)} />
                      <Field label="フォロー数" value={settings.profileFollowingCount} onChange={(v) => update("profileFollowingCount", v)} />
                      <Field label="フォロワー数" value={settings.profileFollowerCount} onChange={(v) => update("profileFollowerCount", v)} />
                      <Field label="投稿数" value={settings.profilePostCount} onChange={(v) => update("profilePostCount", v)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant={settings.verified ? "primary" : "outline"} onClick={() => update("verified", !settings.verified)}>認証バッジ</Button>
                      <Button variant={settings.profileFollowed ? "primary" : "outline"} onClick={toggleProfileFollow}>フォロー状態</Button>
                      <Button variant={settings.profilePinnedLabelVisible ? "primary" : "outline"} onClick={() => update("profilePinnedLabelVisible", !settings.profilePinnedLabelVisible)}>固定表記ON/OFF</Button>
                      <Button variant="outline" onClick={() => update("profileCoverImage", null)}>カバー削除</Button>
                    </div>
                  </SectionCard>
                  <SectionCard icon={MessageCircle} title="プロフィール専用投稿">
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={addProfilePost}>プロフィール投稿を追加</Button>
                      <Button variant="outline" onClick={() => update("screenType", "profile")}>プロフィール画面を表示</Button>
                    </div>
                    <p className="text-sm text-black/50">ここで作った投稿だけがプロフィール画面の「ポスト」欄に表示されます。タイムライン投稿とは別管理です。</p>
                    {settings.profilePosts.length === 0 ? <p className="text-sm text-black/50">プロフィール投稿はありません。</p> : settings.profilePosts.map((post, index) => (
                      <div key={post.id} className="grid gap-3 rounded-3xl border border-black/10 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-black">プロフィール投稿 {index + 1}</div>
                          <Button variant="danger" onClick={() => deleteProfilePost(post.id)}><Trash2 className="h-4 w-4" />削除</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="表示名" value={post.displayName} onChange={(v) => updateProfilePost(post.id, "displayName", v)} />
                          <Field label="ユーザー名" value={post.username} onChange={(v) => updateProfilePost(post.id, "username", v)} />
                          <Field label="アイコン文字" value={post.avatarLabel} onChange={(v) => updateProfilePost(post.id, "avatarLabel", v.slice(0, 2))} />
                          <Field label="投稿日時" placeholder="例：2026年4月18日 21:00" value={post.time} onChange={(v) => updateProfilePost(post.id, "time", v)} />
                        </div>
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>アイコン画像</span><input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && readImageFile(e.target.files[0], (url) => updateProfilePost(post.id, "avatarImage", url))} className="w-full min-w-0 text-xs" /></label>
                        <TextArea label="本文" value={post.text} onChange={(v) => updateProfilePost(post.id, "text", v)} rows={4} />
                        <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-black/70"><span>投稿メディア（画像 / 動画・最大4枚）</span><input type="file" accept="image/*,video/*" multiple onChange={(e) => readImageFiles(e.target.files, (urls) => { updateProfilePost(post.id, "images", clampMedia([...post.images, ...urls])); updateProfilePost(post.id, "currentImageIndex", 0); })} className="w-full min-w-0 text-xs" /></label>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => updateProfilePost(post.id, "images", [])}>メディアを全削除</Button>
                          <Button variant={post.verified ? "primary" : "outline"} onClick={() => updateProfilePost(post.id, "verified", !post.verified)}>認証バッジ</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="返信数" type="number" value={String(post.replyCount)} onChange={(v) => updateProfilePost(post.id, "replyCount", Number(v) || 0)} />
                          <Field label="リポスト数" type="number" value={String(post.repostCount)} onChange={(v) => updateProfilePost(post.id, "repostCount", Number(v) || 0)} />
                          <Field label="いいね数" type="number" value={String(post.likeCount)} onChange={(v) => updateProfilePost(post.id, "likeCount", Number(v) || 0)} />
                          <Field label="表示数" value={post.viewCount} onChange={(v) => updateProfilePost(post.id, "viewCount", v)} />
                        </div>
                      </div>
                    ))}
                  </SectionCard>
                </>
              )}

              {activeTab === "saved" && (
                <SectionCard icon={Bookmark} title="保存">
                  <Field label="保存名" value={presetName} onChange={setPresetName} />
                  <Button onClick={savePreset}><Upload className="h-4 w-4" />現在のXモードを保存</Button>
                  <div className="grid gap-3">
                    {savedPresets.length === 0 ? <p className="text-sm text-black/50">保存データはまだありません。</p> : savedPresets.map((preset) => (
                      <div key={preset.id} className="rounded-2xl border border-black/10 p-3">
                        <div className="font-bold">{preset.name}</div>
                        <div className="mb-2 text-xs text-black/45">{preset.savedAt}</div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button variant="outline" onClick={() => setSettings(normalizeXSettings(preset.settings))}>読み込み</Button>
                          <Button variant="outline" onClick={() => overwritePreset(preset.id)}>上書き</Button>
                          <Button variant="outline" onClick={() => duplicatePreset(preset)}>複製</Button>
                          <Button variant="danger" onClick={() => removePreset(preset.id)}>削除</Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <SectionCard icon={Settings2} title="撮影表示">
                    <Field label="ステータスバー時刻" value={settings.deviceTime} onChange={(v) => update("deviceTime", v)} />
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-bold">ステータスバー表示</div><div className="text-xs text-black/50">チャットモードと同じアイコン</div></div><Switch checked={settings.showStatusBar} onChange={(v) => update("showStatusBar", v)} /></div>
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-bold">端末フレーム</div><div className="text-xs text-black/50">黒いスマホ枠を表示</div></div><Switch checked={settings.deviceFrameMode} onChange={(v) => update("deviceFrameMode", v)} /></div>
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-bold">設定ボタン表示</div><div className="text-xs text-black/50">撮影時はOFFにできます。右上三点リーダでも設定画面が出ます</div></div><Switch checked={settings.showSettingsButton} onChange={(v) => update("showSettingsButton", v)} /></div>
                    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-bold">フルスクリーンモード</div><div className="text-xs text-black/50">URLバーや余白を減らして撮影向きにします</div></div><Switch checked={settings.fullScreenMode} onChange={setFullscreenMode} /></div>
                  </SectionCard>
                </>
              )}

              {activeTab === "modes" && (
                <SectionCard icon={Settings2} title="モード切り替え">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => router.push("/")}>チャットモードへ</Button>
                    <Button variant="outline" onClick={() => router.push("/notification")}>通知画面モードへ</Button>
                    <Button variant="outline" onClick={() => router.push("/instagram")}>Instagramモードへ</Button>
                    <Button>Xモード</Button>
                    <Button variant="outline" onClick={() => router.push("/tiktok")}>TikTokモードへ</Button>
                  </div>
                </SectionCard>
              )}
                </div>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

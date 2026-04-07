"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Image as ImageIcon,
  Smile,
  Mic,
  SendHorizontal,
  Settings2,
  Palette,
  Clock3,
  UserCircle2,
  MessageSquareMore,
  Trash2,
  X,
  Phone,
  Video,
  PhoneOff,
} from "lucide-react";

const initialMessages = [
  { id: 1, side: "left", type: "text", sender: "美咲", text: "今日もありがとね", date: "2026/04/23", time: "22:14" },
  {
    id: 2,
    side: "left",
    type: "text",
    sender: "美咲",
    text: "あとさ、誠が何か変なこと聞いたみたいだけど、気にしないでね",
    date: "2026/04/23",
    time: "22:15",
  },
];

const themePresets: Record<string, { name: string; appBg: string; headerBg: string; selfBubble: string; otherBubble: string; toolbarBg: string }> = {
  line: { name: "LINE風", appBg: "#bfe7d8", headerBg: "#06C755", selfBubble: "#95ec69", otherBubble: "#ffffff", toolbarBg: "#f5f5f5" },
  dark: { name: "ダーク", appBg: "#101313", headerBg: "#1f2a2a", selfBubble: "#2d8f5d", otherBubble: "#202728", toolbarBg: "#171c1d" },
  soft: { name: "ソフト", appBg: "#f2eadf", headerBg: "#8c745d", selfBubble: "#f0d07c", otherBubble: "#fffaf3", toolbarBg: "#f7f1e9" },
  red: { name: "レッド", appBg: "#ffe5e5", headerBg: "#e53935", selfBubble: "#ff8a80", otherBubble: "#ffffff", toolbarBg: "#fff1f1" },
  blue: { name: "ブルー", appBg: "#e3f2fd", headerBg: "#1e88e5", selfBubble: "#90caf9", otherBubble: "#ffffff", toolbarBg: "#f1f8ff" },
  yellow: { name: "イエロー", appBg: "#fff9e0", headerBg: "#fbc02d", selfBubble: "#fff176", otherBubble: "#ffffff", toolbarBg: "#fffde7" },
  purple: { name: "パープル", appBg: "#f3e5f5", headerBg: "#8e24aa", selfBubble: "#ce93d8", otherBubble: "#ffffff", toolbarBg: "#faf5ff" },
};

const STORAGE_KEY = "line-mock-chat-default-settings-v4";

const defaultSettings = {
  todayDate: "2026/04/23",
  customBgColor: "",
  customHeaderColor: "",
  customHeaderIconColor: "",
  customToolbarColor: "",
  customOuterBgColor: "",
  chatTitle: "美咲",
  incomingCallTitle: "母",
  incomingCallAvatarLabel: "母",
  incomingCallAvatarImage: "",
  avatarLabel: "美",
  avatarImage: "",
  deviceTime: "22:18",
  messageTime: "22:18",
  incomingSender: "美咲",
  incomingText: "",
  outgoingMessageTime: "22:18",
  incomingMessageTime: "22:18",
  outgoingMessageDate: "2026/04/23",
  incomingMessageDate: "2026/04/23",
  themeKey: "line",
  showStatusBar: true,
  fullScreenMode: false,
  deviceFrameMode: false,
  showMessageTime: true,
  inputPlaceholder: "メッセージを入力",
  wallpaper: "",
  showControls: true,
  showTopActions: true,
  showActionButtons: true,
  showEditorAccess: true,
  soundEnabled: true,
  ringtoneType: "line",
  customRingtoneName: "",
  customRingtoneUrl: "",
  outgoingToneEnabled: true,
  outgoingToneType: "line",
  customOutgoingToneName: "",
  customOutgoingToneUrl: "",
  callAutoSeconds: 5,
  incomingCallAutoSeconds: 1.5,
  incomingDelaySeconds: 5,
  incomingCallBgColor: "#000000",
  incomingCallBgOpacity: 1,
  outgoingCallBgColor: "#000000",
  outgoingCallBgOpacity: 1,
};

function readStoredDefaultSettings() {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function buildOutgoingMessage(text: string, timeOverride: string, dateOverride = "") {
  return { id: Date.now() + Math.floor(Math.random() * 1000), side: "right", type: "text", sender: "", text, date: dateOverride, time: timeOverride || getCurrentTime() };
}

function buildIncomingMessage(text: string, sender: string, timeOverride: string, dateOverride = "") {
  return { id: Date.now() + Math.floor(Math.random() * 1000), side: "left", type: "text", sender: sender || "相手", text, date: dateOverride, time: timeOverride || getCurrentTime() };
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function parseDateParts(dateStr: string) {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().split("/");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return { year, month, day, date };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatLineDateLabel(dateStr: string, todayStr: string) {
  const target = parseDateParts(dateStr);
  if (!target) return dateStr || "";
  const today = parseDateParts(todayStr);
  if (today) {
    if (isSameDay(target.date, today.date)) return "今日";
    const yesterday = new Date(today.date);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(target.date, yesterday)) return "昨日";
  }
  return `${target.month}/${target.day}`;
}

function toMinutes(timeStr: string) {
  const [h = "0", m = "0"] = String(timeStr || "00:00").split(":");
  return Number(h) * 60 + Number(m);
}

interface Message {
  id: number;
  side: string;
  type: string;
  sender: string;
  text: string;
  date: string;
  time: string;
}

function compareMessagesAsc(a: Message, b: Message) {
  const da = parseDateParts(a.date)?.date || new Date(0);
  const db = parseDateParts(b.date)?.date || new Date(0);
  if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
  const diff = toMinutes(a.time) - toMinutes(b.time);
  if (diff !== 0) return diff;
  return a.id - b.id;
}

function Button({ children, className = "", variant = "default", type = "button", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles = variant === "outline" ? "border border-black/10 bg-white text-black hover:bg-black/[0.03]" : "bg-[#06C755] text-white hover:brightness-95";
  return (
    <button type={type as "button" | "submit" | "reset"} className={cn(base, styles, className)} {...props}>
      {children}
    </button>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5", className)} />;
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5", className)} />;
}

function Label({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("text-sm font-medium text-black/80", className)}>{children}</label>;
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onCheckedChange(!checked)} className={cn("relative h-7 w-12 rounded-full transition", checked ? "bg-[#06C755]" : "bg-black/15")} aria-pressed={checked}>
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
  return <button type="button" onClick={onClick} className={cn("rounded-2xl px-2 py-2 text-xs font-medium transition", active ? "bg-white text-black shadow-sm" : "text-black/55")}>{children}</button>;
}

function CallIconButton({ onClick, label, children, className = "", style }: { onClick?: () => void; label: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30 active:scale-90", className)} aria-label={label} style={style}>
      {children}
    </button>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer">
        <input type="color" className="hidden" value={value} onChange={onChange} />
        <div className="h-6 w-6 rounded border" style={{ backgroundColor: value }} />
      </label>
      <div className="text-xs font-mono">{value}</div>
    </div>
  );
}

function FileButton({ accept, onFile, children }: { accept: string; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        onChange={onFile}
      />
      <Button variant="outline" onClick={() => ref.current?.click()}>{children}</Button>
    </>
  );
}

interface Theme {
  name: string;
  appBg: string;
  headerBg: string;
  selfBubble: string;
  otherBubble: string;
  toolbarBg: string;
  headerIconColor: string;
  outerBg: string;
}

const PhoneMockup = React.forwardRef<HTMLDivElement, {
  onStartCall?: (type: string) => void;
  onOpenSettings?: () => void;
  title: string;
  messages: Message[];
  typingText: string;
  isTyping: boolean;
  theme: Theme;
  avatarImage: string;
  avatarLabel: string;
  deviceTime: string;
  showStatusBar: boolean;
  showMessageTime: boolean;
  todayDate: string;
  wallpaper: string;
}>(function PhoneMockup({ onStartCall, onOpenSettings, title, messages, typingText, isTyping, theme, avatarImage, avatarLabel, deviceTime, showStatusBar, showMessageTime, todayDate, wallpaper }, ref) {
  const textColor = theme.name === "ダーク" ? "text-white" : "text-black";
  const mutedColor = theme.name === "ダーク" ? "text-white/60" : "text-black/55";
  const timeColor = theme.name === "ダーク" ? "text-white/45" : "text-black/40";
  const headerIconStyle = { color: theme.headerIconColor };
  const sortedMessages = useMemo(() => [...messages].sort(compareMessagesAsc), [messages]);

  return (
    <div ref={ref} className="flex h-full w-full flex-col" style={{ backgroundColor: theme.appBg }}>
      <div className="sticky top-0 z-10 border-b border-black/5 px-4 pb-2 pt-3 text-white shadow-sm" style={{ backgroundColor: theme.headerBg }}>
        {showStatusBar && (
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium opacity-95">
            <span>{deviceTime}</span>
            <div className="flex items-center gap-1.5"><span>▂</span><span>◔</span><span>▮</span></div>
          </div>
        )}
        <div className="flex items-center gap-3">
          {avatarImage ? <img src={avatarImage} alt="avatar" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">{avatarLabel}</div>}
          <div className="min-w-0 flex-1"><div className="truncate text-[17px] font-bold leading-tight">{title}</div></div>
          <div className="flex items-center gap-2">
            <CallIconButton onClick={() => onStartCall?.("voice")} label="音声通話" style={headerIconStyle}><Phone className="h-4 w-4" /></CallIconButton>
            <CallIconButton onClick={() => onStartCall?.("video")} label="ビデオ通話" style={headerIconStyle}><Video className="h-4 w-4" /></CallIconButton>
            <CallIconButton onClick={onOpenSettings} label="設定" style={headerIconStyle}><Settings2 className="h-4 w-4" /></CallIconButton>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-3 pt-4 pb-2" style={wallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        <div className="flex flex-col gap-3">
          {sortedMessages.map((msg, index) => {
            const showDateDivider = Boolean(msg.date) && (index === 0 || sortedMessages[index - 1]?.date !== msg.date);
            const dividerLabel = formatLineDateLabel(msg.date, todayDate);
            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div className="my-2 flex items-center gap-3 px-1">
                    <div className="h-px flex-1 bg-black/10" />
                    <div className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-black/55 shadow-sm">{dividerLabel}</div>
                    <div className="h-px flex-1 bg-black/10" />
                  </div>
                )}
                <div className={`flex ${msg.side === "right" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[78%]">
                    {msg.side === "left" && <div className={`mb-1 px-1 text-[11px] ${mutedColor}`}>{msg.sender}</div>}
                    <div className={cn("rounded-[18px] px-4 py-2 text-[15px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.08)]", msg.side === "right" ? "rounded-br-[6px]" : "rounded-bl-[6px]", msg.side === "left" && theme.name === "ダーク" ? "text-white" : textColor)} style={{ backgroundColor: msg.side === "right" ? theme.selfBubble : theme.otherBubble }}>
                      <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                    </div>
                    {showMessageTime && <div className={cn("mt-1 px-1 text-[10px]", timeColor, msg.side === "right" ? "text-right" : "text-left")}>{msg.time}</div>}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {isTyping && (
            <div className="flex justify-end">
              <div className="max-w-[78%]">
                <div className={cn("rounded-[18px] rounded-br-[6px] px-4 py-2 text-[15px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.08)]", theme.name === "ダーク" ? "text-white" : "text-black")} style={{ backgroundColor: theme.selfBubble }}>
                  <span className="whitespace-pre-wrap break-words">{typingText}</span>
                  <span className="animate-pulse">|</span>
                </div>
                {showMessageTime && <div className={cn("mt-1 px-1 text-right text-[10px]", timeColor)}>入力中</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function CallOverlay({ visible, mode, phase, title, avatarImage, avatarLabel, onAccept, onDecline, onEnd, bgColor, bgOpacity }: {
  visible: boolean; mode: string | null; phase: string; title: string; avatarImage: string; avatarLabel: string;
  onAccept: () => void; onDecline: () => void; onEnd: () => void; bgColor: string; bgOpacity: number;
}) {
  if (!visible) return null;
  const isIncoming = phase === "incoming";
  const isCalling = phase === "calling";
  const isConnecting = phase === "connecting";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-white" style={{ backgroundColor: bgColor, opacity: bgOpacity }}>
      <div className="mb-6">
        {avatarImage ? <img src={avatarImage} alt="avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-white/20" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-3xl font-semibold ring-4 ring-white/10">{avatarLabel}</div>}
      </div>
      <div className="text-2xl font-semibold">{title}</div>
      <div className="mt-2 text-sm opacity-75">{mode === "video" ? "ビデオ通話" : "音声通話"}</div>
      <div className="mt-4 text-lg">{isIncoming ? "着信中…" : isCalling ? "発信中…" : isConnecting ? "接続中…" : "通話中"}</div>

      {isIncoming && (
        <div className="mt-10 flex items-center gap-8">
          <button type="button" onClick={onDecline} className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg transition active:scale-95" aria-label="拒否"><PhoneOff className="h-7 w-7" /></button>
          <button type="button" onClick={onAccept} className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#06C755] shadow-lg transition active:scale-95" aria-label="応答">{mode === "video" ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}</button>
        </div>
      )}

      {(isCalling || isConnecting || phase === "connected") && <button type="button" onClick={onEnd} className="mt-10 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-lg transition active:scale-95">通話終了</button>}
    </div>
  );
}

interface TimedMsg { id: number; sender: string; text: string; delay: number; countdown: number; pending: boolean; }

export default function LineMockChatCreator() {
  const router = useRouter();
  const initialUiSettings = useMemo(() => readStoredDefaultSettings(), []);

  const [chatTitle, setChatTitle] = useState(initialUiSettings.chatTitle);
  const [incomingCallTitle, setIncomingCallTitle] = useState(initialUiSettings.incomingCallTitle);
  const [incomingCallAvatarLabel, setIncomingCallAvatarLabel] = useState(initialUiSettings.incomingCallAvatarLabel);
  const [incomingCallAvatarImage, setIncomingCallAvatarImage] = useState(initialUiSettings.incomingCallAvatarImage);
  const [avatarLabel, setAvatarLabel] = useState(initialUiSettings.avatarLabel);
  const [avatarImage, setAvatarImage] = useState(initialUiSettings.avatarImage);
  const [deviceTime, setDeviceTime] = useState(initialUiSettings.deviceTime);
  const [messageTime, setMessageTime] = useState(initialUiSettings.messageTime);
  const [outgoingMessageTime, setOutgoingMessageTime] = useState(initialUiSettings.outgoingMessageTime || initialUiSettings.messageTime || "22:14");
  const [incomingMessageTime, setIncomingMessageTime] = useState(initialUiSettings.incomingMessageTime || initialUiSettings.messageTime || "22:14");
  const [outgoingMessageDate, setOutgoingMessageDate] = useState(initialUiSettings.outgoingMessageDate || "2026/04/04");
  const [incomingMessageDate, setIncomingMessageDate] = useState(initialUiSettings.incomingMessageDate || "2026/04/04");
  const [todayDate, setTodayDate] = useState(initialUiSettings.todayDate || "2026/04/04");
  const [incomingSender, setIncomingSender] = useState(initialUiSettings.incomingSender);
  const [incomingText, setIncomingText] = useState(initialUiSettings.incomingText);
  const [themeKey, setThemeKey] = useState(initialUiSettings.themeKey);
  const [customBgColor, setCustomBgColor] = useState(initialUiSettings.customBgColor || "");
  const [customHeaderColor, setCustomHeaderColor] = useState(initialUiSettings.customHeaderColor || "");
  const [customHeaderIconColor, setCustomHeaderIconColor] = useState(initialUiSettings.customHeaderIconColor || "");
  const [customToolbarColor, setCustomToolbarColor] = useState(initialUiSettings.customToolbarColor || "");
  const [customOuterBgColor, setCustomOuterBgColor] = useState(initialUiSettings.customOuterBgColor || "");
  const [showStatusBar, setShowStatusBar] = useState(initialUiSettings.showStatusBar);
  const [fullScreenMode, setFullScreenMode] = useState(initialUiSettings.fullScreenMode);
  const [deviceFrameMode, setDeviceFrameMode] = useState(initialUiSettings.deviceFrameMode);
  const [showMessageTime, setShowMessageTime] = useState(initialUiSettings.showMessageTime);
  const [inputPlaceholder, setInputPlaceholder] = useState(initialUiSettings.inputPlaceholder);
  const [wallpaper, setWallpaper] = useState(initialUiSettings.wallpaper);
  const [showControls, setShowControls] = useState(initialUiSettings.showControls);
  const [showTopActions, setShowTopActions] = useState(initialUiSettings.showTopActions);
  const [showActionButtons, setShowActionButtons] = useState(initialUiSettings.showActionButtons ?? true);
  const [showEditorAccess, setShowEditorAccess] = useState(initialUiSettings.showEditorAccess);
  const [soundEnabled, setSoundEnabled] = useState(initialUiSettings.soundEnabled);
  const [ringtoneType, setRingtoneType] = useState(initialUiSettings.ringtoneType);
  const [customRingtoneName, setCustomRingtoneName] = useState(initialUiSettings.customRingtoneName);
  const [customRingtoneUrl, setCustomRingtoneUrl] = useState(initialUiSettings.customRingtoneUrl);
  const [outgoingToneEnabled, setOutgoingToneEnabled] = useState(initialUiSettings.outgoingToneEnabled ?? true);
  const [outgoingToneType, setOutgoingToneType] = useState(initialUiSettings.outgoingToneType || "line");
  const [customOutgoingToneName, setCustomOutgoingToneName] = useState(initialUiSettings.customOutgoingToneName || "");
  const [customOutgoingToneUrl, setCustomOutgoingToneUrl] = useState(initialUiSettings.customOutgoingToneUrl || "");
  const [callAutoSeconds, setCallAutoSeconds] = useState(initialUiSettings.callAutoSeconds);
  const [incomingCallAutoSeconds, setIncomingCallAutoSeconds] = useState(initialUiSettings.incomingCallAutoSeconds || 1.5);
  const [incomingDelaySeconds, setIncomingDelaySeconds] = useState(initialUiSettings.incomingDelaySeconds || 0);
  const [incomingCallBgColor, setIncomingCallBgColor] = useState(initialUiSettings.incomingCallBgColor || "#000000");
  const [incomingCallBgOpacity, setIncomingCallBgOpacity] = useState(initialUiSettings.incomingCallBgOpacity ?? 0.9);
  const [outgoingCallBgColor, setOutgoingCallBgColor] = useState(initialUiSettings.outgoingCallBgColor || "#000000");
  const [outgoingCallBgOpacity, setOutgoingCallBgOpacity] = useState(initialUiSettings.outgoingCallBgOpacity ?? 0.9);

  const [callMode, setCallMode] = useState<string | null>(null);
  const [callPhase, setCallPhase] = useState("idle");
  const [activeCallProfile, setActiveCallProfile] = useState<{ title: string; avatarImage: string; avatarLabel: string } | null>(null);
  const [activeCallDirection, setActiveCallDirection] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typingText, setTypingText] = useState("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("appearance");
  const [timedMsgs, setTimedMsgs] = useState<TimedMsg[]>([{ id: 1, sender: incomingSender, text: "", delay: 3, countdown: 0, pending: false }]);
  const timedMsgTimers = useRef<Record<number, { timeout: ReturnType<typeof setTimeout>; interval: ReturnType<typeof setInterval> }>>({});

  const theme = useMemo(() => {
    const base = themePresets[themeKey] || themePresets.line;
    return { ...base, appBg: customBgColor || base.appBg, headerBg: customHeaderColor || base.headerBg, toolbarBg: customToolbarColor || base.toolbarBg, headerIconColor: customHeaderIconColor || "#ffffff", outerBg: customOuterBgColor || customBgColor || base.appBg };
  }, [themeKey, customBgColor, customHeaderColor, customHeaderIconColor, customToolbarColor, customOuterBgColor]);

  useEffect(() => {
    const headerColor = customHeaderColor || (themePresets[themeKey] || themePresets.line).headerBg;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      (meta as HTMLMetaElement).name = 'theme-color';
      document.head.appendChild(meta);
    }
    (meta as HTMLMetaElement).content = headerColor;
  }, [themeKey, customHeaderColor]);

  const previewRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  const openSettings = () => setSettingsOpen(true);

  useEffect(() => {
    if (fullScreenMode) {
      const requestFullscreen = () => {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      };
      const handleClick = () => {
        if (!document.fullscreenElement) requestFullscreen();
      };
      document.addEventListener("click", handleClick, { once: true });
      return () => document.removeEventListener("click", handleClick);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [fullScreenMode]);

  const clearTypingTimers = () => {
    if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
  };

  const clearCallTimer = () => {
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
  };

  const stopAudioTone = () => {
    if (ringtoneIntervalRef.current) { clearInterval(ringtoneIntervalRef.current); ringtoneIntervalRef.current = null; }
    if (customAudioRef.current) { customAudioRef.current.pause(); customAudioRef.current.currentTime = 0; }
  };

  const playTone = (frequency = 880, duration = 200, gainValue = 0.05) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      window.setTimeout(() => osc.stop(), duration);
    } catch { /* ignore */ }
  };

  const playIphonePattern = () => { playTone(1046, 160, 0.05); window.setTimeout(() => playTone(1318, 180, 0.05), 180); };
  const playLinePattern = () => { playTone(784, 120, 0.05); window.setTimeout(() => playTone(988, 120, 0.05), 160); window.setTimeout(() => playTone(1174, 180, 0.05), 320); };

  const startCustomTone = (url: string) => {
    if (!url) return;
    try {
      if (!customAudioRef.current) customAudioRef.current = new Audio(url);
      else customAudioRef.current.src = url;
      customAudioRef.current.loop = true;
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.play().catch(() => {});
    } catch { /* ignore */ }
  };

  const startIncomingTone = () => {
    if (!soundEnabled) return;
    stopAudioTone();
    if (ringtoneType === "custom" && customRingtoneUrl) { startCustomTone(customRingtoneUrl); return; }
    const runPattern = () => { if (ringtoneType === "line") playLinePattern(); else playIphonePattern(); };
    runPattern();
    ringtoneIntervalRef.current = window.setInterval(runPattern, ringtoneType === "line" ? 1500 : 1800);
  };

  const startOutgoingTone = () => {
    if (!outgoingToneEnabled) return;
    stopAudioTone();
    if (outgoingToneType === "custom" && customOutgoingToneUrl) { startCustomTone(customOutgoingToneUrl); return; }
    const runPattern = () => { if (outgoingToneType === "iphone") playIphonePattern(); else playLinePattern(); };
    runPattern();
    ringtoneIntervalRef.current = window.setInterval(runPattern, outgoingToneType === "line" ? 1500 : 1800);
  };

  const scheduleConnect = (seconds?: number) => {
    clearCallTimer();
    const delay = seconds !== undefined ? seconds : Number(callAutoSeconds) || 0;
    callTimeoutRef.current = window.setTimeout(() => { stopAudioTone(); setCallPhase("connected"); }, Math.max(0, delay) * 1000);
  };

  const simulateTyping = () => {
    const source = inputText.trim();
    if (!source || isTyping) return;
    clearTypingTimers();
    setIsTyping(true);
    setTypingText("");
    let i = 0;
    typingIntervalRef.current = window.setInterval(() => {
      i += 1;
      setTypingText(source.slice(0, i));
      if (i >= source.length) {
        clearTypingTimers();
        typingTimeoutRef.current = window.setTimeout(() => {
          setMessages((prev) => [...prev, buildOutgoingMessage(source, outgoingMessageTime, outgoingMessageDate)]);
          setTypingText(""); setInputText(""); setIsTyping(false);
        }, 450);
      }
    }, 70);
  };

  const sendInstant = () => {
    const source = inputText.trim();
    if (!source || isTyping) return;
    setMessages((prev) => [...prev, buildOutgoingMessage(source, outgoingMessageTime, outgoingMessageDate)]);
    setInputText("");
  };

  const addIncomingMessage = () => {
    const source = incomingText.trim();
    if (!source) return;
    setMessages((prev) => [...prev, buildIncomingMessage(source, incomingSender, incomingMessageTime, incomingMessageDate)]);
    setIncomingText("");
  };

  const startTimedMsg = (id: number) => {
    const msg = timedMsgs.find(m => m.id === id);
    if (!msg || !msg.text.trim() || msg.pending) return;
    setTimedMsgs(prev => prev.map(m => m.id === id ? { ...m, pending: true, countdown: m.delay } : m));
    const interval = window.setInterval(() => {
      setTimedMsgs(prev => prev.map(m => {
        if (m.id !== id) return m;
        if (m.countdown <= 1) { clearInterval(interval); return { ...m, countdown: 0 }; }
        return { ...m, countdown: m.countdown - 1 };
      }));
    }, 1000);
    const timeout = window.setTimeout(() => {
      setMessages(prev => [...prev, buildIncomingMessage(msg.text.trim(), msg.sender, incomingMessageTime, incomingMessageDate)]);
      setTimedMsgs(prev => prev.map(m => m.id === id ? { ...m, pending: false, countdown: 0, text: "" } : m));
      delete timedMsgTimers.current[id];
    }, Math.max(0, msg.delay) * 1000);
    timedMsgTimers.current[id] = { timeout, interval };
  };

  const cancelTimedMsg = (id: number) => {
    const t = timedMsgTimers.current[id];
    if (t) { clearTimeout(t.timeout); clearInterval(t.interval); delete timedMsgTimers.current[id]; }
    setTimedMsgs(prev => prev.map(m => m.id === id ? { ...m, pending: false, countdown: 0 } : m));
  };

  const addTimedMsgSlot = () => {
    const newId = Date.now();
    setTimedMsgs(prev => [...prev, { id: newId, sender: incomingSender, text: "", delay: 3, countdown: 0, pending: false }]);
  };

  const removeTimedMsgSlot = (id: number) => {
    cancelTimedMsg(id);
    setTimedMsgs(prev => prev.filter(m => m.id !== id));
  };

  const updateTimedMsg = (id: number, field: string, value: string | number) => {
    setTimedMsgs(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const deleteMessage = (id: number) => setMessages((prev) => prev.filter((msg) => msg.id !== id));
  const updateMessageField = (id: number, field: string, value: string) => setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, [field]: value } : msg)));

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleCustomRingtoneUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    if (customRingtoneUrl && customRingtoneUrl.startsWith("blob:")) URL.revokeObjectURL(customRingtoneUrl);
    setCustomRingtoneUrl(objectUrl); setCustomRingtoneName(file.name); setRingtoneType("custom");
  };

  const handleCustomOutgoingToneUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    if (customOutgoingToneUrl && customOutgoingToneUrl.startsWith("blob:")) URL.revokeObjectURL(customOutgoingToneUrl);
    setCustomOutgoingToneUrl(objectUrl); setCustomOutgoingToneName(file.name); setOutgoingToneType("custom");
  };

  const buildCurrentSettings = () => ({
    todayDate, customBgColor, customHeaderColor, customHeaderIconColor, customToolbarColor, customOuterBgColor,
    chatTitle, incomingCallTitle, incomingCallAvatarLabel, incomingCallAvatarImage, avatarLabel, avatarImage,
    deviceTime, messageTime, outgoingMessageTime, incomingMessageTime, outgoingMessageDate, incomingMessageDate,
    incomingSender, incomingText, themeKey, showStatusBar, fullScreenMode, deviceFrameMode, showMessageTime,
    inputPlaceholder, wallpaper, showControls, showTopActions, showActionButtons, showEditorAccess, soundEnabled,
    ringtoneType, customRingtoneName, customRingtoneUrl, outgoingToneEnabled, outgoingToneType,
    customOutgoingToneName, customOutgoingToneUrl, callAutoSeconds: Number(callAutoSeconds) || 0,
    incomingCallAutoSeconds: Number(incomingCallAutoSeconds) || 1.5,
    incomingDelaySeconds: Number(incomingDelaySeconds) || 0, incomingCallBgColor, incomingCallBgOpacity,
    outgoingCallBgColor, outgoingCallBgOpacity,
  });

  const applySettings = (settings: typeof defaultSettings) => {
    setCustomBgColor(settings.customBgColor || ""); setCustomHeaderColor(settings.customHeaderColor || "");
    setCustomHeaderIconColor(settings.customHeaderIconColor || ""); setCustomToolbarColor(settings.customToolbarColor || "");
    setCustomOuterBgColor(settings.customOuterBgColor || ""); setChatTitle(settings.chatTitle);
    setIncomingCallTitle(settings.incomingCallTitle); setIncomingCallAvatarLabel(settings.incomingCallAvatarLabel);
    setIncomingCallAvatarImage(settings.incomingCallAvatarImage); setAvatarLabel(settings.avatarLabel);
    setAvatarImage(settings.avatarImage); setDeviceTime(settings.deviceTime); setMessageTime(settings.messageTime);
    setOutgoingMessageTime(settings.outgoingMessageTime || settings.messageTime || "22:14");
    setIncomingMessageTime(settings.incomingMessageTime || settings.messageTime || "22:14");
    setOutgoingMessageDate(settings.outgoingMessageDate || "2026/04/04");
    setIncomingMessageDate(settings.incomingMessageDate || "2026/04/04");
    setTodayDate(settings.todayDate || "2026/04/04"); setIncomingSender(settings.incomingSender);
    setIncomingText(settings.incomingText); setThemeKey(settings.themeKey || "line");
    setShowStatusBar(settings.showStatusBar); setFullScreenMode(settings.fullScreenMode);
    setDeviceFrameMode(settings.deviceFrameMode); setShowMessageTime(settings.showMessageTime);
    setInputPlaceholder(settings.inputPlaceholder); setWallpaper(settings.wallpaper);
    setShowControls(settings.showControls); setShowTopActions(settings.showTopActions);
    setShowActionButtons(settings.showActionButtons ?? true); setShowEditorAccess(settings.showEditorAccess);
    setSoundEnabled(settings.soundEnabled); setRingtoneType(settings.ringtoneType);
    setCustomRingtoneName(settings.customRingtoneName); setCustomRingtoneUrl(settings.customRingtoneUrl);
    setOutgoingToneEnabled(settings.outgoingToneEnabled ?? true); setOutgoingToneType(settings.outgoingToneType || "line");
    setCustomOutgoingToneName(settings.customOutgoingToneName || ""); setCustomOutgoingToneUrl(settings.customOutgoingToneUrl || "");
    setCallAutoSeconds(settings.callAutoSeconds || 0); setIncomingCallAutoSeconds(settings.incomingCallAutoSeconds || 1.5); setIncomingDelaySeconds(settings.incomingDelaySeconds || 0);
    setIncomingCallBgColor(settings.incomingCallBgColor || "#000000"); setIncomingCallBgOpacity(settings.incomingCallBgOpacity ?? 0.9);
    setOutgoingCallBgColor(settings.outgoingCallBgColor || "#000000"); setOutgoingCallBgOpacity(settings.outgoingCallBgOpacity ?? 0.9);
  };

  const saveCurrentAsDefaultSettings = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildCurrentSettings()));
  };

  const resetToSavedDefaultSettings = () => applySettings(readStoredDefaultSettings());
  const resetSavedDefaultsToAppDefaults = () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    applySettings(defaultSettings);
  };



  const startCall = (type: string) => {
    clearCallTimer();
    setActiveCallProfile({ title: chatTitle, avatarImage, avatarLabel });
    setActiveCallDirection("outgoing");
    setCallMode(type); setCallPhase("calling");
    startOutgoingTone(); scheduleConnect();
  };

  const startIncomingCall = (type: string) => {
    clearCallTimer();
    setActiveCallProfile({ title: incomingCallTitle, avatarImage: incomingCallAvatarImage, avatarLabel: incomingCallAvatarLabel });
    setActiveCallDirection("incoming");
    setCallMode(type); setCallPhase("incoming");
    startIncomingTone();
  };

  const scheduleIncomingCall = (type: string) => {
    clearCallTimer();
    callTimeoutRef.current = window.setTimeout(() => startIncomingCall(type), Math.max(0, Number(incomingDelaySeconds) || 0) * 1000);
  };

  const acceptIncomingCall = () => {
    if (!callMode) return;
    stopAudioTone(); setCallPhase("connecting"); scheduleConnect(Number(incomingCallAutoSeconds) || 0);
  };

  const declineIncomingCall = () => {
    clearCallTimer(); stopAudioTone();
    setCallMode(null); setCallPhase("idle"); setActiveCallProfile(null); setActiveCallDirection(null);
  };

  const endCall = () => {
    clearCallTimer(); stopAudioTone();
    setCallMode(null); setCallPhase("idle"); setActiveCallProfile(null); setActiveCallDirection(null);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typingText, isTyping]);

  useEffect(() => {
    return () => {
      clearTypingTimers(); clearCallTimer(); stopAudioTone();
      if (customRingtoneUrl && customRingtoneUrl.startsWith("blob:")) URL.revokeObjectURL(customRingtoneUrl);
      if (customOutgoingToneUrl && customOutgoingToneUrl.startsWith("blob:")) URL.revokeObjectURL(customOutgoingToneUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customRingtoneUrl, customOutgoingToneUrl]);

  const callOverlayVisible = callPhase !== "idle" && Boolean(callMode);
  const overlayTitle = activeCallProfile?.title || chatTitle;
  const overlayAvatarImage = activeCallProfile?.avatarImage || "";
  const overlayAvatarLabel = activeCallProfile?.avatarLabel || avatarLabel;
  const overlayBgColor = activeCallDirection === "incoming" ? incomingCallBgColor : outgoingCallBgColor;
  const overlayBgOpacity = activeCallDirection === "incoming" ? incomingCallBgOpacity : outgoingCallBgOpacity;
  const sortedHistoryMessages = useMemo(() => [...messages].sort(compareMessagesAsc), [messages]);

  return (
    <div className={cn("flex flex-col", fullScreenMode ? "bg-black max-w-none" : "mx-auto max-w-md")} style={{ height: fullScreenMode ? "100dvh" : undefined, minHeight: fullScreenMode ? undefined : "100dvh", width: "100%", maxWidth: "100vw", overflow: fullScreenMode ? "hidden" : undefined, position: "relative", backgroundColor: fullScreenMode ? undefined : theme.outerBg }}>
      <div ref={scrollRef} className={cn("flex-1 overflow-y-auto min-h-0 pb-0", !fullScreenMode && "bg-transparent", deviceFrameMode ? "p-4" : "")}>
        <div className={cn("h-full", deviceFrameMode && "rounded-[32px] bg-black p-2 shadow-2xl", fullScreenMode && "h-screen")} style={{ backgroundColor: deviceFrameMode ? undefined : theme.outerBg }}>
          <PhoneMockup ref={previewRef} onStartCall={startCall} onOpenSettings={openSettings} title={chatTitle} messages={messages} typingText={typingText} isTyping={isTyping} theme={theme} avatarImage={avatarImage} avatarLabel={avatarLabel} deviceTime={deviceTime} showStatusBar={showStatusBar} showMessageTime={showMessageTime} todayDate={todayDate} wallpaper={wallpaper} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 w-full border-t border-black/10 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-0.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]" style={{ backgroundColor: theme.toolbarBg }}>


        {showControls && (
          <>
            <div className="mb-1 flex justify-end">
              <button type="button" onClick={() => router.push("/notification")} className="flex items-center gap-1 rounded-full bg-black/8 px-3 py-1 text-xs text-black/55 hover:bg-black/12 transition">
                通知画面モードへ →
              </button>
            </div>
            <div className="flex items-end gap-2">
              <button type="button" className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black/55 transition hover:bg-black/5" aria-label="スタンプや絵文字"><Smile className="h-5 w-5" /></button>
              <div className="flex min-h-[44px] flex-1 items-end rounded-[22px] border border-black/10 bg-white px-3 py-2 shadow-sm">
                <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={inputPlaceholder} rows={1} className="max-h-28 min-h-0 resize-none border-0 bg-transparent p-0 text-[15px] leading-6 shadow-none focus:ring-0" />
                <div className="ml-2 flex items-center gap-1 pb-0.5 text-black/45">
                  <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-black/5" aria-label="画像を追加"><ImageIcon className="h-4 w-4" /></button>
                  <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-black/5" aria-label="項目を追加"><PlusCircle className="h-4 w-4" /></button>
                </div>
              </div>
              {inputText.trim() ? <button type="button" onClick={sendInstant} className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#06C755] text-white shadow-sm transition active:scale-95" aria-label="送信"><SendHorizontal className="h-4 w-4" /></button> : <button type="button" className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black/55 transition hover:bg-black/5" aria-label="マイク"><Mic className="h-5 w-5" /></button>}
            </div>
          </>
        )}
      </div>

      <CallOverlay visible={callOverlayVisible} mode={callMode} phase={callPhase} title={overlayTitle} avatarImage={overlayAvatarImage} avatarLabel={overlayAvatarLabel} onAccept={acceptIncomingCall} onDecline={declineIncomingCall} onEnd={endCall} bgColor={overlayBgColor} bgOpacity={overlayBgOpacity} />

      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/35">
          <div className="absolute inset-x-0 bottom-0 mx-auto h-[86vh] w-full max-w-md rounded-t-[28px] bg-[#fafafa] px-4 pt-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold">設定</div>
              <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-full p-2 text-black/60 hover:bg-black/5"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-4 rounded-2xl bg-black/5 p-1 text-center">
              <TabButton active={activeTab === "appearance"} onClick={() => setActiveTab("appearance")}>見た目</TabButton>
              <TabButton active={activeTab === "chat"} onClick={() => setActiveTab("chat")}>会話</TabButton>
              <TabButton active={activeTab === "messages"} onClick={() => setActiveTab("messages")}>履歴</TabButton>
              <TabButton active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>画面</TabButton>
            </div>

            <div className="mt-4 h-[calc(86vh-104px)] overflow-y-auto pb-10">
              {activeTab === "appearance" && (
                <div className="space-y-4">
                  <SectionCard icon={Palette} title="デザイン">
                    <div className="space-y-2">
                      <Label>テーマ</Label>
                      <select value={themeKey} onChange={(e) => {
                        setThemeKey(e.target.value);
                        setCustomBgColor("");
                        setCustomHeaderColor("");
                        setCustomHeaderIconColor("");
                        setCustomToolbarColor("");
                        setCustomOuterBgColor("");
                      }} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none">
                        {Object.entries(themePresets).map(([key, preset]) => <option key={key} value={key}>{preset.name}</option>)}
                      </select>
                      <button type="button" onClick={() => { setCustomBgColor(""); setCustomHeaderColor(""); setCustomHeaderIconColor(""); setCustomToolbarColor(""); setCustomOuterBgColor(""); }} className="text-xs text-black/40 underline">カスタム色をリセット</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>背景色</Label><ColorSwatch value={customBgColor || theme.appBg} onChange={(e) => setCustomBgColor(e.target.value)} /></div>
                      <div className="space-y-2"><Label>余白部分の色</Label><ColorSwatch value={customOuterBgColor || theme.outerBg} onChange={(e) => setCustomOuterBgColor(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>ヘッダー色</Label><ColorSwatch value={customHeaderColor || theme.headerBg} onChange={(e) => setCustomHeaderColor(e.target.value)} /></div>
                      <div className="space-y-2"><Label>ヘッダーアイコン色</Label><ColorSwatch value={customHeaderIconColor || theme.headerIconColor} onChange={(e) => setCustomHeaderIconColor(e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label>操作バー背景色</Label><ColorSwatch value={customToolbarColor || theme.toolbarBg} onChange={(e) => setCustomToolbarColor(e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>背景画像</Label>
                      <FileButton accept="image/*" onFile={(e) => handleImageUpload(e, setWallpaper)}>画像を選択</FileButton>
                    </div>
                  </SectionCard>

                  <SectionCard icon={UserCircle2} title="相手情報">
                    <div className="space-y-2"><Label>表示名</Label><Input value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} /></div>
                    <div className="space-y-2"><Label>アイコン文字</Label><Input value={avatarLabel} onChange={(e) => setAvatarLabel(e.target.value.slice(0, 2))} /></div>
                    <div className="space-y-2">
                      <Label>アイコン画像</Label>
                      <FileButton accept="image/*" onFile={(e) => handleImageUpload(e, setAvatarImage)}>画像を選択</FileButton>
                    </div>
                  </SectionCard>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="space-y-4">
                  <SectionCard icon={Clock3} title="時刻と表示">
                    <div className="space-y-2"><Label>今日の日付</Label><Input value={todayDate} onChange={(e) => setTodayDate(e.target.value)} placeholder="2026/04/04" /></div>
                    <div className="space-y-2"><Label>ステータスバー時刻</Label><Input value={deviceTime} onChange={(e) => setDeviceTime(e.target.value)} placeholder="9:41" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>自分の送信日</Label><Input value={outgoingMessageDate} onChange={(e) => setOutgoingMessageDate(e.target.value)} placeholder="2026/04/04" /></div>
                      <div className="space-y-2"><Label>相手の送信日</Label><Input value={incomingMessageDate} onChange={(e) => setIncomingMessageDate(e.target.value)} placeholder="2026/04/04" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>自分の送信時刻</Label><Input value={outgoingMessageTime} onChange={(e) => setOutgoingMessageTime(e.target.value)} placeholder="22:14" /></div>
                      <div className="space-y-2"><Label>相手の送信時刻</Label><Input value={incomingMessageTime} onChange={(e) => setIncomingMessageTime(e.target.value)} placeholder="22:14" /></div>
                    </div>
                    <div className="space-y-2"><Label>入力欄プレースホルダー</Label><Input value={inputPlaceholder} onChange={(e) => setInputPlaceholder(e.target.value)} /></div>
                  </SectionCard>

                  <SectionCard icon={MessageSquareMore} title="メッセージ追加">
                    <div className="space-y-2"><Label>自分のメッセージ</Label><Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="min-h-24" placeholder="ここにセリフを書く" /></div>
                    <Button onClick={sendInstant} disabled={!inputText.trim() || isTyping} className="w-full"><SendHorizontal className="mr-2 h-4 w-4" />すぐ送信</Button>
                    <div className="space-y-2 pt-2"><Label>相手名</Label><Input value={incomingSender} onChange={(e) => setIncomingSender(e.target.value)} /></div>
                    <div className="space-y-2"><Label>相手のメッセージ</Label><Textarea value={incomingText} onChange={(e) => setIncomingText(e.target.value)} className="min-h-24" placeholder="受信メッセージを入力" /></div>
                    <Button onClick={addIncomingMessage} variant="outline" className="w-full">相手メッセージを追加</Button>

                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 space-y-3 mt-2">
                      <div className="text-xs font-semibold text-black/60">タイマーメッセージ</div>
                      {timedMsgs.map((msg, idx) => (
                        <div key={msg.id} className="rounded-2xl border border-black/10 bg-white p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-black/50">メッセージ {idx + 1}</div>
                            {timedMsgs.length > 1 && <button type="button" onClick={() => removeTimedMsgSlot(msg.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>}
                          </div>
                          <div className="space-y-1"><Label>送信者名</Label><Input value={msg.sender} onChange={(e) => updateTimedMsg(msg.id, "sender", e.target.value)} disabled={msg.pending} placeholder="美咲" /></div>
                          <div className="space-y-1"><Label>メッセージ内容</Label><Textarea value={msg.text} onChange={(e) => updateTimedMsg(msg.id, "text", e.target.value)} className="min-h-16" placeholder="○秒後に届くメッセージ" disabled={msg.pending} /></div>
                          <div className="space-y-1"><Label>何秒後に届く？</Label><Input type="number" min="1" step="1" value={msg.delay} onChange={(e) => updateTimedMsg(msg.id, "delay", Number(e.target.value))} disabled={msg.pending} /></div>
                          {msg.pending ? (
                            <div className="space-y-2">
                              <div className="text-center text-sm font-medium text-black/60">{msg.countdown}秒後に届きます…</div>
                              <Button onClick={() => cancelTimedMsg(msg.id)} variant="outline" className="w-full text-red-500 border-red-200">キャンセル</Button>
                            </div>
                          ) : (
                            <Button onClick={() => startTimedMsg(msg.id)} disabled={!msg.text.trim()} className="w-full">タイマーセット</Button>
                          )}
                        </div>
                      ))}
                      <Button onClick={addTimedMsgSlot} variant="outline" className="w-full">＋ メッセージを追加</Button>
                    </div>
                  </SectionCard>
                </div>
              )}

              {activeTab === "messages" && (
                <div className="space-y-3">
                  {sortedHistoryMessages.map((msg, index) => (
                    <div key={msg.id} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span className={cn("inline-flex rounded-full px-2 py-1 text-xs", msg.side === "right" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700")}>{msg.side === "right" ? "自分" : "相手"}</span>
                          #{index + 1}
                        </div>
                        <button type="button" onClick={() => deleteMessage(msg.id)} className="rounded-full p-2 text-black/45 hover:bg-black/5 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="space-y-2">
                        {msg.side === "left" && <div className="space-y-1"><Label>送信者名</Label><Input value={msg.sender} onChange={(e) => updateMessageField(msg.id, "sender", e.target.value)} /></div>}
                        <div className="space-y-1"><Label>本文</Label><Textarea value={msg.text} onChange={(e) => updateMessageField(msg.id, "text", e.target.value)} className="min-h-20" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>日付</Label><Input value={msg.date || ""} onChange={(e) => updateMessageField(msg.id, "date", e.target.value)} placeholder="2026/04/04" /></div>
                          <div className="space-y-1"><Label>時刻</Label><Input value={msg.time} onChange={(e) => updateMessageField(msg.id, "time", e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "screen" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Button onClick={saveCurrentAsDefaultSettings} variant="outline" className="w-full justify-center">今の設定を既定にする</Button>
                    <Button onClick={resetToSavedDefaultSettings} variant="outline" className="w-full justify-center">既定の設定に戻す</Button>
                    <Button onClick={resetSavedDefaultsToAppDefaults} variant="outline" className="w-full justify-center">アプリ初期設定に戻す</Button>
                  </div>

                  <SectionCard icon={Settings2} title="操作表示">
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">ステータスバー表示</div><div className="text-xs text-black/50">上部の時刻や電波表示</div></div><Switch checked={showStatusBar} onCheckedChange={setShowStatusBar} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">メッセージ時刻表示</div><div className="text-xs text-black/50">各吹き出し下の時刻</div></div><Switch checked={showMessageTime} onCheckedChange={setShowMessageTime} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">フルスクリーンモード</div><div className="text-xs text-black/50">余白・中央寄せをすべて解除</div></div><Switch checked={fullScreenMode} onCheckedChange={(value) => { setFullScreenMode(value); if (value) setShowStatusBar(false); }} /></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">デバイスフレーム</div><div className="text-xs text-black/50">黒フチのスマホ風にする</div></div><Switch checked={deviceFrameMode} onCheckedChange={setDeviceFrameMode} /></div>


                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">下部の操作バー表示</div><div className="text-xs text-black/50">素材として書き出す前に隠せる</div></div><Switch checked={showControls} onCheckedChange={setShowControls} /></div>

                  </SectionCard>

                  <SectionCard icon={Phone} title="通話演出">
                    <div className="space-y-2"><Label>発信画面 背景色</Label><ColorSwatch value={outgoingCallBgColor} onChange={(e) => setOutgoingCallBgColor(e.target.value)} /></div>
                    <div className="space-y-2"><Label>発信画面の透明度</Label><Input type="range" min="0" max="1" step="0.01" value={outgoingCallBgOpacity} onChange={(e) => setOutgoingCallBgOpacity(Number(e.target.value))} /><div className="text-xs text-black/50">{Math.round(outgoingCallBgOpacity * 100)}%</div></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">発信音（ダミー）</div><div className="text-xs text-black/50">発信中に音を鳴らす</div></div><Switch checked={outgoingToneEnabled} onCheckedChange={setOutgoingToneEnabled} /></div>
                    <div className="space-y-2"><Label>発信音の種類</Label><select value={outgoingToneType} onChange={(e) => setOutgoingToneType(e.target.value)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"><option value="iphone">iPhone風</option><option value="line">LINE風</option><option value="custom">アップロード音源</option></select></div>
                    <div className="space-y-2"><Label>発信音アップロード</Label><FileButton accept="audio/*" onFile={handleCustomOutgoingToneUpload}>音源を選択</FileButton><div className="text-xs text-black/50">{customOutgoingToneName ? `選択中: ${customOutgoingToneName}` : "mp3 / wav / m4a などを選択できます"}</div></div>
                    <div className="space-y-2"><Label>着信画面 背景色</Label><ColorSwatch value={incomingCallBgColor} onChange={(e) => setIncomingCallBgColor(e.target.value)} /></div>
                    <div className="space-y-2"><Label>着信画面の透明度</Label><Input type="range" min="0" max="1" step="0.01" value={incomingCallBgOpacity} onChange={(e) => setIncomingCallBgOpacity(Number(e.target.value))} /><div className="text-xs text-black/50">{Math.round(incomingCallBgOpacity * 100)}%</div></div>
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3"><div><div className="text-sm font-medium">着信音（ダミー）</div><div className="text-xs text-black/50">着信時に音を鳴らす</div></div><Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} /></div>
                    <div className="space-y-2"><Label>着信音の種類</Label><select value={ringtoneType} onChange={(e) => setRingtoneType(e.target.value)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"><option value="iphone">iPhone風</option><option value="line">LINE風</option><option value="custom">アップロード音源</option></select></div>
                    <div className="space-y-2"><Label>着信音アップロード</Label><FileButton accept="audio/*" onFile={handleCustomRingtoneUpload}>音源を選択</FileButton><div className="text-xs text-black/50">{customRingtoneName ? `選択中: ${customRingtoneName}` : "mp3 / wav / m4a などを選択できます"}</div></div>
                    <div className="space-y-2"><Label>発信→通話中 になるまでの秒数</Label><Input type="number" min="0" step="0.1" value={callAutoSeconds} onChange={(e) => setCallAutoSeconds(e.target.value)} /><div className="text-xs text-black/50">発信中から通話中に切り替わるまでの秒数</div></div>
                    <div className="space-y-2"><Label>着信応答→通話中 になるまでの秒数</Label><Input type="number" min="0" step="0.1" value={incomingCallAutoSeconds} onChange={(e) => setIncomingCallAutoSeconds(e.target.value)} /><div className="text-xs text-black/50">着信を応答してから通話中に切り替わるまでの秒数</div></div>
                    <div className="space-y-2"><Label>着信までの秒数</Label><Input type="number" min="0" step="0.1" value={incomingDelaySeconds} onChange={(e) => setIncomingDelaySeconds(e.target.value)} /><div className="text-xs text-black/50">着信ボタンを押してから指定秒数で着信</div></div>
                    <div className="space-y-2 pt-1"><Label>着信相手の名前</Label><Input value={incomingCallTitle} onChange={(e) => setIncomingCallTitle(e.target.value)} placeholder="母" /></div>
                    <div className="space-y-2"><Label>着信相手のアイコン文字</Label><Input value={incomingCallAvatarLabel} onChange={(e) => setIncomingCallAvatarLabel(e.target.value.slice(0, 2))} placeholder="母" /></div>
                    <div className="space-y-2"><Label>着信相手のアイコン画像</Label><FileButton accept="image/*" onFile={(e) => handleImageUpload(e, setIncomingCallAvatarImage)}>画像を選択</FileButton></div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button onClick={() => scheduleIncomingCall("voice")} variant="outline" className="w-full"><Phone className="mr-2 h-4 w-4" />音声着信</Button>
                      <Button onClick={() => scheduleIncomingCall("video")} variant="outline" className="w-full"><Video className="mr-2 h-4 w-4" />ビデオ着信</Button>
                    </div>
                  </SectionCard>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Image as ImageIcon, MessageSquareMore, Palette, PlusCircle, Settings2, Trash2, UserCircle2 } from "lucide-react";

type OSType = "iphone" | "android";
type EditorTab = "preview" | "add" | "list" | "settings";
type AppMode = "edit" | "preview" | "shoot";

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
  visible: boolean;
  animatedAt: number | null;
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

type ThemeConfig = {
  phoneFrame: string;
  notificationCard: string;
  iconWrap: string;
  groupText: string;
  appText: string;
  senderText: string;
  bodyText: string;
  timeText: string;
  notch: boolean;
  homeBar: boolean;
  topPadding: string;
  largeClockWrap: string;
  largeClockTime: string;
  largeClockDate: string;
};

const osThemes: Record<OSType, ThemeConfig> = {
  iphone: {
    phoneFrame: "rounded-[42px]",
    notificationCard: "rounded-[22px] border border-white/20 shadow-lg",
    iconWrap: "rounded-[12px] border border-white/40 text-black/80 shadow-sm",
    groupText: "text-[14px] font-semibold text-white",
    appText: "text-[12px] text-white/70 font-medium",
    senderText: "text-[13px] text-white/75",
    bodyText: "text-[14px] text-white/95",
    timeText: "text-[11px] text-white/55",
    notch: true,
    homeBar: true,
    topPadding: "pt-20",
    largeClockWrap: "pt-[92px]",
    largeClockTime: "text-[52px] font-semibold text-white",
    largeClockDate: "mt-1 text-[15px] text-white/80",
  },
  android: {
    phoneFrame: "rounded-[30px]",
    notificationCard: "rounded-[18px] border border-white/10 shadow-lg",
    iconWrap: "rounded-full border border-black/5 text-zinc-800 shadow-sm",
    groupText: "text-[14px] font-semibold text-white",
    appText: "text-[12px] text-white/65 font-medium",
    senderText: "text-[13px] text-white/70",
    bodyText: "text-[14px] text-white/90",
    timeText: "text-[11px] text-white/50",
    notch: false,
    homeBar: false,
    topPadding: "pt-16",
    largeClockWrap: "pt-[74px]",
    largeClockTime: "text-[46px] font-medium text-white",
    largeClockDate: "mt-1 text-[14px] text-white/75",
  },
};

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
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

function FileInputRow({ label, description, onChange, previewName }: { label: string; description: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; previewName?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <label className="block rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black/70">
        <div className="mb-2 flex items-center gap-2 text-black/80"><ImageIcon className="h-4 w-4" />画像を選択</div>
        <input type="file" accept="image/*" onChange={onChange} className="block w-full text-sm text-black/70" />
      </label>
      <div className="text-xs text-black/50">{previewName || description}</div>
    </div>
  );
}

export default function NotificationCreator() {
  const router = useRouter();
  const [appMode, setAppMode] = useState<AppMode>("edit");
  const [activeTab, setActiveTab] = useState<EditorTab>("preview");
  const [osType, setOsType] = useState<OSType>("iphone");
  const [phoneTime, setPhoneTime] = useState("9:41");
  const [lockscreenTime, setLockscreenTime] = useState("9:41");
  const [lockscreenDate, setLockscreenDate] = useState("4月5日 日曜日");
  const [showLargeClock, setShowLargeClock] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [groupName, setGroupName] = useState("森田家");
  const [selectedWallpaper, setSelectedWallpaper] = useState("simple");
  const [uploadedWallpaper, setUploadedWallpaper] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, appName: "LINE", groupName: "森田家", sender: "美咲", text: "新着メッセージがあります", time: "22:18", iconText: "森", delaySeconds: 1, visible: true, animatedAt: null },
  ]);
  const [form, setForm] = useState({ appName: "LINE", sender: "", text: "", time: "", iconText: "森", delaySeconds: "1" });
  const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);

  const playTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const theme = osThemes[osType];
  const isShootMode = appMode === "shoot";
  const isEditMode = appMode === "edit";
  const isPreviewMode = appMode === "preview";

  const bgStyle = useMemo<React.CSSProperties>(() => {
    if (selectedWallpaper === "upload" && uploadedWallpaper) {
      return { backgroundImage: `url(${uploadedWallpaper})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    return { backgroundImage: presetWallpapers[selectedWallpaper] ?? presetWallpapers.simple, backgroundSize: "cover", backgroundPosition: "center" };
  }, [selectedWallpaper, uploadedWallpaper]);

  const sortedVisible = useMemo(() => {
    return [...messages].filter((m) => m.visible).sort((a, b) => a.delaySeconds - b.delaySeconds || b.id - a.id);
  }, [messages]);

  const clearTimers = () => {
    playTimeoutsRef.current.forEach((t) => clearTimeout(t));
    playTimeoutsRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

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

  const addMessage = () => {
    if (!form.sender.trim() || !form.text.trim()) return;
    const delay = Math.max(0, Number(form.delaySeconds) || 0);
    const msg: Message = {
      id: Date.now(),
      appName: form.appName.trim() || "LINE",
      groupName,
      sender: form.sender.trim(),
      text: form.text.trim(),
      time: form.time.trim() || "今",
      iconText: form.iconText.trim() || "森",
      iconImage: uploadedIcon ?? undefined,
      delaySeconds: delay,
      visible: true,
      animatedAt: Date.now(),
    };
    setMessages((prev) => [msg, ...prev]);
    setForm((prev) => ({ ...prev, sender: "", text: "", time: "" }));
    setUploadedIcon(null);
    setActiveTab("list");
  };

  const deleteMessage = (id: number) => setMessages((prev) => prev.filter((m) => m.id !== id));
  const updateMessage = (id: number, key: keyof Message, value: string | number | boolean | null) => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, [key]: value } : m));
  const showNow = (id: number) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, visible: true, animatedAt: Date.now() } : m));
    if (vibrateEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };
  const hideAll = () => setMessages((prev) => prev.map((m) => ({ ...m, visible: false, animatedAt: null })));
  const showAll = () => {
    clearTimers();
    setMessages((prev) => prev.map((m) => ({ ...m, visible: true, animatedAt: Date.now() })));
  };

  const playNotifications = () => {
    clearTimers();
    setMessages((prev) => prev.map((m) => ({ ...m, visible: false, animatedAt: null })));
    const sorted = [...messages].sort((a, b) => a.delaySeconds - b.delaySeconds || a.id - b.id);
    sorted.forEach((msg) => {
      const t = setTimeout(() => {
        setMessages((prev) => prev.map((item) => item.id === msg.id ? { ...item, visible: true, animatedAt: Date.now() } : item));
        if (vibrateEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }, msg.delaySeconds * 1000);
      playTimeoutsRef.current.push(t);
    });
    const maxDelay = sorted.length > 0 ? Math.max(...sorted.map((m) => m.delaySeconds)) : 0;
    playTimeoutsRef.current.push(setTimeout(() => clearTimers(), maxDelay * 1000 + 1200));
  };

  const notifBg = osType === "iphone" ? "rgba(255,255,255,0.18)" : "rgba(30,30,30,0.52)";
  const iconBg = osType === "iphone" ? "rgba(255,255,255,0.78)" : "rgba(240,240,240,0.92)";

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      <div className={cn("mx-auto w-full max-w-md", isShootMode ? "pb-6" : "pb-40")}>
        {!isShootMode && (
          <div className="sticky top-0 z-30 border-b border-black/10 bg-[#fafafa]/95 px-4 pb-3 pt-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => router.push("/")} className="rounded-full bg-black/[0.04] px-3 py-1 text-sm text-black/60 transition hover:bg-black/[0.07]">← チャット画面へ</button>
              <span className="text-sm font-semibold text-black/75">通知画面モード</span>
            </div>
            <div className="grid grid-cols-3 rounded-2xl bg-black/5 p-1 text-center">
              {(["edit", "preview", "shoot"] as AppMode[]).map((mode) => (
                <TabButton key={mode} active={appMode === mode} onClick={() => setAppMode(mode)}>
                  {mode === "edit" ? "編集" : mode === "preview" ? "確認" : "撮影"}
                </TabButton>
              ))}
            </div>
          </div>
        )}

        <div className={cn("px-4", isShootMode ? "pt-4" : "pt-4")}>
          <div className="mx-auto flex justify-center">
            <div ref={previewRef} className={cn("relative w-full max-w-[390px] aspect-[390/844] overflow-hidden border border-white/10 shadow-2xl", theme.phoneFrame)} style={bgStyle}>
              <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />

              {theme.notch && <div className="absolute left-1/2 top-3 z-20 h-[30px] w-[140px] -translate-x-1/2 rounded-full bg-black" />}

              <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 pb-3 pt-5 text-sm text-white">
                <span className="font-medium">{phoneTime}</span>
                <div className="flex items-center gap-1 text-xs opacity-90"><span>▂</span><span>◔</span><span>▮</span></div>
              </div>

              {showLargeClock && (
                <div className={cn("absolute left-0 right-0 z-10 text-center", theme.largeClockWrap)}>
                  <div className={theme.largeClockTime}>{lockscreenTime}</div>
                  <div className={theme.largeClockDate}>{lockscreenDate}</div>
                </div>
              )}

              <div className={cn("relative z-10 space-y-3 px-4", showLargeClock ? (osType === "iphone" ? "pt-[230px]" : "pt-[205px]") : theme.topPadding)}>
                {sortedVisible.map((msg) => (
                  <div key={`${msg.id}-${msg.animatedAt ?? "s"}`} className={cn("px-4 py-3", theme.notificationCard)} style={{ backgroundColor: notifBg }}>
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-sm font-semibold", theme.iconWrap)} style={{ backgroundColor: iconBg }}>
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

              {theme.homeBar && <div className="absolute bottom-2 left-1/2 z-20 h-[5px] w-[140px] -translate-x-1/2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.75)" }} />}
            </div>
          </div>
        </div>

        {isShootMode && (
          <div className="px-4 pt-4">
            <div className="mx-auto grid max-w-[390px] grid-cols-2 gap-2">
              <Button onClick={() => setAppMode("preview")} variant="outline" className="w-full">確認モードへ戻る</Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">チャット画面へ</Button>
            </div>
          </div>
        )}

        {!isShootMode && (
          <>
            <div className="sticky top-[106px] z-20 bg-[#fafafa]/95 px-4 pb-3 pt-3 backdrop-blur">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Button onClick={playNotifications} className="whitespace-nowrap">再生</Button>
                <Button onClick={clearTimers} variant="outline" className="whitespace-nowrap">停止</Button>
                <Button onClick={hideAll} variant="outline" className="whitespace-nowrap">非表示</Button>
                <Button onClick={showAll} variant="outline" className="whitespace-nowrap">全表示</Button>
              </div>
            </div>

            {isEditMode && (
              <div className="space-y-4 px-4 pt-1">
                <div className="grid grid-cols-4 rounded-2xl bg-black/5 p-1 text-center">
                  <TabButton active={activeTab === "preview"} onClick={() => setActiveTab("preview")}>確認</TabButton>
                  <TabButton active={activeTab === "add"} onClick={() => setActiveTab("add")}>追加</TabButton>
                  <TabButton active={activeTab === "list"} onClick={() => setActiveTab("list")}>通知一覧</TabButton>
                  <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>設定</TabButton>
                </div>

                {activeTab === "preview" && (
                  <SectionCard icon={MessageSquareMore} title="クイック確認">
                    <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm text-black/70">
                      <div>表示中: {sortedVisible.length}件</div>
                      <div>総数: {messages.length}件</div>
                      <div>OS: {osType === "iphone" ? "iPhone風" : "Android風"}</div>
                      <div>グループ名: {groupName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setActiveTab("add")} className="w-full">通知を追加</Button>
                      <Button onClick={() => setActiveTab("list")} variant="outline" className="w-full">通知を編集</Button>
                    </div>
                  </SectionCard>
                )}

                {activeTab === "add" && (
                  <SectionCard icon={PlusCircle} title="通知を追加">
                    <div className="space-y-2"><Label>アプリ名</Label><Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} placeholder="LINE" /></div>
                    <div className="space-y-2"><Label>送信者名</Label><Input value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} placeholder="美咲" /></div>
                    <div className="space-y-2"><Label>メッセージ</Label><Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="メッセージ内容" className="min-h-[110px] resize-none" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>通知時刻</Label><Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="22:18" /></div>
                      <div className="space-y-2"><Label>表示までの秒数</Label><Input type="number" min="0" step="0.1" value={form.delaySeconds} onChange={(e) => setForm({ ...form, delaySeconds: e.target.value })} placeholder="1" /></div>
                    </div>
                    <div className="space-y-2"><Label>文字アイコン</Label><Input value={form.iconText} onChange={(e) => setForm({ ...form, iconText: e.target.value })} placeholder="森" /></div>
                    <FileInputRow label="アイコン画像" description="画像を選ばない場合は文字アイコンを使います" onChange={handleIconUpload} previewName={uploadedIcon ? "画像を選択済み" : undefined} />
                    <Button onClick={addMessage} className="w-full justify-center">追加する</Button>
                  </SectionCard>
                )}

                {activeTab === "list" && (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <SectionCard key={msg.id} icon={Trash2} title={`通知 #${index + 1}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-semibold text-black/80">{msg.sender || "未設定"}</div>
                          <div className="flex gap-2">
                            <Button onClick={() => showNow(msg.id)} variant="outline" className="px-3 py-1.5 text-xs">今表示</Button>
                            <Button onClick={() => deleteMessage(msg.id)} variant="outline" className="border-red-200 px-3 py-1.5 text-xs text-red-500">削除</Button>
                          </div>
                        </div>
                        <div className="space-y-2"><Label>アプリ名</Label><Input value={msg.appName} onChange={(e) => updateMessage(msg.id, "appName", e.target.value)} /></div>
                        <div className="space-y-2"><Label>グループ名</Label><Input value={msg.groupName} onChange={(e) => updateMessage(msg.id, "groupName", e.target.value)} /></div>
                        <div className="space-y-2"><Label>送信者名</Label><Input value={msg.sender} onChange={(e) => updateMessage(msg.id, "sender", e.target.value)} /></div>
                        <div className="space-y-2"><Label>本文</Label><Textarea value={msg.text} onChange={(e) => updateMessage(msg.id, "text", e.target.value)} className="min-h-[100px] resize-none" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>通知時刻</Label><Input value={msg.time} onChange={(e) => updateMessage(msg.id, "time", e.target.value)} /></div>
                          <div className="space-y-2"><Label>表示までの秒数</Label><Input type="number" min="0" step="0.1" value={msg.delaySeconds} onChange={(e) => updateMessage(msg.id, "delaySeconds", Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)} /></div>
                        </div>
                        <div className="space-y-2"><Label>文字アイコン</Label><Input value={msg.iconText} onChange={(e) => updateMessage(msg.id, "iconText", e.target.value)} /></div>
                        <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                          <div>
                            <div className="text-sm font-medium">手動表示を有効にする</div>
                            <div className="text-xs text-black/50">再生前の見え方を個別に調整できます</div>
                          </div>
                          <Switch checked={msg.visible} onCheckedChange={(value) => updateMessage(msg.id, "visible", value)} />
                        </div>
                      </SectionCard>
                    ))}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-4">
                    <SectionCard icon={UserCircle2} title="端末表示">
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => setOsType("iphone")} variant={osType === "iphone" ? "default" : "outline"} className="w-full">iPhone風</Button>
                        <Button onClick={() => setOsType("android")} variant={osType === "android" ? "default" : "outline"} className="w-full">Android風</Button>
                      </div>
                      <div className="space-y-2"><Label>ステータスバー時刻</Label><Input value={phoneTime} onChange={(e) => setPhoneTime(e.target.value)} placeholder="9:41" /></div>
                      <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                        <div>
                          <div className="text-sm font-medium">大きい時計を表示</div>
                          <div className="text-xs text-black/50">ロック画面っぽい見せ方に切り替え</div>
                        </div>
                        <Switch checked={showLargeClock} onCheckedChange={setShowLargeClock} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2"><Label>大きい時計</Label><Input value={lockscreenTime} onChange={(e) => setLockscreenTime(e.target.value)} placeholder="9:41" /></div>
                        <div className="space-y-2"><Label>日付表示</Label><Input value={lockscreenDate} onChange={(e) => setLockscreenDate(e.target.value)} placeholder="4月5日 日曜日" /></div>
                      </div>
                    </SectionCard>

                    <SectionCard icon={Settings2} title="通知設定">
                      <div className="space-y-2"><Label>グループ名</Label><Input value={groupName} onChange={(e) => { setGroupName(e.target.value); setMessages((prev) => prev.map((m) => ({ ...m, groupName: e.target.value }))); }} placeholder="森田家" /></div>
                      <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3">
                        <div>
                          <div className="text-sm font-medium">バイブON</div>
                          <div className="text-xs text-black/50">再生時に端末バイブを鳴らします</div>
                        </div>
                        <Switch checked={vibrateEnabled} onCheckedChange={setVibrateEnabled} />
                      </div>
                    </SectionCard>

                    <SectionCard icon={Palette} title="壁紙">
                      <div className="space-y-2"><Label>プリセット壁紙</Label>
                        <select value={selectedWallpaper} onChange={(e) => setSelectedWallpaper(e.target.value)} className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none">
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
                      <FileInputRow label="壁紙画像" description="アップロードすると背景に反映されます" onChange={handleWallpaperUpload} previewName={uploadedWallpaper ? "画像を選択済み" : undefined} />
                      {uploadedWallpaper && <Button onClick={() => { setUploadedWallpaper(null); setSelectedWallpaper("simple"); }} variant="outline" className="w-full">アップロード壁紙を解除</Button>}
                    </SectionCard>
                  </div>
                )}
              </div>
            )}

            {isPreviewMode && (
              <div className="px-4 pt-4">
                <SectionCard icon={Clock3} title="確認モード">
                  <div className="text-sm text-black/65">このモードでは再生・停止・見え方の確認に集中できます。</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setAppMode("edit")} variant="outline" className="w-full">編集モードへ</Button>
                    <Button onClick={() => setAppMode("shoot")} className="w-full">撮影モードへ</Button>
                  </div>
                </SectionCard>
              </div>
            )}
          </>
        )}
      </div>

      {!isShootMode && isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 z-30 w-full border-t border-black/10 bg-white px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
            <button type="button" onClick={() => setActiveTab("preview")} className={cn("rounded-2xl px-2 py-3 text-xs font-medium transition", activeTab === "preview" ? "bg-black text-white" : "bg-black/[0.04] text-black/70")}>確認</button>
            <button type="button" onClick={() => setActiveTab("add")} className={cn("rounded-2xl px-2 py-3 text-xs font-medium transition", activeTab === "add" ? "bg-black text-white" : "bg-black/[0.04] text-black/70")}>追加</button>
            <button type="button" onClick={() => setActiveTab("list")} className={cn("rounded-2xl px-2 py-3 text-xs font-medium transition", activeTab === "list" ? "bg-black text-white" : "bg-black/[0.04] text-black/70")}>通知</button>
            <button type="button" onClick={() => setActiveTab("settings")} className={cn("rounded-2xl px-2 py-3 text-xs font-medium transition", activeTab === "settings" ? "bg-black text-white" : "bg-black/[0.04] text-black/70")}>設定</button>
          </div>
        </div>
      )}
    </div>
  );
}

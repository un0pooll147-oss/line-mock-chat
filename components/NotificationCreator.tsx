"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
      return { backgroundImage: "url(" + uploadedWallpaper + ")", backgroundSize: "cover", backgroundPosition: "center" };
    }
    return { backgroundImage: presetWallpapers[selectedWallpaper] ?? presetWallpapers.simple, backgroundSize: "cover", backgroundPosition: "center" };
  }, [selectedWallpaper, uploadedWallpaper]);

  const sortedVisible = useMemo(() => {
    return [...messages].filter((m) => m.visible).sort((a, b) => a.delaySeconds - b.delaySeconds || b.id - a.id);
  }, [messages]);

  const clearTimers = () => { playTimeoutsRef.current.forEach((t) => clearTimeout(t)); playTimeoutsRef.current = []; };
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
    const msg: Message = { id: Date.now(), appName: form.appName.trim() || "LINE", groupName, sender: form.sender.trim(), text: form.text.trim(), time: form.time.trim() || "今", iconText: form.iconText.trim() || "森", iconImage: uploadedIcon ?? undefined, delaySeconds: delay, visible: true, animatedAt: Date.now() };
    setMessages((prev) => [msg, ...prev]);
    setForm((prev) => ({ ...prev, sender: "", text: "", time: "" }));
    setUploadedIcon(null);
    setActiveTab("list");
  };

  const deleteMessage = (id: number) => setMessages((prev) => prev.filter((m) => m.id !== id));
  const updateMessage = (id: number, key: keyof Message, value: string | number | boolean | null) => setMessages((prev) => prev.map((m) => m.id === id ? { ...m, [key]: value } : m));
  const showNow = (id: number) => { setMessages((prev) => prev.map((m) => m.id === id ? { ...m, visible: true, animatedAt: Date.now() } : m)); if (vibrateEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]); };
  const hideAll = () => setMessages((prev) => prev.map((m) => ({ ...m, visible: false, animatedAt: null })));
  const showAll = () => { clearTimers(); setMessages((prev) => prev.map((m) => ({ ...m, visible: true, animatedAt: Date.now() }))); };

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

  const ic = "w-full rounded-2xl bg-white text-black px-4 py-3 outline-none text-sm";

  const notifBg = osType === "iphone" ? "rgba(255,255,255,0.18)" : "rgba(30,30,30,0.52)";
  const iconBg = osType === "iphone" ? "rgba(255,255,255,0.78)" : "rgba(240,240,240,0.92)";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className={"mx-auto max-w-[720px] " + (isShootMode ? "pb-6" : "pb-36")}>

        {!isShootMode && (
          <div className="sticky top-0 z-30 bg-black px-3 pt-3 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => router.push("/")} className="text-sm text-white/60">← チャット画面へ</button>
              <span className="text-sm font-semibold text-white/80">通知画面作成</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["edit", "preview", "shoot"] as AppMode[]).map((mode) => (
                <button key={mode} onClick={() => setAppMode(mode)}
                  className={"rounded-2xl border px-3 py-2 text-left " + (appMode === mode ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white")}>
                  <div className="text-xs font-semibold">{mode === "edit" ? "編集" : mode === "preview" ? "確認" : "撮影"}</div>
                  <div className={"text-[10px] mt-0.5 " + (appMode === mode ? "text-black/60" : "text-white/45")}>
                    {mode === "edit" ? "追加・修正・設定" : mode === "preview" ? "再生しながら確認" : "UI非表示で本番用"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={isShootMode ? "pt-4 px-3" : "px-3 pt-3"}>
          <div className="mx-auto flex justify-center">
            <div ref={previewRef} className={"relative w-full max-w-[390px] aspect-[390/844] overflow-hidden border border-white/10 shadow-2xl " + theme.phoneFrame} style={bgStyle}>
              <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />

              {theme.notch && <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[140px] h-[30px] bg-black rounded-full z-20" />}

              <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-5 pb-3 flex items-center justify-between text-sm text-white">
                <span className="font-medium">{phoneTime}</span>
                <div className="flex items-center gap-1 text-xs opacity-90"><span>▂</span><span>◔</span><span>▮</span></div>
              </div>

              {showLargeClock && (
                <div className={"absolute left-0 right-0 z-10 text-center " + theme.largeClockWrap}>
                  <div className={theme.largeClockTime}>{lockscreenTime}</div>
                  <div className={theme.largeClockDate}>{lockscreenDate}</div>
                </div>
              )}

              <div className={"relative z-10 px-4 space-y-3 " + (showLargeClock ? (osType === "iphone" ? "pt-[230px]" : "pt-[205px]") : theme.topPadding)}>
                {sortedVisible.map((msg) => (
                  <div key={msg.id + "-" + (msg.animatedAt ?? "s")} className={"px-4 py-3 " + theme.notificationCard} style={{ backgroundColor: notifBg }}>
                    <div className="flex items-start gap-3">
                      <div className={"w-10 h-10 overflow-hidden shrink-0 flex items-center justify-center text-sm font-semibold " + theme.iconWrap} style={{ backgroundColor: iconBg }}>
                        {msg.iconImage ? <img src={msg.iconImage} alt="icon" className="w-full h-full object-cover" /> : <span>{msg.iconText || "森"}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className={theme.appText}>{msg.appName}</div>
                          <div className={theme.timeText}>{msg.time}</div>
                        </div>
                        <div className={"mt-0.5 truncate " + theme.groupText}>{msg.groupName}</div>
                        <div className={"mt-0.5 truncate " + theme.senderText}>{msg.sender}</div>
                        <div className={"mt-0.5 break-words leading-snug " + theme.bodyText}>{msg.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {theme.homeBar && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[140px] h-[5px] rounded-full z-20" style={{ backgroundColor: "rgba(255,255,255,0.75)" }} />}
            </div>
          </div>
        </div>

        {isShootMode && (
          <div className="px-3 pt-4">
            <div className="mx-auto max-w-[390px] grid grid-cols-2 gap-2">
              <button onClick={() => setAppMode("preview")} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black">確認モードへ戻る</button>
              <button onClick={() => router.push("/")} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold">チャット画面へ</button>
            </div>
          </div>
        )}

        {!isShootMode && (
          <>
            <div className="sticky top-[104px] z-20 bg-black px-3 pt-3 pb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={playNotifications} className="whitespace-nowrap rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black">再生</button>
                <button onClick={clearTimers} className="whitespace-nowrap rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black">停止</button>
                <button onClick={hideAll} className="whitespace-nowrap rounded-full bg-white/10 px-4 py-2 text-sm">非表示</button>
                <button onClick={showAll} className="whitespace-nowrap rounded-full bg-white/10 px-4 py-2 text-sm">全表示</button>
              </div>
            </div>

            {isEditMode && (
              <div className="px-3 pt-2">
                <div className="rounded-[28px] border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
                  <div className="flex justify-center pt-3"><div className="h-1.5 w-14 rounded-full bg-white/20" /></div>
                  <div className="flex gap-2 overflow-x-auto px-3 py-3">
                    {(["preview", "add", "list", "settings"] as EditorTab[]).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={"whitespace-nowrap min-w-[72px] rounded-full px-4 py-2 text-sm font-medium " + (activeTab === tab ? "bg-white text-black" : "bg-white/10 text-white/80")}>
                        {tab === "preview" ? "確認" : tab === "add" ? "追加" : tab === "list" ? "通知一覧" : "設定"}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 pb-5">
                    {activeTab === "preview" && (
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-white/5 p-4 text-sm space-y-1">
                          <div className="font-semibold mb-2">クイック確認</div>
                          <div className="text-white/65">表示中: {sortedVisible.length}件　総数: {messages.length}件</div>
                          <div className="text-white/65">OS: {osType === "iphone" ? "iPhone風" : "Android風"}　グループ: {groupName}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setActiveTab("add")} className="rounded-2xl bg-white text-black py-3 text-sm font-semibold">通知を追加</button>
                          <button onClick={() => setActiveTab("list")} className="rounded-2xl bg-white/10 py-3 text-sm font-semibold">通知を編集</button>
                        </div>
                      </div>
                    )}
                    {activeTab === "add" && (
                      <div className="space-y-3">
                        <input type="text" value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} placeholder="アプリ名（例：LINE）" className={ic} />
                        <input type="text" value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} placeholder="送信者名" className={ic} />
                        <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="メッセージ" className={ic + " min-h-[100px] resize-none"} />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="通知時刻" className={ic} />
                          <input type="number" min="0" step="0.1" value={form.delaySeconds} onChange={(e) => setForm({ ...form, delaySeconds: e.target.value })} placeholder="表示秒数" className={ic} />
                        </div>
                        <input type="text" value={form.iconText} onChange={(e) => setForm({ ...form, iconText: e.target.value })} placeholder="文字アイコン" className={ic} />
                        <label className="block rounded-2xl bg-white/5 px-4 py-3 text-sm">
                          <div className="mb-2 text-white/80">アイコン画像</div>
                          <input type="file" accept="image/*" onChange={handleIconUpload} className="block w-full text-sm text-white/80" />
                        </label>
                        <button onClick={addMessage} className="w-full rounded-2xl bg-green-500 py-4 text-base font-semibold text-black">通知を追加</button>
                      </div>
                    )}
                    {activeTab === "list" && (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div key={msg.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold truncate">{msg.sender}</div>
                              <div className="flex gap-2">
                                <button onClick={() => showNow(msg.id)} className="rounded-full bg-blue-500/80 px-3 py-1.5 text-xs">今表示</button>
                                <button onClick={() => deleteMessage(msg.id)} className="rounded-full bg-red-500/80 px-3 py-1.5 text-xs">削除</button>
                              </div>
                            </div>
                            <input type="text" value={msg.appName} onChange={(e) => updateMessage(msg.id, "appName", e.target.value)} placeholder="アプリ名" className={ic} />
                            <input type="text" value={msg.groupName} onChange={(e) => updateMessage(msg.id, "groupName", e.target.value)} placeholder="グループ名" className={ic} />
                            <input type="text" value={msg.sender} onChange={(e) => updateMessage(msg.id, "sender", e.target.value)} placeholder="送信者名" className={ic} />
                            <textarea value={msg.text} onChange={(e) => updateMessage(msg.id, "text", e.target.value)} placeholder="メッセージ" className={ic + " min-h-[90px] resize-none"} />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={msg.time} onChange={(e) => updateMessage(msg.id, "time", e.target.value)} placeholder="通知時刻" className={ic} />
                              <input type="number" min="0" step="0.1" value={msg.delaySeconds} onChange={(e) => updateMessage(msg.id, "delaySeconds", Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)} placeholder="表示秒数" className={ic} />
                            </div>
                            <input type="text" value={msg.iconText} onChange={(e) => updateMessage(msg.id, "iconText", e.target.value)} placeholder="文字アイコン" className={ic} />
                            <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                              <input type="checkbox" checked={msg.visible} onChange={(e) => updateMessage(msg.id, "visible", e.target.checked)} />
                              手動表示
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "settings" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setOsType("iphone")} className={"rounded-2xl py-3 text-sm font-semibold " + (osType === "iphone" ? "bg-white text-black" : "bg-white/10 text-white")}>iPhone風</button>
                          <button onClick={() => setOsType("android")} className={"rounded-2xl py-3 text-sm font-semibold " + (osType === "android" ? "bg-white text-black" : "bg-white/10 text-white")}>Android風</button>
                        </div>
                        <input type="text" value={phoneTime} onChange={(e) => setPhoneTime(e.target.value)} placeholder="ステータスバー時刻" className={ic} />
                        <label className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90 cursor-pointer">
                          <input type="checkbox" checked={showLargeClock} onChange={(e) => setShowLargeClock(e.target.checked)} />
                          大きい時計を表示
                        </label>
                        <input type="text" value={lockscreenTime} onChange={(e) => setLockscreenTime(e.target.value)} placeholder="大きい時計" className={ic} />
                        <input type="text" value={lockscreenDate} onChange={(e) => setLockscreenDate(e.target.value)} placeholder="日付表示（例：4月5日 日曜日）" className={ic} />
                        <input type="text" value={groupName} onChange={(e) => { setGroupName(e.target.value); setMessages((prev) => prev.map((m) => ({ ...m, groupName: e.target.value }))); }} placeholder="グループ名" className={ic} />
                        <label className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90 cursor-pointer">
                          <input type="checkbox" checked={vibrateEnabled} onChange={(e) => setVibrateEnabled(e.target.checked)} />
                          バイブON
                        </label>
                        <select value={selectedWallpaper} onChange={(e) => setSelectedWallpaper(e.target.value)} className={ic}>
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
                        <label className="block rounded-2xl bg-white/5 px-4 py-3 text-sm">
                          <div className="mb-2 text-white/80">壁紙画像アップロード</div>
                          <input type="file" accept="image/*" onChange={handleWallpaperUpload} className="block w-full text-sm text-white/80" />
                        </label>
                        {uploadedWallpaper && (
                          <button onClick={() => { setUploadedWallpaper(null); setSelectedWallpaper("simple"); }} className="w-full rounded-2xl bg-white/10 py-3 text-sm">アップロード壁紙を解除</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isPreviewMode && (
              <div className="px-3 pt-4">
                <div className="rounded-[28px] border border-white/10 bg-zinc-900 p-4 shadow-2xl space-y-3">
                  <div className="text-sm font-semibold">確認モードの使い方</div>
                  <div className="text-sm text-white/65">再生・停止・表示確認に集中するモードです。</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setAppMode("edit")} className="rounded-2xl bg-white/10 py-3 text-sm font-semibold">編集モードへ</button>
                    <button onClick={() => setAppMode("shoot")} className="rounded-2xl bg-white py-3 text-sm font-semibold text-black">撮影モードへ</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isShootMode && isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black">
          <div className="mx-auto grid max-w-[720px] grid-cols-4 gap-2 px-3 py-3">
            {(["preview", "add", "list", "settings"] as EditorTab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={"rounded-2xl py-3 text-xs font-medium " + (activeTab === tab ? "bg-white text-black" : "bg-white/10")}>
                {tab === "preview" ? "確認" : tab === "add" ? "追加" : tab === "list" ? "通知" : "設定"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

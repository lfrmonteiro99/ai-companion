"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  agentId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell({ userId }: { userId: string | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchNotifications() {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* ignore */ }
  }

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  if (!userId) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-base-400 transition-colors hover:bg-base-700/60 hover:text-base-100"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-lg shadow-rose-500/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl surface-2 animate-fade-in">
          <div className="flex items-center justify-between border-b border-base-500/30 px-4 py-3">
            <span className="text-sm font-semibold text-base-50">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-mira-400 hover:text-mira-300 transition-colors">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-base-400">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <a
                  key={n.id}
                  href={`/chat/${n.agentId}`}
                  onClick={() => markAsRead(n.id)}
                  className={`block border-b border-base-500/20 px-4 py-3 transition-colors hover:bg-base-600/30 ${!n.read ? "bg-base-700/40" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-base-100">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-mira-400" />}
                  </div>
                  <p className="mt-0.5 text-xs text-base-300">{n.body}</p>
                  <p className="mt-1 text-[10px] text-base-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type UnreadContextType = {
  hasUnread: boolean;
  unreadAnnouncements: number;
  unreadInvitations: number;
  refreshUnread: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const UnreadContext = createContext<UnreadContextType | null>(null);

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error("useUnread must be used inside UnreadProvider");
  return ctx;
}

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [unreadInvitations, setUnreadInvitations] = useState(0);

  const hasUnread = unreadAnnouncements > 0 || unreadInvitations > 0;

  // === Pull unread counts from Supabase ===
  async function refreshUnread() {
    try {
      const { data: ann } = await supabase
        .from("announcements")
        .select("*")
        .eq("read", false);

      const { data: inv } = await supabase
        .from("invitations")
        .select("*")
        .eq("read", false);

      setUnreadAnnouncements(ann?.length || 0);
      setUnreadInvitations(inv?.length || 0);
    } catch (err) {
      console.error("UnreadContext refresh error:", err);
    }
  }

  // === Mark all as read ===
  async function markAllRead() {
    try {
      await supabase.from("announcements").update({ read: true }).eq("read", false);
      await supabase.from("invitations").update({ read: true }).eq("read", false);

      setUnreadAnnouncements(0);
      setUnreadInvitations(0);
    } catch (err) {
      console.error("markAllRead error:", err);
    }
  }

  // Refresh when app mounts
  useEffect(() => {
    refreshUnread();
  }, []);

  return (
    <UnreadContext.Provider
      value={{
        hasUnread,
        unreadAnnouncements,
        unreadInvitations,
        refreshUnread,
        markAllRead,
      }}
    >
      {children}
    </UnreadContext.Provider>
  );
}

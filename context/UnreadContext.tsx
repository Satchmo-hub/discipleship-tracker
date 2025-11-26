import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase/client";

type UnreadContextType = {
  unreadAnnouncements: number;
  unreadInvitations: number;
  unreadMessages: number;   // announcements + invitations

  unreadBadges: number;     // NEW

  refreshUnread: () => Promise<void>;
  markMessagesRead: () => Promise<void>;
  markBadgesRead: () => Promise<void>;
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

  const [unreadBadges, setUnreadBadges] = useState(0);

  const unreadMessages = unreadAnnouncements + unreadInvitations;

  // Keys for AsyncStorage timestamps
  const LAST_BADGE_CHECK = "dt.lastBadgeCheck";

  // ========================================================================
  // REFRESH — announcements, invitations, badges
  // ========================================================================
  async function refreshUnread() {
    try {
      // ----- Announcements -----
      const { data: ann } = await supabase
        .from("announcements")
        .select("*")
        .eq("read", false);

      // ----- Invitations -----
      const { data: inv } = await supabase
        .from("invitations")
        .select("*")
        .eq("read", false);

      setUnreadAnnouncements(ann?.length || 0);
      setUnreadInvitations(inv?.length || 0);

      // ----- Badges -----
      // Pull all badge transactions involving this user
      const session = await supabase.auth.getSession();
      const publicId = session.data?.session?.user?.user_metadata?.public_id;

      if (publicId) {
        const { data: badgeRows } = await supabase
          .from("badge_with_profiles")
          .select("*")
          .eq("recipient_public_id", publicId)
          .order("created_at", { ascending: false });

        // Load timestamp of last time user opened Badges tab
        const lastCheck = await AsyncStorage.getItem(LAST_BADGE_CHECK);
        const lastCheckDate = lastCheck ? new Date(lastCheck) : null;

        // Count only badges newer than lastCheck
        const newUnread = badgeRows?.filter((b) => {
          if (!lastCheckDate) return true; // if never opened, all badges unread
          return new Date(b.created_at) > lastCheckDate;
        }).length;

        setUnreadBadges(newUnread || 0);
      }

    } catch (err) {
      console.error("UnreadContext refresh error:", err);
    }
  }

  // ========================================================================
  // MARK MESSAGES READ — announcements + invitations
  // ========================================================================
  async function markMessagesRead() {
    try {
      await supabase.from("announcements").update({ read: true }).eq("read", false);
      await supabase.from("invitations").update({ read: true }).eq("read", false);

      setUnreadAnnouncements(0);
      setUnreadInvitations(0);
    } catch (err) {
      console.error("markMessagesRead error:", err);
    }
  }

  // ========================================================================
  // MARK BADGES READ — sets last opened timestamp
  // ========================================================================
  async function markBadgesRead() {
    try {
      await AsyncStorage.setItem(LAST_BADGE_CHECK, new Date().toISOString());
      setUnreadBadges(0);
    } catch (err) {
      console.error("markBadgesRead error:", err);
    }
  }

  // ========================================================================
  // INITIAL LOAD
  // ========================================================================
  useEffect(() => {
    refreshUnread();
  }, []);

  return (
    <UnreadContext.Provider
      value={{
        unreadAnnouncements,
        unreadInvitations,
        unreadMessages,   // REMINDERS tab uses this
        unreadBadges,     // BADGES tab uses this
        refreshUnread,
        markMessagesRead,
        markBadgesRead,
      }}
    >
      {children}
    </UnreadContext.Provider>
  );
}

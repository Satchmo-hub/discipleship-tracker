// app/(tabs)/reminders.tsx

import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  withSequence,
  withTiming,
  withRepeat,
  useAnimatedStyle,
} from "react-native-reanimated";

import ParchmentScreen from "../../components/ParchmentScreen";
import MessageScroll from "../../components/MessageScroll";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";

// ============================================================
// TYPES
// ============================================================
type Announcement = {
  id: number;
  teacher_id: string | null;
  class_hour_id: number | null;
  title: string;
  message: string;
  created_at: string | null;
};

type Invitation = {
  id: number;
  teacher_id: string | null;
  class_hour_id: number | null;
  title: string;
  message: string;
  created_at: string | null;
};

// ============================================================
// STORAGE KEYS
// ============================================================
const READ_ANNOUNCEMENTS_KEY = "dt.readAnnouncements.v1";
const READ_INVITATIONS_KEY = "dt.readInvitations.v1";

export default function RemindersScreen() {
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<number[]>([]);
  const [readInvitationIds, setReadInvitationIds] = useState<number[]>([]);

  // ============================================================
  // LOAD READ IDS FROM ASYNC STORAGE
  // ============================================================
  useEffect(() => {
    (async () => {
      try {
        const [annRaw, invRaw] = await Promise.all([
          AsyncStorage.getItem(READ_ANNOUNCEMENTS_KEY),
          AsyncStorage.getItem(READ_INVITATIONS_KEY),
        ]);

        if (annRaw) setReadAnnouncementIds(JSON.parse(annRaw));
        if (invRaw) setReadInvitationIds(JSON.parse(invRaw));
      } catch (err) {
        console.error("Failed to load read IDs:", err);
      }
    })();
  }, []);

  // ============================================================
  // FETCH ANNOUNCEMENTS & INVITATIONS
  // ============================================================
  useEffect(() => {
    fetchAnnouncements();
    fetchInvitations();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading announcements:", error);
      return;
    }
    setAnnouncements((data || []) as Announcement[]);
  };

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading invitations:", error);
      return;
    }
    setInvitations((data || []) as Invitation[]);
  };

  // ============================================================
  // SAVE READ IDS
  // ============================================================
  const saveReadAnnouncementIds = async (ids: number[]) => {
    setReadAnnouncementIds(ids);
    try {
      await AsyncStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(ids));
    } catch (err) {
      console.error("Failed to save read announcement IDs:", err);
    }
  };

  const saveReadInvitationIds = async (ids: number[]) => {
    setReadInvitationIds(ids);
    try {
      await AsyncStorage.setItem(READ_INVITATIONS_KEY, JSON.stringify(ids));
    } catch (err) {
      console.error("Failed to save read invitation IDs:", err);
    }
  };

  const markAnnouncementRead = (id: number) => {
    if (readAnnouncementIds.includes(id)) return;
    const updated = [...readAnnouncementIds, id];
    saveReadAnnouncementIds(updated);
  };

  const markInvitationRead = (id: number) => {
    if (readInvitationIds.includes(id)) return;
    const updated = [...readInvitationIds, id];
    saveReadInvitationIds(updated);
  };

  // ============================================================
  // REALTIME LISTENERS
  // ============================================================
  useEffect(() => {
    const annChannel = supabase
      .channel("announcements_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          const newAnnouncement = payload.new as Announcement;
          setAnnouncements((prev) => [newAnnouncement, ...prev]);
          showToast("You have a new message.");
        }
      )
      .subscribe();

    const invChannel = supabase
      .channel("invitations_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "invitations",
        },
        (payload) => {
          const newInvitation = payload.new as Invitation;
          setInvitations((prev) => [newInvitation, ...prev]);
          showToast("You have a new invitation.");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(annChannel);
      supabase.removeChannel(invChannel);
    };
  }, []);

  // ============================================================
  // UNREAD COUNTS & BOUNCING ICON
  // ============================================================
  const unreadAnnouncements = useMemo(
    () => announcements.filter((a) => !readAnnouncementIds.includes(a.id)),
    [announcements, readAnnouncementIds]
  );

  const unreadInvitations = useMemo(
    () => invitations.filter((i) => !readInvitationIds.includes(i.id)),
    [invitations, readInvitationIds]
  );

  const totalUnread = unreadAnnouncements.length + unreadInvitations.length;
  const hasUnread = totalUnread > 0;

  const bounce = useSharedValue(0);

  useEffect(() => {
    if (hasUnread) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 700 }),
          withTiming(0, { duration: 700 })
        ),
        -1,
        true
      );
    } else {
      bounce.value = withTiming(0, { duration: 300 });
    }
  }, [hasUnread]);

  const animatedScrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <ParchmentScreen>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Title */}
        <Text style={styles.header}>Reminders</Text>

        {/* BOUNCING SCROLL ICON */}
        <Animated.View style={animatedScrollStyle}>
          <Image
            source={require("../../assets/images/rolledScroll.png")}
            style={styles.remindersIcon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* INVITATIONS SECTION */}
        <Text style={styles.sectionTitle}>Invitations</Text>
        <View style={styles.section}>
          {invitations.length === 0 ? (
            <Text style={styles.emptyText}>No invitations yet.</Text>
          ) : (
            invitations.map((inv) => (
              <MessageScroll
                key={inv.id}
                title={inv.title}
                message={inv.message}
                timestamp={inv.created_at || ""}
                isUnread={!readInvitationIds.includes(inv.id)}
                onOpen={() => markInvitationRead(inv.id)}
              />
            ))
          )}
        </View>

        {/* MESSAGES SECTION */}
        <Text style={styles.sectionTitle}>Messages</Text>
        <View style={styles.section}>
          {announcements.length === 0 ? (
            <Text style={styles.emptyText}>No messages yet.</Text>
          ) : (
            announcements.map((a) => (
              <MessageScroll
                key={a.id}
                title={a.title}
                message={a.message}
                timestamp={a.created_at || ""}
                isUnread={!readAnnouncementIds.includes(a.id)}
                onOpen={() => markAnnouncementRead(a.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ParchmentScreen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 30,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  header: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 42,
    color: "#4b3a25",
    marginBottom: 10,
  },
  remindersIcon: {
    width: 140,
    height: 140,
    marginBottom: 25,
  },
  sectionTitle: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 28,
    color: "#4b3a25",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  section: {
    width: "100%",
    alignItems: "center",
    marginBottom: 25,
  },
  emptyText: {
    fontFamily: "Lora-Italic",
    fontSize: 16,
    color: "#6a5a43",
    marginTop: 10,
  },
});

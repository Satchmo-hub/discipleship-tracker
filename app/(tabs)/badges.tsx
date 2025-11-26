// ============================================================================
// BADGES SCREEN — CLEAN REBUILD + UNREAD FIX
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Clipboard,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

import { useStats } from "../../context/StatsContext";
import { useProfile } from "../../context/ProfileContext";
import { supabase } from "../../supabase/client";
import { useUnread } from "../../context/UnreadContext";

import Animated, {
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import ParchmentScreen from "../../components/ParchmentScreen";
import BadgePickerModal from "../../components/BadgePickerModal";

// ============================================================================
// BADGE CATALOG
// ============================================================================
const badgeCatalog = [
  {
    category: "Fist Bump of Righteousness",
    id: "fistbump",
    icons: [
      require("../../assets/badges/FistBumpArmor.png"),
      require("../../assets/badges/FistBumpElf.png"),
      require("../../assets/badges/FistBumpMale.png"),
    ],
  },
  {
    category: "High Five of Holiness",
    id: "highfive",
    icons: [
      require("../../assets/badges/HighFiveHoliness.png"),
      require("../../assets/badges/ElegantHighFive.png"),
    ],
  },
  {
    category: "You've Been Blessed!",
    id: "blessed",
    icons: [
      require("../../assets/badges/YouveBeenBlessed3.png"),
      require("../../assets/badges/YouveBeenBlessed2.png"),
    ],
  },
  {
    category: "El Jefe — Honor Badge",
    id: "eljefe",
    icons: [require("../../assets/badges/El_Jefe.png")],
  },
];

// ============================================================================
// FRIEND TYPE
// ============================================================================
type FriendRow = {
  id: number;
  owner_uuid: string;
  friend_uuid: string;
  friend_public_id: string;
  friend_first: string | null;
  friend_last: string | null;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function BadgesScreen() {
  const { state, spendCoins } = useStats();
  const { profile } = useProfile();
  const userPublicId = profile?.public_id;

  // ⭐ UNREAD BADGES FIX — call on screen open
  const { markBadgesRead } = useUnread();

  // fire once on mount
  useEffect(() => {
    markBadgesRead();
  }, []);

  // SEND MODAL
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  // ZOOM MODAL
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomedIcon, setZoomedIcon] = useState<any>(null);

  // BATTLE BUDDIES
  const [wingmenOpen, setWingmenOpen] = useState(false);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [friendInput, setFriendInput] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // RECEIVED + SENT
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [showReceivedBox, setShowReceivedBox] = useState(false);
  const [showSentBox, setShowSentBox] = useState(false);

  const [openReceivedGroups, setOpenReceivedGroups] = useState<any>({});
  const [openSentGroups, setOpenSentGroups] = useState<any>({});

  const receivedScale = useSharedValue(1);
  const sentScale = useSharedValue(1);

  // ========================================================================
  // LOAD FRIENDS
  // ========================================================================
  useEffect(() => {
    if (!profile?.uuid) return;

    (async () => {
      setLoadingFriends(true);

      const { data } = await supabase
        .from("dt_friends")
        .select("*")
        .eq("owner_uuid", profile.uuid)
        .order("created_at", { ascending: false });

      setFriends(data || []);
      setLoadingFriends(false);
    })();
  }, [profile?.uuid]);
// ========================================================================
// ADD BUDDY BY PUBLIC ID
// ========================================================================
const handleAddFriend = async () => {
  if (!friendInput.trim())
    return Alert.alert("Missing ID", "Enter a Public ID.");

  if (!profile?.uuid)
    return Alert.alert("Hold up", "Profile is still loading.");

  setAddingFriend(true);

  // Lookup profile for that public ID
  const { data: pRows } = await supabase
    .from("profiles")
    .select("uuid, first_name, last_name, public_id")
    .eq("public_id", friendInput.trim())
    .limit(1);

  if (!pRows || pRows.length === 0) {
    setAddingFriend(false);
    return Alert.alert("Not found", "No user has that Public ID.");
  }

  const friend = pRows[0];

  if (friend.uuid === profile.uuid) {
    setAddingFriend(false);
    return Alert.alert("Nope 😄", "You can't add yourself.");
  }

  // Insert friend link
  await supabase.from("dt_friends").insert({
    owner_uuid: profile.uuid,
    friend_uuid: friend.uuid,
    friend_public_id: friend.public_id,
    friend_first: friend.first_name,
    friend_last: friend.last_name,
  });

  // Reload list
  const { data: newList } = await supabase
    .from("dt_friends")
    .select("*")
    .eq("owner_uuid", profile.uuid)
    .order("created_at", { ascending: false });

  setFriends(newList || []);
  setFriendInput("");
  setAddingFriend(false);

  Alert.alert("Buddy added!");
};

// ========================================================================
// SELECT WINGMAN — OPEN SEND MODAL
// ========================================================================
const handleSelectWingman = (publicId: string) => {
  setRecipientId(publicId);
  setSelectedBadge(null);
  setSendModalVisible(true);
};

// ========================================================================
// LOAD RECEIVED BADGES
// ========================================================================
useEffect(() => {
  if (!userPublicId) return;

  (async () => {
    const { data } = await supabase
      .from("badge_with_profiles")
      .select("*")
      .or(
        `recipient_public_id.eq.${userPublicId},recipient_id.eq.${userPublicId}`
      )
      .order("created_at", { ascending: false });

    setReceived(data || []);
  })();
}, [userPublicId]);

// ========================================================================
// LOAD SENT BADGES
// ========================================================================
useEffect(() => {
  if (!userPublicId) return;

  (async () => {
    const { data } = await supabase
      .from("badge_with_profiles")
      .select("*")
      .or(
        `sender_public_id.eq.${userPublicId},sender_id.eq.${userPublicId}`
      )
      .order("created_at", { ascending: false });

    setSent(data || []);
  })();
}, [userPublicId]);

// ========================================================================
// MERGE RECEIVED (combine where user is recipient)
// ========================================================================
const mergedReceived = useMemo(() => {
  const merged = [
    ...received,
    ...sent.filter((b) => b.recipient_public_id === userPublicId),
  ];

  return merged.filter(
    (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i
  );
}, [received, sent, userPublicId]);

// ========================================================================
// GROUP BY (type + variant)
// ========================================================================
const groupByTypeVariant = (list: any[]) => {
  const groups: any = {};
  list.forEach((item) => {
    const key = `${item.badge_type}__${item.badge_variant}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
};

const groupedReceived = useMemo(
  () => groupByTypeVariant(mergedReceived),
  [mergedReceived]
);

const groupedSent = useMemo(
  () => groupByTypeVariant(sent),
  [sent]
);
// ========================================================================
// RENDER
// ========================================================================
return (
  <ParchmentScreen safeTopPadding>
    <ScrollView contentContainerStyle={styles.container}>

      {/* ================================================================
          HEADER
      ================================================================ */}
      <Text style={styles.header}>Badges</Text>
      <Image
        source={require("../../assets/images/badges_tab.png")}
        style={styles.headerIcon}
      />

      {/* ================================================================
          BATTLE BUDDIES — COLLAPSIBLE
      ================================================================ */}
      <TouchableOpacity
        style={styles.wingmenHeader}
        onPress={() => setWingmenOpen(!wingmenOpen)}
      >
        <Text style={styles.wingmenTitle}>Battle Buddies</Text>
        <Text style={styles.wingmenChevron}>{wingmenOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {wingmenOpen && (
        <View style={styles.wingmenContent}>
          <Text style={styles.inputLabel}>Add a Buddy (Public ID)</Text>

          <TextInput
            placeholder="Enter Public ID"
            value={friendInput}
            onChangeText={setFriendInput}
            style={styles.friendInput}
          />

          <TouchableOpacity
            onPress={handleAddFriend}
            style={styles.addFriendBtn}
            disabled={addingFriend}
          >
            <Text style={styles.addFriendText}>
              {addingFriend ? "Adding..." : "Add Buddy"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.friendListTitle}>Your Buddies:</Text>

          {loadingFriends ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : friends.length === 0 ? (
            <Text style={styles.loadingText}>None yet.</Text>
          ) : (
            friends.map((f) => (
              <View key={f.id} style={styles.friendRow}>
                <View>
                  <Text style={styles.friendName}>
                    {f.friend_first} {f.friend_last}
                  </Text>
                  <Text style={styles.friendId}>{f.friend_public_id}</Text>
                </View>

                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleSelectWingman(f.friend_public_id)}
                >
                  <Text style={styles.copyText}>Send</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {/* ================================================================
          BADGE CATALOG — floating icons, tap to zoom, long press to send
      ================================================================ */}
      <View style={styles.catalogContainer}>
        {badgeCatalog.map((group, gIdx) => (
          <View key={`catalog-${gIdx}`} style={styles.catalogSection}>
            <Text style={styles.catalogTitle}>{group.category}</Text>

            <View style={styles.catalogRow}>
              {group.icons.map((icon, iIdx) => (
                <TouchableOpacity
                  key={`catalog-icon-${gIdx}-${iIdx}`}
                  activeOpacity={0.8}
                  onPress={() => {
                    setZoomedIcon(icon);
                    setZoomVisible(true);
                  }}
                  onLongPress={() => {
                    setSelectedBadge({
                      category: group.category,
                      badge_type: group.category,
                      iconIndex: iIdx,
                      icon,
                    });
                    setRecipientId("");
                    setSendModalVisible(true);
                  }}
                >
                  <View style={styles.catalogFloatingIconWrap}>
                    <Image source={icon} style={styles.catalogIcon} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* ================================================================
          RECEIVED BADGES — EXPANDABLE LOCKBOX
      ================================================================ */}
      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => {
          receivedScale.value = withTiming(1.12, { duration: 130 }, () =>
            (receivedScale.value = withTiming(1, { duration: 130 }))
          );
          setShowReceivedBox(!showReceivedBox);
        }}
      >
        <Animated.View style={{ transform: [{ scale: receivedScale.value }] }}>
          <Image
            source={require("../../assets/badges/received_badges.png")}
            style={styles.lockbox}
          />
        </Animated.View>
      </TouchableOpacity>

      {showReceivedBox && (
        <View style={styles.groupGrid}>
          {Object.keys(groupedReceived).length === 0 ? (
            <Text style={styles.noReceived}>No badges received yet.</Text>
          ) : (
            Object.entries(groupedReceived).map(([key, items]) => {
              const [rawType, rawVar] = key.split("__");
              const variantIndex = parseInt(rawVar);

              const catalogGroup = badgeCatalog.find(
                (g) => g.category === rawType
              );

              const icon =
                catalogGroup?.icons[variantIndex] ||
                require("../../assets/badges/FistBumpArmor.png");

              const badgeTitle = catalogGroup?.category || rawType;
              const isOpen = openReceivedGroups[key];

              return (
                <View key={`received-${key}`} style={styles.groupCard}>
                  <TouchableOpacity
                    onPress={() =>
                      setOpenReceivedGroups((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  >
                    <View style={styles.groupHeader}>
                      <Image source={icon} style={styles.groupIcon} />
                      <Text style={styles.groupTitle}>
                        {badgeTitle} ({items.length})
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.expandedList}>
                      {items.map((b, idx) => {
                        const senderName =
                          b.sender_first_name
                            ? `${b.sender_first_name} ${b.sender_last_name}`
                            : b.sender_public_id?.slice(0, 8);

                        return (
                          <TouchableOpacity
                            key={`entry-${key}-${idx}`}
                            onPress={() => {
                              setZoomedIcon(icon);
                              setZoomVisible(true);
                            }}
                          >
                            <View style={styles.entryCard}>
                              <Image source={icon} style={styles.entryIcon} />

                              <View style={styles.entryTextCard}>
                                <Text style={styles.entryTitle}>
                                  From {senderName}
                                </Text>
                                <Text style={styles.entrySub}>
                                  {new Date(
                                    b.created_at
                                  ).toLocaleDateString()}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ================================================================
          SENT BADGES — EXPANDABLE LOCKBOX
      ================================================================ */}
      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => {
          sentScale.value = withTiming(1.12, { duration: 130 }, () =>
            (sentScale.value = withTiming(1, { duration: 130 }))
          );
          setShowSentBox(!showSentBox);
        }}
      >
        <Animated.View style={{ transform: [{ scale: sentScale.value }] }}>
          <Image
            source={require("../../assets/badges/sent_badges.png")}
            style={styles.lockbox}
          />
        </Animated.View>
      </TouchableOpacity>

      {showSentBox && (
        <View style={styles.groupGrid}>
          {Object.entries(groupedSent).map(([key, items]) => {
            const [rawType, rawVar] = key.split("__");
            const variantIndex = parseInt(rawVar);

            const catalogGroup = badgeCatalog.find(
              (g) => g.category === rawType
            );

            const icon =
              catalogGroup?.icons[variantIndex] ||
              require("../../assets/badges/FistBumpArmor.png");

            const badgeTitle = catalogGroup?.category || rawType;
            const isOpen = openSentGroups[key];

            return (
              <View key={`sent-${key}`} style={styles.groupCard}>
                <TouchableOpacity
                  onPress={() =>
                    setOpenSentGroups((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                >
                  <View style={styles.groupHeader}>
                    <Image source={icon} style={styles.groupIcon} />
                    <Text style={styles.groupTitle}>
                      {badgeTitle} ({items.length})
                    </Text>
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.expandedList}>
                    {items.map((b, idx) => {
                      const recName =
                        b.recipient_first_name
                          ? `${b.recipient_first_name} ${b.recipient_last_name}`
                          : b.recipient_public_id?.slice(0, 8);

                      return (
                        <TouchableOpacity
                          key={`sent-${key}-${idx}`}
                          onPress={() => {
                            setZoomedIcon(icon);
                            setZoomVisible(true);
                          }}
                        >
                          <View style={styles.entryCard}>
                            <Image source={icon} style={styles.entryIcon} />

                            <View style={styles.entryTextCard}>
                              <Text style={styles.entryTitle}>
                                To {recName}
                              </Text>
                              <Text style={styles.entrySub}>
                                {new Date(
                                  b.created_at
                                ).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
      {/* ================================================================
          ZOOM MODAL — TAP ANYTHING TO CLOSE
      ================================================================ */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.zoomWrap}
          activeOpacity={1}
          onPressOut={() => {
            setZoomVisible(false);
            setZoomedIcon(null);
          }}
        >
          <View style={styles.zoomBox}>
            {zoomedIcon && (
              <Image
                source={zoomedIcon}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================================================================
          SEND BADGE MODAL — LONG PRESS FROM CATALOG OR SEND BUTTON
      ================================================================ */}
      <Modal visible={sendModalVisible} transparent animationType="fade">
        <View style={styles.sendModalWrap}>
          <View style={styles.sendModalBox}>
            <Text style={styles.sendModalTitle}>Send a Badge</Text>

            {/* RECIPIENT */}
            <Text style={styles.inputLabelSmall}>Recipient Public ID</Text>
            <TextInput
              placeholder="Enter Public ID"
              style={styles.sendModalInput}
              value={recipientId}
              onChangeText={setRecipientId}
            />

            {/* CHANGE BADGE OPTION */}
            <TouchableOpacity
              style={styles.chooseBadgeBtn}
              onPress={() => {
                setSendModalVisible(false);
                setSelectedBadge(null);
              }}
            >
              <Text style={styles.chooseBadgeText}>
                {selectedBadge ? "Change Badge" : "Choose Badge"}
              </Text>
            </TouchableOpacity>

            {/* PREVIEW */}
            {selectedBadge && (
              <View style={{ alignItems: "center", marginTop: 10 }}>
                <Image
                  source={selectedBadge.icon}
                  style={{ width: 90, height: 90 }}
                />
                <Text style={styles.previewLabel}>
                  {selectedBadge.category}
                </Text>
              </View>
            )}

            {/* SEND BUTTON */}
            <TouchableOpacity
              style={styles.sendConfirmBtn}
              onPress={async () => {
                if (!profile?.public_id)
                  return Alert.alert("Wait", "Profile not loaded.");

                if (!recipientId.trim())
                  return Alert.alert("Missing ID", "Enter a recipient ID.");

                if (!selectedBadge)
                  return Alert.alert(
                    "Pick Badge",
                    "Choose a badge first."
                  );

                if (state.coins < 5)
                  return Alert.alert(
                    "Not enough coins",
                    "You need more coins!"
                  );

                const { error } = await supabase
                  .from("badge_transactions")
                  .insert({
                    sender_public_id: profile.public_id,
                    recipient_public_id: recipientId.trim(),
                    badge_type: selectedBadge.category,
                    badge_variant: selectedBadge.iconIndex,
                    timestamp: new Date().toISOString(),
                  });

                if (error) return Alert.alert("Error", error.message);

                spendCoins(5);

                setSendModalVisible(false);
                setSelectedBadge(null);
                Alert.alert("Sent!", "Your badge is on its way.");
              }}
            >
              <Text style={styles.sendConfirmText}>Send (5 coins)</Text>
            </TouchableOpacity>

            {/* CANCEL */}
            <TouchableOpacity
              onPress={() => {
                setSendModalVisible(false);
                setSelectedBadge(null);
              }}
              style={{ marginTop: 10 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================================
          BADGE PICKER MODAL (kept as placeholder if needed)
      ================================================================ */}
      <BadgePickerModal
        visible={false}
        onClose={() => {}}
        onSelect={() => {}}
      />

    </ScrollView>
  </ParchmentScreen>
);
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    alignItems: "center",
    width: "100%",
  },

  header: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 34,
    color: "#2e2618",
    marginBottom: 6,
    textAlign: "center",
  },

  headerIcon: {
    width: 90,
    height: 90,
    marginBottom: 20,
    alignSelf: "center",
  },

  // ========================================================================
  // BATTLE BUDDIES
  // ========================================================================
  wingmenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: "#e8d7b1",
    borderWidth: 2,
    borderColor: "#4b3a25",
    borderRadius: 14,
    width: "88%",
    marginTop: 10,
    marginBottom: 10,
  },

  wingmenTitle: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 24,
    color: "#4b3a25",
  },

  wingmenChevron: {
    fontSize: 20,
    color: "#4b3a25",
  },

  wingmenContent: {
    width: "88%",
    backgroundColor: "#fff8e6",
    borderWidth: 2,
    borderColor: "#4b3a25",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  inputLabel: {
    fontFamily: "Lora-Bold",
    fontSize: 15,
    color: "#4b3a25",
    marginBottom: 6,
  },

  friendInput: {
    borderWidth: 1,
    borderColor: "#4b3a25",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "white",
    marginBottom: 10,
    fontFamily: "Lora-Regular",
  },

  addFriendBtn: {
    backgroundColor: "#a78a57",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },

  addFriendText: {
    color: "white",
    fontFamily: "Lora-Bold",
    fontSize: 16,
  },

  friendListTitle: {
    fontFamily: "Ringbearer-Regular",
    color: "#4b3a25",
    fontSize: 18,
    marginBottom: 8,
    marginTop: 5,
  },

  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4b3a25",
    marginBottom: 8,
  },

  friendName: {
    fontFamily: "Lora-Regular",
    fontSize: 16,
    color: "#4b3a25",
  },

  friendId: {
    fontFamily: "Lora-Italic",
    fontSize: 14,
    color: "#6b2b34",
  },

  copyBtn: {
    backgroundColor: "#4b3a25",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "center",
  },

  copyText: {
    color: "white",
    fontFamily: "Lora-Bold",
  },

  // ========================================================================
  // CATALOG
  // ========================================================================
  catalogContainer: {
    width: "88%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  catalogSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },

  catalogTitle: {
    fontFamily: "Lora-Bold",
    fontSize: 20,
    color: "#4b3a25",
    textAlign: "center",
    marginBottom: 12,
  },

  catalogRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  catalogFloatingIconWrap: {
    alignItems: "center",
    margin: 10,
  },

  catalogIcon: {
    width: 120,
    height: 120,
  },

  // ========================================================================
  // RECEIVED / SENT
  // ========================================================================
  lockbox: {
    width: 170,
    height: 170,
    alignSelf: "center",
  },

  groupGrid: {
    width: "100%",
    alignItems: "center",
  },

  groupCard: {
    width: "100%",
    alignItems: "center",
    marginVertical: 12,
  },

  groupHeader: {
    alignItems: "center",
    marginBottom: 6,
  },

  groupIcon: {
    width: 104,
    height: 104,
    marginBottom: 6,
  },

  groupTitle: {
    fontFamily: "Lora-Regular",
    fontSize: 17,
    color: "#4b2e10",
    textAlign: "center",
  },

  expandedList: {
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },

  entryCard: {
    alignItems: "center",
    marginBottom: 20,
  },

  entryIcon: {
    width: 90,
    height: 90,
    marginBottom: 6,
  },

  entryTextCard: {
    width: "88%",
    padding: 10,
    backgroundColor: "rgba(255,255,240,0.92)",
    borderWidth: 2,
    borderColor: "#b48a4a",
    borderRadius: 10,
    alignItems: "center",
  },

  entryTitle: {
    fontFamily: "Lora-Regular",
    fontSize: 14,
    color: "#4b2e10",
  },

  entrySub: {
    fontFamily: "Lora-Italic",
    fontSize: 12,
    color: "#6b2b34",
  },

  noReceived: {
    fontFamily: "Lora-Italic",
    color: "#4b2e10",
    fontSize: 14,
    marginTop: 10,
  },

  // ========================================================================
  // ZOOM MODAL
  // ========================================================================
  zoomWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  zoomBox: {
    width: "90%",
    height: "66%",
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },

  zoomImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },

  // ========================================================================
  // SEND MODAL
  // ========================================================================
  sendModalWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  sendModalBox: {
    width: "86%",
    backgroundColor: "#fff8e6",
    padding: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#4b3a25",
    alignItems: "center",
  },

  sendModalTitle: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 22,
    color: "#4b3a25",
    marginBottom: 8,
  },

  inputLabelSmall: {
    fontFamily: "Lora-Bold",
    fontSize: 14,
    color: "#4b3a25",
    alignSelf: "flex-start",
    marginBottom: 4,
  },

  sendModalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#4b3a25",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "white",
    marginBottom: 10,
    fontFamily: "Lora-Regular",
  },

  chooseBadgeBtn: {
    backgroundColor: "#4b2e10",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 6,
  },

  chooseBadgeText: {
    color: "white",
    fontFamily: "Lora-Bold",
    fontSize: 15,
  },

  previewLabel: {
    fontFamily: "Lora-Italic",
    color: "#4b3a25",
    fontSize: 14,
    marginTop: 4,
  },

  sendConfirmBtn: {
    backgroundColor: "#a78a57",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
  },

  sendConfirmText: {
    color: "white",
    fontFamily: "Lora-Bold",
    fontSize: 16,
  },

  cancelText: {
    color: "#6b2b34",
    fontFamily: "Lora-Regular",
    marginTop: 10,
    fontSize: 15,
  },
});

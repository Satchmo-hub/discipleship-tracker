// app/(tabs)/badges.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { useStats } from "../../context/StatsContext";
import { useProfile } from "../../context/ProfileContext";
import { supabase } from "../../lib/supabase";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import ParchmentScreen from "../../components/ParchmentScreen";

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

export default function BadgesScreen() {
  const { state, spendCoins } = useStats();
  const { profile } = useProfile();
  const userPublicId = profile?.public_id;

  const [recipientId, setRecipientId] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomedIcon, setZoomedIcon] = useState<any>(null);

  const [showReceivedBox, setShowReceivedBox] = useState(false);
  const [showSentBox, setShowSentBox] = useState(false);

  const [openReceivedGroups, setOpenReceivedGroups] = useState<any>({});
  const [openSentGroups, setOpenSentGroups] = useState<any>({});

  const receivedScale = useSharedValue(1);
  const sentScale = useSharedValue(1);

  const animReceived = useAnimatedStyle(() => ({
    transform: [{ scale: receivedScale.value }],
  }));
  const animSent = useAnimatedStyle(() => ({
    transform: [{ scale: sentScale.value }],
  }));

  const popOpen = (target: any) => {
    target.value = withTiming(1.14, { duration: 120 }, () =>
      (target.value = withTiming(1, { duration: 120 }))
    );
  };

  useEffect(() => {
    if (profile?.public_id && !recipientId) {
      setRecipientId(profile.public_id);
    }
  }, [profile?.public_id]);

  const [received, setReceived] = useState<any[]>([]);
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

  const [sent, setSent] = useState<any[]>([]);
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

  const mergedReceived = useMemo(() => {
    const merged = [
      ...received,
      ...sent.filter((b) => b.recipient_public_id === userPublicId),
    ];
    return merged.filter(
      (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i
    );
  }, [received, sent, userPublicId]);

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

  const handleSend = async () => {
    if (!profile?.public_id)
      return Alert.alert("Please wait", "Profile loading.");
    if (state.coins < 5)
      return Alert.alert("💰 Not enough coins", "Earn coins by streaks!");
    if (!recipientId.trim())
      return Alert.alert("Missing recipient ID");
    if (!selectedBadge)
      return Alert.alert("Select a badge first.");

    const { error } = await supabase.from("badge_transactions").insert({
      sender_public_id: profile.public_id,
      recipient_public_id: recipientId.trim(),
      badge_type: selectedBadge.category,
      badge_variant: selectedBadge.iconIndex,
      timestamp: new Date().toISOString(),
    });

    if (error) return Alert.alert("Error", error.message);

    spendCoins(5);
    setModalVisible(false);
    setSelectedBadge(null);

    Alert.alert("Sent!", `You sent a ${selectedBadge.category}!`);
  };

  return (
    <ParchmentScreen safeTopPadding>
      <View style={styles.container}>
        <Text style={styles.header}>Badges</Text>

        <Image
          source={require("../../assets/images/badges_tab.png")}
          style={styles.headerIcon}
        />

        {badgeCatalog.map((group, gIdx) => (
          <View key={`catalog-${gIdx}`} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.category}</Text>

            <View style={styles.badgeRow}>
              {group.icons.map((icon, iIdx) => (
                <TouchableOpacity
                  key={`catalog-icon-${gIdx}-${iIdx}`}
                  onPress={() => {
                    setZoomedIcon(icon);
                    setZoomVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.badgeCard}>
                    <Image source={icon} style={styles.badgeIcon} />

                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        !profile?.public_id && { opacity: 0.5 },
                      ]}
                      disabled={!profile?.public_id}
                      onPress={() => {
                        setSelectedBadge({
                          category: group.category,
                          iconIndex: iIdx,
                        });
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.sendText}>
                        {profile?.public_id ? "Send (5 coins)" : "Loading..."}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => {
            popOpen(receivedScale);
            setShowReceivedBox(!showReceivedBox);
          }}
        >
          <Animated.View style={animReceived}>
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

                const badgeTitle =
                  catalogGroup?.category || rawType || "Badge";

                const open = openReceivedGroups[key];

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

                        <View style={styles.groupTextCard}>
                          <Text style={styles.groupTitle}>{badgeTitle}</Text>
                          <Text style={styles.groupCount}>
                            ({items.length} total)
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {open && (
                      <View style={styles.expandedList}>
                        {items.map((b, idx) => {
                          const senderName = b.sender_first_name
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

        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => {
            popOpen(sentScale);
            setShowSentBox(!showSentBox);
          }}
        >
          <Animated.View style={animSent}>
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

              const badgeTitle =
                catalogGroup?.category || rawType || "Badge";

              const open = openSentGroups[key];

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

                      <View style={styles.groupTextCard}>
                        <Text style={styles.groupTitle}>{badgeTitle}</Text>
                        <Text style={styles.groupCount}>
                          ({items.length} total)
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {open && (
                    <View style={styles.expandedList}>
                      {items.map((b, idx) => {
                        const recName = b.recipient_first_name
                          ? `${b.recipient_first_name} ${b.recipient_last_name}`
                          : b.recipient_public_id?.slice(0, 8);

                        return (
                          <TouchableOpacity
                            key={`sent-entry-${key}-${idx}`}
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
      </View>

      {/* ZOOM MODAL */}
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

      {/* SEND MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            {selectedBadge ? (
              <>
                <Text style={styles.modalTitle}>
                  Send {selectedBadge.category}
                </Text>

                <TextInput
                  placeholder="Enter recipient ID"
                  style={styles.input}
                  value={recipientId}
                  onChangeText={setRecipientId}
                />

                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                >
                  <Text style={styles.sendText}>Confirm Send</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.modalTitle}>
                Please select a badge first.
              </Text>
            )}

            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSelectedBadge(null);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ParchmentScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },

  header: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 34,
    color: "#2e2618",
    marginBottom: 6,
    marginTop: 10,
    textAlign: "center",
  },

  headerIcon: {
    width: 90,
    height: 90,
    marginBottom: 16,
    alignSelf: "center",
  },

  section: { marginVertical: 12, alignItems: "center", width: "100%" },

  sectionTitle: {
    fontFamily: "Lora-Regular",
    fontSize: 20,
    color: "#2e2618",
    marginBottom: 8,
    textAlign: "center",
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  badgeCard: {
    alignItems: "center",
    margin: 8,
    padding: 10,
  },

  /** ⭐ CATALOG BADGES — increased 15% */
  badgeIcon: {
    width: 120,   // was 104
    height: 120,  // was 104
    borderRadius: 10,
  },

  sendButton: {
    backgroundColor: "#4b2e10",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },

  sendText: {
    color: "#fff",
    fontFamily: "Lora-MediumItalic",
  },

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
  },

  /** ⭐ GROUP HEADER ICON — increased 15% */
  groupIcon: {
    width: 104,  // was 90
    height: 104, // was 90
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  groupTextCard: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,240,0.92)",
    borderWidth: 2,
    borderColor: "#b48a4a",
    borderRadius: 10,
    alignItems: "center",
    minWidth: "68%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },

  groupTitle: {
    fontFamily: "Lora-Regular",
    fontSize: 17,
    color: "#4b2e10",
  },

  groupCount: {
    fontFamily: "Lora-Italic",
    fontSize: 14,
    color: "#6b2b34",
    marginTop: 2,
  },

  expandedList: {
    marginTop: 12,
    width: "100%",
    alignItems: "center",
  },

  entryCard: {
    alignItems: "center",
    marginBottom: 20,
  },

  /** ⭐ ENTRY ICON — increased 15% */
  entryIcon: {
    width: 90,   // was 78
    height: 90,  // was 78
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  entryTextCard: {
    width: "88%",
    padding: 10,
    backgroundColor: "rgba(255,255,240,0.92)",
    borderWidth: 2,
    borderColor: "#b48a4a",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  entryTitle: {
    fontFamily: "Lora-Regular",
    color: "#4b2e10",
    fontSize: 14,
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

  modalWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: "#2e2618",
    fontFamily: "Lora-Regular",
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#4b2e10",
    borderRadius: 8,
    width: "100%",
    padding: 8,
    marginBottom: 10,
  },

  cancelText: {
    color: "#6b2b34",
    fontFamily: "Lora-Regular",
    marginTop: 8,
  },

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
});

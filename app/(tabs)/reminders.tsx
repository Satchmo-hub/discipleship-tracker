// ============================================================================
// REMINDERS SCREEN — CLEAN REBUILD WITH GOD MODE BADGE SENDING
// • Messages + Invitations
// • Teacher Tools with: Message / Invitation / Send Badge
// • God Mode: Sends badges to ANY student at Century
// • Badge picker + student picker modals
// • Unread logic + realtime subscriptions
// • No badge history accidentally merged in
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import MessageScroll from "../../components/MessageScroll";
import ParchmentScreen from "../../components/ParchmentScreen";
import { useProfile } from "../../context/ProfileContext";
import { useToast } from "../../context/ToastContext";
import { useUnread } from "../../context/UnreadContext";
import { supabase } from "../../supabase/client";

// ============================================================================
// CONSTANTS
// ============================================================================
const READ_ANNOUNCEMENTS_KEY = "dt.readAnnouncements.v1";
const READ_INVITATIONS_KEY = "dt.readInvitations.v1";

const MR_C_UUID = "ad32f222-6f49-4ec9-884a-2ba66afd8336";

// Your school UUID for Century High School
const CENTURY_UUID = "e1a3fa70-0fb1-4f2c-84bb-45ff4b462b50";

// ============================================================================
// BADGE CATALOG — same as badges screen
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
// TYPES
// ============================================================================
type Announcement = {
  id: number;
  teacher_id: string | null;
  class_hour_id: number | null;
  title: string;
  message: string;
  created_at: string | null;
};

type Invitation = Announcement;

type Teacher = { id: string; name: string };
type ClassHour = { id: number; class_name: string };
type Grade = { id: number; name: string };

type Student = {
  uuid: string;
  public_id: string;
  first_name: string | null;
  last_name: string | null;
  grade_id: number | null;
  class_hour_id: number | null;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function RemindersScreen() {
  const { profile } = useProfile();
  const { showToast } = useToast();
  const { markMessagesRead } = useUnread();

  // Is teacher? (God mode too)
  const isTeacher =
    profile?.uuid === MR_C_UUID ||
    !!profile?.teacher_id ||
    profile?.teacher_code === "GODmode-2025";

  // ========================================================================
  // STUDENT STATE
  // ========================================================================
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<number[]>([]);
  const [readInvitationIds, setReadInvitationIds] = useState<number[]>([]);

  // ========================================================================
  // TEACHER TOOL STATE
  // ========================================================================
  const [toolsOpen, setToolsOpen] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classHours, setClassHours] = useState<ClassHour[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [sendMode, setSendMode] = useState<"message" | "invitation" | "badge">(
    "message"
  );

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );

  const [audienceType, setAudienceType] = useState<
    "all" | "class_hour" | "grade"
  >("all");

  const [selectedClassHour, setSelectedClassHour] = useState<number | null>(
    null
  );

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const [titleInput, setTitleInput] = useState("");
  const [messageInput, setMessageInput] = useState("");

  // ========================================================================
  // BADGE SEND STATE
  // ========================================================================
  const [students, setStudents] = useState<Student[]>([]);
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);
  const [badgePickerVisible, setBadgePickerVisible] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [selectedBadge, setSelectedBadge] = useState<{
    groupIdx: number;
    iconIdx: number;
  } | null>(null);

  // Coins modal
  const [coinsModal, setCoinsModal] = useState(false);
  const [addCoinsAmount, setAddCoinsAmount] = useState("");
  const [setCoinsAmount, setSetCoinsAmount] = useState("");

  // ========================================================================
  // CLEAR UNREAD WHEN ENTERING SCREEN
  // ========================================================================
  useEffect(() => {
    markMessagesRead();
  }, []);

  // ========================================================================
  // LOAD TEACHER TOOLS (teachers, classHours, grades)
  // ========================================================================
  useEffect(() => {
    (async () => {
      try {
        const { data: teacherRows } = await supabase
          .from("teachers")
          .select("id, name")
          .order("name");
        if (teacherRows) setTeachers(teacherRows);

        const { data: classRows } = await supabase
          .from("class_hours")
          .select("id, class_name")
          .order("class_name");
        if (classRows) setClassHours(classRows);

        const { data: gradeRows } = await supabase
          .from("grades")
          .select("id, name")
          .order("id");
        if (gradeRows) setGrades(gradeRows);
      } catch (err) {
        console.error("Teacher tools load failed:", err);
      }
    })();
  }, []);

  // ========================================================================
  // LOAD STUDENTS FOR GOD MODE
  // ========================================================================
  useEffect(() => {
    if (!isTeacher) return;

    (async () => {
      try {
        // GOD MODE → load ALL Century students
        if (profile?.uuid === MR_C_UUID) {
          const { data } = await supabase
            .from("profiles")
            .select("uuid, public_id, first_name, last_name, grade_id, class_hour_id")
            .eq("school_id", CENTURY_UUID)
            .order("last_name");

          if (data) setStudents(data);
          return;
        }

        // NORMAL TEACHERS → only their classes
        if (profile?.teacher_id) {
          const { data: classRows } = await supabase
            .from("class_hours")
            .select("id")
            .eq("teacher_id", profile.teacher_id);

          if (!classRows || classRows.length === 0) {
            setStudents([]);
            return;
          }

          const classIds = classRows.map((c) => c.id);

          const { data: stuRows } = await supabase
            .from("profiles")
            .select("uuid, public_id, first_name, last_name, grade_id, class_hour_id")
            .in("class_hour_id", classIds)
            .order("last_name");

          if (stuRows) setStudents(stuRows);
        }
      } catch (err) {
        console.error("Load students failed:", err);
      }
    })();
  }, [profile?.teacher_id, isTeacher]);

  // ========================================================================
  // LOAD READ STATUS
  // ========================================================================
  useEffect(() => {
    (async () => {
      try {
        const annRaw = await AsyncStorage.getItem(READ_ANNOUNCEMENTS_KEY);
        const invRaw = await AsyncStorage.getItem(READ_INVITATIONS_KEY);

        if (annRaw) setReadAnnouncementIds(JSON.parse(annRaw));
        if (invRaw) setReadInvitationIds(JSON.parse(invRaw));
      } catch (err) {
        console.error("Read status load failed:", err);
      }
    })();
  }, []);

  // ========================================================================
  // LOAD ANNOUNCEMENTS + INVITATIONS
  // ========================================================================
  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("dt_announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  };

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from("dt_invitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInvitations(data);
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchInvitations();
  }, []);
  // ========================================================================
  // READ HANDLERS
  // ========================================================================
  const markAnnouncementRead = (id: number) => {
    if (!readAnnouncementIds.includes(id)) {
      const updated = [...readAnnouncementIds, id];
      setReadAnnouncementIds(updated);
      AsyncStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
    }
  };

  const markInvitationRead = (id: number) => {
    if (!readInvitationIds.includes(id)) {
      const updated = [...readInvitationIds, id];
      setReadInvitationIds(updated);
      AsyncStorage.setItem(READ_INVITATIONS_KEY, JSON.stringify(updated));
    }
  };

  // ========================================================================
  // REALTIME — ANNOUNCEMENTS & INVITATIONS
  // ========================================================================
  useEffect(() => {
    const annChan = supabase
      .channel("dt_announcements_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", table: "dt_announcements", schema: "public" },
        (payload) => {
          setAnnouncements((prev) => [payload.new, ...prev]);
          showToast("New message received");
        }
      )
      .subscribe();

    const invChan = supabase
      .channel("dt_invitations_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", table: "dt_invitations", schema: "public" },
        (payload) => {
          setInvitations((prev) => [payload.new, ...prev]);
          showToast("New invitation received");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(annChan);
      supabase.removeChannel(invChan);
    };
  }, []);

  // ========================================================================
  // DELETE HANDLERS
  // ========================================================================
  const deleteAnnouncement = async (id: number) => {
    const { error } = await supabase
      .from("dt_announcements")
      .delete()
      .eq("id", id);

    if (!error) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      showToast("Message deleted");
    } else showToast("Delete failed");
  };

  const deleteInvitation = async (id: number) => {
    const { error } = await supabase
      .from("dt_invitations")
      .delete()
      .eq("id", id);

    if (!error) {
      setInvitations((prev) => prev.filter((a) => a.id !== id));
      showToast("Invitation deleted");
    } else showToast("Delete failed");
  };

  // ========================================================================
  // SEND MESSAGE / INVITATION
  // ========================================================================
  const handleSendMessageOrInvitation = async () => {
    if (!selectedTeacherId) return showToast("Select a teacher");
    if (!titleInput.trim() || !messageInput.trim())
      return showToast("Title + message required");

    const table =
      sendMode === "message" ? "dt_announcements" : "dt_invitations";

    const payload: any = {
      teacher_id: selectedTeacherId,
      title: titleInput.trim(),
      message: messageInput.trim(),
      created_at: new Date().toISOString(),
      target_type: audienceType,
      class_hour_id: null,
      target_grade_id: null,
    };

    if (audienceType === "class_hour") {
      payload.class_hour_id = selectedClassHour;
    } else if (audienceType === "grade") {
      payload.target_grade_id = selectedGrade;
    }

    const { error } = await supabase.from(table).insert(payload);

    if (error) {
      console.error(error);
      return showToast("Failed to send");
    }

    showToast("Sent!");
    setTitleInput("");
    setMessageInput("");
    fetchAnnouncements();
    fetchInvitations();
  };

  // ========================================================================
  // SEND BADGE (GOD MODE)
  // ========================================================================
  const sendBadge = async () => {
    if (!profile?.public_id) return showToast("Profile not loaded");
    if (!selectedStudent) return showToast("No student selected");
    if (!selectedBadge) return showToast("Choose a badge");

    const badgeGroup = badgeCatalog[selectedBadge.groupIdx];
    const badgeType = badgeGroup.id;
    const variantIndex = selectedBadge.iconIdx;

    const { error } = await supabase.from("badge_transactions").insert({
      sender_public_id: profile.public_id,
      recipient_public_id: selectedStudent.public_id,
      badge_type: badgeType,
      badge_variant: variantIndex,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error(error);
      return showToast("Failed to send badge");
    }

    showToast("Badge sent!");
    setBadgePickerVisible(false);
    setStudentPickerVisible(false);
    setSelectedStudent(null);
    setSelectedBadge(null);
  };

  // ========================================================================
  // COIN OPERATIONS
  // ========================================================================
  const handleAddCoins = async () => {
    if (!addCoinsAmount.trim()) return showToast("Enter amount");
    const amount = parseInt(addCoinsAmount);
    if (isNaN(amount)) return showToast("Invalid number");

    const { error } = await supabase
      .from("profiles")
      .update({ coins: (profile?.coins ?? 0) + amount })
      .eq("uuid", profile.uuid);

    if (error) return showToast("Failed");

    showToast("Coins added!");
    setAddCoinsAmount("");
    setCoinsModal(false);
  };

  const handleSetCoins = async () => {
    if (!setCoinsAmount.trim()) return showToast("Enter total");
    const total = parseInt(setCoinsAmount);
    if (isNaN(total)) return showToast("Invalid number");

    const { error } = await supabase
      .from("profiles")
      .update({ coins: total })
      .eq("uuid", profile.uuid);

    if (error) return showToast("Failed");

    showToast("Coins updated!");
    setSetCoinsAmount("");
    setCoinsModal(false);
  };

  // ========================================================================
  // RENDER START
  // ========================================================================
  return (
    <ParchmentScreen>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Reminders</Text>

        <Image
          source={require("../../assets/images/reminders.png")}
          style={styles.remindersIcon}
        />

        {/* ============================================================
            TEACHER TOOLS
        ============================================================ */}
        {isTeacher && (
          <TeacherTools
            toolsOpen={toolsOpen}
            setToolsOpen={setToolsOpen}
            teachers={teachers}
            classHours={classHours}
            grades={grades}
            selectedTeacherId={selectedTeacherId}
            setSelectedTeacherId={setSelectedTeacherId}
            sendMode={sendMode}
            setSendMode={setSendMode}
            audienceType={audienceType}
            setAudienceType={setAudienceType}
            selectedClassHour={selectedClassHour}
            setSelectedClassHour={setSelectedClassHour}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            titleInput={titleInput}
            setTitleInput={setTitleInput}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            handleSendMessageOrInvitation={handleSendMessageOrInvitation}
            coinsModal={coinsModal}
            setCoinsModal={setCoinsModal}
            addCoinsAmount={addCoinsAmount}
            setAddCoinsAmount={setAddCoinsAmount}
            setCoinsAmount={setCoinsAmount}
            handleAddCoins={handleAddCoins}
            handleSetCoins={handleSetCoins}
            // Badge sending
            setStudentPickerVisible={setStudentPickerVisible}
            isGodMode={profile?.uuid === MR_C_UUID}
          />
        )}
        {/* ============================================================
            STUDENT PICKER MODAL — GOD MODE
        ============================================================ */}
        <Modal visible={studentPickerVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { maxHeight: "80%" }]}>
              <Text style={styles.modalTitle}>Select a Student</Text>

              <ScrollView style={{ width: "100%" }}>
                {students.map((stu) => (
                  <TouchableOpacity
                    key={stu.uuid}
                    style={styles.studentRow}
                    onPress={() => {
                      setSelectedStudent(stu);
                      setStudentPickerVisible(false);
                      setBadgePickerVisible(true);
                    }}
                  >
                    <Text style={styles.studentName}>
                      {stu.last_name}, {stu.first_name}
                    </Text>
                    <Text style={styles.studentDetails}>
                      Grade {stu.grade_id ?? "—"} • Period {stu.class_hour_id ?? "—"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setStudentPickerVisible(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ============================================================
            BADGE PICKER MODAL
        ============================================================ */}
        <Modal visible={badgePickerVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { maxHeight: "85%" }]}>
              <Text style={styles.modalTitle}>
                Send Badge to{" "}
                {selectedStudent
                  ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                  : ""}
              </Text>

              <ScrollView style={{ width: "100%" }}>
                {badgeCatalog.map((group, gIdx) => (
                  <View key={`group-${gIdx}`} style={{ marginBottom: 20 }}>
                    <Text style={styles.badgeCategory}>{group.category}</Text>

                    <View style={styles.badgeIconRow}>
                      {group.icons.map((icon, iIdx) => (
                        <TouchableOpacity
                          key={`badge-${gIdx}-${iIdx}`}
                          onPress={() => {
                            setSelectedBadge({ groupIdx: gIdx, iconIdx: iIdx });
                            sendBadge();
                          }}
                        >
                          <Image source={icon} style={styles.badgeIcon} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setBadgePickerVisible(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ============================================================
            INVITATIONS SECTION
        ============================================================ */}
        <Text style={styles.sectionTitle}>Invitations</Text>
        <View style={styles.section}>
          {invitations.length === 0 ? (
            <Text style={styles.emptyText}>No invitations yet.</Text>
          ) : (
            invitations.map((inv) => {
              const unread = !readInvitationIds.includes(inv.id);

              return (
                <View key={inv.id} style={{ width: "100%", alignItems: "center" }}>
                  <MessageScroll
                    title={inv.title}
                    message={inv.message}
                    timestamp={inv.created_at ?? ""}
                    isUnread={unread}
                    onOpen={() => markInvitationRead(inv.id)}
                  />

                  {!unread && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteInvitation(inv.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ============================================================
            MESSAGES SECTION
        ============================================================ */}
        <Text style={styles.sectionTitle}>Messages</Text>
        <View style={styles.section}>
          {announcements.length === 0 ? (
            <Text style={styles.emptyText}>No messages yet.</Text>
          ) : (
            announcements.map((a) => {
              const unread = !readAnnouncementIds.includes(a.id);

              return (
                <View key={a.id} style={{ width: "100%", alignItems: "center" }}>
                  <MessageScroll
                    title={a.title}
                    message={a.message}
                    timestamp={a.created_at ?? ""}
                    isUnread={unread}
                    onOpen={() => markAnnouncementRead(a.id)}
                  />

                  {!unread && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteAnnouncement(a.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ParchmentScreen>
  );
}

// ============================================================================
// TEACHER TOOLS COMPONENT — CLEANED & UPDATED FOR SEND BADGE MODE
// ============================================================================
function TeacherTools(props: any) {
  const {
    toolsOpen,
    setToolsOpen,
    teachers,
    classHours,
    grades,
    selectedTeacherId,
    setSelectedTeacherId,
    sendMode,
    setSendMode,
    audienceType,
    setAudienceType,
    selectedClassHour,
    setSelectedClassHour,
    selectedGrade,
    setSelectedGrade,
    titleInput,
    setTitleInput,
    messageInput,
    setMessageInput,
    handleSendMessageOrInvitation,
    coinsModal,
    setCoinsModal,
    addCoinsAmount,
    setAddCoinsAmount,
    setCoinsAmount,
    handleAddCoins,
    handleSetCoins,
    // GOD MODE
    setStudentPickerVisible,
    isGodMode,
  } = props;

  return (
    <View style={styles.teacherToolsContainer}>
      <TouchableOpacity
        style={styles.teacherToolsHeader}
        onPress={() => setToolsOpen(!toolsOpen)}
      >
        <Text style={styles.teacherToolsHeaderText}>Teacher Tools</Text>
        <Text style={styles.teacherToolsChevron}>{toolsOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {toolsOpen && (
        <View style={styles.teacherToolsContent}>

          {/* Coins Icon */}
          <Pressable onPress={() => setCoinsModal(true)}>
            <Image
              source={require("../../assets/images/coins.png")}
              style={styles.coinsIcon}
            />
          </Pressable>

          {/* SEND MODE TOGGLES */}
          <Text style={styles.toolLabel}>Action</Text>
          <View style={styles.toggleRow}>
            <SelectableToggle
              label="Message"
              active={sendMode === "message"}
              onPress={() => setSendMode("message")}
            />
            <SelectableToggle
              label="Invitation"
              active={sendMode === "invitation"}
              onPress={() => setSendMode("invitation")}
            />

            {/* GOD MODE BADGE BUTTON */}
            {isGodMode && (
              <SelectableToggle
                label="Send Badge"
                active={sendMode === "badge"}
                onPress={() => setSendMode("badge")}
              />
            )}
          </View>

          {/* TEACHER SELECTOR */}
          {(sendMode === "message" || sendMode === "invitation") && (
            <>
              <Text style={styles.toolLabel}>Select Instructor</Text>
              <View style={styles.dropdownBox}>
                <PickerLike
                  items={teachers.map((t) => ({
                    label: t.name,
                    value: t.id,
                    key: `teacher-${t.id}`,
                  }))}
                  value={selectedTeacherId}
                  onChange={setSelectedTeacherId}
                />
              </View>

              {/* Audience */}
              <Text style={styles.toolLabel}>Audience</Text>
              <View style={styles.toggleRow}>
                <SelectableToggle
                  label="All"
                  active={audienceType === "all"}
                  onPress={() => setAudienceType("all")}
                />
                <SelectableToggle
                  label="Class"
                  active={audienceType === "class_hour"}
                  onPress={() => setAudienceType("class_hour")}
                />
                <SelectableToggle
                  label="Grade"
                  active={audienceType === "grade"}
                  onPress={() => setAudienceType("grade")}
                />
              </View>

              {/* Class Selector */}
              {audienceType === "class_hour" && (
                <>
                  <Text style={styles.toolLabel}>Class Period</Text>
                  <View style={styles.dropdownBox}>
                    <PickerLike
                      items={classHours.map((c) => ({
                        label: c.class_name,
                        value: c.id,
                        key: `class-${c.id}`,
                      }))}
                      value={selectedClassHour}
                      onChange={setSelectedClassHour}
                    />
                  </View>
                </>
              )}

              {/* Grade Selector */}
              {audienceType === "grade" && (
                <>
                  <Text style={styles.toolLabel}>Grade</Text>
                  <View style={styles.dropdownBox}>
                    <PickerLike
                      items={grades.map((g) => ({
                        label: g.name,
                        value: g.id,
                        key: `grade-${g.id}`,
                      }))}
                      value={selectedGrade}
                      onChange={setSelectedGrade}
                    />
                  </View>
                </>
              )}

              {/* Title / Message */}
              <Text style={styles.toolLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={titleInput}
                onChangeText={setTitleInput}
              />

              <Text style={styles.toolLabel}>Message</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                multiline
                value={messageInput}
                onChangeText={setMessageInput}
              />

              {/* SEND BUTTON */}
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessageOrInvitation}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </>
          )}

          {/* GOD MODE BADGE BUTTON */}
          {sendMode === "badge" && isGodMode && (
            <>
              <Text style={styles.toolLabel}>Select Student</Text>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => setStudentPickerVisible(true)}
              >
                <Text style={styles.sendButtonText}>Choose Student</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}
// ============================================================================
// PICKER COMPONENT
// ============================================================================
function PickerLike({
  items,
  value,
  onChange,
}: {
  items: { label: string; value: any; key: string }[];
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <View style={pickerStyles.box}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            pickerStyles.item,
            value === item.value && pickerStyles.itemActive,
          ]}
          onPress={() => onChange(item.value)}
        >
          <Text
            style={[
              pickerStyles.itemLabel,
              value === item.value && pickerStyles.itemLabelActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================================================
// SELECTABLE TOGGLE
// ============================================================================
function SelectableToggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[toggleStyles.toggle, active && toggleStyles.toggleActive]}
      onPress={onPress}
    >
      <Text
        style={[
          toggleStyles.toggleText,
          active && toggleStyles.toggleTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// STYLES
// ============================================================================
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

  // Teacher Tools
  teacherToolsContainer: {
    width: "100%",
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "#4b3a25",
    borderRadius: 12,
    backgroundColor: "#f0e3c2",
  },

  teacherToolsHeader: {
    padding: 15,
    backgroundColor: "#d4c19b",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  teacherToolsHeaderText: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 24,
    color: "#4b3a25",
  },

  teacherToolsChevron: {
    fontSize: 22,
    color: "#4b3a25",
  },

  teacherToolsContent: {
    padding: 15,
  },

  toolLabel: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 18,
    color: "#4b3a25",
    marginTop: 20,
    marginBottom: 5,
  },

  dropdownBox: {
    borderWidth: 1,
    borderColor: "#4b3a25",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#fffaf1",
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#4b3a25",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fffaf1",
    fontFamily: "Lora-Regular",
  },

  sendButton: {
    marginTop: 25,
    backgroundColor: "#a78a57",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignSelf: "center",
  },

  sendButtonText: {
    color: "white",
    fontFamily: "Lora-Bold",
    fontSize: 18,
  },

  coinsIcon: {
    width: 70,
    height: 70,
    alignSelf: "center",
    marginBottom: 15,
  },

  // -------- MODALS ----------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: "#fffaf1",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "#4b3a25",
  },

  modalTitle: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 26,
    color: "#4b3a25",
    marginBottom: 20,
    textAlign: "center",
  },

  modalSectionLabel: {
    fontFamily: "Lora-Bold",
    fontSize: 16,
    marginTop: 10,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: "#4b3a25",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    marginTop: 5,
  },

  modalButton: {
    backgroundColor: "#a78a57",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },

  modalButtonText: {
    color: "white",
    fontFamily: "Lora-Bold",
    textAlign: "center",
    fontSize: 16,
  },

  modalClose: {
    alignSelf: "center",
    marginTop: 5,
  },

  modalCloseText: {
    color: "#4b3a25",
    fontFamily: "Lora-Bold",
    fontSize: 16,
  },

  // --------- DELETE BUTTON ----------
  deleteButton: {
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: "#b23b3b",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },

  deleteButtonText: {
    color: "white",
    fontFamily: "Lora-Bold",
    fontSize: 14,
  },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },

  // -------- STUDENT PICKER ROW ----------
  studentRow: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#d1c5aa",
  },

  studentName: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#4b3a25",
  },

  studentDetails: {
    fontFamily: "Lora-Regular",
    fontSize: 14,
    color: "#6a5a43",
  },

  // -------- BADGE PICKER ----------
  badgeCategory: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 22,
    marginBottom: 8,
    marginTop: 10,
    color: "#4b3a25",
  },

  badgeIconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
    marginBottom: 10,
  },

  badgeIcon: {
    width: 80,
    height: 80,
    margin: 4,
  },
});

// Picker styles
const pickerStyles = StyleSheet.create({
  box: {
    width: "100%",
  },

  item: {
    paddingVertical: 10,
  },

  itemActive: {
    backgroundColor: "#e8d9b7",
    borderRadius: 8,
  },

  itemLabel: {
    fontFamily: "Lora-Regular",
    fontSize: 16,
    color: "#4b3a25",
  },

  itemLabelActive: {
    fontFamily: "Lora-Bold",
    color: "#4b3a25",
  },
});

// Toggle styles
const toggleStyles = StyleSheet.create({
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#4b3a25",
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: "#fffaf1",
  },

  toggleActive: {
    backgroundColor: "#a78a57",
  },

  toggleText: {
    fontFamily: "Lora-Regular",
    color: "#4b3a25",
    fontSize: 16,
  },

  toggleTextActive: {
    color: "white",
    fontFamily: "Lora-Bold",
  },
});

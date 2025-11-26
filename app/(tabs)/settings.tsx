// app/(tabs)/settings.tsx
//-----------------------------------------------------------
// SETTINGS SCREEN — with class-hour dedupe fix
//-----------------------------------------------------------

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatePresence, MotiView } from "moti";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import ParchmentScreen from "../../components/ParchmentScreen";

import { useAvatar } from "../../context/AvatarContext";
import { useProfile } from "../../context/ProfileContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../supabase/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PORTRAIT_RATIO = 1.35;

/* ============================
   AVATAR OPTIONS
============================ */
const avatarOptions = {
  DT_SteamPunkMale: require("../../assets/avatars/DT_SteamPunkMale.png"),
  DTyoungwarriormale: require("../../assets/avatars/DTyoungwarriormale.png"),
  DTyoungwanderermale: require("../../assets/avatars/DTyoungwanderermale.png"),
  DTyoungdisciplefemale: require("../../assets/avatars/DTyoungdisciplefemale.png"),
  DTsteampunkfemale: require("../../assets/avatars/DTsteampunkfemale.png"),
  DTsheildmaidenfemale: require("../../assets/avatars/DTsheildmaidenfemale.png"),
};

export default function SettingsScreen() {
  const { avatar, saveAvatar } = useAvatar();
  const { profile, saveProfile, refreshProfile, loading } = useProfile();
  const { showToast } = useToast();

  /* ============================
         LOCAL STATE
  ============================ */
  const [publicId, setPublicId] = useState(profile?.public_id || "");
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [email, setEmail] = useState(profile?.email || "");

  const [schoolId, setSchoolId] = useState(profile?.school_id || null);
  const [teacherId, setTeacherId] = useState(profile?.teacher_id || null);

  // 🔧 FIXED: initialize as null, let useEffect populate once profile is loaded
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [classHourId, setClassHourId] = useState<string | null>(null);

  /* ============================
         DROPDOWN DATA
  ============================ */
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classHours, setClassHours] = useState([]);

  /* ============================
        DROPDOWN STATE
  ============================ */
  const [openSchool, setOpenSchool] = useState(false);
  const [openTeacher, setOpenTeacher] = useState(false);
  const [openGrade, setOpenGrade] = useState(false);
  const [openClassHour, setOpenClassHour] = useState(false);

  /* ============================
        AVATAR PREVIEW
  ============================ */
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<any>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  /* ============================
      SYNC AFTER PROFILE LOAD
  ============================ */
  useEffect(() => {
    if (!profile) return;

    setPublicId(profile.public_id || "");
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setEmail(profile.email || "");

    setSchoolId(profile.school_id || null);
    setTeacherId(profile.teacher_id || null);

    setGradeId(
      profile.grade_id !== null && profile.grade_id !== undefined
        ? String(profile.grade_id)
        : null
    );

    setClassHourId(
      profile.class_hour_id !== null && profile.class_hour_id !== undefined
        ? String(profile.class_hour_id)
        : null
    );
  }, [profile]);

  /* ============================
       LOAD SEMINARIES
  ============================ */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("seminaries")
        .select("id, name")
        .order("name");

      if (!error && data) {
        setSchools(
          data.map((s: any) => ({
            label: s.name,
            value: String(s.id),
          }))
        );
      }
    })();
  }, []);

  /* ============================
       LOAD TEACHERS BY SEMINARY
  ============================ */
  useEffect(() => {
    if (!schoolId) {
      setTeachers([]);
      setTeacherId(null);
      setClassHourId(null);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name")
        .eq("seminary_id", schoolId)
        .order("name");

      if (!error && data) {
        setTeachers(
          data.map((t: any) => ({
            label: t.name,
            value: String(t.id),
          }))
        );
      }
    })();
  }, [schoolId]);

  /* ============================
       LOAD GRADES
  ============================ */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("id, name")
        .order("id");

      if (!error && data) {
        setGrades(
          data.map((g: any) => ({
            label: g.name,
            value: String(g.id),
          }))
        );
      }
    })();
  }, []);

  /* ============================
       LOAD CLASS HOURS (DEDUPE)
  ============================ */
  useEffect(() => {
    if (!teacherId) {
      setClassHours([]);
      setClassHourId(null);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("class_hours")
        .select("id, class_name, hour, teacher_id")
        .or(`teacher_id.eq.${teacherId},teacher_id.is.null`)
        .order("hour");

      if (!error && data) {
        // 🔥 DEDUPE FIX — remove duplicates
        const deduped: any[] = [];
        const seen = new Set<string>();

        for (const row of data as any[]) {
          const key = `${row.class_name}-${row.hour}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(row);
          }
        }

        setClassHours(
          deduped.map((c: any) => ({
            label: c.class_name,
            value: String(c.id),
          }))
        );
      }
    })();
  }, [teacherId]);

  /* ============================
       CLOSE DROPDOWNS
  ============================ */
  const closeAllDropdowns = () => {
    setOpenSchool(false);
    setOpenTeacher(false);
    setOpenGrade(false);
    setOpenClassHour(false);
  };

  /* ============================
        SAVE SETTINGS
  ============================ */
  const handleSave = useCallback(async () => {
    closeAllDropdowns();

    const { error } = await saveProfile({
      public_id: publicId.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),

      school_id: schoolId || null,
      teacher_id: teacherId || null,

      grade_id: gradeId ? Number(gradeId) : null,
      class_hour_id: classHourId ? Number(classHourId) : null,

      avatar,
    });

    if (error) {
      console.error("❌ SAVE ERROR:", error);
      showToast("Failed to save settings.");
    } else {
      await refreshProfile();
      showToast("Settings saved!");
    }
  }, [
    avatar,
    publicId,
    firstName,
    lastName,
    email,
    schoolId,
    teacherId,
    gradeId,
    classHourId,
    refreshProfile,
    saveProfile,
    showToast,
  ]);

  /* ============================
       COPY PUBLIC ID
  ============================ */
  const handleCopyPublicID = async () => {
    if (!publicId) return;
    await Clipboard.setStringAsync(publicId);
    showToast("Public ID copied!");
  };

  /* ============================
       CONFIRM AVATAR
  ============================ */
  const confirmAvatar = async () => {
    if (!previewKey) {
      showToast("Choose an avatar first.");
      return;
    }
    await saveAvatar(previewKey);
    setPreviewVisible(false);
    showToast("Avatar updated!");
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#6b2b34" />
      </SafeAreaView>
    );
  }

  /* ============================
       UI
  ============================ */
  return (
    <ParchmentScreen safeTopPadding>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <Text style={styles.header}>Settings</Text>

              <Image
                source={require("../../assets/images/settings_tab.png")}
                style={styles.headerIcon}
              />

              {/* AVATAR GRID */}
              <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
              <View style={styles.grid}>
                {Object.entries(avatarOptions).map(([key, src]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      closeAllDropdowns();
                      setPreviewSrc(src);
                      setPreviewKey(key);
                      setPreviewVisible(true);
                    }}
                    style={[
                      styles.avatarWrapper,
                      avatar === key && styles.selectedAvatar,
                    ]}
                  >
                    <Image source={src as any} style={styles.avatarImage} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* PREVIEW MODAL */}
              <AnimatePresence>
                {previewVisible && (
                  <Modal transparent visible animationType="fade">
                    <Pressable
                      style={styles.modalOverlay}
                      onPress={() => setPreviewVisible(false)}
                    >
                      <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 250 }}
                        style={styles.modalContent}
                      >
                        {previewSrc && (
                          <Image
                            source={previewSrc}
                            style={styles.previewImage}
                          />
                        )}

                        <TouchableOpacity
                          onPress={confirmAvatar}
                          style={styles.confirmButton}
                        >
                          <Text style={styles.confirmText}>
                            Use This Avatar
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.tapToClose}>
                          Tap outside to cancel
                        </Text>
                      </MotiView>
                    </Pressable>
                  </Modal>
                )}
              </AnimatePresence>

              {/* USER INFO */}
              <Text style={styles.sectionTitle}>User Information</Text>
              <View style={{ width: "90%" }}>
                {[
                  {
                    label: "First Name",
                    value: firstName,
                    setter: setFirstName,
                    placeholder: "Enter first name",
                  },
                  {
                    label: "Last Name",
                    value: lastName,
                    setter: setLastName,
                    placeholder: "Enter last name",
                  },
                  {
                    label: "Email",
                    value: email,
                    setter: setEmail,
                    placeholder: "Enter email",
                  },
                ].map((f, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={["#4a3b25", "#3b2f1f", "#4a3b25"]}
                    style={styles.brassPlate}
                  >
                    <Text style={styles.brassLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.brassTextInput}
                      value={f.value}
                      onChangeText={f.setter}
                      placeholder={f.placeholder}
                      placeholderTextColor="#cfae64"
                    />
                  </LinearGradient>
                ))}

                <LinearGradient
                  colors={["#4a3b25", "#3b2f1f", "#4a3b25"]}
                  style={[styles.brassPlate, { marginBottom: 20 }]}
                >
                  <Text style={styles.brassLabel}>Public ID</Text>
                  <TouchableOpacity onPress={handleCopyPublicID}>
                    <Text style={[styles.brassTextInput, { color: "#d4b16a" }]}>
                      {publicId || "—"}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* SCHOOL INFORMATION */}
              <Text style={styles.schoolHeader}>School Information</Text>

              <DropBlock
                z={5000}
                label="Select School"
                open={openSchool}
                setOpen={(v) => {
                  closeAllDropdowns();
                  setOpenSchool(v);
                }}
                value={schoolId}
                setValue={(setter) => {
                  const next = setter(schoolId);
                  setSchoolId(next);
                }}
                items={schools}
              />

              <DropBlock
                z={4000}
                label="Select Teacher"
                open={openTeacher}
                setOpen={(v) => {
                  closeAllDropdowns();
                  setOpenTeacher(v);
                }}
                value={teacherId}
                setValue={(setter) => {
                  const next = setter(teacherId);
                  setTeacherId(next);
                }}
                items={teachers}
              />

              <DropBlock
                z={3000}
                label="Select Grade"
                open={openGrade}
                setOpen={(v) => {
                  closeAllDropdowns();
                  setOpenGrade(v);
                }}
                value={gradeId}
                setValue={(setter) => {
                  const next = setter(gradeId);
                  setGradeId(next);
                }}
                items={grades}
              />

              <DropBlock
                z={2000}
                label="Select Class Period"
                open={openClassHour}
                setOpen={(v) => {
                  closeAllDropdowns();
                  setOpenClassHour(v);
                }}
                value={classHourId}
                setValue={(setter) => {
                  const next = setter(classHourId);
                  setClassHourId(next);
                }}
                items={classHours}
              />

              {/* SAVE BUTTON */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ParchmentScreen>
  );
}

/* ============================
     REUSABLE DROPDOWN BLOCK
============================ */
function DropBlock({ z, label, open, setOpen, value, setValue, items }) {
  return (
    <View style={{ width: "90%", zIndex: z }}>
      <LinearGradient
        colors={["#4a3b25", "#3b2f1f", "#4a3b25"]}
        style={styles.brassPlate}
      >
        <Text style={styles.brassLabel}>{label}</Text>

        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={setValue}
          setItems={() => {}}
          listMode="MODAL"
          placeholder={label}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          modalContentContainerStyle={styles.modalDropdownContent}
          placeholderStyle={styles.dropdownPlaceholder}
          textStyle={styles.dropdownText}
        />
      </LinearGradient>
    </View>
  );
}

/* ============================
             STYLES
============================ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },

  scrollContent: {
    paddingBottom: 80,
    paddingTop: 10,
    alignItems: "center",
  },

  container: {
    width: "100%",
    alignItems: "center",
  },

  header: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 38,
    color: "#2e2618",
    textAlign: "center",
    marginBottom: 10,
  },

  headerIcon: {
    width: 90,
    height: 90,
    marginBottom: 10,
    resizeMode: "contain",
  },

  sectionTitle: {
    fontFamily: "Lora-Bold",
    fontSize: 20,
    color: "#f5deb3",
    marginVertical: 10,
  },

  schoolHeader: {
    fontFamily: "Lora-Bold",
    fontSize: 22,
    color: "#f5deb3",
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 20,
  },

  avatarWrapper: {
    width: SCREEN_WIDTH * 0.26,
    height: SCREEN_WIDTH * 0.26 * PORTRAIT_RATIO,
    margin: 8,
    padding: 6,
    borderWidth: 3,
    borderColor: "transparent",
    borderRadius: 20,
    backgroundColor: "#3b2f1f",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedAvatar: {
    borderColor: "#7fbf00",
    backgroundColor: "rgba(127,191,0,0.15)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#2e2618",
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#cfae64",
    alignItems: "center",
    maxWidth: SCREEN_WIDTH * 0.9,
  },

  previewImage: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8 * PORTRAIT_RATIO,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#d4b16a",
    marginBottom: 18,
  },

  confirmButton: {
    backgroundColor: "#d4b16a",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  confirmText: {
    fontFamily: "Lora-Bold",
    color: "#2e2618",
  },

  tapToClose: {
    marginTop: 8,
    color: "#d4b16a",
    fontSize: 12,
  },

  brassPlate: {
    width: "100%",
    padding: 10,
    borderWidth: 2,
    borderColor: "#d4b16a",
    borderRadius: 10,
    marginVertical: 6,
    backgroundColor: "#3b2f1f",
  },

  brassLabel: {
    fontFamily: "Lora-Bold",
    color: "#d4b16a",
    marginBottom: 4,
  },

  brassTextInput: {
    fontFamily: "Lora-Regular",
    fontSize: 16,
    color: "#f8f5e7",
  },

  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#cfae64",
    backgroundColor: "#3b2f1f",
  },

  dropdownContainer: {
    backgroundColor: "#2e2618",
    borderColor: "#d4b16a",
  },

  modalDropdownContent: {
    backgroundColor: "#2e2618",
  },

  dropdownPlaceholder: {
    color: "#cfae64",
    fontFamily: "Lora-Regular",
  },

  dropdownText: {
    color: "#d4b16a",
    fontFamily: "Lora-Regular",
  },

  saveButton: {
    backgroundColor: "#d4b16a",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 30,
    width: "90%",
    alignItems: "center",
  },

  saveText: {
    fontFamily: "Lora-Bold",
    fontSize: 16,
    color: "#2e2618",
  },
});

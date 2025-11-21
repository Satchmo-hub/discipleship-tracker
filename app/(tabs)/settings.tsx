// app/(tabs)/settings.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

import ParchmentScreen from "../../components/ParchmentScreen";
import DropDownPicker from "react-native-dropdown-picker";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatePresence, MotiView } from "moti";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAvatar } from "../../context/AvatarContext";
import { useProfile } from "../../context/ProfileContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PORTRAIT_RATIO = 1.35;

// ---- Avatar Options ----
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

  // Local fields
  const [publicId, setPublicId] = useState(profile?.public_id || "");
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [email, setEmail] = useState(profile?.email || "");

  const [schoolId, setSchoolId] = useState<string>(profile?.school_id || "");
  const [teacherId, setTeacherId] = useState<string>(profile?.teacher_id || "");
  const [gradeId, setGradeId] = useState<string | null>(
    profile?.grade_id ? String(profile.grade_id) : null
  );
  const [classHourId, setClassHourId] = useState<string | null>(
    profile?.class_hour_id ? String(profile.class_hour_id) : null
  );

  // Dropdown data
  const [schools, setSchools] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [classHours, setClassHours] = useState<any[]>([]);

  // Dropdown open states
  const [openSchool, setOpenSchool] = useState(false);
  const [openTeacher, setOpenTeacher] = useState(false);
  const [openGrade, setOpenGrade] = useState(false);
  const [openClassHour, setOpenClassHour] = useState(false);

  // Avatar modal
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<any>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  // Sync profile
  useEffect(() => {
    if (!profile) return;

    setPublicId(profile.public_id || "");
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setEmail(profile.email || "");

    setSchoolId(profile.school_id || "");
    setTeacherId(profile.teacher_id || "");
    setGradeId(profile.grade_id ? String(profile.grade_id) : null);
    setClassHourId(profile.class_hour_id ? String(profile.class_hour_id) : null);
  }, [profile]);

  // Load Schools
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("schools").select("id, name").order("name");
      setSchools(data || []);
    })();
  }, []);

  // Load Teachers
  useEffect(() => {
    if (!schoolId) {
      setTeachers([]);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("teachers")
        .select("id, name")
        .eq("school_id", schoolId)
        .order("name");

      setTeachers(data || []);
    })();
  }, [schoolId]);

  // Load Grades + Class Periods
  useEffect(() => {
    (async () => {
      try {
        const [gradesRes, periodsRes] = await Promise.all([
          supabase.from("grades").select("id, label").order("id"),
          supabase.from("class_hours").select("id, label").order("id"),
        ]);

        setGrades(gradesRes.data || []);
        setClassHours(periodsRes.data || []);
      } catch {
        setGrades([]);
        setClassHours([]);
      }
    })();
  }, []);

  // Save Profile
  const handleSave = useCallback(async () => {
    try {
      await saveProfile({
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

      await refreshProfile();
      showToast("Settings saved!", "success");
    } catch {
      showToast("Failed to save settings.", "error");
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
  ]);

  // Copy ID
  const handleCopyPublicID = async () => {
    if (!publicId) return;
    await Clipboard.setStringAsync(publicId);
    showToast("Public ID copied!");
  };

  // Confirm avatar
  const confirmAvatar = async () => {
    if (!previewKey) {
      showToast("Please choose an avatar first.");
      return;
    }
    await saveAvatar(previewKey);
    setPreviewVisible(false);
    showToast("Avatar updated!");
  };

  const closeAllDropdowns = () => {
    setOpenSchool(false);
    setOpenTeacher(false);
    setOpenGrade(false);
    setOpenClassHour(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#6b2b34" />
      </SafeAreaView>
    );
  }

  return (
    <ParchmentScreen safeTopPadding>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
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
                    setPreviewSrc(src);
                    setPreviewKey(key);
                    setPreviewVisible(true);
                  }}
                  style={[
                    styles.avatarWrapper,
                    avatar === key && styles.selectedAvatar,
                  ]}
                >
                  <Image
                    source={src}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* AVATAR MODAL */}
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
                      transition={{ duration: 300 }}
                      style={styles.modalContent}
                    >
                      <Image
                        source={previewSrc}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />

                      <TouchableOpacity
                        onPress={confirmAvatar}
                        style={styles.confirmButton}
                      >
                        <Text style={styles.confirmText}>Use This Avatar</Text>
                      </TouchableOpacity>

                      <Text style={styles.tapToClose}>Tap outside to cancel</Text>
                    </MotiView>
                  </Pressable>
                </Modal>
              )}
            </AnimatePresence>

            {/* USER FIELDS */}
            <Text style={styles.sectionTitle}>User Information</Text>

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

            {/* PUBLIC ID */}
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

            {/* SCHOOL INFO */}
            <Text style={styles.schoolHeader}>School Information</Text>

            {[
              {
                label: "Select School",
                open: openSchool,
                setOpen: setOpenSchool,
                onOpen: () => {
                  closeAllDropdowns();
                  setOpenSchool(true);
                },
                value: schoolId || null,
                setValue: (v: any) => setSchoolId(v ?? ""),
                items: schools.map((s) => ({ label: s.name, value: s.id })),
              },
              {
                label: "Select Teacher",
                open: openTeacher,
                setOpen: setOpenTeacher,
                onOpen: () => {
                  closeAllDropdowns();
                  setOpenTeacher(true);
                },
                value: teacherId || null,
                setValue: (v: any) => setTeacherId(v ?? ""),
                items: teachers.map((t) => ({ label: t.name, value: t.id })),
              },
              {
                label: "Select Grade",
                open: openGrade,
                setOpen: setOpenGrade,
                onOpen: () => {
                  closeAllDropdowns();
                  setOpenGrade(true);
                },
                value: gradeId,
                setValue: (v: any) => setGradeId(v ?? null),
                items: grades.map((g) => ({ label: g.label, value: String(g.id) })),
              },
              {
                label: "Select Class Period",
                open: openClassHour,
                setOpen: setOpenClassHour,
                onOpen: () => {
                  closeAllDropdowns();
                  setOpenClassHour(true);
                },
                value: classHourId,
                setValue: (v: any) => setClassHourId(v ?? null),
                items: classHours.map((h) => ({
                  label: h.label,
                  value: String(h.id),
                })),
              },
            ].map((d, i) => (
              <LinearGradient
                key={i}
                colors={["#4a3b25", "#3b2f1f", "#4a3b25"]}
                style={styles.brassPlate}
              >
                <Text style={styles.brassLabel}>{d.label}</Text>

                <DropDownPicker
                  open={d.open}
                  value={d.value}
                  items={d.items}
                  setOpen={d.setOpen}
                  setValue={d.setValue}
                  listMode="MODAL"
                  placeholder={d.label}
                  onOpen={d.onOpen}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  modalContentContainerStyle={styles.modalDropdownContent}
                  labelStyle={styles.dropdownLabel}
                  selectedItemLabelStyle={styles.dropdownSelectedLabel}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  modalProps={{ animationType: "slide" }}
                  renderCustomizedButtonChild={(selectedItem) => (
                    <View style={styles.dropdownButtonInner}>
                      <Text
                        style={
                          selectedItem
                            ? styles.dropdownButtonTextSelected
                            : styles.dropdownButtonTextPlaceholder
                        }
                      >
                        {selectedItem ? selectedItem.label : d.label}
                      </Text>
                    </View>
                  )}
                />
              </LinearGradient>
            ))}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ParchmentScreen>
  );
}

/*********** STYLES ***********/
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },

  container: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 60,
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

  /***********************
   * AVATAR GRID — TRUE PORTRAIT FRAMES
   ***********************/
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
    overflow: "hidden",
  },

  selectedAvatar: {
    borderColor: "#7fbf00",
    backgroundColor: "rgba(127,191,0,0.15)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  /**********************/

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
    resizeMode: "contain",
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
    width: "90%",
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
    minHeight: 44,
  },

  dropdownContainer: {
    backgroundColor: "#2e2618",
    borderColor: "#d4b16a",
    borderWidth: 1,
  },

  modalDropdownContent: {
    backgroundColor: "#2e2618",
  },

  dropdownLabel: {
    color: "#f8f5e7",
    fontFamily: "Lora-Regular",
  },

  dropdownSelectedLabel: {
    color: "#ffd76a",
    fontFamily: "Lora-Bold",
  },

  dropdownText: {
    color: "#d4b16a",
    fontFamily: "Lora-Regular",
  },

  dropdownPlaceholder: {
    color: "#cfae64",
    fontFamily: "Lora-Regular",
  },

  dropdownButtonInner: {
    backgroundColor: "#3b2f1f",
    borderWidth: 1,
    borderColor: "#cfae64",
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  dropdownButtonTextSelected: {
    color: "#ffd76a",
    fontFamily: "Lora-Regular",
    fontSize: 16,
  },

  dropdownButtonTextPlaceholder: {
    color: "#cfae64",
    fontFamily: "Lora-Regular",
    fontSize: 16,
  },

  saveButton: {
    backgroundColor: "#d4b16a",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    width: "90%",
    alignItems: "center",
  },

  saveText: {
    fontFamily: "Lora-Bold",
    fontSize: 16,
    color: "#2e2618",
  },
});


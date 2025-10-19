import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,                     // 👈 Added
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Font from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStats } from "@context/StatsContext";

const STORAGE_KEY = "dt.userinfo";
const DAILY_KEY = "dt.daily";
const WEEKLY_KEY = "dt.weekly";

export default function SettingsScreen() {
  const { resetAllData, setGender, stats } = useStats();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [gender, setGenderLocal] = useState(stats.gender || "male");

  // 🔤 Load fonts
  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        "Ringbearer-Regular": require("@assets/fonts/Ringbearer-Regular.ttf"),
        "Lora-Regular": require("@assets/fonts/Lora-Regular.ttf"),
        "Lora-Bold": require("@assets/fonts/Lora-Bold.ttf"),
        "Lora-MediumItalic": require("@assets/fonts/Lora-MediumItalic.ttf"),
      });
      setFontsLoaded(true);
    })();
  }, []);

  // 💾 Load saved user info
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { firstName: savedName, gender: savedGender } = JSON.parse(saved);
          if (savedName) setFirstName(savedName);
          if (savedGender) {
            setGenderLocal(savedGender);
            setGender(savedGender);
          }
        }
      } catch (err) {
        console.warn("Error loading user info:", err);
      }
    })();
  }, []);

  // 💾 Save whenever name or gender changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ firstName, gender }));
  }, [firstName, gender]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a37b3f" />
        <Text style={styles.loadingText}>Loading assets…</Text>
      </View>
    );
  }

  const handleGenderChange = (newGender) => {
    setGenderLocal(newGender);
    setGender(newGender);
  };

  /** 🔄 Reset confirmation + logic */
  const confirmReset = () => {
    Alert.alert(
      "Reset All Data",
      "Are you sure you want to erase all progress, streaks, and user information? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Reset Everything", style: "destructive", onPress: handleReset },
      ]
    );
  };

  const handleReset = async () => {
    try {
      await resetAllData();
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        DAILY_KEY,
        WEEKLY_KEY,
        "dt.lastReset",
      ]);
      setFirstName("");
      setGenderLocal("male");
      console.log("🔄 All data fully reset (stats, user info, daily, weekly).");
      Alert.alert("All data cleared", "Your progress has been fully reset.");
    } catch (err) {
      console.warn("⚠️ Error resetting app data:", err);
      Alert.alert("Error", "Something went wrong while resetting data.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Title */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.sectionTitle}>User Info</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              placeholderTextColor="#777"
              value={firstName}
              onChangeText={setFirstName}
            />

            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "male" && styles.genderSelected,
                ]}
                onPress={() => handleGenderChange("male")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "male" && styles.genderSelectedText,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "female" && styles.genderSelected,
                ]}
                onPress={() => handleGenderChange("female")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "female" && styles.genderSelectedText,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset All Data */}
          <TouchableOpacity style={styles.resetButton} onPress={confirmReset}>
            <Text style={styles.resetText}>Reset All Data</Text>
          </TouchableOpacity>

          {/* About Section */}
          <View style={styles.aboutCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>
              Discipleship Tracker v1.0{"\n"}
              Developed by Bro C{"\n"}
              <Text style={styles.aboutItalic}>
                Helping students take charge of their testimonies.
              </Text>
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* 🎨 Styles (same as before) */
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f4ecd8",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Lora-Regular",
    color: "#3a2e1a",
    marginTop: 10,
    fontSize: 16,
  },
  container: { flex: 1 },
  background: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 100,
    paddingBottom: 80,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 36,
    color: "#2b1d0e",
    textAlign: "center",
  },
  userInfo: {
    width: "85%",
    marginBottom: 30,
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#3a2c0f",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 10,
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontFamily: "Lora-Regular",
    fontSize: 15,
    color: "#2b1d0e",
    marginBottom: 15,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#a37b3f",
    borderRadius: 10,
    marginHorizontal: 5,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  genderSelected: {
    backgroundColor: "#a37b3f",
  },
  genderText: {
    fontFamily: "Lora-Regular",
    fontSize: 15,
    color: "#3a2c0f",
  },
  genderSelectedText: {
    color: "#fff",
    fontFamily: "Lora-Bold",
  },
  resetButton: {
    backgroundColor: "#8b0000",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  resetText: {
    color: "#fff",
    fontFamily: "Lora-Bold",
    fontSize: 16,
    textAlign: "center",
  },
  aboutCard: {
    width: "85%",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  aboutText: {
    fontFamily: "Lora-Regular",
    fontSize: 15,
    color: "#444",
    textAlign: "center",
    lineHeight: 22,
  },
  aboutItalic: {
    fontFamily: "Lora-MediumItalic",
    fontSize: 15,
    color: "#3a2c0f",
  },
});

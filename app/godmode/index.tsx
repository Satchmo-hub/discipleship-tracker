// GodModeScreen.tsx — rewritten
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useProfile } from "../../context/ProfileContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../supabase/client";

export default function GodModeScreen() {
  const { profile } = useProfile();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const ACCESS_CODE = "GODmode-2025";

  const activateGodMode = async () => {
    if (!profile?.uuid) {
      showToast("No profile found.");
      return;
    }

    if (code.trim() !== ACCESS_CODE) {
      showToast("Incorrect code");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ teacher_code: ACCESS_CODE })
      .eq("uuid", profile.uuid);

    if (error) {
      console.error(error);
      showToast("Could not enable God Mode.");
      return;
    }

    showToast("God Mode activated!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Access Code</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="Access code"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={activateGodMode}>
        <Text style={styles.buttonText}>Activate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
  },
  input: {
    width: "80%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#a78a57",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});

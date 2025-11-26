import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView, Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../supabase/client";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Email and password required.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(), password: password.trim()
      });
      if (error) throw error;
      Alert.alert("Success", "Account created! Please sign in.");
      router.replace("/auth");
    } catch (err: any) {
      Alert.alert("Sign Up Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none"
          keyboardType="email-address" value={email} onChangeText={setEmail}
        />
        <TextInput style={styles.input} placeholder="Password" autoCapitalize="none"
          secureTextEntry value={password} onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/auth")} style={{ marginTop: 14 }}>
          <Text style={styles.link}>Back to login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#dcd8cf" },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 32, fontFamily: "Ringbearer-Regular", textAlign: "center", marginBottom: 32, color: "#2e2618" },
  input: {
    width: "100%", backgroundColor: "#fff", borderWidth: 2, borderColor: "#9c855e",
    borderRadius: 10, padding: 12, marginBottom: 14, fontFamily: "Lora-Regular", fontSize: 18
  },
  button: { backgroundColor: "#2f2413", padding: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { fontFamily: "Lora-MediumItalic", fontSize: 18, color: "#fff" },
  link: { fontFamily: "Lora-Regular", fontSize: 16, textAlign: "center", color: "#2e2618" }
});

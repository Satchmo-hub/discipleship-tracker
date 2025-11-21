// components/Toast.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MotiView, AnimatePresence } from "moti";

type ToastContextType = {
  showToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);

    setTimeout(() => {
      setMessage(null);
    }, 1600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* TOAST OVERLAY */}
      <View pointerEvents="none" style={styles.overlay}>
        <AnimatePresence>
          {message && (
            <View style={{ alignItems: "center", justifyContent: "center" }}>

              {/* 🌫️ STEAM PUFF */}
              <MotiView
                from={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.45, scale: 1.4 }}
                exit={{ opacity: 0, scale: 1.8 }}
                transition={{
                  type: "timing",
                  duration: 1200,
                }}
                style={styles.steamPuff}
              />

              {/* ✨ BRASS GLOW */}
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.55, scale: 1.15 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{
                  type: "timing",
                  duration: 800,
                }}
                style={styles.brassGlow}
              />

              {/* 🧰 TOAST BOX */}
              <MotiView
                from={{ opacity: 0, translateY: 40 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 40 }}
                transition={{ type: "timing", duration: 400 }}
                style={styles.toastBox}
              >
                <Text style={styles.toastText}>{message}</Text>
              </MotiView>
            </View>
          )}
        </AnimatePresence>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  steamPuff: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    opacity: 0.35,
    filter: "blur(16px)",
  },

  brassGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(212, 177, 106, 0.45)", // warm brass gold
    filter: "blur(22px)",
  },

  toastBox: {
    backgroundColor: "#3b2f1f",
    borderWidth: 2,
    borderColor: "#d4b16a",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },

  toastText: {
    fontFamily: "Lora-Bold",
    color: "#f8f5e7",
    fontSize: 16,
    textAlign: "center",
  },
});

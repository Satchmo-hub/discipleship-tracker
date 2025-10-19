// context/ToastContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type ToastContextType = {
  showToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={{ flex: 1 }}>
        {children}

        {toast && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  toastText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});

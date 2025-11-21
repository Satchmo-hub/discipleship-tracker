import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import ToastSteampunk from "../components/ToastSteampunk";

type ToastContextType = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return ctx;
};

type ProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ProviderProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Expose to global so _layout.tsx notification listener can call it
  useEffect(() => {
    (globalThis as any).showSteampunkToast = showToast;
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && (
        <ToastSteampunk
          message={toastMessage}
          onHide={() => setToastMessage(null)}
        />
      )}
    </ToastContext.Provider>
  );
}

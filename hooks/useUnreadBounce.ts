import { useEffect, useState } from "react";
import { useUnread } from "../context/UnreadContext";
import { AppState } from "react-native";

export function useUnreadBounce() {
  const { hasUnread, refreshUnread } = useUnread();
  const [shouldBounce, setShouldBounce] = useState(false);

  // Start or stop bounce whenever unread changes
  useEffect(() => {
    setShouldBounce(hasUnread);
  }, [hasUnread]);

  // Refresh unread whenever app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshUnread();
      }
    });

    return () => sub.remove();
  }, []);

  return { shouldBounce };
}

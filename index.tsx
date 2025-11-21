import * as Notifications from "expo-notifications";

// ===============================================================
//  GLOBAL NOTIFICATION HANDLER
//  iOS will NOT show scheduled notifications without this.
// ===============================================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ===============================================================
//  EXPO ROUTER ENTRY
//  This bootstraps your entire navigation + screens.
// ===============================================================
export { default } from "expo-router/entry";

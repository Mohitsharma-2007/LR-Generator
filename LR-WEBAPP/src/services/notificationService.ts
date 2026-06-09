/**
 * Notification service using Capacitor Local Notifications plugin.
 * Handles permission requests and showing local notifications
 * for PDF saved, email sent, etc.
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Request notification permission from the user.
 * Call this once on app launch.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // On web, try the Web Notification API
    if ("Notification" in window && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      return result === "granted";
    }
    return false;
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;

    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    return false;
  }
}

/**
 * Show a local notification.
 */
export async function showNotification(
  title: string,
  body: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) },
          sound: undefined,
          smallIcon: "ic_launcher",
          iconColor: "#D4A843",
        },
      ],
    });
  } catch (err) {
    console.error("Failed to show notification:", err);
  }
}

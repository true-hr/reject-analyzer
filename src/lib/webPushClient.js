const SW_PATH = `${import.meta.env.BASE_URL}sw.js`;
const PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isPublicKeyConfigured() {
  return Boolean(PUBLIC_KEY);
}

export async function registerServiceWorker() {
  if (!isWebPushSupported()) throw new Error("Web Push is not supported in this browser.");
  return navigator.serviceWorker.register(SW_PATH);
}

export function getNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "denied";
  return Notification.requestPermission();
}

export async function getCurrentSubscription() {
  if (!isWebPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!isWebPushSupported()) throw new Error("Web Push is not supported in this browser.");
  if (!PUBLIC_KEY) throw new Error("VITE_WEB_PUSH_PUBLIC_KEY is not configured.");
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return normalizePushSubscription(existing);
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
  });
  return normalizePushSubscription(subscription);
}

export async function unsubscribeFromPush() {
  if (!isWebPushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (!existing) return false;
  return existing.unsubscribe();
}

export function normalizePushSubscription(subscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh || "",
    auth: json.keys?.auth || "",
    expirationTime: subscription.expirationTime ?? null,
  };
}

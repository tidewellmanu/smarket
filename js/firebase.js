import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js";
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-check.js";
import { firebaseConfig, appCheckSiteKey } from "./config.js";

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

if (!appCheckSiteKey.startsWith("REPLACE_")) {
  initializeAppCheck(firebaseApp, { provider: new ReCaptchaV3Provider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
}
export async function getFcmMessaging(){ return await isSupported() ? getMessaging(firebaseApp) : null; }
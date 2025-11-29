// config/firebaseConfig.ts
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  GoogleAuthProvider,
  getReactNativePersistence, 
  type Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBIm_QKmcR4ZvAqH70T47gIC4dl7y3Psmg",
  authDomain: "datingapp-2af40.firebaseapp.com",
  projectId: "datingapp-2af40",
  storageBucket: "datingapp-2af40.appspot.com",
  messagingSenderId: "788278716084",
  appId: "1:788278716084:android:236e2289fcb568f40a59e1",
};

// ---------------- INITIALIZE APP ----------------
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ---------------- INITIALIZE AUTH ----------------
let auth: Auth;

try {
  // ✅ Use getReactNativePersistence with AsyncStorage
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (_error) {
  // fallback if already initialized
  auth = getAuth(app);
}

// ---------------- EXPORT ----------------
export { app, auth, GoogleAuthProvider };

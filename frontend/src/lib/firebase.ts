import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBP-MvCEjvJ2DAknjhYX8fcYHoHid5TUFs",
  authDomain: "coinradar-f0728.firebaseapp.com",
  projectId: "coinradar-f0728",
  storageBucket: "coinradar-f0728.firebasestorage.app",
  messagingSenderId: "893155892912",
  appId: "1:893155892912:web:704aae3d50492b11212575",
  measurementId: "G-438PJE6NMW",
};

// Prevent duplicate app init during HMR
const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;

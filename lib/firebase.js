import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBk_NFY5QhqMmQya7wXOKxJAK3R89GzPCk",
  authDomain: "attendance-app-38a68.firebaseapp.com",
  projectId: "attendance-app-38a68",
  storageBucket: "attendance-app-38a68.firebasestorage.app",
  messagingSenderId: "318689602984",
  appId: "1:318689602984:web:94bb06feb230af7bd2819d"
};

// Prevents re-initializing Firebase on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

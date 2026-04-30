import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQGJIc0_PlMFFfqrpWSuq9HPxDP0Z25NQ",
  authDomain: "real-time-interview.firebaseapp.com",
  projectId: "real-time-interview",
  storageBucket: "real-time-interview.firebasestorage.app",
  messagingSenderId: "152021271564",
  appId: "1:152021271564:web:e0a0edb69e04c52fc91a29",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 👇 critical
setPersistence(auth, browserLocalPersistence);

export const provider = new GoogleAuthProvider();

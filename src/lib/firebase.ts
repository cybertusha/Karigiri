import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIjluzzqwiyELZhOaN1v2UkYgXvEbA1qI",
  authDomain: "arigari-994dd.firebaseapp.com",
  projectId: "arigari-994dd",
  storageBucket: "arigari-994dd.firebasestorage.app",
  messagingSenderId: "1021231322360",
  appId: "1:1021231322360:web:4b723174dede0ba7b5170d",
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestoreDb = getFirestore(app);

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2vEZUSyp36RbSeMRySpCJd9srAnWHulQ",
  authDomain: "primepicks-23.firebaseapp.com",
  projectId: "primepicks-23",
  storageBucket: "primepicks-23.firebasestorage.app",
  messagingSenderId: "233137641809",
  appId: "1:233137641809:web:6e10681ede7f54d097db70",
  measurementId: "G-3HDCLL2GR8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export { auth, signInWithPopup, provider };

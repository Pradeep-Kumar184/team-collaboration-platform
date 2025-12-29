import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const firebaseAuth = {
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      return { success: true, user: userCredential.user, token };
    } catch (error) {
      return { success: false, error: getErrorMessage(error.code) };
    }
  },

  register: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      return { success: true, user: userCredential.user, token };
    } catch (error) {
      return { success: false, error: getErrorMessage(error.code) };
    }
  },

  logout: () => signOut(auth),
  getCurrentUser: () => auth.currentUser,
  onAuthStateChange: (callback) => onAuthStateChanged(auth, callback),
  getToken: async () => auth.currentUser?.getIdToken(),
};

const getErrorMessage = (code) => {
  const messages = {
    "auth/invalid-email": "Invalid email address",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "Email already registered",
    "auth/weak-password": "Password should be at least 6 characters",
    "auth/too-many-requests": "Too many attempts. Try later",
    "auth/invalid-credential": "Invalid email or password",
    "auth/network-request-failed": "Network error. Check connection",
  };
  return messages[code] || "Authentication failed";
};

export default app;

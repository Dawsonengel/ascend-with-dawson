import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBpmoSHbSBlvYPe62bJzEodSrzVpf4E2Zo",
  authDomain: "elevateapp-1d883.firebaseapp.com",
  projectId: "elevateapp-1d883",
  storageBucket: "elevateapp-1d883.firebasestorage.app",
  messagingSenderId: "476396153463",
  appId: "1:476396153463:web:6cf02f5ed7740b064a3472",
  measurementId: "G-WVHHXCHNZY"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

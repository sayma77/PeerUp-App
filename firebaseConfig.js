import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB5HG5p98IRVdCg8nYR6wwlyWg-BnoR2gU",
  authDomain: "peerup-app-bdb0c.firebaseapp.com",
  projectId: "peerup-app-bdb0c",
  storageBucket: "peerup-app-bdb0c.firebasestorage.app",
  messagingSenderId: "792654468929",
  appId: "1:792654468929:web:c599edebb9f62bc664f3c0"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Auth needs persistence set up manually in RN
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
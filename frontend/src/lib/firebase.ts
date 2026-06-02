'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCzCpUHcwv5D9GbNZEg4AivbgvQXgv4Q1Q',
  authDomain: 'harisv2.firebaseapp.com',
  projectId: 'harisv2',
  storageBucket: 'harisv2.firebasestorage.app',
  messagingSenderId: '629600533960',
  appId: '1:629600533960:web:c57a1d50f16c84b173d4fd',
  measurementId: 'G-0EWHEYV8WY',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export async function initFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  return (await isSupported()) ? getAnalytics(firebaseApp) : null;
}

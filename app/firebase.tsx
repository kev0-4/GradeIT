// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAXfebsuhkpkj31cEDWw9ynUTfR7DMJoVs',
  authDomain: 'attendance-trackez.firebaseapp.com',
  projectId: 'attendance-trackez',
  storageBucket: 'attendance-trackez.appspot.com',
  messagingSenderId: '420129466471',
  appId: '1:420129466471:web:04eb2cee5b4dd2d2c90cc2',
  measurementId: 'G-YJ60HBQVYM',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

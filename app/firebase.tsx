// This file should only be imported on the client side
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAXfebsuhkpkj31cEDWw9ynUTfR7DMJoVs",
  authDomain: "attendance-trackez.firebaseapp.com",
  projectId: "attendance-trackez",
  storageBucket: "attendance-trackez.appspot.com",
  messagingSenderId: "420129466471",
  appId: "1:420129466471:web:04eb2cee5b4dd2d2c90cc2",
  measurementId: "G-YJ60HBQVYM",
}

// Initialize Firebase
let app
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

const db = getFirestore(app)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: "select_account",
})

export { db, auth, googleProvider }

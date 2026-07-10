import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAS3pXXvZuY6M9XQGLISqDbEycYB2BR6jA",
  authDomain: "mehdi-41a62.firebaseapp.com",
  databaseURL: "https://mehdi-41a62-default-rtdb.firebaseio.com",
  projectId: "mehdi-41a62",
  storageBucket: "mehdi-41a62.firebasestorage.app",
  messagingSenderId: "817654972686",
  appId: "1:817654972686:web:34b451a3345c0cf587d75f",
  measurementId: "G-GX1S42MVHJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

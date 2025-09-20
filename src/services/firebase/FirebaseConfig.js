// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDr1e5DfQMBrVsu2tiv1fZhU0UxAtE8GCI",
  authDomain: "mapu-1e852.firebaseapp.com",
  projectId: "mapu-1e852",
  storageBucket: "mapu-1e852.firebasestorage.app",
  messagingSenderId: "290493369828",
  appId: "1:290493369828:web:01577a414511287e7f8bf1",
  measurementId: "G-TWBQXP2518"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBgF4EPIZHe8FNvk0YMMW-gG-wQ62_ILXU",
  authDomain: "black-market-fcdbc.firebaseapp.com",
  projectId: "black-market-fcdbc",
  storageBucket: "black-market-fcdbc.firebasestorage.app",
  messagingSenderId: "144784682822",
  appId: "1:144784682822:web:98cabc098d26eba10d3f47",
  measurementId: "G-JYEPLETMB0",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

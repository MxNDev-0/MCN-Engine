import { auth, db } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

let currentUser = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: "User",
    });
  }

  listenUsers();
});

/* ================= USERS COUNT ================= */
function listenUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    document.getElementById("onlineUsers").innerText =
      "🟢 Users Online: " + snap.size;
  });
}

/* ================= NAV ================= */
window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};

/* 🔥 FIXED ADMIN BUTTON */
window.goAdmin = () => {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Admin access only");
    return;
  }
  alert("Welcome to Admin Panel");
};

/* 🔥 RESTORED UPGRADE BUTTON */
window.goUpgrade = () => {
  window.open("https://nowpayments.io/payment/?iid=5153003613", "_blank");
};

/* 🔥 SUPPORT (DISABLED FOR NOW) */
window.goSupport = () => {
  alert("Support not configured yet");
};
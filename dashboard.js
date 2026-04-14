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
let username = "User";

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
      username: "User"
    });
  } else {
    username = snap.data().username || "User";
  }

  listenUsers();
  listenPosts();
});

/* ================= USERS COUNT ================= */
function listenUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const el = document.getElementById("onlineUsers");
    if (el) el.innerText = "🟢 Users Online: " + snap.size;
  });
}

/* ================= POSTS (GLOBAL FEED) ================= */
function listenPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("posts");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="post">
          <b>${p.username || "User"}</b>
          <p>${p.text}</p>
        </div>
      `;
    });
  });
}

/* ================= CREATE POST (PROFILE + DASHBOARD SHARED) ================= */
window.createPost = async () => {
  const input = document.getElementById("postText");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    username,
    userId: currentUser.uid,
    time: Date.now()
  });

  input.value = "";
};

/* ================= NAV ================= */
window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};

/* ADMIN */
window.goAdmin = () => {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Admin access only");
    return;
  }
  alert("Admin Panel Unlocked");
};

/* ✅ UPGRADE FIXED */
window.goPremium = () => {
  window.location.href = "https://nowpayments.io/payment/?iid=5153003613";
};

/* SUPPORT */
window.support = () => {
  alert("Support not configured yet");
};
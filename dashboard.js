import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* AUTH */
onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadChat();
  loadUsers();
  loadPosts();
});

/* ================= CHAT (FIXED USING POST STYLE) ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !user) return;

  await addDoc(collection(db, "chat"), {
    user: user.email.split("@")[0],
    text,
    time: Date.now()
  });

  input.value = "";
};

function loadChat() {
  onSnapshot(collection(db, "chat"), (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      box.innerHTML += `<div><b>${m.user}</b>: ${m.text}</div>`;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= USERS ================= */
function loadUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      if (u.email) {
        box.innerHTML += `<div>🟢 ${u.email.split("@")[0]}</div>`;
      }
    });
  });
}

/* ================= POSTS ================= */
window.createPost = async () => {
  const text = document.getElementById("postText").value;

  if (!text) return alert("Write something");

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: Date.now()
  });

  document.getElementById("postText").value = "";
};

function loadPosts() {
  onSnapshot(collection(db, "posts"), (snap) => {
    const box = document.getElementById("posts");
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();
      box.innerHTML += `<div><b>${p.user}</b><p>${p.text}</p></div>`;
    });
  });
}

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display === "block") ? "none" : "block";
};

function closeMenu() {
  document.getElementById("menu").style.display = "none";
}

window.goHome = () => {
  closeMenu();
  location.reload();
};

window.goProfile = () => {
  closeMenu();
  location.href = "profile.html";
};

window.goAdmin = () => {
  closeMenu();

  if (user.email !== "nc.maxiboro@gmail.com") {
    alert("❌ Admin panel locked");
    return;
  }

  alert("✅ Welcome to Admin Office");
};

/* SUPPORT DISABLED */
window.support = () => {
  closeMenu();
  alert("Support not active yet");
};

/* UPGRADE */
window.upgrade = () => {
  closeMenu();
  window.open("https://nowpayments.io/payment/?iid=5153003613");
};

/* LOGOUT */
window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};
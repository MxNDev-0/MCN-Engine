import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

/* AUTH */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  setTimeout(() => {
    listenChat();
    listenUsers();
    listenPosts();
  }, 300);
});

/* CHAT FIX */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !currentUser) return;

  await addDoc(collection(db, "chat"), {
    name: currentUser.email.split("@")[0],
    text,
    time: Date.now()
  });

  input.value = "";
};

/* CHAT LISTENER */
function listenChat() {
  const q = query(collection(db, "chat"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      box.innerHTML += `<div><b>${m.name}</b>: ${m.text}</div>`;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* USERS */
function listenUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      if (u.email) {
        box.innerHTML += `<div>🟢 ${u.email.split("@")[0]}</div>`;
      }
    });
  });
}

/* POSTS */
function listenPosts() {
  onSnapshot(collection(db, "posts"), (snap) => {
    const box = document.getElementById("posts");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();
      box.innerHTML += `<div><b>${p.user}</b><p>${p.text}</p></div>`;
    });
  });
}

/* MENU ACTIONS */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};

window.goHome = () => location.reload();
window.goProfile = () => location.href = "profile.html";

window.goAdmin = () => {
  if (!currentUser || currentUser.email !== "nc.maxiboro@gmail.com") {
    alert("Not admin");
    return;
  }
  alert("Admin panel unlocked");
};

window.support = () => {
  window.open("https://nowpayments.io/payment/?iid=5153003613");
};

window.goUpgrade = () => {
  window.open("https://nowpayments.io/payment/?iid=5153003613");
};

window.logout = () => signOut(auth).then(() => location.href = "index.html");
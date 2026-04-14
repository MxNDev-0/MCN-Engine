import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let lastPost = 0;

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";

  currentUser = user;

  const snap = await getDoc(doc(db, "users", user.uid));
  lastPost = snap.data()?.lastPost || 0;
});

window.goBack = () => window.location.href = "dashboard.html";

// SAVE NAME
window.saveName = async () => {
  const name = document.getElementById("nicknameInput").value;

  await updateDoc(doc(db, "users", currentUser.uid), {
    nickname: name
  });

  alert("Saved!");
};

// POST
window.createPost = async () => {
  const text = document.getElementById("postText").value;

  if (!text) return;

  const now = Date.now();

  if (now - lastPost < 86400000) {
    return alert("Only 1 post per day");
  }

  await addDoc(collection(db, "posts"), {
    text,
    user: currentUser.uid
  });

  await updateDoc(doc(db, "users", currentUser.uid), {
    lastPost: now
  });

  lastPost = now;

  alert("Posted!");
};
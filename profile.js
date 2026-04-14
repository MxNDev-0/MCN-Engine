import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

/* AUTH */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  loadMyPosts();
});

/* CREATE POST */
window.createPost = async () => {
  const text = document.getElementById("postText").value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    userId: currentUser.uid,
    time: Date.now()
  });

  document.getElementById("postText").value = "";
};

/* LOAD ONLY MY POSTS */
function loadMyPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("myPosts");
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      if (p.userId === currentUser.uid) {
        box.innerHTML += `<div class="post">${p.text}</div>`;
      }
    });
  });
}
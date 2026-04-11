import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const chatBox = document.getElementById("chatBox");

let currentUser = null;

// ================= AUTH =================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  loadMessages();
});

// ================= SEND MESSAGE =================
window.sendMsg = async function () {
  const msg = document.getElementById("msg").value;

  if (!msg.trim()) return;

  await addDoc(collection(db, "messages"), {
    text: msg,
    user: currentUser.email,
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });

  document.getElementById("msg").value = "";
};

// ================= REAL-TIME CHAT =================
function loadMessages() {
  const q = query(
    collection(db, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();

      const isMe = data.uid === currentUser.uid;

      chatBox.innerHTML += `
        <div style="
          margin:10px;
          padding:10px;
          border-radius:10px;
          max-width:70%;
          word-wrap:break-word;
          ${isMe 
            ? "margin-left:auto;background:#5bc0be;color:black;" 
            : "background:#0b132b;color:white;"}
        ">
          <b>${data.user}</b><br>
          ${data.text}
        </div>
      `;
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

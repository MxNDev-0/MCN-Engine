import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let otherUid = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";

  me = u;

  loadUsers();
});

/* ================= CHAT ID ================= */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= USERS LIST ================= */
function loadUsers() {
  const q = query(collection(db, "users"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("users");
    box.innerHTML = "";

    snap.forEach(d => {
      const user = d.data();
      const uid = d.id;

      if (uid === me.uid) return;

      box.innerHTML += `
        <div class="user" onclick="openChat('${uid}')">
          <span>${user.name || "User"}</span>
          <span class="online">${user.online ? "🟢" : "⚪"}</span>
        </div>
      `;
    });
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function(uid) {
  otherUid = uid;

  document.getElementById("msgInput").disabled = false;
  document.getElementById("sendBtn").disabled = false;

  loadMessages();
  listenTyping();
};

/* ================= LOAD MESSAGES ================= */
function loadMessages() {
  const id = chatId(me.uid, otherUid);

  const q = query(
    collection(db, "messages", id, "messages"),
    orderBy("time")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chat");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      const isMe = m.sender === me.uid;

      box.innerHTML += `
        <div class="msg ${isMe ? "me" : "other"}">
          ${m.text}<br>
          <small>${m.read ? "✓✓" : "✓"}</small>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || !otherUid) return;

  const id = chatId(me.uid, otherUid);

  await addDoc(collection(db, "messages", id, "messages"), {
    text,
    sender: me.uid,
    time: serverTimestamp(),
    read: false
  });

  await addDoc(collection(db, "notifications", otherUid, "items"), {
    text: "New message received",
    seen: false,
    createdAt: serverTimestamp()
  });

  input.value = "";

  setTyping(false);
};

/* ================= TYPING ================= */
document.getElementById("msgInput").addEventListener("input", () => {
  setTyping(true);
});

async function setTyping(state) {
  if (!otherUid) return;

  await updateDoc(doc(db, "typing", me.uid), {
    typingTo: state ? otherUid : null
  });
}

function listenTyping() {
  const ref = doc(db, "typing", otherUid);

  onSnapshot(ref, (snap) => {
    const data = snap.data();
    const el = document.getElementById("typing");

    if (data?.typingTo === me.uid) {
      el.innerText = "User is typing...";
    } else {
      el.innerText = "";
    }
  });
}

/* ================= ONLINE STATUS ================= */
setInterval(async () => {
  if (!me) return;

  await updateDoc(doc(db, "users", me.uid), {
    online: true,
    lastSeen: serverTimestamp()
  });

}, 10000);
import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let activeChat = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";
  me = u;

  await setPresence();
  loadChatList();
});

/* ================= CHAT ID ================= */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= PRESENCE (REAL PRODUCTION STYLE) ================= */
async function setPresence() {
  const ref = doc(db, "users", me.uid);

  await setDoc(ref, {
    online: true,
    lastSeen: serverTimestamp()
  }, { merge: true });

  onDisconnect(ref).update({
    online: false,
    lastSeen: serverTimestamp()
  });
}

/* ================= CHAT LIST ================= */
function loadChatList() {
  const q = query(collection(db, "chats"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatList");
    box.innerHTML = "";

    snap.forEach(d => {
      const chat = d.data();

      if (!chat.members.includes(me.uid)) return;

      const other = chat.members.find(u => u !== me.uid);

      box.innerHTML += `
        <div class="chat-item" onclick="openChat('${other}')">
          <div class="chat-name">${other}</div>
          <div class="chat-last">${chat.lastMessage || ""}</div>
        </div>
      `;
    });
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function(uid) {
  activeChat = chatId(me.uid, uid);

  document.getElementById("msgInput").disabled = false;
  document.getElementById("sendBtn").disabled = false;

  loadMessages();
  listenTyping(uid);
};

/* ================= LOAD MESSAGES ================= */
function loadMessages() {
  const q = query(
    collection(db, "chats", activeChat, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      const isMe = m.senderId === me.uid;

      box.innerHTML += `
        <div class="msg ${isMe ? "me" : "other"}">
          ${m.text}<br>
          <small>${renderStatus(m)}</small>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;

    markAsRead(snap);
  });
}

/* ================= STATUS ENGINE ================= */
function renderStatus(m) {
  if (m.readBy?.length > 1) return "✓✓";
  if (m.delivered) return "✓✓";
  return "✓";
}

/* ================= SEND MESSAGE ================= */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || !activeChat) return;

  const msgRef = await addDoc(collection(db, "chats", activeChat, "messages"), {
    text,
    senderId: me.uid,
    createdAt: serverTimestamp(),
    delivered: false,
    readBy: [me.uid]
  });

  await setDoc(doc(db, "chats", activeChat), {
    members: [me.uid],
    lastMessage: text,
    lastUpdated: serverTimestamp()
  }, { merge: true });

  input.value = "";
  setTyping(false);
};

/* ================= READ RECEIPTS ================= */
function markAsRead(snap) {
  snap.forEach(async (d) => {
    const data = d.data();

    if (data.senderId !== me.uid) {
      await updateDoc(doc(db, "chats", activeChat, "messages", d.id), {
        delivered: true,
        readBy: arrayUnion(me.uid)
      });
    }
  });
}

/* ================= TYPING SYSTEM ================= */
document.getElementById("msgInput").addEventListener("input", () => {
  setTyping(true);

  clearTimeout(window.typingTimer);

  window.typingTimer = setTimeout(() => {
    setTyping(false);
  }, 1200);
});

async function setTyping(state) {
  if (!activeChat) return;

  await setDoc(doc(db, "typing", me.uid), {
    chatId: activeChat,
    typing: state
  });
}

/* ================= LISTEN TYPING ================= */
function listenTyping(uid) {
  const ref = doc(db, "typing", uid);

  onSnapshot(ref, (snap) => {
    const data = snap.data();
    const el = document.getElementById("typing");

    if (data?.chatId === activeChat && data?.typing) {
      el.innerText = "typing...";
    } else {
      el.innerText = "";
    }
  });
}
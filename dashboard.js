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
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let userData = null;
let isAdmin = false;
let replyTo = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

  loadUsers();
  loadChatV12();
  setupTyping();
});

/* ================= USER ================= */
async function ensureUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: user.email.split("@")[0],
      role: "user"
    });
  }
}

async function loadUser() {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) userData = snap.data();
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";
    snap.forEach(d => {
      const u = d.data();
      box.innerHTML += `<div class="user-item">🟢 ${u.username || "user"}</div>`;
    });
  });
}

/* ================= CHAT V12 ================= */
function loadChatV12() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, async (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data();
      const id = d.id;

      const isMe = m.uid === user.uid;

      const seen = m.seenBy?.length > 1;

      html += `
        <div style="margin:10px 0;padding:6px;border-radius:8px;background:#1c2541;">

          <div style="font-size:11px;opacity:0.6;">
            ${m.user}
          </div>

          <div style="font-size:13px;margin:5px 0;">
            ${m.replyText ? `<div style="font-size:11px;opacity:0.6;">↪ ${m.replyText}</div>` : ""}
            ${m.text}
          </div>

          <div style="font-size:10px;opacity:0.5;">
            ${m.time?.toDate?.().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) || ""}
            ${isMe ? (seen ? " ✓✓" : " ✓") : ""}
          </div>

          <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;">
            <button onclick="likeMsg('${id}')">👍 ${(m.likes || []).length}</button>
            <button onclick="setReply('${id}', \`${m.text}\`)">Reply</button>

            ${isMe ? `<button onclick="editMsg('${id}', \`${m.text}\`)">Edit</button>` : ""}
            ${(isMe || isAdmin) ? `<button onclick="deletePost('${id}')">Delete</button>` : ""}
          </div>

        </div>
      `;

      /* ✅ MARK AS SEEN */
      if (!m.seenBy?.includes(user.uid)) {
        updateDoc(doc(db, "posts", id), {
          seenBy: [...(m.seenBy || []), user.uid]
        });
      }
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  });

  /* ================= TYPING INDICATOR ================= */
  const typingBox = document.getElementById("typingBox");

  onSnapshot(collection(db, "typing"), (snap) => {
    let typingUsers = [];

    snap.forEach(d => {
      const t = d.data();
      if (t.uid !== user.uid && t.typing) {
        typingUsers.push(t.username);
      }
    });

    if (typingBox) {
      typingBox.innerText = typingUsers.length
        ? typingUsers.join(", ") + " typing..."
        : "";
    }
  });
}

/* ================= SEND ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  input.value = "";

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    uid: user.uid,
    time: serverTimestamp(),
    replyText: replyTo ? replyTo.text : null,
    likes: [],
    seenBy: [user.uid]
  });

  replyTo = null;
  stopTyping();
};

/* ================= TYPING SYSTEM ================= */
function setupTyping() {
  const input = document.getElementById("chatInput");
  if (!input) return;

  input.addEventListener("input", () => {
    setDoc(doc(db, "typing", user.uid), {
      uid: user.uid,
      username: user.email.split("@")[0],
      typing: true
    });

    clearTimeout(window.typingTimeout);

    window.typingTimeout = setTimeout(() => {
      stopTyping();
    }, 2000);
  });
}

function stopTyping() {
  setDoc(doc(db, "typing", user.uid), {
    uid: user.uid,
    username: user.email.split("@")[0],
    typing: false
  });
}

/* ================= LIKE ================= */
window.likeMsg = async function (id) {
  const ref = doc(db, "posts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const likes = data.likes || [];

  const updated = likes.includes(user.uid)
    ? likes.filter(l => l !== user.uid)
    : [...likes, user.uid];

  await updateDoc(ref, { likes: updated });
};

/* ================= REPLY ================= */
window.setReply = function (id, text) {
  replyTo = { id, text };

  const box = document.getElementById("replyBox");
  if (!box) return;

  box.style.display = "block";
  document.getElementById("replyText").innerText = text;
};

window.cancelReply = function () {
  replyTo = null;
  document.getElementById("replyBox").style.display = "none";
};

/* ================= EDIT ================= */
window.editMsg = async function (id, oldText) {
  const newText = prompt("Edit message:", oldText);
  if (!newText) return;

  await updateDoc(doc(db, "posts", id), {
    text: newText
  });
};

/* ================= DELETE ================= */
window.deletePost = async function (id) {
  try {
    await deleteDoc(doc(db, "posts", id));
  } catch (e) {
    alert("Delete failed");
  }
};

/* ================= MENU ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("menu");
  if (menu) menu.classList.toggle("active");
};

window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= NAV ================= */
window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdSpace = () => location.href = "ads.html";
window.goBlog = () => location.href = "blog/index.html";
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.support = () => alert("Support coming soon");

window.goAdmin = () => {
  if (!userData) return alert("Loading...");
  if (!isAdmin) return alert("❌ Admin only");
  location.href = "admin.html";
};

window.openDeveloper = () => {
  alert("Developer tools coming soon");
};
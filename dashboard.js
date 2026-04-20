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
  deleteDoc,
  arrayUnion,
  arrayRemove
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

  loadChatV11();
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

/* ================= CHAT V11 ================= */
function loadChatV11() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data();
      const id = d.id;

      const userName = m.user || "user";
      const text = m.text || "";
      const likes = m.likes || [];

      const time = m.time?.toDate?.().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }) || "";

      const isMe = userName === user.email.split("@")[0];

      html += `
        <div style="margin:10px 0;padding:6px;border-radius:8px;background:#1c2541;">

          <div style="font-size:11px;opacity:0.6;">
            ${userName}
          </div>

          <div style="font-size:13px;margin:5px 0;">
            ${m.replyText ? `<div style="font-size:11px;opacity:0.6;">↪ ${m.replyText}</div>` : ""}
            ${text}
          </div>

          <div style="font-size:10px;opacity:0.5;">
            ${time}
          </div>

          <!-- ACTIONS -->
          <div style="margin-top:5px;display:flex;gap:8px;flex-wrap:wrap;">

            <button onclick="likeMsg('${id}')">
              👍 ${likes.length}
            </button>

            <button onclick="setReply('${id}', \`${text}\`)">
              💬 Reply
            </button>

            ${isMe ? `
              <button onclick="editMsg('${id}', \`${text}\`)">
                ✏️ Edit
              </button>
            ` : ""}

            ${isAdmin ? `
              <button onclick="deletePost('${id}')">
                🗑 Delete
              </button>
            ` : ""}

          </div>

        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  input.value = "";

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp(),
    replyTo: replyTo || null,
    replyText: replyTo ? replyTo.text : null,
    likes: []
  });

  replyTo = null;
  document.getElementById("replyBox").style.display = "none";
};

/* ================= LIKE SYSTEM ================= */
window.likeMsg = async function (id) {
  const ref = doc(db, "posts", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();
  const likes = data.likes || [];

  const uid = user.uid;

  const updated = likes.includes(uid)
    ? likes.filter(l => l !== uid)
    : [...likes, uid];

  await updateDoc(ref, { likes: updated });
};

/* ================= REPLY ================= */
window.setReply = function (id, text) {
  replyTo = { id, text };

  document.getElementById("replyBox").style.display = "block";
  document.getElementById("replyText").innerText = text;
};

window.cancelReply = function () {
  replyTo = null;
  document.getElementById("replyBox").style.display = "none";
};

/* ================= EDIT MESSAGE ================= */
window.editMsg = async function (id, oldText) {
  const newText = prompt("Edit message:", oldText);
  if (!newText) return;

  await updateDoc(doc(db, "posts", id), {
    text: newText
  });
};

/* ================= DELETE ================= */
window.deletePost = async function (id) {
  if (!isAdmin) return alert("Admin only");

  try {
    await deleteDoc(doc(db, "posts", id));
  } catch (e) {
    alert("Delete failed");
  }
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};
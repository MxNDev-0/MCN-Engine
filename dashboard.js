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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const API = "https://mxm-backend.onrender.com";

let user = null;
let userData = null;
let isAdmin = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

  loadUsers();
  loadChatV9();
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

/* ================= CHAT ================= */
function loadChatV9() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data();
      const time = m.time?.toDate?.().toLocaleTimeString() || "";

      html += `
        <div style="margin:6px 0;padding:6px;background:#1c2541;border-radius:6px;">
          <b>${m.user}</b>: ${m.text}
          <div style="font-size:10px;opacity:0.5;">${time}</div>
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp()
  });

  input.value = "";
};

/* ================= MENU ================= */
window.toggleMenu = function () {
  document.getElementById("menu").classList.toggle("active");
};

window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdSpace = () => location.href = "ads.html";
window.support = () => alert("Support coming soon");
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goBlog = () => location.href = "blog/index.html";

window.goAdmin = () => {
  if (!userData) return alert("Loading...");
  if (!isAdmin) return alert("❌ Admin only");
  location.href = "admin.html";
};

/* ================= PRICE ALERT SYSTEM ================= */

let activeAlerts = [];

window.setPriceAlert = function () {
  const coin = document.getElementById("alertCoin").value;
  const price = parseFloat(document.getElementById("alertPrice").value);

  if (!price || price <= 0) {
    alert("Enter valid price");
    return;
  }

  activeAlerts.push({ coin, price });

  document.getElementById("alertStatus").innerHTML =
    `🔔 Alert set for ${coin.toUpperCase()} at $${price}`;
};

async function checkAlerts() {
  if (activeAlerts.length === 0) return;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd"
    );

    const data = await res.json();

    activeAlerts.forEach((alert, i) => {
      const current = data[alert.coin]?.usd;

      if (current && current >= alert.price) {
        triggerAlert(alert.coin, current);
        activeAlerts.splice(i, 1);
      }
    });

  } catch (e) {}
}

function triggerAlert(coin, price) {
  document.getElementById("alertStatus").innerHTML =
    `🚨 ${coin.toUpperCase()} reached $${price}`;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Price Alert", {
      body: `${coin.toUpperCase()} is now $${price}`
    });
  }
}

if ("Notification" in window) {
  Notification.requestPermission();
}

setInterval(checkAlerts, 10000);
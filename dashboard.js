import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDoc,
  setDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let userData = null;
let lastBTC = null;
let lastETH = null;

/* ================= MONITOR LOGGER ================= */
function monitorLog(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= CHAT → MONITOR ================= */
function loadChatToMonitor() {
  const q = query(
    collection(db, "chats/messages"),
    orderBy("timestamp", "asc")
  );

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const msg = change.doc.data();
        monitorLog(`💬 ${msg.username}: ${msg.text}`);
      }
    });
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  await addDoc(collection(db, "chats/messages"), {
    text,
    uid: user.uid,
    username: userData?.username || "User",
    timestamp: serverTimestamp()
  });

  input.value = "";
};

/* AUTH */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await ensureUser();
  await loadUser();

  loadPrices();
  loadNotifications();
  loadBroadcasts();
  loadChatToMonitor(); // ✅ CHAT IN MONITOR
  startLiveSystem();
});

/* USER */
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

/* ================= BROADCAST ================= */
function loadBroadcasts() {
  const box = document.getElementById("broadcastBox");
  if (!box) return;

  const q = query(
    collection(db, "broadcasts"),
    where("active", "==", true),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    box.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();

      box.innerHTML += `
        <div class="item">
          <b>🔔 ${data.title}</b><br>
          ${data.message}
        </div>
      `;
    });
  });
}

/* PRICES */
async function loadPrices() {
  const box = document.getElementById("priceBox");

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    const data = await res.json();

    box.innerHTML = `
      BTC: $${data.bitcoin.usd}<br>
      ETH: $${data.ethereum.usd}
    `;

    checkPriceChange(data);

  } catch {
    box.innerText = "Failed to load prices";
  }
}

function checkPriceChange(data) {
  if (lastBTC && lastETH) {
    if (data.bitcoin.usd !== lastBTC) {
      sendNotification("BTC price changed!");
    }
    if (data.ethereum.usd !== lastETH) {
      sendNotification("ETH price changed!");
    }
  }

  lastBTC = data.bitcoin.usd;
  lastETH = data.ethereum.usd;
}

/* LOOP */
function startLiveSystem() {
  setInterval(loadPrices, 30000);
}

/* NOTIFICATIONS */
function loadNotifications() {
  const panel = document.getElementById("notifPanel");
  const badge = document.getElementById("notifCount");

  onSnapshot(collection(db, "notifications", user.uid, "items"), (snap) => {
    let count = 0;
    let html = "";

    snap.forEach(d => {
      const n = d.data();
      if (!n.seen) count++;
      html += `<div>🔔 ${n.text}</div>`;
    });

    panel.innerHTML = html;

    badge.style.display = count > 0 ? "inline-block" : "none";
    badge.innerText = count;
  });
}

/* SEND NOTIFICATION */
async function sendNotification(text) {
  await addDoc(collection(db, "notifications", user.uid, "items"), {
    text,
    seen: false,
    createdAt: serverTimestamp()
  });
}

/* NAV */
window.toggleMenu = () => document.getElementById("menu").classList.toggle("active");

window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};
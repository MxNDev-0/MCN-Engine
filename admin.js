import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc, updateDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ADMIN GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
  } else {
    log("✅ Admin authenticated");
  }
});

/* ================= MONITOR ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  box.innerHTML += `[${time}] ${msg}<br>`;
  box.scrollTop = box.scrollHeight;
}

/* ================= BLOG ================= */
window.createBlog = async () => {
  const title = blogTitle.value;
  const content = blogContent.value;
  const image = blogImage.value;

  if (!title || !content) return alert("Fill fields");

  try {
    const res = await fetch("https://mxm-backend.onrender.com/blog/create", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ title, content, image })
    });

    const data = await res.json();

    if (data.success) {
      alert("Blog posted ✅");

      blogTitle.value = "";
      blogContent.value = "";
      blogImage.value = "";

      log("📝 Blog created: " + title);
    } else {
      alert("Failed to post blog");
      log("❌ Blog failed");
    }

  } catch (err) {
    console.error(err);
    log("❌ Blog error");
  }
};

/* ================= AD REQUESTS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          ${ad.title || "No title"}<br>
          Status: ${ad.status || "pending"}<br>

          <button onclick="approveAd('${d.id}')">Approve</button>
          <button onclick="rejectAd('${d.id}')">Reject</button>
        </div>
      `;
    });

    const stat = document.getElementById("statRequests");
    if (stat) stat.innerText = snap.size;
  });

  log("📢 Ad requests loaded");
}

/* ================= APPROVE ================= */
window.approveAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), {
    status: "approved"
  });

  log("✅ Ad approved");
};

/* ================= REJECT ================= */
window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), {
    status: "rejected"
  });

  log("❌ Ad rejected");
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div class="item">
          ${u.email || "user"}
        </div>
      `;
    });

    const stat = document.getElementById("statUsers");
    if (stat) stat.innerText = snap.size;
  });

  log("👥 Users loaded");
}

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="item">
          ${p.text}
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });

  log("💬 Posts loaded");
}

/* ================= DELETE ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("🗑 Post deleted");
};

/* ================= CLEAR ================= */
window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  log("🔥 All posts cleared");
};

/* ================= ANALYTICS ================= */
window.loadStats = async () => {
  const blogs = await getDocs(collection(db, "blogs"));
  const ads = await getDocs(collection(db, "ads"));

  let clicks = 0;
  ads.forEach(d => clicks += d.data().clicks || 0);

  document.getElementById("statViews").innerText = blogs.size;
  document.getElementById("statClicks").innerText = clicks;

  log("📊 Stats updated");
};

/* ================= INIT ================= */
loadUsers();
loadPosts();
loadAdRequests();

log("🚀 Admin system ready");
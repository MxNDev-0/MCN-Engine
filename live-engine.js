import { db } from "./firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MCN LIVE EVENT ENGINE ================= */
class MCNLiveEngine {
  constructor(userId) {
    this.userId = userId;
    this.listeners = [];
  }

  start() {
    this.listenNotifications();
    this.listenBlogUpdates();
    this.listenCryptoAlerts();
  }

  /* 🔔 NOTIFICATIONS (DM, system, blog, crypto) */
  listenNotifications() {
    const ref = collection(db, "notifications", this.userId, "items");

    onSnapshot(ref, (snap) => {
      let unread = 0;

      snap.forEach(doc => {
        if (!doc.data().seen) unread++;
      });

      this.emit("notifications", {
        unread
      });
    });
  }

  /* 📰 BLOG / DISCOVER UPDATES */
  listenBlogUpdates() {
    const ref = collection(db, "blog");

    onSnapshot(ref, () => {
      this.emit("blog-update", {
        updated: true
      });
    });
  }

  /* 💰 CRYPTO ALERT SYSTEM (placeholder hook) */
  listenCryptoAlerts() {
    const ref = collection(db, "crypto-alerts");

    onSnapshot(ref, (snap) => {
      snap.forEach(doc => {
        this.emit("crypto", doc.data());
      });
    });
  }

  /* EVENT BUS */
  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  emit(event, data) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }
}

window.MCNLiveEngine = MCNLiveEngine;
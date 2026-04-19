import { auth } from "../firebase.js";
import { db } from "../firebase.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let isPremiumUser = false;
let isChecked = false;

/* ================= GLOBAL AUTH CHECK ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    alert("Please login first");
    location.href = "../index.html";
    return;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();

      // store premium state safely
      isPremiumUser = data.premium === true;
    } else {
      isPremiumUser = false;
    }

    isChecked = true;

    console.log("LOCK CHECK COMPLETE:", {
      user: user.uid,
      premium: isPremiumUser
    });

  } catch (err) {
    console.error("Lock check error:", err);

    // IMPORTANT: do NOT block app on error
    isPremiumUser = false;
    isChecked = true;
  }
});

/* ================= GLOBAL HELPER ================= */
/*
Use this inside your earning pages ONLY
NOT dashboard, NOT chat
*/
window.requirePremium = function () {

  if (!isChecked) {
    alert("System still loading...");
    return false;
  }

  if (!isPremiumUser) {
    alert("⚠️ Premium required to access this feature.");
    return false;
  }

  return true;
};
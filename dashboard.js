import {
  auth,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

// 🔥 block access if not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// logout
window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

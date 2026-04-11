import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

/* GLOBAL LOGIN STATE */
window.isLoggedIn = false;

/* WAIT FOR PAGE LOAD */
window.addEventListener("DOMContentLoaded", () => {

  /* SIGNUP */
  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const email = document.getElementById("signupEmail").value;
      const pass = document.getElementById("signupPass").value;

      if (!email || !pass) {
        alert("Fill all fields");
        return;
      }

      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        alert("Account created successfully");
        document.getElementById("signupModal").style.display = "none";
      } catch (e) {
        alert(e.message);
      }
    });
  }

  /* LOGIN */
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail").value;
      const pass = document.getElementById("loginPass").value;

      if (!email || !pass) {
        alert("Fill all fields");
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Login successful");
        document.getElementById("loginModal").style.display = "none";
      } catch (e) {
        alert("Login failed: " + e.message);
      }
    });
  }

});

/* AUTH STATE CONTROL */
onAuthStateChanged(auth, (user) => {

  const dashboard = document.getElementById("dashboard");

  if (user) {
    window.isLoggedIn = true;

    if (dashboard) {
      dashboard.style.display = "block";
    }

  } else {
    window.isLoggedIn = false;

    if (dashboard) {
      dashboard.style.display = "none";
    }
  }

});

/* LOGOUT */
window.logout = async () => {
  await signOut(auth);
  alert("Logged out");
};

/* RESET PASSWORD */
window.resetPassword = async () => {
  const email = document.getElementById("loginEmail").value;

  if (!email) {
    alert("Enter your email first");
    return;
  }

  try {
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent");
  } catch (e) {
    alert(e.message);
  }
};

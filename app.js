// REGISTER
function register(){
  const firstName = document.getElementById("firstName").value;
  const surname = document.getElementById("surname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const error = document.getElementById("error");

  error.textContent = "";

  if(password !== confirmPassword){
    error.textContent = "Passwords do not match!";
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
  .then(userCred => {
    return db.collection("users").doc(userCred.user.uid).set({
      firstName,
      surname,
      email,
      isAdmin:false
    });
  })
  .catch(err => error.textContent = err.message);
}

// LOGIN
function login(){
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
  .catch(err => document.getElementById("error").textContent = err.message);
}

// LOGOUT
function logout(){
  auth.signOut();
}

// KEEP USER LOGGED IN (FIXES YOUR MAIN PROBLEM)
auth.onAuthStateChanged(user => {
  if(user){
    document.getElementById("auth").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    db.collection("users").doc(user.uid).get().then(doc=>{
      const data = doc.data();
      document.getElementById("welcome").innerText =
        "Welcome " + data.firstName;

      // ADMIN CHECK
      if(data.isAdmin === true){
        document.getElementById("adminPanel").style.display = "block";
      }
    });

  } else {
    document.getElementById("auth").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

// SEND MESSAGE
function sendMessage(){
  const msg = document.getElementById("message").value;
  const user = auth.currentUser;

  db.collection("messages").add({
    text: msg,
    email: user.email,
    createdAt: new Date()
  }).then(()=>{
    alert("Message sent!");
  });
}

// ADMIN: VIEW MESSAGES
function loadMessages(){
  const box = document.getElementById("messages");
  box.innerHTML = "";

  db.collection("messages").orderBy("createdAt","desc").get()
  .then(snapshot=>{
    snapshot.forEach(doc=>{
      const m = doc.data();
      box.innerHTML += `<p><b>${m.email}</b>: ${m.text}</p>`;
    });
  });
        }

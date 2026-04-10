import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection
} from "./firebase.js";

// POPUP
function show(msg){
  const p = document.getElementById("popup");
  p.innerText = msg;
  p.style.display="block";
  setTimeout(()=>p.style.display="none",3000);
}

// REGISTER
window.register = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  if(pass !== confirm){
    show("Passwords do not match");
    return;
  }

  try {
    const user = await createUserWithEmailAndPassword(auth,email,pass);
    await setDoc(doc(db,"users",user.user.uid),{
      email
    });
    show("Account created!");
  } catch(e){
    show(e.message);
  }
};

// LOGIN
window.login = async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("loginEmail").value,
      document.getElementById("loginPassword").value
    );
  } catch(e){
    show("Wrong login details");
  }
};

// SESSION
onAuthStateChanged(auth,(user)=>{
  if(user){
    document.getElementById("auth").style.display="none";
    document.getElementById("dashboard").style.display="block";
  } else {
    document.getElementById("auth").style.display="block";
    document.getElementById("dashboard").style.display="none";
  }
});

// LOGOUT
window.logout = ()=> signOut(auth);

// MODAL
let link="";
window.openModal = (type)=>{
  const m = document.getElementById("modal");

  if(type==="earn"){
    document.getElementById("modalTitle").innerText="Free Earning Platform";
    document.getElementById("modalText").innerText="Earn money without investment.";
    link="https://forfans.me/chichiguy";
  }

  if(type==="float"){
    document.getElementById("modalTitle").innerText="FixedFloat";
    document.getElementById("modalText").innerText="Instant crypto exchange.";
    link="https://ff.io/?ref=s1nep47a";
  }

  m.style.display="block";
};

window.closeModal = ()=> document.getElementById("modal").style.display="none";
window.goLink = ()=> window.open(link,"_blank");

// MESSAGE
window.sendMessage = async ()=>{
  const msg = document.getElementById("message");

  if(!msg.value){
    show("Empty message");
    return;
  }

  await addDoc(collection(db,"messages"),{
    text:msg.value,
    time:new Date()
  });

  msg.value="";
  show("Message sent!");
};

// PREMIUM
window.premium = ()=> alert("Coming soon 🚧");

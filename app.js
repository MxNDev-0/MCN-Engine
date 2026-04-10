import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  addDoc,
  collection
} from "./firebase.js";

let user = null;

/* SIGNUP */
window.signup = async ()=>{
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPass").value;

  try{
    await createUserWithEmailAndPassword(auth,email,pass);
    alert("Account created successfully");
  }catch(e){
    alert(e.message);
  }
};

/* LOGIN */
window.login = async ()=>{
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;

  try{
    await signInWithEmailAndPassword(auth,email,pass);
    alert("Login successful");
  }catch(e){
    alert("Wrong login details");
  }
};

/* SESSION CONTROL (IMPORTANT FIX) */
onAuthStateChanged(auth,(u)=>{
  user = u;

  if(u){
    document.getElementById("dashboard").style.display="block";
  }else{
    document.getElementById("dashboard").style.display="none";
  }
});

/* TRACK CLICK (AFFILIATE SYSTEM BASE) */
window.trackClick = async (type)=>{

  if(!user){
    alert("Login required");
    return;
  }

  let link = "";

  if(type==="forfans"){
    link = "https://forfans.me/chichiguy";
  }

  if(type==="fixedfloat"){
    link = "https://ff.io/?ref=s1nep47a";
  }

  await addDoc(collection(db,"clicks"),{
    uid:user.uid,
    type,
    link,
    time:new Date()
  });

  window.open(link,"_blank");
};

/* LOGOUT */
window.logout = ()=>signOut(auth);

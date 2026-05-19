import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* =========================
   FIREBASE CONFIG
========================= */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChlqPz19QeeImmQSt4oWdAluD6XbWch8g",
  authDomain: "webletter-7f64a.firebaseapp.com",
  databaseURL: "https://webletter-7f64a-default-rtdb.firebaseio.com",
  projectId: "webletter-7f64a",
  storageBucket: "webletter-7f64a.firebasestorage.app",
  messagingSenderId: "316842154834",
  appId: "1:316842154834:web:e88b9335861ca97f8f388b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   LOGIN
========================= */

async function login() {

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {

    await signInWithEmailAndPassword(auth, email, password);

    const userRef = doc(db, "users", email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User not found in database");
      return;
    }

    const role = userSnap.data().role;

    localStorage.setItem("email", email);

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "teacher.html";
    }

  } catch (error) {
    alert(error.message);
  }
}

/* =========================
   LOGOUT
========================= */

async function logout() {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "index.html";
}

/* =========================
   LOAD TEACHERS (ADMIN)
========================= */

async function loadTeachers() {

  const snapshot = await getDocs(collection(db, "users"));

  const select = document.getElementById("teacherSelect");
  select.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.role === "teacher") {
      const option = document.createElement("option");
      option.value = data.email;
      option.textContent = data.email;
      select.appendChild(option);
    }
  });

  loadSelectedTeacherMessage();
}

/* =========================
   ADD TEACHER
========================= */

async function addTeacher() {

  const email = document.getElementById("newTeacherEmail").value;
  const password = document.getElementById("newTeacherPassword").value;

  try {

    await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", email), {
      email,
      role: "teacher"
    });

    await setDoc(doc(db, "messages", email), {
      teacher_email: email,
      message: "No message yet."
    });

    alert("Teacher added successfully!");

    loadTeachers();

  } catch (error) {
    alert(error.message);
  }
}

/* =========================
   LOAD SELECTED MESSAGE (ADMIN)
========================= */

async function loadSelectedTeacherMessage() {

  const teacherEmail = document.getElementById("teacherSelect").value;

  if (!teacherEmail) return;

  const snap = await getDoc(doc(db, "messages", teacherEmail));

  if (snap.exists()) {
    document.getElementById("messageInput").value =
      snap.data().message;
  }
}

/* =========================
   UPDATE MESSAGE (ADMIN)
========================= */

async function updateMessage() {

  const teacherEmail = document.getElementById("teacherSelect").value;
  const message = document.getElementById("messageInput").value;

  try {

    await updateDoc(doc(db, "messages", teacherEmail), {
      message
    });

    alert("Message updated!");

  } catch (error) {
    alert(error.message);
  }
}

/* =========================
   TEACHER VIEW
========================= */

async function loadTeacherMessage() {

  const email = localStorage.getItem("email");

  document.getElementById("teacherEmail").innerText = email;

  const snap = await getDoc(doc(db, "messages", email));

  if (snap.exists()) {
    document.getElementById("teacherMessage").innerText =
      snap.data().message;
  }
}

/* =========================
   GLOBAL FUNCTIONS (IMPORTANT)
========================= */

window.login = login;
window.logout = logout;
window.loadTeachers = loadTeachers;
window.addTeacher = addTeacher;
window.loadSelectedTeacherMessage = loadSelectedTeacherMessage;
window.updateMessage = updateMessage;
window.loadTeacherMessage = loadTeacherMessage;
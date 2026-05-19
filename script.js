import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { adminPassword, firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const SESSION_KEY = "pm_username";

let adminUsers = [];
let adminSelectedId = null;

function byId(id) {
  return document.getElementById(id);
}

function normalizeName(value) {
  return value.trim().toLowerCase();
}

function showStatus(elementId, message, isError) {
  const el = byId(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-error", Boolean(isError));
}

function setLoader(id, isVisible) {
  const el = byId(id);
  if (!el) return;
  el.style.display = isVisible ? "flex" : "none";
}

async function loginByName() {
  const nameInput = byId("loginName");
  if (!nameInput) return;
  const rawName = nameInput.value;
  const normalized = normalizeName(rawName);

  if (!normalized) {
    showStatus("loginStatus", "Please enter your name.", true);
    return;
  }

  showStatus("loginStatus", "Checking your message...", false);
  setLoader("authLoader", true);

  try {
    const userSnap = await getDoc(doc(db, "users", normalized));
    if (!userSnap.exists()) {
      showStatus("loginStatus", "No personalized message found.", true);
      setLoader("authLoader", false);
      return;
    }

    localStorage.setItem(SESSION_KEY, normalized);
    localStorage.setItem("pm_displayName", userSnap.data().name || rawName.trim());
    window.location.href = "dashboard.html";
  } catch (error) {
    showStatus("loginStatus", error.message, true);
  } finally {
    setLoader("authLoader", false);
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("pm_displayName");
  window.location.href = "index.html";
}

async function loadDashboard() {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) {
    window.location.href = "index.html";
    return;
  }

  setLoader("dashboardLoader", true);
  showStatus("dashboardStatus", "", false);

  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) {
      showStatus("dashboardStatus", "No personalized message found.", true);
      return;
    }

    const data = snap.data();
    const displayName = data.name || localStorage.getItem("pm_displayName") || userId;

    const welcomeName = byId("welcomeName");
    if (welcomeName) welcomeName.textContent = displayName;

    const welcomeMeta = byId("welcomeMeta");
    if (welcomeMeta) welcomeMeta.textContent = data.section ? data.section : "";

    const messageText = byId("messageText");
    if (messageText) messageText.textContent = data.message || "";

    const adviserText = byId("adviserText");
    if (adviserText) adviserText.textContent = data.adviser || "-";

    const sectionText = byId("sectionText");
    if (sectionText) sectionText.textContent = data.section || "-";

    const imageEl = byId("profileImage");
    if (imageEl) {
      if (data.image) {
        imageEl.src = data.image;
        imageEl.style.display = "block";
      } else {
        imageEl.style.display = "none";
      }
    }
  } catch (error) {
    showStatus("dashboardStatus", error.message, true);
  } finally {
    setLoader("dashboardLoader", false);
  }
}

function initAdmin() {
  const gate = byId("adminGate");
  if (!gate) {
    loadAdminData();
    return;
  }

  gate.style.display = "flex";
  gate.setAttribute("aria-hidden", "false");
  showStatus("adminGateStatus", "", false);
}

function unlockAdmin() {
  const input = byId("adminPasswordInput");
  if (!input) return;
  const value = input.value.trim();

  if (!value) {
    showStatus("adminGateStatus", "Enter the admin password.", true);
    return;
  }

  if (value !== adminPassword) {
    showStatus("adminGateStatus", "Incorrect password.", true);
    return;
  }

  const gate = byId("adminGate");
  if (gate) {
    gate.style.display = "none";
    gate.setAttribute("aria-hidden", "true");
  }
  loadAdminData();
}

async function loadAdminData() {
  setLoader("adminLoader", true);
  try {
    const snapshot = await getDocs(collection(db, "users"));
    adminUsers = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderUserList(adminUsers);
  } catch (error) {
    showStatus("adminStatus", error.message, true);
  } finally {
    setLoader("adminLoader", false);
  }
}

function renderUserList(users) {
  const list = byId("userList");
  if (!list) return;
  list.innerHTML = "";

  if (!users.length) {
    list.innerHTML = "<p class='empty'>No users found.</p>";
    return;
  }

  users.forEach((user) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    button.textContent = user.name ? user.name + " (" + user.id + ")" : user.id;
    button.onclick = () => selectUser(user);
    list.appendChild(button);
  });
}

function selectUser(user) {
  adminSelectedId = user.id;
  byId("adminName").value = user.id || "";
  byId("adminDisplayName").value = user.name || "";
  byId("adminMessage").value = user.message || "";
  byId("adminImage").value = user.image || "";
  byId("adminAdviser").value = user.adviser || "";
  byId("adminSection").value = user.section || "";
  showStatus("adminStatus", "Editing " + (user.name || user.id) + ".", false);
}

function clearAdminForm() {
  adminSelectedId = null;
  const fields = [
    "adminName",
    "adminDisplayName",
    "adminMessage",
    "adminImage",
    "adminAdviser",
    "adminSection"
  ];
  fields.forEach((id) => {
    const el = byId(id);
    if (el) el.value = "";
  });
  showStatus("adminStatus", "", false);
}

async function saveUser() {
  const rawId = byId("adminName").value;
  const id = normalizeName(rawId);
  if (!id) {
    showStatus("adminStatus", "Name is required.", true);
    return;
  }

  const payload = {
    name: byId("adminDisplayName").value.trim() || rawId.trim(),
    message: byId("adminMessage").value.trim(),
    image: byId("adminImage").value.trim(),
    adviser: byId("adminAdviser").value.trim(),
    section: byId("adminSection").value.trim()
  };

  setLoader("adminLoader", true);
  try {
    await setDoc(doc(db, "users", id), payload, { merge: true });
    showStatus("adminStatus", "User saved.", false);
    await loadAdmin();
    const saved = adminUsers.find((user) => user.id === id);
    if (saved) selectUser(saved);
  } catch (error) {
    showStatus("adminStatus", error.message, true);
  } finally {
    setLoader("adminLoader", false);
  }
}

async function deleteUser() {
  const rawId = byId("adminName").value;
  const id = normalizeName(rawId);
  if (!id) {
    showStatus("adminStatus", "Select a user to delete.", true);
    return;
  }

  setLoader("adminLoader", true);
  try {
    await deleteDoc(doc(db, "users", id));
    showStatus("adminStatus", "User deleted.", false);
    clearAdminForm();
    await loadAdmin();
  } catch (error) {
    showStatus("adminStatus", error.message, true);
  } finally {
    setLoader("adminLoader", false);
  }
}

function filterUsers() {
  const query = byId("adminSearch").value.trim().toLowerCase();
  const filtered = adminUsers.filter((user) => {
    const name = (user.name || "").toLowerCase();
    return user.id.includes(query) || name.includes(query);
  });
  renderUserList(filtered);
}

window.loginByName = loginByName;
window.logout = logout;
window.loadDashboard = loadDashboard;
window.initAdmin = initAdmin;
window.unlockAdmin = unlockAdmin;
window.saveUser = saveUser;
window.deleteUser = deleteUser;
window.clearAdminForm = clearAdminForm;
window.filterUsers = filterUsers;
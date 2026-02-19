import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "stst-tasks.firebaseapp.com",
  projectId: "stst-tasks",
  storageBucket: "stst-tasks.firebasestorage.app",
  messagingSenderId: "988063492667",
  appId: "1:988063492667:web:a7d3ee4833b087d1d30a1e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const totalCount = document.getElementById("totalCount");
const doneCount = document.getElementById("doneCount");
const remainingCount = document.getElementById("remainingCount");
const themeToggle = document.getElementById("themeToggle");


// --------------------
// DARK MODE
// --------------------
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀";
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙";
  }
});


// --------------------
// ADD TASK
// --------------------
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "tasks"), {
    text: text,
    done: false
  });

  taskInput.value = "";
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});


// --------------------
// REALTIME LISTENER
// --------------------
onSnapshot(collection(db, "tasks"), (snapshot) => {
  taskList.innerHTML = "";

  let total = 0;
  let completed = 0;

  snapshot.forEach((taskDoc) => {
    total++;
    const task = taskDoc.data();
    if (task.done) completed++;

    const li = document.createElement("li");

    li.innerHTML = `
      <span class="task-text ${task.done ? "done" : ""}">
        ${task.text}
      </span>
      <div class="actions">
        <button onclick="toggleTask('${taskDoc.id}', ${task.done})">✔</button>
        <button onclick="editTask('${taskDoc.id}', '${task.text.replace(/'/g, "\\'")}')">✏</button>
        <button onclick="deleteTask('${taskDoc.id}')">❌</button>
      </div>
    `;

    taskList.appendChild(li);
  });

  totalCount.textContent = total;
  doneCount.textContent = completed;
  remainingCount.textContent = total - completed;
});


// --------------------
// TOGGLE TASK
// --------------------
window.toggleTask = async (id, currentStatus) => {
  await updateDoc(doc(db, "tasks", id), {
    done: !currentStatus
  });
};


// --------------------
// DELETE TASK
// --------------------
window.deleteTask = async (id) => {
  await deleteDoc(doc(db, "tasks", id));
};


// --------------------
// EDIT TASK
// --------------------
window.editTask = async (id, oldText) => {
  const newText = prompt("Edit your task:", oldText);
  if (!newText || newText.trim() === "") return;

  await updateDoc(doc(db, "tasks", id), {
    text: newText.trim()
  });
};

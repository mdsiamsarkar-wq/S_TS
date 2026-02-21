import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc
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
const taskCategory = document.getElementById("taskCategory");
const addBtn = document.getElementById("addBtn");
const themeToggle = document.getElementById("themeToggle");
const appContainer = document.getElementById("appContainer");

// --------------------
// RANDOM BACKGROUNDS
// --------------------
// Palettes for Light Mode
const lightGradients = [
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", // Light Blue/Grey
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", // Purple to Light Blue
  "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)", // Warm Pinkish
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", // Mint to Blue
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"  // Soft Ocean
];

// Palettes for Dark Mode
const darkGradients = [
  "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)", // Deep Purple/Grey
  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)", // Dark Teal
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)", // Midnight Blue
  "linear-gradient(135deg, #4b134f 0%, #c94b4b 100%)", // Dark Berry
  "linear-gradient(135deg, #232526 0%, #414345 100%)"  // Smooth Graphite
];

function setRandomBackground() {
  const isDark = document.body.classList.contains("dark");
  const palettes = isDark ? darkGradients : lightGradients;
  const randomBg = palettes[Math.floor(Math.random() * palettes.length)];
  document.body.style.backgroundImage = randomBg;
}

// --------------------
// UI BUMP ANIMATION (Moves the screen)
// --------------------
function triggerScreenBump() {
  appContainer.classList.remove('bump');
  void appContainer.offsetWidth; // trigger reflow
  appContainer.classList.add('bump');
  setTimeout(() => appContainer.classList.remove('bump'), 200);
}

// --------------------
// DARK MODE & INITIAL LOAD
// --------------------
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀";
}

// Set random background immediately on load!
setRandomBackground();

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀" : "🌙";
  
  // Change background to match the new theme
  setRandomBackground();
  triggerScreenBump();
});

// --------------------
// ADD TASK
// --------------------
async function addTask() {
  const text = taskInput.value.trim();
  const category = taskCategory.value;

  if (!text) return;

  triggerScreenBump();

  await addDoc(collection(db, "tasks"), {
    text: text,
    category: category,
    done: false,
    timestamp: Date.now(),
    order: Date.now() // Used for Drag & Drop sorting
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
let tasksArray = [];

onSnapshot(collection(db, "tasks"), (snapshot) => {
  const lists = { simi: "", siam: "", together: "" };
  const counts = {
    simi: { total: 0, done: 0 },
    siam: { total: 0, done: 0 },
    together: { total: 0, done: 0 },
    global: { total: 0, done: 0 }
  };

  tasksArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (a.order || a.timestamp) - (b.order || b.timestamp));

  tasksArray.forEach((task) => {
    const cat = task.category || "together";

    counts[cat].total++;
    counts.global.total++;
    if (task.done) {
      counts[cat].done++;
      counts.global.done++;
    }

    lists[cat] += `
      <li id="task-${task.id}" data-id="${task.id}" data-order="${task.order || task.timestamp}" draggable="true">
        <div class="task-info">
          <span class="drag-handle">≡</span>
          <span class="task-text ${task.done ? "done" : ""}">${task.text}</span>
        </div>
        <div class="actions">
          <button class="action-btn" onclick="toggleTask('${task.id}', ${task.done})">✔</button>
          <button class="action-btn" onclick="editTask('${task.id}', '${task.text.replace(/'/g, "\\'")}')">✏</button>
          <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')">❌</button>
        </div>
      </li>
    `;
  });

  document.getElementById("list-simi").innerHTML = lists.simi;
  document.getElementById("list-siam").innerHTML = lists.siam;
  document.getElementById("list-together").innerHTML = lists.together;

  document.getElementById("totalCount").textContent = counts.global.total;
  document.getElementById("doneCount").textContent = counts.global.done;
  document.getElementById("remainingCount").textContent = counts.global.total - counts.global.done;

  ['simi', 'siam', 'together'].forEach(cat => {
    const cTotal = counts[cat].total;
    const cDone = counts[cat].done;
    const percentage = cTotal === 0 ? 0 : (cDone / cTotal) * 100;

    document.getElementById(`stats-${cat}`).textContent = `${cDone} / ${cTotal} Completed`;
    document.getElementById(`progress-${cat}`).style.width = `${percentage}%`;
  });

  attachDragAndDrop();
});

// --------------------
// ACTIONS
// --------------------
window.toggleTask = async (id, currentStatus) => {
  triggerScreenBump();
  await updateDoc(doc(db, "tasks", id), { done: !currentStatus });
};

window.deleteTask = async (id) => {
  triggerScreenBump();
  const taskElement = document.getElementById(`task-${id}`);
  if (taskElement) {
    taskElement.classList.add('removing');
    setTimeout(async () => {
      await deleteDoc(doc(db, "tasks", id));
    }, 300);
  } else {
    await deleteDoc(doc(db, "tasks", id));
  }
};

window.editTask = async (id, oldText) => {
  const newText = prompt("Edit your task:", oldText);
  if (!newText || newText.trim() === "") return;

  triggerScreenBump();
  const taskElement = document.getElementById(`task-${id}`);
  if (taskElement) taskElement.classList.add('editing');

  await updateDoc(doc(db, "tasks", id), { text: newText.trim() });

  setTimeout(() => {
    if (taskElement) taskElement.classList.remove('editing');
  }, 300);
};

// --------------------
// DRAG AND DROP (Manual Swap)
// --------------------
function attachDragAndDrop() {
  const lists = document.querySelectorAll('.droppable-list');
  const items = document.querySelectorAll('li[draggable="true"]');

  items.forEach(item => {
    item.addEventListener('dragstart', () => {
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
  });

  lists.forEach(list => {
    list.addEventListener('dragover', e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      const draggable = document.querySelector('.dragging');
      if (draggable) {
        if (afterElement == null) {
          list.appendChild(draggable);
        } else {
          list.insertBefore(draggable, afterElement);
        }
      }
    });

    list.addEventListener('drop', async e => {
      e.preventDefault();
      const draggable = document.querySelector('.dragging');
      if (!draggable) return;

      triggerScreenBump();
      
      const newCategory = list.parentElement.dataset.category;
      const taskId = draggable.dataset.id;
      
      const prev = draggable.previousElementSibling;
      const next = draggable.nextElementSibling;
      
      let newOrder;
      if (!prev && !next) newOrder = Date.now();
      else if (!prev) newOrder = parseFloat(next.dataset.order) - 1000;
      else if (!next) newOrder = parseFloat(prev.dataset.order) + 1000;
      else newOrder = (parseFloat(prev.dataset.order) + parseFloat(next.dataset.order)) / 2;

      await updateDoc(doc(db, "tasks", taskId), { 
        category: newCategory, 
        order: newOrder 
      });
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

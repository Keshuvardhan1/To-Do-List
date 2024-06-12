const tasksList = [];

function showToast(message) {
  const toastContainer = document.querySelector(".toast-container");
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show-toast");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show-toast");
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

function createTaskElement(taskValue, isChecked = false) {
  const taskDiv = document.createElement("div");
  taskDiv.classList.add("task");
  taskDiv.dataset.taskValue = taskValue;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.style.width = "3%";
  checkbox.checked = isChecked;
  checkbox.onclick = function () {
    if (checkbox.checked) {
      showPopup(
        "Do you want to mark the task " + taskValue + " as done?",
        (confirm) => {
          if (confirm) {
            showToast(
              "Task " + taskValue + " successfully marked as completed"
            );
            taskText.style.textDecoration = "line-through";
            updateTaskInLocalStorage(taskValue, true);
            filterTasks(getActiveFilter());
          }
        }
      );
    } else {
      showPopup(
        "Do you want to mark the task " + taskValue + " as not done?",
        (confirm) => {
          if (confirm) {
            showToast("Task " + taskValue + " marked as incomplete");
            taskText.style.textDecoration = "none";
            updateTaskInLocalStorage(taskValue, false);
            filterTasks(getActiveFilter());
          }
        }
      );
    }
  };
  taskDiv.appendChild(checkbox);
  taskDiv.style.alignItems = "center";

  const taskText = document.createElement("div");
  taskText.textContent = taskValue;
  taskText.style.flex = "1";
  taskText.style.border = "none";
  taskText.style.background = "none";
  taskText.style.width = "70%";
  taskText.style.textAlign = "start";
  taskText.style.overflowWrap = "break-word";
  taskText.style.wordBreak = "break-word";
  taskText.style.minHeight = "20px";
  taskText.style.textDecoration = isChecked ? "line-through" : "none";
  taskText.contentEditable = "false";
  taskText.classList.add("task-text");
  taskDiv.appendChild(taskText);

  const editBut = document.createElement("button");
  editBut.classList.add("edit");
  editBut.style.color = "antiquewhite";
  editBut.style.backgroundColor = "#686868";
  editBut.style.border = "#404040 1px solid";
  editBut.style.borderRadius = "4px";
  editBut.style.padding = "8px";
  editBut.style.margin = "2px";
  editBut.innerHTML = "✏️";
  editBut.addEventListener("click", () => {
    if (taskText.contentEditable === "true") {
      showPopup("Do you want to save the changes?", (confirm) => {
        if (confirm) {
          const newTaskValue = taskText.textContent.trim();
          if (newTaskValue !== taskValue) {
            updateEditedtaskToLocalStorage(taskDiv, taskValue, newTaskValue);
          } else {
            taskText.contentEditable = "false";
            editBut.innerHTML = "✏️";
            showToast("No changes made to the task");
          }
        }
      });
    } else {
      taskText.contentEditable = "true";
      editBut.innerHTML = "💾";
      taskText.focus();
    }
  });
  taskDiv.appendChild(editBut);

  const delBut = document.createElement("button");
  delBut.classList.add("delete");
  delBut.style.color = "antiquewhite";
  delBut.style.backgroundColor = "#B56F33";
  delBut.style.border = "brown 1px solid";
  delBut.style.borderRadius = "4px";
  delBut.style.padding = "8px";
  delBut.style.margin = "2px";
  delBut.innerHTML = "🗑️";
  delBut.addEventListener("click", () => {
    showPopup("Do you want delete the task " + taskValue + "?", (confirm) => {
      if (confirm) {
        tasks.removeChild(taskDiv);
        const index = tasksList.findIndex(
          (task) => task.taskValue === taskValue
        );
        if (index !== -1) tasksList.splice(index, 1);
        showToast("Task " + taskValue + " deleted successfully");
        saveTaskToLocalStorage();
        filterTasks(getActiveFilter());
        toggleNavVisibility();
      }
    });
  });
  taskDiv.appendChild(delBut);

  return taskDiv;
}

document.addEventListener("DOMContentLoaded", () => {
  const popupOverlay = document.getElementById("popup-overlay");
  const popupMessage = document.getElementById("popup-message");
  const popupYes = document.getElementById("popup-yes");
  const popupNo = document.getElementById("popup-no");

  let popupCallback = null;

  function showPopup(message, callback) {
    popupMessage.textContent = message;
    popupCallback = callback;
    popupOverlay.style.visibility = "visible";
    popupOverlay.style.opacity = "1";
  }

  function hidePopup() {
    popupOverlay.style.visibility = "hidden";
    popupOverlay.style.opacity = "0";
  }

  popupYes.addEventListener("click", () => {
    if (popupCallback) {
      popupCallback(true);
      popupCallback = null; // Clear callback after calling it
    }
    hidePopup();
  });

  popupNo.addEventListener("click", () => {
    if (popupCallback) {
      popupCallback(false);
      popupCallback = null; // Clear callback after calling it
    }
    hidePopup();
  });

  window.showPopup = showPopup;
});

window.addEventListener("load", () => {
  const add = document.getElementById("add");
  const task = document.getElementById("task");
  const error = document.getElementById("error");
  const tasks = document.getElementById("tasks");

  const allBtn = document.getElementById("all");
  const completedBtn = document.getElementById("completed");
  const inprogressBtn = document.getElementById("inprogress");

  task.addEventListener("input", () => {
    task.value = task.value.replace(/^\s+/, "");
  });

  add.addEventListener("click", addTask);
  allBtn.addEventListener("click", () => filterTasks("all"));
  completedBtn.addEventListener("click", () => filterTasks("completed"));
  inprogressBtn.addEventListener("click", () => filterTasks("inprogress"));

  loadTasksFromLocalStorage();

  function toggleNavVisibility() {
    const tasks = document.getElementById("tasks");
    const navButtons = document.querySelector(".nav-buttons");
    const head = document.querySelector(".head");
    if (tasks.children.length > 0) {
      navButtons.style.display = "flex";
      head.style.display = "flex";
    } else {
      navButtons.style.display = "none";
      head.style.display = "none";
    }
  }

  toggleNavVisibility();

  function checkInProgressTasks() {
    const tasks = document.querySelectorAll("#tasks .task");
    const inProgressTasks = Array.from(tasks).filter((task) => {
      const checkbox = task.querySelector('input[type="checkbox"]');
      return !checkbox.checked;
    });

    const head = document.querySelector(".head");
    if (inProgressTasks.length === 0 && getActiveFilter() === "inprogress") {
      head.style.display = "none";
    } else if (
      inProgressTasks.length > 0 &&
      getActiveFilter() === "inprogress"
    ) {
      head.style.display = "flex";
    }
  }

  function checkCompletedTasks() {
    const tasks = document.querySelectorAll("#tasks .task");
    const completedTasks = Array.from(tasks).filter((task) => {
      const checkbox = task.querySelector('input[type="checkbox"]');
      return checkbox.checked;
    });

    const head = document.querySelector(".head");
    if (completedTasks.length === 0 && getActiveFilter() === "completed") {
      head.style.display = "none";
    } else if (completedTasks.length > 0 && getActiveFilter() === "completed") {
      head.style.display = "flex";
    }
  }

  function addTask(event) {
    event.preventDefault();
    const taskValue = task.value.trim();

    if (taskValue === "") {
      function showError() {
        error.style.display = "block";

        setTimeout(() => {
          error.style.display = "none";
        }, 3000);
      }
      function errToast() {
        const toastContainer = document.querySelector(".toast-container");
        const errToast = document.createElement("div");
        errToast.classList.add("errToast");
        errToast.textContent = "❌ Task input cannot be empty!";
        toastContainer.appendChild(errToast);

        setTimeout(() => {
          errToast.classList.add("show-errToast");
        }, 100);

        setTimeout(() => {
          errToast.classList.remove("show-errToast");
          setTimeout(() => {
            errToast.remove();
          }, 500);
        }, 3000);
      }
      errToast();
      showError();
      return;
    }

    error.style.display = "none";

    if (tasksList.some((task) => task.taskValue === taskValue)) {
      showToast("Task " + taskValue + " already exists");
      return;
    }

    const taskObj = { taskValue, isChecked: false };
    tasksList.unshift(taskObj);
    const taskDiv = createTaskElement(taskValue);

    showPopup("Do you want to add the task " + taskValue + "?", (confirm) => {
      if (confirm) {
        showToast("Task " + taskValue + " added successfully");
        tasks.prepend(taskDiv);
        saveTaskToLocalStorage();
        filterTasks(getActiveFilter());
        toggleNavVisibility();
        checkInProgressTasks();
        checkCompletedTasks();
      }
    });

    task.value = "";
  }

  function filterTasks(filter) {
    const allTasks = Array.from(tasks.children);
    allTasks.forEach((task) => {
      const checkbox = task.querySelector('input[type="checkbox"]');
      switch (filter) {
        case "all":
          task.style.display = "flex";
          break;
        case "completed":
          task.style.display = checkbox.checked ? "flex" : "none";
          break;
        case "inprogress":
          task.style.display = !checkbox.checked ? "flex" : "none";
          break;
      }
    });

    allBtn.classList.toggle("active", filter === "all");
    completedBtn.classList.toggle("active", filter === "completed");
    inprogressBtn.classList.toggle("active", filter === "inprogress");

    if (filter === "completed") {
      checkCompletedTasks();
    } else if (filter === "inprogress") {
      checkInProgressTasks();
    } else {
      const head = document.querySelector(".head");
      head.style.display = allTasks.length ? "flex" : "none";
    }
  }

  function getActiveFilter() {
    if (completedBtn.classList.contains("active")) return "completed";
    if (inprogressBtn.classList.contains("active")) return "inprogress";
    return "all";
  }
});

window.onload = function () {
  if (localStorage.getItem("tasks")) {
    tasksList = JSON.parse(localStorage.getItem("tasks"));
    tasksList.forEach((task) => {
      const taskDiv = createTaskElement(task.taskValue, task.isChecked);
      tasks.appendChild(taskDiv);
    });
  }
  toggleNavVisibility();
};

function saveTaskToLocalStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasksList));
}

function updateTaskInLocalStorage(taskValue, isChecked) {
  const taskIndex = tasksList.findIndex((task) => task.taskValue === taskValue);
  if (taskIndex !== -1) {
    tasksList[taskIndex].isChecked = isChecked;
    saveTaskToLocalStorage();
  }
}

function updateEditedtaskToLocalStorage(taskDiv, taskValue, newTaskValue) {
  tasks.removeChild(taskDiv);

  const newTaskDiv = createTaskElement(newTaskValue);

  tasks.prepend(newTaskDiv);

  const taskIndex = tasksList.findIndex((task) => task.taskValue === taskValue);
  if (taskIndex !== -1) {
    tasksList.splice(taskIndex, 1);
  }
  tasksList.unshift({ taskValue: newTaskValue, isChecked: false });

  saveTaskToLocalStorage();
}

function loadTasksFromLocalStorage() {
  const storedTasks = JSON.parse(localStorage.getItem("tasks"));
  if (storedTasks) {
    storedTasks.forEach((task) => {
      tasksList.push({ taskValue: task.taskValue, isChecked: task.isChecked });
      const taskDiv = createTaskElement(task.taskValue, task.isChecked);
      tasks.appendChild(taskDiv);
    });

    checkInProgressTasks();
    checkCompletedTasks();
  }
}

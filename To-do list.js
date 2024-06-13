document.addEventListener("DOMContentLoaded", () => {
  let tasksList = [];

  const add = document.getElementById("add");
  const task = document.getElementById("task");
  const error = document.getElementById("error");
  const tasks = document.getElementById("tasks");

  const allBtn = document.getElementById("all");
  const inprogressBtn = document.getElementById("inprogress");
  const completedBtn = document.getElementById("completed");

  const totalTaskCount = document.getElementById("total-task-count");
  const inprogressTaskCount = document.getElementById("inprogress-task-count");
  const completedTaskCount = document.getElementById("completed-task-count");

  const popupOverlay = document.getElementById("popup-overlay");
  const popupMessage = document.getElementById("popup-message");
  const popupYes = document.getElementById("popup-yes");
  const popupNo = document.getElementById("popup-no");

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
          "Do you want to mark the task as done?\nTask: " + taskValue,
          (confirm) => {
            if (confirm) {
              showToast("Task successfully marked as completed");
              taskText.style.textDecoration = "line-through";
              updateTaskInLocalStorage(taskValue, true);
              arrangeTaskListOnTop();
              filterTasks(getActiveFilter());
              completedBtn.click();
            }
          }
        );
      } else {
        showPopup(
          "Do you want to mark the task as not done?\nTask: " + taskValue,
          (confirm) => {
            if (confirm) {
              showToast("Task marked as incomplete");
              taskText.style.textDecoration = "none";
              updateTaskInLocalStorage(taskValue, false);
              arrangeTaskListOnTop();
              filterTasks(getActiveFilter());
              inprogressBtn.click();
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
    taskText.style.width = "65%";
    taskText.style.marginLeft = "2.5%";
    taskText.style.marginRight = "2.5%";
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
        const newTaskValue = taskText.textContent.trim();
        if (!isValidTask(newTaskValue)) {
          errToast("Task contains invalid characters.");
          return;
        } else if (newTaskValue === "") {
          errToast("Task input cannot be empty!");
          taskText.textContent = taskValue;
          taskText.contentEditable = "false";
          editBut.innerHTML = "✏️";
        } else if (newTaskValue !== taskValue) {
          showToast("Task modified successfully");
          updateEditedtaskToLocalStorage(taskDiv, taskValue, newTaskValue);
          taskText.contentEditable = "false";
          editBut.innerHTML = "✏️";
          allBtn.click();
        } else {
          taskText.contentEditable = "false";
          editBut.innerHTML = "✏️";
          showToast("No changes made to the task");
        }
      } else {
        taskText.contentEditable = "true";
        editBut.innerHTML = "💾";
        taskText.focus();
        const range = document.createRange();
        range.selectNodeContents(taskText);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
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
      showPopup(
        "Do you want delete the task?\n Task: " + taskValue,
        (confirm) => {
          if (confirm) {
            tasks.removeChild(taskDiv);
            const index = tasksList.findIndex(
              (task) => task.taskValue === taskValue
            );
            if (index !== -1) tasksList.splice(index, 1);
            showToast("Task deleted successfully");
            saveTaskToLocalStorage();
            updateTaskCounts();
            filterTasks(getActiveFilter());
            toggleNavVisibility();
            allBtn.click();
          }
        }
      );
    });
    taskDiv.appendChild(delBut);

    return taskDiv;
  }

  let popupCallback = null;

  function showPopup(message, callback) {
    popupMessage.textContent = message;
    popupMessage.style.whiteSpace = "pre-wrap";
    popupMessage.style.wordWrap = "break-word";
    popupCallback = callback;
    popupOverlay.style.visibility = "visible";
    popupOverlay.style.opacity = "1";
  }

  function hidePopup() {
    popupOverlay.style.visibility = "hidden";
    popupOverlay.style.opacity = "0";
  }

  popupYes.addEventListener("click", () => {
    hidePopup();
    if (popupCallback) {
      popupCallback(true);
      popupCallback = null;
    }
  });

  popupNo.addEventListener("click", () => {
    hidePopup();
    if (popupCallback) {
      popupCallback(false);
      popupCallback = null;
    }
  });

  window.showPopup = showPopup;

  function updateTaskCounts() {
    const totalTasks = tasksList.length;
    const inprogressTasks = tasksList.filter((task) => !task.isChecked).length;
    const completedTasks = tasksList.filter((task) => task.isChecked).length;

    totalTaskCount.textContent = totalTasks;
    inprogressTaskCount.textContent = inprogressTasks;
    completedTaskCount.textContent = completedTasks;
  }

  allBtn.addEventListener("click", () => {
    filterTasks("all");
    filterAndDisplayTasks("all");
  });
  inprogressBtn.addEventListener("click", () => {
    filterTasks("inprogress");
    filterAndDisplayTasks("inprogress");
  });
  completedBtn.addEventListener("click", () => {
    filterTasks("completed");
    filterAndDisplayTasks("completed");
  });

  function filterAndDisplayTasks(filter) {
    const filteredTasks = tasksList.filter((task) => {
      switch (filter) {
        case "all":
          return true;
        case "inprogress":
          return !task.isChecked;
        case "completed":
          return task.isChecked;
        default:
          return true;
      }
    });

    displayTasks(filteredTasks);
  }

  function displayTasks(tasks) {
    tasksContainer.innerHTML = "";

    tasks.forEach((task) => {
      const taskDiv = createTaskElement(task.taskValue, task.isChecked);
      tasksContainer.appendChild(taskDiv);
    });
  }

  function toggleNavVisibility() {
    const tasks = document.getElementById("tasks");
    const noTaskAvail = document.getElementById("noTaskAvail");
    const head = document.querySelector(".head");
    if (tasks.children.length > 0) {
      noTaskAvail.style.display = "none";
      head.style.display = "flex";
    } else {
      noTaskAvail.style.display = "block";
      head.style.display = "none";
    }
  }

  function checkInProgressTasks() {
    const tasks = document.querySelectorAll("#tasks .task");
    const noTaskAvail = document.getElementById("noTaskAvail");
    const inProgressTasks = Array.from(tasks).filter((task) => {
      const checkbox = task.querySelector('input[type="checkbox"]');
      return !checkbox.checked;
    });

    const head = document.querySelector(".head");
    if (inProgressTasks.length === 0 && getActiveFilter() === "inprogress") {
      noTaskAvail.style.display = "block";
      head.style.display = "none";
    } else if (
      inProgressTasks.length > 0 &&
      getActiveFilter() === "inprogress"
    ) {
      noTaskAvail.style.display = "none";
      head.style.display = "flex";
    }
  }

  function checkCompletedTasks() {
    const tasks = document.querySelectorAll("#tasks .task");
    const noTaskAvail = document.getElementById("noTaskAvail");
    const completedTasks = Array.from(tasks).filter((task) => {
      const checkbox = task.querySelector('input[type="checkbox"]');
      return checkbox.checked;
    });

    const head = document.querySelector(".head");
    if (completedTasks.length === 0 && getActiveFilter() === "completed") {
      noTaskAvail.style.display = "block";
      head.style.display = "none";
    } else if (completedTasks.length > 0 && getActiveFilter() === "completed") {
      noTaskAvail.style.display = "none";
      head.style.display = "flex";
    }
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

    const filteredTasks = allTasks.filter(
      (task) => task.style.display !== "none"
    );
    noTaskAvail.style.display = filteredTasks.length === 0 ? "block" : "none";

    // if (filter === "completed") {
    //   checkCompletedTasks();
    // } else if (filter === "inprogress") {
    //   checkInProgressTasks();
    // } else {
    //   const head = document.querySelector(".head");
    //   head.style.display = allTasks.length ? "flex" : "none";
    // }
  }

  function getActiveFilter() {
    if (completedBtn.classList.contains("active")) return "completed";
    if (inprogressBtn.classList.contains("active")) return "inprogress";
    return "all";
  }

  function errToast(message) {
    const toastContainer = document.querySelector(".toast-container");
    const errToast = document.createElement("div");
    errToast.classList.add("errToast");
    errToast.textContent = message;
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

  function isValidTask(taskValue) {
    return /^[a-zA-Z0-9 ]*$/.test(taskValue);
  }

  function arrangeTaskListOnTop() {
    tasks.innerHTML = "";
    tasksList.forEach((task) => {
      const taskDiv = createTaskElement(task.taskValue, task.isChecked);
      tasks.appendChild(taskDiv);
    });
  }

  function saveTaskToLocalStorage() {
    localStorage.setItem("tasks", JSON.stringify(tasksList));
  }

  function updateTaskInLocalStorage(taskValue, isChecked) {
    const taskIndex = tasksList.findIndex(
      (task) => task.taskValue === taskValue
    );
    if (taskIndex !== -1) {
      tasksList.splice(taskIndex, 1);
      tasksList.unshift({ taskValue, isChecked });
      saveTaskToLocalStorage();
      updateTaskCounts();
    }
  }

  function updateEditedtaskToLocalStorage(taskDiv, taskValue, newTaskValue) {
    tasks.removeChild(taskDiv);

    const trimmedNewTaksValue = newTaskValue.trim();

    const taskIndex = tasksList.findIndex(
      (task) => task.taskValue === taskValue
    );
    if (taskIndex !== -1) {
      tasksList.splice(taskIndex, 1);
    }

    if (!isValidTask(trimmedNewTaksValue)) {
      errToast("Task contains invalid characters.");
      const newTaskDiv = createTaskElement(trimmedNewTaksValue);

      tasks.prepend(newTaskDiv);
    } else {
      const newTaskDiv = createTaskElement(trimmedNewTaksValue);

      tasks.prepend(newTaskDiv);
      tasksList.unshift({ taskValue: newTaskValue, isChecked: false });
      saveTaskToLocalStorage();
      updateTaskCounts();
    }
  }

  function loadTasksFromLocalStorage() {
    const storedTasks = JSON.parse(localStorage.getItem("tasks"));
    if (storedTasks) {
      storedTasks.forEach((task) => {
        tasksList.push({
          taskValue: task.taskValue,
          isChecked: task.isChecked,
        });
        const taskDiv = createTaskElement(task.taskValue, task.isChecked);
        tasks.appendChild(taskDiv);
      });

      updateTaskCounts();
      checkInProgressTasks();
      checkCompletedTasks();
    }
  }

  window.addEventListener("load", () => {
    task.addEventListener("input", () => {
      task.value = task.value.replace(/^\s+/, "");
    });

    add.addEventListener("click", addTask);

    loadTasksFromLocalStorage();

    toggleNavVisibility();

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

        errToast("Task input cannot be empty!");
        showError();
        return;
      }

      error.style.display = "none";

      if (!isValidTask(taskValue)) {
        errToast("Task contains invalid characters.");
        return;
      }

      if (tasksList.some((task) => task.taskValue === taskValue)) {
        showToast("Task already exists");
        return;
      }

      const taskObj = { taskValue, isChecked: false };
      tasksList.unshift(taskObj);
      const taskDiv = createTaskElement(taskValue);

      showToast("Task added successfully");
      tasks.prepend(taskDiv);
      saveTaskToLocalStorage();
      filterTasks(getActiveFilter());
      toggleNavVisibility();
      checkInProgressTasks();
      checkCompletedTasks();
      updateTaskCounts();

      task.value = "";
      allBtn.click();
    }
  });

  window.onload = function () {
    if (localStorage.getItem("tasks")) {
      tasksList = JSON.parse(localStorage.getItem("tasks"));
      arrangeTaskListOnTop();
    }
    toggleNavVisibility();
  };
});

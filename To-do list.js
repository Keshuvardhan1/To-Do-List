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
  const popup = document.querySelector(".popup");
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

  function markTaskAsComplete(taskDiv, taskValue) {
    taskDiv.classList.add("complete");
    taskDiv.classList.remove("incomplete");
  }

  function markTaskAsIncomplete(taskDiv, taskValue) {
    taskDiv.classList.add("incomplete");
    taskDiv.classList.remove("complete");
  }

  document.getElementById("tasks").addEventListener("change", (event) => {
    const taskDiv = event.target.closest(".task");
    const taskValue = taskDiv.querySelector(".task-text").textContent;

    if (event.target.checked) {
      markTaskAsComplete(taskDiv, taskValue);
    } else {
      markTaskAsIncomplete(taskDiv, taskValue);
    }

    saveTaskToLocalStorage();
  });

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
          "Do you want to mark the task as done?\n\nTask: " + taskValue,
          (confirm) => {
            if (confirm) {
              showToast("Task successfully marked as completed");
              taskText.style.textDecoration = "line-through";
              updateTaskInLocalStorage(taskValue, true);
              arrangeTaskListOnTop();
              filterTasks(getActiveFilter());
              const activeFilter = getActiveFilter();
              if (activeFilter === "inprogress") {
                completedBtn.click();
              }
            } else {
              checkbox.checked = false;
            }
          }
        );
      } else {
        showPopup(
          "Do you want to mark the task as not done?\n\nTask: " + taskValue,
          (confirm) => {
            if (confirm) {
              showToast("Task marked as incomplete");
              taskText.style.textDecoration = "none";
              updateTaskInLocalStorage(taskValue, false);
              arrangeTaskListOnTop();
              filterTasks(getActiveFilter());
              const activeFilter = getActiveFilter();
              if (activeFilter === "completed") {
                inprogressBtn.click();
              }
            } else {
              checkbox.checked = true;
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
    taskText.style.width = "66.5%";
    taskText.style.marginLeft = "1%";
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
        const newTaskValue = taskText.textContent
          .trim()
          .replace(/\s+/g, " ")
          .replace(/(^\w)(\w*)/g, function (g0, g1, g2) {
            return g1.toUpperCase() + g2.toLowerCase();
          });
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
          updateEditedtaskToLocalStorage(
            taskDiv,
            taskValue,
            newTaskValue,
            checkbox.checked
          );
          taskText.contentEditable = "false";
          editBut.innerHTML = "✏️";
          // allBtn.click();
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
        "Do you want to delete the task?\n\n Task: " + taskValue,
        (confirm) => {
          if (confirm) {
            tasks.removeChild(taskDiv);
            const index = tasksList.findIndex(
              (task) => task.taskValue === taskValue
            );
            showToast("Task deleted successfully");
            saveTaskToLocalStorage();
            updateTaskCounts();
            filterTasks(getActiveFilter());
            toggleNavVisibility();
            allBtn.click();
            tasks.scrollTo({ top: 0, behavior: "smooth" });
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
    popup.scrollTo({ top: 0, behavior: "instant" });
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
    tasks.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleNavVisibility() {
    const tasks = document.getElementById("tasks");
    const noTaskAvail = document.getElementById("noTaskAvail");
    const head = document.querySelector(".head");
    if (tasks.children.length > 0) {
      noTaskAvail.style.display = "none";
      head.style.display = "flex";
    } else {
      noTaskAvail.style.display = "flex";
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
      noTaskAvail.style.display = "flex";
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
      noTaskAvail.style.display = "flex";
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
    return /^[a-zA-Z0-9" "]*$/.test(taskValue);
  }

  function arrangeTaskListOnTop() {
    tasks.innerHTML = "";
    tasksList.forEach((task) => {
      const taskDiv = createTaskElement(task.taskValue, task.isChecked);
      tasks.appendChild(taskDiv);
    });
    tasks.scrollTo({ top: 0, behavior: "smooth" });
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

  function updateEditedtaskToLocalStorage(
    taskDiv,
    oldTaskValue,
    newTaskValue,
    isChecked
  ) {
    tasks.removeChild(taskDiv);

    const trimmedNewTaskValue = newTaskValue
      .trim()
      .replace(/\s+/g, " ")
      .replace(/(^\w)(\w*)/g, function (g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
      });

    const taskIndex = tasksList.findIndex(
      (task) => task.taskValue === oldTaskValue
    );
    if (taskIndex !== -1) {
      tasksList.splice(taskIndex, 1);
    }

    if (!isValidTask(trimmedNewTaskValue)) {
      errToast("Task contains invalid characters.");
      const newTaskDiv = createTaskElement(trimmedNewTaskValue, isChecked);
      tasks.prepend(newTaskDiv);
    } else {
      const newTaskDiv = createTaskElement(trimmedNewTaskValue, isChecked);
      tasks.prepend(newTaskDiv);
      tasksList.unshift({
        taskValue: trimmedNewTaskValue,
        isChecked: isChecked,
      });
      saveTaskToLocalStorage();
      updateTaskCounts();
    }
    tasks.scrollTo({ top: 0, behavior: "smooth" });
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
      const taskValue = task.value
        .trim()
        .replace(/\s+/g, " ")
        .replace(/(^\w)(\w*)/g, function (g0, g1, g2) {
          return g1.toUpperCase() + g2.toLowerCase();
        });

      if (taskValue === "") {
        function showError() {
          error.style.display = "block";

          setTimeout(() => {
            error.style.display = "none";
          }, 3000);
        }

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
      tasks.scrollTo({ top: 0, behavior: "smooth" });
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

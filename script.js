const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoEmptyState = document.getElementById("todo-empty-state");
const todoTools = document.getElementById("todo-tools");
const todoSearch = document.getElementById("todo-search");
const todoNoResults = document.getElementById("todo-no-results");
const todoFilters = [...document.querySelectorAll(".todo-filter")];
const kanbanBoard = document.getElementById("kanban-board");
const kanbanColumns = [...document.querySelectorAll(".kanban-column")];
const viewButtons = [...document.querySelectorAll(".todo-view-button")];
const todosStorageKey = "px26-todos";
const viewStorageKey = "px26-task-view";
const validStatuses = ["To Do", "In Progress", "Done"];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeFilter = "all";
let activeView = localStorage.getItem(viewStorageKey) === "board" ? "board" : "list";
let nextTodoOrder = 0;

const updateTodoView = () => {
    const todos = [...document.querySelectorAll(".todo-item:not(.is-removing):not(.is-delete-pending)")];
    const query = todoSearch.value.trim().toLocaleLowerCase();
    let visibleCount = 0;

    todoTools.hidden = todos.length === 0;
    todoEmptyState.hidden = todos.length > 0;

    todos.forEach((todoItem) => {
        const isDone = todoItem.dataset.status === "Done";
        const matchesFilter = activeFilter === "all" ||
            (activeFilter === "active" && !isDone) ||
            (activeFilter === "done" && isDone);
        const matchesSearch = todoItem.querySelector(".todo-text").textContent
            .toLocaleLowerCase()
            .includes(query);
        const isVisible = matchesFilter && matchesSearch;

        todoItem.hidden = !isVisible;
        visibleCount += Number(isVisible);
    });

    todoNoResults.hidden = todos.length === 0 || visibleCount > 0;
    document.body.classList.toggle("is-kanban-view", activeView === "board" && todos.length > 0);
    todoList.hidden = activeView === "board" && todos.length > 0;
    kanbanBoard.hidden = activeView !== "board" || todos.length === 0 || visibleCount === 0;
    document.getElementById("todo-count-all").textContent = todos.length;
    document.getElementById("todo-count-active").textContent = todos.filter((todoItem) =>
        todoItem.dataset.status !== "Done"
    ).length;
    document.getElementById("todo-count-done").textContent = todos.filter((todoItem) =>
        todoItem.dataset.status === "Done"
    ).length;

    kanbanColumns.forEach((column) => {
        const columnTodos = [...column.querySelectorAll(".todo-item:not([hidden])")];
        column.querySelector(".kanban-column-count").textContent = columnTodos.length;
        column.querySelector(".kanban-column-empty").hidden = columnTodos.length > 0;
    });
};

const saveTodos = () => {
    const todos = [...document.querySelectorAll(".todo-item:not(.is-removing):not(.is-delete-pending)")].map((todoItem) => ({
        text: todoItem.querySelector(".todo-text").textContent,
        status: todoItem.dataset.status,
    }));

    localStorage.setItem(todosStorageKey, JSON.stringify(todos));
};

const renderTodoView = () => {
    const todos = [...document.querySelectorAll(".todo-item")].sort((first, second) =>
        Number(first.dataset.order) - Number(second.dataset.order)
    );

    if (activeView === "list") {
        todos.forEach((todoItem) => {
            todoItem.draggable = false;
            todoList.append(todoItem);
        });
    } else {
        todos.forEach((todoItem) => {
            const column = kanbanColumns.find((item) => item.dataset.status === todoItem.dataset.status);
            todoItem.draggable = true;
            column.querySelector(".kanban-column-list").append(todoItem);
        });
    }

    viewButtons.forEach((button) => {
        const isActive = button.dataset.view === activeView;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
    updateTodoView();
};

const setTaskView = (view) => {
    activeView = view;
    localStorage.setItem(viewStorageKey, view);
    renderTodoView();
};

const createTodoItem = ({ text: taskText, status: taskStatus = "To Do" }, { animate = false } = {}) => {
    const todoItem = document.createElement("li");
    todoItem.className = "todo-item";
    todoItem.dataset.status = taskStatus;
    todoItem.id = `todo-item-${nextTodoOrder}`;
    todoItem.dataset.order = nextTodoOrder++;

    if (animate && !prefersReducedMotion.matches) {
        todoItem.classList.add("is-entering");
        todoItem.addEventListener("animationend", () => {
            todoItem.classList.remove("is-entering");
        }, { once: true });
    }

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = taskText;

    const status = document.createElement("select");
    status.className = "todo-status";
    status.setAttribute("aria-label", `Status for ${taskText}`);

    validStatuses.forEach((statusName) => {
        const option = document.createElement("option");
        option.value = statusName;
        option.textContent = statusName;
        option.selected = statusName === taskStatus;
        status.append(option);
    });

    status.addEventListener("change", () => {
        todoItem.dataset.status = status.value;
        if (activeView === "board") {
            renderTodoView();
        }
        updateTodoView();
        saveTodos();
    });

    const deleteConfirmation = document.createElement("div");
    deleteConfirmation.className = "todo-delete-confirmation";
    deleteConfirmation.hidden = true;
    deleteConfirmation.setAttribute("aria-live", "polite");
    deleteConfirmation.setAttribute("role", "status");

    const deleteMessage = document.createElement("span");
    deleteMessage.className = "todo-delete-message";

    const deleteCountdown = document.createElement("span");
    deleteCountdown.className = "todo-delete-countdown";

    const undoDeleteButton = document.createElement("button");
    undoDeleteButton.type = "button";
    undoDeleteButton.className = "todo-undo-delete";
    undoDeleteButton.textContent = "Don't delete";

    deleteConfirmation.append(deleteMessage, deleteCountdown, undoDeleteButton);

    let deleteTimeoutId;
    let deleteIntervalId;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "todo-delete";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${taskText}`);

    todoItem.draggable = activeView === "board";
    todoItem.addEventListener("dragstart", (event) => {
        if (activeView !== "board" || !event.dataTransfer) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.setData("text/plain", todoItem.id);
        event.dataTransfer.effectAllowed = "move";
        todoItem.classList.add("is-dragging");
    });
    todoItem.addEventListener("dragend", () => {
        todoItem.classList.remove("is-dragging");
        kanbanColumns.forEach((column) => column.classList.remove("is-drop-target"));
    });

    const completeDelete = () => {
        window.clearTimeout(deleteTimeoutId);
        window.clearInterval(deleteIntervalId);
        deleteConfirmation.hidden = true;
        todoItem.remove();
        updateTodoView();
        saveTodos();
    };

    const cancelDelete = () => {
        window.clearTimeout(deleteTimeoutId);
        window.clearInterval(deleteIntervalId);
        deleteConfirmation.hidden = true;
        todoItem.classList.remove("is-delete-pending");
        todoItem.style.height = "";
        updateTodoView();
        saveTodos();
        deleteButton.focus();
    };

    deleteButton.addEventListener("click", () => {
        let secondsRemaining = 5;
        if (!prefersReducedMotion.matches) {
            todoItem.style.height = `${todoItem.offsetHeight}px`;
            void todoItem.offsetHeight;
            todoItem.classList.add("is-delete-pending");
            todoItem.style.height = "0";
        } else {
            todoItem.classList.add("is-delete-pending");
        }

        updateTodoView();
        deleteMessage.textContent = "Delete this task?";
        deleteCountdown.textContent = `Removing in ${secondsRemaining}s`;
        deleteConfirmation.hidden = false;
        document.body.append(deleteConfirmation);
        undoDeleteButton.focus();

        deleteIntervalId = window.setInterval(() => {
            secondsRemaining -= 1;
            if (secondsRemaining > 0) {
                deleteCountdown.textContent = `Removing in ${secondsRemaining}s`;
            }
        }, 1000);
        deleteTimeoutId = window.setTimeout(completeDelete, 5000);
    });
    undoDeleteButton.addEventListener("click", cancelDelete);

    const editInput = document.createElement("input");
    editInput.className = "todo-edit-input";
    editInput.type = "text";
    editInput.value = taskText;
    editInput.setAttribute("aria-label", `Edit task: ${taskText}`);
    editInput.hidden = true;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "todo-edit";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${taskText}`);

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "todo-save";
    saveButton.textContent = "Save";
    saveButton.hidden = true;

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "todo-cancel";
    cancelButton.textContent = "Cancel";
    cancelButton.hidden = true;

    const actions = document.createElement("div");
    actions.className = "todo-actions";
    actions.append(editButton, saveButton, cancelButton, deleteButton);

    const setEditing = (isEditing) => {
        todoItem.classList.toggle("is-editing", isEditing);
        text.hidden = isEditing;
        editInput.hidden = !isEditing;
        status.hidden = isEditing;
        editButton.hidden = isEditing;
        saveButton.hidden = !isEditing;
        cancelButton.hidden = !isEditing;
        deleteButton.hidden = isEditing;

        if (isEditing) {
            editInput.value = text.textContent;
            editInput.focus();
            editInput.select();
        }
    };

    const saveEdit = () => {
        const updatedText = editInput.value.trim();
        if (!updatedText) {
            editInput.setCustomValidity("Task cannot be empty.");
            editInput.reportValidity();
            editInput.focus();
            return;
        }

        text.textContent = updatedText;
        status.setAttribute("aria-label", `Status for ${updatedText}`);
        editInput.setAttribute("aria-label", `Edit task: ${updatedText}`);
        editButton.setAttribute("aria-label", `Edit ${updatedText}`);
        deleteButton.setAttribute("aria-label", `Delete ${updatedText}`);
        setEditing(false);
        updateTodoView();
        saveTodos();
    };

    editInput.addEventListener("input", () => {
        editInput.setCustomValidity("");
    });

    editInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            saveEdit();
        } else if (event.key === "Escape") {
            setEditing(false);
        }
    });

    editButton.addEventListener("click", () => setEditing(true));
    saveButton.addEventListener("click", saveEdit);
    cancelButton.addEventListener("click", () => setEditing(false));

    todoItem.append(text, editInput, status, actions);
    document.body.append(deleteConfirmation);
    todoList.append(todoItem);
};

const loadTodos = () => {
    const savedTodos = localStorage.getItem(todosStorageKey);
    if (!savedTodos) {
        return;
    }

    try {
        const todos = JSON.parse(savedTodos);
        if (!Array.isArray(todos) || !todos.every((todo) =>
            todo &&
            typeof todo.text === "string" &&
            todo.text.trim() &&
            validStatuses.includes(todo.status)
        )) {
            throw new Error("Saved tasks have an invalid format.");
        }

        todos.forEach(createTodoItem);
    } catch (error) {
        console.error("Could not load saved tasks:", error);
    }
};

todoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const taskText = todoInput.value.trim();
    if (!taskText) {
        return;
    }

    createTodoItem({ text: taskText }, { animate: true });
    todoSearch.value = "";
    activeFilter = "all";
    todoFilters.forEach((filterButton) => {
        const isActive = filterButton.dataset.filter === activeFilter;
        filterButton.classList.toggle("is-active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
    });
    updateTodoView();
    saveTodos();
    renderTodoView();
    todoInput.value = "";
    todoInput.focus();
});

todoSearch.addEventListener("input", updateTodoView);

todoFilters.forEach((filterButton) => {
    filterButton.addEventListener("click", () => {
        activeFilter = filterButton.dataset.filter;
        todoFilters.forEach((button) => {
            const isActive = button === filterButton;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
        updateTodoView();
    });
});

viewButtons.forEach((button) => {
    button.addEventListener("click", () => setTaskView(button.dataset.view));
});

kanbanColumns.forEach((column) => {
    column.addEventListener("dragover", (event) => {
        if (activeView === "board" && event.dataTransfer) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            column.classList.add("is-drop-target");
        }
    });

    column.addEventListener("dragleave", (event) => {
        if (!column.contains(event.relatedTarget)) {
            column.classList.remove("is-drop-target");
        }
    });

    column.addEventListener("drop", (event) => {
        event.preventDefault();
        column.classList.remove("is-drop-target");
        const todoItemId = event.dataTransfer?.getData("text/plain");
        const todoItem = todoItemId ? document.getElementById(todoItemId) : null;

        if (!todoItem?.classList.contains("todo-item")) {
            return;
        }

        const newStatus = column.dataset.status;
        if (!validStatuses.includes(newStatus) || todoItem.dataset.status === newStatus) {
            return;
        }

        todoItem.dataset.status = newStatus;
        todoItem.querySelector(".todo-status").value = newStatus;
        renderTodoView();
        saveTodos();
    });
});

loadTodos();
renderTodoView();

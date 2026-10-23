const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoEmptyState = document.getElementById("todo-empty-state");
const todoTools = document.getElementById("todo-tools");
const todoSearch = document.getElementById("todo-search");
const todoNoResults = document.getElementById("todo-no-results");
const todoFilters = [...document.querySelectorAll(".todo-filter")];
const todosStorageKey = "px26-todos";
const validStatuses = ["To Do", "In Progress", "Done"];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeFilter = "all";

const updateTodoView = () => {
    const todos = [...todoList.querySelectorAll(".todo-item:not(.is-removing):not(.is-delete-pending)")];
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
    document.getElementById("todo-count-all").textContent = todos.length;
    document.getElementById("todo-count-active").textContent = todos.filter((todoItem) =>
        todoItem.dataset.status !== "Done"
    ).length;
    document.getElementById("todo-count-done").textContent = todos.filter((todoItem) =>
        todoItem.dataset.status === "Done"
    ).length;
};

const saveTodos = () => {
    const todos = [...todoList.querySelectorAll(".todo-item:not(.is-removing)")].map((todoItem) => ({
        text: todoItem.querySelector(".todo-text").textContent,
        status: todoItem.dataset.status,
    }));

    localStorage.setItem(todosStorageKey, JSON.stringify(todos));
};

const createTodoItem = ({ text: taskText, status: taskStatus = "To Do" }, { animate = false } = {}) => {
    const todoItem = document.createElement("li");
    todoItem.className = "todo-item";
    todoItem.dataset.status = taskStatus;

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

loadTodos();
updateTodoView();

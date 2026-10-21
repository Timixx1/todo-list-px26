const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoEmptyState = document.getElementById("todo-empty-state");
const todosStorageKey = "px26-todos";
const validStatuses = ["To Do", "In Progress", "Done"];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const updateEmptyState = () => {
    const hasTasks = todoList.querySelector(".todo-item");
    todoEmptyState.hidden = Boolean(hasTasks);
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
        saveTodos();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "todo-delete";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${taskText}`);
    deleteButton.addEventListener("click", () => {
        if (prefersReducedMotion.matches) {
            todoItem.remove();
            updateEmptyState();
            saveTodos();
            return;
        }

        deleteButton.disabled = true;
        todoItem.style.height = `${todoItem.offsetHeight}px`;
        void todoItem.offsetHeight;
        todoItem.classList.add("is-removing");
        todoItem.style.height = "0";
        todoItem.addEventListener("transitionend", (event) => {
            if (event.target === todoItem && event.propertyName === "height") {
                todoItem.remove();
                updateEmptyState();
            }
        });
        saveTodos();
    });

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
    updateEmptyState();
    saveTodos();
    todoInput.value = "";
    todoInput.focus();
});

loadTodos();
updateEmptyState();

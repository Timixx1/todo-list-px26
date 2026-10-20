  
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.querySelector(".theme-toggle-label");

const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    localStorage.setItem("px26-theme", theme);

    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
};

const savedTheme = localStorage.getItem("px26-theme") || "light";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
});

todoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const taskText = todoInput.value.trim();
    if (!taskText) {
        return;
    }

    const todoItem = document.createElement("li");
    todoItem.className = "todo-item";
    todoItem.dataset.status = "To Do";

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = taskText;

    const status = document.createElement("select");
    status.className = "todo-status";
    status.setAttribute("aria-label", `Status for ${taskText}`);

    ["To Do", "In Progress", "Done"].forEach((statusName) => {
        const option = document.createElement("option");
        option.value = statusName;
        option.textContent = statusName;
        status.append(option);
    });

    status.addEventListener("change", () => {
        todoItem.dataset.status = status.value;
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "todo-delete";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${taskText}`);
    deleteButton.addEventListener("click", () => {
        todoItem.remove();
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
    todoInput.value = "";
    todoInput.focus();
});
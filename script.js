  
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

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

    todoItem.append(text, status, deleteButton);
    todoList.append(todoItem);
    todoInput.value = "";
    todoInput.focus();
});
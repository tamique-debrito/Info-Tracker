
async function loadTodos() {
    try {
        const response = await fetch('/info_items');
        const todos = await response.json();

        const container = document.getElementById('todo-list');
        container.innerHTML = '';

        if (todos.length === 0) {
            container.innerHTML = "No Todos found"
        }

        todos.forEach(item => {
            const todoDiv = document.createElement('div');
            todoDiv.className = 'todo-item';

            todoDiv.innerHTML = `
                <div class="title">${item.title}</div>
                <div class="detail">Detail: ${item.detail}</div>
                <div class="due-date">Target Date: ${item.tracking.review_date}</div>
                <div class="status">Status: ${item.tracking.status}</div>
                <button onclick="markAsDone('${item.id}')">Mark Done</button>
            `;

            container.appendChild(todoDiv);
        });
    } catch (error) {
        document.getElementById('todo-list').innerText = 'Failed to load todos.';
        console.error('Error loading todos:', error);
    }
}

async function fillAndShowModal(content) {
    var contentContainer = document.getElementById("modal-content-inner");
    var modal = document.getElementById("modal-container");
    contentContainer.innerHTML = content;
    modal.style.display = "block";
}

async function closeModal() {
    var contentContainer = document.getElementById("modal-content-inner");
    var modal = document.getElementById("modal-container");
    contentContainer.innerHTML = null;
    modal.style.display = "none";
}

async function InitModalContainer() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.className = 'modal';
    modalContainer.innerHTML = `
        <div class="modal-content-outer">
            <span class="close-modal-button" id="close-modal-button">&times;</span>
            <div id="modal-content-inner"></div>
        </div>
    `;

    // Append the modal to the end of the body
    document.body.appendChild(modalContainer);
    var closeModalButton = document.getElementById("close-modal-button");
    closeModalButton.onclick = closeModal
}

async function SetUpAndShowNewTodoModal() {
    const modalContent= `
        <form id="todo-form">
            <label>
                Title: <input type="text" name="title" required>
            </label><br><br>
            <label>
                Detail: <input type="text" name="detail" required>
            </label><br><br>
            <label>
                Target Date: <input type="date" name="target_date" required>
            </label><br><br>
            <button type="submit">Add Todo</button>
        </form>`;
    fillAndShowModal(modalContent);
    document.getElementById('todo-form').addEventListener('submit', (e) => {submitNewTodo(e); closeModal(); loadTodos();});
}

async function setUpNewTodoButton() {
    var newTodoButton = document.getElementById("newTodoButton");
    newTodoButton.onclick = SetUpAndShowNewTodoModal
}

async function initialLoad() {
    await loadTodos();
    await InitModalContainer();
    await setUpNewTodoButton();
}

window.onload = initialLoad;

// Handle marking todos as done
async function markAsDone(id) {
    try {
        const response = await fetch(`/info_items/${id}/done`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`Failed to mark as done: ${response.statusText}`);
        }
        loadTodos();
    } catch (error) {
        alert('Error: ' + error.message);
        console.error(error);
    }
}

async function submitNewTodo(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);

    const title = formData.get('title');
    const detail = formData.get('detail');
    const target_date = formData.get('target_date');

    try {
        const response = await fetch('/info_items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, detail, target_date })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        form.reset();
    } catch (err) {
        alert('Failed to add todo: ' + err.message);
        console.error(err);
    }
}
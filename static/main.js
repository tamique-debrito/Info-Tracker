
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

async function SetUpModal() {
    // Modal handling
    var modal = document.getElementById("newTodoModal");
    var btn = document.getElementById("newTodoButton");
    var span = document.getElementById("close-modal-button");
    btn.onclick = function() {
        modal.style.display = "block";
    }
    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    document.getElementById('todo-form').addEventListener('submit', submitNewTodo);
}

async function initialLoad() {
    await loadTodos();
    await SetUpModal();
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
const Status = Object.freeze({
    ACTIVE: 1,
    INACTIVE: 2,
    DONE: 3,
});

const TodoType = Object.freeze({
    TODO: 1,
    PROJECT_IDEA: 2,
    PHILOSOPHICAL_IDEA: 3,
});

const ChangeStatusAction = Object.freeze({
    DEACTIVATE: 1,
    REACTIVATE: 2,
    RESCHEDULE_ONLY: 3,
});

function getTodoTypeText(todoType) {
    switch (todoType) {
        case TodoType.TODO:
            return "(Todo)";
        case TodoType.PROJECT_IDEA:
            return "(Project)";
        case TodoType.PHILOSOPHICAL_IDEA:
            return "(Philosophical)";
        default:
            return "";
    }
}

//##################### Modal Handling
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

async function initModalContainer() {
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

async function setUpAndShowNewTodoModal() {
    const modalContent= `
        <h2>New Todo</h2>
        <form id="todo-form">
            <label>
                Title: <input type="text" name="title" required>
            </label><br><br>
            <label>
                Detail: <input type="text" name="detail" required>
            </label><br><br>
            <label>
                Type: <select name="todo_type" required>
                    <option value="${TodoType.TODO}">Todo</option>
                    <option value="${TodoType.PROJECT_IDEA}">Project Idea</option>
                    <option value="${TodoType.PHILOSOPHICAL_IDEA}">Philosophical Idea</option>
                </select>
            </label><br><br>
            <label>
                Target Date: <input type="date" name="target_date" required>
            </label><br><br>
            <button type="submit" class="form-submit-button">Add Todo</button>
        </form>`;
    fillAndShowModal(modalContent);
    document.getElementById('todo-form').addEventListener('submit', (e) => {submitNewTodo(e).then(() => {closeModal(); loadTodos();});});
}

async function setUpAndShowChangeStatusModal(todoName, todoId, changeAction) {
    const changedReviewDateId = "deactivate-date-input";
    let actionTitle;
    if (changeAction === ChangeStatusAction.DEACTIVATE) {
        actionTitle = "Deactivate"
    } else if (changeAction === ChangeStatusAction.RESCHEDULE_ONLY) {
        actionTitle = "Defer"
    } else if (changeAction === ChangeStatusAction.REACTIVATE) {
        actionTitle = "Reactivate"
    }
    const modalContent = `
        <h2>${actionTitle} "${todoName}"</h2>
        <form id="change-status-reschedule-form">
            <label>
                Review Date: <input id="${changedReviewDateId}" type="date" name="review_date" required>
                <div id="future-date-buttons" class="quick-buttons-after-input"></div>
            </label><br><br>
            <button type="submit" class="form-submit-button">${actionTitle}</button>
        </form>
    `;
    await fillAndShowModal(modalContent);
    
    // Add the future date buttons after the modal content is rendered
    const buttonContainer = document.getElementById('future-date-buttons');
    const buttonGroup = createFutureDateButtonGroup((days) => setFutureDateInInput(changedReviewDateId, days));
    buttonContainer.appendChild(buttonGroup);
    
    document.getElementById('change-status-reschedule-form').addEventListener('submit', (e) => {changeStatusTodo(e, todoId, changeAction).then(() => {closeModal(); loadTodos();});});
}

//##################################### Loading and page init/setup

async function loadTodos() {
    try {
        const response = await fetch('/info_items');
        const todos = await response.json();

        const currentTodosContainer = document.getElementById('current-todos-list');
        const upcomingTodosContainer = document.getElementById('upcoming-todos-list');
        const currentReviewContainer = document.getElementById('current-review-list');
        currentTodosContainer.innerHTML = '';
        upcomingTodosContainer.innerHTML = '';
        currentReviewContainer.innerHTML = '';

        let currentTodos = 0, upcomingTodos = 0, currentToReview = 0;

        todos.forEach(todo => {
            if (todo.tracking.status === Status.ACTIVE) {
                if (new Date(todo.tracking.review_date) <= new Date()) {
                    addTodoToCurrent(currentTodosContainer, todo);
                    currentTodos += 1;
                } else {
                    addTodoToUpcoming(upcomingTodosContainer, todo);
                    upcomingTodos += 1;
                }

            } else if (todo.tracking.status === Status.INACTIVE) {
                addTodoToReview(currentReviewContainer, todo);
                currentToReview += 1;
            }
        });
        if (currentTodos === 0) {
            currentTodosContainer.innerHTML = "No Todos found"
        }
        if (upcomingTodos === 0) {
            upcomingTodosContainer.innerHTML = "No Todos found"
        }
    } catch (error) {
        document.getElementById('current-todos-list').innerText = 'Failed to load todos.';
        console.error('Error loading todos:', error);
    }
}

function generateTodoTitleElement(todo, prefix = "") {
    return `<div class="todo-title" title="${todo.detail}">${prefix}${todo.title} ${getTodoTypeText(todo.todo_type)}</div>`;
}

function formatFutureDate(daysAhead) {
    const today = new Date();
    today.setDate(today.getDate() + daysAhead);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function setFutureDateInInput(inputId, daysAhead) {
    document.getElementById(inputId).value = formatFutureDate(daysAhead);
}

function createFutureDateButton(days, label, onClickCallback) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = () => onClickCallback(days);
    return button;
}

function createFutureDateButtonGroup(onClickCallback, useAbbreviatedLabels = false) {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'quick-button-group';
    
    const buttonConfigs = [
        { days: 1, label: 'Tomorrow', shortLabel: '1d' },
        { days: 3, label: '3 days', shortLabel: '3d' },
        { days: 7, label: '1 week', shortLabel: '1w' },
        { days: 14, label: '2 weeks', shortLabel: '2w' },
        { days: 30, label: '1 month', shortLabel: '1m' }
    ];

    buttonConfigs.forEach(config => {
        const button = createFutureDateButton(
            config.days, 
            useAbbreviatedLabels ? config.shortLabel : config.label, 
            onClickCallback
        );
        buttonGroup.appendChild(button);
    });

    return buttonGroup;
}

function createQuickDeferMenu(todoId, todoTitle) {
    const menuContainer = document.createElement('div');
    menuContainer.className = 'quick-defer-menu';
    
    const buttonGroup = createFutureDateButtonGroup((days) => {
        const futureDate = formatFutureDate(days);
        updateTodoStatus(
            todoId,
            ChangeStatusAction.RESCHEDULE_ONLY,
            futureDate
        ).then(() => loadTodos());
    }, true); // Use abbreviated labels for the quick menu
    
    menuContainer.appendChild(buttonGroup);
    return menuContainer;
}

function addTodoToCurrent(container, todo) {
    const todoDiv = document.createElement('div');
    todoDiv.className = 'todo-item';

    // Create title element
    const titleDiv = document.createElement('div');
    titleDiv.className = 'todo-title';
    titleDiv.title = todo.detail;
    titleDiv.textContent = `${todo.title} ${getTodoTypeText(todo.todo_type)}`;
    todoDiv.appendChild(titleDiv);

    // Create Done button
    const doneButton = document.createElement('button');
    doneButton.innerHTML = '<i class="bi bi-check2-circle icon-by-text"></i> Done';
    doneButton.onclick = () => markAsDone(todo.id);
    todoDiv.appendChild(doneButton);

    // Create Defer button and menu
    const deferButton = document.createElement('button');
    deferButton.innerHTML = '<i class="bi bi-stopwatch icon-by-text"></i> Defer';
    deferButton.className = 'defer-button';
    deferButton.onclick = () => setUpAndShowChangeStatusModal(todo.title, todo.id, ChangeStatusAction.RESCHEDULE_ONLY);
    
    const quickDeferMenu = createQuickDeferMenu(todo.id, todo.title);
    quickDeferMenu.style.display = 'none';
    
    deferButton.addEventListener('mouseenter', () => {
        quickDeferMenu.style.display = 'block';
    });
    
    deferButton.addEventListener('mouseleave', (e) => {
        // Check if we're moving to the menu
        const toElement = e.relatedTarget;
        if (!quickDeferMenu.contains(toElement)) {
            quickDeferMenu.style.display = 'none';
        }
    });
    
    quickDeferMenu.addEventListener('mouseleave', () => {
        quickDeferMenu.style.display = 'none';
    });

    todoDiv.appendChild(deferButton);
    todoDiv.appendChild(quickDeferMenu);

    // Create Deactivate button
    const deactivateButton = document.createElement('button');
    deactivateButton.innerHTML = '<i class="bi bi-bell-slash icon-by-text"></i> Deactivate';
    deactivateButton.onclick = () => setUpAndShowChangeStatusModal(todo.title, todo.id, ChangeStatusAction.DEACTIVATE);
    todoDiv.appendChild(deactivateButton);

    container.appendChild(todoDiv);
}

function addTodoToReview(container, todo) {
    const todoDiv = document.createElement('div');
    todoDiv.className = 'todo-item';

    todoDiv.innerHTML = `
        ${generateTodoTitleElement(todo, "Review: ")}
        <button onclick="setUpAndShowChangeStatusModal('${todo.title}', '${todo.id}', ChangeStatusAction.RESCHEDULE_ONLY)"><i class="bi bi-stopwatch icon-by-text"></i> Leave Inactive</button>
        <button onclick="setUpAndShowChangeStatusModal('${todo.title}', '${todo.id}', ChangeStatusAction.REACTIVATE)"><i class="bi bi-bell icon-by-text"></i> Reactivate</button>
    `;

    container.appendChild(todoDiv);
}

function addTodoToUpcoming(container, todo) {
    const todoDiv = document.createElement('div');
    todoDiv.className = 'todo-item';

    todoDiv.innerHTML = `
        ${generateTodoTitleElement(todo)}<div class="due-date">Target Date: ${todo.tracking.review_date}</div>
    `;

    container.appendChild(todoDiv);
}

async function setUpNewTodoButton() {
    var newTodoButton = document.getElementById("newTodoButton");
    newTodoButton.onclick = setUpAndShowNewTodoModal
}

async function initialLoad() {
    await loadTodos();
    await initModalContainer();
    await setUpNewTodoButton();
}

window.onload = initialLoad;

//############################ Utils

//############################ API calls

// Mark a todo as done
async function markAsDone(todoId) {
    try {
        const response = await fetch(`/info_items/${todoId}/done`, {
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
    const todo_type = parseInt(formData.get('todo_type'));

    try {
        const response = await fetch('/info_items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, detail, target_date, todo_type })
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

async function changeStatusTodo(e, todoId, changeAction, reviewDate = null) {
    e.preventDefault();
    
    const form = e.target;
    const formData = reviewDate ? null : new FormData(form);
    const reviewDateValue = reviewDate || (formData ? formData.get('review_date') : null);

    await updateTodoStatus(todoId, changeAction, reviewDateValue);
    
    if (form) {
        form.reset();
    }
}

async function updateTodoStatus(todoId, changeAction, reviewDate) {
    let newStatus = changeAction === ChangeStatusAction.RESCHEDULE_ONLY ? null : 
                   (changeAction === ChangeStatusAction.DEACTIVATE ? Status.INACTIVE : Status.ACTIVE);

    try {
        const response = await fetch(`/info_items/${todoId}/change_status?review_date=${reviewDate}${newStatus ? "&new_status=" + newStatus : ""}`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Failed to change status: ${response.statusText}`);
        }
    } catch (err) {
        alert('Failed to change status of todo: ' + err.message);
        console.error(err);
        throw err;
    }
}
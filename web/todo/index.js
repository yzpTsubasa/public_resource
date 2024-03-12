/** @returns {HTMLElement} */
function Q(selector) {
  return document.querySelector(selector);
}

Q("#input-todo").contentEditable = true;
Q("body").addEventListener("keydown", (e) => {
  if (!e.shiftKey && e.key == "Enter") {
    e.preventDefault();
    addCurrentTodo();
  }
  else if (e.key == "Escape") {
    Q("#input-todo").innerHTML = "";
  }
});
Q("#btn_add").onclick = addCurrentTodo;
Q("#btn_all_done").onclick = makeAllDone;
Q("body").onclick = function(event) {
  if (event.target.tagName == "IMG") {
    previewDataURL(event.target.src);
  }
};
Q("#btn-reset").onclick = function(event) {
  Q("#input-todo").innerHTML = "";
};

function previewDataURL (content) {
  var string = content
  var iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>"
  var x = window.open()
  x.document.open()
  x.document.write(iframe)
  x.document.close()
}

const LOCAL_STORAGE_KEY = {
  TODO_CFG: "TODO_CFG",
};
var todoList = [];
var nextId = 0;
var localCfg = localStorage.getItem(LOCAL_STORAGE_KEY.TODO_CFG);
if (localCfg) {
  localCfg = JSON.parse(localCfg);
  nextId = localCfg.nextId;
  todoList = localCfg.todoList;
}
updateTodoList();

function addCurrentTodo() {
  const content = Q("#input-todo").innerHTML;
  if (!content) return;
  if (editingTodo) {
    editingTodo.html = content;
    onListChanged();
    updateTodo(editingTodo);
    Q(`#todo-wrapper-${editingTodo.id}`)?.classList.remove("editing");
    editingTodo = null;
  } else {
    addTodo(content);
  }
  Q("#input-todo").innerHTML = "";
}

function makeAllDone() {
  todoList.forEach(todo => {
    if (!todo.done) {
      todo.done = true;
      updateTodo(todo);
    }
  });
  onListChanged();
}

function addTodo(html) {
  const todo = {
    id: nextId++,
    html: html,
    done: false,
  };
  todoList.push(todo);
  onListChanged();
  updateTodo(todo);
}

function onListChanged() {
  updateProgress();
  localStorage.setItem(
    LOCAL_STORAGE_KEY.TODO_CFG,
    JSON.stringify({
      nextId,
      todoList,
    })
  );
}

function updateProgress() {
  let progress = todoList.length ? (todoList.reduce((acc, v) => (acc + (v.done ? 1 : 0)), 0) / todoList.length) : 1;
  progress = (progress * 100).toFixed();
  Q(".progress-bar").style.width = Q(".progress-bar").innerText = `${progress}%`;
  const favicon = progress == 100 ? "favicon.png" : "favicon@badge.png";
  Q(`link[type="image/x-icon"]`).href = favicon;
}

function updateTodoList() {
  Q(".todo-list").innerHTML = '';
  todoList.forEach((todo) => {
    updateTodo(todo);
  });
  updateProgress();
}

function onTodoChange(event) {
  const input = event.currentTarget;
  const todo = todoList.find((v) => v.id == input.dataset.id);
  if (todo) {
    todo.done = input.checked;
    updateTodo(todo);
    onListChanged();
  }
}


var editingTodo = null;
function onTodoEdit(event) {
  const input = event.currentTarget;
  const todo = todoList.find((v) => v.id == input.dataset.id);
  if (editingTodo) {
    Q(`#todo-wrapper-${editingTodo.id}`)?.classList.remove("editing");
  }
  if (editingTodo == todo) {
    editingTodo = null;
    Q("#input-todo").innerHTML = "";
    return;
  }
  if (todo) {
    editingTodo = todo;
    Q("#input-todo").innerHTML = todo.html;
    Q(`#todo-wrapper-${editingTodo.id}`)?.classList.add("editing");
  }
}

function onRemoveTodo(event) {
  const input = event.currentTarget;
  const todoIdx = todoList.findIndex((v) => v.id == input.dataset.id);
  if (todoIdx != -1) {
    const todo = todoList[todoIdx];
    Q(`#todo-wrapper-${todo.id}`)?.remove();
    todoList.splice(todoIdx, 1);
    onListChanged();
  }
}

function updateTodo(todo) {
  const elementString = `
  <div class="shadow p-2 bg-body-tertiary rounded" style="margin-bottom: 5px; display: flex; align-items: center;justify-content: space-between;" id="todo-wrapper-${todo.id}" data-id=${todo.id}>
    <div class="form-check form-control-lg" style="display: flex; align-items: center; gap: 10px; color: ${todo.done ? "gray" : "black"}; text-decoration: ${todo.done ? "line-through" : "none"}">
      <input class="form-check-input" type="checkbox" ${todo.done ? "checked" : ""} data-id=${todo.id}>
      <label class="form-check-label" data-id=${todo.id}>
        ${todo.html}
      </label>
    </div>
    <button type="button" class="btn-close" data-id=${todo.id}></button>
  </div>
  `;
  // Create a new DOMParser
  const parser = new DOMParser();
  // Parse the element string
  const doc = parser.parseFromString(elementString, "text/html");
  // Access the parsed element
  const element = doc.body.firstChild;
  const existingElement = Q(`.todo-list #todo-wrapper-${todo.id}`);
  if (existingElement) {
    Q(".todo-list").insertBefore(element, existingElement);
    existingElement.remove();
  } else {
    Q(".todo-list").appendChild(element);
  }
  Q(`.todo-list input[data-id="${todo.id}"]`).onchange = onTodoChange;
  Q(`.todo-list .btn-close[data-id="${todo.id}"]`).onclick = onRemoveTodo;
  element.ondblclick = onTodoEdit;
}

Q("#btn_remove_done").onclick = function() {
  todoList = todoList.filter(todo => {
    if (todo.done) {
      Q(`#todo-wrapper-${todo.id}`)?.remove();
      return false;
    }
    return true;
  });
  onListChanged();
}
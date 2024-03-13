import 'bootstrap/dist/css/bootstrap.min.css'
import './styles.css'
import { createRef, useEffect, useState } from 'react'
import TodoList from './TodoList';
var test  = "";
const LocalStorageKey = {
  REACT_TODO_LIST: "REACT_TODO_LIST",
};
function App() {
  const inputRef = createRef();
  const [newItem, setNewItem] = useState('');
  const [todoList, setTodoList] = useState(() => {
    const localTodoList = localStorage.getItem(LocalStorageKey.REACT_TODO_LIST);
    if (localTodoList) {
      return JSON.parse(localTodoList);
    }
    return [];
  });
  function onNewItemKeyDown(evt) {
    if (!evt.shiftKey && evt.key == "Enter") {
      event.target.blur();
      addNewItem();
    }
  }
  function onNewItemChange(evt) {
    setNewItem(evt.target.innerHTML);
    test = evt.target.innerHTML;
  }
  function addNewItem() {
    if (!test) return;
    setTodoList([...todoList, {
      id: crypto.randomUUID(),
      html: test,
      create_time: Date.now(),
      done: false,
    }]);
    setNewItem("");
    test = "";
  }
  function toggleTodo(id, done) {
    setTodoList(todoList.map(item => {
      if (id == item.id) {
        return {...item, done}
      }
      return item;
    }));
  }
  function removeTodo(id) {
    setTodoList(todoList.filter(item => {
      return id != item.id;
    }));
  }
  function removeDoneItem() {
    setTodoList(todoList.filter(item => !item.done));
  }

  useEffect(() => {
    localStorage.setItem(LocalStorageKey.REACT_TODO_LIST, JSON.stringify(todoList));
    const favicon = todoList.every(v => v.done) ? "favicon.png" : "favicon@badge.png";
    document.querySelector(`link[rel="icon"]`).href = favicon;
  }, [todoList])
  return (
    <div className="card">
      <h2 className="text-light-emphasis">Todo List</h2>
      <div className='input-area'>
        <div id='new-item-wrapper' className="shadow p-3 bg-body-tertiary rounded">
            <div ref={inputRef} contentEditable dangerouslySetInnerHTML={{__html: newItem}} onBlur={onNewItemChange} onKeyDown={onNewItemKeyDown}></div>
            <button type="button" className="btn-close"></button>
        </div>
        <div className="btn-group edit-group" role="group">
            <button type="button" className="btn btn-lg btn-outline-danger" onClick={removeDoneItem}>清除已完成</button>
            <button type="button" className="btn btn-lg btn-success" onClick={addNewItem}>添加</button>
        </div>
      </div>
        <TodoList todoList={todoList} toggleTodo={toggleTodo} removeTodo={removeTodo}/>
      </div>
  )
}

export default App

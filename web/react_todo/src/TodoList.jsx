import PropTypes from 'prop-types';
import { useState } from 'react';
export default function TodoList({ todoList, toggleTodo, removeTodo }) {
const [sortType, setSortType] = useState(true);
const [sortOrder, setSortOrder] = useState(false);
return (
  <>
    {todoList.length == 0 && <h5 className="done-tip">所有事项已完成!</h5>}
    <details>
      <summary>排序</summary>
      <div className="sort-group btn-group" role="group">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setSortType(!sortType)}
        >
          {sortType ? "按完成状态" : "以创建时间排序"}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setSortOrder(!sortOrder)}
        >
          {sortOrder ? "降序" : "升序"}
        </button>
      </div>
    </details>
    <div className="todo-list">
      {todoList
        .toSorted((a, b) => {
          if (sortType) {
            return (
              (a.done - b.done || a.create_time - b.create_time) *
              (-1) ** sortOrder
            );
          }
          return (a.create_time - b.create_time) * (-1) ** sortOrder;
        })
        .map((item) => (
          <div key={item.id} className="shadow p-2 bg-dark-subtle bg-gradient rounded">
            <div className="form-check form-control-lg">
              <input
                className="form-check-input"
                type="checkbox"
                checked={item.done}
                onChange={(e) => toggleTodo(item.id, e.target.checked)}
              />
              <label
                className={`form-check-label ${item.done ? "done" : ""}`}
                dangerouslySetInnerHTML={{ __html: item.html }}
              ></label>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => removeTodo(item.id)}
            ></button>
          </div>
        ))}
    </div>
  </>
);
}
TodoList.propTypes = {
todoList: PropTypes.array,
toggleTodo: PropTypes.func,
removeTodo: PropTypes.func,
}
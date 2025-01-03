document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const previewModal = document.querySelector('.preview-modal');
    const previewImage = previewModal.querySelector('.preview-image');
    const prevButton = previewModal.querySelector('.preview-prev');
    const nextButton = previewModal.querySelector('.preview-next');
    const closeButton = previewModal.querySelector('.preview-close');
    const previewCounter = previewModal.querySelector('.preview-counter');
    const sortButtons = document.querySelectorAll('.sort-btn');
    const hideCompletedCheckbox = document.getElementById('hide-completed');
    const clearCompletedBtn = document.getElementById('clear-completed');
    let currentImages = [];
    let currentImageIndex = 0;
    let currentSortField = 'createTime';
    let currentSortOrder = 'desc';
    let hideCompleted = false;

    // 从本地存储加载待办事项
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // 添加时间格式化函数
    function formatTime(timestamp) {
        if (!timestamp) return '';
        
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        // 判断是否是同一年
        const isSameYear = now.getFullYear() === date.getFullYear();
        
        // 今天的日期
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // 昨天的日期
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // 格式化具体时间
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        // 刚刚（1分钟内）
        if (seconds < 60) {
            return '刚刚';
        }
        // x分钟前（1小时内）
        else if (minutes < 60) {
            return `${minutes}分钟前`;
        }
        // x小时前（今天内）
        else if (date >= today) {
            return `${hours}小时前`;
        }
        // 昨天
        else if (date >= yesterday) {
            return `昨天 ${timeStr}`;
        }
        // 7天内
        else if (days < 7) {
            return `${days}天前`;
        }
        // 同年显示月日
        else if (isSameYear) {
            return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
        }
        // 不同年显示完整日期
        else {
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
        }
    }

    // 渲染待办事项列表
    function renderTodos() {
        sortTodos();
        todoList.innerHTML = '';
        
        // 检查是否有已完成项
        const hasCompletedItems = todos.some(todo => todo.completed);
        
        // 如果没有已完成项，强制取消隐藏
        if (!hasCompletedItems && hideCompleted) {
            hideCompleted = false;
            saveSettings();
        }
        
        // 检查是否有任何待办事项
        if (todos.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `
                <div class="empty-icon">📝</div>
                <div class="empty-text">还没有待办事项</div>
                <div class="empty-hint">点击上方"添加"按钮创建新的待办事项</div>
            `;
            todoList.appendChild(emptyMessage);
            return;
        }
        
        todos.forEach((todo, index) => {
            if (hideCompleted && todo.completed) {
                return;
            }
            
            const todoItem = document.createElement('div');
            todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            // 创建复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                toggleComplete(index, checkbox.checked);
            });
            
            // 创建主要内容区域（包含文本和图片）
            const mainContent = document.createElement('div');
            mainContent.className = 'main-content';
            
            // 创建一个内容包装器
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'content-wrapper';
            mainContent.appendChild(contentWrapper);
            
            // 将双击事件监听器添加到主要内容区域
            mainContent.addEventListener('dblclick', (e) => {
                // 防止点击图片时触发编辑
                if (!e.target.matches('img')) {
                    startEditing(todoItem, todo, index);
                }
            });

            // 处理文本和图片混合内容
            const parts = todo.text.split(/(\[img:[^[\]]*\])/);
            parts.forEach(part => {
                if (part.startsWith('[img:') && part.endsWith(']')) {
                    const imgSrc = part.slice(5, -1);
                    const img = document.createElement('img');
                    img.src = imgSrc;
                    img.addEventListener('click', () => openPreview(todo.text, imgSrc));
                    contentWrapper.appendChild(img);
                } else if (part) {
                    const textNode = document.createElement('div');
                    textNode.textContent = part;
                    contentWrapper.appendChild(textNode);
                }
            });
            
            // 创建右侧容器（包含按钮和时间）
            const rightContainer = document.createElement('div');
            rightContainer.className = 'right-container';
            
            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            
            // 添加编辑按钮
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '编辑';
            editBtn.addEventListener('click', () => {
                startEditing(todoItem, todo, index);
            });
            buttonContainer.appendChild(editBtn);
            
            // 创建删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', () => {
                showDeleteConfirm(todoItem, index);
            });
            buttonContainer.appendChild(deleteBtn);
            
            // 创建时间显示
            const timeContainer = document.createElement('div');
            timeContainer.className = 'time-container';
            
            // 根据当前排序字段显示对应的时间
            const timeLabel = currentSortField === 'createTime' ? '创建于：' : '完成于：';
            const timestamp = currentSortField === 'createTime' ? todo.createTime : todo.completeTime;
            
            if (currentSortField === 'createTime' || timestamp) {
                timeContainer.innerHTML = `
                    <span class="time-label">${timeLabel}</span>
                    <span class="time-value">${formatTime(timestamp)}</span>
                `;
            } else {
                // 当按完成时间排序且项目未完成时，只显示"未完成"
                timeContainer.innerHTML = `
                    <span class="time-value unfinished">未完成</span>
                `;
            }
            
            // 组装右侧容器
            rightContainer.appendChild(buttonContainer);
            rightContainer.appendChild(timeContainer);
            
            todoItem.appendChild(checkbox);
            todoItem.appendChild(mainContent);  // 使用 mainContent 替代直接的 content
            todoItem.appendChild(rightContainer);
            
            todoList.appendChild(todoItem);
            
            // 添加鼠标样式提示可编辑
            mainContent.style.cursor = 'pointer';
        });
    }

    // 保存待办事项到本地存储
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // 添加新的待办事项
    function addTodo() {
        const text = todoInput.value;
        if (text && text.trim()) {  // 只检查是否全为空格
            todos.push({
                text,  // 保存原始文本
                completed: false,
                createTime: Date.now(),
                completeTime: null
            });
            todoInput.value = '';  // 清空输入框
            saveTodos();
            renderTodos();
        }
    }

    // 图片预览相关函数
    function openPreview(todoText, clickedImgSrc) {
        currentImages = todoText.match(/\[img:[^\]]*\]/g)?.map(img => img.slice(5, -1)) || [];
        currentImageIndex = currentImages.indexOf(clickedImgSrc);
        
        updatePreviewImage();
        previewModal.classList.add('active');
        document.addEventListener('keydown', handleKeyPress);
    }

    function updatePreviewImage() {
        previewImage.src = currentImages[currentImageIndex];
        previewCounter.textContent = `${currentImageIndex + 1}/${currentImages.length}`;
        prevButton.style.visibility = currentImageIndex > 0 ? 'visible' : 'hidden';
        nextButton.style.visibility = currentImageIndex < currentImages.length - 1 ? 'visible' : 'hidden';
    }

    function closePreview() {
        previewModal.classList.remove('active');
        document.removeEventListener('keydown', handleKeyPress);
    }

    function handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowLeft': showPrevImage(); break;
            case 'ArrowRight': showNextImage(); break;
            case 'Escape': closePreview(); break;
        }
    }

    function showPrevImage() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updatePreviewImage();
        }
    }

    function showNextImage() {
        if (currentImageIndex < currentImages.length - 1) {
            currentImageIndex++;
            updatePreviewImage();
        }
    }

    // 事件监听器
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {  // 只在非 Shift + Enter 时添加
            e.preventDefault();  // 阻止默认的换行行为
            addTodo();
        }
    });

    todoInput.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = function(event) {
                    const imageData = event.target.result;
                    const cursorPosition = todoInput.selectionStart;
                    const textBefore = todoInput.value.substring(0, cursorPosition);
                    const textAfter = todoInput.value.substring(cursorPosition);
                    todoInput.value = textBefore + `[img:${imageData}]` + textAfter;
                };
                reader.readAsDataURL(file);
            }
        }
    });

    prevButton.addEventListener('click', showPrevImage);
    nextButton.addEventListener('click', showNextImage);
    closeButton.addEventListener('click', closePreview);
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            closePreview();
        }
    });

    // 修改编辑相关函数
    function startEditing(todoItem, todo, index) {
        // 获取右侧容器和其中的元素
        const rightContainer = todoItem.querySelector('.right-container');
        const buttonContainer = rightContainer.querySelector('.button-container');
        const mainContent = todoItem.querySelector('.main-content');
        
        // 添加编辑状态类名
        buttonContainer.classList.add('editing');
        
        // 创建编辑区域
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';
        
        // 创建编辑文本框
        const editInput = document.createElement('textarea');
        editInput.className = 'edit-input';
        editInput.value = todo.text;
        
        // 创建编辑按钮容器
        const editButtonContainer = document.createElement('div');
        editButtonContainer.className = 'edit-buttons';
        
        // 创建保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = '保存';
        
        // 创建取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = '取消';
        
        editButtonContainer.appendChild(saveBtn);
        editButtonContainer.appendChild(cancelBtn);
        
        editContainer.appendChild(editInput);
        editContainer.appendChild(editButtonContainer);
        
        // 隐藏原有内容和按钮
        mainContent.style.display = 'none';
        buttonContainer.style.display = 'none';
        
        // 在主内容区域的位置插入编辑容器
        mainContent.parentNode.insertBefore(editContainer, mainContent);
        
        // 支持图片粘贴
        editInput.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const imageData = event.target.result;
                        const cursorPosition = editInput.selectionStart;
                        const textBefore = editInput.value.substring(0, cursorPosition);
                        const textAfter = editInput.value.substring(cursorPosition);
                        editInput.value = textBefore + `[img:${imageData}]` + textAfter;
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
        
        // 保存编辑
        saveBtn.addEventListener('click', () => {
            const newText = editInput.value;
            if (newText && newText.trim()) {  // 只检查是否全为空格
                todos[index].text = newText;  // 保存原始文本
                saveTodos();
                renderTodos();
            }
        });
        
        // 取消编辑
        cancelBtn.addEventListener('click', () => {
            renderTodos();
        });
        
        // 聚焦到输入框
        editInput.focus();
    }

    // 修改删除确认相关函数
    function showDeleteConfirm(todoItem, index) {
        // 如果是已完成项目，直接删除
        if (todos[index].completed) {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
            return;
        }
        
        // 以下是未完成项目的确认逻辑
        const rightContainer = todoItem.querySelector('.right-container');
        const buttonContainer = rightContainer.querySelector('.button-container');
        const timeContainer = rightContainer.querySelector('.time-container');
        
        // 添加确认状态类名
        buttonContainer.classList.add('confirming');
        
        // 创建确认对话框容器
        const confirmContainer = document.createElement('div');
        confirmContainer.className = 'confirm-container';
        
        // 创建确认文本
        const confirmText = document.createElement('span');
        confirmText.textContent = '确定要删除吗？';
        confirmText.className = 'confirm-text';
        
        // 创建确认按钮
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'confirm-btn';
        confirmBtn.textContent = '确定';
        
        // 创建取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = '取消';
        
        // 添加按钮到容器
        confirmContainer.appendChild(confirmText);
        confirmContainer.appendChild(confirmBtn);
        confirmContainer.appendChild(cancelBtn);
        
        // 隐藏原有按钮容器
        buttonContainer.style.display = 'none';
        
        // 在按钮容器的位置插入确认对话框
        buttonContainer.parentNode.insertBefore(confirmContainer, buttonContainer);
        
        // 确认删除
        confirmBtn.addEventListener('click', () => {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        });
        
        // 取消删除
        cancelBtn.addEventListener('click', () => {
            renderTodos();
        });
    }

    // 修改完成状态的处理
    function toggleComplete(index, completed) {
        todos[index].completed = completed;
        todos[index].completeTime = completed ? Date.now() : null;
        saveTodos();
        renderTodos();
    }

    // 修改排序函数
    function sortTodos() {
        todos.sort((a, b) => {
            let valueA, valueB;
            
            if (currentSortField === 'createTime') {
                valueA = a.createTime;
                valueB = b.createTime;
            } else if (currentSortField === 'completeTime') {
                valueA = a.completeTime || Number.MAX_SAFE_INTEGER;
                valueB = b.completeTime || Number.MAX_SAFE_INTEGER;
            }

            return currentSortOrder === 'asc' 
                ? valueA - valueB 
                : valueB - valueA;
        });
    }

    // 更新排序按钮状态
    function updateSortButtons() {
        sortButtons.forEach(btn => {
            const isActive = btn.dataset.field === currentSortField;
            btn.classList.toggle('active', isActive);
            if (isActive) {
                btn.dataset.order = currentSortOrder;
            } else {
                delete btn.dataset.order;
            }
        });
    }

    // 处理排序按钮点击
    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const field = btn.dataset.field;
            
            if (field === currentSortField) {
                // 切换排序顺序
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                // 切换排序字段
                currentSortField = field;
                currentSortOrder = 'desc';  // 默认降序
            }
            
            saveSettings();
            updateSortButtons();
            renderTodos();
        });
    });

    // 初始化排序按钮状态
    updateSortButtons();

    // 添加隐藏已完成项的事件监听器
    hideCompletedCheckbox.addEventListener('change', (e) => {
        hideCompleted = e.target.checked;
        saveSettings();
        renderTodos();
    });

    // 从本地存储加载设置
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('todoSettings')) || {
            hideCompleted: false,
            sortField: 'createTime',
            sortOrder: 'desc'
        };
        
        hideCompleted = settings.hideCompleted;
        currentSortField = settings.sortField;
        currentSortOrder = settings.sortOrder;
        
        // 更新 UI 状态
        hideCompletedCheckbox.checked = hideCompleted;
        updateSortButtons();
    }

    // 保存设置到本地存储
    function saveSettings() {
        const settings = {
            hideCompleted,
            sortField: currentSortField,
            sortOrder: currentSortOrder
        };
        localStorage.setItem('todoSettings', JSON.stringify(settings));
    }

    // 修改清除已完成项的函数
    function clearCompleted() {
        // 获取已完成的项目
        const completedTodos = todos.filter(todo => todo.completed);
        
        if (completedTodos.length > 0) {
            // 创建确认对话框容器
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'confirm-dialog';
            
            // 创建确认框内容
            const dialogContent = document.createElement('div');
            dialogContent.className = 'dialog-content';
            
            // 创建标题
            const title = document.createElement('h3');
            title.textContent = '确认清除';
            
            // 创建确认文本
            const message = document.createElement('div');
            message.className = 'dialog-message';
            
            // 获取最多三条已完成项的预览
            const previewItems = completedTodos.slice(0, 3).map(todo => {
                // 处理文本预览，去除图片标记，限制长度
                const textPreview = todo.text
                    .replace(/\[img:[^\]]*\]/g, '[图片]')
                    .slice(0, 20);
                return `<div class="preview-text">"${textPreview}${textPreview.length >= 20 ? '...' : ''}"</div>`;
            }).join('');
            
            // 组装消息文本
            message.innerHTML = `
                <p>确定要清除所有已完成的项目吗？</p>
                <div class="todo-preview">
                    <span class="preview-count">共 ${completedTodos.length} 条已完成项：</span>
                    ${previewItems}
                    ${completedTodos.length > 3 ? `<div class="preview-more">等${completedTodos.length - 3}条更多...</div>` : ''}
                </div>
            `;
            
            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'dialog-buttons';
            
            // 创建确认按钮
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'confirm-btn';
            confirmBtn.textContent = '确定';
            
            // 创建取消按钮
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = '取消';
            
            // 组装对话框
            buttonContainer.appendChild(cancelBtn);
            buttonContainer.appendChild(confirmBtn);
            dialogContent.appendChild(title);
            dialogContent.appendChild(message);
            dialogContent.appendChild(buttonContainer);
            confirmDialog.appendChild(dialogContent);
            
            // 添加到页面
            document.body.appendChild(confirmDialog);
            
            // 添加动画类
            setTimeout(() => confirmDialog.classList.add('active'), 0);
            
            // 事件处理
            confirmBtn.addEventListener('click', () => {
                todos = todos.filter(todo => !todo.completed);
                saveTodos();
                renderTodos();
                closeDialog();
            });
            
            cancelBtn.addEventListener('click', closeDialog);
            
            // 点击背景关闭
            confirmDialog.addEventListener('click', (e) => {
                if (e.target === confirmDialog) {
                    closeDialog();
                }
            });
            
            function closeDialog() {
                confirmDialog.classList.remove('active');
                setTimeout(() => confirmDialog.remove(), 200);
            }
        }
    }

    // 添加清除按钮的事件监听器
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // 初始化
    loadSettings();  // 先加载设置
    renderTodos();   // 然后渲染列表
}); 
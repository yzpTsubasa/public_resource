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
    let currentImages = [];
    let currentImageIndex = 0;
    let currentSortField = 'createTime';
    let currentSortOrder = 'desc';
    let currentScale = 1;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;

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
        
        // 将待办事项分为未完成和已完成两组
        const uncompletedTodos = todos.filter(todo => !todo.completed);
        const completedTodos = todos.filter(todo => todo.completed);
        
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
        
        // 渲染未完成的待办事项
        uncompletedTodos.forEach((todo, index) => {
            const todoItem = renderTodoItem(todo, index);
            todoList.appendChild(todoItem);
        });
        
        // 如果有已完成的待办事项，添加分组
        if (completedTodos.length > 0) {
            // 创建已完成分组标题
            const completedGroup = document.createElement('div');
            completedGroup.className = 'completed-group';
            
            const completedHeader = document.createElement('div');
            completedHeader.className = 'completed-header';
            completedHeader.innerHTML = `
                <div class="completed-title">
                    <span class="completed-icon">✓</span>
                    已完成 (${completedTodos.length})
                </div>
                <div class="completed-actions">
                    <button id="clear-completed" class="clear-btn">清除已完成</button>
                    <button class="toggle-completed">
                        <span class="toggle-icon">▼</span>
                    </button>
                </div>
            `;
            
            // 创建已完成项目容器
            const completedContainer = document.createElement('div');
            completedContainer.className = 'completed-container';
            
            // 根据保存的设置设置初始折叠状态
            const isCollapsed = loadSettings();
            if (isCollapsed) {
                completedContainer.classList.add('collapsed');
            }
            
            // 修改折叠图标
            const toggleIcon = completedHeader.querySelector('.toggle-icon');
            toggleIcon.textContent = isCollapsed ? '▶' : '▼';
            
            // 渲染已完成的待办事项
            completedTodos.forEach((todo, index) => {
                const todoItem = renderTodoItem(todo, uncompletedTodos.length + index);
                completedContainer.appendChild(todoItem);
            });
            
            // 修改折叠功能
            function toggleCollapse(e) {
                if (e.target.closest('.clear-btn')) {
                    return;
                }
                
                completedContainer.classList.toggle('collapsed');
                const toggleIcon = completedHeader.querySelector('.toggle-icon');
                toggleIcon.textContent = completedContainer.classList.contains('collapsed') ? '▶' : '▼';
                
                // 保存设置
                saveSettings();
            }
            
            // 点击整个header区域都可以触发折叠/展开
            completedHeader.addEventListener('click', toggleCollapse);
            
            // 添加清除按钮的事件监听
            completedHeader.querySelector('.clear-btn').addEventListener('click', clearCompleted);
            
            completedGroup.appendChild(completedHeader);
            completedGroup.appendChild(completedContainer);
            todoList.appendChild(completedGroup);
        }
    }

    // 将渲染单个待办事项的逻辑抽取为独立函数
    function renderTodoItem(todo, index) {
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
        
        const timeLabel = '创建于：';
        const timestamp = todo.createTime;
        
        timeContainer.innerHTML = `
            <span class="time-label">${timeLabel}</span>
            <span class="time-value">${formatTime(timestamp)}</span>
        `;
        
        // 组装右侧容器
        rightContainer.appendChild(buttonContainer);
        rightContainer.appendChild(timeContainer);
        
        todoItem.appendChild(checkbox);
        todoItem.appendChild(mainContent);  // 使用 mainContent 替代直接的 content
        todoItem.appendChild(rightContainer);
        
        // 添加鼠标样式提示可编辑
        mainContent.style.cursor = 'pointer';
        
        return todoItem;
    }

    // 保存待办事项到本地存储
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // 添加新的待办事项
    function addTodo() {
        const todoText = todoInput.value.trim();
        if (todoText) {
            const todo = {
                text: todoText,
                completed: false,
                createTime: Date.now(),
                id: Date.now()
            };
            
            todos.push(todo);
            renderTodos();
            saveTodos();
            todoInput.value = '';
        }
    }

    // 图片预览相关函数
    function openPreview(todoText, clickedImgSrc) {
        currentImages = todoText.match(/\[img:[^\]]*\]/g)?.map(img => img.slice(5, -1)) || [];
        currentImageIndex = currentImages.indexOf(clickedImgSrc);
        
        // 重置缩放和位置
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
        
        updatePreviewImage();
        previewModal.classList.add('active');
        document.addEventListener('keydown', handleKeyPress);
    }

    function updatePreviewImage() {
        previewImage.src = currentImages[currentImageIndex];
        previewCounter.textContent = `${currentImageIndex + 1}/${currentImages.length}`;
        prevButton.style.visibility = currentImageIndex > 0 ? 'visible' : 'hidden';
        nextButton.style.visibility = currentImageIndex < currentImages.length - 1 ? 'visible' : 'hidden';
        
        // 重置缩放和位置
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
    }

    function closePreview() {
        previewModal.classList.remove('active');
        document.removeEventListener('keydown', handleKeyPress);
        
        // 重置缩放和位置
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
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

    // 修改处理 HTML 粘贴的相关代码
    function processHtmlPaste(html, input) {
        console.log(html);
        
        // 创建一个临时的 div 来解析 HTML 结构
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        tempDiv.innerHTML = html;
        
        // 处理所有图片元素并获取处理后的 HTML
        const images = tempDiv.getElementsByTagName('img');
        let pendingImages = Array.from(images).length;
        
        if (pendingImages === 0) {
            document.body.removeChild(tempDiv);
            const div = document.createElement('div');
            div.innerHTML = html;
            insertCleanText(div);
            return;
        }
        
        for (let img of images) {
            const src = img.getAttribute('src');
            if (src && src.startsWith('file://')) {
                // 统一将反斜杠转换为正斜杠
                const normalizedSrc = src.replace(/\\/g, '/');
                // 分离路径和文件名
                const lastSlashIndex = normalizedSrc.lastIndexOf('/');
                if (lastSlashIndex !== -1) {
                    const path = normalizedSrc.substring(0, lastSlashIndex + 1);
                    const filename = normalizedSrc.substring(lastSlashIndex + 1);
                    // 对文件名进行 encodeURI 处理
                    const encodedFilename = encodeURI(filename);
                    // 构建 http URL
                    const httpUrl = path.replace('file://', 'http://localhost:18686/file') + encodedFilename;
                    
                    // 下载图片并转换为 base64
                    fetch(httpUrl)
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onload = function(event) {
                                const base64Data = event.target.result;
                                img.outerHTML = `[img:${base64Data}]`;
                                
                                // 检查是否所有图片都处理完成
                                pendingImages--;
                                if (pendingImages === 0) {
                                    const processedHtml = tempDiv.innerHTML;
                                    document.body.removeChild(tempDiv);
                                    
                                    const div = document.createElement('div');
                                    div.innerHTML = processedHtml;
                                    insertCleanText(div);
                                }
                            };
                            reader.readAsDataURL(blob);
                        })
                        .catch(error => {
                            console.error('Error downloading image:', error);
                            pendingImages--;
                            if (pendingImages === 0) {
                                const processedHtml = tempDiv.innerHTML;
                                document.body.removeChild(tempDiv);
                                
                                const div = document.createElement('div');
                                div.innerHTML = processedHtml;
                                insertCleanText(div);
                            }
                        });
                }
            } else {
                pendingImages--;
                if (pendingImages === 0) {
                    const processedHtml = tempDiv.innerHTML;
                    document.body.removeChild(tempDiv);
                    
                    const div = document.createElement('div');
                    div.innerHTML = processedHtml;
                    insertCleanText(div);
                }
            }
        }
        
        // 插入处理后的文本
        function insertCleanText(div) {
            // 获取处理后的文本内容，不进行 HTML 转换
            const cleanText = div.textContent;
            
            // 在光标位置插入文本
            const cursorPosition = input.selectionStart;
            const textBefore = input.value.substring(0, cursorPosition);
            const textAfter = input.value.substring(cursorPosition);
            input.value = textBefore + cleanText + textAfter;
            
            // 更新光标位置
            input.selectionStart = input.selectionEnd = cursorPosition + cleanText.length;
            
            // 自动添加待办事项
            addTodo();
        }
    }

    // 修改文档级别的粘贴事件处理
    document.addEventListener('paste', (e) => {
        // 如果粘贴发生在输入框或编辑框中，不做处理
        if (e.target.matches('textarea, input')) {
            return;
        }

        const items = e.clipboardData.items;
        let handled = false;

        // 检查是否有 HTML 内容
        const html = e.clipboardData.getData('text/html');
        if (html) {
            e.preventDefault();
            handled = true;
            processHtmlPaste(html, todoInput);
            // 不需要在这里调用 addTodo，因为 insertCleanText 会处理
        }

        // 如果没有处理 HTML，则检查是否有图片
        if (!handled) {
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
                        // 图片加载完成后自动添加
                        addTodo();
                    };
                    reader.readAsDataURL(file);
                    break;
                }
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
        
        // 修改编辑区域的粘贴事件处理
        editInput.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            let handled = false;

            // 首先检查是否有 HTML 内容
            const html = e.clipboardData.getData('text/html');
            if (html) {
                e.preventDefault();
                handled = true;
                processHtmlPaste(html, editInput);
            }

            // 如果没有处理 HTML，则检查是否有图片
            if (!handled) {
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
                        break;
                    }
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
        // 获取未完成和已完成的待办事项
        const uncompletedTodos = todos.filter(todo => !todo.completed);
        const completedTodos = todos.filter(todo => todo.completed);
        
        // 根据当前项目的完成状态和索引找到正确的待办事项
        let todo;
        let realIndex;
        if (completed) {
            // 如果是标记为完成，说明是在未完成列表中
            todo = uncompletedTodos[index];
            realIndex = todos.findIndex(t => t.id === todo.id);
        } else {
            // 如果是标记为未完成，说明是在已完成列表中
            todo = completedTodos[index - uncompletedTodos.length];
            realIndex = todos.findIndex(t => t.id === todo.id);
        }
        
        // 更新待办事项状态
        if (realIndex !== -1) {
            todos[realIndex].completed = completed;
            todos[realIndex].completeTime = completed ? Date.now() : null;
            saveTodos();
            renderTodos();
        }
    }

    // 修改排序函数
    function sortTodos() {
        todos.sort((a, b) => {
            const valueA = a.createTime;
            const valueB = b.createTime;

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

    // 从本地存储加载设置
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('todoSettings')) || {
            sortField: 'createTime',
            sortOrder: 'desc',
            completedCollapsed: false  // 添加折叠状态的默认值
        };
        
        currentSortField = 'createTime';
        currentSortOrder = settings.sortOrder;
        
        // 更新 UI 状态
        updateSortButtons();
        
        return settings.completedCollapsed;  // 返回折叠状态
    }

    // 保存设置到本地存储
    function saveSettings() {
        const settings = {
            sortField: currentSortField,
            sortOrder: currentSortOrder,
            completedCollapsed: document.querySelector('.completed-container')?.classList.contains('collapsed') || false
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

    // 添加更新图片变换的函数
    function updateImageTransform() {
        previewImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }

    // 修改鼠标滚轮事件处理
    previewImage.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY;
        const scaleChange = delta > 0 ? 0.9 : 1.1;  // 缩小或放大 10%
        
        // 计算新的缩放值，并限制在合理范围内
        const newScale = Math.min(Math.max(currentScale * scaleChange, 0.1), 10);
        
        // 获取图片的变换前位置和尺寸
        const rect = previewImage.getBoundingClientRect();
        
        // 计算鼠标在图片上的相对位置（0-1之间的值）
        const mouseXRatio = (e.clientX - rect.left) / rect.width;
        const mouseYRatio = (e.clientY - rect.top) / rect.height;
        
        // 计算图片缩放前后的尺寸差
        const oldWidth = rect.width;
        const oldHeight = rect.height;
        const newWidth = oldWidth * (newScale / currentScale);
        const newHeight = oldHeight * (newScale / currentScale);
        const deltaWidth = newWidth - oldWidth;
        const deltaHeight = newHeight - oldHeight;
        
        // 根据鼠标位置计算新的偏移量
        translateX -= deltaWidth * mouseXRatio;
        translateY -= deltaHeight * mouseYRatio;
        
        currentScale = newScale;
        updateImageTransform();
    });

    // 修改拖动功能
    previewImage.addEventListener('mousedown', (e) => {
        if (e.button === 0) {  // 左键
            e.preventDefault();
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            previewImage.style.cursor = 'move';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateImageTransform();
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {  // 左键
            isDragging = false;
            previewImage.style.cursor = 'default';
        }
    });

    // 初始化
    loadSettings();   // 加载设置
    renderTodos();    // 渲染列表
}); 
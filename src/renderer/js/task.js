// 任务管理器
class TaskManager {
    constructor(app) {
        this.app = app;
        this.selectedTab = 'available';
        this.currentTasks = [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
    }

    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const tab = event.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 发布任务按钮
        const publishBtn = document.getElementById('publish-task-btn');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => {
                this.showPublishModal();
            });
        }

        // 模态框事件
        this.bindModalEvents();

        // 菜单事件
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('menu-new-task', () => {
            this.showPublishModal();
        });
    }

    bindModalEvents() {
        const modal = document.getElementById('publish-task-modal');
        const closeBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-publish');
        const form = document.getElementById('publish-task-form');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hidePublishModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hidePublishModal();
            });
        }

        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handlePublishTask();
            });
        }

        // 点击模态框外部关闭
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.hidePublishModal();
                }
            });
        }
    }

    switchTab(tabName) {
        this.selectedTab = tabName;

        // 更新标签页状态
        document.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // 更新任务列表显示
        document.querySelectorAll('.task-list').forEach((list) => {
            list.classList.remove('active');
        });

        const activeList = document.getElementById(`${tabName}-tasks`);
        if (activeList) {
            activeList.classList.add('active');
        }

        // 重新渲染任务
        this.renderTasks();
    }

    renderTasks() {
        if (this.selectedTab === 'available') {
            this.renderAvailableTasks();
        } else if (this.selectedTab === 'my-tasks') {
            this.renderMyTasks();
        }
    }

    renderAvailableTasks() {
        const container = document.getElementById('available-tasks');
        if (!container) return;

        const availableTasks = this.app.tasks.filter(
            (task) => !task.isAccepted
        );

        if (availableTasks.length === 0) {
            container.innerHTML = this.createEmptyState(
                '暂无待接取任务',
                'bell'
            );
            return;
        }

        container.innerHTML = availableTasks
            .map((task) => this.createTaskCard(task, 'available'))
            .join('');
    }

    renderMyTasks() {
        const container = document.getElementById('my-tasks');
        if (!container) return;

        if (this.app.myTasks.length === 0) {
            container.innerHTML = this.createEmptyState('暂无我的任务', 'flag');
            return;
        }

        container.innerHTML = this.app.myTasks
            .map((task) => this.createTaskCard(task, 'my-tasks'))
            .join('');
    }

    createTaskCard(task, type) {
        const isMyTask = type === 'my-tasks';
        const isCompleted = task.status === 'completed';

        return `
            <div class="task-card ${isMyTask ? 'my-task-card' : ''} ${isCompleted ? 'completed' : ''}">
                <div class="task-header">
                    ${isMyTask ? this.createProgressIndicator(task) : ''}
                    <div class="task-title-section">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            ${this.createTaskTypeTag(task.type)}
                            ${isMyTask ? this.createStatusTag(task.status) : ''}
                            ${task.priority > 3 ? this.createPriorityBadge() : ''}
                        </div>
                    </div>
                    <div class="task-publisher">
                        <div class="publisher-name">${this.escapeHtml(task.publisherName)}</div>
                        <div class="task-time">${this.formatDateTime(task.createdAt)}</div>
                    </div>
                </div>
                
                <div class="task-description">${this.escapeHtml(task.description)}</div>
                
                <div class="task-tags-deadline">
                    <div class="task-tags">
                        ${task.tags.map((tag) => this.createTag(tag)).join('')}
                    </div>
                    ${task.deadline ? this.createDeadline(task.deadline) : ''}
                </div>
                
                <div class="task-footer">
                    ${isMyTask ? this.createMyTaskInfo(task) : this.createTeamInfo(task)}
                    <div class="task-actions">
                        ${this.createActionButtons(task, type)}
                    </div>
                </div>
            </div>
        `;
    }

    createProgressIndicator(task) {
        const isCompleted = task.status === 'completed';
        return `
            <div class="my-task-progress ${isCompleted ? 'completed' : ''}"></div>
        `;
    }

    createTaskTypeTag(type) {
        const typeMap = {
            personal: { text: '个人任务', class: 'tag-personal' },
            team: { text: '团体任务', class: 'tag-team' }
        };

        const typeInfo = typeMap[type] || typeMap.personal;
        return `<span class="tag ${typeInfo.class}">${typeInfo.text}</span>`;
    }

    createStatusTag(status) {
        const statusMap = {
            inProgress: { text: '进行中', class: 'status-inprogress' },
            completed: { text: '已完成', class: 'status-completed' }
        };

        const statusInfo = statusMap[status] || statusMap.inProgress;
        return `<span class="tag ${statusInfo.class}">${statusInfo.text}</span>`;
    }

    createPriorityBadge() {
        return `
            <span class="tag priority-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                高优先级
            </span>
        `;
    }

    createTag(tag) {
        return `
            <span class="tag">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.91 3 7.01v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
                </svg>
                ${this.escapeHtml(tag)}
            </span>
        `;
    }

    createDeadline(deadline) {
        return `
            <div class="task-deadline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
                </svg>
                截止: ${this.formatDateTime(deadline)}
            </div>
        `;
    }

    createTeamInfo(task) {
        if (task.type === 'team') {
            return `
                <div class="task-team-info">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5 6h2l-2.5-6H14v6h2z"/>
                    </svg>
                    <span>${task.acceptedCount}/${task.maxAcceptCount || '∞'} 人已接取</span>
                </div>
            `;
        }
        return '';
    }

    createMyTaskInfo(task) {
        return `
            <div class="task-team-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>我的任务</span>
            </div>
        `;
    }

    createActionButtons(task, type) {
        if (type === 'available') {
            if (task.isAccepted) {
                return `
                    <div class="accepted-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        已接取
                    </div>
                `;
            } else {
                return `
                    <button class="accept-btn" onclick="window.app.taskManager.acceptTask('${task.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        接取任务
                    </button>
                `;
            }
        } else if (type === 'my-tasks') {
            if (task.status === 'completed') {
                return `
                    <div class="accepted-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        已完成
                    </div>
                `;
            } else {
                return `
                    <button class="complete-btn" onclick="window.app.taskManager.completeTask('${task.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        完成
                    </button>
                    <button class="abandon-btn" onclick="window.app.taskManager.abandonTask('${task.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        放弃
                    </button>
                `;
            }
        }
        return '';
    }

    createEmptyState(message, icon) {
        return `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h3>${message}</h3>
                <p>点击"发布任务"按钮创建新任务</p>
            </div>
        `;
    }

    showPublishModal() {
        const modal = document.getElementById('publish-task-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hidePublishModal() {
        const modal = document.getElementById('publish-task-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.resetPublishForm();
        }
    }

    resetPublishForm() {
        const form = document.getElementById('publish-task-form');
        if (form) {
            form.reset();
        }
    }

    async handlePublishTask() {
        const form = document.getElementById('publish-task-form');
        if (!form) return;

        const formData = new FormData(form);
        const taskData = {
            id: this.generateTaskId(),
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            type: document.getElementById('task-type').value,
            priority: parseInt(document.getElementById('task-priority').value),
            deadline: document.getElementById('task-deadline').value
                ? new Date(document.getElementById('task-deadline').value)
                : null,
            tags: document
                .getElementById('task-tags')
                .value.split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            publisherName: this.app.getCurrentUser().name,
            createdAt: new Date(),
            acceptedCount: 0,
            maxAcceptCount:
                document.getElementById('task-type').value === 'team' ? 3 : 1,
            isAccepted: false,
            status: 'available'
        };

        // 验证表单
        if (!taskData.title || !taskData.description) {
            this.app.showNotification('请填写任务标题和描述', 'error');
            return;
        }

        try {
            // 添加到任务列表
            this.app.tasks.push(taskData);

            // 保存数据
            await this.app.saveData();

            // 更新界面
            this.renderTasks();
            this.app.updateTaskCounts();

            // 关闭模态框
            this.hidePublishModal();

            // 显示成功消息
            this.app.showNotification('任务发布成功！', 'success');

            // 触发事件
            const event = new CustomEvent('task-published', {
                detail: { task: taskData }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('发布任务失败:', error);
            this.app.showNotification('发布任务失败，请重试', 'error');
        }
    }

    async acceptTask(taskId) {
        try {
            const task = this.app.tasks.find((t) => t.id === taskId);
            if (!task) {
                this.app.showNotification('任务不存在', 'error');
                return;
            }

            if (task.isAccepted) {
                this.app.showNotification('任务已被接取', 'warning');
                return;
            }

            // 检查团队任务人数限制
            if (
                task.type === 'team' &&
                task.acceptedCount >= task.maxAcceptCount
            ) {
                this.app.showNotification('该团队任务人数已满', 'warning');
                return;
            }

            // 更新任务状态
            task.isAccepted = true;
            task.acceptedCount++;

            // 添加到我的任务
            const myTask = { ...task, status: 'inProgress' };
            this.app.myTasks.push(myTask);

            // 保存数据
            await this.app.saveData();

            // 更新界面
            this.renderTasks();
            this.app.updateTaskCounts();

            // 显示成功消息
            this.app.showNotification('任务接取成功！', 'success');

            // 触发事件
            const event = new CustomEvent('task-accepted', {
                detail: { taskId }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('接取任务失败:', error);
            this.app.showNotification('接取任务失败，请重试', 'error');
        }
    }

    async completeTask(taskId) {
        try {
            const task = this.app.myTasks.find((t) => t.id === taskId);
            if (!task) {
                this.app.showNotification('任务不存在', 'error');
                return;
            }

            if (task.status === 'completed') {
                this.app.showNotification('任务已完成', 'warning');
                return;
            }

            // 更新任务状态
            task.status = 'completed';

            // 同步更新主任务列表
            const mainTask = this.app.tasks.find((t) => t.id === taskId);
            if (mainTask) {
                mainTask.status = 'completed';
            }

            // 保存数据
            await this.app.saveData();

            // 更新界面
            this.renderTasks();

            // 显示成功消息
            this.app.showNotification('任务完成！', 'success');

            // 触发事件
            const event = new CustomEvent('task-completed', {
                detail: { taskId }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('完成任务失败:', error);
            this.app.showNotification('完成任务失败，请重试', 'error');
        }
    }

    async abandonTask(taskId) {
        if (!confirm('确定要放弃这个任务吗？')) {
            return;
        }

        try {
            const taskIndex = this.app.myTasks.findIndex(
                (t) => t.id === taskId
            );
            if (taskIndex === -1) {
                this.app.showNotification('任务不存在', 'error');
                return;
            }

            // 从我的任务中移除
            this.app.myTasks.splice(taskIndex, 1);

            // 更新主任务列表
            const mainTask = this.app.tasks.find((t) => t.id === taskId);
            if (mainTask) {
                mainTask.isAccepted = false;
                mainTask.acceptedCount = Math.max(
                    0,
                    mainTask.acceptedCount - 1
                );
            }

            // 保存数据
            await this.app.saveData();

            // 更新界面
            this.renderTasks();
            this.app.updateTaskCounts();

            // 显示成功消息
            this.app.showNotification('任务已放弃', 'info');

            // 触发事件
            const event = new CustomEvent('task-abandoned', {
                detail: { taskId }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('放弃任务失败:', error);
            this.app.showNotification('放弃任务失败，请重试', 'error');
        }
    }

    generateTaskId() {
        return (
            'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        );
    }

    formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

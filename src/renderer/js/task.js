// 任务管理器
class TaskManager {
    constructor(app) {
        this.app = app;
        this.selectedTab = 'available';
        this.currentTasks = [];
        this.processingTasks = new Set(); // 防止重复操作

        this.init();
    }

    init() {
        console.log('TaskManager 初始化');
        this.bindEvents();
        console.log('开始渲染任务，当前标签页:', this.selectedTab);

        // 确保DOM元素存在后再设置标签页状态
        const availableContainer = document.getElementById('available-tasks');
        const myTasksContainer = document.getElementById('my-tasks');

        if (availableContainer && myTasksContainer) {
            console.log('DOM元素已准备好，设置初始标签页状态');
            this.switchTab(this.selectedTab);
        } else {
            console.error('DOM元素未准备好:', {
                availableContainer: !!availableContainer,
                myTasksContainer: !!myTasksContainer
            });
            // 如果DOM还没准备好，延迟执行
            setTimeout(() => {
                this.switchTab(this.selectedTab);
            }, 200);
        }
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
        if (window.electronAPI) {
            window.electronAPI.onMenuNewTask(() => {
                this.showPublishModal();
            });
        }
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

        // 给当前选中的标签页添加active类
        const elementId = tabName === 'available' ? 'available-tasks' : tabName;
        const activeList = document.getElementById(elementId);
        if (activeList) {
            activeList.classList.add('active');
            console.log(`已为 ${elementId} 添加 active 类`);
        } else {
            console.error(`找不到元素: ${elementId}`);
        }

        // 重新渲染任务
        this.renderTasks();
    }

    renderTasks() {
        console.log('renderTasks 被调用，当前标签页:', this.selectedTab);
        // 始终渲染两个标签页的内容，确保切换时不会丢失数据
        console.log('渲染可用任务');
        this.renderAvailableTasks();
        console.log('渲染我的任务');
        this.renderMyTasks();
    }

    renderAvailableTasks() {
        const container = document.getElementById('available-tasks');
        if (!container) {
            console.error('找不到 available-tasks 容器');
            return;
        }

        console.log('渲染可用任务，容器类名:', container.className);

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
        if (!container) {
            console.error('找不到 my-tasks 容器');
            return;
        }

        console.log('=== 渲染我的任务 ===');
        console.log('容器:', container);
        console.log('我的任务数量:', this.app.myTasks.length);
        console.log('我的任务列表:', this.app.myTasks);

        if (this.app.myTasks.length === 0) {
            console.log('显示空状态');
            container.innerHTML = this.createEmptyState('暂无我的任务', 'flag');
            return;
        }

        console.log('开始渲染任务卡片');
        const taskCards = this.app.myTasks
            .map((task) => this.createTaskCard(task, 'my-tasks'))
            .join('');

        console.log('生成的HTML:', taskCards);
        container.innerHTML = taskCards;
        console.log('容器内容已更新');

        // 测试：检查容器是否真的有内容
        setTimeout(() => {
            console.log('容器实际内容:', container.innerHTML);
            console.log('容器子元素数量:', container.children.length);
        }, 100);
    }

    createTaskCard(task, type) {
        const isMyTask = type === 'my-tasks';
        const isCompleted = task.status === 'completed';

        console.log('创建任务卡片:', {
            taskId: task.id,
            taskTitle: task.title,
            type: type,
            isMyTask: isMyTask,
            isCompleted: isCompleted,
            task: task
        });

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
                    <div class="task-footer-left">
                        ${isMyTask ? this.createMyTaskInfo(task) : this.createTeamInfo(task)}
                    </div>
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
                <img src="Assets/Icons/star.svg" width="12" height="12" alt="高优先级" />
                高优先级
            </span>
        `;
    }

    createTag(tag) {
        return `
            <span class="tag">
                <img src="Assets/Icons/tag.svg" width="11" height="11" alt="标签" />
                ${this.escapeHtml(tag)}
            </span>
        `;
    }

    createDeadline(deadline) {
        return `
            <div class="task-deadline">
                <img src="Assets/Icons/hourglass.svg" width="16" height="16" alt="截止时间" />
                截止: ${this.formatDateTime(deadline)}
            </div>
        `;
    }

    createTeamInfo(task) {
        if (task.type === 'team') {
            return `
                <div class="task-team-info">
                    <img src="Assets/Icons/team.svg" width="18" height="18" alt="团队" />
                    <span>${task.acceptedCount}/${task.maxAcceptCount || '∞'} 人已接取</span>
                </div>
            `;
        }
        return '';
    }

    createMyTaskInfo(task) {
        // 我的任务不需要显示额外的信息
        return '';
    }

    createActionButtons(task, type) {
        if (type === 'available') {
            // 检查用户是否已经接取过这个任务
            const alreadyAccepted = this.app.myTasks.some(
                (myTask) => myTask.id === task.id
            );

            if (alreadyAccepted) {
                return `
                    <div class="accepted-badge">
                        <img src="Assets/Icons/check.svg" width="16" height="16" alt="已接取" />
                        已接取
                    </div>
                `;
            } else {
                return `
                    <button class="accept-btn" onclick="window.app.taskManager.acceptTask('${task.id}')">
                        <img src="Assets/Icons/check.svg" width="16" height="16" alt="接取任务" />
                        接取任务
                    </button>
                `;
            }
        } else if (type === 'my-tasks') {
            if (task.status === 'completed') {
                return `
                    <div class="accepted-badge">
                        <img src="Assets/Icons/check.svg" width="16" height="16" alt="已完成" />
                        已完成
                    </div>
                `;
            } else {
                return `
                    <button class="complete-btn" onclick="window.app.taskManager.completeTask('${task.id}')">
                        <img src="Assets/Icons/check.svg" width="14" height="14" alt="完成" />
                        完成
                    </button>
                    <button class="abandon-btn" onclick="window.app.taskManager.abandonTask('${task.id}')">
                        <img src="Assets/Icons/delete.svg" width="14" height="14" alt="放弃" />
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
        // 防止重复操作
        if (this.processingTasks.has(taskId)) {
            console.log('任务正在处理中，跳过重复操作:', taskId);
            return;
        }

        try {
            this.processingTasks.add(taskId);

            const task = this.app.tasks.find((t) => t.id === taskId);
            if (!task) {
                this.app.showNotification('任务不存在', 'error');
                return;
            }

            // 检查用户是否已经接取过这个任务
            const alreadyAccepted = this.app.myTasks.some(
                (myTask) => myTask.id === taskId
            );
            if (alreadyAccepted) {
                this.app.showNotification('您已接取该任务', 'warning');
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

            // 先创建我的任务对象（在修改原任务之前）
            const myTask = {
                ...task,
                status: 'inProgress',
                acceptedAt: new Date(),
                originalType: task.type // 保存原始类型
            };

            this.app.myTasks.push(myTask);

            // 更新任务状态
            if (task.type === 'team') {
                // 团队任务：增加接取人数
                task.acceptedCount++;
            } else {
                // 个人任务：从可用任务列表中移除
                const taskIndex = this.app.tasks.findIndex(
                    (t) => t.id === taskId
                );
                if (taskIndex !== -1) {
                    this.app.tasks.splice(taskIndex, 1);
                }
            }

            // 保存数据
            await this.app.saveData();

            // 显示成功消息
            this.app.showNotification('任务接取成功！', 'success');

            // 更新界面
            this.renderTasks();
            this.app.updateTaskCounts();

            // 自动切换到我的任务标签页
            this.switchTab('my-tasks');

            // 触发事件（用于其他模块监听，但不重复执行操作）
            const event = new CustomEvent('task-accepted', {
                detail: { taskId, task: myTask }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('接取任务失败:', error);
            this.app.showNotification('接取任务失败，请重试', 'error');
        } finally {
            // 无论成功还是失败，都要从处理集合中移除
            this.processingTasks.delete(taskId);
        }
    }

    async completeTask(taskId) {
        // 防止重复操作
        if (this.processingTasks.has(`complete_${taskId}`)) {
            console.log('任务完成操作正在处理中，跳过重复操作:', taskId);
            return;
        }

        try {
            this.processingTasks.add(`complete_${taskId}`);

            const task = this.app.myTasks.find((t) => t.id === taskId);
            if (!task) {
                this.app.showNotification('任务不存在', 'error');
                return;
            }

            if (task.status === 'completed') {
                this.app.showNotification('任务已完成', 'warning');
                return;
            }

            // 已完成的任务直接从我的任务中删除
            const taskIndex = this.app.myTasks.findIndex(
                (t) => t.id === taskId
            );
            if (taskIndex !== -1) {
                this.app.myTasks.splice(taskIndex, 1);
            }

            // 同步更新主任务列表（仅对团队任务有效）
            if (task.originalType === 'team') {
                const mainTask = this.app.tasks.find((t) => t.id === taskId);
                if (mainTask) {
                    mainTask.status = 'completed';
                    // 减少接取人数
                    mainTask.acceptedCount = Math.max(
                        0,
                        mainTask.acceptedCount - 1
                    );
                }
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
        } finally {
            // 无论成功还是失败，都要从处理集合中移除
            this.processingTasks.delete(`complete_${taskId}`);
        }
    }

    async abandonTask(taskId) {
        if (!confirm('确定要放弃这个任务吗？')) {
            return;
        }

        // 防止重复操作
        if (this.processingTasks.has(`abandon_${taskId}`)) {
            console.log('任务放弃操作正在处理中，跳过重复操作:', taskId);
            return;
        }

        try {
            this.processingTasks.add(`abandon_${taskId}`);

            const taskIndex = this.app.myTasks.findIndex(
                (t) => t.id === taskId
            );
            if (taskIndex === -1) {
                this.app.showNotification('任务不存在', 'error');
                return;
            }

            const myTask = this.app.myTasks[taskIndex];

            // 从我的任务中移除
            this.app.myTasks.splice(taskIndex, 1);

            // 根据任务类型处理主任务列表
            if (myTask.originalType === 'team') {
                // 团队任务：减少接取人数，不会退回
                const mainTask = this.app.tasks.find((t) => t.id === taskId);
                if (mainTask) {
                    mainTask.acceptedCount = Math.max(
                        0,
                        mainTask.acceptedCount - 1
                    );
                }
            } else {
                // 个人任务：重新添加到可用任务列表
                const restoredTask = {
                    ...myTask,
                    isAccepted: false,
                    acceptedCount: 0,
                    status: 'available'
                };
                delete restoredTask.acceptedAt;
                delete restoredTask.originalType;
                this.app.tasks.push(restoredTask);
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
        } finally {
            // 无论成功还是失败，都要从处理集合中移除
            this.processingTasks.delete(`abandon_${taskId}`);
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

// 导出类供其他模块使用
export { TaskManager };

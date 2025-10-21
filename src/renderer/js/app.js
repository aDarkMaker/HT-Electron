// 主应用类
class HXKTerminalApp {
    constructor() {
        this.currentView = 'home';
        this.isNavExpanded = true;
        this.tasks = [];
        this.myTasks = [];
        this.calendarEvents = [];

        this.init();
    }

    async init() {
        console.log('🚀 HXK Terminal 应用启动中...');

        // 初始化各个模块
        this.navigation = new NavigationManager(this);
        this.taskManager = new TaskManager(this);
        this.calendarManager = new CalendarManager(this);
        this.settingsManager = new SettingsManager(this);

        // 绑定事件
        this.bindEvents();

        // 加载数据
        await this.loadData();

        // 初始化界面
        this.initializeUI();

        console.log('✅ HXK Terminal 应用初始化完成');
    }

    bindEvents() {
        // 导航事件
        document.addEventListener('navigate', (event) => {
            this.navigateToView(event.detail.view);
        });

        // 任务事件
        document.addEventListener('task-published', (event) => {
            this.taskManager.addTask(event.detail.task);
        });

        document.addEventListener('task-accepted', (event) => {
            this.taskManager.acceptTask(event.detail.taskId);
        });

        document.addEventListener('task-completed', (event) => {
            this.taskManager.completeTask(event.detail.taskId);
        });

        document.addEventListener('task-abandoned', (event) => {
            this.taskManager.abandonTask(event.detail.taskId);
        });

        // 设置事件
        document.addEventListener('settings-changed', (event) => {
            this.settingsManager.updateSettings(event.detail.settings);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }

    async loadData() {
        try {
            // 从 Electron Store 加载数据
            const { ipcRenderer } = require('electron');

            this.tasks =
                (await ipcRenderer.invoke('get-store-value', 'tasks')) || [];
            this.myTasks =
                (await ipcRenderer.invoke('get-store-value', 'myTasks')) || [];
            this.calendarEvents =
                (await ipcRenderer.invoke(
                    'get-store-value',
                    'calendarEvents'
                )) || [];

            // 加载示例数据（如果没有数据）
            if (this.tasks.length === 0) {
                this.loadSampleData();
            }

            console.log('📊 数据加载完成:', {
                tasks: this.tasks.length,
                myTasks: this.myTasks.length,
                calendarEvents: this.calendarEvents.length
            });
        } catch (error) {
            console.error('❌ 数据加载失败:', error);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // 示例任务数据
        this.tasks = [
            {
                id: '1',
                title: '完成前端界面设计',
                description:
                    '设计并实现任务管理界面的前端部分，包括任务列表、详情页面等',
                type: 'personal',
                priority: 3,
                publisherName: '倒霉蛋',
                createdAt: new Date('2025-01-15T10:00:00'),
                deadline: new Date('2025-01-20T18:00:00'),
                tags: ['技术', '设计', 'UI'],
                acceptedCount: 0,
                maxAcceptCount: 1,
                isAccepted: false,
                status: 'available'
            },
            {
                id: '2',
                title: '团队项目文档整理',
                description:
                    '整理项目相关文档，包括需求文档、设计文档、API文档等',
                type: 'team',
                priority: 2,
                publisherName: '不是人',
                createdAt: new Date('2024-01-14T14:30:00'),
                deadline: new Date('2024-01-18T17:00:00'),
                tags: ['文档', '团队', '整理'],
                acceptedCount: 1,
                maxAcceptCount: 3,
                isAccepted: false,
                status: 'available'
            }
        ];

        // 示例我的任务数据
        this.myTasks = [
            {
                id: '3',
                title: '数据库设计优化',
                description: '优化现有数据库结构，提高查询性能',
                type: 'personal',
                priority: 4,
                publisherName: '没人类',
                createdAt: new Date('2024-01-10T09:00:00'),
                deadline: new Date('2024-01-25T18:00:00'),
                tags: ['数据库', '优化', '性能'],
                isAccepted: true,
                status: 'inProgress'
            }
        ];

        // 示例日历事件
        this.calendarEvents = [
            {
                id: '1',
                title: '团队例会',
                type: 'meeting',
                date: new Date('2024-01-16T10:00:00'),
                duration: 60,
                description: '每周团队例会，讨论项目进展'
            },
            {
                id: '2',
                title: '项目截止日期',
                type: 'deadline',
                date: new Date('2024-01-20T18:00:00'),
                description: '前端界面设计项目截止'
            }
        ];
    }

    initializeUI() {
        // 设置初始视图
        this.navigateToView('home');

        // 更新任务计数
        this.updateTaskCounts();

        // 初始化导航栏状态
        this.navigation.updateNavigationState();
    }

    navigateToView(viewName) {
        console.log(`🔄 切换到视图: ${viewName}`);

        // 隐藏所有视图
        document.querySelectorAll('.view').forEach((view) => {
            view.classList.remove('active');
        });

        // 显示目标视图
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }

        // 更新导航状态
        this.navigation.updateActiveNavItem(viewName);

        // 根据视图执行特定逻辑
        switch (viewName) {
            case 'tasks':
                this.taskManager.renderTasks();
                break;
            case 'calendar':
                this.calendarManager.renderCalendar();
                break;
            case 'settings':
                this.settingsManager.renderSettings();
                break;
        }
    }

    updateTaskCounts() {
        const availableCount = this.tasks.filter(
            (task) => !task.isAccepted
        ).length;
        const myTasksCount = this.myTasks.length;

        document.getElementById('available-count').textContent = availableCount;
        document.getElementById('my-tasks-count').textContent = myTasksCount;
        document.getElementById('task-count').textContent =
            availableCount + myTasksCount;
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + 数字键切换视图
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key >= '1' &&
            event.key <= '6'
        ) {
            event.preventDefault();
            const views = [
                'home',
                'tasks',
                'calendar',
                'files',
                'publish',
                'settings'
            ];
            const viewIndex = parseInt(event.key) - 1;
            if (views[viewIndex]) {
                this.navigateToView(views[viewIndex]);
            }
        }

        // Ctrl/Cmd + N 新建任务
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            if (this.currentView === 'tasks') {
                this.taskManager.showPublishModal();
            }
        }
    }

    async saveData() {
        try {
            const { ipcRenderer } = require('electron');

            await ipcRenderer.invoke('set-store-value', 'tasks', this.tasks);
            await ipcRenderer.invoke(
                'set-store-value',
                'myTasks',
                this.myTasks
            );
            await ipcRenderer.invoke(
                'set-store-value',
                'calendarEvents',
                this.calendarEvents
            );

            console.log('💾 数据保存成功');
        } catch (error) {
            console.error('❌ 数据保存失败:', error);
        }
    }

    // 获取当前用户信息
    getCurrentUser() {
        return {
            name: '用户',
            avatar: '/assets/icons/user.svg',
            role: 'member'
        };
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // 设置背景色
        const colors = {
            info: '#4299E1',
            success: '#48BB78',
            warning: '#ED8936',
            error: '#E53E3E'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HXKTerminalApp();
});

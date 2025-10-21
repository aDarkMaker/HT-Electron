// 导入其他模块
import { NavigationManager } from './navigation.js';
import { TaskManager } from './task.js';
import { CalendarManager } from './calendar.js';
import { SettingsManager } from './settings.js';

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

        await this.loadData();

        this.navigation = new NavigationManager(this);
        this.taskManager = new TaskManager(this);
        this.calendarManager = new CalendarManager(this);
        this.settingsManager = new SettingsManager(this);

        this.bindEvents();

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

        // 移除重复的事件监听器，避免重复接取任务
        // document.addEventListener('task-accepted', (event) => {
        //     this.taskManager.acceptTask(event.detail.taskId);
        // });

        // 移除重复的事件监听器，避免重复操作
        // document.addEventListener('task-completed', (event) => {
        //     this.taskManager.completeTask(event.detail.taskId);
        // });

        // document.addEventListener('task-abandoned', (event) => {
        //     this.taskManager.abandonTask(event.detail.taskId);
        // });

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
            this.tasks =
                (await window.electronAPI.getStoreValue('tasks')) || [];
            this.myTasks =
                (await window.electronAPI.getStoreValue('myTasks')) || [];
            this.calendarEvents =
                (await window.electronAPI.getStoreValue('calendarEvents')) ||
                [];

            // 加载示例数据（如果没有数据）
            if (this.tasks.length === 0) {
                this.loadSampleData();
            }

            console.log('📊 数据加载完成:', {
                tasks: this.tasks.length,
                myTasks: this.myTasks.length,
                calendarEvents: this.calendarEvents.length
            });
            console.log('我的任务详情:', this.myTasks);
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
                status: 'inProgress',
                acceptedAt: new Date('2024-01-10T09:00:00'),
                originalType: 'personal'
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

        // 添加双周周四例会
        this.addBiweeklyMeetings();
    }

    addBiweeklyMeetings() {
        // 从2025年10月23日开始（周四）- 最近一次例会
        const startDate = new Date(2025, 9, 23); // 2025年10月23日

        // 生成接下来一年的双周例会
        for (let i = 0; i < 26; i++) {
            // 一年大约26个双周
            const meetingDate = new Date(startDate);
            meetingDate.setDate(startDate.getDate() + i * 14); // 每两周一次

            // 设置时间为下午4点到5点
            meetingDate.setHours(16, 0, 0, 0);

            const meeting = {
                id: `meeting_${i + 1}`,
                title: '双周例会',
                type: 'meeting',
                date: meetingDate,
                duration: 60,
                description: '双周例会，讨论项目进展和团队协作',
                isRecurring: true,
                attendance: 'pending'
            };

            this.calendarEvents.push(meeting);
        }
    }

    initializeUI() {
        // 设置初始视图
        this.navigateToView('home');

        // 更新任务计数
        this.updateTaskCounts();

        // 初始化导航栏状态
        this.navigation.updateNavigationState();

        // 更新用户显示（包括头像和用户名）
        this.settingsManager.updateUserDisplay();

        // 确保导航栏也更新用户信息
        this.navigation.updateUserInfo();
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
                console.log('切换到任务视图，开始渲染任务');
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
        // 现在 tasks 数组中的任务都是可用的（个人任务接取后会被移除，团队任务会保留）
        const availableCount = this.tasks.length;
        const myTasksCount = this.myTasks.length;
        const totalCount = availableCount + myTasksCount;

        // 更新计数并处理显示/隐藏
        const availableCountEl = document.getElementById('available-count');
        const myTasksCountEl = document.getElementById('my-tasks-count');
        const taskCountEl = document.getElementById('task-count');

        if (availableCountEl) {
            availableCountEl.textContent = availableCount;
            availableCountEl.style.display =
                availableCount > 0 ? 'flex' : 'none';
        }

        if (myTasksCountEl) {
            myTasksCountEl.textContent = myTasksCount;
            myTasksCountEl.style.display = myTasksCount > 0 ? 'flex' : 'none';
        }

        if (taskCountEl) {
            taskCountEl.textContent = totalCount;
            taskCountEl.style.display = totalCount > 0 ? 'flex' : 'none';
        }
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
            await window.electronAPI.setStoreValue('tasks', this.tasks);
            await window.electronAPI.setStoreValue('myTasks', this.myTasks);
            await window.electronAPI.setStoreValue(
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
        const settings = this.settingsManager
            ? this.settingsManager.getSettings()
            : {};
        return {
            name: settings.username || '用户',
            avatar: settings.avatar || 'Assets/Icons/user.svg',
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

// 导出类供其他模块使用
export { HXKTerminalApp };

// 导航管理器
class NavigationManager {
    constructor(app) {
        this.app = app;
        this.isExpanded = true;
        this.currentView = 'home';

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateNavigationState();
    }

    bindEvents() {
        // 导航栏切换按钮
        const collapseBtn = document.getElementById('collapse-btn');
        const expandBtn = document.getElementById('expand-btn');

        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleNavigation();
            });
        }

        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.toggleNavigation();
            });
        }

        // 导航项点击事件
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.addEventListener('click', (event) => {
                const view = event.currentTarget.dataset.view;
                if (view) {
                    this.navigateToView(view);
                }
            });
        });

        // 设置按钮
        const settingsBtn = document.querySelector('[data-view="settings"]');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.navigateToView('settings');
            });
        }

        // 登出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // 用户信息更新
        this.updateUserInfo();
    }

    toggleNavigation() {
        this.isExpanded = !this.isExpanded;
        this.updateNavigationState();

        // 通知主应用更新内容边距
        this.app.navigateToView(this.currentView);
    }

    updateNavigationState() {
        const navBar = document.getElementById('navigation-bar');
        const expandedNav = document.getElementById('expanded-nav');
        const collapsedNav = document.getElementById('collapsed-nav');
        const mainContent = document.getElementById('main-content');

        if (this.isExpanded) {
            navBar.classList.remove('collapsed');
            navBar.classList.add('expanded');
            expandedNav.classList.remove('collapsed');
            collapsedNav.classList.remove('visible');
            mainContent.classList.remove('collapsed');
        } else {
            navBar.classList.remove('expanded');
            navBar.classList.add('collapsed');
            expandedNav.classList.add('collapsed');
            mainContent.classList.add('collapsed');

            // 延迟显示小图标，确保导航栏完全收起后再显示
            setTimeout(() => {
                collapsedNav.classList.add('visible');
            }, 200);
        }
    }

    navigateToView(viewName) {
        this.currentView = viewName;
        this.updateActiveNavItem(viewName);

        // 触发导航事件
        const event = new CustomEvent('navigate', {
            detail: { view: viewName }
        });
        document.dispatchEvent(event);
    }

    updateActiveNavItem(viewName) {
        // 移除所有活动状态
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.classList.remove('active');
        });

        // 设置当前活动项
        const activeItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    updateUserInfo() {
        const user = this.app.getCurrentUser();
        const userNameElement = document.getElementById('user-name');
        const userAvatarImg = document.querySelector('.user-avatar img');

        if (userNameElement) {
            userNameElement.textContent = user.name;
        }

        if (userAvatarImg) {
            userAvatarImg.src = user.avatar;
        }
    }

    handleLogout() {
        // 显示确认对话框
        if (confirm('确定要登出吗？')) {
            // 清除本地数据
            this.clearUserData();

            // 显示登出消息
            this.app.showNotification('已成功登出', 'success');

            // 可以在这里添加登出后的逻辑，比如跳转到登录页面
            console.log('用户已登出');
        }
    }

    clearUserData() {
        // 清除用户相关数据
        this.app.tasks = [];
        this.app.myTasks = [];
        this.app.calendarEvents = [];

        // 保存到存储
        this.app.saveData();

        // 重置界面
        this.navigateToView('home');
        this.app.updateTaskCounts();
    }

    // 更新任务计数显示
    updateTaskCounts(availableCount, myTasksCount) {
        const taskCountElement = document.getElementById('task-count');
        const availableCountElement =
            document.getElementById('available-count');
        const myTasksCountElement = document.getElementById('my-tasks-count');

        if (taskCountElement) {
            taskCountElement.textContent = availableCount + myTasksCount;
        }

        if (availableCountElement) {
            availableCountElement.textContent = availableCount;
        }

        if (myTasksCountElement) {
            myTasksCountElement.textContent = myTasksCount;
        }
    }

    // 显示导航栏加载状态
    showLoading() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
            item.style.opacity = '0.5';
            item.style.pointerEvents = 'none';
        });
    }

    // 隐藏导航栏加载状态
    hideLoading() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
        });
    }

    // 添加导航项徽章
    addNavBadge(viewName, count) {
        const navItem = document.querySelector(`[data-view="${viewName}"]`);
        if (navItem) {
            let badge = navItem.querySelector('.nav-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-badge';
                navItem.appendChild(badge);
            }
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // 移除导航项徽章
    removeNavBadge(viewName) {
        const navItem = document.querySelector(`[data-view="${viewName}"]`);
        if (navItem) {
            const badge = navItem.querySelector('.nav-badge');
            if (badge) {
                badge.remove();
            }
        }
    }
}

// 导出类供其他模块使用
export { NavigationManager };

// 认证管理器
class AuthManager {
    constructor(app) {
        this.app = app;
        this.isAuthenticated = false;
        this.currentUser = null;
        this.authContainer = null;
        this.appContainer = null;
    }

    async init() {
        console.log('🔐 初始化认证管理器...');

        // 获取DOM元素
        this.authContainer = document.getElementById('auth-container');
        this.appContainer = document.getElementById('app');

        // 检查登录状态
        await this.checkAuthStatus();

        // 绑定事件
        this.bindEvents();

        console.log('✅ 认证管理器初始化完成');
    }

    async checkAuthStatus() {
        try {
            const token = await window.electronAPI.getStoreValue('auth_token');
            const userInfo =
                await window.electronAPI.getStoreValue('user_info');

            if (token && userInfo) {
                // 验证token有效性（这里简单检查，实际应该调用后端API）
                this.isAuthenticated = true;
                this.currentUser = userInfo;
                this.showApp();
            } else {
                this.showAuth();
            }
        } catch (error) {
            console.error('❌ 检查登录状态失败:', error);
            this.showAuth();
        }
    }

    showAuth() {
        this.isAuthenticated = false;
        if (this.authContainer) {
            this.authContainer.style.display = 'flex';
        }
        if (this.appContainer) {
            this.appContainer.style.display = 'none';
        }
        document
            .getElementById('custom-titlebar')
            ?.style.setProperty('display', 'none');
    }

    showApp() {
        this.isAuthenticated = true;
        if (this.authContainer) {
            this.authContainer.style.display = 'none';
        }
        if (this.appContainer) {
            this.appContainer.style.display = 'flex';
        }

        // 只在 Windows 上显示自定义标题栏，Mac 使用原生标题栏
        const customTitlebar = document.getElementById('custom-titlebar');
        if (customTitlebar) {
            const isMac = document.body.classList.contains('darwin');
            customTitlebar.style.display = isMac ? 'none' : 'flex';
        }

        // 不要在这里调用 initializeUI，应该等待 initializeAuthenticatedUser() 完成后自动调用
        // initializeAuthenticatedUser() 中会调用 initializeUI()
    }

    bindEvents() {
        // 切换登录/注册表单
        const switchLink = document.getElementById('auth-switch-link');
        if (switchLink) {
            switchLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForm();
            });
        }

        // 登录表单提交
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 注册表单提交
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    toggleAuthForm() {
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        const switchText = document.getElementById('auth-switch-text');
        const switchLink = document.getElementById('auth-switch-link');
        const title = document.querySelectorAll('.auth-title')[0];
        const subtitle = document.querySelectorAll('.auth-subtitle')[0];

        const isLoginVisible =
            loginContainer.style.display !== 'none' &&
            loginContainer.style.display !== '';

        if (isLoginVisible) {
            // 切换到注册
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
            switchText.textContent = '已有账号？';
            switchLink.textContent = '立即登录';
            title.textContent = '创建新账号';
            subtitle.textContent = '注册账号以开始使用';
        } else {
            // 切换到登录
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
            switchText.textContent = '还没有账号？';
            switchLink.textContent = '立即注册';
            title.textContent = '欢迎回来';
            subtitle.textContent = '登录您的账号以继续';
        }

        // 清除错误信息
        this.clearMessages();
    }

    async handleLogin() {
        const form = document.getElementById('login-form');
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        // 显示错误
        this.showError('', '');

        if (!username || !password) {
            this.showError('login', '请填写所有字段');
            return;
        }

        // TODO: 调用后端API进行登录
        // const response = await fetch('http://your-backend-api/auth/login', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username, password })
        // });

        // 模拟登录（稍后替换为实际API调用）
        try {
            // 从本地存储查找用户
            const users =
                (await window.electronAPI.getStoreValue('users')) || [];
            const user = users.find((u) => u.username === username);

            if (!user) {
                this.showError('login', '用户不存在');
                return;
            }

            if (user.password !== password) {
                this.showError('login', '密码错误');
                return;
            }

            // 登录成功
            await this.setAuthenticated(user);
            this.showSuccess('login', '登录成功！');

            // 延迟一下以显示成功消息
            setTimeout(() => {
                this.showApp();
                // 如果app还没有初始化，重新初始化
                if (window.app) {
                    // 检查是否已经初始化过
                    if (!window.app.taskManager && !window.app.navigation) {
                        window.app.initializeAuthenticatedUser();
                    }
                }
            }, 500);
        } catch (error) {
            console.error('❌ 登录失败:', error);
            this.showError('login', '登录失败，请重试');
        }
    }

    async handleRegister() {
        const form = document.getElementById('register-form');
        const username = document
            .getElementById('register-username')
            .value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById(
            'register-confirm-password'
        ).value;
        const qq = document.getElementById('register-qq').value.trim();

        // 清除之前的错误信息
        this.showError('', '');

        // 验证输入
        if (!username || !password || !confirmPassword || !qq) {
            this.showError('register', '请填写所有字段');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('register', '两次输入的密码不一致');
            return;
        }

        if (password.length < 6) {
            this.showError('register', '密码长度至少为6位');
            return;
        }

        if (!/^\d+$/.test(qq)) {
            this.showError('register', 'QQ号必须是数字');
            return;
        }

        // TODO: 调用后端API进行注册
        // const response = await fetch('http://your-backend-api/auth/register', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username, password, qq })
        // });

        // 模拟注册（稍后替换为实际API调用）
        try {
            const users =
                (await window.electronAPI.getStoreValue('users')) || [];

            // 检查用户名是否已存在
            if (users.some((u) => u.username === username)) {
                this.showError('register', '用户名已存在');
                return;
            }

            // 检查QQ号是否已存在
            if (users.some((u) => u.qq === qq)) {
                this.showError('register', '该QQ号已被注册');
                return;
            }

            // 创建新用户
            const newUser = {
                id: Date.now().toString(),
                username: username,
                password: password,
                qq: qq,
                createdAt: new Date().toISOString(),
                role: 'member'
            };

            users.push(newUser);
            await window.electronAPI.setStoreValue('users', users);

            // 注册成功后自动登录
            await this.setAuthenticated(newUser);
            this.showSuccess('register', '注册成功！');

            // 延迟一下以显示成功消息
            setTimeout(() => {
                this.showApp();
                // 如果app还没有初始化，重新初始化
                if (window.app) {
                    // 检查是否已经初始化过
                    if (!window.app.taskManager && !window.app.navigation) {
                        window.app.initializeAuthenticatedUser();
                    }
                }
            }, 500);
        } catch (error) {
            console.error('❌ 注册失败:', error);
            this.showError('register', '注册失败，请重试');
        }
    }

    async setAuthenticated(user) {
        // 保存认证信息
        this.isAuthenticated = true;
        this.currentUser = {
            id: user.id,
            username: user.username,
            qq: user.qq,
            role: user.role,
            createdAt: user.createdAt
        };

        await window.electronAPI.setStoreValue(
            'auth_token',
            'token_' + Date.now()
        );
        await window.electronAPI.setStoreValue('user_info', this.currentUser);
    }

    async logout() {
        try {
            this.isAuthenticated = false;
            this.currentUser = null;

            await window.electronAPI.deleteStoreValue('auth_token');
            await window.electronAPI.deleteStoreValue('user_info');

            this.showAuth();
            this.clearMessages();

            console.log('✅ 登出成功');
        } catch (error) {
            console.error('❌ 登出失败:', error);
        }
    }

    showError(type, message) {
        // 创建侧边滑入的错误通知
        this.showToastNotification(message, 'error');
    }

    showSuccess(type, message) {
        // 创建侧边滑入的成功通知
        this.showToastNotification(message, 'success');
    }

    showToastNotification(message, type = 'success') {
        // 移除已存在的通知
        const existingToast = document.getElementById(
            'auth-toast-notification'
        );
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新的通知元素
        const toast = document.createElement('div');
        toast.id = 'auth-toast-notification';
        toast.className = `auth-toast auth-toast-${type}`;
        toast.textContent = message;

        // 添加到页面
        document.body.appendChild(toast);

        // 触发滑入动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 自动消失
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    clearMessages() {
        [
            'login-error',
            'login-success',
            'register-error',
            'register-success'
        ].forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('show');
                element.textContent = '';
            }
        });
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

export { AuthManager };

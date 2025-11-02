// 导入 API 客户端
import { apiClient } from './api.js';

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
                // 验证 token 有效性（调用后端 API）
                try {
                    apiClient.token = token;
                    const currentUser = await apiClient.fetchUserInfo();

                    if (currentUser) {
                        this.isAuthenticated = true;
                        // 更新用户信息（包括最新的头像）
                        this.currentUser = {
                            id: currentUser.id,
                            username: currentUser.username,
                            name: currentUser.name,
                            email: currentUser.email,
                            qq: currentUser.qq,
                            avatar: currentUser.avatar, // 确保使用最新的头像
                            role: currentUser.role,
                            created_at: currentUser.created_at
                        };
                        // 确保存储的用户信息是最新的
                        await window.electronAPI.setStoreValue(
                            'user_info',
                            this.currentUser
                        );
                        this.showApp();
                    } else {
                        // Token 无效，清除
                        console.warn('⚠️ Token验证失败，用户信息为空');
                        await apiClient.logout();
                        this.showAuth();
                    }
                } catch (error) {
                    // Token 已过期或无效，但不一定是网络错误
                    // 只有在确认是401错误时才清除token
                    if (error.message && error.message.includes('401')) {
                        console.warn('⚠️ Token已过期或无效，需要重新登录');
                        await apiClient.logout();
                        this.showAuth();
                    } else {
                        // 可能是网络错误，保留token以便下次重试
                        console.error(
                            '❌ Token验证失败（可能是网络问题）:',
                            error
                        );
                        // 如果有缓存的用户信息，仍然显示应用
                        if (userInfo) {
                            console.log('📦 使用缓存的用户信息');
                            this.isAuthenticated = true;
                            this.currentUser = userInfo;
                            this.showApp();
                        } else {
                            this.showAuth();
                        }
                    }
                }
            } else {
                this.showAuth();
            }
        } catch (error) {
            console.error('❌ 检查登录状态失败:', error);
            // 如果有缓存的token和用户信息，尝试使用
            try {
                const token =
                    await window.electronAPI.getStoreValue('auth_token');
                const userInfo =
                    await window.electronAPI.getStoreValue('user_info');
                if (token && userInfo) {
                    console.log('📦 使用缓存的认证信息');
                    this.isAuthenticated = true;
                    this.currentUser = userInfo;
                    apiClient.token = token;
                    this.showApp();
                } else {
                    this.showAuth();
                }
            } catch (fallbackError) {
                this.showAuth();
            }
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

        // 确保显示登录界面而不是注册界面
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        const switchText = document.getElementById('auth-switch-text');
        const switchLink = document.getElementById('auth-switch-link');
        const title = document.querySelectorAll('.auth-title')[0];
        const subtitle = document.querySelectorAll('.auth-subtitle')[0];

        if (loginContainer && registerContainer) {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
            if (switchText) switchText.textContent = '还没有账号？';
            if (switchLink) switchLink.textContent = '立即注册';
            if (title) title.textContent = '欢迎回来';
            if (subtitle) subtitle.textContent = '登录您的账号以继续';
        }

        // 清除表单和消息
        this.clearMessages();
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
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
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        // 清除之前的错误信息，但不显示空消息
        this.clearMessages();

        if (!username || !password) {
            this.showError('login', '请填写所有字段');
            return;
        }

        try {
            // 调用后端 API
            await apiClient.login(username, password);

            // 获取用户信息
            const userInfo = await apiClient.fetchUserInfo();

            if (userInfo) {
                // 保存用户信息（确保头像也被保存）
                this.currentUser = {
                    id: userInfo.id,
                    username: userInfo.username,
                    name: userInfo.name,
                    email: userInfo.email,
                    qq: userInfo.qq,
                    avatar: userInfo.avatar || null, // 确保头像字段存在
                    role: userInfo.role,
                    created_at: userInfo.created_at
                };

                await this.setAuthenticated(this.currentUser);
                this.showSuccess('login', '登录成功！');

                setTimeout(async () => {
                    this.showApp();
                    if (window.app && !window.app.taskManager) {
                        await window.app.initializeAuthenticatedUser();
                        // 确保UI更新显示正确的头像
                        if (window.app.navigation) {
                            await window.app.navigation.updateUserInfo();
                        }
                        if (window.app.settingsManager) {
                            window.app.settingsManager.updateUserDisplay();
                        }
                    }
                }, 500);
            }
        } catch (error) {
            console.error('❌ 登录失败:', error);
            const errorMsg = error.message || '登录失败，请检查用户名和密码';
            this.showError('login', errorMsg);
        }
    }

    async handleRegister() {
        const username = document
            .getElementById('register-username')
            .value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById(
            'register-confirm-password'
        ).value;
        const qq = document.getElementById('register-qq').value.trim();

        // 清除之前的错误信息，但不显示空消息
        this.clearMessages();

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

        try {
            // 调用后端 API 注册
            const userData = {
                username: username,
                password: password,
                qq: qq
            };

            const response = await apiClient.register(userData);

            // 注册成功后自动登录
            await apiClient.login(username, password);
            const userInfo = await apiClient.fetchUserInfo();

            if (userInfo) {
                this.currentUser = {
                    id: userInfo.id,
                    username: userInfo.username,
                    name: userInfo.name,
                    email: userInfo.email,
                    qq: userInfo.qq,
                    avatar: userInfo.avatar || null, // 确保头像字段存在
                    role: userInfo.role,
                    created_at: userInfo.created_at
                };

                await this.setAuthenticated(this.currentUser);
                this.showSuccess('register', '注册成功！');

                setTimeout(async () => {
                    this.showApp();
                    if (window.app && !window.app.taskManager) {
                        await window.app.initializeAuthenticatedUser();
                        // 确保UI更新显示正确的头像
                        if (window.app.navigation) {
                            await window.app.navigation.updateUserInfo();
                        }
                        if (window.app.settingsManager) {
                            window.app.settingsManager.updateUserDisplay();
                        }
                    }
                }, 500);
            }
        } catch (error) {
            console.error('❌ 注册失败:', error);
            const errorMsg = error.message || '注册失败，请重试';
            this.showError('register', errorMsg);
        }
    }

    async setAuthenticated(user) {
        // 保存认证信息
        this.isAuthenticated = true;
        this.currentUser = {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            qq: user.qq,
            avatar: user.avatar,
            role: user.role,
            created_at: user.created_at
        };

        // Token 已在 apiClient.login() 中保存
        await window.electronAPI.setStoreValue('user_info', this.currentUser);
    }

    async logout() {
        try {
            await apiClient.logout();
            this.isAuthenticated = false;
            this.currentUser = null;
            this.showAuth();
            this.clearMessages();
            console.log('✅ 登出成功');
        } catch (error) {
            console.error('❌ 登出失败:', error);
        }
    }

    showError(type, message) {
        // 如果消息为空，不显示通知
        if (!message || message.trim() === '') {
            return;
        }
        // 创建侧边滑入的错误通知
        this.showToastNotification(message, 'error');
    }

    showSuccess(type, message) {
        // 如果消息为空，不显示通知
        if (!message || message.trim() === '') {
            return;
        }
        // 创建侧边滑入的成功通知
        this.showToastNotification(message, 'success');
    }

    showToastNotification(message, type = 'success') {
        // 如果消息为空，不显示通知
        if (!message || message.trim() === '') {
            return;
        }

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

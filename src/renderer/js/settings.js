// 导入国际化管理器
import { i18n } from '../i18n/i18n.js';
import { apiClient } from './api.js';
import { initCustomSelects } from './custom-select.js';

// 设置管理器
class SettingsManager {
    constructor(app) {
        this.app = app;
        this.settings = {
            username: '用户',
            theme: 'light',
            language: 'zh-CN',
            notifications: true,
            autoSave: true,
            showCompletedTasks: true,
            avatar: null,
            downloadPath: '',
            cloudDriveUrl: ''
        };

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.bindEvents();
        this.initThemeWatcher();
    }

    async loadSettings() {
        try {
            if (window.Electron) {
                const savedSettings =
                    await window.electronAPI.getStoreValue('settings');

                if (savedSettings) {
                    this.settings = { ...this.settings, ...savedSettings };
                }

                // 同步用户信息中的头像（如果存在）
                try {
                    const userInfo =
                        await window.electronAPI.getStoreValue('user_info');
                    if (userInfo && userInfo.avatar) {
                        // 如果用户信息中有头像，优先使用用户信息中的头像
                        this.settings.avatar = userInfo.avatar;
                    }
                } catch (error) {
                    console.warn('同步用户信息头像失败:', error);
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async saveSettings() {
        try {
            if (window.Electron) {
                await window.electronAPI.setStoreValue(
                    'settings',
                    this.settings
                );
                console.log('设置保存成功');
            }
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    bindEvents() {
        // 监听设置变化事件
        document.addEventListener('settings-changed', (event) => {
            this.updateSettings(event.detail.settings);
        });
    }

    initThemeWatcher() {
        // 监听系统主题变化（支持macOS和Windows）
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia(
                '(prefers-color-scheme: dark)'
            );

            // 初始应用主题
            this.applyTheme();

            // 监听系统主题变化
            const handleThemeChange = (e) => {
                // 只有在"跟随系统"模式下才响应系统主题变化
                if (this.settings.theme === 'auto') {
                    console.log(
                        `系统主题已变更为: ${e.matches ? '深色' : '浅色'}`
                    );
                    this.applyTheme();
                }
            };

            darkModeMediaQuery.addEventListener('change', handleThemeChange);

            this.darkModeMediaQuery = darkModeMediaQuery;
        }
    }

    async initI18n() {
        try {
            // 检查是否已经初始化过
            if (i18n.getCurrentLanguage()) {
                console.log('✅ 国际化管理器已初始化，跳过重复初始化');
                return;
            }

            // 初始化国际化管理器
            await i18n.init();

            // 设置当前语言
            await i18n.setLanguage(this.settings.language);

            // 添加语言变化监听器
            i18n.addLanguageChangeListener((language) => {
                console.log(`🌐 语言已切换为: ${language}`);
                // 更新设置中的语言
                this.settings.language = language;
                this.saveSettings();
            });

            console.log('✅ 国际化管理器初始化完成');
        } catch (error) {
            console.error('❌ 国际化管理器初始化失败:', error);
        }
    }

    async selectDownloadPath() {
        try {
            if (
                window.Electron &&
                window.electronAPI &&
                window.electronAPI.selectDirectory
            ) {
                const path = await window.electronAPI.selectDirectory();
                if (path) {
                    this.settings.downloadPath = path;
                    await this.saveSettings();

                    const downloadPathInput =
                        document.getElementById('download-path');
                    if (downloadPathInput) {
                        downloadPathInput.value = path;
                    }

                    this.app.showNotification('下载路径已更新', 'success');
                }
            } else {
                // Fallback for web version
                this.app.showNotification(
                    '此功能需要在桌面应用中使用',
                    'warning'
                );
            }
        } catch (error) {
            console.error('选择路径失败:', error);
            this.app.showNotification('选择路径失败', 'error');
        }
    }

    async saveCloudDriveUrl() {
        try {
            const cloudDriveUrlInput =
                document.getElementById('cloud-drive-url');
            if (cloudDriveUrlInput) {
                this.settings.cloudDriveUrl = cloudDriveUrlInput.value.trim();
                await this.saveSettings();

                // 保存云盘设置到localStorage
                if (this.settings.cloudDriveUrl) {
                    localStorage.setItem(
                        'cloudDriveSettings',
                        JSON.stringify({
                            url: this.settings.cloudDriveUrl
                        })
                    );

                    // 通知文件管理器重新加载
                    const event = new CustomEvent(
                        'cloud-drive-settings-updated',
                        {
                            detail: { url: this.settings.cloudDriveUrl }
                        }
                    );
                    document.dispatchEvent(event);
                }

                this.app.showNotification('云盘链接已保存', 'success');
            }
        } catch (error) {
            console.error('保存云盘链接失败:', error);
            this.app.showNotification('保存云盘链接失败', 'error');
        }
    }

    renderSettings() {
        const container = document.querySelector('.settings-content');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-section">
                <h3>用户设置</h3>
                <div class="setting-item avatar-setting">
                    <label>用户头像</label>
                    <div class="avatar-upload-container">
                        <div class="avatar-preview-wrapper">
                            <div class="avatar-preview" id="avatar-preview">
                                <img src="${this.settings.avatar || 'Assets/Icons/user.svg'}" alt="用户头像" id="avatar-preview-img">
                            </div>
                            <div class="avatar-upload-overlay" id="avatar-upload-trigger">
                                <img src="Assets/Icons/upload.svg" width="24" height="24" alt="上传">
                                <span>更换头像</span>
                            </div>
                        </div>
                        <input type="file" id="avatar-upload-input" accept="image/*" style="display: none;">
                        <div class="avatar-actions">
                            <button class="setting-btn" id="choose-avatar-btn">选择头像</button>
                            ${this.settings.avatar ? '<button class="setting-btn danger" id="remove-avatar-btn">移除头像</button>' : ''}
                        </div>
                    </div>
                </div>
                <div class="setting-item">
                    <label>用户名</label>
                    <input type="text" id="username-input" 
                           value="${this.escapeHtml(this.settings.username)}" 
                           placeholder="请输入用户名">
                </div>
                <div class="setting-item">
                    <label>主题</label>
                    <select id="theme-select">
                        <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>浅色主题</option>
                        <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>深色主题</option>
                        <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>跟随系统</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>语言</label>
                    <select id="language-select">
                        <option value="zh-CN" ${this.settings.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
                        <option value="en-US" ${this.settings.language === 'en-US' ? 'selected' : ''}>English</option>
                    </select>
                </div>
            </div>

            <div class="settings-section">
                <h3>应用设置</h3>
                <div class="setting-item">
                    <label>桌面通知</label>
                    <label class="setting-toggle">
                        <input type="checkbox" id="notifications-toggle" ${this.settings.notifications ? 'checked' : ''}>
                        <span class="setting-slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>自动保存</label>
                    <label class="setting-toggle">
                        <input type="checkbox" id="auto-save-toggle" ${this.settings.autoSave ? 'checked' : ''}>
                        <span class="setting-slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>显示已完成任务</label>
                    <label class="setting-toggle">
                        <input type="checkbox" id="show-completed-toggle" ${this.settings.showCompletedTasks ? 'checked' : ''}>
                        <span class="setting-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section">
                <h3>数据管理</h3>
                <div class="setting-item">
                    <label>默认下载路径</label>
                    <input type="text" id="download-path" placeholder="点击选择下载路径" readonly value="${this.escapeHtml(this.settings.downloadPath || '')}">
                </div>
                <div class="setting-item">
                    <label>存储签名</label>
                    <input type="text" id="storage-signature" placeholder="Admin" value="${this.escapeHtml(this.settings.storageSignature || '')}">
                </div>
                <div class="setting-item">
                    <label>存储密码</label>
                    <input type="text" id="storage-password" placeholder="Password" value="${this.escapeHtml(this.settings.storagePassword || '')}">
                </div>
            </div>

            <div class="settings-section">
                <h3>关于</h3>
                <div class="setting-item">
                    <label>版本</label>
                    <span class="setting-status success">
                        <span class="setting-status-dot"></span>
                        v1.0.0
                    </span>
                </div>
                <div class="setting-item">
                    <label>开发者</label>
                    <span>HXK Team —— Orange</span>
                </div>
            </div>
        `;

        this.bindSettingsEvents();
    }

    bindSettingsEvents() {
        // 头像上传相关
        const avatarUploadInput = document.getElementById(
            'avatar-upload-input'
        );
        const chooseAvatarBtn = document.getElementById('choose-avatar-btn');
        const removeAvatarBtn = document.getElementById('remove-avatar-btn');
        const avatarUploadTrigger = document.getElementById(
            'avatar-upload-trigger'
        );

        if (chooseAvatarBtn && avatarUploadInput) {
            chooseAvatarBtn.addEventListener('click', () => {
                avatarUploadInput.click();
            });
        }

        if (avatarUploadTrigger && avatarUploadInput) {
            avatarUploadTrigger.addEventListener('click', () => {
                avatarUploadInput.click();
            });
        }

        if (avatarUploadInput) {
            avatarUploadInput.addEventListener('change', (event) => {
                this.handleAvatarUpload(event.target.files[0]);
            });
        }

        if (removeAvatarBtn) {
            removeAvatarBtn.addEventListener('click', () => {
                this.removeAvatar();
            });
        }

        // 用户名输入
        const usernameInput = document.getElementById('username-input');
        if (usernameInput) {
            usernameInput.addEventListener('change', (event) => {
                this.settings.username = event.target.value;
                this.saveSettings();
                this.updateUserDisplay();
                this.app.showNotification('用户名已更新', 'success');
            });
        }

        // 主题选择
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (event) => {
                this.settings.theme = event.target.value;
                this.saveSettings();
                this.applyTheme();

                // 根据不同模式显示不同提示
                if (this.settings.theme === 'auto') {
                    this.app.showNotification('主题将跟随系统设置', 'success');
                } else if (this.settings.theme === 'dark') {
                    this.app.showNotification('已切换到深色主题', 'success');
                } else {
                    this.app.showNotification('已切换到浅色主题', 'success');
                }
            });
        }

        // 语言选择
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', async (event) => {
                const newLanguage = event.target.value;
                this.settings.language = newLanguage;
                await this.saveSettings();

                // 切换语言
                const success = await i18n.setLanguage(newLanguage);

                if (success) {
                    // 通知主进程更新菜单
                    window.electronAPI.setLanguage(newLanguage);

                    // 更新页面文本（不重新渲染设置页面）
                    i18n.updatePageTexts();

                    this.app.showNotification(
                        newLanguage === 'zh-CN'
                            ? '语言已切换为中文'
                            : 'Language switched to English',
                        'success'
                    );
                } else {
                    this.app.showNotification('语言切换失败', 'error');
                }
            });
        }

        // 通知开关
        const notificationsToggle = document.getElementById(
            'notifications-toggle'
        );
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', (event) => {
                this.settings.notifications = event.target.checked;
                this.saveSettings();
                this.app.showNotification('通知设置已更新', 'success');
            });
        }

        // 自动保存开关
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('change', (event) => {
                this.settings.autoSave = event.target.checked;
                this.saveSettings();
                this.app.showNotification('自动保存设置已更新', 'success');
            });
        }

        // 显示已完成任务开关
        const showCompletedToggle = document.getElementById(
            'show-completed-toggle'
        );
        if (showCompletedToggle) {
            showCompletedToggle.addEventListener('change', (event) => {
                this.settings.showCompletedTasks = event.target.checked;
                this.saveSettings();
                this.app.showNotification('显示设置已更新', 'success');
            });
        }

        // 点击下载路径输入框选择目录
        const downloadPathInput = document.getElementById('download-path');
        if (downloadPathInput) {
            downloadPathInput.addEventListener('click', async () => {
                await this.selectDownloadPath();
            });
        }

        // 云盘链接输入框修改后自动保存
        const cloudDriveUrlInput = document.getElementById('cloud-drive-url');
        if (cloudDriveUrlInput) {
            cloudDriveUrlInput.addEventListener('change', async () => {
                await this.saveCloudDriveUrl();
            });
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.renderSettings();
    }

    updateUserDisplay() {
        // 优先从authManager获取用户名
        let displayName = this.settings.username;
        if (
            this.app &&
            this.app.authManager &&
            this.app.authManager.isUserAuthenticated()
        ) {
            const authUser = this.app.authManager.getCurrentUser();
            displayName = authUser?.username || this.settings.username;
        }

        // 更新用户名
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }

        // 更新导航栏头像
        this.updateNavigationAvatar();

        // 如果导航管理器存在，也通知它更新
        if (this.app && this.app.navigation) {
            this.app.navigation.updateUserInfo();
        }
    }

    async updateNavigationAvatar() {
        const navAvatarImg = document.querySelector('.user-avatar img');
        if (navAvatarImg) {
            // 优先使用后端返回的头像
            let avatarSrc = 'Assets/Icons/user.svg';
            try {
                const storedUserInfo =
                    await window.electronAPI?.getStoreValue('user_info');
                if (storedUserInfo?.avatar) {
                    avatarSrc = storedUserInfo.avatar;
                } else if (this.settings.avatar) {
                    avatarSrc = this.settings.avatar;
                }
            } catch (error) {
                console.warn('获取用户信息失败:', error);
                if (this.settings.avatar) {
                    avatarSrc = this.settings.avatar;
                }
            }
            navAvatarImg.src = avatarSrc;
        }
    }

    async handleAvatarUpload(file) {
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            this.app.showNotification('请选择图片文件', 'error');
            return;
        }

        // 验证文件大小 (限制为2MB)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            this.app.showNotification('图片大小不能超过2MB', 'error');
            return;
        }

        try {
            // 读取文件并转换为base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Data = e.target.result;

                // 可选：压缩图片
                const compressedData = await this.compressImage(base64Data);

                // 先保存到本地
                this.settings.avatar = compressedData;
                await this.saveSettings();

                // 保存到数据库
                try {
                    await apiClient.updateUser({
                        avatar: compressedData
                    });

                    // 更新后端返回的用户信息（包含头像）
                    const updatedUserInfo = await apiClient.fetchUserInfo();
                    if (updatedUserInfo) {
                        await window.electronAPI?.setStoreValue(
                            'user_info',
                            updatedUserInfo
                        );
                    }
                } catch (apiError) {
                    console.error('保存头像到数据库失败:', apiError);
                    this.app.showNotification(
                        '保存头像到服务器失败，但已保存到本地',
                        'warning'
                    );
                }

                // 更新预览
                const previewImg =
                    document.getElementById('avatar-preview-img');
                if (previewImg) {
                    previewImg.src = compressedData;
                }

                // 更新导航栏头像
                this.updateNavigationAvatar();

                // 重新渲染设置以显示移除按钮
                this.renderSettings();

                // 重新初始化自定义下拉框（在renderSettings之后）
                setTimeout(() => {
                    // 先清理旧的实例
                    document
                        .querySelectorAll('.custom-select')
                        .forEach((el) => {
                            el.remove();
                        });
                    // 移除初始化标记，允许重新初始化
                    document.querySelectorAll('select').forEach((select) => {
                        delete select.dataset.customSelectInitialized;
                    });
                    // 重新初始化
                    initCustomSelects();
                }, 50);

                this.app.showNotification('头像已更新', 'success');
            };

            reader.onerror = () => {
                this.app.showNotification('读取图片失败', 'error');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('上传头像失败:', error);
            this.app.showNotification('上传头像失败', 'error');
        }
    }

    async compressImage(base64Data, maxWidth = 200, maxHeight = 200) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 计算缩放比例
                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 转换为base64，使用较低质量以减小文件大小
                const compressedData = canvas.toDataURL('image/jpeg', 0.8);
                resolve(compressedData);
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            img.src = base64Data;
        });
    }

    async removeAvatar() {
        if (!confirm('确定要移除头像吗？')) {
            return;
        }

        // 先更新本地设置
        this.settings.avatar = null;
        await this.saveSettings();

        // 同步删除数据库中的头像
        try {
            await apiClient.updateUser({
                avatar: null
            });

            // 更新后端返回的用户信息
            const updatedUserInfo = await apiClient.fetchUserInfo();
            if (updatedUserInfo) {
                await window.electronAPI?.setStoreValue(
                    'user_info',
                    updatedUserInfo
                );
            }
        } catch (apiError) {
            console.error('删除头像到数据库失败:', apiError);
            this.app.showNotification(
                '删除头像到服务器失败，但已从本地移除',
                'warning'
            );
        }

        // 更新导航栏头像
        this.updateNavigationAvatar();

        // 重新渲染设置
        this.renderSettings();

        // 重新初始化自定义下拉框（在renderSettings之后）
        setTimeout(() => {
            // 先清理旧的实例
            document.querySelectorAll('.custom-select').forEach((el) => {
                el.remove();
            });
            // 移除初始化标记，允许重新初始化
            document.querySelectorAll('select').forEach((select) => {
                delete select.dataset.customSelectInitialized;
            });
            // 重新初始化
            initCustomSelects();
        }, 50);

        this.app.showNotification('头像已移除', 'success');
    }

    applyTheme() {
        const body = document.body;
        const html = document.documentElement;

        // 移除现有主题类
        body.classList.remove('theme-light', 'theme-dark', 'dark');
        html.classList.remove('theme-light', 'theme-dark');

        let appliedTheme = '';
        let isDarkMode = false;

        // 应用新主题
        if (this.settings.theme === 'dark') {
            appliedTheme = 'theme-dark';
            isDarkMode = true;
            body.classList.add('theme-dark', 'dark');
            html.classList.add('theme-dark');
        } else if (this.settings.theme === 'light') {
            appliedTheme = 'theme-light';
            isDarkMode = false;
            body.classList.add('theme-light');
            html.classList.add('theme-light');
        } else {
            // 跟随系统（auto模式）
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;

            isDarkMode = prefersDark;
            appliedTheme = prefersDark ? 'theme-dark' : 'theme-light';

            if (prefersDark) {
                body.classList.add('theme-dark', 'dark');
            } else {
                body.classList.add('theme-light');
            }
            html.classList.add(appliedTheme);

            console.log(
                `跟随系统主题: ${prefersDark ? '深色模式' : '浅色模式'}`
            );
        }

        // 通知Electron主进程主题变化（用于原生窗口标题栏等）
        if (window.electronAPI && window.electronAPI.setTheme) {
            window.electronAPI.setTheme(isDarkMode ? 'dark' : 'light');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 获取当前设置
    getSettings() {
        return { ...this.settings };
    }

    // 重置设置为默认值
    async resetToDefaults() {
        this.settings = {
            username: '用户',
            theme: 'light',
            language: 'zh-CN',
            notifications: true,
            autoSave: true,
            showCompletedTasks: true,
            avatar: null,
            downloadPath: '',
            cloudDriveUrl: ''
        };

        await this.saveSettings();
        this.updateNavigationAvatar();
        this.renderSettings();
        this.app.showNotification('设置已重置为默认值', 'success');
    }
}

// 导出类供其他模块使用
export { SettingsManager };

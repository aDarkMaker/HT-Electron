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
            avatar: null // 存储用户头像的base64数据
        };

        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
    }

    async loadSettings() {
        try {
            if (window.electronAPI) {
                const savedSettings =
                    await window.electronAPI.getStoreValue('settings');

                if (savedSettings) {
                    this.settings = { ...this.settings, ...savedSettings };
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async saveSettings() {
        try {
            if (window.electronAPI) {
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
                    <label>导出数据</label>
                    <div class="setting-button-group">
                        <button class="setting-btn primary" id="export-data-btn">导出</button>
                    </div>
                </div>
                <div class="setting-item">
                    <label>导入数据</label>
                    <div class="setting-button-group">
                        <input type="file" id="import-file-input" accept=".json" style="display: none;">
                        <button class="setting-btn" id="import-data-btn">导入</button>
                    </div>
                </div>
                <div class="setting-item">
                    <label>清除数据</label>
                    <div class="setting-button-group">
                        <button class="setting-btn danger" id="clear-data-btn">清除</button>
                    </div>
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
                    <span>HXK Team</span>
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
                this.app.showNotification('主题已更新', 'success');
            });
        }

        // 语言选择
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (event) => {
                this.settings.language = event.target.value;
                this.saveSettings();
                this.app.showNotification('语言设置已更新', 'success');
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

        // 导出数据
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // 导入数据
        const importBtn = document.getElementById('import-data-btn');
        const importInput = document.getElementById('import-file-input');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => {
                importInput.click();
            });

            importInput.addEventListener('change', (event) => {
                this.importData(event.target.files[0]);
            });
        }

        // 清除数据
        const clearBtn = document.getElementById('clear-data-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearData();
            });
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.renderSettings();
    }

    updateUserDisplay() {
        // 更新用户名
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = this.settings.username;
        }

        // 更新导航栏头像
        this.updateNavigationAvatar();

        // 如果导航管理器存在，也通知它更新
        if (this.app && this.app.navigation) {
            this.app.navigation.updateUserInfo();
        }
    }

    updateNavigationAvatar() {
        const navAvatarImg = document.querySelector('.user-avatar img');
        if (navAvatarImg) {
            const avatarSrc = this.settings.avatar || 'Assets/Icons/user.svg';
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

                this.settings.avatar = compressedData;
                await this.saveSettings();

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

        this.settings.avatar = null;
        await this.saveSettings();

        // 更新导航栏头像
        this.updateNavigationAvatar();

        // 重新渲染设置
        this.renderSettings();

        this.app.showNotification('头像已移除', 'success');
    }

    applyTheme() {
        const body = document.body;

        // 移除现有主题类
        body.classList.remove('theme-light', 'theme-dark');

        // 应用新主题
        if (this.settings.theme === 'dark') {
            body.classList.add('theme-dark');
        } else if (this.settings.theme === 'light') {
            body.classList.add('theme-light');
        } else {
            // 跟随系统
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        }
    }

    async exportData() {
        try {
            const data = {
                tasks: this.app.tasks,
                myTasks: this.app.myTasks,
                calendarEvents: this.app.calendarEvents,
                settings: this.settings,
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hxk-terminal-backup-${new Date().toISOString().split('T')[0]}.json`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            this.app.showNotification('数据导出成功', 'success');
        } catch (error) {
            console.error('导出数据失败:', error);
            this.app.showNotification('导出数据失败', 'error');
        }
    }

    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // 验证数据格式
            if (!this.validateImportData(data)) {
                this.app.showNotification('数据格式不正确', 'error');
                return;
            }

            // 确认导入
            if (!confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
                return;
            }

            // 导入数据
            if (data.tasks) this.app.tasks = data.tasks;
            if (data.myTasks) this.app.myTasks = data.myTasks;
            if (data.calendarEvents)
                this.app.calendarEvents = data.calendarEvents;
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
                await this.saveSettings();
            }

            // 保存到存储
            await this.app.saveData();

            // 更新界面
            this.app.updateTaskCounts();
            if (this.app.taskManager) {
                this.app.taskManager.renderTasks();
            }
            if (this.app.calendarManager) {
                this.app.calendarManager.renderCalendar();
            }

            this.app.showNotification('数据导入成功', 'success');
        } catch (error) {
            console.error('导入数据失败:', error);
            this.app.showNotification('导入数据失败', 'error');
        }
    }

    validateImportData(data) {
        return (
            data &&
            typeof data === 'object' &&
            Array.isArray(data.tasks) &&
            Array.isArray(data.myTasks) &&
            Array.isArray(data.calendarEvents)
        );
    }

    async clearData() {
        if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            return;
        }

        try {
            // 清除数据
            this.app.tasks = [];
            this.app.myTasks = [];
            this.app.calendarEvents = [];

            // 保存到存储
            await this.app.saveData();

            // 更新界面
            this.app.updateTaskCounts();
            if (this.app.taskManager) {
                this.app.taskManager.renderTasks();
            }
            if (this.app.calendarManager) {
                this.app.calendarManager.renderCalendar();
            }

            this.app.showNotification('数据已清除', 'success');
        } catch (error) {
            console.error('清除数据失败:', error);
            this.app.showNotification('清除数据失败', 'error');
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
            avatar: null
        };

        await this.saveSettings();
        this.updateNavigationAvatar();
        this.renderSettings();
        this.app.showNotification('设置已重置为默认值', 'success');
    }
}

// 导出类供其他模块使用
export { SettingsManager };

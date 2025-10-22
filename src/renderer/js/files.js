// 文件管理模块
class FileManager {
    constructor() {
        this.cloudDriveUrl = '';
        this.isConnected = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCloudDriveSettings();
        this.listenForSettingsUpdates();
    }

    listenForSettingsUpdates() {
        // 监听云盘设置更新事件
        document.addEventListener('cloud-drive-settings-updated', (event) => {
            const { url } = event.detail;
            if (url) {
                this.cloudDriveUrl = url;
                this.loadCloudDrive(url);
            }
        });
    }

    bindEvents() {
        // 连接云盘按钮
        const connectBtn = document.getElementById('connect-cloud-drive-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () =>
                this.connectCloudDrive()
            );
        }
    }

    loadCloudDriveSettings() {
        // 从localStorage加载云盘设置
        const settings = localStorage.getItem('cloudDriveSettings');
        if (settings) {
            const { url } = JSON.parse(settings);
            this.cloudDriveUrl = url;
            if (url) {
                this.isConnected = true;
                this.loadCloudDrive(url);
            }
        }
    }

    connectCloudDrive() {
        // 跳转到设置页面
        const settingsNavItem = document.querySelector(
            '[data-view="settings"]'
        );
        if (settingsNavItem) {
            settingsNavItem.click();
        }
    }

    loadCloudDrive(url) {
        const frameContainer = document.querySelector('.cloud-drive-frame');
        if (!frameContainer) return;

        // 清空占位符并加载iframe
        frameContainer.innerHTML = `
            <iframe src="${url}" allowfullscreen></iframe>
        `;

        this.isConnected = true;
    }
}

// 初始化文件管理器
const fileManager = new FileManager();

export default fileManager;

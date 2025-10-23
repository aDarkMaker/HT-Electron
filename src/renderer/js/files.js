// 文件管理模块
class FileManager {
    constructor() {
        this.alistUrl = 'http://localhost:5244';
        this.isConnected = false;
        this.isLoading = true;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAlistConnection();
        this.setupIframeHandlers();
    }

    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refresh-alist-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAlist());
        }

        // 在新窗口打开按钮
        const externalBtn = document.getElementById('open-alist-external-btn');
        if (externalBtn) {
            externalBtn.addEventListener('click', () =>
                this.openAlistExternal()
            );
        }

        // 重试按钮
        const retryBtn = document.getElementById('retry-alist-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryConnection());
        }

        // 启动 Alist 按钮
        const startBtn = document.getElementById('start-alist-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startAlist());
        }
    }

    setupIframeHandlers() {
        const iframe = document.getElementById('alist-iframe');
        if (!iframe) return;

        // 监听 iframe 加载完成
        iframe.addEventListener('load', () => {
            this.handleIframeLoad();
            this.setupNotificationHandling(iframe);
        });

        // 监听 iframe 加载错误
        iframe.addEventListener('error', () => {
            this.handleIframeError();
        });
    }

    setupNotificationHandling(iframe) {
        try {
            // 尝试访问 iframe 的内容窗口
            const iframeWindow = iframe.contentWindow;
            if (!iframeWindow) return;

            // 监听来自 iframe 的消息
            window.addEventListener('message', (event) => {
                if (event.source === iframeWindow) {
                    this.handleIframeMessage(event.data);
                }
            });

            // 向 iframe 发送消息，设置通知权限
            setTimeout(() => {
                try {
                    iframeWindow.postMessage(
                        {
                            type: 'SETUP_NOTIFICATIONS',
                            allowNotifications: true,
                            notificationTimeout: 5000 // 5秒后自动关闭
                        },
                        '*'
                    );
                } catch (error) {
                    console.log('无法向 iframe 发送消息:', error);
                }
            }, 1000);
        } catch (error) {
            console.log('设置 iframe 通知处理失败:', error);
        }
    }

    handleIframeMessage(data) {
        if (data.type === 'NOTIFICATION_SHOW') {
            console.log('iframe 通知显示:', data.message);
        } else if (data.type === 'NOTIFICATION_ERROR') {
            console.log('iframe 通知错误:', data.error);
        }
    }

    async checkAlistConnection() {
        this.updateStatus('connecting', '检查连接中...');

        try {
            const response = await fetch(`${this.alistUrl}/api/me`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                this.handleConnectionSuccess();
            } else {
                this.handleConnectionError();
            }
        } catch (error) {
            console.log('Alist 连接检查失败:', error);
            this.handleConnectionError();
        }
    }

    handleConnectionSuccess() {
        this.isConnected = true;
        this.isLoading = false;
        this.retryCount = 0;
        this.updateStatus('connected', '已连接');
        this.hideLoading();
        this.hideError();
    }

    handleConnectionError() {
        this.isConnected = false;
        this.isLoading = false;
        this.updateStatus('disconnected', '连接失败');
        this.hideLoading();
        this.showError();
    }

    handleIframeLoad() {
        // iframe 加载完成，隐藏加载状态
        setTimeout(() => {
            this.hideLoading();
            if (this.isConnected) {
                this.updateStatus('connected', '已连接');
            }
        }, 1000);
    }

    handleIframeError() {
        this.handleConnectionError();
    }

    updateStatus(status, text) {
        const statusElement = document.getElementById('alist-status');
        if (!statusElement) return;

        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');

        // 移除所有状态类
        statusElement.classList.remove(
            'connected',
            'connecting',
            'disconnected'
        );

        // 添加当前状态类
        statusElement.classList.add(status);

        // 更新文本
        if (statusText) {
            statusText.textContent = text;
        }
    }

    showLoading() {
        const loadingOverlay = document.getElementById('alist-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('alist-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showError() {
        const errorOverlay = document.getElementById('alist-error');
        if (errorOverlay) {
            errorOverlay.style.display = 'flex';
        }
    }

    hideError() {
        const errorOverlay = document.getElementById('alist-error');
        if (errorOverlay) {
            errorOverlay.style.display = 'none';
        }
    }

    refreshAlist() {
        const iframe = document.getElementById('alist-iframe');
        if (iframe) {
            this.showLoading();
            this.updateStatus('connecting', '刷新中...');
            iframe.src = iframe.src; // 重新加载 iframe
        }
    }

    openAlistExternal() {
        // 在外部浏览器中打开 Alist
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(this.alistUrl);
        } else {
            window.open(this.alistUrl, '_blank');
        }
    }

    retryConnection() {
        if (this.retryCount >= this.maxRetries) {
            alert('重试次数过多，请检查 Alist 服务是否正常运行');
            return;
        }

        this.retryCount++;
        this.hideError();
        this.showLoading();
        this.checkAlistConnection();
    }

    startAlist() {
        // 这里可以添加启动 Alist 服务的逻辑
        // 例如通过 shell 命令启动
        alert(
            '请手动启动 Alist 服务：\n\n1. 打开终端\n2. 进入 Alist 目录\n3. 运行: ./alist server'
        );
    }

    // 监听视图切换
    onViewShow() {
        if (!this.isConnected) {
            this.checkAlistConnection();
        }
    }
}

// 初始化文件管理器
const fileManager = new FileManager();

// 监听视图切换事件
document.addEventListener('view-switched', (event) => {
    if (event.detail.view === 'files') {
        fileManager.onViewShow();
    }
});

export default fileManager;

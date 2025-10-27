/**
 * 自定义标题栏控制
 * 支持 Windows 和 macOS 平台
 * 支持深色和浅色主题
 */

class TitlebarController {
    constructor() {
        this.isWindows = this.detectPlatform();
        this.setupTitlebar();
    }

    // 检测平台
    detectPlatform() {
        // 通过 navigator.platform 或 user-agent 检测
        return (
            navigator.platform.toLowerCase().indexOf('win') !== -1 ||
            (typeof process !== 'undefined' && process.platform === 'win32')
        );
    }

    // 初始化标题栏
    async setupTitlebar() {
        if (!window.electronAPI) {
            console.warn('Electron API 不可用');
            return;
        }

        // 设置平台类名
        if (this.isWindows) {
            document.body.classList.add('windows');
        } else {
            document.body.classList.add('darwin');
        }

        // 检测主题
        await this.initTheme();

        // 设置按钮事件
        this.setupButtons();

        // 监听窗口最大化状态变化
        this.listenWindowState();

        // 初始化窗口状态
        this.updateWindowState();
    }

    // 初始化主题
    async initTheme() {
        try {
            const theme = await window.electronAPI.getStoreValue('theme');
            if (theme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        } catch (error) {
            console.warn('无法获取主题设置:', error);
        }
    }

    // 设置按钮事件
    setupButtons() {
        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');

        if (minimizeBtn && window.electronAPI) {
            minimizeBtn.addEventListener('click', () => {
                window.electronAPI.minimizeWindow();
            });
        }

        if (maximizeBtn && window.electronAPI) {
            maximizeBtn.addEventListener('click', async () => {
                await window.electronAPI.maximizeWindow();
                await this.updateWindowState();
            });
        }

        if (closeBtn && window.electronAPI) {
            closeBtn.addEventListener('click', () => {
                window.electronAPI.closeWindow();
            });
        }
    }

    // 监听窗口状态变化
    listenWindowState() {
        if (!window.electronAPI) return;

        window.electronAPI.onWindowMaximized((isMaximized) => {
            this.updateMaximizeButton(isMaximized);
        });
    }

    // 更新窗口状态
    async updateWindowState() {
        if (!window.electronAPI) return;

        try {
            const isMaximized = await window.electronAPI.isMaximized();
            this.updateMaximizeButton(isMaximized);
        } catch (error) {
            console.warn('无法获取窗口状态:', error);
        }
    }

    // 更新最大化按钮图标
    updateMaximizeButton(isMaximized) {
        const maximizeBtn = document.getElementById('maximize-btn');
        if (!maximizeBtn) return;

        const svg = maximizeBtn.querySelector('svg');

        if (isMaximized) {
            // 还原图标（两个重叠的矩形）
            if (svg) {
                svg.innerHTML = `
                    <path d="M2 2 L2 8 L8 8 L8 2 Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M8 8 L8 14 L14 14 L14 8 Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
                `;
            }
            maximizeBtn.classList.add('restore');
        } else {
            // 最大化图标（单个矩形）
            if (svg) {
                svg.innerHTML = `
                    <rect width="10" height="10" x="1" y="1" fill="none" stroke="currentColor" stroke-width="1.2"/>
                `;
            }
            maximizeBtn.classList.remove('restore');
        }
    }
}

// 初始化标题栏控制器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TitlebarController();
    });
} else {
    new TitlebarController();
}

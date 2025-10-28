import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store();

let mainWindow;

function createWindow() {
    // macOS 保持原生边框，Windows 使用自定义标题栏
    const isMac = process.platform === 'darwin';

    mainWindow = new BrowserWindow({
        width: 760,
        height: 600,
        minWidth: 760,
        maxWidth: 760,
        minHeight: 600,
        maxHeight: 600,
        resizable: false, // 禁用窗口大小调整
        frame: isMac,
        transparent: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: join(__dirname, 'preload.js'),
            // DevMode
            webSecurity: false,
            allowRunningInsecureContent: true
        },
        icon: join(__dirname, '../build/icon/icon.png'),
        show: false,
        backgroundColor: '#F5F5F5'
    });

    mainWindow.loadFile(join(__dirname, 'renderer/index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // 开发模式下打开开发者工具
        if (process.argv.includes('--development')) {
            mainWindow.webContents.openDevTools();
        }
    });

    // 当窗口被关闭时触发
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 在 macOS 上禁用全屏功能
    if (process.platform === 'darwin') {
        mainWindow.on('maximize', () => {
            mainWindow.restore();
        });

        mainWindow.on('move', () => {
            // 如果窗口被移动到屏幕边缘（macOS 全屏触发），恢复到原大小
            const bounds = mainWindow.getBounds();
            if (bounds.width !== 1000 || bounds.height !== 600) {
                mainWindow.setBounds({ width: 1000, height: 600 });
            }
        });
    }

    // 设置菜单
    createMenu();
}

async function createMenu() {
    // 获取当前语言设置
    const currentLanguage = store.get('language', 'zh-CN');

    // 根据语言设置菜单文本
    const menuTexts = {
        'zh-CN': {
            file: '文件',
            newTask: '新建任务',
            exit: '退出',
            view: '视图',
            reload: '重新加载',
            toggleDevTools: '切换开发者工具',
            actualSize: '实际大小',
            zoomIn: '放大',
            zoomOut: '缩小',
            help: '帮助',
            about: '关于 HXK Terminal'
        },
        'en-US': {
            file: 'File',
            newTask: 'New Task',
            exit: 'Exit',
            view: 'View',
            reload: 'Reload',
            toggleDevTools: 'Toggle Developer Tools',
            actualSize: 'Actual Size',
            zoomIn: 'Zoom In',
            zoomOut: 'Zoom Out',
            help: 'Help',
            about: 'About HXK Terminal'
        }
    };

    const texts = menuTexts[currentLanguage] || menuTexts['zh-CN'];

    const template = [
        {
            label: texts.file,
            submenu: [
                {
                    label: texts.newTask,
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-task');
                    }
                },
                { type: 'separator' },
                {
                    label: texts.exit,
                    accelerator:
                        process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: texts.view,
            submenu: [
                {
                    label: texts.reload,
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: texts.toggleDevTools,
                    accelerator:
                        process.platform === 'darwin'
                            ? 'Alt+Cmd+I'
                            : 'Ctrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                { type: 'separator' },
                {
                    label: texts.actualSize,
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomLevel(0);
                    }
                },
                {
                    label: texts.zoomIn,
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const currentZoom =
                            mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                    }
                },
                {
                    label: texts.zoomOut,
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const currentZoom =
                            mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                    }
                }
            ]
        },
        {
            label: texts.help,
            submenu: [
                {
                    label: texts.about,
                    click: () => {
                        mainWindow.webContents.send('menu-about');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
    // 在 macOS 上，应用和菜单栏通常会保持活跃状态，直到用户使用 Cmd + Q 明确退出
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，通常会在应用中重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('get-store-value', (event, key) => {
    return store.get(key);
});

ipcMain.handle('set-store-value', (event, key, value) => {
    store.set(key, value);
    return true;
});

ipcMain.handle('delete-store-value', (event, key) => {
    store.delete(key);
    return true;
});

// 选择目录
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (result.canceled) {
        return null;
    } else {
        return result.filePaths[0];
    }
});

// 主题设置
ipcMain.on('set-theme', (event, theme) => {
    if (!mainWindow) return;

    // macOS 原生支持深色模式
    if (process.platform === 'darwin') {
        // macOS 会自动处理窗口外观
        // console.log(`主题已切换为: ${theme}`);
    }

    // Windows 可以通过设置背景色来适应主题
    if (process.platform === 'win32') {
        const backgroundColor = theme === 'dark' ? '#1a202c' : '#F5F5F5';
        mainWindow.setBackgroundColor(backgroundColor);
    }
});

// 语言设置
ipcMain.on('set-language', async (event, language) => {
    if (!mainWindow) return;

    try {
        // 保存语言设置
        store.set('language', language);

        // 重新创建菜单以应用新语言
        await createMenu();

        console.log(`语言已切换为: ${language}`);
    } catch (error) {
        console.error('语言切换失败:', error);
    }
});

// 安全设置
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        import('electron').then(({ shell }) => {
            shell.openExternal(navigationUrl);
        });
    });
});

// 窗口控制 IPC 处理器
ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
    return mainWindow.isMaximized();
});

ipcMain.handle('close-window', () => {
    mainWindow.close();
});

ipcMain.handle('is-maximized', () => {
    return mainWindow.isMaximized();
});

// TODO: 网盘挂载
// TODO: 界面
// TODO: BiliBili Api

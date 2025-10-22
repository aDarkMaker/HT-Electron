import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 800,
        minHeight: 500,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: join(__dirname, 'preload.js')
        },
        icon: join(__dirname, '../assets/icon.png'),
        titleBarStyle: 'default',
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

    // 设置菜单
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '新建任务',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-task');
                    }
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator:
                        process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '重新加载',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: '切换开发者工具',
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
                    label: '实际大小',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomLevel(0);
                    }
                },
                {
                    label: '放大',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const currentZoom =
                            mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                    }
                },
                {
                    label: '缩小',
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
            label: '帮助',
            submenu: [
                {
                    label: '关于 HXK Terminal',
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
        console.log(`主题已切换为: ${theme}`);
    }

    // Windows 可以通过设置背景色来适应主题
    if (process.platform === 'win32') {
        const backgroundColor = theme === 'dark' ? '#1a202c' : '#F5F5F5';
        mainWindow.setBackgroundColor(backgroundColor);
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

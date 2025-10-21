import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { join } from "path";
import Store from "electron-store";

// 初始化数据存储
const store = new Store();

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: join(__dirname, "../assets/icon.png"),
    titleBarStyle: "default",
    show: false,
    backgroundColor: "#F5F5F5",
  });

  // 加载应用的 index.html
  mainWindow.loadFile(join(__dirname, "renderer/index.html"));

  // 当窗口准备好显示时显示窗口
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // 开发模式下打开开发者工具
    if (process.argv.includes("--development")) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 当窗口被关闭时触发
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 设置菜单
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: "文件",
      submenu: [
        {
          label: "新建任务",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-task");
          },
        },
        { type: "separator" },
        {
          label: "退出",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "视图",
      submenu: [
        {
          label: "重新加载",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: "切换开发者工具",
          accelerator:
            process.platform === "darwin" ? "Alt+Cmd+I" : "Ctrl+Shift+I",
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
        { type: "separator" },
        {
          label: "实际大小",
          accelerator: "CmdOrCtrl+0",
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          },
        },
        {
          label: "放大",
          accelerator: "CmdOrCtrl+Plus",
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          },
        },
        {
          label: "缩小",
          accelerator: "CmdOrCtrl+-",
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          },
        },
      ],
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于 HXK Terminal",
          click: () => {
            mainWindow.webContents.send("menu-about");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都被关闭时退出应用
app.on("window-all-closed", () => {
  // 在 macOS 上，应用和菜单栏通常会保持活跃状态，直到用户使用 Cmd + Q 明确退出
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，通常会在应用中重新创建窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 通信处理
ipcMain.handle("get-store-value", (event, key) => {
  return store.get(key);
});

ipcMain.handle("set-store-value", (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle("delete-store-value", (event, key) => {
  store.delete(key);
  return true;
});

// 安全设置
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    require("electron").shell.openExternal(navigationUrl);
  });
});

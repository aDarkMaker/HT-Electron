const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 数据存储相关
    getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
    setStoreValue: (key, value) =>
        ipcRenderer.invoke('set-store-value', key, value),
    deleteStoreValue: (key) => ipcRenderer.invoke('delete-store-value', key),

    // 文件系统相关
    selectDirectory: () => ipcRenderer.invoke('select-directory'),

    // 主题相关
    setTheme: (theme) => ipcRenderer.send('set-theme', theme),

    // 语言相关
    setLanguage: (language) => ipcRenderer.send('set-language', language),

    // 菜单事件监听
    onMenuNewTask: (callback) => {
        ipcRenderer.on('menu-new-task', callback);
        return () => ipcRenderer.removeListener('menu-new-task', callback);
    },

    onMenuAbout: (callback) => {
        ipcRenderer.on('menu-about', callback);
        return () => ipcRenderer.removeListener('menu-about', callback);
    }
});

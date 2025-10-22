// 国际化管理器
import { zhCN } from './languages/zh-CN.js';
import { enUS } from './languages/en-US.js';

class I18nManager {
    constructor() {
        this.currentLanguage = 'zh-CN';
        this.translations = {
            'zh-CN': zhCN,
            'en-US': enUS
        };
        this.listeners = [];
    }

    // 初始化
    async init() {
        try {
            // 从存储中加载语言设置
            const savedLanguage =
                await window.electronAPI?.getStoreValue('language');
            if (savedLanguage && this.translations[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }

            // 设置HTML lang属性
            document.documentElement.lang = this.currentLanguage;

            console.log(
                `🌐 国际化管理器初始化完成，当前语言: ${this.currentLanguage}`
            );
        } catch (error) {
            console.error('❌ 国际化管理器初始化失败:', error);
        }
    }

    // 切换语言
    async setLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`⚠️ 不支持的语言: ${language}`);
            return false;
        }

        this.currentLanguage = language;

        try {
            // 保存语言设置
            await window.electronAPI?.setStoreValue('language', language);

            // 更新HTML lang属性
            document.documentElement.lang = language;

            // 通知所有监听器
            this.notifyListeners();

            console.log(`🌐 语言已切换为: ${language}`);
            return true;
        } catch (error) {
            console.error('❌ 语言切换失败:', error);
            return false;
        }
    }

    // 获取翻译文本
    t(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];

        // 遍历嵌套对象
        for (const k of keys) {
            if (translation && typeof translation === 'object') {
                translation = translation[k];
            } else {
                console.warn(`⚠️ 翻译键不存在: ${key}`);
                return key; // 返回原始键作为后备
            }
        }

        if (typeof translation !== 'string') {
            console.warn(`⚠️ 翻译值不是字符串: ${key}`);
            return key;
        }

        // 替换参数
        return this.replaceParams(translation, params);
    }

    // 替换参数占位符
    replaceParams(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // 获取支持的语言列表
    getSupportedLanguages() {
        return Object.keys(this.translations).map((lang) => ({
            code: lang,
            name: lang === 'zh-CN' ? '中文' : 'English',
            nativeName: lang === 'zh-CN' ? '中文' : 'English'
        }));
    }

    // 添加语言变化监听器
    addLanguageChangeListener(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // 通知所有监听器
    notifyListeners() {
        this.listeners.forEach((callback) => {
            try {
                callback(this.currentLanguage);
            } catch (error) {
                console.error('❌ 语言变化监听器执行失败:', error);
            }
        });
    }

    // 更新页面文本
    updatePageTexts() {
        // 定义文本映射规则
        const textMappings = {
            // 导航栏
            收起菜单: 'navigation.collapse',
            展开菜单: 'navigation.expand',
            用户: 'navigation.user',
            首页: 'navigation.home',
            任务: 'navigation.tasks',
            日历: 'navigation.calendar',
            文件: 'navigation.files',
            发布: 'navigation.publish',
            设置: 'navigation.settings',
            登出: 'navigation.logout',

            // 首页
            '欢迎使用 HXK Terminal': 'home.welcome',
            统一管理工作资料与任务的跨平台协作工具: 'home.subtitle',

            // 任务
            任务中心: 'tasks.title',
            '小科提醒你该工作了！！！': 'tasks.subtitle',
            发布任务: 'tasks.publishTask',
            待接取: 'tasks.available',
            我的任务: 'tasks.myTasks',

            // 日历
            日历: 'calendar.title',
            管理你的日程安排: 'calendar.subtitle',
            添加事件: 'calendar.addEvent',

            // 文件
            文件管理: 'files.title',
            '对，就是你，记得同步工作！！！': 'files.subtitle',

            // 发布
            内容发布: 'publish.title',
            '内容发布功能开发中...': 'publish.developing',

            // 设置
            设置: 'settings.title',
            用户设置: 'settings.userSettings',
            用户名: 'settings.username',
            请输入用户名: 'settings.usernamePlaceholder',
            主题: 'settings.theme',
            浅色主题: 'settings.lightTheme',
            深色主题: 'settings.darkTheme',
            跟随系统: 'settings.autoTheme',
            语言: 'settings.language',
            中文: 'settings.chinese',
            English: 'settings.english',
            简体中文: 'settings.chinese',
            数据管理: 'settings.dataManagement',
            默认下载路径: 'settings.defaultDownloadPath',
            点击选择下载路径: 'settings.selectPath',
            阿里云盘链接: 'settings.cloudDriveUrl',
            保存设置: 'settings.saveSettings',
            浏览: 'settings.browse',
            更换头像: 'settings.changeAvatar',
            移除头像: 'settings.removeAvatar',
            选择头像: 'settings.chooseAvatar',
            用户头像: 'settings.userAvatar',
            应用设置: 'settings.appSettings',
            桌面通知: 'settings.desktopNotifications',
            自动保存: 'settings.autoSave',
            显示已完成任务: 'settings.showCompletedTasks',
            关于: 'settings.about',
            版本: 'settings.version',
            开发者: 'settings.developer'
        };

        // 更新所有文本节点
        this.updateTextNodes(document.body, textMappings);

        // 更新所有placeholder
        this.updatePlaceholders(textMappings);

        // 更新所有title属性
        this.updateTitles(textMappings);

        // 更新所有alt属性
        this.updateAlts(textMappings);
    }

    // 更新文本节点
    updateTextNodes(element, mappings) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while ((node = walker.nextNode())) {
            const text = node.textContent.trim();
            if (mappings[text]) {
                const newText = this.t(mappings[text]);
                if (newText !== text) {
                    node.textContent = newText;
                }
            }
        }
    }

    // 更新placeholder属性
    updatePlaceholders(mappings) {
        document.querySelectorAll('[placeholder]').forEach((element) => {
            const placeholder = element.getAttribute('placeholder');
            if (mappings[placeholder]) {
                const newPlaceholder = this.t(mappings[placeholder]);
                if (newPlaceholder !== placeholder) {
                    element.setAttribute('placeholder', newPlaceholder);
                }
            }
        });
    }

    // 更新title属性
    updateTitles(mappings) {
        document.querySelectorAll('[title]').forEach((element) => {
            const title = element.getAttribute('title');
            if (mappings[title]) {
                const newTitle = this.t(mappings[title]);
                if (newTitle !== title) {
                    element.setAttribute('title', newTitle);
                }
            }
        });
    }

    // 更新alt属性
    updateAlts(mappings) {
        document.querySelectorAll('[alt]').forEach((element) => {
            const alt = element.getAttribute('alt');
            if (mappings[alt]) {
                const newAlt = this.t(mappings[alt]);
                if (newAlt !== alt) {
                    element.setAttribute('alt', newAlt);
                }
            }
        });
    }

    // 获取语言显示名称
    getLanguageDisplayName(languageCode) {
        const languages = this.getSupportedLanguages();
        const lang = languages.find((l) => l.code === languageCode);
        return lang ? lang.nativeName : languageCode;
    }
}

// 创建全局实例
const i18n = new I18nManager();

// 导出实例和类
export { i18n, I18nManager };
export default i18n;

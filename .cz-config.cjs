module.exports = {
    types: [
        { value: 'feat', name: 'feat:     新功能' },
        { value: 'fix', name: 'fix:      修复 Bug' },
        { value: 'style', name: 'style:    代码格式（不影响功能）' },
        { value: 'format', name: 'format:   格式化代码' },
        { value: 'docs', name: 'docs:     文档更新' },
        { value: 'perf', name: 'perf:     性能优化' },
        { value: 'init', name: 'init:     初始化' },
        { value: 'test', name: 'test:     测试相关' },
        { value: 'refactor', name: 'refactor: 重构（不改变功能）' },
        { value: 'patch', name: 'patch:    补丁' },
        { value: 'file', name: 'file:     文件操作' },
        { value: 'publish', name: 'publish:  发布' },
        { value: 'tag', name: 'tag:      标签' },
        { value: 'config', name: 'config:   配置修改' },
        { value: 'git', name: 'git:      Git 相关' }
    ],

    scopes: [
        // 前端模块
        { name: 'app', description: '应用核心模块' },
        { name: 'auth', description: '认证模块' },
        { name: 'task', description: '任务管理' },
        { name: 'calendar', description: '日历模块' },
        { name: 'files', description: '文件管理' },
        { name: 'api', description: 'API 客户端' },
        { name: 'nav', description: '导航模块' },
        { name: 'settings', description: '设置模块' },
        { name: 'titlebar', description: '标题栏' },
        { name: 'select', description: '自定义下拉框' },
        { name: 'styles', description: '样式文件' },
        { name: 'i18n', description: '国际化' },
        { name: 'renderer', description: '渲染进程通用' },
        { name: 'main', description: '主进程' },
        { name: 'preload', description: '预加载脚本' },

        // 后端模块
        { name: 'users', description: '用户相关接口' },
        { name: 'tasks', description: '任务相关接口' },
        { name: 'meetings', description: '会议相关接口' },
        { name: 'models', description: '数据模型' },
        { name: 'schemas', description: '数据模式' },
        { name: 'services', description: '业务逻辑服务' },
        { name: 'core', description: '核心配置' },
        { name: 'db', description: '数据库' },
        { name: 'deploy', description: '部署相关' },
        { name: 'docker', description: 'Docker 配置' },

        // 构建和其他
        { name: 'build', description: '构建配置' },
        { name: 'icon', description: '图标资源' },
        { name: 'installer', description: '安装器' },
        { name: 'docs', description: '文档' },
        { name: 'config', description: '配置文件' },
        { name: 'deps', description: '依赖更新' },

        // 通用
        { name: '*', description: '影响多个模块' }
    ],

    messages: {
        type: '选择提交类型:',
        scope: '选择影响范围（可选，按 Enter 跳过）:',
        customScope: '输入自定义范围:',
        subject: '输入简短描述（必填）:',
        body: '输入详细描述（可选，按 Enter 跳过）:',
        breaking: '列出重大变更（可选，按 Enter 跳过）:',
        footer: '关联 Issue（可选，例如 #123）:',
        confirmCommit: '确认提交?'
    },

    allowCustomScopes: true,
    allowBreakingChanges: ['feat', 'fix', 'refactor'],
    skipQuestions: [],
    subjectLimit: 100,
    breaklineChar: '|',

    // 自定义问题（可选）
    questions: {
        type: {
            description: '选择提交类型'
        },
        scope: {
            description: '选择影响范围'
        },
        subject: {
            description: '简短描述变更'
        },
        body: {
            description: '详细描述（可选）'
        },
        isBreaking: {
            description: '是否有重大变更？'
        },
        isIssueAffected: {
            description: '是否关联 Issue？'
        }
    }
};

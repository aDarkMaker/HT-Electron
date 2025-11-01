/**
 * API 客户端 - 统一管理后端接口调用
 */
class ApiClient {
    constructor() {
        // 从配置或环境变量获取后端地址
        this.baseURL = this.getBaseURL();
        this.token = null;
    }

    getBaseURL() {
        // 优先从本地存储读取配置
        const savedURL = localStorage.getItem('api_base_url');
        if (savedURL) {
            return savedURL;
        }
        // 生产环境使用服务器地址
        return 'http://118.195.243.30:8000';
    }

    async getToken() {
        if (!this.token) {
            this.token = await window.electronAPI?.getStoreValue('auth_token');
        }
        return this.token;
    }

    async request(method, endpoint, data = null, options = {}) {
        const token = await this.getToken();
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // 添加认证 token
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 添加请求体
        if (
            data &&
            (method === 'POST' || method === 'PUT' || method === 'PATCH')
        ) {
            if (config.headers['Content-Type'] === 'application/json') {
                config.body = JSON.stringify(data);
            } else {
                config.body = data;
            }
        }

        try {
            const response = await fetch(url, config);

            // 处理空响应
            const contentType = response.headers.get('content-type');
            let result;
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                result = text ? JSON.parse(text) : {};
            }

            // 处理错误
            if (!response.ok) {
                throw new Error(result.detail || result.message || '请求失败');
            }

            return result;
        } catch (error) {
            console.error(`API请求失败 [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // HTTP 方法封装
    async get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    async post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    // 认证相关
    async login(username, password) {
        // 登录接口使用表单数据
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await this.post('/api/v1/users/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.access_token) {
            this.token = response.access_token;
            await window.electronAPI?.setStoreValue(
                'auth_token',
                response.access_token
            );

            // 获取用户信息
            await this.fetchUserInfo();
        }

        return response;
    }

    async register(userData) {
        // 使用QQ号注册接口
        const formData = new URLSearchParams();
        formData.append('username', userData.username);
        formData.append('password', userData.password);
        formData.append('qq', userData.qq);

        const response = await this.post(
            '/api/v1/users/register-with-qq',
            formData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response;
    }

    async fetchUserInfo() {
        try {
            const userInfo = await this.get('/api/v1/users/me');
            await window.electronAPI?.setStoreValue('user_info', userInfo);
            return userInfo;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }

    async updateUser(userData) {
        return this.put('/api/v1/users/me', userData);
    }

    async logout() {
        this.token = null;
        await window.electronAPI?.deleteStoreValue('auth_token');
        await window.electronAPI?.deleteStoreValue('user_info');
    }

    // 任务相关
    async getTasks(skip = 0, limit = 100, taskType = null) {
        let endpoint = `/api/v1/tasks/?skip=${skip}&limit=${limit}`;
        if (taskType) {
            endpoint += `&task_type=${taskType}`;
        }
        return this.get(endpoint);
    }

    async getAvailableTasks(skip = 0, limit = 100) {
        return this.get(`/api/v1/tasks/available?skip=${skip}&limit=${limit}`);
    }

    async getMyTasks(skip = 0, limit = 100) {
        return this.get(`/api/v1/tasks/my-tasks?skip=${skip}&limit=${limit}`);
    }

    async getAcceptedTasks(skip = 0, limit = 100) {
        return this.get(`/api/v1/tasks/accepted?skip=${skip}&limit=${limit}`);
    }

    async getTask(taskId) {
        return this.get(`/api/v1/tasks/${taskId}`);
    }

    async createTask(taskData) {
        // 转换前端数据格式到后端格式
        const apiData = {
            title: taskData.title,
            description: taskData.description,
            type: taskData.type, // 'personal' 或 'team'
            priority: parseInt(taskData.priority) || 1,
            deadline: taskData.deadline || null,
            tags: taskData.tags
                ? Array.isArray(taskData.tags)
                    ? taskData.tags
                    : taskData.tags.split(',').map((t) => t.trim())
                : null,
            max_accept_count: taskData.maxAcceptCount || 1
        };
        return this.post('/api/v1/tasks/', apiData);
    }

    async updateTask(taskId, taskData) {
        return this.put(`/api/v1/tasks/${taskId}`, taskData);
    }

    async deleteTask(taskId) {
        return this.delete(`/api/v1/tasks/${taskId}`);
    }

    async acceptTask(taskId) {
        return this.post(`/api/v1/tasks/${taskId}/accept`);
    }

    async completeTask(taskId) {
        return this.post(`/api/v1/tasks/${taskId}/complete`);
    }

    async abandonTask(taskId) {
        return this.post(`/api/v1/tasks/${taskId}/abandon`);
    }

    async searchTasks(query, skip = 0, limit = 100) {
        return this.get(
            `/api/v1/tasks/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`
        );
    }

    // 会议相关
    async getMeetings(
        skip = 0,
        limit = 100,
        startDate = null,
        endDate = null,
        meetingType = null
    ) {
        let endpoint = `/api/v1/meetings/?skip=${skip}&limit=${limit}`;
        if (startDate) {
            endpoint += `&start_date=${encodeURIComponent(startDate.toISOString())}`;
        }
        if (endDate) {
            endpoint += `&end_date=${encodeURIComponent(endDate.toISOString())}`;
        }
        if (meetingType) {
            endpoint += `&meeting_type=${meetingType}`;
        }
        return this.get(endpoint);
    }

    async getMyMeetings(
        skip = 0,
        limit = 100,
        startDate = null,
        endDate = null
    ) {
        let endpoint = `/api/v1/meetings/my-meetings?skip=${skip}&limit=${limit}`;
        if (startDate) {
            endpoint += `&start_date=${encodeURIComponent(startDate.toISOString())}`;
        }
        if (endDate) {
            endpoint += `&end_date=${encodeURIComponent(endDate.toISOString())}`;
        }
        return this.get(endpoint);
    }

    async getMeeting(meetingId) {
        return this.get(`/api/v1/meetings/${meetingId}`);
    }

    async createMeeting(meetingData) {
        const apiData = {
            title: meetingData.title,
            description: meetingData.description || null,
            type: meetingData.type || 'meeting',
            meeting_date: meetingData.date || meetingData.meeting_date,
            duration: parseInt(meetingData.duration) || 60,
            is_recurring: meetingData.isRecurring || false,
            recurring_pattern: meetingData.recurringPattern || null
        };
        return this.post('/api/v1/meetings/', apiData);
    }

    async updateMeeting(meetingId, meetingData) {
        return this.put(`/api/v1/meetings/${meetingId}`, meetingData);
    }

    async deleteMeeting(meetingId) {
        return this.delete(`/api/v1/meetings/${meetingId}`);
    }

    async updateAttendance(meetingId, status, notes = null) {
        const apiData = {
            status: status, // 'pending', 'confirmed', 'absent'
            notes: notes || null
        };
        return this.post(`/api/v1/meetings/${meetingId}/attendance`, apiData);
    }

    async getMeetingAttendances(meetingId) {
        return this.get(`/api/v1/meetings/${meetingId}/attendance`);
    }

    async getMyAttendances(skip = 0, limit = 100) {
        return this.get(
            `/api/v1/meetings/user/attendances?skip=${skip}&limit=${limit}`
        );
    }
}

// 创建全局 API 客户端实例
export const apiClient = new ApiClient();

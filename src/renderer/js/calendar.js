// 导入自定义下拉框
import { initCustomSelects } from './custom-select.js';
import { apiClient } from './api.js';

// 日历管理器
class CalendarManager {
    constructor(app) {
        this.app = app;
        // 设置默认日期为2025年10月23日（最近一次例会日期）
        this.currentDate = new Date(2025, 9, 23); // 月份从0开始，所以9代表10月
        this.selectedDate = null;

        this.init();
    }

    async init() {
        this.bindEvents();
        this.bindModalEvents();
        // 从后端加载会议
        await this.loadMeetings();
    }

    bindEvents() {
        // 监听任务状态变化，更新日历
        document.addEventListener('task-completed', () => {
            this.renderCalendar();
        });

        document.addEventListener('task-accepted', () => {
            this.renderCalendar();
        });
    }

    bindModalEvents() {
        // 添加事件按钮
        const addEventBtn = document.getElementById('add-event-btn');
        const addEventModal = document.getElementById('add-event-modal');
        const closeEventModal = document.getElementById('close-event-modal');
        const cancelAddEvent = document.getElementById('cancel-add-event');
        const addEventForm = document.getElementById('add-event-form');

        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => {
                this.showAddEventModal();
            });
        }

        if (closeEventModal) {
            closeEventModal.addEventListener('click', () => {
                this.hideAddEventModal();
            });
        }

        if (cancelAddEvent) {
            cancelAddEvent.addEventListener('click', () => {
                this.hideAddEventModal();
            });
        }

        if (addEventForm) {
            addEventForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleAddEvent();
            });
        }

        // 点击模态框外部关闭
        if (addEventModal) {
            addEventModal.addEventListener('click', (event) => {
                if (event.target === addEventModal) {
                    this.hideAddEventModal();
                }
            });
        }
    }

    renderCalendar() {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        container.innerHTML = this.createCalendarHTML();
        this.bindCalendarEvents();
    }

    createCalendarHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const currentDate = new Date(startDate);

        // 生成6周的日期
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                days.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        return `
            <div class="calendar">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" id="prev-month">
                        <img src="Assets/Icons/chevron-left.svg" width="20" height="20" alt="上一月" />
                    </button>
                    <h2 class="calendar-title">${year}年${month + 1}月</h2>
                    <button class="calendar-nav-btn" id="next-month">
                        <img src="Assets/Icons/chevron-right.svg" width="20" height="20" alt="下一月" />
                    </button>
                </div>
                
                <div class="calendar-grid">
                    ${this.createDayHeaders()}
                    ${days.map((day) => this.createDayCell(day, month)).join('')}
                </div>
            </div>
        `;
    }

    createDayHeaders() {
        const headers = ['日', '一', '二', '三', '四', '五', '六'];
        return headers
            .map((header) => `<div class="calendar-day-header">${header}</div>`)
            .join('');
    }

    createDayCell(date, currentMonth) {
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = this.isToday(date);
        const isSelected =
            this.selectedDate && this.isSameDate(date, this.selectedDate);

        const events = this.getEventsForDate(date);

        let classes = ['calendar-day'];
        if (!isCurrentMonth) classes.push('other-month');
        if (isToday) classes.push('today');
        if (isSelected) classes.push('selected');

        return `
            <div class="${classes.join(' ')}" data-date="${this.formatDateKey(date)}">
                <div class="calendar-day-number">${date.getDate()}</div>
                <div class="calendar-events">
                    ${events.map((event) => this.createEventElement(event)).join('')}
                </div>
            </div>
        `;
    }

    createEventElement(event) {
        // 为例会添加状态类
        let statusClass = '';
        if (event.type === 'meeting' && event.attendance) {
            statusClass = `meeting-${event.attendance}`;
        }

        // 为任务添加颜色类
        let colorClass = '';
        if (event.type === 'task') {
            colorClass = this.getTaskColorClass(event);
        }

        return `
            <div class="calendar-event ${event.type} ${statusClass} ${colorClass}" 
                data-event-id="${event.id}"
                title="${this.escapeHtml(event.title)}">
                ${this.escapeHtml(event.title)}
            </div>
        `;
    }

    bindCalendarEvents() {
        // 月份导航
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }

        // 日期点击
        document.querySelectorAll('.calendar-day').forEach((day) => {
            day.addEventListener('click', (event) => {
                const dateKey = event.currentTarget.dataset.date;
                this.selectDate(dateKey);
            });
        });

        // 事件点击
        document.querySelectorAll('.calendar-event').forEach((eventElement) => {
            eventElement.addEventListener('click', (clickEvent) => {
                clickEvent.stopPropagation();
                const eventId = eventElement.dataset.eventId;
                // 所有事件都显示详情模态框
                this.showEventDetails(eventId);
            });
        });
    }

    selectDate(dateKey) {
        this.selectedDate = this.parseDateKey(dateKey);
        this.renderCalendar();

        // 可以在这里添加选择日期后的逻辑
        console.log('选择日期:', this.selectedDate);
    }

    async toggleMeetingAttendance(eventId) {
        const event = this.app.calendarEvents.find((e) => e.id === eventId);
        if (!event || event.type !== 'meeting') return;

        // 切换出席状态：pending -> confirmed -> absent -> pending
        const statusCycle = ['pending', 'confirmed', 'absent'];
        const currentIndex = statusCycle.indexOf(event.attendance);
        const nextIndex = (currentIndex + 1) % statusCycle.length;
        event.attendance = statusCycle[nextIndex];

        // 保存数据
        await this.app.saveData();

        // 重新渲染日历
        this.renderCalendar();

        // 显示状态变化提示
        const statusText = {
            pending: '未明确',
            confirmed: '确认前往',
            absent: '请假'
        };
        this.app.showNotification(
            `例会状态已更新为：${statusText[event.attendance]}`,
            'info'
        );
    }

    getEventsForDate(date) {
        const events = [];

        // 从任务中获取事件
        this.app.tasks.forEach((task) => {
            if (
                task.deadline &&
                this.isSameDate(new Date(task.deadline), date)
            ) {
                events.push({
                    id: task.id,
                    title: task.title,
                    type: 'deadline',
                    description: task.description,
                    date: task.deadline
                });
            }
        });

        // 从我的任务中获取事件
        this.app.myTasks.forEach((task) => {
            if (
                task.deadline &&
                this.isSameDate(new Date(task.deadline), date)
            ) {
                events.push({
                    id: task.id,
                    title: task.title,
                    type: 'task',
                    description: task.description,
                    date: task.deadline
                });
            }
        });

        // 从日历事件中获取（现在从后端加载）
        this.app.calendarEvents.forEach((event) => {
            const eventDate = event.meeting_date || event.date;
            if (eventDate && this.isSameDate(new Date(eventDate), date)) {
                events.push(event);
            }
        });

        return events.slice(0, 3); // 最多显示3个事件
    }

    // 从后端加载会议/事件
    async loadMeetings() {
        try {
            const startDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth(),
                1
            );
            const endDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth() + 1,
                0
            );

            const meetings = await apiClient.getMyMeetings(
                0,
                100,
                startDate,
                endDate
            );

            // 转换数据格式
            this.app.calendarEvents = meetings.map((meeting) => ({
                id: meeting.id.toString(),
                title: meeting.title,
                type: meeting.type || 'meeting',
                date: meeting.meeting_date,
                meeting_date: meeting.meeting_date,
                description: meeting.description || '',
                duration: meeting.duration || 60,
                is_recurring: meeting.is_recurring || false,
                meetingId: meeting.id
            }));

            // 重新渲染日历
            this.renderCalendar();
        } catch (error) {
            console.error('❌ 加载会议失败:', error);
        }
    }

    showEventDetails(eventId) {
        console.log('showEventDetails called with eventId:', eventId);

        // 查找事件
        let event = this.app.calendarEvents.find((e) => e.id === eventId);
        console.log('Found event in calendarEvents:', event);

        if (!event) {
            // 从任务中查找
            const task = [...this.app.tasks, ...this.app.myTasks].find(
                (t) => t.id === eventId
            );
            console.log('Found task:', task);
            if (task) {
                event = {
                    id: task.id,
                    title: task.title,
                    type: task.deadline ? 'deadline' : 'task',
                    description: task.description,
                    date: task.deadline || task.createdAt
                };
            }
        }

        if (!event) {
            console.log('No event found, returning');
            return;
        }

        console.log('Displaying modal for event:', event);
        // 显示事件详情模态框
        this.createEventModal(event);
    }

    showEditEventModal(event) {
        // 隐藏详情模态框
        const modal = document.getElementById('event-detail-modal');
        if (modal) {
            modal.remove();
        }

        // 创建编辑模态框
        const editModal = document.createElement('div');
        editModal.id = 'edit-event-modal';
        editModal.className = 'modal active';

        const currentDate = event.date
            ? new Date(event.date).toISOString().split('T')[0]
            : '';
        const currentTime = event.date
            ? new Date(event.date).toTimeString().slice(0, 5)
            : '';

        editModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑事件</h3>
                    <button class="close-btn" id="close-edit-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-event-form">
                        <div class="form-group">
                            <label for="edit-event-title">标题：</label>
                            <input type="text" id="edit-event-title" value="${event.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-event-date">日期：</label>
                            <input type="date" id="edit-event-date" value="${currentDate}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-event-time">时间：</label>
                            <input type="time" id="edit-event-time" value="${currentTime}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-event-description">描述：</label>
                            <textarea id="edit-event-description" rows="3">${event.description || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-edit">取消</button>
                    <button type="button" class="btn btn-primary" id="save-edit">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(editModal);
        document.body.style.overflow = 'hidden';

        // 绑定事件
        this.bindEditModalEvents(event);
    }

    bindEditModalEvents(event) {
        const modal = document.getElementById('edit-event-modal');
        const closeBtn = document.getElementById('close-edit-modal');
        const cancelBtn = document.getElementById('cancel-edit');
        const saveBtn = document.getElementById('save-edit');

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;

        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        saveBtn.onclick = () => {
            this.saveEditedEvent(event);
        };
    }

    async saveEditedEvent(originalEvent) {
        const title = document.getElementById('edit-event-title').value;
        const date = document.getElementById('edit-event-date').value;
        const time = document.getElementById('edit-event-time').value;
        const description = document.getElementById(
            'edit-event-description'
        ).value;

        if (!title || !date || !time) {
            this.app.showNotification('请填写所有必填字段', 'error');
            return;
        }

        try {
            // 创建新的日期时间
            const newDateTime = new Date(`${date}T${time}`);

            // 更新事件
            const eventIndex = this.app.calendarEvents.findIndex(
                (e) => e.id === originalEvent.id
            );
            if (eventIndex !== -1) {
                this.app.calendarEvents[eventIndex].title = title;
                this.app.calendarEvents[eventIndex].date = newDateTime;
                this.app.calendarEvents[eventIndex].description = description;
            }

            // 保存数据
            await this.app.saveData();

            // 重新渲染日历
            this.renderCalendar();

            // 关闭编辑模态框
            const editModal = document.getElementById('edit-event-modal');
            if (editModal) {
                editModal.remove();
                document.body.style.overflow = '';
            }

            this.app.showNotification('事件已更新', 'success');
        } catch (error) {
            console.error('更新事件失败:', error);
            this.app.showNotification('更新事件失败，请重试', 'error');
        }
    }

    createEventModal(event) {
        // 移除已存在的模态框
        const existingModal = document.getElementById('event-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'event-detail-modal';
        modal.className = 'event-modal active';

        // 生成操作按钮
        const actionButtons = this.createEventActionButtons(event);

        // 获取状态显示信息
        const statusInfo = this.getEventStatusInfo(event);

        modal.innerHTML = `
            <div class="event-modal-content">
                <div class="event-modal-header">
                    <div class="event-header-info">
                        <h3 class="event-modal-title">${this.escapeHtml(event.title)}</h3>
                        <div class="event-type-badge ${event.type}">${this.getEventTypeText(event.type)}</div>
                    </div>
                    <button class="close-btn" id="close-event-modal">&times;</button>
                </div>
                <div class="event-modal-body">
                    <div class="event-details">
                        <div class="event-detail-item">
                            <div class="detail-icon-wrapper">
                                <img class="event-detail-icon" src="${this.getEventTypeIcon(event.type)}" width="20" height="20" alt="类型" />
                            </div>
                            <div class="event-detail-content">
                                <div class="event-detail-label">事件类型</div>
                                <div class="event-detail-value">${this.getEventTypeText(event.type)}</div>
                            </div>
                        </div>
                        <div class="event-detail-item">
                            <div class="detail-icon-wrapper">
                                <img class="event-detail-icon" src="Assets/Icons/calendar.svg" width="20" height="20" alt="日期" />
                            </div>
                            <div class="event-detail-content">
                                <div class="event-detail-label">日期</div>
                                <div class="event-detail-value">${this.formatDate(event.date)}</div>
                            </div>
                        </div>
                        <div class="event-detail-item">
                            <div class="detail-icon-wrapper">
                                <img class="event-detail-icon" src="Assets/Icons/hourglass.svg" width="20" height="20" alt="时间" />
                            </div>
                            <div class="event-detail-content">
                                <div class="event-detail-label">时间</div>
                                <div class="event-detail-value">${this.formatTime(event.date)}</div>
                            </div>
                        </div>
                        ${
                            event.description
                                ? `
                            <div class="event-detail-item">
                                <div class="detail-icon-wrapper">
                                    <img class="event-detail-icon" src="Assets/Icons/tag.svg" width="20" height="20" alt="描述" />
                                </div>
                                <div class="event-detail-content">
                                    <div class="event-detail-label">描述</div>
                                    <div class="event-detail-value">${this.escapeHtml(event.description)}</div>
                                </div>
                            </div>
                        `
                                : ''
                        }
                        ${
                            statusInfo
                                ? `
                            <div class="event-detail-item status-item">
                                <div class="detail-icon-wrapper">
                                    <img class="event-detail-icon" src="${statusInfo.icon}" width="20" height="20" alt="状态" />
                                </div>
                                <div class="event-detail-content">
                                    <div class="event-detail-label">状态</div>
                                    <div class="event-detail-value status-value ${statusInfo.class}">${statusInfo.text}</div>
                                </div>
                            </div>
                        `
                                : ''
                        }
                    </div>
                    <div class="event-actions">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // 绑定操作按钮事件
        this.bindEventActionButtons(event);

        // 绑定关闭事件 - 使用事件委托确保事件正确绑定
        modal.addEventListener('click', (e) => {
            // 点击关闭按钮
            if (e.target && e.target.id === 'close-event-modal') {
                this.closeEventModal(modal);
                return;
            }

            // 点击外部关闭
            if (e.target === modal) {
                this.closeEventModal(modal);
                return;
            }
        });
    }

    closeEventModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
            }, 200);
        }
    }

    getEventStatusInfo(event) {
        if (event.type === 'meeting' && event.attendance) {
            const statusMap = {
                pending: {
                    text: '待确认',
                    class: 'status-pending',
                    icon: 'Assets/Icons/hourglass.svg'
                },
                confirmed: {
                    text: '已确认参加',
                    class: 'status-confirmed',
                    icon: 'Assets/Icons/check.svg'
                },
                absent: {
                    text: '已请假',
                    class: 'status-absent',
                    icon: 'Assets/Icons/delete.svg'
                }
            };
            return statusMap[event.attendance] || null;
        }
        return null;
    }

    getEventTypeText(type) {
        const typeMap = {
            meeting: '会议',
            deadline: '截止日期',
            task: '任务',
            event: '事件'
        };
        return typeMap[type] || '事件';
    }

    getEventTypeIcon(type) {
        const iconMap = {
            meeting: 'Assets/Icons/team.svg',
            deadline: 'Assets/Icons/flag.svg',
            task: 'Assets/Icons/task.svg',
            event: 'Assets/Icons/calendar.svg'
        };
        return iconMap[type] || 'Assets/Icons/calendar.svg';
    }

    getTaskColorClass(event) {
        // 获取同一天的所有任务
        const eventDate = new Date(event.date);
        const sameDayTasks = this.app.calendarEvents.filter(
            (e) =>
                e.type === 'task' &&
                e.id !== event.id &&
                this.isSameDate(new Date(e.date), eventDate)
        );

        // 定义颜色类
        const colorClasses = [
            'task-color-1',
            'task-color-2',
            'task-color-3',
            'task-color-4',
            'task-color-5'
        ];

        // 获取已使用的颜色
        const usedColors = sameDayTasks
            .map((task) => {
                const taskElement = document.querySelector(
                    `[data-event-id="${task.id}"]`
                );
                if (taskElement) {
                    for (const colorClass of colorClasses) {
                        if (taskElement.classList.contains(colorClass)) {
                            return colorClass;
                        }
                    }
                }
                return null;
            })
            .filter(Boolean);

        // 返回第一个未使用的颜色
        for (const colorClass of colorClasses) {
            if (!usedColors.includes(colorClass)) {
                return colorClass;
            }
        }

        // 如果所有颜色都用完了，返回第一个
        return colorClasses[0];
    }

    getAttendanceStatusText(attendance) {
        const statusMap = {
            pending: '待确认',
            confirmed: '已确认',
            absent: '请假'
        };
        return statusMap[attendance] || '待确认';
    }

    createEventActionButtons(event) {
        if (event.type === 'meeting' || event.isRecurring) {
            // 例会操作按钮
            if (event.attendance === 'pending') {
                return `
                    <button class="btn btn-primary" id="confirm-meeting">
                        <img src="Assets/Icons/check.svg" width="16" height="16" alt="确认" />
                        确认参加
                    </button>
                    <button class="btn btn-secondary" id="request-leave">
                        <img src="Assets/Icons/delete.svg" width="16" height="16" alt="请假" />
                        请假
                    </button>
                `;
            } else {
                return `
                    <button class="btn btn-secondary" id="change-attendance">
                        <img src="Assets/Icons/refresh.svg" width="16" height="16" alt="修改" />
                        修改状态
                    </button>
                `;
            }
        } else {
            // 其他事件操作按钮（任务、截止日期等）
            return `
                <button class="btn btn-secondary" id="edit-event">
                    <img src="Assets/Icons/setting.svg" width="16" height="16" alt="编辑" />
                    修改日期
                </button>
                <button class="btn btn-danger" id="delete-event">
                    <img src="Assets/Icons/delete.svg" width="16" height="16" alt="删除" />
                    删除
                </button>
            `;
        }
    }

    bindEventActionButtons(event) {
        // 例会操作
        const confirmBtn = document.getElementById('confirm-meeting');
        const leaveBtn = document.getElementById('request-leave');
        const changeBtn = document.getElementById('change-attendance');

        // 其他事件操作
        const editBtn = document.getElementById('edit-event');
        const deleteBtn = document.getElementById('delete-event');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.updateMeetingAttendance(event.id, 'confirmed');
                const modal = document.getElementById('event-detail-modal');
                this.closeEventModal(modal);
            };
        }

        if (leaveBtn) {
            leaveBtn.onclick = () => {
                this.updateMeetingAttendance(event.id, 'absent');
                const modal = document.getElementById('event-detail-modal');
                this.closeEventModal(modal);
            };
        }

        if (changeBtn) {
            changeBtn.onclick = () => {
                this.showAttendanceChangeModal(event);
            };
        }

        if (editBtn) {
            editBtn.onclick = () => {
                this.showEditEventModal(event);
            };
        }

        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (confirm('确定要删除这个事件吗？')) {
                    this.deleteEvent(event.id);
                    const modal = document.getElementById('event-detail-modal');
                    this.closeEventModal(modal);
                }
            };
        }
    }

    async deleteEvent(eventId) {
        try {
            // 从日历事件中删除
            const eventIndex = this.app.calendarEvents.findIndex(
                (e) => e.id === eventId
            );
            if (eventIndex !== -1) {
                this.app.calendarEvents.splice(eventIndex, 1);
            }

            // 保存数据
            await this.app.saveData();

            // 重新渲染日历
            this.renderCalendar();

            // 显示成功消息
            this.app.showNotification('事件已删除', 'success');
        } catch (error) {
            console.error('删除事件失败:', error);
            this.app.showNotification('删除事件失败，请重试', 'error');
        }
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    formatTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    isToday(date) {
        const today = new Date();
        return this.isSameDate(date, today);
    }

    isSameDate(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }

    formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    parseDateKey(dateKey) {
        const [year, month, day] = dateKey.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 添加新事件
    addEvent(eventData) {
        const event = {
            id: this.generateEventId(),
            title: eventData.title,
            type: eventData.type || 'event',
            date: eventData.date,
            description: eventData.description || '',
            duration: eventData.duration || 60
        };

        this.app.calendarEvents.push(event);
        this.app.saveData();
        this.renderCalendar();

        return event;
    }

    // 删除事件
    removeEvent(eventId) {
        const index = this.app.calendarEvents.findIndex(
            (e) => e.id === eventId
        );
        if (index !== -1) {
            this.app.calendarEvents.splice(index, 1);
            this.app.saveData();
            this.renderCalendar();
        }
    }

    generateEventId() {
        return (
            'event_' +
            Date.now() +
            '_' +
            Math.random().toString(36).substr(2, 9)
        );
    }

    showAddEventModal() {
        const modal = document.getElementById('add-event-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // 设置默认日期为今天
            const today = new Date();
            const dateInput = document.getElementById('event-date');
            if (dateInput) {
                dateInput.value = today.toISOString().split('T')[0];
            }

            // 初始化模态框中的自定义下拉框
            setTimeout(() => initCustomSelects(), 0);
        }
    }

    hideAddEventModal() {
        const modal = document.getElementById('add-event-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.resetAddEventForm();
        }
    }

    resetAddEventForm() {
        const form = document.getElementById('add-event-form');
        if (form) {
            form.reset();
        }
    }

    async handleAddEvent() {
        const form = document.getElementById('add-event-form');
        if (!form) return;

        const eventData = {
            title: document.getElementById('event-title').value.trim(),
            description: document
                .getElementById('event-description')
                .value.trim(),
            type: document.getElementById('event-type').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            duration:
                parseInt(document.getElementById('event-duration').value) || 60
        };

        // 验证表单
        if (!eventData.title || !eventData.date || !eventData.time) {
            this.app.showNotification('请填写必要信息', 'error');
            return;
        }

        try {
            // 创建日期时间
            const meetingDate = new Date(`${eventData.date}T${eventData.time}`);

            // 调用后端API创建会议
            const meetingData = {
                title: eventData.title,
                description: eventData.description || null,
                type: eventData.type,
                date: meetingDate.toISOString(),
                duration: eventData.duration,
                isRecurring: false
            };

            const newMeeting = await apiClient.createMeeting(meetingData);

            // 重新加载会议
            await this.loadMeetings();

            // 关闭模态框
            this.hideAddEventModal();

            // 显示成功消息
            this.app.showNotification('事件添加成功！', 'success');
        } catch (error) {
            console.error('添加事件失败:', error);
            const errorMsg = error.message || '添加事件失败，请重试';
            this.app.showNotification(errorMsg, 'error');
        }
    }

    async updateMeetingAttendance(eventId, attendance) {
        try {
            const event = this.app.calendarEvents.find((e) => e.id === eventId);
            if (!event) {
                this.app.showNotification('事件不存在', 'error');
                return;
            }

            // 映射前端状态到后端状态
            const statusMap = {
                pending: 'pending',
                确认: 'confirmed',
                confirmed: 'confirmed',
                请假: 'absent',
                absent: 'absent'
            };

            const backendStatus = statusMap[attendance] || 'pending';

            // 调用后端API更新出席状态
            const meetingId = event.meetingId || parseInt(eventId);
            await apiClient.updateAttendance(meetingId, backendStatus);

            // 重新加载会议数据
            await this.loadMeetings();

            // 更新模态框中的状态显示
            this.updateModalStatusDisplay(eventId, attendance);

            const statusText = this.getAttendanceStatusText(attendance);
            this.app.showNotification(
                `出勤状态已更新为：${statusText}`,
                'success'
            );
        } catch (error) {
            console.error('更新出勤状态失败:', error);
            const errorMsg = error.message || '更新出勤状态失败，请重试';
            this.app.showNotification(errorMsg, 'error');
        }
    }

    showAttendanceChangeModal(event) {
        // 创建状态选择模态框
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content attendance-modal">
                <div class="modal-header">
                    <h3>修改出勤状态</h3>
                    <button class="close-btn" id="close-attendance-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="attendance-info">
                        <h4>${this.escapeHtml(event.title)}</h4>
                        <p>请选择新的出勤状态：</p>
                    </div>
                    <div class="attendance-options">
                        <button class="btn btn-primary attendance-option" id="confirm-attendance">
                            <img src="Assets/Icons/check.svg" width="16" height="16" alt="确认" />
                            确认参加
                        </button>
                        <button class="btn btn-secondary attendance-option" id="absent-attendance">
                            <img src="Assets/Icons/delete.svg" width="16" height="16" alt="请假" />
                            请假
                        </button>
                        <button class="btn btn-outline attendance-option" id="pending-attendance">
                            <img src="Assets/Icons/hourglass.svg" width="16" height="16" alt="待确认" />
                            待确认
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // 绑定事件 - 使用事件委托确保事件正确绑定
        modal.addEventListener('click', (e) => {
            // 点击关闭按钮
            if (e.target && e.target.id === 'close-attendance-modal') {
                this.closeAttendanceModal(modal);
                return;
            }

            // 点击确认参加按钮
            if (e.target && e.target.id === 'confirm-attendance') {
                this.updateMeetingAttendance(event.id, 'confirmed');
                this.closeAttendanceModal(modal);
                return;
            }

            // 点击请假按钮
            if (e.target && e.target.id === 'absent-attendance') {
                this.updateMeetingAttendance(event.id, 'absent');
                this.closeAttendanceModal(modal);
                return;
            }

            // 点击待确认按钮
            if (e.target && e.target.id === 'pending-attendance') {
                this.updateMeetingAttendance(event.id, 'pending');
                this.closeAttendanceModal(modal);
                return;
            }

            // 点击外部关闭
            if (e.target === modal) {
                this.closeAttendanceModal(modal);
                return;
            }
        });
    }

    closeAttendanceModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
            }, 200);
        }
    }

    updateModalStatusDisplay(eventId, attendance) {
        // 更新事件详情模态框中的状态显示
        const modal = document.getElementById('event-detail-modal');
        if (modal) {
            const statusItem = modal.querySelector('.status-item');
            if (statusItem) {
                const statusInfo = this.getEventStatusInfo({
                    type: 'meeting',
                    attendance
                });
                if (statusInfo) {
                    const statusValue =
                        statusItem.querySelector('.status-value');
                    const statusIcon =
                        statusItem.querySelector('.event-detail-icon');

                    if (statusValue) {
                        statusValue.textContent = statusInfo.text;
                        statusValue.className = `event-detail-value status-value ${statusInfo.class}`;
                    }

                    if (statusIcon) {
                        statusIcon.src = statusInfo.icon;
                    }
                }
            }

            // 更新操作按钮
            const actionsContainer = modal.querySelector('.event-actions');
            if (actionsContainer) {
                const event = this.app.calendarEvents.find(
                    (e) => e.id === eventId
                );
                if (event) {
                    actionsContainer.innerHTML =
                        this.createEventActionButtons(event);
                    // 重新绑定按钮事件
                    this.bindEventActionButtons(event);
                }
            }
        }
    }

    // 删除重复的deleteEvent方法

    editEvent(event) {
        // 关闭详情模态框
        const detailModal = document.getElementById('event-detail-modal');
        if (detailModal) {
            detailModal.remove();
        }

        // 打开编辑模态框（复用添加事件的模态框）
        this.showAddEventModal();

        // 填充表单数据
        const date = new Date(event.date);
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-description').value =
            event.description || '';
        document.getElementById('event-type').value = event.type;
        document.getElementById('event-date').value = date
            .toISOString()
            .split('T')[0];
        document.getElementById('event-time').value = date
            .toTimeString()
            .slice(0, 5);
        document.getElementById('event-duration').value = event.duration || 60;

        // 修改表单提交行为
        const form = document.getElementById('add-event-form');
        const originalSubmit = form.onsubmit;
        form.onsubmit = (e) => {
            e.preventDefault();
            this.handleEditEvent(event.id);
        };
    }

    async handleEditEvent(eventId) {
        const form = document.getElementById('add-event-form');
        if (!form) return;

        const eventData = {
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            type: document.getElementById('event-type').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            duration: parseInt(document.getElementById('event-duration').value)
        };

        // 验证表单
        if (!eventData.title || !eventData.date || !eventData.time) {
            this.app.showNotification('请填写必要信息', 'error');
            return;
        }

        try {
            const event = this.app.calendarEvents.find((e) => e.id === eventId);
            if (event) {
                event.title = eventData.title;
                event.description = eventData.description || '';
                event.type = eventData.type;
                event.date = new Date(`${eventData.date}T${eventData.time}`);
                event.duration = eventData.duration;

                await this.app.saveData();
                this.renderCalendar();
                this.hideAddEventModal();
                this.app.showNotification('事件已更新！', 'success');
            }
        } catch (error) {
            console.error('更新事件失败:', error);
            this.app.showNotification('更新事件失败，请重试', 'error');
        }
    }
}

// 导出类供其他模块使用
export { CalendarManager };

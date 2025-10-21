// 日历管理器
class CalendarManager {
    constructor(app) {
        this.app = app;
        this.currentDate = new Date();
        this.selectedDate = null;

        this.init();
    }

    init() {
        this.bindEvents();
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <h2 class="calendar-title">${year}年${month + 1}月</h2>
                    <button class="calendar-nav-btn" id="next-month">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
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
        return `
            <div class="calendar-event ${event.type}" 
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
        document.querySelectorAll('.calendar-event').forEach((event) => {
            event.addEventListener('click', (event) => {
                event.stopPropagation();
                const eventId = event.currentTarget.dataset.eventId;
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

        // 从日历事件中获取
        this.app.calendarEvents.forEach((event) => {
            if (this.isSameDate(new Date(event.date), date)) {
                events.push(event);
            }
        });

        return events.slice(0, 3); // 最多显示3个事件
    }

    showEventDetails(eventId) {
        // 查找事件
        let event = this.app.calendarEvents.find((e) => e.id === eventId);

        if (!event) {
            // 从任务中查找
            const task = [...this.app.tasks, ...this.app.myTasks].find(
                (t) => t.id === eventId
            );
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

        if (!event) return;

        // 创建事件详情模态框
        this.createEventModal(event);
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

        modal.innerHTML = `
            <div class="event-modal-content">
                <div class="event-modal-header">
                    <h3 class="event-modal-title">${this.escapeHtml(event.title)}</h3>
                    <button class="close-btn" id="close-event-modal">&times;</button>
                </div>
                <div class="event-modal-body">
                    <div class="event-details">
                        <div class="event-detail-item">
                            <svg class="event-detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <div class="event-detail-content">
                                <div class="event-detail-label">类型</div>
                                <div class="event-detail-value">${this.getEventTypeText(event.type)}</div>
                            </div>
                        </div>
                        <div class="event-detail-item">
                            <svg class="event-detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
                            </svg>
                            <div class="event-detail-content">
                                <div class="event-detail-label">时间</div>
                                <div class="event-detail-value">${this.formatDateTime(event.date)}</div>
                            </div>
                        </div>
                        ${
                            event.description
                                ? `
                            <div class="event-detail-item">
                                <svg class="event-detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                <div class="event-detail-content">
                                    <div class="event-detail-label">描述</div>
                                    <div class="event-detail-value">${this.escapeHtml(event.description)}</div>
                                </div>
                            </div>
                        `
                                : ''
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        const closeBtn = document.getElementById('close-event-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        // 点击外部关闭
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
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
}

// 自定义下拉选择框组件
class CustomSelect {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.selectedValue = options.defaultValue || '';
        this.onChange = options.onChange || (() => {});
        this.init();
    }

    init() {
        this.createCustomSelect();
        this.bindEvents();
    }

    createCustomSelect() {
        // 隐藏原生 select
        this.element.style.display = 'none';

        // 创建自定义下拉框容器
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';
        if (this.options.disabled) {
            customSelect.classList.add('disabled');
        }

        // 获取选项
        const selectOptions = Array.from(this.element.options);
        const selectedOption =
            selectOptions.find((opt) => opt.selected) || selectOptions[0];
        this.selectedValue = selectedOption?.value || '';

        // 创建触发器
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.innerHTML = `
            <span class="custom-select-text">${selectedOption?.text || '请选择'}</span>
            <div class="custom-select-arrow"></div>
        `;

        // 创建选项列表
        const optionsList = document.createElement('div');
        optionsList.className = 'custom-select-options';

        selectOptions.forEach((option) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-select-option';
            optionElement.textContent = option.text;
            optionElement.dataset.value = option.value;

            if (option.value === this.selectedValue) {
                optionElement.classList.add('selected');
            }

            optionsList.appendChild(optionElement);
        });

        customSelect.appendChild(trigger);
        customSelect.appendChild(optionsList);

        // 插入到原生 select 后面
        this.element.parentNode.insertBefore(
            customSelect,
            this.element.nextSibling
        );

        this.customSelect = customSelect;
        this.trigger = trigger;
        this.optionsList = optionsList;
        this.textElement = trigger.querySelector('.custom-select-text');
    }

    bindEvents() {
        // 点击触发器
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // 点击选项
        this.optionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('custom-select-option')) {
                this.selectOption(e.target);
            }
        });

        // 点击外部关闭
        document.addEventListener('click', () => {
            this.close();
        });

        // 阻止选项列表的点击事件冒泡
        this.customSelect.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    toggle() {
        if (this.options.disabled) return;

        if (this.customSelect.classList.contains('open')) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        // 关闭其他所有打开的下拉框
        document.querySelectorAll('.custom-select.open').forEach((select) => {
            select.classList.remove('open');
        });

        this.customSelect.classList.add('open');
    }

    close() {
        this.customSelect.classList.remove('open');
    }

    selectOption(optionElement) {
        const value = optionElement.dataset.value;
        const text = optionElement.textContent;

        // 更新选中状态
        this.optionsList
            .querySelectorAll('.custom-select-option')
            .forEach((opt) => {
                opt.classList.remove('selected');
            });
        optionElement.classList.add('selected');

        // 更新显示文本
        this.textElement.textContent = text;

        // 更新原生 select 的值
        this.element.value = value;
        this.selectedValue = value;

        // 触发 change 事件
        const event = new Event('change', { bubbles: true });
        this.element.dispatchEvent(event);

        // 调用回调函数
        this.onChange(value, text);

        // 关闭下拉框
        this.close();
    }

    setValue(value) {
        const option = this.optionsList.querySelector(
            `[data-value="${value}"]`
        );
        if (option) {
            this.selectOption(option);
        }
    }

    getValue() {
        return this.selectedValue;
    }

    destroy() {
        if (this.customSelect) {
            this.customSelect.remove();
        }
        this.element.style.display = '';
    }
}

// 初始化所有自定义下拉框
function initCustomSelects() {
    document
        .querySelectorAll('select:not([data-custom-select-initialized])')
        .forEach((select) => {
            select.dataset.customSelectInitialized = 'true';
            new CustomSelect(select);
        });
}

// 导出
export { CustomSelect, initCustomSelects };

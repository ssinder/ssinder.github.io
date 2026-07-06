/**
 * 通用工具函数集合
 */

const Utils = {
    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay = 300) {
        let timer = null;
        return function(...args) {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, delay = 300) {
        let lastTime = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                func.apply(this, args);
            }
        };
    },

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num, decimals = 2) {
        if (num === null || num === undefined) return '0';
        return num.toLocaleString('zh-CN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * 格式化日期
     * @param {Date|string|number} date - 日期对象、字符串或时间戳
     * @param {string} format - 格式字符串
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return '';
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 深拷贝对象
     * @param {any} obj - 要拷贝的对象
     * @returns {any} 拷贝后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (obj instanceof Object) {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
     * 检查对象是否为空
     * @param {any} obj - 要检查的对象
     * @returns {boolean} 是否为空
     */
    isEmpty(obj) {
        if (obj === null || obj === undefined) {
            return true;
        }
        if (typeof obj === 'string') {
            return obj.trim().length === 0;
        }
        if (Array.isArray(obj)) {
            return obj.length === 0;
        }
        if (typeof obj === 'object') {
            return Object.keys(obj).length === 0;
        }
        return false;
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 截断文本
     * @param {string} text - 文本
     * @param {number} maxLength - 最大长度
     * @param {string} suffix - 后缀
     * @returns {string} 截断后的文本
     */
    truncateText(text, maxLength = 100, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + suffix;
    },

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型（success/error/warning/info）
     * @param {number} duration - 显示时长（毫秒）
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : type === 'warning' ? '#faad14' : '#1890ff'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 导出工具函数（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

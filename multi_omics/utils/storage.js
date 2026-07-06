/**
 * 本地存储工具类
 * 封装localStorage操作，提供类型安全的存储方法
 */

class Storage {
    /**
     * 构造函数
     */
    constructor() {
        this.storage = window.localStorage;
        this.prefix = 'brain_db_';
    }

    /**
     * 设置数据
     * @param {string} key - 存储键
     * @param {any} value - 存储值
     * @returns {boolean} 是否设置成功
     */
    set(key, value) {
        try {
            const storageKey = this._getStorageKey(key);
            const serializedValue = JSON.stringify(value);
            this.storage.setItem(storageKey, serializedValue);
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    /**
     * 获取数据
     * @param {string} key - 存储键
     * @param {any} defaultValue - 默认值
     * @returns {any} 存储的值或默认值
     */
    get(key, defaultValue = null) {
        try {
            const storageKey = this._getStorageKey(key);
            const serializedValue = this.storage.getItem(storageKey);
            if (serializedValue === null) {
                return defaultValue;
            }
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('获取数据失败:', error);
            return defaultValue;
        }
    }

    /**
     * 删除数据
     * @param {string} key - 存储键
     * @returns {boolean} 是否删除成功
     */
    remove(key) {
        try {
            const storageKey = this._getStorageKey(key);
            this.storage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有数据
     * @returns {boolean} 是否清空成功
     */
    clear() {
        try {
            const keys = this._getAllKeys();
            keys.forEach(key => this.storage.removeItem(key));
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 检查是否存在某个键
     * @param {string} key - 存储键
     * @returns {boolean} 是否存在
     */
    has(key) {
        const storageKey = this._getStorageKey(key);
        return this.storage.getItem(storageKey) !== null;
    }

    /**
     * 获取所有键
     * @returns {Array<string>} 键数组
     */
    keys() {
        return this._getAllKeys().map(key => key.replace(this.prefix, ''));
    }

    /**
     * 获取存储大小
     * @returns {number} 存储大小（字节）
     */
    size() {
        let size = 0;
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                size += this.storage[key].length + key.length;
            }
        }
        return size;
    }

    /**
     * 获取带前缀的存储键
     * @param {string} key - 原始键
     * @returns {string} 带前缀的键
     */
    _getStorageKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * 获取所有带前缀的键
     * @returns {Array<string>} 键数组
     */
    _getAllKeys() {
        const keys = [];
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }
}

// 创建全局存储实例
const storage = new Storage();

// 导出存储工具（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage, storage };
}

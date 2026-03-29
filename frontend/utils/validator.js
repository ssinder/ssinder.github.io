/**
 * 表单验证工具
 */

class FormValidator {
    constructor() {
        this.rules = {};
        this.messages = {
            required: '此字段为必填项',
            email: '请输入有效的邮箱地址',
            minLength: '最少需要 {min} 个字符',
            maxLength: '最多允许 {max} 个字符',
            min: '不能小于 {min}',
            max: '不能大于 {max}',
            pattern: '格式不正确',
            url: '请输入有效的URL'
        };
    }

    /**
     * 添加验证规则
     * @param {string} field - 字段名
     * @param {Array} rules - 规则数组
     */
    addRule(field, rules) {
        this.rules[field] = rules;
    }

    /**
     * 验证单个字段
     * @param {string} field - 字段名
     * @param {any} value - 字段值
     * @returns {Object} 验证结果
     */
    validateField(field, value) {
        const errors = [];
        const rules = this.rules[field] || [];

        for (const rule of rules) {
            const error = this._validateRule(rule, value);
            if (error) {
                errors.push(error);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证整个表单
     * @param {Object} data - 表单数据
     * @returns {Object} 验证结果
     */
    validate(data) {
        const errors = {};
        let isValid = true;

        for (const field in this.rules) {
            const result = this.validateField(field, data[field]);
            if (!result.valid) {
                errors[field] = result.errors;
                isValid = false;
            }
        }

        return {
            valid: isValid,
            errors
        };
    }

    /**
     * 验证规则
     * @param {Object} rule - 规则对象
     * @param {any} value - 字段值
     * @returns {string|null} 错误消息
     */
    _validateRule(rule, value) {
        const { type, message, ...params } = rule;

        switch (type) {
            case 'required':
                if (this._isEmpty(value)) {
                    return message || this.messages.required;
                }
                break;

            case 'email':
                if (value && !this._isEmail(value)) {
                    return message || this.messages.email;
                }
                break;

            case 'minLength':
                if (value && value.length < params.min) {
                    return message || this.messages.minLength.replace('{min}', params.min);
                }
                break;

            case 'maxLength':
                if (value && value.length > params.max) {
                    return message || this.messages.maxLength.replace('{max}', params.max);
                }
                break;

            case 'min':
                if (value !== null && value !== undefined && value < params.min) {
                    return message || this.messages.min.replace('{min}', params.min);
                }
                break;

            case 'max':
                if (value !== null && value !== undefined && value > params.max) {
                    return message || this.messages.max.replace('{max}', params.max);
                }
                break;

            case 'pattern':
                if (value && !params.pattern.test(value)) {
                    return message || this.messages.pattern;
                }
                break;

            case 'url':
                if (value && !this._isUrl(value)) {
                    return message || this.messages.url;
                }
                break;

            case 'custom':
                if (params.validator && !params.validator(value)) {
                    return message || '验证失败';
                }
                break;
        }

        return null;
    }

    /**
     * 检查是否为空
     * @param {any} value - 值
     * @returns {boolean} 是否为空
     */
    _isEmpty(value) {
        return value === null || value === undefined || value === '';
    }

    /**
     * 检查是否为邮箱
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否为邮箱
     */
    _isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 检查是否为URL
     * @param {string} url - URL
     * @returns {boolean} 是否为URL
     */
    _isUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * 常用验证规则
 */
const ValidationRules = {
    required: () => ({ type: 'required' }),
    email: () => ({ type: 'email' }),
    minLength: (min) => ({ type: 'minLength', min }),
    maxLength: (max) => ({ type: 'maxLength', max }),
    min: (min) => ({ type: 'min', min }),
    max: (max) => ({ type: 'max', max }),
    pattern: (regex) => ({ type: 'pattern', pattern: regex }),
    url: () => ({ type: 'url' }),
    custom: (validator) => ({ type: 'custom', validator })
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, ValidationRules };
}

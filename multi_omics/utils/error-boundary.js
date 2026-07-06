/**
 * 错误边界类
 * 捕获和处理前端错误
 */

class ErrorBoundary {
    constructor(options = {}) {
        this.onError = options.onError || this._defaultErrorHandler;
        this.onFallback = options.onFallback || this._defaultFallback;
        this.isSetup = false;
    }

    /**
     * 设置错误边界
     */
    setup() {
        if (this.isSetup) return;

        window.addEventListener('error', this._handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this._handleUnhandledRejection.bind(this));

        this.isSetup = true;
        console.log('ErrorBoundary 已设置');
    }

    /**
     * 处理全局错误
     * @param {ErrorEvent} event - 错误事件
     */
    _handleGlobalError(event) {
        event.preventDefault();

        const error = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        };

        console.error('全局错误:', error);
        this.onError(error);
    }

    /**
     * 处理未处理的Promise拒绝
     * @param {PromiseRejectionEvent} event - Promise拒绝事件
     */
    _handleUnhandledRejection(event) {
        event.preventDefault();

        const error = {
            message: event.reason?.message || '未处理的Promise拒绝',
            stack: event.reason?.stack
        };

        console.error('未处理的Promise拒绝:', error);
        this.onError(error);
    }

    /**
     * 默认错误处理器
     * @param {Object} error - 错误对象
     */
    _defaultErrorHandler(error) {
        console.error('错误:', error);

        const errorElement = document.createElement('div');
        errorElement.className = 'error-boundary-fallback';
        errorElement.innerHTML = `
            <div class="error-content">
                <h2>出错了</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">刷新页面</button>
            </div>
        `;

        document.body.appendChild(errorElement);
    }

    /**
     * 默认回退UI
     * @param {Object} error - 错误对象
     */
    _defaultFallback(error) {
        return `
            <div class="error-boundary-fallback">
                <div class="error-content">
                    <h2>出错了</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">刷新页面</button>
                </div>
            </div>
        `;
    }

    /**
     * 包装异步函数以捕获错误
     * @param {Function} fn - 异步函数
     * @returns {Function} 包装后的函数
     */
    wrapAsync(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.onError({
                    message: error.message,
                    stack: error.stack
                });
                throw error;
            }
        };
    }

    /**
     * 包装组件以捕获错误
     * @param {Function} component - 组件函数
     * @returns {Function} 包装后的组件
     */
    wrapComponent(component) {
        return (...args) => {
            try {
                return component(...args);
            } catch (error) {
                this.onError({
                    message: error.message,
                    stack: error.stack
                });
                return this.onFallback(error);
            }
        };
    }

    /**
     * 清理错误边界
     */
    cleanup() {
        if (!this.isSetup) return;

        window.removeEventListener('error', this._handleGlobalError);
        window.removeEventListener('unhandledrejection', this._handleUnhandledRejection);

        this.isSetup = false;
        console.log('ErrorBoundary 已清理');
    }
}

const errorBoundary = new ErrorBoundary();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorBoundary, errorBoundary };
}

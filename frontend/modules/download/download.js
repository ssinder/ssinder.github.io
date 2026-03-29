/**
 * 数据下载模块
 * 负责数据下载相关的功能
 */

class DownloadModule {
    /**
     * 构造函数
     */
    constructor() {
        this.currentFilters = {
            dataTypes: [],
            format: 'h5'
        };
        this.downloadHistory = [];
    }

    /**
     * 初始化模块
     */
    init() {
        this._bindEvents();
        this._loadDownloadHistory();
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        const startBtn = document.getElementById('startDownloadBtn');
        const historyBtn = document.getElementById('downloadHistoryBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this._startDownload());
        }

        if (historyBtn) {
            historyBtn.addEventListener('click', () => this._showDownloadHistory());
        }

        const formatSelect = document.getElementById('formatSelect');
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                this.currentFilters.format = e.target.value;
            });
        }
    }

    /**
     * 开始下载
     */
    async _startDownload() {
        try {
            const filters = this._collectFilters();
            this.currentFilters = filters;

            if (filters.dataTypes.length === 0) {
                Utils.showToast('请至少选择一种数据类型', 'warning');
                return;
            }

            this._showLoading();

            const response = await apiClient.get(
                CONFIG.API.ENDPOINTS.DOWNLOAD.FILES,
                {
                    dataTypes: filters.dataTypes.join(','),
                    format: filters.format,
                    page: 1,
                    pageSize: 100
                }
            );

            this._displayFiles(response.data);
            this._hideLoading();

            Utils.showToast('文件列表加载成功', 'success');
        } catch (error) {
            console.error('获取文件列表失败:', error);
            this._hideLoading();
            Utils.showToast('获取文件列表失败: ' + error.message, 'error');
        }
    }

    /**
     * 收集下载筛选条件
     * @returns {Object} 筛选条件对象
     */
    _collectFilters() {
        const filters = {
            dataTypes: [],
            format: 'h5'
        };

        const dlGenome = document.getElementById('dl-genome');
        const dlRna = document.getElementById('dl-rna');
        const dlAnalysis = document.getElementById('dl-analysis');

        if (dlGenome && dlGenome.checked) filters.dataTypes.push('genome');
        if (dlRna && dlRna.checked) filters.dataTypes.push('rna');
        if (dlAnalysis && dlAnalysis.checked) filters.dataTypes.push('analysis');

        const formatSelect = document.getElementById('formatSelect');
        if (formatSelect) filters.format = formatSelect.value;

        return filters;
    }

    /**
     * 显示文件列表
     * @param {Object} data - 文件列表数据
     */
    _displayFiles(data) {
        const downloadContent = document.getElementById('downloadContent');
        if (!downloadContent) return;

        let html = '';

        if (data.files && data.files.length > 0) {
            html += this._renderFileList(data.files);
        } else {
            html += '<div class="empty-state">暂无可用文件</div>';
        }

        downloadContent.innerHTML = html;

        this._bindFileEvents();
    }

    /**
     * 渲染文件列表
     * @param {Array} files - 文件数组
     * @returns {string} HTML字符串
     */
    _renderFileList(files) {
        return `
            <div class="download-content">
                <div class="overview-panel">
                    <h3>可下载文件</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${files.length}</div>
                            <div class="stat-label">文件总数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${this._calculateTotalSize(files)}</div>
                            <div class="stat-label">总大小</div>
                        </div>
                    </div>
                </div>
                <div class="data-display">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>文件名</th>
                                <th>数据集</th>
                                <th>类型</th>
                                <th>格式</th>
                                <th>大小</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${files.map(file => `
                                <tr>
                                    <td>${file.name || file.id}</td>
                                    <td>${file.datasetName || '-'}</td>
                                    <td>${file.dataType || '-'}</td>
                                    <td>${file.format || '-'}</td>
                                    <td>${Utils.formatFileSize(file.size || 0)}</td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" data-action="download" data-id="${file.id}" data-name="${file.name}">下载</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 计算总大小
     * @param {Array} files - 文件数组
     * @returns {string} 格式化后的总大小
     */
    _calculateTotalSize(files) {
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        return Utils.formatFileSize(totalSize);
    }

    /**
     * 绑定文件事件
     */
    _bindFileEvents() {
        const downloadBtns = document.querySelectorAll('[data-action="download"]');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.dataset.id;
                const fileName = e.target.dataset.name;
                this._downloadFile(fileId, fileName);
            });
        });
    }

    /**
     * 下载文件
     * @param {string} fileId - 文件ID
     * @param {string} fileName - 文件名
     */
    async _downloadFile(fileId, fileName) {
        try {
            Utils.showToast('开始下载...', 'info');

            const downloadUrl = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.DOWNLOAD.FILE}/${fileId}`;
            
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error('下载失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);

            this._addToDownloadHistory(fileId, fileName);
            Utils.showToast('下载完成', 'success');
        } catch (error) {
            console.error('下载失败:', error);
            Utils.showToast('下载失败: ' + error.message, 'error');
        }
    }

    /**
     * 显示下载历史
     */
    async _showDownloadHistory() {
        try {
            this._showLoading();

            const response = await apiClient.get(CONFIG.API.ENDPOINTS.DOWNLOAD.HISTORY);

            this.downloadHistory = response.data.history || [];
            this._displayDownloadHistory();
            this._hideLoading();

            Utils.showToast('下载历史加载成功', 'success');
        } catch (error) {
            console.error('获取下载历史失败:', error);
            this._hideLoading();
            Utils.showToast('获取下载历史失败: ' + error.message, 'error');
        }
    }

    /**
     * 显示下载历史
     */
    _displayDownloadHistory() {
        const downloadContent = document.getElementById('downloadContent');
        if (!downloadContent) return;

        let html = '';

        if (this.downloadHistory.length > 0) {
            html += this._renderHistoryList(this.downloadHistory);
        } else {
            html += '<div class="empty-state">暂无下载历史</div>';
        }

        downloadContent.innerHTML = html;
    }

    /**
     * 渲染历史列表
     * @param {Array} history - 历史记录数组
     * @returns {string} HTML字符串
     */
    _renderHistoryList(history) {
        return `
            <div class="download-content">
                <div class="overview-panel">
                    <h3>下载历史</h3>
                </div>
                <div class="data-display">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>文件名</th>
                                <th>下载时间</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.map(item => `
                                <tr>
                                    <td>${item.fileName}</td>
                                    <td>${Utils.formatDate(item.downloadDate)}</td>
                                    <td>${item.status === 'completed' ? '已完成' : '进行中'}</td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" data-action="redownload" data-id="${item.fileId}">重新下载</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 添加到下载历史
     * @param {string} fileId - 文件ID
     * @param {string} fileName - 文件名
     */
    _addToDownloadHistory(fileId, fileName) {
        const historyItem = {
            downloadId: Utils.generateId(),
            fileId: fileId,
            fileName: fileName,
            downloadDate: new Date().toISOString(),
            status: 'completed'
        };

        this.downloadHistory.unshift(historyItem);
        storage.set('downloadHistory', this.downloadHistory);
    }

    /**
     * 加载下载历史
     */
    _loadDownloadHistory() {
        this.downloadHistory = storage.get('downloadHistory', []);
    }

    /**
     * 加载下载页面
     */
    _loadDownloads() {
        console.log('[Download] 加载下载页面');
        this._showLoading();
        
        setTimeout(() => {
            this._hideLoading();
            this._startDownload();
        }, 500);
    }

    /**
     * 显示加载状态
     */
    _showLoading() {
        const downloadContent = document.getElementById('downloadContent');
        if (!downloadContent) return;

        downloadContent.innerHTML = '<div class="loading">加载中...</div>';
    }

    /**
     * 隐藏加载状态
     */
    _hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
}

// 创建全局下载模块实例
const downloadModule = new DownloadModule();

// 导出下载模块（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DownloadModule, downloadModule };
}

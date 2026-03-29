/**
 * 数据查询模块
 * 负责数据查询相关的功能
 */

class QueryModule {
    /**
     * 构造函数
     */
    constructor() {
        this.currentFilters = {};
        this.currentResults = [];
        this.currentPage = 1;
        this.pageSize = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
        this.totalCount = 0;
        this.viewMode = 'grid';
    }

    /**
     * 初始化模块
     */
    init() {
        this._bindEvents();
        this._loadSavedFilters();
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        const queryBtn = document.getElementById('queryBtn');
        const resetBtn = document.getElementById('resetBtn');
        const saveBtn = document.getElementById('saveConditionBtn');

        if (queryBtn) {
            queryBtn.addEventListener('click', () => this._performQuery());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this._resetFilters());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this._saveFilters());
        }
    }

    /**
     * 执行查询
     */
    async _performQuery() {
        try {
            const filters = this._collectFilters();
            this.currentFilters = filters;

            this._showLoading();

            const response = await apiClient.post(
                CONFIG.API.ENDPOINTS.QUERY.DATASETS,
                {
                    ...filters,
                    page: this.currentPage,
                    pageSize: this.pageSize
                }
            );

            this.currentResults = response.data;
            this.totalCount = response.data.total || 0;

            this._displayResults(response.data);
            this._hideLoading();

            Utils.showToast('查询成功', 'success');
        } catch (error) {
            console.error('查询失败:', error);
            this._hideLoading();
            Utils.showToast('查询失败: ' + error.message, 'error');
        }
    }

    /**
     * 收集查询条件
     * @returns {Object} 查询条件对象
     */
    _collectFilters() {
        const filters = {
            dataTypes: [],
            species: [],
            tissues: [],
            developmentStages: [],
            platforms: [],
            genes: [],
            expressionThreshold: 0,
            doi: ''
        };

        const dataGenome = document.getElementById('data-genome');
        const dataRna = document.getElementById('data-rna');
        const dataMulti = document.getElementById('data-multi');

        if (dataGenome && dataGenome.checked) filters.dataTypes.push('genome');
        if (dataRna && dataRna.checked) filters.dataTypes.push('rna');
        if (dataMulti && dataMulti.checked) filters.dataTypes.push('multi');

        const speciesSelect = document.getElementById('speciesSelect');
        if (speciesSelect && speciesSelect.value) {
            filters.species = [speciesSelect.value];
        }

        const tissueSelect = document.getElementById('tissueSelect');
        if (tissueSelect && tissueSelect.value) {
            filters.tissues = [tissueSelect.value];
        }

        const stageSeedling = document.getElementById('stage-seedling');
        const stageVegetative = document.getElementById('stage-vegetative');
        const stageFlowering = document.getElementById('stage-flowering');
        const stagePod = document.getElementById('stage-pod');
        const stageMaturity = document.getElementById('stage-maturity');

        if (stageSeedling && stageSeedling.checked) filters.developmentStages.push('seedling');
        if (stageVegetative && stageVegetative.checked) filters.developmentStages.push('vegetative');
        if (stageFlowering && stageFlowering.checked) filters.developmentStages.push('flowering');
        if (stagePod && stagePod.checked) filters.developmentStages.push('pod');
        if (stageMaturity && stageMaturity.checked) filters.developmentStages.push('maturity');

        const platformSelect = document.getElementById('platformSelect');
        if (platformSelect && platformSelect.value) {
            filters.platforms = [platformSelect.value];
        }

        const geneInput = document.getElementById('geneInput');
        if (geneInput && geneInput.value) {
            filters.genes = geneInput.value.split(',').map(g => g.trim()).filter(g => g);
        }

        const thresholdInput = document.getElementById('expressionThreshold');
        if (thresholdInput) filters.expressionThreshold = parseFloat(thresholdInput.value) || 0;

        return filters;
    }

    /**
     * 重置查询条件
     */
    _resetFilters() {
        const checkboxes = document.querySelectorAll('#queryPanel input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        const selects = document.querySelectorAll('#queryPanel select');
        selects.forEach(select => select.selectedIndex = 0);

        const inputs = document.querySelectorAll('#queryPanel input[type="text"], #queryPanel input[type="number"]');
        inputs.forEach(input => input.value = '');

        this.currentFilters = {};
        this.currentResults = [];
        this.currentPage = 1;
        this.totalCount = 0;

        Utils.showToast('查询条件已重置', 'info');
    }

    /**
     * 保存查询条件
     */
    _saveFilters() {
        const filters = this._collectFilters();
        const savedFilters = storage.get('savedFilters', []);
        
        savedFilters.push({
            id: Utils.generateId(),
            name: `查询条件 ${savedFilters.length + 1}`,
            filters: filters,
            createdAt: new Date().toISOString()
        });

        storage.set('savedFilters', savedFilters);
        Utils.showToast('查询条件已保存', 'success');
    }

    /**
     * 加载保存的查询条件
     */
    _loadSavedFilters() {
        const savedFilters = storage.get('savedFilters', []);
        console.log('已保存的查询条件:', savedFilters);
    }

    /**
     * 加载查询页面
     */
    _loadQuery() {
        console.log('[Query] 加载查询页面');
        this._showLoading();
        
        setTimeout(() => {
            this._hideLoading();
            this._performQuery();
        }, 500);
    }

    /**
     * 显示查询结果
     * @param {Object} data - 查询结果数据
     */
    _displayResults(data) {
        const queryContent = document.getElementById('queryContent');
        if (!queryContent) return;

        let html = '';

        if (data.statistics) {
            html += this._renderStatistics(data.statistics);
        }

        if (data.datasets && data.datasets.length > 0) {
            html += this._renderDatasets(data.datasets);
        } else {
            html += '<div class="empty-state">暂无数据</div>';
        }

        if (data.total > 0) {
            html += this._renderPagination(data.page, data.pageSize, data.total);
        }

        queryContent.innerHTML = html;

        this._bindCardEvents();
    }

    /**
     * 渲染统计信息
     * @param {Object} statistics - 统计信息
     * @returns {string} HTML字符串
     */
    _renderStatistics(statistics) {
        return `
            <div class="overview-panel">
                <h3>数据概览</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-number">${(statistics.totalDatasets || 0).toLocaleString()}</div>
                        <div class="stat-label">数据集总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🧬</div>
                        <div class="stat-number">${(statistics.totalCells || 0).toLocaleString()}</div>
                        <div class="stat-label">细胞总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🧪</div>
                        <div class="stat-number">${(statistics.totalGenes || 0).toLocaleString()}</div>
                        <div class="stat-label">基因总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🌱</div>
                        <div class="stat-number">${statistics.totalSpecies || 0}</div>
                        <div class="stat-label">物种数</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染数据集列表
     * @param {Array} datasets - 数据集数组
     * @returns {string} HTML字符串
     */
    _renderDatasets(datasets) {
        const isGridView = this.viewMode === 'grid';
        
        return `
            <div class="data-display">
                <div class="display-controls">
                    <div class="view-toggle">
                        <div class="toggle-btn ${isGridView ? 'active' : ''}" data-view="grid">卡片视图</div>
                        <div class="toggle-btn ${!isGridView ? 'active' : ''}" data-view="list">列表视图</div>
                    </div>
                    <div class="result-info">共找到 ${datasets.length} 条结果</div>
                </div>
                <div class="${isGridView ? 'data-grid' : 'data-list'}">
                    ${datasets.map(dataset => isGridView ? this._renderDatasetCard(dataset) : this._renderDatasetRow(dataset)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 渲染数据集行（列表视图）
     * @param {Object} dataset - 数据集对象
     * @returns {string} HTML字符串
     */
    _renderDatasetRow(dataset) {
        return `
            <div class="data-row">
                <div class="row-cell">${dataset.name || dataset.id}</div>
                <div class="row-cell">${dataset.species || '-'}</div>
                <div class="row-cell">${dataset.tissue || '-'}</div>
                <div class="row-cell">${dataset.cellCount || 0}</div>
                <div class="row-cell">${dataset.geneCount || 0}</div>
                <div class="row-cell">
                    <button class="btn btn-primary btn-sm" data-action="visualize" data-id="${dataset.id}">可视化</button>
                    <button class="btn btn-secondary btn-sm" data-action="detail" data-id="${dataset.id}">详情</button>
                    <button class="btn btn-secondary btn-sm" data-action="download" data-id="${dataset.id}">下载</button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染数据集卡片
     * @param {Object} dataset - 数据集对象
     * @returns {string} HTML字符串
     */
    _renderDatasetCard(dataset) {
        const typeMap = {
            'genome': '基因组',
            'rna': '转录组',
            'multi': '多组学'
        };
        const typeLabel = typeMap[dataset.type] || dataset.type;
        
        return `
            <div class="data-card">
                <div class="card-header">
                    <span class="card-id">${dataset.id}</span>
                    <span class="card-type">${typeLabel}</span>
                </div>
                <div class="card-title">${dataset.name}</div>
                <div class="card-meta">
                    <div class="meta-item">
                        <span class="meta-label">物种</span>
                        <span class="meta-value">${dataset.species || '-'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">组织</span>
                        <span class="meta-value">${dataset.tissue || '-'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">平台</span>
                        <span class="meta-value">${dataset.platform || '-'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">细胞数</span>
                        <span class="meta-value">${(dataset.cellCount || 0).toLocaleString()}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">基因数</span>
                        <span class="meta-value">${(dataset.geneCount || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div class="card-desc">${dataset.description || ''}</div>
                <div class="card-footer">
                    <span class="card-date">${dataset.createTime || ''}</span>
                </div>
            </div>
        `;
    }

    /**
     * 渲染分页
     * @param {number} page - 当前页码
     * @param {number} pageSize - 每页数量
     * @param {number} total - 总数
     * @returns {string} HTML字符串
     */
    _renderPagination(page, pageSize, total) {
        const totalPages = Math.ceil(total / pageSize);
        let html = '<div class="pagination">';

        html += `<button class="page-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        html += `<button class="page-btn" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>`;
        html += '</div>';

        return html;
    }

    /**
     * 显示加载状态
     */
    _showLoading() {
        const queryContent = document.getElementById('queryContent');
        if (!queryContent) return;

        queryContent.innerHTML = '<div class="loading">加载中...</div>';
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

    _bindCardEvents() {
        const cardButtons = document.querySelectorAll('.data-card .btn, .data-row .btn');
        cardButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const id = e.target.dataset.id;
                
                if (action === 'visualize') {
                    this._visualizeDataset(id);
                } else if (action === 'detail') {
                    this._showDatasetDetail(id);
                } else if (action === 'download') {
                    this._downloadDataset(id);
                }
            });
        });

        const viewToggleBtns = document.querySelectorAll('.view-toggle .toggle-btn');
        viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                if (view) {
                    this.viewMode = view;
                    this._displayResults({
                        statistics: this.currentResults.statistics,
                        datasets: this.currentResults.datasets,
                        total: this.totalCount,
                        page: this.currentPage,
                        pageSize: this.pageSize
                    });
                }
            });
        });

        const pageButtons = document.querySelectorAll('.page-btn');
        pageButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page && !btn.disabled) {
                    this._changePage(page);
                }
            });
        });
    }

    _visualizeDataset(id) {
        Utils.showToast('跳转到可视化分析...', 'info');
        const app = window.app;
        if (app) {
            app._navigateToPage('visualization');
        }
    }

    _showDatasetDetail(id) {
        Utils.showToast('查看数据集详情: ' + id, 'info');
    }

    _downloadDataset(id) {
        Utils.showToast('下载数据集: ' + id, 'info');
    }

    async _changePage(page) {
        this.currentPage = page;
        await this._performQuery();
    }
}

// 创建全局查询模块实例
const queryModule = new QueryModule();

// 导出查询模块（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QueryModule, queryModule };
}

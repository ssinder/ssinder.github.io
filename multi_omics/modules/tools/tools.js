/**
 * 在线工具模块
 * 负责在线分析工具相关的功能
 */

class ToolsModule {
    /**
     * 构造函数
     */
    constructor() {
        this.currentTool = null;
        this.currentDataset = null;
        this.analysisParams = {
            pValueThreshold: CONFIG.TOOLS.DEFAULT_P_VALUE,
            fdrThreshold: CONFIG.TOOLS.DEFAULT_FDR,
            database: 'go'
        };
        this.analysisResults = null;
    }

    /**
     * 初始化模块
     */
    init() {
        this._bindEvents();
        this._loadSavedParams();
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        const runBtn = document.getElementById('runAnalysisBtn');
        const exportBtn = document.getElementById('exportResultBtn');

        if (runBtn) {
            runBtn.addEventListener('click', () => this._runAnalysis());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this._exportResults());
        }

        const toolSelect = document.getElementById('toolSelect');
        if (toolSelect) {
            toolSelect.addEventListener('change', (e) => {
                this.currentTool = e.target.value;
                this._updateToolUI();
            });
        }
    }

    /**
     * 运行分析
     */
    async _runAnalysis() {
        try {
            console.log('[Tools] 开始运行分析');
            const params = this._collectParams();
            this.analysisParams = params;
            console.log('[Tools] 收集到的参数:', params);

            if (!this.currentTool) {
                Utils.showToast('请选择分析工具', 'warning');
                return;
            }

            this._showLoading();

            let data;
            let useMockData = false;
            
            try {
                let endpoint;
                switch (this.currentTool) {
                    case 'deg':
                        endpoint = CONFIG.API.ENDPOINTS.TOOLS.DIFFERENTIAL_EXPRESSION;
                        console.log('[Tools] 使用差异基因分析端点:', endpoint);
                        break;
                    case 'enrichment':
                        endpoint = CONFIG.API.ENDPOINTS.TOOLS.ENRICHMENT;
                        console.log('[Tools] 使用富集分析端点:', endpoint);
                        break;
                    case 'cellcomm':
                        endpoint = CONFIG.API.ENDPOINTS.TOOLS.CELL_COMMUNICATION;
                        console.log('[Tools] 使用细胞通讯分析端点:', endpoint);
                        break;
                    case 'trajectory':
                        endpoint = CONFIG.API.ENDPOINTS.TOOLS.TRAJECTORY;
                        console.log('[Tools] 使用轨迹分析端点:', endpoint);
                        break;
                    default:
                        throw new Error('未知的分析工具');
                }

                const response = await apiClient.post(endpoint, params);
                data = response.data;
                console.log('[Tools] API调用成功，数据:', data);
            } catch (apiError) {
                console.warn('[Tools] API调用失败，使用模拟数据:', apiError);
                Utils.showToast('API调用失败，使用模拟数据展示', 'warning');
                data = this._generateMockData();
                useMockData = true;
                console.log('[Tools] 生成的模拟数据:', data);
            }

            this._hideLoading();

            if (useMockData) {
                Utils.showToast('使用模拟数据展示分析结果', 'info');
            } else {
                Utils.showToast('分析完成', 'success');
            }

            console.log('[Tools] 开始显示分析结果');
            this.analysisResults = data;
            this._displayResults(data);
            console.log('[Tools] 分析结果显示完成');
        } catch (error) {
            console.error('[Tools] 分析失败:', error);
            this._hideLoading();
            Utils.showToast('分析失败: ' + error.message, 'error');
        }
    }

    /**
     * 生成模拟数据
     * @returns {Object} 模拟数据
     */
    _generateMockData() {
        const mockData = {
            deg: {
                statistics: {
                    totalGenes: 1234,
                    significantGenes: 156,
                    upregulated: 89,
                    downregulated: 67
                },
                results: Array.from({ length: 20 }, (_, i) => ({
                    gene: `GENE${String(i + 1).padStart(4, '0')}`,
                    log2FoldChange: (Math.random() * 4 - 2).toFixed(4),
                    pValue: Math.random() * 0.05,
                    fdr: Math.random() * 0.1,
                    avgExprGroup1: (Math.random() * 10).toFixed(2),
                    avgExprGroup2: (Math.random() * 10).toFixed(2)
                }))
            },
            enrichment: {
                database: this.analysisParams.database || 'GO',
                results: Array.from({ length: 15 }, (_, i) => ({
                    termId: `GO:00${String(i + 1).padStart(5, '0')}`,
                    termName: ['细胞增殖', '细胞凋亡', '免疫反应', '神经发育', '突触形成', '细胞分化', '信号转导', '代谢过程', '细胞迁移', '细胞粘附', '细胞周期', 'DNA修复', '转录调控', '蛋白质合成', '细胞应激'][i % 15],
                    pValue: Math.random() * 0.01,
                    fdr: Math.random() * 0.05,
                    geneRatio: (Math.random() * 0.3 + 0.05).toFixed(3),
                    backgroundRatio: (Math.random() * 0.5 + 0.1).toFixed(3)
                }))
            },
            cellcomm: {
                interactions: Array.from({ length: 25 }, (_, i) => ({
                    sourceCellType: ['叶肉细胞', '表皮细胞', '维管束细胞'][i % 3],
                    targetCellType: ['叶肉细胞', '表皮细胞', '维管束细胞'][(i + 1) % 3],
                    ligand: `LIGAND${String(i + 1).padStart(3, '0')}`,
                    receptor: `RECEPTOR${String(i + 1).padStart(3, '0')}`,
                    interactionScore: (Math.random() * 0.9 + 0.1).toFixed(4),
                    pValue: Math.random() * 0.01
                }))
            },
            trajectory: {
                geneExpressionAlongPseudotime: Array.from({ length: 10 }, (_, i) => ({
                    gene: `GENE${String(i + 1).padStart(4, '0')}`,
                    expression: Array.from({ length: 20 }, () => (Math.random() * 10).toFixed(2))
                }))
            }
        };

        return mockData[this.currentTool] || mockData.deg;
    }

    /**
     * 收集分析参数
     * @returns {Object} 分析参数对象
     */
    _collectParams() {
        const params = {
            datasetId: '',
            group1: [],
            group2: [],
            genes: [],
            database: this.analysisParams.database,
            pValueThreshold: this.analysisParams.pValueThreshold,
            fdrThreshold: this.analysisParams.fdrThreshold,
            cellTypes: [],
            pseudotimeStart: '',
            pseudotimeEnd: ''
        };

        const toolSelect = document.getElementById('toolSelect');
        if (toolSelect) this.currentTool = toolSelect.value;

        const datasetSelect = document.getElementById('toolDatasetSelect');
        if (datasetSelect) params.datasetId = datasetSelect.value;

        if (!params.datasetId || params.datasetId === '') {
            throw new Error('请先选择数据集');
        }

        const pValueInput = document.getElementById('pValueInput');
        if (pValueInput) params.pValueThreshold = parseFloat(pValueInput.value);

        const fdrInput = document.getElementById('fdrInput');
        if (fdrInput) params.fdrThreshold = parseFloat(fdrInput.value);

        const databaseSelect = document.getElementById('databaseSelect');
        if (databaseSelect) params.database = databaseSelect.value;

        return params;
    }

    /**
     * 显示分析结果
     * @param {Object} data - 分析结果数据
     */
    _displayResults(data) {
        const toolsContent = document.getElementById('toolsContent');
        if (!toolsContent) return;

        let html = '';

        if (this.currentTool === 'deg') {
            html += this._renderDifferentialExpression(data);
        } else if (this.currentTool === 'enrichment') {
            html += this._renderEnrichment(data);
        } else if (this.currentTool === 'cellcomm') {
            html += this._renderCellCommunication(data);
        } else if (this.currentTool === 'trajectory') {
            html += this._renderTrajectory(data);
        }

        toolsContent.innerHTML = html;
    }

    /**
     * 渲染差异基因分析结果
     * @param {Object} data - 分析结果数据
     * @returns {string} HTML字符串
     */
    _renderDifferentialExpression(data) {
        return `
            <div class="tools-content">
                <div class="overview-panel">
                    <h3>差异基因分析结果</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${data.statistics?.totalGenes || 0}</div>
                            <div class="stat-label">总基因数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.statistics?.significantGenes || 0}</div>
                            <div class="stat-label">显著差异基因</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.statistics?.upregulated || 0}</div>
                            <div class="stat-label">上调基因</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.statistics?.downregulated || 0}</div>
                            <div class="stat-label">下调基因</div>
                        </div>
                    </div>
                </div>
                <div class="data-display">
                    <h4>差异基因列表</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>基因</th>
                                <th>log2FC</th>
                                <th>P值</th>
                                <th>FDR</th>
                                <th>平均表达(组1)</th>
                                <th>平均表达(组2)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.results?.map(gene => `
                                <tr>
                                    <td>${gene.gene}</td>
                                    <td>${gene.log2FoldChange?.toFixed(4)}</td>
                                    <td>${gene.pValue?.toExponential(2)}</td>
                                    <td>${gene.fdr?.toExponential(2)}</td>
                                    <td>${gene.avgExprGroup1?.toFixed(2)}</td>
                                    <td>${gene.avgExprGroup2?.toFixed(2)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="6">暂无数据</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 渲染富集分析结果
     * @param {Object} data - 分析结果数据
     * @returns {string} HTML字符串
     */
    _renderEnrichment(data) {
        return `
            <div class="tools-content">
                <div class="overview-panel">
                    <h3>富集分析结果 - ${data.database}</h3>
                </div>
                <div class="data-display">
                    <h4>富集条目</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>条目ID</th>
                                <th>条目名称</th>
                                <th>P值</th>
                                <th>FDR</th>
                                <th>基因比例</th>
                                <th>背景比例</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.results?.map(item => `
                                <tr>
                                    <td>${item.termId}</td>
                                    <td>${item.termName}</td>
                                    <td>${item.pValue?.toExponential(2)}</td>
                                    <td>${item.fdr?.toExponential(2)}</td>
                                    <td>${item.geneRatio}</td>
                                    <td>${item.backgroundRatio}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="6">暂无数据</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 渲染细胞通讯分析结果
     * @param {Object} data - 分析结果数据
     * @returns {string} HTML字符串
     */
    _renderCellCommunication(data) {
        return `
            <div class="tools-content">
                <div class="overview-panel">
                    <h3>细胞通讯分析结果</h3>
                </div>
                <div class="visualization-tools">
                    <div class="visualization-panel">
                        <h4>细胞通讯网络</h4>
                        <div class="viz-container" id="cellCommNetwork">
                            <canvas id="networkCanvas" width="600" height="400"></canvas>
                        </div>
                    </div>
                    <div class="visualization-panel">
                        <h4>通讯强度</h4>
                        <div class="viz-container" id="cellCommHeatmap">
                            <canvas id="heatmapCanvas" width="600" height="400"></canvas>
                        </div>
                    </div>
                </div>
                <div class="data-display">
                    <h4>通讯详情</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>源细胞类型</th>
                                <th>目标细胞类型</th>
                                <th>配体</th>
                                <th>受体</th>
                                <th>通讯分数</th>
                                <th>P值</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.interactions?.map(inter => `
                                <tr>
                                    <td>${inter.sourceCellType}</td>
                                    <td>${inter.targetCellType}</td>
                                    <td>${inter.ligand}</td>
                                    <td>${inter.receptor}</td>
                                    <td>${inter.interactionScore?.toFixed(4)}</td>
                                    <td>${inter.pValue?.toExponential(2)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="6">暂无数据</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 渲染轨迹分析结果
     * @param {Object} data - 分析结果数据
     * @returns {string} HTML字符串
     */
    _renderTrajectory(data) {
        return `
            <div class="tools-content">
                <div class="overview-panel">
                    <h3>轨迹分析结果</h3>
                </div>
                <div class="visualization-panel">
                    <h4>伪时间轨迹</h4>
                    <div class="viz-container" id="trajectoryViz">
                        <canvas id="trajectoryCanvas" width="800" height="600"></canvas>
                    </div>
                </div>
                <div class="data-display">
                    <h4>基因表达沿伪时间变化</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>基因</th>
                                <th>表达趋势</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.geneExpressionAlongPseudotime?.map(gene => `
                                <tr>
                                    <td>${gene.gene}</td>
                                    <td>${gene.expression.join(', ')}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="2">暂无数据</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 导出结果
     */
    _exportResults() {
        if (!this.analysisResults) {
            Utils.showToast('没有可导出的结果', 'warning');
            return;
        }

        const csv = this._convertToCSV(this.analysisResults);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `analysis_results_${Date.now()}.csv`;
        link.click();

        Utils.showToast('结果导出成功', 'success');
    }

    /**
     * 转换为CSV格式
     * @param {Object} data - 数据对象
     * @returns {string} CSV字符串
     */
    _convertToCSV(data) {
        if (!data.results || data.results.length === 0) {
            return '暂无数据';
        }

        const headers = Object.keys(data.results[0]);
        const rows = data.results.map(row => 
            headers.map(header => row[header]).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 更新工具UI
     */
    _updateToolUI() {
        // 根据选择的工具更新UI
        console.log('更新工具UI:', this.currentTool);
    }

    /**
     * 加载保存的参数
     */
    _loadSavedParams() {
        const savedParams = storage.get('analysisParams');
        if (savedParams) {
            this.analysisParams = { ...this.analysisParams, ...savedParams };
        }
    }

    /**
     * 加载工具页面
     */
    _loadTools() {
        console.log('[Tools] 加载工具页面');
        this._showLoading();
        
        setTimeout(() => {
            this._hideLoading();
            this._runAnalysis();
        }, 500);
    }

    /**
     * 保存参数
     */
    _saveParams() {
        storage.set('analysisParams', this.analysisParams);
    }

    /**
     * 显示加载状态
     */
    _showLoading() {
        const toolsContent = document.getElementById('toolsContent');
        if (!toolsContent) return;

        toolsContent.innerHTML = '<div class="loading">分析中...</div>';
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

// 创建全局工具模块实例
const toolsModule = new ToolsModule();

// 导出工具模块（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToolsModule, toolsModule };
}

/**
 * 可视化分析模块
 * 负责可视化分析相关的功能
 */

class VisualizationModule {
    /**
     * 构造函数
     */
    constructor() {
        this.currentVizType = 'umap';
        this.currentDataset = null;
        this.currentGenes = [];
        this.currentCellTypes = [];
        this.vizParams = {
            pointSize: CONFIG.VISUALIZATION.DEFAULT_POINT_SIZE,
            opacity: CONFIG.VISUALIZATION.DEFAULT_OPACITY,
            colorScheme: CONFIG.VISUALIZATION.DEFAULT_COLOR_SCHEME
        };
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
        const updateBtn = document.getElementById('updateChartBtn');
        const exportBtn = document.getElementById('exportImgBtn');

        if (updateBtn) {
            updateBtn.addEventListener('click', () => this._updateVisualization());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this._exportImage());
        }

        const vizTypeRadios = document.querySelectorAll('input[name="viz-type"]');
        vizTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentVizType = e.target.value;
            });
        });
    }

    /**
     * 更新可视化
     */
    async _updateVisualization() {
        try {
            console.log('[Visualization] 开始更新可视化');
            const params = this._collectParams();
            this.vizParams = params;
            console.log('[Visualization] 收集到的参数:', params);

            this._showLoading();

            let data;
            let useMockData = false;
            
            try {
                let endpoint;
                switch (this.currentVizType) {
                    case 'umap':
                        endpoint = CONFIG.API.ENDPOINTS.VISUALIZATION.UMAP;
                        console.log('[Visualization] 使用UMAP端点:', endpoint);
                        break;
                    case 'spatial':
                        endpoint = CONFIG.API.ENDPOINTS.VISUALIZATION.SPATIAL_HEATMAP;
                        console.log('[Visualization] 使用空间热图端点:', endpoint);
                        break;
                    case 'joint':
                        endpoint = CONFIG.API.ENDPOINTS.VISUALIZATION.JOINT_PLOT;
                        console.log('[Visualization] 使用联合关联图端点:', endpoint);
                        break;
                    default:
                        throw new Error('未知的可视化类型');
                }

                const response = await apiClient.post(endpoint, params);
                data = response.data;
                console.log('[Visualization] API调用成功，数据:', data);
            } catch (apiError) {
                console.warn('[Visualization] API调用失败，使用模拟数据:', apiError);
                Utils.showToast('API调用失败，使用模拟数据展示', 'warning');
                data = this._generateMockData();
                useMockData = true;
                console.log('[Visualization] 生成的模拟数据:', data);
            }

            this._hideLoading();

            if (useMockData) {
                Utils.showToast('使用模拟数据展示可视化', 'info');
            } else {
                Utils.showToast('可视化更新成功', 'success');
            }

            console.log('[Visualization] 开始显示可视化');
            this._displayVisualization(data);
            console.log('[Visualization] 可视化显示完成');
        } catch (error) {
            console.error('[Visualization] 可视化更新失败:', error);
            this._hideLoading();
            Utils.showToast(error.message || '可视化更新失败', 'error');
        }
    }

    /**
     * 生成模拟数据
     * @returns {Object} 模拟数据
     */
    _generateMockData() {
        const mockData = {
            umap: {
                points: Array.from({ length: 500 }, (_, i) => ({
                    x: Math.random() * 800,
                    y: Math.random() * 600,
                    cellType: ['叶肉细胞', '表皮细胞', '维管束细胞'][Math.floor(Math.random() * 3)],
                    cluster: Math.floor(Math.random() * 5)
                })),
                cellTypes: ['叶肉细胞', '表皮细胞', '维管束细胞'],
                clusters: ['Cluster 1', 'Cluster 2', 'Cluster 3', 'Cluster 4', 'Cluster 5']
            },
            spatial: {
                points: Array.from({ length: 300 }, (_, i) => ({
                    x: Math.floor(Math.random() * 800),
                    y: Math.floor(Math.random() * 600),
                    expression: Math.random()
                })),
                cellTypes: ['叶肉细胞', '表皮细胞', '维管束细胞']
            },
            joint: {
                umapPoints: Array.from({ length: 200 }, (_, i) => ({
                    x: Math.random() * 400,
                    y: Math.random() * 400,
                    cellType: ['叶肉细胞', '表皮细胞', '维管束细胞'][Math.floor(Math.random() * 3)]
                })),
                spatialPoints: Array.from({ length: 200 }, (_, i) => ({
                    x: Math.floor(Math.random() * 400),
                    y: Math.floor(Math.random() * 400),
                    expression: Math.random()
                })),
                cellTypes: ['叶肉细胞', '表皮细胞', '维管束细胞']
            }
        };

        return mockData[this.currentVizType] || mockData.umap;
    }

    /**
     * 收集可视化参数
     * @returns {Object} 可视化参数对象
     */
    _collectParams() {
        const params = {
            datasetId: '',
            genes: [],
            cellTypes: [],
            pointSize: this.vizParams.pointSize,
            opacity: this.vizParams.opacity,
            colorScheme: this.vizParams.colorScheme
        };

        const datasetSelect = document.getElementById('vizDatasetSelect');
        if (datasetSelect) params.datasetId = datasetSelect.value;

        if (!params.datasetId || params.datasetId === '') {
            throw new Error('请先选择数据集');
        }

        const geneInput = document.getElementById('vizGeneInput');
        if (geneInput) {
            params.genes = geneInput.value.split(',').map(g => g.trim()).filter(g => g);
        }

        const cellType1 = document.getElementById('cell-type1');
        const cellType2 = document.getElementById('cell-type2');
        const cellType3 = document.getElementById('cell-type3');
        
        if (cellType1 && cellType1.checked) params.cellTypes.push('neuron');
        if (cellType2 && cellType2.checked) params.cellTypes.push('glia');
        if (cellType3 && cellType3.checked) params.cellTypes.push('endothelial');

        const pointSizeRange = document.getElementById('pointSizeRange');
        if (pointSizeRange) params.pointSize = parseInt(pointSizeRange.value);

        const opacityRange = document.getElementById('opacityRange');
        if (opacityRange) params.opacity = parseInt(opacityRange.value) / 100;

        const colorSchemeSelect = document.getElementById('colorSchemeSelect');
        if (colorSchemeSelect) params.colorScheme = colorSchemeSelect.value;

        return params;
    }

    /**
     * 显示可视化结果
     * @param {Object} data - 可视化数据
     */
    _displayVisualization(data) {
        const vizContent = document.getElementById('visualizationContent');
        if (!vizContent) return;

        let html = '';

        if (this.currentVizType === 'umap') {
            html += this._renderUMAP(data);
        } else if (this.currentVizType === 'spatial') {
            html += this._renderSpatialHeatmap(data);
        } else if (this.currentVizType === 'joint') {
            html += this._renderJointPlot(data);
        }

        vizContent.innerHTML = html;
    }

    /**
     * 渲染UMAP图
     * @param {Object} data - UMAP数据
     * @returns {string} HTML字符串
     */
    _renderUMAP(data) {
        const html = `
            <div class="visualization-content">
                <div class="visualization-panel">
                    <h3>UMAP可视化</h3>
                    <div class="viz-container" id="umapContainer">
                        <canvas id="umapCanvas" width="800" height="600"></canvas>
                    </div>
                    <div class="viz-legend">
                        <h4>图例</h4>
                        <div class="legend-items">
                            ${this._renderLegendItems(data)}
                        </div>
                    </div>
                    <div class="viz-stats">
                        <div>总点数: ${data.points?.length || 0}</div>
                        <div>细胞类型: ${data.cellTypes?.length || 0}</div>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => this._drawUMAP(data), 100);
        return html;
    }

    /**
     * 渲染空间热图
     * @param {Object} data - 空间热图数据
     * @returns {string} HTML字符串
     */
    _renderSpatialHeatmap(data) {
        const html = `
            <div class="visualization-content">
                <div class="visualization-panel">
                    <h3>空间热图</h3>
                    <div class="viz-container" id="spatialContainer">
                        <canvas id="spatialCanvas" width="800" height="600"></canvas>
                    </div>
                    <div class="viz-controls">
                        <div class="color-scale">
                            <div class="scale-label">低表达</div>
                            <div class="scale-bar"></div>
                            <div class="scale-label">高表达</div>
                        </div>
                    </div>
                    <div class="viz-stats">
                        <div>总点数: ${data.points?.length || 0}</div>
                        <div>细胞类型: ${data.cellTypes?.length || 0}</div>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => this._drawSpatialHeatmap(data), 100);
        return html;
    }

    /**
     * 渲染联合关联图
     * @param {Object} data - 联合关联图数据
     * @returns {string} HTML字符串
     */
    _renderJointPlot(data) {
        const html = `
            <div class="visualization-content">
                <div class="visualization-tools">
                    <div class="visualization-panel">
                        <h3>UMAP图</h3>
                        <div class="viz-container" id="umapContainer">
                            <canvas id="umapCanvas" width="400" height="400"></canvas>
                        </div>
                    </div>
                    <div class="visualization-panel">
                        <h3>空间图</h3>
                        <div class="viz-container" id="spatialContainer">
                            <canvas id="spatialCanvas" width="400" height="400"></canvas>
                        </div>
                    </div>
                </div>
                <div class="visualization-panel">
                    <h3>联合分析</h3>
                    <div class="viz-container" id="jointContainer">
                        <canvas id="jointCanvas" width="800" height="400"></canvas>
                    </div>
                    <div class="viz-stats">
                        <div>UMAP点数: ${data.umapPoints?.length || 0}</div>
                        <div>空间点数: ${data.spatialPoints?.length || 0}</div>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => this._drawJointPlot(data), 100);
        return html;
    }

    /**
     * 渲染图例项
     * @param {Object} data - 数据
     * @returns {string} HTML字符串
     */
    _renderLegendItems(data) {
        const cellTypes = data.cellTypes || [];
        return cellTypes.map((type, index) => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${this._getColor(index)}"></div>
                <div class="legend-label">${type}</div>
            </div>
        `).join('');
    }

    /**
     * 获取颜色
     * @param {number} index - 索引
     * @returns {string} 颜色值
     */
    _getColor(index) {
        const colors = ['#4a6fa5', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
        return colors[index % colors.length];
    }

    /**
     * 绘制UMAP图
     * @param {Object} data - UMAP数据
     */
    _drawUMAP(data) {
        const canvas = document.getElementById('umapCanvas');
        if (!canvas || !data.points) return;

        const ctx = canvas.getContext('2d');
        const { points, cellTypes } = data;
        const pointSize = this.vizParams.pointSize || 5;
        const opacity = this.vizParams.opacity || 0.7;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        points.forEach(point => {
            const colorIndex = cellTypes.indexOf(point.cellType);
            ctx.beginPath();
            ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
            ctx.fillStyle = this._getColor(colorIndex);
            ctx.globalAlpha = opacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    /**
     * 绘制空间热图
     * @param {Object} data - 空间热图数据
     */
    _drawSpatialHeatmap(data) {
        const canvas = document.getElementById('spatialCanvas');
        if (!canvas || !data.points) return;

        const ctx = canvas.getContext('2d');
        const { points } = data;
        const opacity = this.vizParams.opacity || 0.7;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        points.forEach(point => {
            const color = this._getHeatmapColor(point.expression);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    /**
     * 绘制联合关联图
     * @param {Object} data - 联合关联图数据
     */
    _drawJointPlot(data) {
        const umapCanvas = document.getElementById('umapCanvas');
        const spatialCanvas = document.getElementById('spatialCanvas');
        const jointCanvas = document.getElementById('jointCanvas');
        
        if (!umapCanvas || !spatialCanvas || !jointCanvas) return;

        const umapCtx = umapCanvas.getContext('2d');
        const spatialCtx = spatialCanvas.getContext('2d');
        const jointCtx = jointCanvas.getContext('2d');
        const { umapPoints, spatialPoints } = data;
        const pointSize = this.vizParams.pointSize || 5;
        const opacity = this.vizParams.opacity || 0.7;

        umapCtx.clearRect(0, 0, umapCanvas.width, umapCanvas.height);
        spatialCtx.clearRect(0, 0, spatialCanvas.width, spatialCanvas.height);
        jointCtx.clearRect(0, 0, jointCanvas.width, jointCanvas.height);

        umapPoints.forEach(point => {
            const colorIndex = data.cellTypes.indexOf(point.cellType);
            umapCtx.beginPath();
            umapCtx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
            umapCtx.fillStyle = this._getColor(colorIndex);
            umapCtx.globalAlpha = opacity;
            umapCtx.fill();
            umapCtx.globalAlpha = 1;
        });

        spatialPoints.forEach(point => {
            const color = this._getHeatmapColor(point.expression);
            spatialCtx.beginPath();
            spatialCtx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            spatialCtx.fillStyle = color;
            spatialCtx.globalAlpha = opacity;
            spatialCtx.fill();
            spatialCtx.globalAlpha = 1;
        });

        jointCtx.fillStyle = '#f0f0f0';
        jointCtx.fillRect(0, 0, jointCanvas.width, jointCanvas.height);
        jointCtx.font = '14px Arial';
        jointCtx.fillStyle = '#333';
        jointCtx.fillText('联合分析视图', 350, 200);
    }

    /**
     * 获取热图颜色
     * @param {number} value - 表达值
     * @returns {string} 颜色值
     */
    _getHeatmapColor(value) {
        const colors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
        const index = Math.min(Math.floor(value * colors.length), colors.length - 1);
        return colors[index];
    }

    /**
     * 导出图片
     */
    _exportImage() {
        const canvas = document.querySelector('.viz-container canvas');
        if (!canvas) {
            Utils.showToast('没有可导出的图表', 'warning');
            return;
        }

        const link = document.createElement('a');
        link.download = `visualization_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        Utils.showToast('图片导出成功', 'success');
    }

    /**
     * 加载保存的参数
     */
    _loadSavedParams() {
        const savedParams = storage.get('vizParams');
        if (savedParams) {
            this.vizParams = { ...this.vizParams, ...savedParams };
        }
    }

    /**
     * 加载可视化页面
     */
    _loadVisualization() {
        console.log('[Visualization] 加载可视化页面');
        this._showLoading();
        
        setTimeout(() => {
            this._hideLoading();
            this._updateVisualization();
        }, 500);
    }

    /**
     * 保存参数
     */
    _saveParams() {
        storage.set('vizParams', this.vizParams);
    }

    /**
     * 显示加载状态
     */
    _showLoading() {
        const vizContent = document.getElementById('visualizationContent');
        if (!vizContent) return;

        vizContent.innerHTML = '<div class="loading">加载中...</div>';
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

// 创建全局可视化模块实例
const visualizationModule = new VisualizationModule();

// 导出可视化模块（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VisualizationModule, visualizationModule };
}

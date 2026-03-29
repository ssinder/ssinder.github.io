/**
 * 主应用文件
 * 负责初始化所有模块和处理全局事件
 */

class App {
    /**
     * 构造函数
     */
    constructor() {
        this.currentPage = 'home';
        this.openTabs = [];
        this.activeTab = null;
        this.pageNames = {
            'home': '首页',
            'query': '数据查询',
            'visualization': '数据可视化',
            'tools': '分析工具',
            'download': '数据下载',
            'help': '帮助中心',
            'user': '用户中心'
        };
        this.modules = {
            query: queryModule,
            visualization: visualizationModule,
            tools: toolsModule,
            download: downloadModule,
            user: userModule
        };
    }

    /**
     * 初始化应用
     */
    init() {
        console.log('应用初始化中...');
        
        errorBoundary.setup();
        
        this._initModules();
        this._bindGlobalEvents();
        this._loadSavedTheme();
        this._initNavigation();
        
        console.log('应用初始化完成');
    }

    /**
     * 初始化所有模块
     */
    _initModules() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.init === 'function') {
                module.init();
            }
        });
    }

    /**
     * 绑定全局事件
     */
    _bindGlobalEvents() {
        this._bindNavigationEvents();
        this._bindThemeEvents();
        this._bindSearchEvents();
        this._bindPanelEvents();
        this._bindTabEvents();
    }

    /**
     * 绑定导航事件
     */
    _bindNavigationEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this._navigateToPage(page);
            });
        });

        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                if (page) {
                    this._navigateToPage(page);
                }
            });
            card.style.cursor = 'pointer';
        });
    }

    /**
     * 绑定主题事件
     */
    _bindThemeEvents() {
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            console.log('主题选择器找到:', themeSelector);
            themeSelector.addEventListener('change', (e) => {
                console.log('主题切换事件触发:', e.target.value);
                this._switchTheme(e.target.value);
            });
        } else {
            console.warn('未找到主题选择器');
        }
    }

    /**
     * 绑定搜索事件
     */
    _bindSearchEvents() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            const debouncedSearch = Utils.debounce((keyword) => {
                if (keyword) {
                    this._performSearch(keyword);
                }
            }, 500);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value.trim());
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const keyword = searchInput.value.trim();
                    if (keyword) {
                        this._performSearch(keyword);
                    }
                }
            });
        }
    }

    /**
     * 绑定面板事件
     */
    _bindPanelEvents() {
        const collapseBtn = document.getElementById('collapseBtn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this._toggleLeftPanel();
            });
        }

        const subPanelHeaders = document.querySelectorAll('.sub-panel-header');
        subPanelHeaders.forEach(header => {
            header.addEventListener('click', () => {
                this._toggleSubPanel(header);
            });
        });
    }

    /**
     * 初始化导航
     */
    _initNavigation() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page') || 'home';
        this._navigateToPage(page);
    }

    /**
     * 导航到指定页面
     * @param {string} page - 页面名称
     */
    _navigateToPage(page) {
        if (!page) return;

        this.currentPage = page;
        this._addOrUpdateTab(page);

        this._updateNavigationState(page);
        this._updatePageContent(page);
        this._updateLeftPanel(page);
        this._updateUrl(page);

        if (page === 'home') {
            this._animateStats();
        }

        console.log('导航到页面:', page);
    }

    _animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const target = parseInt(stat.dataset.count) || 0;
            const duration = 2000;
            const start = 0;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(start + (target - start) * easeOut);
                
                stat.textContent = current.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    stat.textContent = target.toLocaleString() + '+';
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    /**
     * 更新导航状态
     * @param {string} page - 页面名称
     */
    _updateNavigationState(page) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            if (card.dataset.page === page) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    /**
     * 更新页面内容
     * @param {string} page - 页面名称
     */
    _updatePageContent(page) {
        const pageContents = document.querySelectorAll('.page-content');
        pageContents.forEach(content => {
            content.classList.remove('active');
        });

        const targetContent = document.getElementById(`${page}Content`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        this._loadPageData(page);
    }

    /**
     * 加载页面数据
     * @param {string} page - 页面名称
     */
    _loadPageData(page) {
        switch(page) {
            case 'query':
                if (this.modules.query && typeof this.modules.query._loadQuery === 'function') {
                    this.modules.query._loadQuery();
                }
                break;
            case 'visualization':
                if (this.modules.visualization && typeof this.modules.visualization._loadVisualization === 'function') {
                    this.modules.visualization._loadVisualization();
                }
                break;
            case 'tools':
                if (this.modules.tools && typeof this.modules.tools._loadTools === 'function') {
                    this.modules.tools._loadTools();
                }
                break;
            case 'download':
                if (this.modules.download && typeof this.modules.download._loadDownloads === 'function') {
                    this.modules.download._loadDownloads();
                }
                break;
            case 'help':
                break;
            case 'home':
                break;
            default:
                break;
        }
    }

    /**
     * 更新左侧面板
     * @param {string} page - 页面名称
     */
    _updateLeftPanel(page) {
        const leftPanel = document.getElementById('leftPanel');
        if (!leftPanel) return;

        const allPanels = leftPanel.querySelectorAll('.panel-content');
        allPanels.forEach(panel => {
            panel.style.display = 'none';
        });

        switch(page) {
            case 'home':
                leftPanel.style.display = 'none';
                break;
            case 'query':
                leftPanel.style.display = 'block';
                document.getElementById('queryPanel').style.display = 'block';
                break;
            case 'visualization':
                leftPanel.style.display = 'block';
                document.getElementById('visualizationPanel').style.display = 'block';
                break;
            case 'tools':
                leftPanel.style.display = 'block';
                document.getElementById('toolsPanel').style.display = 'block';
                break;
            case 'download':
                leftPanel.style.display = 'block';
                document.getElementById('downloadPanel').style.display = 'block';
                break;
            case 'help':
                leftPanel.style.display = 'block';
                document.getElementById('helpPanel').style.display = 'block';
                break;
            default:
                leftPanel.style.display = 'block';
                document.getElementById('queryPanel').style.display = 'block';
                break;
        }
    }

    /**
     * 更新URL
     * @param {string} page - 页面名称
     */
    _updateUrl(page) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        window.history.replaceState({}, '', url);
    }

    /**
     * 切换主题
     * @param {string} themeName - 主题名称
     */
    _switchTheme(themeName) {
        const themeLinks = {
            'theme-mint-green': document.getElementById('theme-mint-green'),
            'theme-classic-blue': document.getElementById('theme-classic-blue'),
            'theme-clean-gray': document.getElementById('theme-clean-gray'),
            'theme-vibrant-teal': document.getElementById('theme-vibrant-teal'),
            'theme-high-contrast': document.getElementById('theme-high-contrast')
        };

        Object.entries(themeLinks).forEach(([name, link]) => {
            if (link) {
                if (name === themeName) {
                    link.disabled = false;
                    link.media = 'all';
                } else {
                    link.disabled = true;
                    link.media = 'not all';
                }
            }
        });

        document.documentElement.setAttribute('data-theme', themeName);
        
        storage.set(CONFIG.THEME.STORAGE_KEY, themeName);
        console.log('切换主题:', themeName);
        
        Utils.showToast(`已切换到${CONFIG.THEME.THEMES[themeName] || themeName}`, 'success');
    }

    /**
     * 加载保存的主题
     */
    _loadSavedTheme() {
        const savedTheme = storage.get(CONFIG.THEME.STORAGE_KEY, CONFIG.THEME.DEFAULT);
        const themeSelector = document.getElementById('themeSelector');
        
        if (themeSelector) {
            themeSelector.value = savedTheme;
        }
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        this._switchTheme(savedTheme);
    }

    /**
     * 执行搜索
     * @param {string} keyword - 搜索关键词
     */
    async _performSearch(keyword) {
        try {
            console.log('搜索:', keyword);
            
            let data;
            let useMockData = false;
            try {
                const response = await apiClient.get(
                    CONFIG.API.ENDPOINTS.SEARCH.SEARCH,
                    {
                        keyword: keyword,
                        type: 'all',
                        page: 1,
                        pageSize: 10
                    }
                );
                data = response.data;
            } catch (apiError) {
                console.warn('搜索API调用失败，使用模拟数据:', apiError);
                Utils.showToast('搜索API调用失败，使用模拟数据展示', 'warning');
                data = this._generateSearchMockData(keyword);
                useMockData = true;
            }

            if (useMockData) {
                Utils.showToast('使用模拟数据展示搜索结果', 'info');
            } else {
                Utils.showToast('搜索完成', 'success');
            }

            this._displaySearchResults(data);
        } catch (error) {
            console.error('搜索失败:', error);
            Utils.showToast(error.message || '搜索失败', 'error');
        }
    }

    /**
     * 生成搜索模拟数据
     * @param {string} keyword - 搜索关键词
     * @returns {Object} 模拟搜索结果
     */
    _generateSearchMockData(keyword) {
        const mockResults = [
            {
                id: 'DS001',
                type: '转录组',
                title: '油菜叶片转录组数据集',
                description: '包含油菜叶片在不同发育阶段的转录组数据，涵盖光合作用、代谢途径等多种基因表达信息。',
                species: '油菜',
                tissue: '叶片',
                platform: 'RNA-seq'
            },
            {
                id: 'DS002',
                type: '转录组',
                title: '油菜种子发育转录组数据集',
                description: '高分辨率种子发育各阶段的转录组数据，提供基因表达的时空分布信息。',
                species: '油菜',
                tissue: '种子',
                platform: 'RNA-seq'
            },
            {
                id: 'DS003',
                type: '多组学整合',
                title: '油菜根系多组学数据集',
                description: '整合了转录组、表观遗传组和代谢组数据的多组学数据集。',
                species: '油菜',
                tissue: '根系',
                platform: 'Multi-omics'
            }
        ];

        const filteredResults = mockResults.filter(item => 
            !keyword || 
            item.title.toLowerCase().includes(keyword.toLowerCase()) ||
            item.description.toLowerCase().includes(keyword.toLowerCase()) ||
            item.type.toLowerCase().includes(keyword.toLowerCase())
        );

        return {
            total: filteredResults.length,
            results: filteredResults
        };
    }

    /**
     * 显示搜索结果
     * @param {Object} data - 搜索结果数据
     */
    _displaySearchResults(data) {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;

        let html = `
            <div class="overview-panel">
                <h2>搜索结果</h2>
                <p>找到 ${data.total || 0} 条结果</p>
            </div>
        `;

        if (data.results && data.results.length > 0) {
            html += '<div class="data-grid">';
            html += data.results.map(result => `
                <div class="data-card">
                    <div class="card-header">${result.title || result.name}</div>
                    <div class="card-meta">
                        <div>类型: ${result.type}</div>
                        <div>${result.description || ''}</div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary btn-sm" data-action="view" data-id="${result.id}">查看</button>
                    </div>
                </div>
            `).join('');
            html += '</div>';
        } else {
            html += '<div class="empty-state">未找到相关结果</div>';
        }

        contentArea.innerHTML = html;
    }

    /**
     * 切换左侧面板
     */
    _toggleLeftPanel() {
        const leftPanel = document.getElementById('leftPanel');
        if (leftPanel) {
            leftPanel.classList.toggle('collapsed');
        }
    }

    /**
     * 切换子面板
     * @param {HTMLElement} header - 子面板头部元素
     */
    _toggleSubPanel(header) {
        const content = header.nextElementSibling;
        const arrow = header.querySelector('.arrow');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            if (arrow) arrow.textContent = '▼';
            header.setAttribute('aria-expanded', 'true');
        } else {
            content.style.display = 'none';
            if (arrow) arrow.textContent = '▶';
            header.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;

        contentArea.innerHTML = '<div class="loading">加载中...</div>';
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * 绑定标签栏事件
     */
    _bindTabEvents() {
        const tabBar = document.querySelector('.tab-bar');
        if (!tabBar) return;

        tabBar.addEventListener('click', (e) => {
            const tabClose = e.target.closest('.tab-close');
            const tabItem = e.target.closest('.tab-item');

            if (tabClose) {
                e.stopPropagation();
                const tab = tabClose.closest('.tab-item');
                const page = tab.dataset.page;
                this._closeTab(page);
            } else if (tabItem) {
                const page = tabItem.dataset.page;
                if (page) {
                    this._navigateToPage(page);
                }
            }
        });
    }

    /**
     * 添加或更新标签
     * @param {string} page - 页面名称
     */
    _addOrUpdateTab(page) {
        if (page === 'home') return;

        const existingTab = this.openTabs.find(tab => tab.page === page);
        if (!existingTab) {
            this.openTabs.push({ page, title: this.pageNames[page] || page });
        }
        
        this.activeTab = page;
        this._renderTabs();
    }

    /**
     * 关闭标签
     * @param {string} page - 页面名称
     */
    _closeTab(page) {
        const tabIndex = this.openTabs.findIndex(tab => tab.page === page);
        if (tabIndex === -1) return;

        this.openTabs.splice(tabIndex, 1);

        if (this.activeTab === page) {
            if (this.openTabs.length > 0) {
                const newIndex = Math.min(tabIndex, this.openTabs.length - 1);
                this._navigateToPage(this.openTabs[newIndex].page);
            } else {
                this._navigateToPage('home');
            }
        } else {
            this._renderTabs();
        }
    }

    /**
     * 渲染标签栏
     */
    _renderTabs() {
        const tabBar = document.querySelector('.tab-bar');
        if (!tabBar) return;

        tabBar.innerHTML = this.openTabs.map(tab => `
            <div class="tab-item ${tab.page === this.activeTab ? 'active' : ''}" 
                 role="tab" 
                 aria-selected="${tab.page === this.activeTab}" 
                 tabindex="0"
                 data-page="${tab.page}">
                <span class="tab-title">${tab.title}</span>
                <span class="tab-close" role="button" aria-label="关闭标签">&times;</span>
            </div>
        `).join('');
    }
}

// 创建全局应用实例
const app = new App();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出应用实例（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, app };
}

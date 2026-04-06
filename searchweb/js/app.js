/**
 * 主应用模块
 * 协调数据加载、查询和UI展示
 * 使用主线程查询 + 自动补全
 */

const App = (function() {
    let isDataLoaded = false;
    let autocompleteTimeout = null;

    /**
     * 初始化应用
     */
    async function init() {
        console.log('[DEBUG] 初始化应用...');
        
        UIManager.showLoading();
        
        try {
            const data = await DataManager.loadData();
            isDataLoaded = true;
            console.log('[DEBUG] 数据加载成功，应用初始化完成, data:', !!data);
            
            UIManager.hideLoading();
            UIManager.focusInput();
            
        } catch (error) {
            console.error('[ERROR] 应用初始化失败:', error);
            UIManager.showError('数据加载失败，请刷新页面重试。错误信息: ' + error.message);
        }
    }

    /**
     * 执行查询
     */
    function performSearch() {
        console.log('[DEBUG] performSearch 被调用');
        const geneId = UIManager.getGeneInput();
        console.log('[DEBUG] 输入的基因ID:', geneId);
        
        if (!geneId) {
            console.log('[DEBUG] 基因ID为空');
            UIManager.showError('请输入基因 ID');
            UIManager.focusInput();
            return;
        }

        if (!isDataLoaded) {
            console.log('[DEBUG] 数据未加载');
            UIManager.showError('数据正在加载中，请稍候...');
            return;
        }

        console.log(`[DEBUG] 执行查询: ${geneId}`);
        UIManager.showLoading();
        hideAutocomplete();

        try {
            // 直接使用主线程查询
            const results = DataManager.queryByGene(geneId);
            console.log(`[DEBUG] 查询完成，结果数量: ${results.length}`);
            UIManager.hideLoading();
            UIManager.showResults(results);
            
        } catch (error) {
            console.error('[ERROR] 查询失败:', error);
            UIManager.hideLoading();
            UIManager.showError('查询失败，请重试。错误信息: ' + error.message);
        }
    }

    /**
     * 自动补全搜索
     */
    function handleAutocomplete() {
        const query = UIManager.getGeneInput();
        
        if (autocompleteTimeout) {
            clearTimeout(autocompleteTimeout);
        }

        if (!query || query.length < 2) {
            hideAutocomplete();
            return;
        }

        autocompleteTimeout = setTimeout(() => {
            try {
                const suggestions = DataManager.fuzzySearch(query, 10);
                showAutocomplete(suggestions);
            } catch (e) {
                console.error('[ERROR] 自动补全失败:', e);
            }
        }, 200);
    }

    /**
     * 显示自动补全列表
     */
    function showAutocomplete(suggestions) {
        const container = document.getElementById('autocomplete-container');
        if (!container) return;

        if (suggestions.length === 0) {
            hideAutocomplete();
            return;
        }

        const list = container.querySelector('.autocomplete-list');
        list.innerHTML = suggestions.map(s => `
            <div class="autocomplete-item" data-gene="${s.geneName}">
                <span class="autocomplete-gene">${s.geneName}</span>
                <span class="autocomplete-protein">${s.proteinName || ''}</span>
            </div>
        `).join('');

        // 绑定点击事件
        list.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const gene = item.dataset.gene;
                UIManager.elements.geneInput.value = gene;
                hideAutocomplete();
                performSearch();
            });
        });

        container.style.display = 'block';
    }

    /**
     * 隐藏自动补全列表
     */
    function hideAutocomplete() {
        const container = document.getElementById('autocomplete-container');
        if (container) {
            container.style.display = 'none';
        }
        if (autocompleteTimeout) {
            clearTimeout(autocompleteTimeout);
            autocompleteTimeout = null;
        }
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        const { geneInput, searchBtn } = UIManager.elements;

        console.log('[DEBUG] 绑定事件, searchBtn:', searchBtn, 'geneInput:', geneInput);

        // 搜索按钮点击事件
        searchBtn.addEventListener('click', function() {
            console.log('[DEBUG] 搜索按钮被点击');
            performSearch();
        });

        // 输入框回车事件
        geneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // 输入时清除错误信息 + 自动补全
        geneInput.addEventListener('input', function() {
            UIManager.hideError();
            handleAutocomplete();
        });

        // 点击页面其他位置隐藏自动补全
        document.addEventListener('click', function(e) {
            const container = document.getElementById('autocomplete-container');
            const input = geneInput;
            if (container && !container.contains(e.target) && e.target !== input) {
                hideAutocomplete();
            }
        });

        // 页面卸载前提醒
        window.addEventListener('beforeunload', function(e) {
            if (!isDataLoaded) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * 启动应用
     */
    function start() {
        bindEvents();
        init();
    }

    return {
        start,
        performSearch
    };
})();

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOMContentLoaded 事件触发');
    try {
        App.start();
    } catch (e) {
        console.error('[ERROR] App.start() 失败:', e);
    }
});

// DOM元素获取
const collapseBtn = document.getElementById('collapseBtn');
const leftPanel = document.getElementById('leftPanel');
const navItems = document.querySelectorAll('.nav-item');
const tabItems = document.querySelectorAll('.tab-item');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const pageContents = document.querySelectorAll('.page-content');

// 侧边栏折叠功能
collapseBtn.addEventListener('click', function() {
    leftPanel.classList.toggle('collapsed');
    if (leftPanel.classList.contains('collapsed')) {
        collapseBtn.textContent = '≡';
    } else {
        collapseBtn.textContent = '≡';
    }
});

// 导航菜单切换
navItems.forEach(item => {
    item.addEventListener('click', function() {
        // 移除所有活动状态
        navItems.forEach(nav => nav.classList.remove('active'));
        // 添加当前活动状态
        this.classList.add('active');
        
        // 切换页面内容
        const page = this.dataset.page;
        switchPage(page);
    });
});

// 页面切换函数
function switchPage(page) {
    // 隐藏所有页面内容
    pageContents.forEach(content => content.classList.remove('active'));
    
    // 显示对应页面内容
    const targetContent = document.getElementById(`${page}Content`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // 调整左侧面板内容
    adjustLeftPanel(page);
    
    console.log('切换到页面:', page);
}

// 调整左侧面板内容
function adjustLeftPanel(page) {
    const leftPanel = document.getElementById('leftPanel');
    
    // 隐藏所有面板内容
    const allPanels = leftPanel.querySelectorAll('.panel-content');
    allPanels.forEach(panel => {
        panel.style.display = 'none';
    });
    
    // 根据页面类型显示对应的左侧面板
    switch(page) {
        case 'home':
            // 首页不显示左侧面板
            leftPanel.style.display = 'none';
            break;
        case 'query':
            // 显示查询面板
            leftPanel.style.display = 'block';
            document.getElementById('queryPanel').style.display = 'block';
            break;
        case 'visualization':
            // 显示可视化面板
            leftPanel.style.display = 'block';
            document.getElementById('visualizationPanel').style.display = 'block';
            break;
        case 'tools':
            // 显示工具面板
            leftPanel.style.display = 'block';
            document.getElementById('toolsPanel').style.display = 'block';
            break;
        case 'download':
            // 显示下载面板
            leftPanel.style.display = 'block';
            document.getElementById('downloadPanel').style.display = 'block';
            break;
        case 'help':
            // 显示帮助面板
            leftPanel.style.display = 'block';
            document.getElementById('helpPanel').style.display = 'block';
            break;
        default:
            // 默认显示查询面板
            leftPanel.style.display = 'block';
            document.getElementById('queryPanel').style.display = 'block';
            break;
    }
}

// 标签页切换
tabItems.forEach(item => {
    item.addEventListener('click', function() {
        // 移除所有活动状态
        tabItems.forEach(tab => tab.classList.remove('active'));
        // 添加当前活动状态
        this.classList.add('active');
    });
});

// 标签页关闭
document.querySelectorAll('.tab-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const tabItem = this.parentElement;
        if (tabItems.length > 1) {
            tabItem.remove();
            // 激活第一个标签页
            document.querySelector('.tab-item').classList.add('active');
        }
    });
});

// 视图切换
toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // 移除所有活动状态
        toggleBtns.forEach(t => t.classList.remove('active'));
        // 添加当前活动状态
        this.classList.add('active');
        
        // 这里可以添加视图切换逻辑
        const view = this.textContent;
        console.log('切换到视图:', view);
    });
});

// 子面板折叠/展开
document.querySelectorAll('.sub-panel-header').forEach(header => {
    header.addEventListener('click', function() {
        const content = this.nextElementSibling;
        const arrow = this.querySelector('span:last-child');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            arrow.textContent = '▼';
        } else {
            content.style.display = 'none';
            arrow.textContent = '▶';
        }
    });
});

// 搜索框功能
const searchInput = document.querySelector('.search-input');
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const keyword = this.value;
        console.log('搜索:', keyword);
        // 这里可以添加搜索逻辑
    }
});

// 模拟数据加载
function simulateLoading() {
    const contentArea = document.querySelector('.content-area');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = '加载中';
    
    contentArea.appendChild(loadingDiv);
    
    setTimeout(() => {
        loadingDiv.remove();
    }, 1000);
}

// 页面加载完成后的初始化
window.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');
    
    // 默认显示首页
    switchPage('home');
    
    // 为首页添加动画效果
    const homeContent = document.getElementById('homeContent');
    if (homeContent) {
        homeContent.classList.add('active');
    }
});

// 数据查询功能
function performQuery() {
    // 收集查询条件
    const queryConditions = {
        dataTypes: [],
        species: '',
        brainRegion: '',
        genes: ''
    };
    
    // 这里可以添加收集查询条件的逻辑
    
    console.log('执行查询:', queryConditions);
    
    // 模拟查询结果
    simulateLoading();
    
    setTimeout(() => {
        // 这里可以添加显示查询结果的逻辑
        console.log('查询完成');
    }, 1500);
}

// 绑定查询按钮事件
const queryBtn = document.querySelector('.btn-primary');
if (queryBtn) {
    queryBtn.addEventListener('click', performQuery);
}

// 重置按钮事件
const resetBtn = document.querySelector('.btn-secondary:nth-child(2)');
if (resetBtn) {
    resetBtn.addEventListener('click', function() {
        // 重置查询条件
        console.log('重置查询条件');
    });
}

// 保存条件按钮事件
const saveBtn = document.querySelector('.btn-secondary:nth-child(3)');
if (saveBtn) {
    saveBtn.addEventListener('click', function() {
        // 保存查询条件
        console.log('保存查询条件');
    });
}

// 数据卡片操作
const cardActions = document.querySelectorAll('.card-actions .btn');
cardActions.forEach(action => {
    action.addEventListener('click', function() {
        const actionType = this.textContent;
        const card = this.closest('.data-card');
        const datasetName = card.querySelector('.card-header').textContent;
        
        console.log(`${actionType}操作:`, datasetName);
        
        // 根据操作类型执行不同的逻辑
        switch(actionType) {
            case '可视化':
                // 切换到可视化页面
                switchPage('visualization');
                break;
            case '详情':
                // 显示数据集详情
                showDatasetDetail(datasetName);
                break;
            case '下载':
                // 执行下载操作
                downloadDataset(datasetName);
                break;
        }
    });
});

// 显示数据集详情
function showDatasetDetail(datasetName) {
    console.log('显示数据集详情:', datasetName);
    // 这里可以添加显示详情的逻辑
}

// 下载数据集
function downloadDataset(datasetName) {
    console.log('下载数据集:', datasetName);
    // 这里可以添加下载逻辑
}

// 分页功能
const pageBtns = document.querySelectorAll('.page-btn');
pageBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.textContent === '上一页' || this.textContent === '下一页') {
            console.log('翻页:', this.textContent);
        } else {
            // 移除所有活动状态
            pageBtns.forEach(pgBtn => pgBtn.classList.remove('active'));
            // 添加当前活动状态
            this.classList.add('active');
            console.log('跳转到页面:', this.textContent);
        }
    });
});

// 主题切换功能
const themeSelector = document.getElementById('themeSelector');
const themeLinks = {
    'theme-classic-blue': document.getElementById('theme-classic-blue'),
    'theme-clean-gray': document.getElementById('theme-clean-gray'),
    'theme-vibrant-teal': document.getElementById('theme-vibrant-teal'),
    'theme-high-contrast': document.getElementById('theme-high-contrast')
};

// 从localStorage加载保存的主题
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && themeLinks[savedTheme]) {
        themeSelector.value = savedTheme;
        applyTheme(savedTheme);
    } else {
        // 默认使用经典科研蓝调主题
        applyTheme('theme-classic-blue');
    }
}

// 应用主题
function applyTheme(themeName) {
    // 禁用所有主题CSS
    Object.values(themeLinks).forEach(link => {
        if (link) {
            link.disabled = true;
        }
    });
    
    // 启用选中的主题CSS
    if (themeLinks[themeName]) {
        themeLinks[themeName].disabled = false;
    }
    
    // 保存到localStorage
    localStorage.setItem('selectedTheme', themeName);
    
    console.log('切换主题:', themeName);
}

// 主题选择器事件监听
if (themeSelector) {
    themeSelector.addEventListener('change', function() {
        const selectedTheme = this.value;
        applyTheme(selectedTheme);
    });
}

// 页面加载时应用保存的主题
window.addEventListener('DOMContentLoaded', function() {
    loadSavedTheme();
});
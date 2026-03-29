/**
 * 前端配置文件
 * 包含API接口配置、主题配置、其他全局配置
 */

const CONFIG = {
    // API接口配置
    API: {
        BASE_URL: 'http://127.0.0.1:5001',
        ENDPOINTS: {
            // 数据查询接口
            QUERY: {
                DATASETS: '/api/query/datasets',
                SAVE_TEMPLATE: '/api/query/save-template',
                TEMPLATES: '/api/query/templates'
            },
            // 可视化分析接口
            VISUALIZATION: {
                UMAP: '/api/visualization/umap',
                SPATIAL_HEATMAP: '/api/visualization/spatial-heatmap',
                JOINT_PLOT: '/api/visualization/joint-plot'
            },
            // 在线工具接口
            TOOLS: {
                DIFFERENTIAL_EXPRESSION: '/api/tools/differential-expression',
                ENRICHMENT: '/api/tools/enrichment',
                CELL_COMMUNICATION: '/api/tools/cell-communication',
                TRAJECTORY: '/api/tools/trajectory'
            },
            // 数据下载接口
            DOWNLOAD: {
                FILES: '/api/download/files',
                FILE: '/api/download/file',
                HISTORY: '/api/download/history'
            },
            // 用户管理接口
            USER: {
                REGISTER: '/api/user/register',
                LOGIN: '/api/user/login',
                PROFILE: '/api/user/profile',
                FAVORITES: '/api/user/favorites'
            },
            // 全局搜索接口
            SEARCH: {
                SEARCH: '/api/search',
                SUGGEST: '/api/search/suggest'
            }
        },
        TIMEOUT: 30000,
        RETRY_TIMES: 3
    },

    // 主题配置
    THEME: {
        DEFAULT: 'theme-mint-green',
        THEMES: {
            'theme-mint-green': '清新薄荷绿',
            'theme-classic-blue': '经典深蓝夜',
            'theme-clean-gray': '清新学术浅灰',
            'theme-vibrant-teal': '活力科研青绿',
            'theme-high-contrast': '高对比度无障碍'
        },
        STORAGE_KEY: 'selectedTheme'
    },

    // 分页配置
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
        MAX_PAGE_SIZE: 100
    },

    // 文件上传配置
    UPLOAD: {
        MAX_SIZE: 16 * 1024 * 1024, // 16MB
        ALLOWED_TYPES: ['h5', 'h5ad', 'csv', 'xlsx', 'txt']
    },

    // 可视化配置
    VISUALIZATION: {
        DEFAULT_POINT_SIZE: 5,
        DEFAULT_OPACITY: 0.7,
        DEFAULT_COLOR_SCHEME: 'viridis',
        COLOR_SCHEMES: ['viridis', 'plasma', 'inferno', 'magma', 'cividis']
    },

    // 工具配置
    TOOLS: {
        DEFAULT_P_VALUE: 0.05,
        DEFAULT_FDR: 0.1,
        P_VALUE_OPTIONS: [0.01, 0.05, 0.1],
        FDR_OPTIONS: [0.05, 0.1, 0.2]
    },

    // 本地存储配置
    STORAGE: {
        USER_TOKEN_KEY: 'userToken',
        USER_INFO_KEY: 'userInfo',
        QUERY_HISTORY_KEY: 'queryHistory',
        FAVORITES_KEY: 'favorites'
    },

    // 日志配置
    LOG: {
        ENABLE: true,
        LEVEL: 'INFO',
        PREFIX: '[BrainDB]'
    },

    // 动画配置
    ANIMATION: {
        FADE_IN_DURATION: 300,
        TRANSITION_DURATION: 300
    },

    // 响应式断点
    BREAKPOINTS: {
        SM: 576,
        MD: 768,
        LG: 992,
        XL: 1200,
        XXL: 1400
    }
};

// 导出配置对象（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

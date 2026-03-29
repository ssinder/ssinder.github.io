# 前端项目结构说明

## 项目简介
油菜单细胞转录组数据可视化分析平台 - 纯前端网页应用

## 目录结构

```
frontend/
├── index.html          # 主入口页面
├── config/             # 配置文件
├── assets/             # 静态资源
│   ├── css/            # 样式文件
│   └── js/             # 脚本文件
├── modules/            # 页面模块
└── utils/              # 工具函数
```

## 核心文件

### 入口文件
- **index.html** - 主入口页面，包含页面结构和模块加载

### 配置目录 (config/)
- **config.js** - 全局配置，包含主题、分页、上传、可视化等配置项

### 样式目录 (assets/css/)
| 文件 | 说明 |
|------|------|
| main.css | 核心样式，包含布局、组件、动画等 |
| theme-mint-green.css | 清新薄荷绿主题 |
| theme-classic-blue.css | 经典深蓝主题 |
| theme-clean-gray.css | 清新学术浅灰主题 |
| theme-vibrant-teal.css | 活力科研青绿主题 |
| theme-high-contrast.css | 高对比度无障碍主题 |

### 脚本目录 (assets/js/)
- **main.js** - 主控制器，负责初始化、导航、主题切换等核心逻辑

### 页面模块 (modules/)
| 模块 | 文件 | 功能 |
|------|------|------|
| 数据查询 | query/query.js | 多维度数据筛选、搜索 |
| 可视化分析 | visualization/visualization.js | UMAP、t-SNE、热图、小提琴图等 |
| 在线工具 | tools/tools.js | 差异基因分析、GO/KEGG富集分析等 |
| 数据下载 | download/download.js | 多格式数据下载 |
| 用户中心 | user/user.js | 用户登录、个人信息 |

### 工具函数 (utils/)
| 文件 | 功能 |
|------|------|
| utils.js | 通用工具函数（格式化、提示框等） |
| storage.js | 本地存储封装 |
| mock-data.js | 模拟数据生成 |
| api.js | API请求封装 |
| validator.js | 数据验证 |
| error-boundary.js | 错误边界处理 |

## 主题系统

支持5种主题切换：
1. 清新薄荷绿 (默认)
2. 经典深蓝夜
3. 清新学术浅灰
4. 活力科研青绿
5. 高对比度无障碍

主题通过CSS变量实现，存储在 localStorage 中持久化。

## 运行方式

直接用浏览器打开 `index.html` 即可运行，无需构建步骤。

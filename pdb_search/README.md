# PDB Search - 蛋白质结构数据库搜索平台

## 项目简介

PDB Search 是一个用于搜索和分析蛋白质结构数据的前端应用平台。

## 主要功能

### 1. 搜索功能
- **关键词搜索**：支持按蛋白质名称、关键词、生物体名称、UniProt Accession ID 进行搜索
- **自动补全**：输入时提供实时搜索建议（≥2个字符触发）
- **布尔查询**：支持 AND、OR、NOT 运算符进行复杂查询
  - 示例：`lysozyme AND bacterial`
  - 示例：`antimicrobial OR defense`
  - 示例：`NOT viral`

### 2. 过滤功能
- **序列长度过滤**：按最小/最大长度范围筛选
- **生物体过滤**：按物种来源筛选
- **关键词过滤**：按蛋白质功能关键词筛选
- 支持组合使用多个过滤条件

### 3. 数据可视化
- **蛋白质卡片网格**：以卡片形式展示蛋白质信息
- **结构图像展示**：使用精灵图（Spritesheet）优化图像加载性能
- **详细信息弹窗**：点击卡片查看完整的蛋白质详情

### 4. 分页与导航
- **可配置分页**：用户可自定义每页显示数量
- **无限滚动模式**：可选的无限滚动加载
- **快速导航**：跳转到指定页面

### 5. 导出功能
- 导出搜索结果为 CSV 格式
- 支持自定义导出字段

### 6. 统计分析
- 数据统计面板，显示总数和过滤后数量

## 技术架构

### 目录结构

```
pdb_search/
├── index.html                 # 主页面入口
├── css/
│   └── style.css             # 样式表
├── js/                       # JavaScript 模块化脚本
│   ├── app.js               # 主应用逻辑和初始化
│   ├── dataService.js       # 数据加载和缓存管理
│   ├── filterService.js     # 搜索和过滤逻辑
│   ├── statisticsService.js # 统计分析服务
│   ├── paginationService.js # 分页控制
│   ├── exportService.js     # 数据导出
│   ├── imageService.js      # 图像服务
│   ├── spriteSheetService.js# 精灵图管理
│   ├── sequenceAnalysisService.js # 序列分析
│   └── ui.js                # UI 组件和交互
├── assets/
│   ├── spritesheets/        # 蛋白质结构图像精灵图
│   │   ├── spritesheet_0.webp
│   │   ├── spritesheet_1.webp
│   │   └── spritesheet_2.webp
│   └── spritesheet_manifest.json  # 精灵图坐标映射
├── data/
│   └── uniprot_proteins_updated.csv  # UniProt 蛋白质数据
└── scripts/
    └── create_spritesheet_webp.py   # 精灵图生成脚本
```

### 核心技术特点

1. **模块化架构**：各功能模块独立，便于维护和扩展
2. **本地缓存**：使用 localStorage 缓存数据，减少重复加载（24小时过期）
3. **图像优化**：精灵图技术减少 HTTP 请求，提升加载速度
4. **响应式设计**：适配不同屏幕尺寸
5. **无框架依赖**：纯原生 JavaScript 实现，轻量高效

## 数据源

- **UniProt 蛋白质数据**：从 UniProt 数据库导入的蛋白质信息
- **蛋白质结构图像**：存储为精灵图格式的结构可视化图像

## 使用说明

### 快速开始

1. 直接在浏览器中打开 `index.html` 文件
2. 系统会自动加载蛋白质数据
3. 使用搜索框或过滤器查找蛋白质

### 搜索语法

**简单搜索**：
- 输入关键词（如 "lysozyme"、"antimicrobial"）

**布尔搜索**：
- `keyword1 AND keyword2` - 两个关键词都包含
- `keyword1 OR keyword2` - 包含任一关键词
- `NOT keyword` - 不包含该关键词
- 可以组合使用：`lysozyme AND bacterial NOT viral`

### 用户偏好

- 系统会自动保存用户的分页设置和显示偏好
- 偏好存储在浏览器 localStorage 中

## 性能优化

- **数据缓存**：首次加载后缓存到 localStorage
- **延迟加载**：图像按需加载
- **防抖处理**：搜索建议使用 300ms 防抖
- **精灵图合并**：多个小图像合并为大图，减少请求数

## 浏览器兼容性

支持所有现代浏览器：
- Chrome / Edge
- Firefox
- Safari
- Opera

## 开发说明

如需重新生成精灵图，运行 Python 脚本：

```bash
python scripts/create_spritesheet_webp.py
```


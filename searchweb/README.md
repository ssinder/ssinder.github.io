# 蛋白互作信息查询系统

纯前端网页应用，用于查询基因/蛋白的互作信息。

## 文件结构

```
searchweb/
├── index.html                    # 主页面
├── css/
│   └── style.css                 # 样式文件（响应式设计，支持手机端）
├── js/
│   ├── data.js                   # 数据加载与查询模块
│   ├── ui.js                     # UI管理模块
│   └── app.js                    # 主应用模块
├── data/
│   └── protein_interactions_complete.json  # 蛋白互作数据 (约30MB)
└── SPEC.md                       # 需求规格说明
```

## 功能特性

| 功能 | 说明 |
|------|------|
| 基因ID查询 | 精确匹配 + 模糊搜索 |
| 自动补全 | 输入时显示候选基因列表 |
| 蛋白信息 | 显示 UniProt ID、基因名、蛋白长度、功能描述、关键词 |
| 互作信息 | 显示蛋白互作伙伴及置信度分数（高/中/低） |
| 本地缓存 | 使用 IndexedDB 缓存数据，第二次访问秒级加载 |
| 响应式设计 | 支持桌面端和移动端（手机/平板） |

## 技术实现

- **数据存储**：~30MB JSON 文件，含 14,445 个蛋白和 1,889,952 条互作关系
- **查询优化**：Map 索引结构，O(1) 复杂度查询
- **缓存机制**：IndexedDB 本地存储，避免重复加载
- **无后端**：纯 HTML/CSS/JS，单页面应用

## 使用方法

1. 启动本地服务器：
   ```bash
   cd searchweb
   python3 -m http.server 8080
   ```

2. 浏览器访问：`http://localhost:8080`

3. 输入基因 ID（如 `SS1G_02922`）进行查询

## 依赖数据来源

数据来自 `dataprocess` 目录处理后的 `protein_interactions_complete.json`，整合了：
- UniProt 蛋白信息（基因名、蛋白名、功能、GO注释等）
- STRING 数据库互作数据（置信度分数）
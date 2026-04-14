# Protein Structure Database

纯前端蛋白信息展示网站，用于展示抗菌蛋白结构数据。

## 项目结构

```
pdbweb/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 应用主逻辑（初始化、事件处理）
│   ├── dataService.js      # 数据加载与处理服务（含localStorage缓存）
│   ├── filterService.js    # 筛选与搜索服务（含布尔搜索、建议缓存）
│   ├── ui.js               # UI渲染模块
│   ├── imageService.js     # 图片加载服务（Spritesheet模式）
│   ├── spriteSheetService.js  # Spritesheet图片定位服务
│   ├── statisticsService.js   # 数据统计分析模块
│   ├── sequenceAnalysisService.js  # 序列分析工具
│   ├── exportService.js   # 数据导出模块（CSV/JSON）
│   └── paginationService.js    # 分页与无限滚动模块
├── spritesheet_*.webp      # 图片精灵图（3个文件，共5497张图）
├── spritesheet_manifest.json  # 图片位置映射表
├── uniprot_proteins_updated.csv  # 蛋白数据文件 (CSV格式, 5492条记录)
├── create_spritesheet_webp.py  # 生成Spritesheet的脚本
└── README.md              # 项目说明文件
```

## 功能特性

1. **数据筛选**
   - 蛋白序列长度范围筛选
   - 物种下拉选择筛选
   - 关键词下拉选择筛选

2. **搜索功能**
   - 蛋白名称、关键词、Accession号模糊搜索
   - 自动补全建议（输入2个字符以上触发）
   - 布尔运算符支持: `AND`, `OR`, `NOT`, `"exact phrase"`

3. **展示功能**
   - 随机展示50个蛋白（初始加载）
   - 筛选/搜索后展示匹配结果（最大显示100条）
   - 蛋白卡片展示：结构小图标、名称、Accession、物种、长度、关键词
   - 点击卡片查看详细信息弹窗
   - 图片懒加载优化

4. **统计分析**
   - 数据概览：总蛋白数、平均长度、中位数、标准差
   - 序列长度分布柱状图
   - 物种分布饼图

5. **数据导出**
   - 导出筛选结果为CSV格式
   - 导出筛选结果为JSON格式

6. **分页浏览**
   - 支持分页（25/50/100条每页）
   - 支持无限滚动加载
   - 用户偏好自动保存

7. **性能优化**
   - localStorage数据缓存（24小时有效期）
   - 搜索建议内存缓存
   - 分步加载提示

## Spritesheet说明

图片使用Spritesheet技术整合为3个WebP文件：
- `spritesheet_0.webp` (~7.4 MB, 2500张图)
- `spritesheet_1.webp` (~7.4 MB, 2500张图)
- `spritesheet_2.webp` (~1.6 MB, 497张图)

可通过 `create_spritesheet_webp.py` 重新生成。

## 运行方式

```bash
# Python 3
python -m http.server 8080
```

然后访问 http://localhost:8080

## 注意事项

- 图片从Spritesheet按需裁剪显示，无需单独的图片文件
- 初始加载随机展示50个蛋白，避免一次性加载过多数据
- 搜索和筛选功能会实时处理所有数据
- Reset按钮会回到初始随机50个蛋白状态
- 刷新页面后会记住用户选择的每页显示数量

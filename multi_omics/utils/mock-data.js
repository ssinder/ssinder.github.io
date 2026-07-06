/**
 * 模拟数据服务
 * 提供离线演示数据，无需后端支持
 */

const MockDataService = {
    isOfflineMode: true,

    datasets: [
        {
            id: 'DS001',
            name: '油菜叶片转录组数据集',
            type: 'rna',
            species: '油菜',
            tissue: '叶片',
            platform: '10x',
            stage: '苗期',
            geneCount: 45023,
            cellCount: 8500,
            doi: '10.1000/abc123',
            description: '油菜叶片单细胞转录组测序数据',
            createTime: '2024-01-15'
        },
        {
            id: 'DS002',
            name: '油菜种子发育转录组数据集',
            type: 'rna',
            species: '油菜',
            tissue: '种子',
            platform: 'smart-seq2',
            stage: '成熟期',
            geneCount: 42156,
            cellCount: 3200,
            doi: '10.1000/abc124',
            description: '油菜种子发育过程转录组数据',
            createTime: '2024-02-20'
        },
        {
            id: 'DS003',
            name: '油菜根系多组学整合数据集',
            type: 'multi',
            species: '油菜',
            tissue: '根',
            platform: '10x',
            stage: '营养生长期',
            geneCount: 48234,
            cellCount: 12000,
            doi: '10.1000/abc125',
            description: '油菜根系转录组与表观遗传组整合数据',
            createTime: '2024-03-10'
        },
        {
            id: 'DS004',
            name: '油菜花器官单细胞转录组',
            type: 'rna',
            species: '油菜',
            tissue: '花',
            platform: '10x',
            stage: '开花期',
            geneCount: 46578,
            cellCount: 9800,
            doi: '10.1000/abc126',
            description: '油菜花器官单细胞转录组测序',
            createTime: '2024-04-05'
        },
        {
            id: 'DS005',
            name: '油菜角果发育基因组数据',
            type: 'genome',
            species: '油菜',
            tissue: '角果',
            platform: '10x',
            stage: '角果发育期',
            geneCount: 51234,
            cellCount: 0,
            doi: '10.1000/abc127',
            description: '油菜角果发育全基因组测序数据',
            createTime: '2024-05-12'
        },
        {
            id: 'DS006',
            name: '油菜茎秆转录组数据集',
            type: 'rna',
            species: '油菜',
            tissue: '茎',
            platform: 'visium',
            stage: '营养生长期',
            geneCount: 39876,
            cellCount: 5600,
            doi: '10.1000/abc128',
            description: '油菜茎秆空间转录组数据',
            createTime: '2024-06-18'
        },
        {
            id: 'DS007',
            name: '油菜抗逆性多组学数据',
            type: 'multi',
            species: '油菜',
            tissue: '叶片',
            platform: '10x',
            stage: '苗期',
            geneCount: 50123,
            cellCount: 15000,
            doi: '10.1000/abc129',
            description: '油菜响应逆境的转录组与代谢组整合数据',
            createTime: '2024-07-22'
        },
        {
            id: 'DS008',
            name: '油菜胚发育转录组',
            type: 'rna',
            species: '油菜',
            tissue: '种子',
            platform: 'smart-seq2',
            stage: '苗期',
            geneCount: 43210,
            cellCount: 2800,
            doi: '10.1000/abc130',
            description: '油菜胚发育过程转录组测序',
            createTime: '2024-08-30'
        }
    ],

    umapData: {
        cells: [],
        clusters: [],
        genes: []
    },

    searchSuggestions: [
        { type: 'gene', value: 'BnaA01g00010' },
        { type: 'gene', value: 'BnaA03g12340' },
        { type: 'gene', value: 'BnaC03g45670' },
        { type: 'dataset', value: 'DS001' },
        { type: 'dataset', value: 'DS002' },
        { type: 'dataset', value: '油菜叶片' },
        { type: 'dataset', value: '油菜种子' },
        { type: 'tissue', value: '叶片' },
        { type: 'tissue', value: '根' },
        { type: 'tissue', value: '种子' }
    ],

    init() {
        this._generateUmapData();
    },

    _generateUmapData() {
        const cellCount = 500;
        const clusterCount = 8;
        const genes = ['AT1G01010', 'AT1G01020', 'AT1G01030', 'AT1G01040', 'AT1G01050'];
        
        for (let i = 0; i < clusterCount; i++) {
            this.umapData.clusters.push({
                id: i,
                name: `Cluster ${i + 1}`,
                color: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#00BCD4'][i]
            });
        }

        for (let i = 0; i < cellCount; i++) {
            const clusterId = Math.floor(Math.random() * clusterCount);
            const cluster = this.umapData.clusters[clusterId];
            const angle = Math.random() * Math.PI * 2;
            const radius = 3 + Math.random() * 5;
            
            this.umapData.cells.push({
                id: `cell_${i}`,
                x: Math.cos(angle) * radius + (Math.random() - 0.5) * 2,
                y: Math.sin(angle) * radius + (Math.random() - 0.5) * 2,
                clusterId: clusterId,
                clusterName: cluster.name,
                color: cluster.color,
                geneExpression: genes.reduce((acc, gene) => {
                    acc[gene] = Math.random();
                    return acc;
                }, {})
            });
        }
        
        this.umapData.genes = genes;
    },

    async queryDatasets(filters = {}) {
        await this._delay(300);
        
        let results = [...this.datasets];
        
        if (filters.dataTypes && filters.dataTypes.length > 0) {
            results = results.filter(d => filters.dataTypes.includes(d.type));
        }
        
        if (filters.species && filters.species.length > 0) {
            results = results.filter(d => filters.species.includes(d.species));
        }
        
        if (filters.tissues && filters.tissues.length > 0) {
            results = results.filter(d => filters.tissues.includes(d.tissue));
        }
        
        if (filters.platforms && filters.platforms.length > 0) {
            results = results.filter(d => filters.platforms.includes(d.platform));
        }
        
        if (filters.developmentStages && filters.developmentStages.length > 0) {
            results = results.filter(d => filters.developmentStages.includes(d.stage));
        }
        
        if (filters.genes && filters.genes.length > 0) {
            results = results.filter(d => d.geneCount > 40000);
        }
        
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 20;
        const total = results.length;
        
        const pagedResults = results.slice((page - 1) * pageSize, page * pageSize);
        
        return {
            code: 200,
            message: 'success',
            data: {
                datasets: pagedResults,
                statistics: {
                    totalDatasets: this.datasets.length,
                    totalCells: this.datasets.reduce((sum, d) => sum + (d.cellCount || 0), 0),
                    totalGenes: this.datasets.reduce((sum, d) => sum + (d.geneCount || 0), 0),
                    totalSpecies: 1
                },
                total: total,
                page: page,
                pageSize: pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    },

    async getUmapData(params = {}) {
        await this._delay(500);
        
        return {
            code: 200,
            message: 'success',
            data: this.umapData
        };
    },

    async getSpatialHeatmap(params = {}) {
        await this._delay(500);
        
        const heatmapData = {
            matrix: [],
            rows: 20,
            cols: 20,
            maxValue: 100
        };
        
        for (let i = 0; i < heatmapData.rows; i++) {
            heatmapData.matrix[i] = [];
            for (let j = 0; j < heatmapData.cols; j++) {
                const distance = Math.sqrt(Math.pow(i - 10, 2) + Math.pow(j - 10, 2));
                heatmapData.matrix[i][j] = Math.max(0, 100 - distance * 10 + Math.random() * 20);
            }
        }
        
        return {
            code: 200,
            message: 'success',
            data: heatmapData
        };
    },

    async getJointPlot(params = {}) {
        await this._delay(500);
        
        const data = {
            points: [],
            xLabel: 'PC1',
            yLabel: 'PC2'
        };
        
        for (let i = 0; i < 300; i++) {
            data.points.push({
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 20,
                group: Math.floor(Math.random() * 3)
            });
        }
        
        return {
            code: 200,
            message: 'success',
            data: data
        };
    },

    async getSearchSuggestions(keyword) {
        await this._delay(100);
        
        const results = this.searchSuggestions.filter(item => 
            item.value.toLowerCase().includes(keyword.toLowerCase())
        ).slice(0, 8);
        
        return {
            code: 200,
            message: 'success',
            data: results
        };
    },

    async differentialExpression(params) {
        await this._delay(800);
        
        const genes = [];
        const geneNames = ['BnaA01g00010', 'BnaA01g00020', 'BnaA01g00030', 'BnaA01g00040', 'BnaA01g00050',
                          'BnaA01g00060', 'BnaA01g00070', 'BnaA01g00080', 'BnaA01g00090', 'BnaA01g00100'];
        
        for (let i = 0; i < 50; i++) {
            genes.push({
                gene: geneNames[i % geneNames.length] + (Math.floor(i / geneNames.length) + 1),
                log2FC: (Math.random() - 0.5) * 6,
                pValue: Math.random() * 0.05,
                regulation: Math.random() > 0.5 ? 'up' : 'down'
            });
        }
        
        return {
            code: 200,
            message: 'success',
            data: genes
        };
    },

    async enrichmentAnalysis(params) {
        await this._delay(600);
        
        const pathways = [
            '光合作用',
            '碳代谢',
            '氨基酸合成',
            '脂肪酸合成',
            '次生代谢物合成',
            '植物激素信号转导',
            '应激反应',
            '转录调控'
        ];
        
        const results = pathways.map((pathway, index) => ({
            pathway: pathway,
            count: Math.floor(Math.random() * 100) + 10,
            pValue: Math.random() * 0.05,
            genes: ['BnaA01g00010', 'BnaA01g00020', 'BnaA01g00030'].slice(0, Math.floor(Math.random() * 3) + 1)
        }));
        
        return {
            code: 200,
            message: 'success',
            data: results
        };
    },

    async getDownloadFiles(params = {}) {
        await this._delay(300);
        
        let files = this.datasets.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            size: Math.floor(Math.random() * 1000) + 100,
            format: ['h5', 'h5ad', 'csv', 'txt'][Math.floor(Math.random() * 4)],
            downloadCount: Math.floor(Math.random() * 1000)
        }));
        
        if (params.dataTypes) {
            const types = params.dataTypes.split(',');
            files = files.filter(f => types.includes(f.type));
        }
        
        return {
            code: 200,
            message: 'success',
            data: {
                files: files,
                total: files.length
            }
        };
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

MockDataService.init();

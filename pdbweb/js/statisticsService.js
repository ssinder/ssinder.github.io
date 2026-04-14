/**
 * Statistics Service - 数据统计分析模块
 * 提供蛋白长度分布、物种分布等统计功能
 */
(function() {
    'use strict';

    function calculateLengthDistribution(data) {
        const bins = {
            '0-50': 0,
            '51-100': 0,
            '101-150': 0,
            '151-200': 0,
            '201-300': 0,
            '300+': 0
        };

        data.forEach(protein => {
            const len = protein.length;
            if (len <= 50) bins['0-50']++;
            else if (len <= 100) bins['51-100']++;
            else if (len <= 150) bins['101-150']++;
            else if (len <= 200) bins['151-200']++;
            else if (len <= 300) bins['201-300']++;
            else bins['300+']++;
        });

        return bins;
    }

    function calculateOrganismDistribution(data, topN = 15) {
        const counts = {};
        data.forEach(protein => {
            const org = protein.organism_name || 'Unknown';
            counts[org] = (counts[org] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN);

        const total = data.length;
        const other = total - sorted.reduce((sum, [, count]) => sum + count, 0);

        if (other > 0) {
            sorted.push(['Other', other]);
        }

        return sorted;
    }

    function calculateKeywordDistribution(data, topN = 20) {
        const counts = {};
        data.forEach(protein => {
            if (protein.keywords && Array.isArray(protein.keywords)) {
                protein.keywords.forEach(kw => {
                    counts[kw] = (counts[kw] || 0) + 1;
                });
            }
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN);
    }

    function calculateLengthStats(data) {
        const lengths = data.map(p => p.length).filter(l => l > 0);
        if (lengths.length === 0) return null;

        const sorted = [...lengths].sort((a, b) => a - b);
        const sum = lengths.reduce((a, b) => a + b, 0);
        const mean = sum / lengths.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        const variance = lengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / lengths.length;
        const stdDev = Math.sqrt(variance);

        return {
            count: lengths.length,
            mean: mean.toFixed(1),
            median: median,
            min: min,
            max: max,
            stdDev: stdDev.toFixed(1)
        };
    }

    window.StatisticsService = {
        calculateLengthDistribution,
        calculateOrganismDistribution,
        calculateKeywordDistribution,
        calculateLengthStats
    };
})();
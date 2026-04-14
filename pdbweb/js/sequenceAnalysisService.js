/**
 * Sequence Analysis Service - 序列分析工具模块
 * 提供分子量、等电点、氨基酸组成等计算功能
 * 基于氨基酸平均分子量计算
 */
(function() {
    'use strict';

    // 氨基酸平均分子量 (单位: Da)
    const AMINO_ACID_MW = {
        'A': 89.09, 'R': 174.20, 'N': 132.12, 'D': 133.10, 'C': 121.15,
        'Q': 146.15, 'E': 147.13, 'G': 75.07, 'H': 155.16, 'I': 131.18,
        'L': 131.18, 'K': 146.19, 'M': 149.21, 'F': 165.19, 'P': 115.13,
        'S': 105.09, 'T': 119.12, 'W': 204.23, 'Y': 181.19, 'V': 117.15
    };

    // 氨基酸等电点 (pI)
    const AMINO_ACID_PI = {
        'A': 6.00, 'R': 10.76, 'N': 5.41, 'D': 2.77, 'C': 5.07,
        'Q': 5.65, 'E': 3.22, 'G': 5.97, 'H': 7.59, 'I': 6.02,
        'L': 5.98, 'K': 9.74, 'M': 5.74, 'F': 5.48, 'P': 6.30,
        'S': 5.68, 'T': 5.60, 'W': 5.89, 'Y': 5.66, 'V': 5.96
    };

    // 可电离氨基酸侧链pKa值
    const PKA_VALUES = {
        'C_terminal': 3.6,
        'N_terminal': 8.6,
        'D': 3.9,
        'E': 4.1,
        'C': 8.3,
        'Y': 10.1,
        'H': 6.0,
        'K': 10.5,
        'R': 12.5
    };

    function calculateMolecularWeight(sequence) {
        if (!sequence) return 0;
        
        const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '');
        let mw = 0;

        for (const aa of cleanSeq) {
            if (AMINO_ACID_MW[aa]) {
                mw += AMINO_ACID_MW[aa];
            }
        }

        mw += 18.015; // 减去水分子 (肽键形成时释放水)
        return Math.round(mw * 100) / 100;
    }

    function calculatePI(sequence) {
        if (!sequence) return 0;

        const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '');
        const counts = {};

        for (const aa of cleanSeq) {
            counts[aa] = (counts[aa] || 0) + 1;
        }

        function charge(pH) {
            let charge = 0;

            charge += 1 / (1 + Math.pow(10, PKA_VALUES['N_terminal'] - pH));
            charge -= 1 / (1 + Math.pow(10, pH - PKA_VALUES['C_terminal']));

            const acidic = ['D', 'E', 'C', 'Y'];
            acidic.forEach(aa => {
                if (counts[aa]) {
                    charge -= counts[aa] / (1 + Math.pow(10, PKA_VALUES[aa] - pH));
                }
            });

            const basic = ['H', 'K', 'R'];
            basic.forEach(aa => {
                if (counts[aa]) {
                    charge += counts[aa] / (1 + Math.pow(10, pH - PKA_VALUES[aa]));
                }
            });

            return charge;
        }

        let low = 0, high = 14, pI = 7;
        for (let i = 0; i < 20; i++) {
            pI = (low + high) / 2;
            const c = charge(pI);
            if (c > 0) low = pI;
            else high = pI;
        }

        return Math.round(pI * 100) / 100;
    }

    function getAminoAcidComposition(sequence) {
        if (!sequence) return {};

        const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '');
        const total = cleanSeq.length;
        const composition = {};

        for (const aa of cleanSeq) {
            if (AMINO_ACID_MW[aa]) {
                composition[aa] = (composition[aa] || 0) + 1;
            }
        }

        const result = {};
        Object.keys(AMINO_ACID_MW).forEach(aa => {
            result[aa] = {
                count: composition[aa] || 0,
                percentage: total > 0 ? ((composition[aa] || 0) / total * 100).toFixed(2) : 0
            };
        });

        return result;
    }

    function getChargeAtPH(sequence, pH) {
        if (!sequence) return 0;

        const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '');
        const counts = {};

        for (const aa of cleanSeq) {
            counts[aa] = (counts[aa] || 0) + 1;
        }

        let charge = 0;
        charge += 1 / (1 + Math.pow(10, PKA_VALUES['N_terminal'] - pH));
        charge -= 1 / (1 + Math.pow(10, pH - PKA_VALUES['C_terminal']));

        const acidic = ['D', 'E', 'C', 'Y'];
        acidic.forEach(aa => {
            if (counts[aa]) {
                charge -= counts[aa] / (1 + Math.pow(10, PKA_VALUES[aa] - pH));
            }
        });

        const basic = ['H', 'K', 'R'];
        basic.forEach(aa => {
            if (counts[aa]) {
                charge += counts[aa] / (1 + Math.pow(10, pH - PKA_VALUES[aa]));
            }
        });

        return Math.round(charge * 100) / 100;
    }

    function getInstabilityIndex(sequence) {
        if (!sequence) return 0;

        const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '');
        const dipeptideWeights = {
            'WW': 1.0, 'WC': 1.0, 'WM': 24.68, 'WH': 24.68, 'WY': 1.0,
            'WF': 1.0, 'WQ': 1.0, 'WN': 13.34, 'WK': -9.37, 'WR': -14.03,
            'WE': -7.49, 'WD': 1.0, 'WS': -14.03, 'WP': 1.0, 'WT': -7.49,
            'WI': 1.0, 'WA': 1.0, 'WG': -9.37, 'WV': 1.0
        };

        let dipeptideCount = 0;
        let totalWeight = 0;

        for (let i = 0; i < cleanSeq.length - 1; i++) {
            const dipeptide = cleanSeq.substr(i, 2);
            if (dipeptideWeights[dipeptide] !== undefined) {
                totalWeight += dipeptideWeights[dipeptide];
                dipeptideCount++;
            }
        }

        if (dipeptideCount === 0) return 0;
        
        const index = (10 / cleanSeq.length) * totalWeight;
        return Math.round(index * 100) / 100;
    }

    function getGRAVY(sequence) {
        if (!sequence) return 0;

        const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '');
        const hydrophobicity = {
            'I': 4.5, 'V': 4.2, 'L': 3.8, 'F': 2.8, 'C': 2.5,
            'M': 1.9, 'A': 1.8, 'G': -0.4, 'T': -0.7, 'S': -0.8,
            'W': -0.9, 'Y': -1.3, 'P': -1.6, 'H': -3.2, 'E': -3.5,
            'Q': -3.5, 'D': -3.5, 'N': -3.5, 'K': -3.9, 'R': -4.5
        };

        let total = 0;
        for (const aa of cleanSeq) {
            if (hydrophobicity[aa] !== undefined) {
                total += hydrophobicity[aa];
            }
        }

        return Math.round((total / cleanSeq.length) * 100) / 100;
    }

    window.SequenceAnalysisService = {
        calculateMolecularWeight,
        calculatePI,
        getAminoAcidComposition,
        getChargeAtPH,
        getInstabilityIndex,
        getGRAVY
    };
})();
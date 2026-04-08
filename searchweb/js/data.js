/**
 * 数据加载模块 - 支持complete版本JSON
 * 使用 IndexedDB 缓存 + Map索引结构 + 主线程查询
 * 数据格式: p(蛋白数组), i(互作数组), c(统计信息)
 */

const DataManager = (function() {
    let proteinData = null;
    let proteins = null;
    let interactions = null;
    let geneToEntries = new Map();
    let entryToInteractions = new Map();
    let indexToEntry = new Map();  // 索引 -> entry 映射

    const DB_NAME = 'ProteinInteractionDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'proteinData';
    const CACHE_KEY = 'cached_protein_data_v3';  // 版本3，修复互作索引问题

    /**
     * 打开 IndexedDB
     */
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    /**
     * 从 IndexedDB 获取缓存数据
     */
    async function getCachedData() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(CACHE_KEY);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        } catch (e) {
            console.log('[DEBUG] IndexedDB 读取失败:', e.message);
            return null;
        }
    }

    /**
     * 保存数据到 IndexedDB
     */
    async function saveToCache(data) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                const request = store.put(data, CACHE_KEY);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(true);
            });
        } catch (e) {
            console.log('[DEBUG] IndexedDB 写入失败:', e.message);
            return false;
        }
    }

    /**
     * 构建内存索引 - 核心性能优化
     * 处理 complete 格式: p(蛋白数组), i(互作数组)
     */
    function buildIndex(data) {
        console.log('[DEBUG] 构建内存索引...');
        const startTime = performance.now();

        // 检测数据格式
        const isCompleteFormat = data.p && Array.isArray(data.p);
        
        if (isCompleteFormat) {
            console.log('[DEBUG] 使用 complete 格式数据');
            proteins = data.p;
            interactions = data.i || [];
        } else {
            console.log('[DEBUG] 使用旧格式数据');
            proteins = data.proteins;
            interactions = data.interactions;
        }

        // 构建 gene -> entries 索引 (Map 查找 O(1))
        if (isCompleteFormat) {
            // Complete 格式: p数组，每个元素有 e(entry), g(gene name), n(protein name), k(keywords)
            for (let i = 0; i < proteins.length; i++) {
                const protein = proteins[i];
                const geneName = protein.g;
                const entry = protein.e;
                
                // 建立索引到entry的映射
                if (entry) {
                    indexToEntry.set(i, entry);
                }
                
                if (geneName) {
                    const geneLower = geneName.toLowerCase();
                    
                    if (!geneToEntries.has(geneLower)) {
                        geneToEntries.set(geneLower, new Set());
                    }
                    geneToEntries.get(geneLower).add(i);
                    
                    // 同时存储原始大小写
                    if (!geneToEntries.has(geneName)) {
                        geneToEntries.set(geneName, new Set());
                    }
                    geneToEntries.get(geneName).add(i);
                }
            }
        } else {
            // 旧格式
            for (const [entryLower, protein] of Object.entries(proteins)) {
                if (protein.gene_names && Array.isArray(protein.gene_names)) {
                    for (const geneName of protein.gene_names) {
                        const geneLower = geneName.toLowerCase();
                        
                        if (!geneToEntries.has(geneLower)) {
                            geneToEntries.set(geneLower, new Set());
                        }
                        geneToEntries.get(geneLower).add(entryLower);
                        
                        if (!geneToEntries.has(geneName)) {
                            geneToEntries.set(geneName, new Set());
                        }
                        geneToEntries.get(geneName).add(entryLower);
                    }
                }
            }
        }

        // 构建 protein index -> interactions 索引 (O(1) 查询)
        if (isCompleteFormat) {
            // Complete 格式: i数组，每个元素 [idx1, idx2, score]
            // 注意: 互作数组中使用的是蛋白索引(数字)而非entry ID(字符串)
            for (let i = 0; i < interactions.length; i++) {
                const int = interactions[i];
                if (!int || int.length < 3) continue;
                
                const idx1 = int[0];  // 蛋白索引
                const idx2 = int[1];  // 蛋白索引
                const score = int[2];
                
                // 使用蛋白索引作为key
                if (!entryToInteractions.has(idx1)) {
                    entryToInteractions.set(idx1, []);
                }
                entryToInteractions.get(idx1).push({
                    index: i,
                    protein1_idx: idx1,
                    protein2_idx: idx2,
                    combined_score: score / 1000,
                    score: score
                });
                
                if (!entryToInteractions.has(idx2)) {
                    entryToInteractions.set(idx2, []);
                }
                entryToInteractions.get(idx2).push({
                    index: i,
                    protein1_idx: idx1,
                    protein2_idx: idx2,
                    combined_score: score / 1000,
                    score: score
                });
            }
        } else {
            // 旧格式
            for (const interaction of interactions) {
                const p1 = interaction.protein1;
                const p2 = interaction.protein2;
                
                if (!entryToInteractions.has(p1)) {
                    entryToInteractions.set(p1, []);
                }
                entryToInteractions.get(p1).push(interaction);
                
                if (!entryToInteractions.has(p2)) {
                    entryToInteractions.set(p2, []);
                }
                entryToInteractions.get(p2).push(interaction);
            }
        }

        const endTime = performance.now();
        console.log(`[DEBUG] 索引构建完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`[DEBUG] 基因索引数量: ${geneToEntries.size}, 互作索引数量: ${entryToInteractions.size}`);
    }

    /**
     * 加载蛋白互作数据
     * 优先使用嵌入数据，支持直接双击HTML文件运行
     * @returns {Promise<Object>}
     */
    async function loadData() {
        console.log('[DEBUG] 开始加载数据...');
        const startTime = performance.now();

        // 优先使用嵌入数据（支持双击HTML文件直接运行）
        if (window.PROTEIN_INTERACTION_DATA && window.PROTEIN_INTERACTION_DATA.p) {
            console.log('[DEBUG] 使用嵌入数据 (complete格式)');
            proteinData = window.PROTEIN_INTERACTION_DATA;
            buildIndex(proteinData);
            
            const pCount = proteinData.p ? proteinData.p.length : 0;
            const iCount = proteinData.i ? proteinData.i.length : 0;
            const endTime = performance.now();
            console.log(`[DEBUG] 数据加载完成 (嵌入): ${pCount} 个蛋白, ${iCount} 条互作, 耗时: ${(endTime - startTime).toFixed(2)}ms`);
            return proteinData;
        }

        // 嵌入数据不可用，尝试从网络加载（旧版方式，需要本地服务器）
        console.log('[DEBUG] 嵌入数据不可用，尝试从网络加载...');
        
        let response;
        try {
            response = await fetch('data/protein_interactions_secreted.json');
            if (response.ok) {
                console.log('[DEBUG] 加载 protein_interactions_secreted.json 成功');
            } else {
                throw new Error('HTTP error: ' + response.status);
            }
        } catch (e) {
            console.log('[DEBUG] 加载失败:', e.message);
            throw new Error('数据加载失败，请确保在本地服务器环境中运行或使用嵌入数据版本');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        proteinData = await response.json();
        buildIndex(proteinData);
        
        const pCount = proteinData.p ? proteinData.p.length : (proteinData.proteins ? Object.keys(proteinData.proteins).length : 0);
        const iCount = proteinData.i ? proteinData.i.length : (proteinData.interactions ? proteinData.interactions.length : 0);
        
        const endTime = performance.now();
        console.log(`[DEBUG] 数据加载完成 (网络): ${pCount} 个蛋白, ${iCount} 条互作, 耗时: ${(endTime - startTime).toFixed(2)}ms`);
        
        return proteinData;
    }

    /**
     * 获取数据
     * @returns {Object|null}
     */
    function getData() {
        return proteinData;
    }

    /**
     * 查询基因 - 使用 Map 索引 O(1)
     * @param {string} geneId - 基因ID
     * @returns {Array}
     */
    function queryByGene(geneId) {
        if (!proteinData) {
            console.warn('[WARN] 数据未加载');
            return [];
        }

        const startTime = performance.now();
        let matchingIndices = new Set();

        const geneIdLower = geneId.toLowerCase();

        // 1. 精确匹配 (Map 查找 O(1))
        if (geneToEntries.has(geneId)) {
            matchingIndices = geneToEntries.get(geneId);
        } else if (geneToEntries.has(geneIdLower)) {
            matchingIndices = geneToEntries.get(geneIdLower);
        } else {
            // 2. 模糊匹配
            for (const [geneKey, indices] of geneToEntries) {
                if (geneKey.toLowerCase().includes(geneIdLower) || geneIdLower.includes(geneKey.toLowerCase())) {
                    matchingIndices = indices;
                    break;
                }
            }
        }

        // 检测数据格式
        const isCompleteFormat = proteinData.p && Array.isArray(proteinData.p);
        
        const results = [];
        
        if (isCompleteFormat) {
            // Complete 格式: 使用索引直接访问数组
            for (const idx of matchingIndices) {
                const protein = proteins[idx];
                if (protein) {
                    const entry = protein.e;
                    // 使用蛋白索引查询互作
                    const intList = entryToInteractions.get(idx) || [];
                    
                    // 获取互作伙伴的详细信息
                    const enrichedInteractions = intList.map(int => {
                        // 当前蛋白的索引与互作中的索引比较，确定伙伴索引
                        const partnerIdx = int.protein1_idx === idx ? int.protein2_idx : int.protein1_idx;
                        // 通过索引映射获取伙伴蛋白信息
                        const partnerEntry = indexToEntry.get(partnerIdx);
                        let partnerProtein = null;
                        
                        // 直接通过索引获取伙伴蛋白
                        if (partnerIdx >= 0 && partnerIdx < proteins.length) {
                            partnerProtein = proteins[partnerIdx];
                        }
                        
                        return {
                            protein1: indexToEntry.get(int.protein1_idx),
                            protein2: indexToEntry.get(int.protein2_idx),
                            combined_score: int.combined_score,
                            score: int.score,
                            partner_info: partnerProtein ? {
                                entry: partnerProtein.e,
                                gene_names: partnerProtein.g,
                                protein_names: partnerProtein.n,
                                length: partnerProtein.l
                            } : (partnerEntry ? { entry: partnerEntry } : null)
                        };
                    });
                    
                    results.push({
                        protein: {
                            entry: protein.e,
                            protein_names: protein.n,
                            gene_names: protein.g,
                            length: protein.l || null,
                            function: protein.f || null,
                            keywords: protein.k ? protein.k.split(';').filter(k => k.trim()) : [],
                            activeSite: protein.as || null,
                            bindingSite: protein.bs || null,
                            catalyticActivity: protein.ca || null,
                            pathway: protein.pw || null,
                            cofactor: protein.cf || null,
                            geneOntologyBP: protein.gobp || null,
                            geneOntologyCC: protein.gocc || null,
                            geneOntologyMF: protein.gomf || null,
                            sequence: protein.seq || null,
                            subcellularLocation: protein.sl || null,
                            region: protein.rg || null,
                            proteinFamilies: protein.pf || null
                        },
                        interactions: enrichedInteractions
                    });
                }
            }
        } else {
            // 旧格式
            const entryArray = Array.from(matchingIndices);
            for (const entryLower of entryArray) {
                const protein = proteins[entryLower];
                if (protein) {
                    const interactions = entryToInteractions.get(protein.entry) || [];
                    results.push({
                        protein: protein,
                        interactions: interactions
                    });
                }
            }
        }

        const endTime = performance.now();
        console.log(`[DEBUG] 基因 "${geneId}" 查询完成: ${results.length} 个蛋白, 耗时: ${(endTime - startTime).toFixed(2)}ms`);

        return results;
    }

    /**
     * 模糊搜索基因名 - 供自动补全使用
     * @param {string} query - 查询字符串
     * @param {number} limit - 返回数量限制
     * @returns {Array}
     */
    function fuzzySearch(query, limit = 20) {
        if (!proteinData) return [];

        const results = [];
        const queryLower = query.toLowerCase();
        
        // 检测数据格式
        const isCompleteFormat = proteinData.p && Array.isArray(proteinData.p);

        for (const [geneKey, indices] of geneToEntries) {
            if (geneKey.toLowerCase().includes(queryLower)) {
                const idx = indices.values().next().value;
                let protein;
                
                if (isCompleteFormat) {
                    protein = proteins[idx];
                } else {
                    protein = proteins[idx];
                }
                
                if (protein) {
                    results.push({
                        geneName: geneKey,
                        proteinName: isCompleteFormat ? protein.n : protein.protein_names,
                        entry: isCompleteFormat ? protein.e : protein.entry
                    });
                }
            }
            if (results.length >= limit) break;
        }

        return results;
    }

    /**
     * 获取数据统计信息
     * @returns {Object}
     */
    function getStats() {
        if (!proteinData) return null;
        
        // 检测数据格式
        if (proteinData.c) {
            return proteinData.c;
        }
        
        return proteinData.stats || {
            total_proteins: proteinData.p ? proteinData.p.length : (proteinData.proteins ? Object.keys(proteinData.proteins).length : 0),
            total_interactions: proteinData.i ? proteinData.i.length : (proteinData.interactions ? proteinData.interactions.length : 0)
        };
    }

    /**
     * 清除缓存
     */
    async function clearCache() {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete(CACHE_KEY);
            console.log('[DEBUG] 缓存已清除');
        } catch (e) {
            console.error('[ERROR] 清除缓存失败:', e);
        }
    }

    return {
        loadData,
        getData,
        queryByGene,
        fuzzySearch,
        getStats,
        clearCache
    };
})();

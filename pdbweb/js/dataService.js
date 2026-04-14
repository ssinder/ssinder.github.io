(function() {
    'use strict';

    const CSV_PATH = 'uniprot_proteins_updated.csv';
    const IMAGE_BASE_PATH = 'results/';
    const CACHE_KEY = 'pdb_proteins_cache';
    const CACHE_TIMESTAMP_KEY = 'pdb_proteins_cache_ts';
    const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

    let cachedData = null;

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            row.length = parseInt(row.length) || 0;
            row.keywords = row.keywords ? row.keywords.split(';').map(k => k.trim()).filter(k => k) : [];

            data.push(row);
        }

        return data;
    }

    function saveToLocalStorage(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
            console.log('[DataService] Data saved to localStorage');
        } catch (e) {
            console.warn('[DataService] Failed to save to localStorage:', e);
        }
    }

    function loadFromLocalStorage() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
            
            if (!cached || !timestamp) return null;
            
            const age = Date.now() - parseInt(timestamp);
            if (age > CACHE_EXPIRY_MS) {
                console.log('[DataService] Cache expired, age:', age);
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIMESTAMP_KEY);
                return null;
            }
            
            const data = JSON.parse(cached);
            console.log('[DataService] Loaded from localStorage, count:', data.length, 'age:', age);
            return data;
        } catch (e) {
            console.warn('[DataService] Failed to load from localStorage:', e);
            return null;
        }
    }

    window.DataService = {
        async loadData() {
            if (cachedData) {
                console.log('[DataService] Using in-memory cache, count:', cachedData.length);
                return cachedData;
            }

            const localCache = loadFromLocalStorage();
            if (localCache) {
                cachedData = localCache;
                return cachedData;
            }

            console.log('[DataService] Loading CSV data from:', CSV_PATH);
            const startTime = performance.now();

            try {
                const response = await fetch(CSV_PATH);
                if (!response.ok) {
                    throw new Error('Failed to load CSV: ' + response.status);
                }
                const text = await response.text();
                cachedData = parseCSV(text);
                saveToLocalStorage(cachedData);

                const loadTime = (performance.now() - startTime).toFixed(2);
                console.log(`[DataService] Data loaded: ${cachedData.length} proteins in ${loadTime}ms`);

                return cachedData;
            } catch (error) {
                console.error('[DataService] Error loading data:', error);
                throw error;
            }
        },

        getImagePath(accession) {
            return IMAGE_BASE_PATH + accession + '.webp';
        },

        async getImageUrl(accession) {
            if (window.ImageService && window.ImageService.isSpritesheetLoaded()) {
                return await window.ImageService.getImageUrl(accession);
            }
            return IMAGE_BASE_PATH + accession + '.webp';
        },

        async initImageService() {
            if (window.ImageService) {
                return await window.ImageService.init();
            }
            return false;
        },

        getAllOrganisms(data) {
            const organisms = new Set();
            data.forEach(item => {
                if (item.organism_name) {
                    organisms.add(item.organism_name);
                }
            });
            return Array.from(organisms).sort();
        },

        getAllKeywords(data) {
            const keywords = new Set();
            data.forEach(item => {
                if (item.keywords && Array.isArray(item.keywords)) {
                    item.keywords.forEach(kw => keywords.add(kw));
                }
            });
            return Array.from(keywords).sort();
        },

        getProteinNames(data) {
            const names = new Set();
            data.forEach(item => {
                if (item.protein_name) {
                    names.add(item.protein_name);
                }
            });
            return Array.from(names).sort();
        },

        clearCache() {
            cachedData = null;
            console.log('[DataService] Cache cleared');
        }
    };
})();
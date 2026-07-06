(function() {
    'use strict';

    const USER_PREFS_KEY = 'pdb_user_prefs';
    let allData = [];
    let filteredData = [];
    let suggestionTimeout = null;

    function loadUserPrefs() {
        try {
            const prefs = localStorage.getItem(USER_PREFS_KEY);
            if (prefs) {
                console.log('[App] Loaded user preferences');
                return JSON.parse(prefs);
            }
        } catch (e) {
            console.warn('[App] Failed to load preferences:', e);
        }
        return { pageSize: 50, infiniteScroll: false };
    }

    function saveUserPrefs(prefs) {
        try {
            localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
            console.log('[App] Saved user preferences:', prefs);
        } catch (e) {
            console.warn('[App] Failed to save preferences:', e);
        }
    }

    async function init() {
        console.log('[App] Initializing application...');
        
        UI.init();
        UI.showLoading();

        const userPrefs = loadUserPrefs();
        console.log('[App] User preferences:', userPrefs);

        try {
            UI.setLoadingStep(1, '1. Loading data...');
            allData = await DataService.loadData();
            console.log('[App] Data loaded, count:', allData.length);

            UI.setLoadingStep(2, '2. Loading images...');
            await DataService.initImageService();

            UI.setLoadingStep(3, '3. Building interface...');
            UI.populateOrganisms(DataService.getAllOrganisms(allData));
            UI.populateKeywords(DataService.getAllKeywords(allData));
            
            filteredData = getRandomProteins(allData, userPrefs.pageSize);
            await UI.renderProteins(filteredData);
            UI.updateStats(allData.length, filteredData.length);
            UI.hideLoading();

            setupEventListeners();
            setupExportAndStats();
            UI.applyUserPrefs(userPrefs);
            
            console.log('[App] Application ready');
        } catch (error) {
            console.error('[App] Initialization error:', error);
            UI.hideLoading();
            alert('Failed to load data: ' + error.message);
        }
    }

    function getRandomProteins(data, count) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, data.length));
    }

    function setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const applyFilterBtn = document.getElementById('applyFilterBtn');
        const resetFilterBtn = document.getElementById('resetFilterBtn');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (suggestionTimeout) {
                clearTimeout(suggestionTimeout);
            }
            
            if (query.length >= 2) {
                suggestionTimeout = setTimeout(() => {
                    const suggestions = FilterService.getSuggestions(allData, query, 8);
                    UI.showSuggestions(suggestions);
                }, 300);
            } else {
                UI.hideSuggestions();
            }
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => UI.hideSuggestions(), 200);
        });

        const suggestionsBox = document.getElementById('suggestions');
        suggestionsBox.addEventListener('click', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (item) {
                const text = item.querySelector('strong').textContent;
                searchInput.value = text;
                UI.hideSuggestions();
                applyFilters();
            }
        });

        searchBtn.addEventListener('click', () => {
            applyFilters();
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });

        applyFilterBtn.addEventListener('click', () => {
            applyFilters();
        });

        resetFilterBtn.addEventListener('click', async () => {
            UI.clearFilters();
            const userPrefs = loadUserPrefs();
            filteredData = getRandomProteins(allData, userPrefs.pageSize);
            await UI.renderProteins(filteredData);
            UI.updateStats(allData.length, filteredData.length);
            console.log('[App] Filters reset');
        });
    }

    async function applyFilters() {
        const filterOptions = UI.getFilterValues();
        console.log('[App] Applying filters:', filterOptions);

        const startTime = performance.now();
        filteredData = FilterService.filter(allData, filterOptions);
        const filterTime = (performance.now() - startTime).toFixed(2);

        await UI.renderProteins(filteredData);
        UI.updateStats(allData.length, filteredData.length);
        
        console.log(`[App] Filtered to ${filteredData.length} proteins in ${filterTime}ms`);
    }

    function setupExportAndStats() {
        UI.showExportButtons(true);

        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'exportCSVBtn') {
                ExportService.exportToCSV(filteredData, 'filtered_proteins.csv');
            }
            if (e.target.id === 'exportJSONBtn') {
                ExportService.exportToJSON(filteredData, 'filtered_proteins.json');
            }
            if (e.target.id === 'showStatsBtn') {
                UI.showStatisticsPanel(filteredData);
            }
        });
    }

    window.addEventListener('DOMContentLoaded', init);
    
    window.saveUserPrefs = saveUserPrefs;
})();
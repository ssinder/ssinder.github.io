(function() {
    'use strict';

    const elements = {};

    function initElements() {
        elements.searchInput = document.getElementById('searchInput');
        elements.searchBtn = document.getElementById('searchBtn');
        elements.suggestionsBox = document.getElementById('suggestions');
        elements.lengthMin = document.getElementById('lengthMin');
        elements.lengthMax = document.getElementById('lengthMax');
        elements.organismSelect = document.getElementById('organismSelect');
        elements.keywordSelect = document.getElementById('keywordSelect');
        elements.applyFilterBtn = document.getElementById('applyFilterBtn');
        elements.resetFilterBtn = document.getElementById('resetFilterBtn');
        elements.totalCount = document.getElementById('totalCount');
        elements.filteredCount = document.getElementById('filteredCount');
        elements.proteinGrid = document.getElementById('proteinGrid');
        elements.loadingIndicator = document.getElementById('loadingIndicator');
        elements.noResults = document.getElementById('noResults');
        elements.proteinModal = document.getElementById('proteinModal');
        elements.modalBody = document.getElementById('modalBody');
        elements.closeBtn = document.querySelector('.close');
    }

    async function createProteinCard(protein) {
        const card = document.createElement('div');
        card.className = 'protein-card';
        card.dataset.accession = protein.accession;

        let imagePath = DataService.getImagePath(protein.accession);
        
        if (window.ImageService && window.ImageService.isSpritesheetLoaded()) {
            try {
                imagePath = await window.ImageService.getImageUrl(protein.accession) || imagePath;
            } catch (e) {
                console.warn('[UI] Failed to load image from spritesheet:', protein.accession);
            }
        }

        const keywordsHtml = protein.keywords.map(kw => 
            `<span class="keyword-tag">${escapeHtml(kw)}</span>`
        ).join('');

        card.innerHTML = `
            <div class="protein-image">
                <img src="${imagePath}" alt="${escapeHtml(protein.protein_name)}" 
                     loading="lazy" onerror="this.parentElement.innerHTML='No Image';this.remove()">
            </div>
            <div class="protein-info">
                <h3>${escapeHtml(protein.protein_name)}</h3>
                <div class="accession">${escapeHtml(protein.accession)}</div>
                <div class="organism" title="${escapeHtml(protein.organism_name)}">${escapeHtml(protein.organism_name)}</div>
                <div class="length">Length: ${protein.length} aa</div>
                <div class="keywords">${keywordsHtml}</div>
            </div>
        `;

        card.addEventListener('click', () => showProteinDetail(protein));

        return card;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function renderProteins(proteins, maxRender = 100) {
        elements.proteinGrid.innerHTML = '';

        if (proteins.length === 0) {
            elements.noResults.style.display = 'block';
            return;
        }

        elements.noResults.style.display = 'none';
        
        const toRender = proteins.slice(0, maxRender);
        const fragment = document.createDocumentFragment();
        
        for (const protein of toRender) {
            const card = await createProteinCard(protein);
            fragment.appendChild(card);
        }
        
        if (proteins.length > maxRender) {
            const moreCount = proteins.length - maxRender;
            const moreDiv = document.createElement('div');
            moreDiv.className = 'more-results-notice';
            moreDiv.textContent = `Showing ${maxRender} of ${proteins.length} proteins. Scroll down for more or adjust filters.`;
            fragment.appendChild(moreDiv);
        }
        
        elements.proteinGrid.appendChild(fragment);

        console.log('[UI] Rendered', Math.min(proteins.length, maxRender), 'proteins');
    }

    async function showProteinDetail(protein) {
        let imagePath = DataService.getImagePath(protein.accession);
        
        if (window.ImageService && window.ImageService.isSpritesheetLoaded()) {
            try {
                imagePath = await window.ImageService.getImageUrl(protein.accession) || imagePath;
            } catch (e) {
                console.warn('[UI] Failed to load modal image from spritesheet:', protein.accession);
            }
        }

        const keywordsList = protein.keywords.length > 0 
            ? protein.keywords.map(kw => `<span class="keyword-tag">${escapeHtml(kw)}</span>`).join('')
            : '<span style="color: #999;">None</span>';

        elements.modalBody.innerHTML = `
            <img src="${imagePath}" class="modal-image" alt="${escapeHtml(protein.protein_name)}"
                 onerror="this.style.display='none'">
            <h2>${escapeHtml(protein.protein_name)}</h2>
            <div class="detail-row">
                <span class="detail-label">Accession:</span>
                <span class="detail-value">${escapeHtml(protein.accession)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Organism:</span>
                <span class="detail-value">${escapeHtml(protein.organism_name)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Sequence Length:</span>
                <span class="detail-value">${protein.length} amino acids</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Keywords:</span>
                <span class="detail-value">${keywordsList}</span>
            </div>
            ${protein.function ? `
            <div class="function-section">
                <h4>Function</h4>
                <p>${escapeHtml(protein.function)}</p>
            </div>
            ` : ''}
        `;

        elements.proteinModal.classList.add('active');
    }

    function hideModal() {
        elements.proteinModal.classList.remove('active');
    }

    function populateOrganisms(organisms) {
        elements.organismSelect.innerHTML = '<option value="">All Organisms</option>';
        organisms.forEach(org => {
            const option = document.createElement('option');
            option.value = org;
            option.textContent = org;
            elements.organismSelect.appendChild(option);
        });
        console.log('[UI] Populated', organisms.length, 'organisms');
    }

    function populateKeywords(keywords) {
        elements.keywordSelect.innerHTML = '<option value="">All Keywords</option>';
        keywords.forEach(kw => {
            const option = document.createElement('option');
            option.value = kw;
            option.textContent = kw;
            elements.keywordSelect.appendChild(option);
        });
        console.log('[UI] Populated', keywords.length, 'keywords');
    }

    function showSuggestions(suggestions) {
        if (suggestions.length === 0) {
            elements.suggestionsBox.classList.remove('active');
            return;
        }

        elements.suggestionsBox.innerHTML = suggestions.map(s => 
            `<div class="suggestion-item"><strong>${escapeHtml(s.text)}</strong> <small>(${s.type})</small></div>`
        ).join('');

        elements.suggestionsBox.classList.add('active');
    }

    function hideSuggestions() {
        elements.suggestionsBox.classList.remove('active');
    }

    function updateStats(total, filtered) {
        elements.totalCount.textContent = `Total: ${total}`;
        elements.filteredCount.textContent = `Filtered: ${filtered}`;
    }

    function showExportButtons(show) {
        let exportPanel = document.getElementById('exportPanel');
        if (!exportPanel) {
            exportPanel = document.createElement('div');
            exportPanel.id = 'exportPanel';
            exportPanel.className = 'export-panel';
            exportPanel.innerHTML = `
                <button id="exportCSVBtn" class="export-btn">Export CSV</button>
                <button id="exportJSONBtn" class="export-btn">Export JSON</button>
                <button id="showStatsBtn" class="export-btn">Statistics</button>
            `;
            const statsPanel = document.querySelector('.stats-panel');
            statsPanel.parentNode.insertBefore(exportPanel, statsPanel.nextSibling);
        }
        exportPanel.style.display = show ? 'flex' : 'none';
    }

    function showStatisticsPanel(data) {
        let statsModal = document.getElementById('statsModal');
        if (statsModal) {
            statsModal.remove();
        }

        const lengthDist = StatisticsService.calculateLengthDistribution(data);
        const orgDist = StatisticsService.calculateOrganismDistribution(data, 10);
        const keywordDist = StatisticsService.calculateKeywordDistribution(data, 10);
        const lengthStats = StatisticsService.calculateLengthStats(data);

        const lengthChartCanvas = 'lengthChartCanvas';
        const orgChartCanvas = 'orgChartCanvas';
        const keywordChartCanvas = 'keywordChartCanvas';

        statsModal = document.createElement('div');
        statsModal.id = 'statsModal';
        statsModal.className = 'modal';
        statsModal.innerHTML = `
            <div class="modal-content stats-modal-content">
                <span class="close" id="closeStatsBtn">&times;</span>
                <h2>Data Statistics Overview</h2>
                <div class="stats-summary">
                    <div class="stat-box">
                        <div class="stat-value">${data.length}</div>
                        <div class="stat-label">Total Proteins</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${lengthStats ? lengthStats.mean : 'N/A'}</div>
                        <div class="stat-label">Mean Length (aa)</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${lengthStats ? lengthStats.median : 'N/A'}</div>
                        <div class="stat-label">Median Length (aa)</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${lengthStats ? lengthStats.stdDev : 'N/A'}</div>
                        <div class="stat-label">Std Dev (aa)</div>
                    </div>
                </div>
                <div class="charts-grid">
                    <div class="chart-container">
                        <h3>Sequence Length Distribution</h3>
                        <canvas id="${lengthChartCanvas}" width="400" height="300"></canvas>
                        <div class="length-dist-legend">
                            ${Object.entries(lengthDist).map(([range, count]) => 
                                `<div class="legend-item"><span>${range} aa:</span> <strong>${count}</strong></div>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="chart-container">
                        <h3>Top 10 Organisms</h3>
                        <canvas id="${orgChartCanvas}" width="400" height="300"></canvas>
                        <div class="org-dist-legend">
                            ${orgDist.map(([org, count]) => 
                                `<div class="legend-item"><span>${org.substring(0, 25)}:</span> <strong>${count}</strong></div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(statsModal);
        statsModal.classList.add('active');

        document.getElementById('closeStatsBtn').addEventListener('click', () => {
            statsModal.classList.remove('active');
        });

        statsModal.addEventListener('click', (e) => {
            if (e.target === statsModal) {
                statsModal.classList.remove('active');
            }
        });

        renderLengthBarChart(lengthChartCanvas, lengthDist);
        renderOrganismPieChart(orgChartCanvas, orgDist);
    }

    function renderLengthBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const labels = Object.keys(data);
        const values = Object.values(data);
        const maxValue = Math.max(...values);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#667eea';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        const barWidth = (canvas.width - 60) / labels.length;
        const chartHeight = canvas.height - 60;
        const startX = 40;
        const startY = canvas.height - 40;

        labels.forEach((label, i) => {
            const x = startX + i * barWidth + 10;
            const height = (values[i] / maxValue) * chartHeight;
            const y = startY - height;

            ctx.fillStyle = `hsl(${240 + i * 20}, 70%, 60%)`;
            ctx.fillRect(x, y, barWidth - 10, height);

            ctx.fillStyle = '#333';
            ctx.fillText(label, x + (barWidth - 10) / 2, startY + 15);

            ctx.fillStyle = '#667eea';
            ctx.fillText(values[i], x + (barWidth - 10) / 2, y - 5);
        });

        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sequence Length Range', canvas.width / 2, canvas.height - 5);

        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Count', 0, 0);
        ctx.restore();
    }

    function renderOrganismPieChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const total = data.reduce((sum, [, count]) => sum + count, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2 - 60;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 2 - 40;

        let startAngle = 0;

        data.forEach(([label, count], i) => {
            const sliceAngle = (count / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            const hue = (i * 360 / data.length);
            ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
            ctx.fill();

            startAngle = endAngle;
        });

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(total.toString(), centerX, centerY + 5);
        ctx.font = '10px Arial';
        ctx.fillText('Total', centerX, centerY + 20);
    }

    function showLoading() {
        elements.loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div>Loading Protein Database...</div>
            <div class="loading-steps">
                <div class="loading-step" id="step1">1. Loading data...</div>
                <div class="loading-step" id="step2">2. Initializing images...</div>
                <div class="loading-step" id="step3">3. Building interface...</div>
            </div>
        `;
        elements.loadingIndicator.style.display = 'block';
        elements.proteinGrid.style.display = 'none';
    }

    function setLoadingStep(step, text) {
        const stepEl = document.getElementById('step' + step);
        if (stepEl) {
            stepEl.textContent = text;
            stepEl.classList.add('active');
            if (step > 1) {
                const prevStep = document.getElementById('step' + (step - 1));
                if (prevStep) {
                    prevStep.classList.remove('active');
                    prevStep.classList.add('done');
                    prevStep.textContent = prevStep.textContent.replace('...', ' ✓');
                }
            }
        }
    }

    function hideLoading() {
        elements.loadingIndicator.style.display = 'none';
        elements.proteinGrid.style.display = 'grid';
    }

    function getFilterValues() {
        const minLength = elements.lengthMin.value ? parseInt(elements.lengthMin.value) : null;
        const maxLength = elements.lengthMax.value ? parseInt(elements.lengthMax.value) : null;

        return {
            searchQuery: elements.searchInput.value.trim(),
            minLength: minLength,
            maxLength: maxLength,
            organism: elements.organismSelect.value,
            keyword: elements.keywordSelect.value
        };
    }

    function setFilterValues(values) {
        elements.searchInput.value = values.searchQuery || '';
        elements.lengthMin.value = values.minLength || '';
        elements.lengthMax.value = values.maxLength || '';
        elements.organismSelect.value = values.organism || '';
        elements.keywordSelect.value = values.keyword || '';
    }

    function clearFilters() {
        elements.searchInput.value = '';
        elements.lengthMin.value = '';
        elements.lengthMax.value = '';
        elements.organismSelect.value = '';
        elements.keywordSelect.value = '';
    }

    function applyUserPrefs(prefs) {
        if (!prefs) return;
        
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect && prefs.pageSize) {
            pageSizeSelect.value = prefs.pageSize;
        }
        
        console.log('[UI] Applied user preferences:', prefs);
    }

    window.UI = {
        init() {
            initElements();
            
            elements.closeBtn.addEventListener('click', hideModal);
            elements.proteinModal.addEventListener('click', (e) => {
                if (e.target === elements.proteinModal) {
                    hideModal();
                }
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        hideModal();
                    }
                });
            });

            console.log('[UI] Initialized');
        },

        renderProteins,
        showProteinDetail,
        populateOrganisms,
        populateKeywords,
        showSuggestions,
        hideSuggestions,
        updateStats,
        showLoading,
        hideLoading,
        setLoadingStep,
        getFilterValues,
        setFilterValues,
        clearFilters,
        showExportButtons,
        showStatisticsPanel,
        applyUserPrefs
    };
})();
/**
 * Pagination Service - 分页模块
 * 支持分页和无限滚动加载
 */
(function() {
    'use strict';

    let currentPage = 1;
    let pageSize = 50;
    let totalItems = 0;
    let currentData = [];
    let renderCallback = null;
    let isInfiniteScroll = false;

    function setPageSize(size) {
        pageSize = size;
    }

    function getPageSize() {
        return pageSize;
    }

    function setInfiniteScroll(enabled) {
        isInfiniteScroll = enabled;
    }

    function getCurrentPage() {
        return currentPage;
    }

    function setTotalItems(count) {
        totalItems = count;
    }

    function getTotalPages() {
        return Math.ceil(totalItems / pageSize);
    }

    function getStartIndex() {
        return (currentPage - 1) * pageSize;
    }

    function getEndIndex() {
        return Math.min(currentPage * pageSize, totalItems);
    }

    function getCurrentPageData(data) {
        currentData = data;
        const start = getStartIndex();
        const end = getEndIndex();
        return data.slice(start, end);
    }

    function nextPage(data) {
        const totalPages = getTotalPages();
        if (currentPage < totalPages) {
            currentPage++;
            return getCurrentPageData(data);
        }
        return null;
    }

    function previousPage(data) {
        if (currentPage > 1) {
            currentPage--;
            return getCurrentPageData(data);
        }
        return null;
    }

    function goToPage(page, data) {
        const totalPages = getTotalPages();
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            return getCurrentPageData(data);
        }
        return null;
    }

    function reset() {
        currentPage = 1;
    }

    function hasNextPage() {
        return currentPage < getTotalPages();
    }

    function hasPreviousPage() {
        return currentPage > 1;
    }

    function getPaginationInfo() {
        return {
            currentPage: currentPage,
            pageSize: pageSize,
            totalItems: totalItems,
            totalPages: getTotalPages(),
            startIndex: getStartIndex() + 1,
            endIndex: getEndIndex()
        };
    }

    function renderPaginationControls(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const info = getPaginationInfo();
        
        container.innerHTML = `
            <div class="pagination-info">
                Showing ${info.startIndex}-${info.endIndex} of ${info.totalItems} proteins
            </div>
            <div class="pagination-controls">
                <button class="page-btn" id="prevPageBtn" ${info.currentPage === 1 ? 'disabled' : ''}>
                    Previous
                </button>
                <span class="page-indicator">Page ${info.currentPage} of ${info.totalPages}</span>
                <button class="page-btn" id="nextPageBtn" ${!hasNextPage() ? 'disabled' : ''}>
                    Next
                </button>
                <select id="pageSizeSelect" class="page-size-select">
                    <option value="25" ${pageSize === 25 ? 'selected' : ''}>25/page</option>
                    <option value="50" ${pageSize === 50 ? 'selected' : ''}>50/page</option>
                    <option value="100" ${pageSize === 100 ? 'selected' : ''}>100/page</option>
                </select>
            </div>
        `;

        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (renderCallback) {
                const data = previousPage(currentData);
                if (data) {
                    renderCallback(data);
                    updatePaginationDisplay(containerId);
                }
            }
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            if (renderCallback) {
                const data = nextPage(currentData);
                if (data) {
                    renderCallback(data);
                    updatePaginationDisplay(containerId);
                }
            }
        });

        document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            setPageSize(newSize);
            reset();
            if (renderCallback) {
                const data = getCurrentPageData(currentData);
                renderCallback(data);
                updatePaginationDisplay(containerId);
            }
            
            const prefs = { pageSize: newSize, infiniteScroll: isInfiniteScroll };
            if (typeof window.saveUserPrefs === 'function') {
                window.saveUserPrefs(prefs);
            }
        });
    }

    function updatePaginationDisplay(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const info = getPaginationInfo();
        
        container.querySelector('.pagination-info').textContent = 
            `Showing ${info.startIndex}-${info.endIndex} of ${info.totalItems} proteins`;
        container.querySelector('.page-indicator').textContent = 
            `Page ${info.currentPage} of ${info.totalPages}`;
        
        const prevBtn = container.querySelector('#prevPageBtn');
        const nextBtn = container.querySelector('#nextPageBtn');
        
        prevBtn.disabled = !hasPreviousPage();
        nextBtn.disabled = !hasNextPage();
    }

    function setupInfiniteScroll(container, data, renderFn) {
        currentData = data;
        renderCallback = renderFn;

        let isLoading = false;

        container.addEventListener('scroll', () => {
            if (isLoading || !hasNextPage()) return;

            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 100) {
                isLoading = true;
                
                setTimeout(() => {
                    const newData = nextPage(data);
                    if (newData) {
                        const existingCards = container.querySelectorAll('.protein-card');
                        const fragment = document.createDocumentFragment();
                        
                        newData.forEach(protein => {
                            const card = createProteinCardFromData(protein);
                            fragment.appendChild(card);
                        });
                        
                        container.appendChild(fragment);
                        updatePaginationDisplay('paginationPanel');
                    }
                    isLoading = false;
                }, 300);
            }
        });
    }

    function createProteinCardFromData(protein) {
        const card = document.createElement('div');
        card.className = 'protein-card';
        card.dataset.accession = protein.accession;

        const imagePath = DataService.getImagePath(protein.accession);

        const keywordsHtml = protein.keywords.map(kw => 
            `<span class="keyword-tag">${escapeHtml(kw)}</span>`
        ).join('');

        card.innerHTML = `
            <div class="protein-image">
                <img src="${imagePath}" alt="${escapeHtml(protein.protein_name)}" 
                     onerror="this.parentElement.innerHTML='No Image';this.remove()">
            </div>
            <div class="protein-info">
                <h3>${escapeHtml(protein.protein_name)}</h3>
                <div class="accession">${escapeHtml(protein.accession)}</div>
                <div class="organism" title="${escapeHtml(protein.organism_name)}">${escapeHtml(protein.organism_name)}</div>
                <div class="length">Length: ${protein.length} aa</div>
                <div class="keywords">${keywordsHtml}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            UI.showProteinDetail(protein);
        });

        return card;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.PaginationService = {
        setPageSize,
        getPageSize,
        setInfiniteScroll,
        getCurrentPage,
        setTotalItems,
        getTotalPages,
        getCurrentPageData,
        nextPage,
        previousPage,
        goToPage,
        reset,
        hasNextPage,
        hasPreviousPage,
        getPaginationInfo,
        renderPaginationControls,
        setupInfiniteScroll
    };
})();
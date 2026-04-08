/**
 * UI模块
 * 负责处理DOM操作和结果展示
 * 支持展示完整的蛋白信息和互作信息
 */

const UIManager = (function() {
    const elements = {
        geneInput: document.getElementById('gene-input'),
        searchBtn: document.getElementById('search-btn'),
        loading: document.getElementById('loading'),
        errorMessage: document.getElementById('error-message'),
        resultsContainer: document.getElementById('results-container'),
        resultsList: document.getElementById('results-list'),
        resultCount: document.getElementById('result-count'),
        noResults: document.getElementById('no-results')
    };

    /**
     * 显示加载中状态
     */
    function showLoading() {
        hideAll();
        elements.loading.style.display = 'block';
    }

    /**
     * 隐藏加载中状态
     */
    function hideLoading() {
        elements.loading.style.display = 'none';
    }

    /**
     * 显示错误信息
     * @param {string} message
     */
    function showError(message) {
        hideAll();
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
    }

    /**
     * 隐藏错误信息
     */
    function hideError() {
        elements.errorMessage.style.display = 'none';
    }

    /**
     * 显示结果
     * @param {Array} results
     */
    function showResults(results) {
        hideAll();
        
        if (results.length === 0) {
            elements.noResults.style.display = 'block';
            return;
        }

        elements.resultCount.textContent = `${results.length} 个蛋白`;
        elements.resultsList.innerHTML = results.map(renderProteinCard).join('');
        elements.resultsContainer.style.display = 'block';
    }

    /**
     * 安全获取字段值
     */
    function getField(value, defaultText = '无') {
        return value && value.trim() ? value : defaultText;
    }

    /**
     * 渲染蛋白卡片 - 完整信息版
     * @param {Object} result
     * @param {Function} networkCallback - 可选的网络可视化回调
     * @returns {string}
     */
    function renderProteinCard(result, networkCallback) {
        const protein = result.protein;
        const interactions = result.interactions;

        // 统计不同置信度的互作数量
        const highConf = interactions.filter(i => (i.score || i.combined_score * 1000) >= 700).length;
        const medConf = interactions.filter(i => {
            const s = i.score || i.combined_score * 1000;
            return s >= 400 && s < 700;
        }).length;
        const lowConf = interactions.filter(i => (i.score || i.combined_score * 1000) < 400).length;

        // 取前10个互作，按分数降序
        const sortedInteractions = [...interactions].sort((a, b) => {
            const scoreA = a.score || a.combined_score * 1000;
            const scoreB = b.score || b.combined_score * 1000;
            return scoreB - scoreA;
        });
        const topInteractions = sortedInteractions.slice(0, 10);

        // 处理功能描述
        const functionText = getField(protein.function, '无功能描述');
        const functionPreview = functionText.length > 300 ? functionText.substring(0, 300) + '...' : functionText;

        // 处理关键词
        const keywords = protein.keywords && Array.isArray(protein.keywords) ? protein.keywords : 
                        (protein.keywords ? protein.keywords.split(';').filter(k => k.trim()) : []);

        // 构建详细的蛋白信息HTML
        let proteinDetailsHTML = `
            <div class="protein-basic-info">
                <div class="detail-row">
                    <span class="detail-label">UniProt Entry:</span>
                    <span class="detail-value">${getField(protein.entry)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Gene Name:</span>
                    <span class="detail-value">${getField(protein.gene_names)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Protein Name:</span>
                    <span class="detail-value">${getField(protein.protein_names)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Length:</span>
                    <span class="detail-value">${protein.length || '未知'} aa</span>
                </div>
            </div>
        `;

        // 只有当字段有值时才显示
        if (protein.function) {
            proteinDetailsHTML += `
                <div class="detail-section">
                    <div class="section-title">Function (功能)</div>
                    <div class="section-content">${functionPreview}</div>
                </div>
            `;
        }

        if (keywords.length > 0) {
            proteinDetailsHTML += `
                <div class="detail-section">
                    <div class="section-title">Keywords (关键词)</div>
                    <div class="section-content keywords">
                        ${keywords.slice(0, 12).map(kw => 
                            `<span class="keyword-tag">${kw.trim()}</span>`
                        ).join('')}
                        ${keywords.length > 12 ? `<span class="keyword-tag">+${keywords.length - 12} more</span>` : ''}
                    </div>
                </div>
            `;
        }

        // 额外的详细信息（如果存在）
        const extraFields = [
            { label: 'Active Site', value: protein.activeSite },
            { label: 'Binding Site', value: protein.bindingSite },
            { label: 'Catalytic Activity', value: protein.catalyticActivity },
            { label: 'Pathway', value: protein.pathway },
            { label: 'Cofactor', value: protein.cofactor },
            { label: 'Subcellular Location', value: protein.subcellularLocation },
            { label: 'Region', value: protein.region },
            { label: 'Protein Families', value: protein.proteinFamilies }
        ];

        const existingExtraFields = extraFields.filter(f => f.value && f.value.trim());
        if (existingExtraFields.length > 0) {
            proteinDetailsHTML += `<div class="detail-section extra-fields">`;
            for (const field of existingExtraFields) {
                const displayValue = field.value.length > 100 ? field.value.substring(0, 100) + '...' : field.value;
                proteinDetailsHTML += `
                    <div class="detail-row">
                        <span class="detail-label">${field.label}:</span>
                        <span class="detail-value">${displayValue}</span>
                    </div>
                `;
            }
            proteinDetailsHTML += `</div>`;
        }

        // GO注释
        if (protein.geneOntologyBP || protein.geneOntologyCC || protein.geneOntologyMF) {
            proteinDetailsHTML += `<div class="detail-section go-annotations">`;
            if (protein.geneOntologyBP) {
                proteinDetailsHTML += `<div class="go-group"><span class="go-label">BP:</span> ${protein.geneOntologyBP}</div>`;
            }
            if (protein.geneOntologyCC) {
                proteinDetailsHTML += `<div class="go-group"><span class="go-label">CC:</span> ${protein.geneOntologyCC}</div>`;
            }
            if (protein.geneOntologyMF) {
                proteinDetailsHTML += `<div class="go-group"><span class="go-label">MF:</span> ${protein.geneOntologyMF}</div>`;
            }
            proteinDetailsHTML += `</div>`;
        }

        // 互作信息
        let interactionsHTML = '';
        const hasInteractions = interactions.length > 0;
        
        if (hasInteractions) {
            // 添加"查看网络图"按钮
            const networkButton = networkCallback ? `
                <button class="btn btn-network" onclick="showNetworkForProtein(${JSON.stringify(protein).replace(/"/g, '&quot;')}, ${JSON.stringify(interactions).replace(/"/g, '&quot;')})">
                    查看互作网络图
                </button>
            ` : '';
            
            interactionsHTML = `
                <div class="interactions-section">
                    <div class="interactions-header">
                        <span>Protein Interactions (蛋白互作)</span>
                        <span class="interaction-stats">
                            High: ${highConf} | Medium: ${medConf} | Low: ${lowConf}
                        </span>
                    </div>
                    <div class="network-btn-container">
                        ${networkButton}
                    </div>
                    <div class="interaction-list">
                        ${topInteractions.map(int => {
                            const partnerInfo = int.partner_info || {};
                            const partner = partnerInfo.gene_names || (int.protein1 === protein.entry ? int.protein2 : int.protein1);
                            const partnerName = partnerInfo.protein_names || 'Unknown protein';
                            const score = int.score || Math.round(int.combined_score * 1000);
                            const scorePercent = Math.round(score / 10);
                            
                            return `
                                <div class="interaction-item">
                                    <div class="interaction-info">
                                        <div class="interaction-partner">
                                            <span class="gene-name">${partner}</span>
                                            <span class="entry-name">(${partnerInfo.entry || (int.protein1 === protein.entry ? int.protein2 : int.protein1)})</span>
                                        </div>
                                        <div class="interaction-name">${partnerName.substring(0, 60)}${partnerName.length >= 60 ? '...' : ''}</div>
                                    </div>
                                    <div class="interaction-score">
                                        <span class="score-value">${score}</span>
                                        <div class="score-bar">
                                            <div class="score-bar-fill" style="width: ${scorePercent}%; background: ${getScoreColor(score)}"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        ${interactions.length > 10 ? `
                            <div class="interaction-item more-interactions">
                                ... 还有 ${interactions.length - 10} 条互作信息
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="protein-card">
                <div class="protein-header">
                    <div class="protein-title">${getField(protein.protein_names, 'Unknown Protein')}</div>
                    <div class="protein-entry">UniProt: ${getField(protein.entry)} | Gene: ${getField(protein.gene_names)}</div>
                </div>
                <div class="protein-details">
                    ${proteinDetailsHTML}
                    ${interactionsHTML}
                </div>
            </div>
        `;
    }

    /**
     * 根据分数获取颜色
     */
    function getScoreColor(score) {
        if (score >= 700) return '#28a745';
        if (score >= 400) return '#ffc107';
        return '#dc3545';
    }

    /**
     * 隐藏所有结果区域
     */
    function hideAll() {
        elements.loading.style.display = 'none';
        elements.errorMessage.style.display = 'none';
        elements.resultsContainer.style.display = 'none';
        elements.noResults.style.display = 'none';
    }

    /**
     * 清空输入
     */
    function clearInput() {
        elements.geneInput.value = '';
    }

    /**
     * 获取输入的基因ID
     * @returns {string}
     */
    function getGeneInput() {
        return elements.geneInput.value.trim();
    }

    /**
     * 聚焦输入框
     */
    function focusInput() {
        elements.geneInput.focus();
    }

    /**
     * 渲染蛋白卡片并显示网络图
     * @param {Array} results
     * @param {Function} networkCallback - 显示网络的回调函数
     */
    function showResultsWithNetwork(results, networkCallback) {
        hideAll();
        
        if (results.length === 0) {
            elements.noResults.style.display = 'block';
            return;
        }

        elements.resultCount.textContent = `${results.length} 个蛋白`;
        elements.resultsList.innerHTML = results.map(r => renderProteinCard(r, networkCallback)).join('');
        elements.resultsContainer.style.display = 'block';
    }

    return {
        elements,
        showLoading,
        hideLoading,
        showError,
        hideError,
        showResults,
        showResultsWithNetwork,
        hideAll,
        clearInput,
        getGeneInput,
        focusInput
    };
})();

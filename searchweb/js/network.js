/**
 * 网络可视化模块 - 使用 D3.js
 * 支持蛋白互作网络的可视化、交互和导出
 */

const NetworkVisualizer = (function() {
    let svg = null;
    let simulation = null;
    let networkData = { nodes: [], links: [] };
    let currentGeneId = null;
    const containerId = 'network-container';
    
    const colors = {
        high: '#28a745',
        medium: '#ffc107', 
        low: '#dc3545',
        node: '#4a90d9',
        nodeHighlight: '#e74c3c'
    };
    
    const config = {
        width: 800,
        height: 600,
        nodeRadius: 25,
        linkDistance: 100,
        chargeStrength: -300,
        centerStrength: 0.1,
        scoreThreshold: 0  // 0表示显示全部互作，不过滤
    };

    /**
     * 计算节点半径（基于互作分数）
     */
    function getNodeRadius(d, isHover = false) {
        if (d.isCentral) {
            return config.nodeRadius * 1.3 * (isHover ? 1.2 : 1);
        }
        const score = d.avgScore || 500;
        const minRadius = config.nodeRadius * 0.7;
        const maxRadius = config.nodeRadius * 1.5;
        const normalizedScore = Math.min(1000, Math.max(0, score)) / 1000;
        const baseRadius = minRadius + (maxRadius - minRadius) * normalizedScore;
        return baseRadius * (isHover ? 1.2 : 1);
    }

    /**
     * 初始化网络容器
     */
    function init() {
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'network-container';
            
            const resultsContainer = document.getElementById('results-container');
            if (resultsContainer) {
                resultsContainer.appendChild(container);
            }
        }
        
        container.innerHTML = `
            <div class="network-header">
                <h3>蛋白互作网络图 <span class="network-stats"></span></h3>
                <div class="network-controls">
                    <button id="network-reset" class="btn btn-sm">重置视图</button>
                    <button id="network-export" class="btn btn-sm">导出图片</button>
                </div>
            </div>
            <div class="network-wrapper">
                <svg id="network-svg"></svg>
            </div>
            <div class="network-legend">
                <span class="legend-item"><span class="legend-color" style="background:${colors.high}"></span> 高置信度 (≥700)</span>
                <span class="legend-item"><span class="legend-color" style="background:${colors.medium}"></span> 中置信度 (400-699)</span>
                <span class="legend-item"><span class="legend-color" style="background:${colors.low}"></span> 低置信度 (<400)</span>
            </div>
        `;
        
        const svgElement = document.getElementById('network-svg');
        svg = d3.select(svgElement)
            .attr('width', '100%')
            .attr('height', config.height)
            .attr('viewBox', `0 0 ${config.width} ${config.height}`);
        
        setupZoom();
        
        document.getElementById('network-reset').addEventListener('click', resetView);
        document.getElementById('network-export').addEventListener('click', exportImage);
        
        return container;
    }

    /**
     * 设置缩放功能
     */
    function setupZoom() {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                svg.select('g.main-group').attr('transform', event.transform);
            });
        
        svg.call(zoom);
    }

    /**
     * 构建网络数据
     * @param {Object} proteinData - 蛋白数据
     * @param {Array} interactions - 互作数据
     */
    function buildNetwork(proteinData, interactions) {
        if (!proteinData || !interactions || interactions.length === 0) {
            return;
        }

        networkData = { nodes: [], links: [] };
        const nodeMap = new Map();
        const protein = proteinData;

        const centralNode = {
            id: protein.entry,
            gene: protein.gene_names || protein.g,
            name: protein.protein_names || protein.n,
            isCentral: true
        };
        
        networkData.nodes.push(centralNode);
        nodeMap.set(protein.entry, centralNode);

        const filteredInteractions = interactions
            .filter(i => {
                const score = i.score || i.combined_score * 1000;
                return config.scoreThreshold === 0 || score >= config.scoreThreshold;
            })
            .sort((a, b) => {
                const scoreA = a.score || a.combined_score * 1000;
                const scoreB = b.score || b.combined_score * 1000;
                return scoreB - scoreA;
            });
        
        // 限制最大显示数量，避免性能问题
        const maxLinks = 100;
        const displayInteractions = filteredInteractions.slice(0, maxLinks);

        // 计算每个节点的互作分数（用于设置节点大小）
        const nodeScores = new Map();
        
        for (const int of displayInteractions) {
            const score = int.score || Math.round(int.combined_score * 1000);
            const partnerEntry = int.protein1 === protein.entry ? int.protein2 : int.protein1;
            
            if (!nodeScores.has(partnerEntry)) {
                nodeScores.set(partnerEntry, []);
            }
            nodeScores.get(partnerEntry).push(score);
        }

        for (const int of displayInteractions) {
            const partnerEntry = int.protein1 === protein.entry ? int.protein2 : int.protein1;
            
            if (!nodeMap.has(partnerEntry)) {
                const partnerInfo = int.partner_info || {};
                const scores = nodeScores.get(partnerEntry) || [];
                const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 500;
                
                const partnerNode = {
                    id: partnerEntry,
                    gene: partnerInfo.gene_names || partnerEntry,
                    name: partnerInfo.protein_names || partnerEntry,
                    isCentral: false,
                    avgScore: avgScore
                };
                networkData.nodes.push(partnerNode);
                nodeMap.set(partnerEntry, partnerNode);
            }

            const score = int.score || Math.round(int.combined_score * 1000);
            let linkColor = colors.low;
            if (score >= 700) linkColor = colors.high;
            else if (score >= 400) linkColor = colors.medium;

            networkData.links.push({
                source: protein.entry,
                target: partnerEntry,
                score: score,
                color: linkColor
            });
        }

        render();

        // 显示统计信息
        const statsEl = container.querySelector('.network-stats');
        if (statsEl && networkData.links.length > 0) {
            statsEl.textContent = `(${networkData.links.length} 条互作)`;
        }
    }

    /**
     * 渲染网络
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) {
            init();
        }

        svg.selectAll('*').remove();

        const g = svg.append('g').attr('class', 'main-group');

        g.append('g').attr('class', 'links');
        g.append('g').attr('class', 'nodes');

        simulation = d3.forceSimulation(networkData.nodes)
            .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(config.linkDistance))
            .force('charge', d3.forceManyBody().strength(config.chargeStrength))
            .force('center', d3.forceCenter(config.width / 2, config.height / 2).strength(config.centerStrength))
            .force('collision', d3.forceCollide().radius(config.nodeRadius + 10));

        const link = g.select('.links')
            .selectAll('line')
            .data(networkData.links)
            .enter()
            .append('line')
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => Math.max(1, d.score / 200))
            .attr('stroke-opacity', 0.7);

        const node = g.select('.nodes')
            .selectAll('g')
            .data(networkData.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        node.append('circle')
            .attr('r', d => getNodeRadius(d))
            .attr('fill', d => d.isCentral ? colors.nodeHighlight : colors.node)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('click', nodeClicked)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', getNodeRadius(d, true));
                showTooltip(event, d);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', getNodeRadius(d));
                hideTooltip();
            });

        node.append('text')
            .attr('dy', d => d.isCentral ? config.nodeRadius * 1.8 : config.nodeRadius + 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#333')
            .text(d => d.gene.substring(0, 12));

        node.append('title')
            .text(d => `${d.gene}\n${d.name}`);

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        container.style.display = 'block';
    }

    /**
     * 拖拽开始
     */
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    /**
     * 拖拽中
     */
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    /**
     * 拖拽结束
     */
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    /**
     * 节点点击事件
     */
    function nodeClicked(event, d) {
        if (d.isCentral) return;
        
        const geneId = d.gene;
        const searchInput = document.getElementById('gene-input');
        if (searchInput) {
            searchInput.value = geneId;
            App.performSearch();
        }
    }

    /**
     * 显示工具提示
     */
    function showTooltip(event, d) {
        let tooltip = document.getElementById('network-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'network-tooltip';
            tooltip.className = 'network-tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <strong>${d.gene}</strong><br>
            <span>${d.name.substring(0, 50)}${d.name.length > 50 ? '...' : ''}</span>
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
    }

    /**
     * 隐藏工具提示
     */
    function hideTooltip() {
        const tooltip = document.getElementById('network-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    /**
     * 重置视图
     */
    function resetView() {
        if (svg && simulation) {
            simulation.alpha(1).restart();
            svg.transition().duration(500).call(
                d3.zoom().transform,
                d3.zoomIdentity
            );
        }
    }

    /**
     * 导出图片
     */
    function exportImage() {
        const svgElement = document.getElementById('network-svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = config.width * 2;
        canvas.height = config.height * 2;
        
        const img = new Image();
        img.onload = function() {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const link = document.createElement('a');
            link.download = `protein_network_${currentGeneId || 'unknown'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }

    /**
     * 显示网络
     * @param {Object} protein - 蛋白数据
     * @param {Array} interactions - 互作数据
     */
    function show(protein, interactions) {
        currentGeneId = protein.gene_names || protein.g;
        buildNetwork(protein, interactions);
    }

    /**
     * 隐藏网络
     */
    function hide() {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * 更新网络数据
     * @param {Object} protein - 蛋白数据
     * @param {Array} interactions - 互作数据
     */
    function update(protein, interactions) {
        if (interactions && interactions.length > 0) {
            show(protein, interactions);
        } else {
            hide();
        }
    }

    return {
        init,
        show,
        hide,
        update,
        buildNetwork,
        resetView,
        exportImage
    };
})();
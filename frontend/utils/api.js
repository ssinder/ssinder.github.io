/**
 * API请求工具类
 * 直接使用模拟数据，无需后端支持
 */

class ApiClient {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.offlineMode = true;
    }

    async request(url, options = {}) {
        const { method = 'GET', body = null, params = {} } = options;
        
        let requestUrl = url;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            requestUrl = `${url}?${queryString}`;
        }
        
        console.log('[API Debug] URL:', requestUrl, 'Method:', method, 'Body:', body);
        
        return this._handleRequest(requestUrl, { method, body });
    }

    async _handleRequest(url, options = {}) {
        const { method, body } = options;
        
        try {
            let result;
        
            if (url.includes('/api/query/datasets')) {
                console.log('[API Debug] Calling queryDatasets');
                result = await MockDataService.queryDatasets(body || {});
                console.log('[API Debug] queryDatasets result:', result);
                return result;
            }
            
            if (url.includes('/api/visualization/umap')) {
                result = await MockDataService.getUmapData(body || {});
                return result;
            }
            
            if (url.includes('/api/visualization/spatial-heatmap')) {
                result = await MockDataService.getSpatialHeatmap(body || {});
                return result;
            }
            
            if (url.includes('/api/visualization/joint-plot')) {
                result = await MockDataService.getJointPlot(body || {});
                return result;
            }
            
            if (url.includes('/api/search')) {
                result = await MockDataService.getSearchSuggestions(body?.keyword || '');
                return result;
            }
            
            if (url.includes('/api/tools/differential-expression')) {
                result = await MockDataService.differentialExpression(body || {});
                return result;
            }
            
            if (url.includes('/api/tools/enrichment')) {
                result = await MockDataService.enrichmentAnalysis(body || {});
                return result;
            }
            
            if (url.includes('/api/download/files')) {
                result = await MockDataService.getDownloadFiles(body || {});
                console.log('[API Debug] getDownloadFiles result:', result);
                return result;
            }
            
            return { code: 200, message: 'success', data: [] };
        } catch (error) {
            console.error('[API Error]', error);
            return { code: 500, message: error.message, data: [] };
        }
    }

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        console.log('[API Debug] GET URL:', fullUrl);
        return this._handleRequest(fullUrl, { method: 'GET', body: null });
    }

    async post(url, data = {}) {
        return this._handleRequest(url, { method: 'POST', body: data });
    }

    async put(url, data = {}) {
        return this._handleRequest(url, { method: 'PUT', body: data });
    }

    async delete(url) {
        return this._handleRequest(url, { method: 'DELETE' });
    }
}

// 创建全局API客户端实例
const apiClient = new ApiClient();

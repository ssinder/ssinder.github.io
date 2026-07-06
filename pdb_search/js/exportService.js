/**
 * Export Service - 数据导出模块
 * 支持CSV和JSON格式导出筛选后的数据
 */
(function() {
    'use strict';

    function convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        csvRows.push(headers.join(','));

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    window.ExportService = {
        exportToCSV(data, filename = 'proteins_export.csv') {
            const csv = convertToCSV(data);
            downloadFile(csv, filename, 'text/csv;charset=utf-8;');
            console.log('[ExportService] Exported', data.length, 'records to CSV');
        },

        exportToJSON(data, filename = 'proteins_export.json') {
            const json = JSON.stringify(data, null, 2);
            downloadFile(json, filename, 'application/json');
            console.log('[ExportService] Exported', data.length, 'records to JSON');
        },

        exportSelectedFields(data, fields, filename = 'proteins_export.csv') {
            const exportData = data.map(row => {
                const newRow = {};
                fields.forEach(field => {
                    newRow[field] = row[field];
                });
                return newRow;
            });

            const csv = convertToCSV(exportData);
            downloadFile(csv, filename, 'text/csv;charset=utf-8;');
            console.log('[ExportService] Exported', data.length, 'records with fields:', fields);
        }
    };
})();
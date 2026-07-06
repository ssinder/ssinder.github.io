(function() {
    'use strict';

    const suggestionCache = new Map();
    const MAX_CACHE_SIZE = 100;

    function matchesKeyword(protein, keyword) {
        if (!keyword) return true;
        const kw = keyword.toLowerCase();
        return protein.keywords.some(k => k.toLowerCase().includes(kw));
    }

    function matchesOrganism(protein, organism) {
        if (!organism) return true;
        return protein.organism_name && protein.organism_name.toLowerCase().includes(organism.toLowerCase());
    }

    function matchesLength(protein, minLength, maxLength) {
        const len = protein.length;
        if (minLength !== null && len < minLength) return false;
        if (maxLength !== null && len > maxLength) return false;
        return true;
    }

    function searchProtein(protein, query) {
        if (!query) return true;
        
        const hasBooleanOps = /\b(AND|OR|NOT)\b/i.test(query);
        
        if (!hasBooleanOps) {
            const q = query.toLowerCase();
            const nameMatch = protein.protein_name && protein.protein_name.toLowerCase().includes(q);
            const keywordMatch = protein.keywords && protein.keywords.some(k => k.toLowerCase().includes(q));
            const organismMatch = protein.organism_name && protein.organism_name.toLowerCase().includes(q);
            const accessionMatch = protein.accession && protein.accession.toLowerCase().includes(q);
            return nameMatch || keywordMatch || organismMatch || accessionMatch;
        }
        
        return parseBooleanQuery(protein, query);
    }

    function parseBooleanQuery(protein, query) {
        const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        let result = null;
        let operator = 'AND';
        
        for (const token of tokens) {
            const upperToken = token.toUpperCase();
            
            if (upperToken === 'AND' || upperToken === 'OR') {
                operator = upperToken;
                continue;
            }
            
            let term = token;
            let isNegated = false;
            
            if (upperToken.startsWith('NOT ')) {
                term = token.substring(4).trim();
                isNegated = true;
            } else if (upperToken.startsWith('NOT')) {
                term = token.substring(3).trim();
                isNegated = true;
            }
            
            term = term.replace(/^"|"$/g, '').trim().toLowerCase();
            
            if (!term) continue;
            
            const match = matchesTerm(protein, term);
            const termResult = isNegated ? !match : match;
            
            if (result === null) {
                result = termResult;
            } else {
                if (operator === 'OR') {
                    result = result || termResult;
                } else {
                    result = result && termResult;
                }
            }
        }
        
        return result !== null ? result : true;
    }

    function matchesTerm(protein, term) {
        const nameMatch = protein.protein_name && protein.protein_name.toLowerCase().includes(term);
        const keywordMatch = protein.keywords && protein.keywords.some(k => k.toLowerCase().includes(term));
        const organismMatch = protein.organism_name && protein.organism_name.toLowerCase().includes(term);
        const accessionMatch = protein.accession && protein.accession.toLowerCase().includes(term);
        
        return nameMatch || keywordMatch || organismMatch || accessionMatch;
    }

    function fuzzySearch(protein, query) {
        if (!query) return [];
        const q = query.toLowerCase();
        const results = [];

        if (protein.protein_name && protein.protein_name.toLowerCase().includes(q)) {
            results.push({ type: 'protein_name', value: protein.protein_name });
        }

        if (protein.organism_name && protein.organism_name.toLowerCase().includes(q)) {
            results.push({ type: 'organism_name', value: protein.organism_name });
        }

        if (protein.keywords) {
            protein.keywords.forEach(kw => {
                if (kw.toLowerCase().includes(q)) {
                    results.push({ type: 'keyword', value: kw });
                }
            });
        }

        return results;
    }

    window.FilterService = {
        filter(data, options) {
            const { 
                searchQuery = '', 
                minLength = null, 
                maxLength = null, 
                organism = '', 
                keyword = '' 
            } = options;

            console.log('[FilterService] Filtering with options:', options);

            return data.filter(protein => {
                if (searchQuery && !searchProtein(protein, searchQuery)) {
                    return false;
                }
                if (!matchesLength(protein, minLength, maxLength)) {
                    return false;
                }
                if (organism && !matchesOrganism(protein, organism)) {
                    return false;
                }
                if (keyword && !matchesKeyword(protein, keyword)) {
                    return false;
                }
                return true;
            });
        },

        getSuggestions(data, query, limit = 10) {
            if (!query || query.length < 2) return [];

            const q = query.toLowerCase();
            
            if (suggestionCache.has(q)) {
                console.log('[FilterService] Using cache for query:', query);
                return suggestionCache.get(q).slice(0, limit);
            }

            const suggestions = new Map();

            data.forEach(protein => {
                const matches = fuzzySearch(protein, q);
                matches.forEach(match => {
                    const key = match.value;
                    if (!suggestions.has(key)) {
                        suggestions.set(key, {
                            text: key,
                            type: match.type,
                            count: 0
                        });
                    }
                    suggestions.get(key).count++;
                });
            });

            const result = Array.from(suggestions.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);

            if (suggestionCache.size >= MAX_CACHE_SIZE) {
                const firstKey = suggestionCache.keys().next().value;
                suggestionCache.delete(firstKey);
            }
            suggestionCache.set(q, result);

            console.log('[FilterService] Got', result.length, 'suggestions for query:', query);
            return result;
        },

        filterByOrganism(data, organism) {
            return filter(data, { organism });
        },

        filterByKeyword(data, keyword) {
            return filter(data, { keyword });
        },

        filterByLength(data, minLength, maxLength) {
            return filter(data, { minLength, maxLength });
        },

        search(data, query) {
            return filter(data, { searchQuery: query });
        }
    };
})();
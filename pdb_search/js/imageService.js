/**
 * Image Service - 图片加载模块
 * 仅支持Spritesheet (无ZIP和文件系统fallback)
 */
(function() {
    'use strict';

    const SPRITESHEET_ENABLED = true;

    let currentSource = 'none';

    async function tryLoadSpritesheet() {
        if (!SPRITESHEET_ENABLED) return false;
        
        console.log('[ImageService] Trying spritesheet...');
        
        if (!window.SpriteSheetService) {
            console.log('[ImageService] SpriteSheetService not found');
            return false;
        }
        
        try {
            const result = await window.SpriteSheetService.init();
            if (result && window.SpriteSheetService.isReady()) {
                currentSource = 'spritesheet';
                console.log('[ImageService] Using spritesheet source');
                console.log('[ImageService] Total sprites:', window.SpriteSheetService.getTotalSprites());
                return true;
            }
        } catch (e) {
            console.error('[ImageService] Spritesheet error:', e);
        }
        return false;
    }

    async function init() {
        console.log('[ImageService] Initializing spritesheet mode...');
        
        if (await tryLoadSpritesheet()) {
            return true;
        }
        
        console.error('[ImageService] No image source available!');
        return false;
    }

    async function getImageUrl(accession) {
        if (currentSource === 'spritesheet' && window.SpriteSheetService && window.SpriteSheetService.isReady()) {
            const url = window.SpriteSheetService.getImgSrc(accession);
            if (!url) {
                console.warn('[ImageService] No sprite found for:', accession);
            }
            return url;
        }

        console.error('[ImageService] Spritesheet not ready, cannot get image');
        return null;
    }

    function getImagePath(accession) {
        console.warn('[ImageService] getImagePath called but using spritesheet');
        return null;
    }

    function isSpritesheetLoaded() {
        return currentSource === 'spritesheet' || (window.SpriteSheetService && window.SpriteSheetService.isReady());
    }

    function isZipLoaded() {
        return false;
    }

    function getCurrentSource() {
        return currentSource;
    }

    window.ImageService = {
        init,
        getImageUrl,
        getImagePath,
        isZipLoaded,
        isSpritesheetLoaded,
        getCurrentSource
    };
})();
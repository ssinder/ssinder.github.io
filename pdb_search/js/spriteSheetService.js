/**
 * SpriteSheet Service - Spritesheet图片加载模块
 * 支持多个spritesheet文件，使用CSS sprite技术
 */
(function() {
    'use strict';

    const MANIFEST_PATH = 'assets/spritesheet_manifest.json';

    let manifest = null;
    let spritesheetImages = [];
    let isLoaded = false;

    async function loadManifest() {
        if (manifest) return true;

        console.log('[SpriteSheet] Loading manifest...');
        try {
            const response = await fetch(MANIFEST_PATH);
            if (!response.ok) {
                console.log('[SpriteSheet] Manifest not found');
                return false;
            }
            manifest = await response.json();
            console.log('[SpriteSheet] Manifest loaded, contains', Object.keys(manifest).length, 'entries');
            return true;
        } catch (error) {
            console.log('[SpriteSheet] Error loading manifest:', error.message);
            return false;
        }
    }

    async function loadSpritesheets() {
        if (!manifest) {
            console.log('[SpriteSheet] No manifest loaded, cannot load spritesheets');
            return false;
        }
        
        const sheetCount = Math.max(...Object.values(manifest).map(v => v.sheet)) + 1;
        console.log('[SpriteSheet] Loading', sheetCount, 'spritesheets...');
        
        for (let i = 0; i < sheetCount; i++) {
            const img = new Image();
            img.src = `assets/spritesheets/spritesheet_${i}.webp`;
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    spritesheetImages.push(img);
                    console.log(`[SpriteSheet] Loaded spritesheet_${i}.webp (${img.width}x${img.height})`);
                    resolve();
                };
                img.onerror = (e) => {
                    console.error(`[SpriteSheet] Failed to load spritesheet_${i}.webp:`, e);
                    reject(new Error(`Failed to load spritesheet_${i}.webp`));
                };
            });
        }
        
        isLoaded = true;
        console.log('[SpriteSheet] All spritesheets loaded successfully');
        return true;
    }

    async function init() {
        const manifestLoaded = await loadManifest();
        if (!manifestLoaded) return false;

        const sheetLoaded = await loadSpritesheets();
        return sheetLoaded;
    }

    function getSpritePosition(accession) {
        if (!manifest || !manifest[accession]) {
            return null;
        }
        return manifest[accession];
    }

    function getImgSrc(accession) {
        const pos = getSpritePosition(accession);
        if (!pos || !spritesheetImages[pos.sheet]) return null;

        const spritesheet = spritesheetImages[pos.sheet];
        
        const canvas = document.createElement('canvas');
        canvas.width = pos.width;
        canvas.height = pos.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(spritesheet, pos.x, pos.y, pos.width, pos.height, 0, 0, pos.width, pos.height);
        
        return canvas.toDataURL('image/png');
    }

    function isReady() {
        return isLoaded && manifest !== null;
    }

    function getTotalSprites() {
        return manifest ? Object.keys(manifest).length : 0;
    }

    window.SpriteSheetService = {
        init,
        getSpritePosition,
        getImgSrc,
        isReady,
        getTotalSprites
    };
})();
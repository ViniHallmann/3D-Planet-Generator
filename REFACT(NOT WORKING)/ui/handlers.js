import { hexToRgb } from '../utils/colors.js';

export class UIHandlers {
    constructor(engine, elements) {
        this.engine = engine;
        this.elements = elements;
        this.timeoutId = null;
    }

    setup() {
        this.setupNoiseControls();
        this.setupVisualControls();
        this.setupCloudControls();
        this.setupLayerControls();
    }

    bindInput(element, valueElement, settingsObj, key, parser, formatter, needsRegen = false, callback = null) {
        if (!element) return;

        if (valueElement) valueElement.textContent = formatter(settingsObj[key]);
        element.value = settingsObj[key];

        element.addEventListener('input', (e) => {
            const val = parser(e.target.value);
            settingsObj[key] = val;
            
            if (valueElement) valueElement.textContent = formatter(val);

            if (needsRegen) {
                this.debounce(() => this.engine.renderer.regenerateTerrain(this.engine.settings.noise), 150);
            }
            
            if (callback) callback(val);
        });
    }

    debounce(func, wait) {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(func, wait);
    }

    setupNoiseControls() {
        const s = this.engine.settings.noise;
        const e = this.elements;

        // Seed
        e.seedInput.value = this.engine.renderer.noiseGenerator.getSeed();
        e.seedInput.addEventListener('change', (ev) => {
            this.engine.renderer.noiseGenerator.setSeed(parseInt(ev.target.value));
            this.engine.renderer.regenerateTerrain(s);
        });
        e.seedRandomBtn.addEventListener('click', () => {
            const newSeed = Math.floor(Math.random() * 2147483647);
            e.seedInput.value = newSeed;
            this.engine.renderer.noiseGenerator.setSeed(newSeed);
            this.engine.renderer.regenerateTerrain(s);
        });

        // Noise Type
        e.noiseType.value = s.noiseType;
        e.noiseType.addEventListener('change', (ev) => {
            s.noiseType = ev.target.value;
            this.engine.renderer.noiseGenerator.setNoiseType(s.noiseType);
            this.engine.renderer.regenerateTerrain(s);
        });

        // Sliders
        this.bindInput(e.subdivisions, e.subdivisionsVal, s, 'subdivisions', parseInt, v => v, false, (val) => {
            this.engine.renderer.regenerateIcosphere(val, s);
        });
        this.bindInput(e.octaves, e.octavesVal, s, 'octaves', parseInt, v => v, true);
        this.bindInput(e.persistence, e.persistenceVal, s, 'persistence', parseFloat, v => v.toFixed(2), true);
        this.bindInput(e.lacunarity, e.lacunarityVal, s, 'lacunarity', parseFloat, v => v.toFixed(2), true);
        this.bindInput(e.noiseZoom, e.noiseZoomVal, s, 'noiseZoom', parseFloat, v => v.toFixed(2), true);
    }

    setupVisualControls() {
        const app = this.engine.settings.app;
        const sh = this.engine.settings.shaders;
        const e = this.elements;

        // Toggles
        e.wireframe.checked = app.showWireframe;
        e.wireframe.addEventListener('change', (ev) => app.showWireframe = ev.target.checked);

        e.lambertian.checked = app.showLambertianDiffuse;
        e.lambertian.addEventListener('change', (ev) => app.showLambertianDiffuse = ev.target.checked);

        e.cloudsToggle.checked = app.showClouds;
        e.cloudsToggle.addEventListener('change', (ev) => app.showClouds = ev.target.checked);

        // Light & Terrain
        this.bindInput(e.lightSpeed, e.lightSpeedVal, sh, 'lightSpeed', parseFloat, v => v.toFixed(1));
        this.bindInput(e.lightBrightness, e.lightBrightnessVal, sh, 'lightBrightness', parseFloat, v => v.toFixed(1));
        
        // Terrain Displacement
        this.bindInput(e.terrainDisplacement, e.terrainDisplacementVal, sh, 'terrainDisplacement', parseFloat, v => v.toFixed(2), false, (val) => {
            this.engine.settings.clouds.terrainDisplacement = val;
            this.engine.settings.cloudShadows.terrainDisplacement = val;
        });
    }

    setupCloudControls() {
        const c = this.engine.settings.clouds;
        const e = this.elements;

        this.bindInput(e.cloudSpeed, e.cloudSpeedVal, c, 'speed', parseFloat, v => v.toFixed(2));
        this.bindInput(e.cloudOpacity, e.cloudOpacityVal, c, 'opacity', parseFloat, v => v.toFixed(2));
        this.bindInput(e.cloudWarpIntensity, e.cloudWarpIntensityVal, c, 'warpIntensity', parseFloat, v => v.toFixed(2));
        this.bindInput(e.cloudWarpTime, e.cloudWarpTimeVal, c, 'warpTime', parseFloat, v => v.toFixed(2));
        this.bindInput(e.cloudThreshold, e.cloudThresholdVal, c, 'threshold', parseFloat, v => v.toFixed(2));
        this.bindInput(e.cloudTextureZoom, e.cloudTextureZoomVal, c, 'textureZoom', parseFloat, v => v.toFixed(2), false, (val) => {
             this.engine.settings.cloudShadows.textureZoom = val;
        });

        // Color Picker
        e.cloudColor.addEventListener('input', (ev) => {
            const rgb = hexToRgb(ev.target.value);
            c.color = rgb;
            e.cloudColorVal.textContent = ev.target.value;
        });
    }

    setupLayerControls() {
        const levels = this.engine.settings.layerLevels;
        const colors = this.engine.settings.layerColors;
        const e = this.elements;

        e.numLayers.value = this.engine.settings.app.numActiveLayers;
        e.numLayers.addEventListener('input', (ev) => {
            const val = parseInt(ev.target.value);
            this.engine.settings.app.numActiveLayers = val;
            e.numLayersVal.textContent = val;
            
            for (let i = 0; i <= 9; i++) {
                const row = e[`layer${i}Level`]?.parentElement;
                if (row) row.style.display = i < val ? 'flex' : 'none';
            }
        });

        // Layers
        for (let i = 0; i <= 9; i++) {
            const levelInput = e[`layer${i}Level`];
            const levelVal = e[`layer${i}Val`];
            if (levelInput) {
                levelInput.value = levels[`layer${i}`];
                levelVal.textContent = levels[`layer${i}`].toFixed(2);
                
                levelInput.addEventListener('input', (ev) => {
                    levels[`layer${i}`] = parseFloat(ev.target.value);
                    levelVal.textContent = levels[`layer${i}`].toFixed(2);
                });
            }

            // Colors
            const colorInput = e[`layer${i}Color`];
            if (colorInput) {
                colorInput.addEventListener('input', (ev) => {
                    colors[`layer${i}`] = hexToRgb(ev.target.value);
                });
            }
        }
    }
}
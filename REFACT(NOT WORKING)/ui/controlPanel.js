export class ControlPanel {
    constructor() {
        this.elements = {};
        this.init();
    }

    init() {
        this.elements = {
            toggleBtn: document.getElementById('controls-toggle'),
            panel: document.getElementById('controls'),
            closeBtn: document.getElementById('controls-close'),
            
            // Noise
            seedInput: document.getElementById('seed-input'),
            seedRandomBtn: document.getElementById('seed-random'),
            noiseType: document.getElementById('noise-type'),
            subdivisions: document.getElementById('subdivisons'),
            subdivisionsVal: document.getElementById('subdivisons-value'),
            octaves: document.getElementById('octaves'),
            octavesVal: document.getElementById('octaves-value'),
            persistence: document.getElementById('persistence'),
            persistenceVal: document.getElementById('persistence-value'),
            lacunarity: document.getElementById('lacunarity'),
            lacunarityVal: document.getElementById('lacunarity-value'),
            noiseZoom: document.getElementById('noise-zoom'),
            noiseZoomVal: document.getElementById('noise-zoom-value'),

            // Shaders / Visual
            wireframe: document.getElementById('wireframe-toggle'),
            lambertian: document.getElementById('lambertian-toggle'),
            cloudsToggle: document.getElementById('clouds-toggle'),
            
            lightSpeed: document.getElementById('light-speed'),
            lightSpeedVal: document.getElementById('light-speed-value'),
            lightBrightness: document.getElementById('light-brightness'),
            lightBrightnessVal: document.getElementById('light-brightness-value'),
            
            terrainDisplacement: document.getElementById('terrain-displacement'),
            terrainDisplacementVal: document.getElementById('terrain-displacement-value'),

            // Clouds
            cloudSpeed: document.getElementById('cloud-speed'),
            cloudSpeedVal: document.getElementById('cloud-speed-value'),
            cloudOpacity: document.getElementById('cloud-opacity'),
            cloudOpacityVal: document.getElementById('cloud-opacity-value'),
            cloudWarpIntensity: document.getElementById('cloud-warp-intensity'),
            cloudWarpIntensityVal: document.getElementById('cloud-warp-intensity-value'),
            cloudWarpTime: document.getElementById('cloud-warp-time'),
            cloudWarpTimeVal: document.getElementById('cloud-warp-time-value'),
            cloudThreshold: document.getElementById('cloud-threshold'),
            cloudThresholdVal: document.getElementById('cloud-threshold-value'),
            cloudColor: document.getElementById('cloud-color'),
            cloudColorVal: document.getElementById('cloud-color-value'),
            cloudTextureZoom: document.getElementById('cloud-texture-zoom'),
            cloudTextureZoomVal: document.getElementById('cloud-texture-zoom-value'),

            // Layers
            numLayers: document.getElementById('num-layers'),
            numLayersVal: document.getElementById('num-layers-value'),
        };

        for (let i = 0; i <= 9; i++) {
            this.elements[`layer${i}Level`] = document.getElementById(`layer${i}-level`);
            this.elements[`layer${i}Val`] = document.getElementById(`layer${i}-value`);
            this.elements[`layer${i}Color`] = document.getElementById(`layer${i}-color`);
        }

        this.setupVisibilityLogic();
    }

    setupVisibilityLogic() {
        const { toggleBtn, panel, closeBtn } = this.elements;

        toggleBtn.addEventListener('click', () => {
            panel.classList.add('controls-visible');
            toggleBtn.style.display = 'none';
        });

        closeBtn.addEventListener('click', () => {
            panel.classList.remove('controls-visible');
            toggleBtn.style.display = 'flex';
        });

        panel.addEventListener('mouseenter', () => document.body.classList.add('ui-hover'));
        panel.addEventListener('mouseleave', () => document.body.classList.remove('ui-hover'));
    }
    
    isMouseOver() {
        return document.body.classList.contains('ui-hover');
    }
}
import { getControlsElements } from '../config/elements.js';
import { hexToRgb } from '../utils/utils.js';

export function setupControls(state, renderer) {

    const elements = getControlsElements();

    function setupInputListeners(sliderElement, valueElement, targetObject, paramKey, parseFunc, formatFunc, debounce = true, onChangeCallback = null) {
        let timeoutId;
        if (!sliderElement) return;

        sliderElement.addEventListener('input', (e) => {
            targetObject[paramKey] = parseFunc(e.target.value);
            if (valueElement) valueElement.textContent = formatFunc(targetObject[paramKey]);

            clearTimeout(timeoutId);
            
            const action = () => {
                if (targetObject === state.noise) {
                    renderer.regenerateTerrain(state.noise);
                }
                if (onChangeCallback) {
                    onChangeCallback(targetObject[paramKey]);
                }
            };

            if (debounce) {
                timeoutId = setTimeout(action, 150);
            } else {
                action();
            }
        });
    }

    function setupLayerListeners(sliderElement, valueElement, targetObject, paramKey) {
        if (!sliderElement) return;
        sliderElement.addEventListener('input', (e) => {
            targetObject[paramKey] = parseFloat(e.target.value);
            if (valueElement) valueElement.textContent = parseFloat(e.target.value).toFixed(2);
            state.shaders.layers[paramKey] = parseFloat(e.target.value);
            renderer.setLayerLevels(targetObject);
        });
    }

    elements.seedInput.value = renderer.noiseGenerator.getSeed();

    //TOGGLES
    elements.wireframeToggle.addEventListener('change', (e) => state.app.showWireframe = e.target.checked);
    elements.lambertianDiffuseToggle.addEventListener('change', (e) => state.app.showLambertianDiffuse = e.target.checked);
    elements.cloudsToggle.addEventListener('change', (e) => state.app.showClouds = e.target.checked);
    elements.rimToggle.addEventListener('change', (e) => state.app.showRim = e.target.checked);
    elements.waterToggle.addEventListener('change', (e) => state.app.showWater = e.target.checked);
    elements.wavesToggle.addEventListener('change', (e) => state.app.showWaves = e.target.checked);

    //SEED
    elements.seedInput.addEventListener('change', (e) => {
        const newSeed = parseInt(e.target.value);
        if (!isNaN(newSeed) && newSeed >= 0 && newSeed <= 2147483647) {
            renderer.noiseGenerator.setSeed(newSeed);
        } else {
            e.target.value = renderer.noiseGenerator.getSeed();
        }
    });

    elements.seedRandomBtn.addEventListener('click', () => {
        const newSeed = Math.floor(Math.random() * 2147483647);
        elements.seedInput.value = newSeed;
        renderer.noiseGenerator.setSeed(newSeed);
        renderer.regenerateTerrain(state.noise);
    });

    //NOISE TYPE
    elements.noiseTypeSelect.addEventListener('change', (e) => {
        state.noise.noiseType = e.target.value;
        renderer.noiseGenerator.setNoiseType(e.target.value);
        renderer.regenerateTerrain(state.noise);
    });

    //LAYERS SLIDERS
    elements.numLayersSlider.addEventListener('input', (e) => {
        state.app.numActiveLayers = parseInt(e.target.value);
        elements.numLayersValue.textContent = state.app.numActiveLayers;
        
        const lastActiveKey = `layer${state.app.numActiveLayers - 1}Level`;
        const lastActiveValue = state.layerLevels[lastActiveKey] || 1.0;
        
        for (let i = state.app.numActiveLayers; i <= state.physics.MAX_LAYERS; i++) {
            state.layerLevels[`layer${i}Level`] = lastActiveValue;
        }

        renderer.setLayerLevels(state.layerLevels);
        
        for (let i = 0; i <= state.physics.MAX_LAYERS; i++) {
            const elId = `layer${i}-level`;
            const el = document.getElementById(elId);
            if (el && el.parentElement) {
                 el.parentElement.style.display = (i < state.app.numActiveLayers) ? 'flex' : 'none';
            }
        }
    });

    //SLIDERS
    //NOISE
    setupInputListeners(elements.subdivisionsSlider, elements.subdivisionsValue, state.noise, 'subdivisions', parseInt, (val) => val.toString(), false, (value) => {
        renderer.regenerateIcosphere(value, state.noise);
    });
    //setupInputListeners(elements.subdivisionsSlider, elements.subdivisionsValue, state.noise, 'subdivisions', parseInt, (val) => val.toString());
    setupInputListeners(elements.octavesSlider, elements.octavesValue, state.noise, 'octaves', parseInt, (val) => val.toString());
    setupInputListeners(elements.persistenceSlider, elements.persistenceValue, state.noise, 'persistence', parseFloat, (val) => val.toFixed(2));
    setupInputListeners(elements.lacunaritySlider, elements.lacunarityValue, state.noise, 'lacunarity', parseFloat, (val) => val.toFixed(2));
    setupInputListeners(elements.noiseZoomSlider, elements.noiseZoomValue, state.noise, 'noiseZoom', parseFloat, (val) => val.toFixed(2));

    //SHADERS
    setupInputListeners(elements.lightSpeed, elements.lightSpeedValue, state.shaders, 'lightSpeed', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.lightBrightness, elements.lightBrightnessValue, state.shaders, 'lightBrightness', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.terrainDisplacement, elements.terrainDisplacementValue, state.shaders, 'terrainDisplacement', parseFloat, (val) => val.toFixed(2), false, (value) => {
        state.shaders.terrainDisplacement = value;
        state.clouds.terrainDisplacement = value;
        state.cloudShadowParams.terrainDisplacement = value;
        state.water.terrainDisplacement = value;
        renderer.setTerrainDisplacement(value);
        if (window.updateRingHeights) {
            window.updateRingHeights();
        }
    });

    //RIM
    setupInputListeners(elements.rimIntensity, elements.rimIntensityValue, state.shaders, 'rimIntensity', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.rimSize, elements.rimSizeValue, state.shaders, 'rimSize', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.rimColor, elements.rimColorValue, state.shaders, 'rimColor', (val) => hexToRgb(val), (val) => {
        return `R: ${Math.round(val[0]*255)} G: ${Math.round(val[1]*255)} B: ${Math.round(val[2]*255)}`;
    }, false);

    //WATER
    setupInputListeners(elements.waterOpacity, elements.waterOpacityValue, state.water, 'waterOpacity', parseFloat, (val) => val.toFixed(2), false);


    //CLOUDS
    setupInputListeners(elements.cloudSpeed, elements.cloudSpeedValue, state.clouds, 'cloudSpeed', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.cloudWarpIntensity, elements.cloudWarpIntensityValue, state.clouds, 'cloudWarpIntensity', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.cloudWarpTime, elements.cloudWarpTimeValue, state.clouds, 'cloudWarpTime', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.cloudThreshold, elements.cloudThresholdValue, state.clouds, 'cloudThreshold', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.cloudAlpha, elements.cloudAlphaValue, state.clouds, 'cloudAlpha', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.cloudOpacity, elements.cloudOpacityValue, state.clouds, 'cloudOpacity', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(elements.cloudTextureZoom, elements.cloudTextureZoomValue, state.clouds, 'cloudTextureZoom', parseFloat, (val) => val.toFixed(2), false);
    

    setupInputListeners(elements.cloudSpeed, elements.cloudSpeedValue, state.clouds, 'cloudSpeed', parseFloat, (val) => val.toFixed(2), false, (value) => {
        state.cloudShadowParams.cloudSpeed = value;
    });

    setupInputListeners(elements.cloudWarpIntensity, elements.cloudWarpIntensityValue, state.clouds, 'cloudWarpIntensity', parseFloat, (val) => val.toFixed(2), false, (value) => {
        state.cloudShadowParams.cloudWarpIntensity = value;
    });

    setupInputListeners(elements.cloudThreshold, elements.cloudThresholdValue, state.clouds, 'cloudThreshold', parseFloat, (val) => val.toFixed(2), false, (value) => {
        state.cloudShadowParams.cloudThreshold = value;
    });

    setupInputListeners(elements.cloudAlpha, elements.cloudAlphaValue, state.clouds, 'cloudAlpha', parseFloat, (val) => val.toFixed(2), false, (value) => {
        state.cloudShadowParams.cloudAlpha = value;
    });

    setupInputListeners(elements.cloudTextureZoom, elements.cloudTextureZoomValue, state.clouds, 'cloudTextureZoom', parseFloat, (val) => val.toFixed(2), false, (value) => {
        state.cloudShadowParams.cloudTextureZoom = value;
    });
    
    setupInputListeners(elements.cloudColor, elements.cloudColorValue, state.clouds, 'cloudColor', (val) => hexToRgb(val), (val) => {
        return `R: ${Math.round(val[0]*255)} G: ${Math.round(val[1]*255)} B: ${Math.round(val[2]*255)}`;
    }, false);

    //LAYERS
    setupLayerListeners(elements.layer0Slider, elements.layer0Value, state.layerLevels, 'layer0Level');
    setupLayerListeners(elements.layer1Slider, elements.layer1Value, state.layerLevels, 'layer1Level');
    setupLayerListeners(elements.layer2Slider, elements.layer2Value, state.layerLevels, 'layer2Level');
    setupLayerListeners(elements.layer3Slider, elements.layer3Value, state.layerLevels, 'layer3Level');
    setupLayerListeners(elements.layer4Slider, elements.layer4Value, state.layerLevels, 'layer4Level');
    setupLayerListeners(elements.layer5Slider, elements.layer5Value, state.layerLevels, 'layer5Level');
    setupLayerListeners(elements.layer6Slider, elements.layer6Value, state.layerLevels, 'layer6Level');
    setupLayerListeners(elements.layer7Slider, elements.layer7Value, state.layerLevels, 'layer7Level');
    setupLayerListeners(elements.layer8Slider, elements.layer8Value, state.layerLevels, 'layer8Level');
    setupLayerListeners(elements.layer9Slider, elements.layer9Value, state.layerLevels, 'layer9Level');

    if(elements.layer0Color) {
        elements.layer0Color.addEventListener('input', (e) => {
            state.layerColors.layer0 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer1Color) {
        elements.layer1Color.addEventListener('input', (e) => {
            state.layerColors.layer1 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer2Color) {
        elements.layer2Color.addEventListener('input', (e) => {
            state.layerColors.layer2 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer3Color) {
        elements.layer3Color.addEventListener('input', (e) => {
            state.layerColors.layer3 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer4Color) {
        elements.layer4Color.addEventListener('input', (e) => {
            state.layerColors.layer4 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer5Color) {
        elements.layer5Color.addEventListener('input', (e) => {
            state.layerColors.layer5 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer6Color) {
        elements.layer6Color.addEventListener('input', (e) => {
            state.layerColors.layer6 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer7Color) {
        elements.layer7Color.addEventListener('input', (e) => {
            state.layerColors.layer7 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer8Color) {
        elements.layer8Color.addEventListener('input', (e) => {
            state.layerColors.layer8 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }
    if(elements.layer9Color) {
        elements.layer9Color.addEventListener('input', (e) => {
            state.layerColors.layer9 = hexToRgb(e.target.value);
            renderer.setLayerColors(state.layerColors);
        });
    }

    //UI PANEL
    if (elements.controlsPanel && elements.controlsToggle) {
        elements.controlsToggle.addEventListener('click', () => {
            elements.controlsPanel.classList.add('controls-visible');
            elements.controlsToggle.style.display = 'none';
        });

        elements.controlsClose.addEventListener('click', () => {
            elements.controlsPanel.classList.remove('controls-visible');
            elements.controlsToggle.style.display = 'flex';
        });

        document.addEventListener('click', (e) => {
            if (!elements.controlsPanel.contains(e.target) && 
                !elements.controlsToggle.contains(e.target) && 
                elements.controlsPanel.classList.contains('controls-visible')) {
                elements.controlsPanel.classList.remove('controls-visible');
                elements.controlsToggle.style.display = 'flex';
            }
        });

        elements.controlsPanel.addEventListener('mouseenter', () => { state.app.isMouseOverUI = true; });
        elements.controlsPanel.addEventListener('mouseleave', () => { state.app.isMouseOverUI = false; });
    }

    //OBJECTS - RINGS
    if (elements.addRingBtn) {
        elements.addRingBtn.addEventListener('click', () => {
            if (window.addRingToScene) {
                window.addRingToScene();
            }
        });
    }

    if (elements.clearRingsBtn) {
        elements.clearRingsBtn.addEventListener('click', () => {
            if (window.clearAllRings) {
                window.clearAllRings();
            }
        });
    }
}
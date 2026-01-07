import { Renderer } from './renderer.js';
import { hexToRgb, easing } from './utils.js';
import { DEFAULT_VARIABLES_VALUES } from './default-values.js';
import { loadOBJ } from './obj-loader.js';

async function loadTexture(renderer, url) {
    return new Promise((resolve) => {
        const texture = renderer.gl.createTexture();
        const image = new Image();
        image.onload = () => {
            renderer.gl.bindTexture(renderer.gl.TEXTURE_2D, texture);
            renderer.gl.texImage2D(renderer.gl.TEXTURE_2D, 0, renderer.gl.RGBA, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, image);
            renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_WRAP_S, renderer.gl.REPEAT);
            renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_WRAP_T, renderer.gl.REPEAT);
            renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_MIN_FILTER, renderer.gl.LINEAR);
            renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_MAG_FILTER, renderer.gl.LINEAR);
            renderer.gl.generateMipmap(renderer.gl.TEXTURE_2D);
            resolve(texture);
        };
        image.src = url;
    });
}

function getCanvasElement() {
    return document.querySelector("#glcanvas");
}

function getControlsElements() {
    return {
        controlsToggle: document.getElementById('controls-toggle'),
        controlsPanel : document.getElementById('controls'),
        controlsClose : document.getElementById('controls-close'),
        seedInput     : document.getElementById('seed-input'),
        seedRandomBtn : document.getElementById('seed-random'),
        subdivisionsSlider : document.getElementById('subdivisons'),
        subdivisionsValue  : document.getElementById('subdivisons-value'),
        octavesSlider : document.getElementById('octaves'),
        octavesValue  : document.getElementById('octaves-value'),
        persistenceSlider: document.getElementById('persistence'),
        persistenceValue: document.getElementById('persistence-value'),
        lacunaritySlider: document.getElementById('lacunarity'),
        lacunarityValue: document.getElementById('lacunarity-value'),
        noiseZoomSlider: document.getElementById('noise-zoom'),
        noiseZoomValue: document.getElementById('noise-zoom-value'),
        wireframeToggle: document.getElementById('wireframe-toggle'),
        lightSpeed: document.getElementById('light-speed'),
        lightSpeedValue: document.getElementById('light-speed-value'),
        lightBrightness: document.getElementById('light-brightness'),
        lightBrightnessValue: document.getElementById('light-brightness-value'),
        lambertianDiffuseToggle: document.getElementById('lambertian-toggle'),
        cloudSpeed: document.getElementById('cloud-speed'),
        cloudSpeedValue: document.getElementById('cloud-speed-value'),
        cloudOpacity: document.getElementById('cloud-opacity'),
        cloudOpacityValue: document.getElementById('cloud-opacity-value'),
        cloudWarpIntensity: document.getElementById('cloud-warp-intensity'),
        cloudWarpIntensityValue: document.getElementById('cloud-warp-intensity-value'),
        cloudWarpTime: document.getElementById('cloud-warp-time'),
        cloudWarpTimeValue: document.getElementById('cloud-warp-time-value'),
        cloudThreshold: document.getElementById('cloud-threshold'),
        cloudThresholdValue: document.getElementById('cloud-threshold-value'),
        cloudAlpha: document.getElementById('cloud-alpha'),
        cloudAlphaValue: document.getElementById('cloud-alpha-value'),
        cloudColor: document.getElementById('cloud-color'),
        cloudColorValue: document.getElementById('cloud-color-value'),
        cloudTextureZoom: document.getElementById('cloud-texture-zoom'),
        cloudTextureZoomValue: document.getElementById('cloud-texture-zoom-value'),
        terrainDisplacement: document.getElementById('terrain-displacement'),
        terrainDisplacementValue: document.getElementById('terrain-displacement-value'),
        numLayersSlider: document.getElementById('num-layers'),
        numLayersValue: document.getElementById('num-layers-value'),
        layer0Slider: document.getElementById('layer0-level'),
        layer1Slider: document.getElementById('layer1-level'),
        layer2Slider: document.getElementById('layer2-level'),
        layer3Slider: document.getElementById('layer3-level'),
        layer4Slider: document.getElementById('layer4-level'),  
        layer5Slider: document.getElementById('layer5-level'),  
        layer6Slider: document.getElementById('layer6-level'),  
        layer7Slider: document.getElementById('layer7-level'),  
        layer8Slider: document.getElementById('layer8-level'),  
        layer9Slider: document.getElementById('layer9-level'),  
        layer10Slider: document.getElementById('layer10-level'), 
        layer0Value: document.getElementById('layer0-value'),
        layer1Value: document.getElementById('layer1-value'),
        layer2Value: document.getElementById('layer2-value'),
        layer3Value: document.getElementById('layer3-value'),
        layer4Value: document.getElementById('layer4-value'),
        layer5Value: document.getElementById('layer5-value'),
        layer6Value: document.getElementById('layer6-value'),
        layer7Value: document.getElementById('layer7-value'),
        layer8Value: document.getElementById('layer8-value'),
        layer9Value: document.getElementById('layer9-value'),
        layer10Value: document.getElementById('layer10-value'),
        layer0Color: document.getElementById('layer0-color'),
        layer1Color: document.getElementById('layer1-color'),
        layer2Color: document.getElementById('layer2-color'),
        layer3Color: document.getElementById('layer3-color'),
        layer4Color: document.getElementById('layer4-color'),
        layer5Color: document.getElementById('layer5-color'),
        layer6Color: document.getElementById('layer6-color'),
        layer7Color: document.getElementById('layer7-color'),
        layer8Color: document.getElementById('layer8-color'),
        layer9Color: document.getElementById('layer9-color'),
    }
}

async function main() {
    
    const canvas = getCanvasElement();
    const {
        controlsToggle, controlsPanel, controlsClose,
        seedInput, seedRandomBtn,
        subdivisionsSlider, subdivisionsValue,
        octavesSlider, octavesValue,
        persistenceSlider, persistenceValue,
        lacunaritySlider, lacunarityValue,
        noiseZoomSlider, noiseZoomValue,
        wireframeToggle,
        lightSpeed, lightSpeedValue, lightBrightness, lightBrightnessValue, lambertianDiffuseToggle,
        cloudSpeed, cloudSpeedValue,
        cloudOpacity, cloudOpacityValue,
        cloudWarpIntensity, cloudWarpIntensityValue,
        cloudWarpTime, cloudWarpTimeValue,
        cloudThreshold, cloudThresholdValue,
        cloudAlpha, cloudAlphaValue,
        cloudColor, cloudColorValue,
        cloudTextureZoom, cloudTextureZoomValue,
        terrainDisplacement, terrainDisplacementValue,
        numLayersSlider, numLayersValue,
        layer0Slider, layer1Slider, layer2Slider, layer3Slider, layer4Slider, layer5Slider, layer6Slider, layer7Slider, layer8Slider, layer9Slider, 
        layer0Value, layer1Value, layer2Value, layer3Value, layer4Value, layer5Value, layer6Value, layer7Value, layer8Value, layer9Value,
        layer0Color, layer1Color, layer2Color, layer3Color, layer4Color, layer5Color, layer6Color, layer7Color, layer8Color, layer9Color,
    } = getControlsElements();

    let {
        MOUSE_ROTATION_SPEED,
        MAX_LAYERS,
        MAX_CLOUD_LAYERS,
        MAX_CLOUD_OFFSET,
        MIN_PHI,
        MAX_PHI,
        AUTO_ROTATE,
        _LEFT_BUTTOM_VALUE,
        noiseParams,
        camera,
        layerLevels,
        layerColors,
        shadersParams,
        cloudParams,
        cloudShadowParams,
        numActiveLayers,
        numActiveCloudLayers,
        cloudLayerOffset,
        isMouseOverUI,
        isModifyingTerrain,
        showWireframe,
        showLambertianDiffuse
    } = DEFAULT_VARIABLES_VALUES;

    const renderer = new Renderer(canvas, noiseParams);

    if (!renderer.gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    seedInput.value = renderer.noiseGenerator.getSeed();

    wireframeToggle.addEventListener('change', (e) => {
        showWireframe = e.target.checked;
    });

    lambertianDiffuseToggle.addEventListener('change', (e) => {
        showLambertianDiffuse = e.target.checked;
    });

    seedInput.addEventListener('change', (e) => {
        const newSeed = parseInt(e.target.value);
        if (!isNaN(newSeed) && newSeed >= 0 && newSeed <= 2147483647) {
            renderer.noiseGenerator.setSeed(newSeed);
        } else {
            e.target.value = renderer.noiseGenerator.getSeed();
        }
    });

    seedRandomBtn.addEventListener('click', () => {
        const newSeed = Math.floor(Math.random() * 2147483647);
        seedInput.value = newSeed;
        renderer.noiseGenerator.setSeed(newSeed);
        renderer.regenerateTerrain(noiseParams);
    });

    numLayersSlider.addEventListener('input', (e) => {
        numActiveLayers = parseInt(e.target.value);
        numLayersValue.textContent = numActiveLayers;
        
        const activeLayerKeys = [];
        for (let i = 0; i < numActiveLayers && i <= MAX_LAYERS; i++) {
            activeLayerKeys.push(`layer${i}`);
        }
        
        const lastActiveValue = layerLevels[`layer${numActiveLayers - 1}`] || 1.0;
        for (let i = numActiveLayers; i <= MAX_LAYERS; i++) {
            layerLevels[`layer${i}`] = lastActiveValue;
        }

        renderer.setLayerLevels(layerLevels);
        
        for (let i = 0; i <= MAX_LAYERS; i++) {
            const layerControl = document.getElementById(`layer${i}-level`).parentElement;
            if (i < numActiveLayers) {
                layerControl.style.display = 'flex';
            } else {
                layerControl.style.display = 'none';
            }
        }
    });

    function setupInputListeners(sliderElement, valueElement, targetObject, paramKey, parseFunc, formatFunc, debounce=true, onChangeCallback=null) {
        let timeoutId;
        sliderElement.addEventListener('input', (e) => {
            targetObject[paramKey] = parseFunc(e.target.value);
            valueElement.textContent = formatFunc(targetObject[paramKey]);
            
            clearTimeout(timeoutId);
            //ISSO AQUI SERVE PARA ADICIONAR UM TEMPINHO ANTES DE CHAMAR A FUNCAO
            if (debounce) {
                timeoutId = setTimeout(() => { renderer.regenerateTerrain(noiseParams); }, 150);
            } else {
                //FIZ ISSO AQUI PRA CHAMAR UMA FUNCAO DE CALLBACK QUANDO MUDAR UM PARAMETRO QUE PRECISE REGERAR OUTRA COISA
                if (onChangeCallback){ onChangeCallback(targetObject[paramKey]); }
            }
        });   
    }

    function setupLayerListeners(sliderElement, valueElement, targetObject, paramKey) {
        sliderElement.addEventListener('input', (e) => {
            targetObject[paramKey] = parseFloat(e.target.value);
            valueElement.textContent = parseFloat(e.target.value).toFixed(2);
            renderer.setLayerLevels(targetObject); 
        });
    }

    // function setupLayerColorListeners() {
    //     for (let i = 0; i < MAX_LAYERS; i++) {
    //         const layerColorInput = document.getElementById(`layer${i}-color`);
    //         layerColorInput.addEventListener('input', (e) => {
    //             layerColors[`layer${i}`] = hexToRgb(e.target.value);
    //             renderer.setLayerColors(layerColors);
    //         });
    //     }
    // }

    // function setupLayers(){
    //     setupLayerColorListeners();
    //     for (let i = 0; i < MAX_LAYERS; i++) {
    //         setupLayerListeners(
    //             document.getElementById(`layer${i}-level`), 
    //             document.getElementById(`layer${i}-value`), 
    //             layerLevels, 
    //             `layer${i}`
    //         );
    //     }
    // }


    //ARRUMAR ISSO AQUI PARA FAZER O SETUP DE TODAS AS CORES NUMA FUNCAO SO!
    layer0Color.addEventListener('input', (e) => {
        layerColors.layer0 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer1Color.addEventListener('input', (e) => {
        layerColors.layer1 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer2Color.addEventListener('input', (e) => {
        layerColors.layer2 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer3Color.addEventListener('input', (e) => {
        layerColors.layer3 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer4Color.addEventListener('input', (e) => {
        layerColors.layer4 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer5Color.addEventListener('input', (e) => {
        layerColors.layer5 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer6Color.addEventListener('input', (e) => {
        layerColors.layer6 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer7Color.addEventListener('input', (e) => {
        layerColors.layer7 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer8Color.addEventListener('input', (e) => {
        layerColors.layer8 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });
    layer9Color.addEventListener('input', (e) => {
        layerColors.layer9 = hexToRgb(e.target.value);
        renderer.setLayerColors(layerColors);
    });

    renderer.setGeometry(noiseParams.subdivisions);
    renderer.setLightSpeed(shadersParams.lightSpeed);
    renderer.setLightBrightness(shadersParams.lightBrightness);
    renderer.setLayerLevels(layerLevels);
    renderer.setLayerColors(layerColors);

    setupInputListeners(subdivisionsSlider, subdivisionsValue, noiseParams, 'subdivisions', parseInt, (val) => val.toString(), false, (value) => { 
        renderer.regenerateIcosphere(value, noiseParams);
        return value;
    });
    setupInputListeners(octavesSlider,      octavesValue,     noiseParams, 'octaves',     parseInt,   (val) => val.toString());
    setupInputListeners(persistenceSlider,  persistenceValue, noiseParams, 'persistence', parseFloat, (val) => val.toFixed(2));
    setupInputListeners(lacunaritySlider,   lacunarityValue,  noiseParams, 'lacunarity',  parseFloat, (val) => val.toFixed(2));
    setupInputListeners(noiseZoomSlider,    noiseZoomValue,   noiseParams, 'noiseZoom',   parseFloat, (val) => val.toFixed(2));
    
    setupInputListeners(lightSpeed, lightSpeedValue,  shadersParams, 'lightSpeed', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(lightBrightness, lightBrightnessValue,  shadersParams, 'lightBrightness', parseFloat, (val) => val.toFixed(2), false);


    setupInputListeners(cloudSpeed, cloudSpeedValue, cloudParams, 'cloudSpeed', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudWarpIntensity, cloudWarpIntensityValue, cloudParams, 'cloudWarpIntensity', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudWarpTime, cloudWarpTimeValue, cloudParams, 'cloudWarpTime', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudThreshold, cloudThresholdValue, cloudParams, 'cloudThreshold', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudAlpha, cloudAlphaValue, cloudParams, 'cloudAlpha', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudOpacity, cloudOpacityValue, cloudParams, 'cloudOpacity', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudColor, cloudColorValue, cloudParams, 'cloudColor', (val) => hexToRgb(val), (val) => {
        return `R: ${Math.round(val[0]*255)} G: ${Math.round(val[1]*255)} B: ${Math.round(val[2]*255)}`;
    }, false);
    setupInputListeners(terrainDisplacement, terrainDisplacementValue, shadersParams, 'terrainDisplacement', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudTextureZoom, cloudTextureZoomValue, cloudParams, 'cloudTextureZoom', parseFloat, (val) => val.toFixed(2), false);
    setupInputListeners(cloudTextureZoom, cloudTextureZoomValue, cloudShadowParams, 'cloudTextureZoom', parseFloat, (val) => val.toFixed(2), false);
    setupLayerListeners(layer0Slider, layer0Value, layerLevels, 'layer0Level');
    setupLayerListeners(layer1Slider, layer1Value, layerLevels, 'layer1Level');
    setupLayerListeners(layer2Slider, layer2Value, layerLevels, 'layer2Level');
    setupLayerListeners(layer3Slider, layer3Value, layerLevels, 'layer3Level');
    setupLayerListeners(layer4Slider, layer4Value, layerLevels, 'layer4Level');
    setupLayerListeners(layer5Slider, layer5Value, layerLevels, 'layer5Level');
    setupLayerListeners(layer6Slider, layer6Value, layerLevels, 'layer6Level');
    setupLayerListeners(layer7Slider, layer7Value, layerLevels, 'layer7Level');
    setupLayerListeners(layer8Slider, layer8Value, layerLevels, 'layer8Level');
    setupLayerListeners(layer9Slider, layer9Value, layerLevels, 'layer9Level');

    //setupLayerColorListeners();

    let cloudTexture = await loadTexture(renderer, 'assets/noises/cloud2.png');
    renderer.setCloudTexture(cloudTexture);

    //GAMBIARRA DO KRL PARA DE SER PREGUICOSO E MUDA ISSO AQUI
    const planeGeometry = await loadOBJ('assets/models/satellite.obj');
    const plane = renderer.addObject(planeGeometry, 
        [0, 0, 0],      // posição
        [0.05, 0.05, 0.05] // escala
    );
    plane.color = [0.9, 0.4, 0.1]; // Laranja mais vibrante
    // Configurar órbita
    plane.orbitRadius = 2;
    plane.orbitSpeed = 0.001;
    //plane.rotation[1] = Math.PI / 4;
    plane.rotationOffset = [0, Math.PI/2, -Math.PI/2]; // [pitch, yaw, roll] - ajuste esses valores
    plane.lookAtCenter = true;
    function handleZoom(event) {
        if (isMouseOverUI) return;
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        const zoomStep = 0.35;
        camera.radius += delta * zoomStep;
    }

    function handleMouseDown(event) {
        if (isMouseOverUI) return;
        if (event.button !== _LEFT_BUTTOM_VALUE) return; 
        
        camera.isDragging = true;
        camera.lastMouseX = event.clientX;
        camera.lastMouseY = event.clientY;
        
        canvas.style.cursor = 'grabbing';
    }

    function handleMouseUp(event) {
        if (event.button !== _LEFT_BUTTOM_VALUE) return;
        
        camera.isDragging = false;
        canvas.style.cursor = 'grab';
    }

    function handleMouseLeave(event) {
        camera.isDragging = false;
        canvas.style.cursor = 'grab';
    }

    function handleMouseMove(event) {
        if (!camera.isDragging || isMouseOverUI) return;

        const deltaX = event.clientX - camera.lastMouseX;
        const deltaY = event.clientY - camera.lastMouseY;

        camera.theta += deltaX * MOUSE_ROTATION_SPEED;
        camera.phi -= deltaY * MOUSE_ROTATION_SPEED;

        camera.phi = Math.max(MIN_PHI, Math.min(MAX_PHI, camera.phi));

        camera.theta = camera.theta % (2 * Math.PI);

        camera.lastMouseX = event.clientX;
        camera.lastMouseY = event.clientY;

        const x = camera.radius * Math.sin(camera.phi) * Math.cos(camera.theta);
        const y = camera.radius * Math.cos(camera.phi);
        const z = camera.radius * Math.sin(camera.phi) * Math.sin(camera.theta);

        renderer.cameraPosition = { x, y, z };
    }

    const animation = {
        isAnimating: true,
        startTime: performance.now(),
        duration: 3000, 
        startScale: 0.005,
        targetScale: 1.0,
        currentScale: 0.005,
    };

    function handleAnimation() {
        const time = performance.now() / 1000;
        const cameraPosition ={
            x: camera.radius * Math.sin(camera.phi) * Math.cos(camera.theta),
            y: camera.radius * Math.cos(camera.phi),
            z: camera.radius * Math.sin(camera.phi) * Math.sin(camera.theta)
        }

        if (animation.isAnimating) {
            const elapsed = performance.now() - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1.0);
            
        
            //const easedProgress = easing.easeOutBack(progress);
            //const easedProgress = easing.easeOutCubic(progress);
            const easedProgress = easing.easeOutElastic(progress);
            
            animation.currentScale = animation.startScale + 
                (animation.targetScale - animation.startScale) * easedProgress;
            
            shadersParams.planetScale = animation.currentScale;
            cloudParams.planetScale = animation.currentScale;
            cloudShadowParams.planetScale = animation.currentScale;
            
            if (progress >= 1.0) {
                animation.isAnimating = false;
                shadersParams.planetScale = animation.targetScale;
                cloudParams.planetScale = animation.targetScale;
                cloudShadowParams.planetScale = animation.targetScale;
            }
        }
        
        renderer.clearScreen();
        if (isModifyingTerrain) {
            renderer.regenerateTerrain(noiseParams);
        }
        //PLANETA
        renderer.render(time, cameraPosition, shadersParams, showWireframe, showLambertianDiffuse, AUTO_ROTATE, 1.);
        //SOMBRA DAS NUVENS
        renderer.render(time, cameraPosition, cloudShadowParams, showWireframe, showLambertianDiffuse, AUTO_ROTATE, 3.);
        //NUVENS
        for (let i = 0; i < numActiveCloudLayers; i++) {
            let layerOpacity = cloudParams.opacity / numActiveCloudLayers;
            const layerParams = {
                ...cloudParams,
                scale: cloudParams.scale + (i * cloudLayerOffset),
                opacity: layerOpacity,
            };
            renderer.render(time, cameraPosition, layerParams, showWireframe, showLambertianDiffuse, AUTO_ROTATE, 2.);
        }
        renderer.objects.forEach(obj => {
            renderer.renderObject(obj, time, shadersParams);
        });
        
        requestAnimationFrame(handleAnimation);
    }

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleZoom);

    controlsToggle.addEventListener('click', () => {
      controlsPanel.classList.add('controls-visible');
      controlsToggle.style.display = 'none';
    });

    controlsClose.addEventListener('click', () => {
      controlsPanel.classList.remove('controls-visible');
      controlsToggle.style.display = 'flex';
    });

    document.addEventListener('click', (e) => {
      if (!controlsPanel.contains(e.target) && !controlsToggle.contains(e.target) && controlsPanel.classList.contains('controls-visible')) {
        controlsPanel.classList.remove('controls-visible');
        controlsToggle.style.display = 'flex';
      }
    });

    controlsPanel.addEventListener('mouseenter', () => { isMouseOverUI = true; });
    controlsPanel.addEventListener('mouseleave', () => { isMouseOverUI = false; });

    handleAnimation();
}
main();
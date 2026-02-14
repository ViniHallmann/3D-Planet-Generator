import { CONSTANTS } from './constants.js';

let defaultLayerLevels = {
    layer0Level: 0.35,
    layer1Level: 0.45,
    layer2Level: 0.50,
    layer3Level: 0.55,
    layer4Level: 0.60,
    layer5Level: 0.65,
    layer6Level: 0.70,
    layer7Level: 0.75,
    layer8Level: 0.80,
    layer9Level: 0.90,
};

export const DEFAULTS = {
    app : {
        numActiveLayers: CONSTANTS.MAX_LAYERS,
        numActiveCloudLayers: CONSTANTS.MAX_CLOUD_LAYERS,
        cloudLayerOffset: CONSTANTS.MAX_CLOUD_OFFSET,
        isMouseOverUI: false,
        showWireframe: false,
        showLambertianDiffuse: false,
        showClouds: false,
        showRim: true,
        showWater: true,
        showWaves: true,
        topDownMode: false,
    },

    noise : {
        subdivisions: 6,
        octaves: 4,    
        persistence: 0.5, 
        lacunarity: 2.0 ,
        noiseZoom: 1.0,
        noiseResolution: 512,
        noiseType: 'simplex',      
    },
    
    camera : {
        theta: 0,           
        phi: Math.PI / 4,   
        radius: 10,         
        isDragging: false,
        lastMouseX: 0,
        lastMouseY: 0
    },

    layerLevels : defaultLayerLevels,
    // layerLevels : {
    //     layer0Level: 0.35,
    //     layer1Level: 0.45,
    //     layer2Level: 0.50,
    //     layer3Level: 0.55,
    //     layer4Level: 0.60,
    //     layer5Level: 0.65,
    //     layer6Level: 0.70,
    //     layer7Level: 0.75,
    //     layer8Level: 0.80,
    //     layer9Level: 0.90,
    // },

    // layerColors : {
    //     layer0:  [0.0, 0.0, 0.502],     // #000080
    //     layer1:  [0.0, 0.0, 1.0],       // #0000ff
    //     layer2:  [0.0, 0.502, 1.0],     // #0080ff
    //     layer3:  [0.8, 0.702, 0.502],   // #ccb380
    //     layer4:  [0.2, 1.0, 0.2],       // #33ff33
    //     layer5:  [0.0, 0.502, 0.0],     // #008000
    //     layer6:  [0.502, 0.502, 0.502], // #808080
    //     layer7:  [0.251, 0.251, 0.251], // #404040
    //     layer8:  [0.702, 0.42, 0.0],    // #b36b00
    //     layer9:  [1.0, 1.0, 1.0],       // #ffffff
    // },
    
    layerColors : {
        layer0:  [0.031, 0.133, 0.243],   // #08223e  - oceano profundo #000080
        layer1:  [0.102, 0.247, 0.384],   // #1a3f62  - oceano médio #0000ff
        layer2:  [0.212, 0.349, 0.443],   // #365962  - oceano raso #0080ff
        layer3:  [0.345, 0.447, 0.384],   // #587262  - costa/estuário #ccb380
        layer4:  [0.802, 0.702, 0.502],   // #898961  - areia/praia #33ff33
        layer5:  [0.349, 0.447, 0.251],   // #58723f  - vegetação baixa #008000
        layer6:  [0.251, 0.349, 0.200],   // #405934  - floresta densa #808080
        layer7:  [0.447, 0.384, 0.298],   // #72624c  - montanhas/rochas #404040
        layer8:  [0.753, 0.753, 0.753],   // #c0c0c0  - neve/rocha clara #b36b00
        layer9:  [0.980, 0.980, 0.980],   // #fafafa  - neve/gelo puro #8b4513
    },

    shaders : {
        lightSpeed: 0.5,
        lightBrightness: 1.0,
        lightAngle: 0,
        lightPitch: 0.5,
        lightDistance: 5.0,
        layers : defaultLayerLevels,
        terrainDisplacement: 0.3,
        planetScale: 0.05,
        rimColor: [0.0, 0.5, 1.0],
        rimIntensity: 0.5,
    },

    clouds : {
        cloudOpacity: 0.5,
        cloudScale: 1.15,
        cloudWarpIntensity: 0.1,
        cloudWarpTime: 1.0,
        cloudThreshold: 0.65,
        cloudAlpha: 0.5,
        cloudColor: [1.0, 1.0, 1.0],
        cloudTextureZoom: 1.10,
        cloudSpeed: 0.01,
        planetScale: 0.05,
        terrainDisplacement: 0.3,
    },

    cloudShadowParams : {
        cloudOpacity: 0.35,
        cloudScale: 1.15,
        cloudWarpIntensity: 0.1,
        cloudWarpTime: 1.0,
        cloudThreshold: 0.65,
        cloudAlpha: 0.85,
        cloudColor: [0.0, 0.0, 0.0],
        terrainDisplacement: 0.3,
        cloudTextureZoom: 1.10,
        planetScale: 0.05,
    },

    water: {
        waterLevel: 0.35,
        waterColor: [0.0, 0.3, 0.6],
        waterOpacity: 0.0,
        waterScale: 0.05,
        terrainDisplacement: 0.3,
    },

    game : {
        score: 0,
        isPlaying: false,
    }
}
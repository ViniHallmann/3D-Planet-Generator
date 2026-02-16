import { CONSTANTS } from './constants.js';

let defaultLayerLevels = {
    layer0Level: 0.15,
    layer1Level: 0.35,
    layer2Level: 0.50,
    layer3Level: 0.55,
    layer4Level: 0.60,
    layer5Level: 0.65,
    layer6Level: 0.70,
    layer7Level: 0.75,
    layer8Level: 0.80,
    layer9Level: 0.90,
};

export const PRESETS = {
    realista: {
        layerColors: {
            layer0: [0.020, 0.080, 0.180],
            layer1: [0.050, 0.150, 0.300],
            layer2: [0.100, 0.250, 0.400],
            layer3: [0.600, 0.550, 0.400],
            layer4: [0.760, 0.700, 0.500],
            layer5: [0.300, 0.450, 0.200],
            layer6: [0.200, 0.350, 0.150],
            layer7: [0.450, 0.450, 0.450],
            layer8: [0.650, 0.650, 0.650],
            layer9: [0.950, 0.950, 0.970],
        },
        slopeColor: [0.400, 0.400, 0.400],
    },
    
    vibrante: {
        layerColors: {
            layer0: [0.000, 0.100, 0.350],
            layer1: [0.000, 0.200, 0.500],
            layer2: [0.100, 0.400, 0.600],
            layer3: [0.200, 0.550, 0.500],
            layer4: [0.950, 0.850, 0.550],
            layer5: [0.400, 0.700, 0.200],
            layer6: [0.150, 0.550, 0.100],
            layer7: [0.550, 0.450, 0.350],
            layer8: [0.800, 0.800, 0.850],
            layer9: [1.000, 1.000, 1.000],
        },
        slopeColor: [0.500, 0.400, 0.300],
    },

    verde: {
        layerColors: {
            layer0: [0.050, 0.150, 0.100],
            layer1: [0.100, 0.250, 0.150],
            layer2: [0.150, 0.350, 0.200],
            layer3: [0.300, 0.450, 0.250],
            layer4: [0.500, 0.600, 0.300],
            layer5: [0.200, 0.700, 0.400],
            layer6: [0.100, 0.550, 0.350],
            layer7: [0.400, 0.500, 0.450],
            layer8: [0.600, 0.700, 0.650],
            layer9: [0.800, 0.900, 0.850],
        },
        slopeColor: [0.300, 0.500, 0.400],
    },

    deserto: {
        layerColors: {
            layer0: [0.600, 0.400, 0.250],
            layer1: [0.700, 0.500, 0.300],
            layer2: [0.750, 0.550, 0.350],
            layer3: [0.800, 0.600, 0.400],
            layer4: [0.850, 0.650, 0.450],
            layer5: [0.750, 0.550, 0.350],
            layer6: [0.650, 0.450, 0.300],
            layer7: [0.550, 0.400, 0.300],
            layer8: [0.700, 0.550, 0.450],
            layer9: [0.900, 0.800, 0.700],
        },
        slopeColor: [0.500, 0.350, 0.250],
    },

    gelo: {
        layerColors: {
            layer0: [0.100, 0.150, 0.250],
            layer1: [0.150, 0.200, 0.350],
            layer2: [0.200, 0.300, 0.450],
            layer3: [0.500, 0.600, 0.700],
            layer4: [0.700, 0.750, 0.800],
            layer5: [0.750, 0.800, 0.850],
            layer6: [0.800, 0.850, 0.900],
            layer7: [0.850, 0.880, 0.920],
            layer8: [0.900, 0.920, 0.950],
            layer9: [0.950, 0.970, 1.000],
        },
        slopeColor: [0.600, 0.650, 0.750],
    },

    vulcanico: {
        layerColors: {
            layer0: [0.900, 0.200, 0.050],
            layer1: [0.800, 0.300, 0.100],
            layer2: [0.700, 0.250, 0.100],
            layer3: [0.400, 0.200, 0.150],
            layer4: [0.300, 0.200, 0.180],
            layer5: [0.250, 0.200, 0.180],
            layer6: [0.200, 0.180, 0.170],
            layer7: [0.150, 0.140, 0.130],
            layer8: [0.200, 0.190, 0.180],
            layer9: [0.300, 0.280, 0.250],
        },
        slopeColor: [0.200, 0.150, 0.100],
    },

    oceano: {
        layerColors: {
            layer0: [0.000, 0.050, 0.200],
            layer1: [0.000, 0.100, 0.300],
            layer2: [0.000, 0.200, 0.400],
            layer3: [0.100, 0.350, 0.500],
            layer4: [0.200, 0.500, 0.600],
            layer5: [0.300, 0.600, 0.650],
            layer6: [0.400, 0.650, 0.700],
            layer7: [0.600, 0.550, 0.450],
            layer8: [0.750, 0.700, 0.600],
            layer9: [0.900, 0.850, 0.750],
        },
        slopeColor: [0.500, 0.450, 0.400],
    },

    toxico: {
        layerColors: {
            layer0: [0.200, 0.300, 0.050],
            layer1: [0.300, 0.400, 0.100],
            layer2: [0.400, 0.500, 0.150],
            layer3: [0.350, 0.300, 0.200],
            layer4: [0.400, 0.350, 0.250],
            layer5: [0.500, 0.450, 0.150],
            layer6: [0.450, 0.400, 0.200],
            layer7: [0.350, 0.350, 0.300],
            layer8: [0.450, 0.500, 0.350],
            layer9: [0.550, 0.600, 0.400],
        },
        slopeColor: [0.350, 0.350, 0.250],
    },

    marte: {
        layerColors: {
            layer0: [0.400, 0.200, 0.150],
            layer1: [0.500, 0.250, 0.180],
            layer2: [0.550, 0.280, 0.200],
            layer3: [0.600, 0.300, 0.200],
            layer4: [0.650, 0.350, 0.220],
            layer5: [0.700, 0.380, 0.250],
            layer6: [0.600, 0.350, 0.280],
            layer7: [0.550, 0.400, 0.350],
            layer8: [0.700, 0.550, 0.500],
            layer9: [0.850, 0.750, 0.700],
        },
        slopeColor: [0.450, 0.300, 0.250],
    },
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
        showStars: true,
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
    
    layerColors: {
        layer0: [0.000, 0.100, 0.350],
        layer1: [0.000, 0.200, 0.500],
        layer2: [0.100, 0.400, 0.600],
        layer3: [0.200, 0.550, 0.500],
        layer4: [0.950, 0.850, 0.550],
        layer5: [0.400, 0.700, 0.200],
        layer6: [0.150, 0.550, 0.100],
        layer7: [0.550, 0.450, 0.350],
        layer8: [0.800, 0.800, 0.850],
        layer9: [1.000, 1.000, 1.000],
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
        slopeColor: [0.500, 0.400, 0.300],
        slopeThreshold: 0.2,
        slopeBlend: 0.5,
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
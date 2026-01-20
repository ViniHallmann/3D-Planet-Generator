export const DEFAULT_SETTINGS = {
    app: {
        numActiveLayers: 10,
        numActiveCloudLayers: 10,
        cloudLayerOffset: 0.0015,
        isMouseOverUI: false,
        showWireframe: false,
        showLambertianDiffuse: true,
        showClouds: true,
        topDownMode: false,
    },

    noise: {
        subdivisions: 6,
        octaves: 4,    
        persistence: 0.5, 
        lacunarity: 2.0,
        noiseZoom: 1.0,
        noiseResolution: 512,
        noiseType: 'simplex',      
    },

    camera: {
        theta: 0,           
        phi: Math.PI / 4,   
        radius: 10,         
    },

    layerLevels: {
        layer0: 0.35, layer1: 0.45, layer2: 0.50, layer3: 0.55, layer4: 0.60,
        layer5: 0.65, layer6: 0.70, layer7: 0.75, layer8: 0.80, layer9: 0.90,
    },

    layerColors: {
        layer0: [0.0, 0.0, 0.502],     // #000080
        layer1: [0.0, 0.0, 1.0],       // #0000ff
        layer2: [0.0, 0.502, 1.0],     // #0080ff
        layer3: [0.8, 0.702, 0.502],   // #ccb380
        layer4: [0.2, 1.0, 0.2],       // #33ff33
        layer5: [0.0, 0.502, 0.0],     // #008000
        layer6: [0.502, 0.502, 0.502], // #808080
        layer7: [0.251, 0.251, 0.251], // #404040
        layer8: [0.702, 0.42, 0.0],    // #b36b00
        layer9: [1.0, 1.0, 1.0],       // #ffffff
    },

    shaders: {
        lightSpeed: 0.5,
        lightBrightness: 1.0,
        lightAngle: 0,
        lightPitch: 0.5,
        lightDistance: 5.0,
        terrainDisplacement: 1.0,
        planetScale: 0.05,
        rimColor: [0.0, 0.5, 1.0],
        rimSize: 2.0,
        rimIntensity: 1.5,
    },

    clouds: {
        opacity: 0.5,
        scale: 1.15,
        warpIntensity: 0.1,
        warpTime: 1.0,
        threshold: 0.65,
        alpha: 0.5,
        color: [1.0, 1.0, 1.0],
        textureZoom: 1.10,
        speed: 0.01,
    },
    
    cloudShadows: {
        opacity: 0.35,
        scale: 1.15,
        warpIntensity: 0.1,
        warpTime: 1.0,
        threshold: 0.65,
        alpha: 0.85,
        color: [0.0, 0.0, 0.0],
        textureZoom: 1.10,
    }
};
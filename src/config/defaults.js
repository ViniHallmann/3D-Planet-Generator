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
    
    // layerColors : {
    //     layer0:  [0.031, 0.133, 0.243],   // #08223e  - oceano profundo
    //     layer1:  [0.102, 0.247, 0.384],   // #1a3f62  - oceano médio
    //     layer2:  [0.212, 0.349, 0.443],   // #365962  - oceano raso
    //     layer3:  [0.345, 0.447, 0.384],   // #587262  - costa/estuário
    //     layer4:  [0.802, 0.702, 0.502],   // #cdb380  - areia/praia
    //     layer5:  [0.349, 0.447, 0.251],   // #58723f  - vegetação baixa
    //     layer6:  [0.251, 0.349, 0.200],   // #405934  - floresta densa
    //     layer7:  [0.447, 0.384, 0.298],   // #72624c  - montanhas/rochas
    //     layer8:  [0.753, 0.753, 0.753],   // #c0c0c0  - neve/rocha clara
    //     layer9:  [0.980, 0.980, 0.980],   // #fafafa  - neve/gelo puro
    // },

    // ========== PRESETS DE CORES ==========

    // REALISTA - Terra com montanhas cinza
    // layerColors: {
    //     layer0: [0.020, 0.080, 0.180],   // oceano profundo escuro
    //     layer1: [0.050, 0.150, 0.300],   // oceano médio
    //     layer2: [0.100, 0.250, 0.400],   // oceano raso
    //     layer3: [0.600, 0.550, 0.400],   // costa/areia molhada
    //     layer4: [0.760, 0.700, 0.500],   // praia/areia
    //     layer5: [0.300, 0.450, 0.200],   // vegetação baixa
    //     layer6: [0.200, 0.350, 0.150],   // floresta densa
    //     layer7: [0.450, 0.450, 0.450],   // montanhas cinza
    //     layer8: [0.650, 0.650, 0.650],   // rocha alta cinza
    //     layer9: [0.950, 0.950, 0.970],   // neve/gelo
    // },
    //slopeColor: [0.400, 0.400, 0.400],   


    // TERRA VIBRANTE - Cores mais saturadas
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
    //slopeColor: [0.500, 0.400, 0.300],   // rocha marrom

    // PLANETA VERDE - Cores inspiradas em um mundo alienígena verde
    // layerColors: {
    //     layer0: [0.050, 0.150, 0.100],   // mar verde escuro
    //     layer1: [0.100, 0.250, 0.150],   // mar verde
    //     layer2: [0.150, 0.350, 0.200],   // mar verde claro
    //     layer3: [0.300, 0.450, 0.250],   // costa
    //     layer4: [0.500, 0.600, 0.300],   // terreno baixo
    //     layer5: [0.200, 0.700, 0.400],   // vegetação alien
    //     layer6: [0.100, 0.550, 0.350],   // floresta alien
    //     layer7: [0.400, 0.500, 0.450],   // montanhas
    //     layer8: [0.600, 0.700, 0.650],   // picos
    //     layer9: [0.800, 0.900, 0.850],   // topo gelado verde
    // },
    // slopeColor: [0.300, 0.500, 0.400],   // rocha com musgo


    // DESERTO - Planeta árido
    // layerColors: {
    //     layer0: [0.600, 0.400, 0.250],   // areia profunda
    //     layer1: [0.700, 0.500, 0.300],   // areia
    //     layer2: [0.750, 0.550, 0.350],   // areia clara
    //     layer3: [0.800, 0.600, 0.400],   // dunas
    //     layer4: [0.850, 0.650, 0.450],   // deserto
    //     layer5: [0.750, 0.550, 0.350],   // terra seca
    //     layer6: [0.650, 0.450, 0.300],   // rocha vermelha
    //     layer7: [0.550, 0.400, 0.300],   // montanha deserto
    //     layer8: [0.700, 0.550, 0.450],   // pico rochoso
    //     layer9: [0.900, 0.800, 0.700],   // topo claro
    // },
    //slopeColor: [0.500, 0.350, 0.250],

    // GELO - Planeta congelado
    // layerColors: {
    //     layer0: [0.100, 0.150, 0.250],   // oceano congelado profundo
    //     layer1: [0.150, 0.200, 0.350],   // oceano frio
    //     layer2: [0.200, 0.300, 0.450],   // água gelada
    //     layer3: [0.500, 0.600, 0.700],   // gelo costeiro
    //     layer4: [0.700, 0.750, 0.800],   // neve/gelo
    //     layer5: [0.750, 0.800, 0.850],   // planície de gelo
    //     layer6: [0.800, 0.850, 0.900],   // glaciar
    //     layer7: [0.850, 0.880, 0.920],   // montanha gelada
    //     layer8: [0.900, 0.920, 0.950],   // pico de gelo
    //     layer9: [0.950, 0.970, 1.000],   // gelo puro
    // },
    //slopeColor: [0.600, 0.650, 0.750],


    // VULCÂNICO - Planeta com lava
    // layerColors: {
    //     layer0: [0.900, 0.200, 0.050],   // lava profunda
    //     layer1: [0.800, 0.300, 0.100],   // lava
    //     layer2: [0.700, 0.250, 0.100],   // lava esfriando
    //     layer3: [0.400, 0.200, 0.150],   // rocha quente
    //     layer4: [0.300, 0.200, 0.180],   // basalto
    //     layer5: [0.250, 0.200, 0.180],   // rocha vulcânica
    //     layer6: [0.200, 0.180, 0.170],   // cinzas
    //     layer7: [0.150, 0.140, 0.130],   // montanha escura
    //     layer8: [0.200, 0.190, 0.180],   // pico vulcânico
    //     layer9: [0.300, 0.280, 0.250],   // topo com fumaça
    // },

    // OCEANO - Planeta aquático
    // layerColors: {
    //     layer0: [0.000, 0.050, 0.200],   // abismo
    //     layer1: [0.000, 0.100, 0.300],   // oceano profundo
    //     layer2: [0.000, 0.200, 0.400],   // oceano
    //     layer3: [0.100, 0.350, 0.500],   // mar raso
    //     layer4: [0.200, 0.500, 0.600],   // águas tropicais
    //     layer5: [0.300, 0.600, 0.650],   // recifes
    //     layer6: [0.400, 0.650, 0.700],   // atol
    //     layer7: [0.600, 0.550, 0.450],   // ilhas pequenas
    //     layer8: [0.750, 0.700, 0.600],   // picos de ilhas
    //     layer9: [0.900, 0.850, 0.750],   // topos
    // },
    //slopeColor: [0.500, 0.450, 0.400],


    // TÓXICO - Planeta contaminado
    // layerColors: {
    //     layer0: [0.200, 0.300, 0.050],   // líquido tóxico escuro
    //     layer1: [0.300, 0.400, 0.100],   // líquido tóxico
    //     layer2: [0.400, 0.500, 0.150],   // líquido tóxico claro
    //     layer3: [0.350, 0.300, 0.200],   // costa contaminada
    //     layer4: [0.400, 0.350, 0.250],   // terra morta
    //     layer5: [0.500, 0.450, 0.150],   // vegetação doente
    //     layer6: [0.450, 0.400, 0.200],   // floresta morta
    //     layer7: [0.350, 0.350, 0.300],   // montanha cinza
    //     layer8: [0.450, 0.500, 0.350],   // nuvens tóxicas
    //     layer9: [0.550, 0.600, 0.400],   // atmosfera tóxica
    // },
    //slopeColor: [0.350, 0.350, 0.250],


    // MARTE - Planeta vermelho
    // layerColors: {
    //     layer0: [0.400, 0.200, 0.150],   // vale profundo
    //     layer1: [0.500, 0.250, 0.180],   // planície baixa
    //     layer2: [0.550, 0.280, 0.200],   // terreno
    //     layer3: [0.600, 0.300, 0.200],   // solo marciano
    //     layer4: [0.650, 0.350, 0.220],   // deserto vermelho
    //     layer5: [0.700, 0.380, 0.250],   // terra vermelha
    //     layer6: [0.600, 0.350, 0.280],   // rocha
    //     layer7: [0.550, 0.400, 0.350],   // montanha
    //     layer8: [0.700, 0.550, 0.500],   // pico
    //     layer9: [0.850, 0.750, 0.700],   // calota polar
    // },
    //slopeColor: [0.450, 0.300, 0.250],


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
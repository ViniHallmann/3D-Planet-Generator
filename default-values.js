const MOUSE_ROTATION_SPEED = 0.01;
const MAX_LAYERS = 10;
const MAX_CLOUD_LAYERS = 10;
const MAX_CLOUD_OFFSET = 0.0015;
const MIN_PHI = 0.1;
const MAX_PHI = Math.PI - 0.1;
const AUTO_ROTATE = true;
const _LEFT_BUTTOM_VALUE = 0;

let numActiveLayers = MAX_LAYERS;
let numActiveCloudLayers = MAX_CLOUD_LAYERS;
let cloudLayerOffset = MAX_CLOUD_OFFSET;
let isMouseOverUI = false;
let isModifyingTerrain = false;
let showWireframe = false;
let showLambertianDiffuse = true;

let noiseParams = {
    subdivisions: 1,
    octaves: 4,    
    persistence: 0.5, 
    lacunarity: 2.0 ,
    noiseZoom: 1.0,
    noiseResolution: 512         
};
   
let camera = {
    theta: 0,           
    phi: Math.PI / 4,   
    radius: 10,         
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
};

let layerLevels = {
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

// PRA FAZER DEPOIS, PRECISO MODIFICAR OS VALORES DAS CORES PARA SER O MESMO DO HTML OU VICE VERSA
let layerColors = {
    layer0:  [0.0, 0.0, 0.5],    
    layer1:  [0.0, 0.5, 1.0],
    layer2:  [0.0, 0.0, 1.0],
    layer3:  [0.0, 1.0, 0.0],
    layer4:  [0.0, 0.5, 0.0],
    layer5:  [0.0, 0.5, 1.0],
    layer6:  [0.5, 0.25, 0.0],
    layer7:  [0.8, 0.7, 0.5],
    layer8:  [0.5, 0.5, 0.5],
    layer9:  [1.0, 1.0, 1.0],
};

let shadersParams = {
    lightSpeed: 1.5,
    lightBrightness: 1.0,
    layers : layerLevels,
    terrainDisplacement: 0.3,
}

let cloudParams = {
    cloudOpacity: 0.5,
    cloudScale: 1.25,
    cloudWarpIntensity: 0.1,
    cloudWarpTime: 1.0,
    cloudThreshold: 0.65,
    cloudAlpha: 0.5,
    cloudColor: [1.0, 1.0, 1.0],
    cloudTextureZoom: 1.10,
    cloudSpeed: 0.01,
};

let cloudShadowParams = {
    cloudOpacity: 0.35,
    cloudScale: 1.25,
    cloudWarpIntensity: 0.1,
    cloudWarpTime: 1.0,
    cloudThreshold: 0.65,
    cloudAlpha: 0.85,
    cloudColor: [0.0, 0.0, 0.0],
    terrainDisplacement: 0.3,
    cloudTextureZoom: 1.10,
};

const DEFAULT_VARIABLES_VALUES = {
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
    showLambertianDiffuse,
};

export { DEFAULT_VARIABLES_VALUES };
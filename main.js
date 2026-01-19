import { Renderer } from './renderer.js';
import { State } from './src/app/state.js';
import { setupControls } from './src/setup/controls.js';
import { setupHandlers } from './src/setup/handler.js';
import { Physics} from './src/core/physics.js';
import { loadTexture, loadOBJ } from './src/utils/loader.js';
import { getCanvasElement } from './src/config/elements.js';
import { RingManager } from './ring.js';
import { Raycaster } from './raycasting.js';

async function main() {
    const canvas = getCanvasElement();
    
    const state = new State();
    const renderer = new Renderer(canvas, state.noise);

    if (!renderer.gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    renderer.setGeometry(state.noise.subdivisions);
    renderer.setLightSpeed(state.shaders.lightSpeed);
    renderer.setLightBrightness(state.shaders.lightBrightness);
    renderer.setLayerLevels(state.layerLevels);
    renderer.setLayerColors(state.layerColors);

    setupControls(state, renderer);

    let cloudTexture = await loadTexture(renderer, 'assets/noises/cloud2.png');
    renderer.setCloudTexture(cloudTexture);

    const planeGeometry = await loadOBJ('assets/models/airplane.obj');
    const ringGeometry = await loadOBJ('assets/models/torus.obj');
    const planeTexture = await loadTexture(renderer, 'assets/textures/airplane.png');

    const plane = renderer.addObject(planeGeometry, [0, 1, 0], [0.025, 0.025, 0.025]);
    plane.texture = planeTexture;
    plane.color = [0.9, 0.4, 0.1];
    plane.lookAtCenter = true;
    plane.orbitRadius = 0;
    
    const physics = new Physics();
    plane.rotationOffset = [...physics.baseRotationOffset];

    const ringManager = new RingManager();
    const raycaster = new Raycaster(canvas, state.camera);

    setupHandlers(canvas, state, renderer, physics, plane, ringManager, raycaster, ringGeometry);
}

main();
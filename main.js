import { Renderer }             from './src/renderer/renderer.js';
import { State }                from './src/app/state.js';
import { setupControls }        from './src/setup/controls.js';
import { setupHandlers }        from './src/setup/handler.js';
import { Physics}               from './src/core/physics.js';
import { loadTexture, loadOBJ } from './src/utils/loader.js';
import { getCanvasElement }     from './src/config/elements.js';
import { RingManager }          from './src/objects/ring.js';
import { Raycaster }            from './src/core/raycasting.js';

function setupRendererSettings(state, renderer, cloudTexture) {
    renderer.setGeometry(state.noise.subdivisions);
    renderer.setLightSpeed(state.shaders.lightSpeed);
    renderer.setLightBrightness(state.shaders.lightBrightness);
    renderer.setLayerLevels(state.layerLevels);
    renderer.setLayerColors(state.layerColors);
    renderer.setCloudTexture(cloudTexture);
}

async function main() {
    const canvas = getCanvasElement();
    
    const state         = new State();
    const renderer      = new Renderer(canvas, state.noise);
    const physics       = new Physics();
    const ringManager   = new RingManager();
    const raycaster     = new Raycaster(canvas, state.camera);

    let cloudTexture = await loadTexture(renderer, 'assets/noises/cloud2.png');

    setupRendererSettings(state, renderer, cloudTexture);
    setupControls(state, renderer);

    const ringGeometry = await loadOBJ('assets/models/torus.obj');
    const planeGeometry = await loadOBJ('assets/models/airplane.obj');
    const planeTexture  = await loadTexture(renderer, 'assets/textures/airplane.png');

    const plane = renderer.addObject(planeGeometry, [0, 1, 0], [0.025, 0.025, 0.025]);
    plane.texture = planeTexture;
    plane.color = [0.9, 0.4, 0.1];
    plane.lookAtCenter = true;
    plane.orbitRadius = 0;
    plane.rotationOffset = [...physics.baseRotationOffset];

    setupHandlers(canvas, state, renderer, physics, plane, ringManager, raycaster, ringGeometry);
}

main();
import { mat4 } from '../utils/math.js';
import { easing } from '../utils/utils.js';

export function setupHandlers(canvas, state, renderer, physics, plane, ringManager, raycaster, ringGeometry) {
    
    //TIRAR ISSO DAQUI
    const ringObjects = [];

    function addRingToScene(ring) {
        const ringObj = renderer.addObject(ringGeometry, ring.position, [0.1, 0.1, 0.1]);
        ringObj.color = ring.color;
        ringObj.ringReference = ring;
        ringObj.rotateWithPlanet = true;
        ringObj.scale = [0.1, 0.1, 0.1];
        ringObjects.push(ringObj);
        return ringObj;
    }

    function handleZoom(event) {
        if (state.app.isMouseOverUI) return;
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        const zoomStep = 0.35;
        state.camera.radius += delta * zoomStep;
    }

    function handleMouseDown(event) {
        if (state.app.isMouseOverUI) return;
        if (event.button !== state.physics.LEFT_BUTTON_VALUE) return; 
        
        state.camera.isDragging = true;
        state.camera.lastMouseX = event.clientX;
        state.camera.lastMouseY = event.clientY;
        
        canvas.style.cursor = 'grabbing';
    }

    function handleMouseUp(event) {
        if (event.button !== state.physics.LEFT_BUTTON_VALUE) return;
        state.camera.isDragging = false;
        canvas.style.cursor = 'grab';
    }

    function handleMouseLeave(event) {
        state.camera.isDragging = false;
        canvas.style.cursor = 'grab';
    }

    function handleMouseMove(event) {
        if (!state.camera.isDragging || state.app.isMouseOverUI) return;

        const deltaX = event.clientX - state.camera.lastMouseX;
        const deltaY = event.clientY - state.camera.lastMouseY;

        state.camera.theta += deltaX * state.physics.MOUSE_ROTATION_SPEED;
        state.camera.phi -= deltaY * state.physics.MOUSE_ROTATION_SPEED;

        state.camera.phi = Math.max(state.physics.MIN_PHI, Math.min(state.physics.MAX_PHI, state.camera.phi));
        state.camera.theta = state.camera.theta % (2 * Math.PI);

        state.camera.lastMouseX = event.clientX;
        state.camera.lastMouseY = event.clientY;
    }

    // ARRUMAR E DEIXAR ISSO AQUI IMPLEMENTADO DE FORMA CORRETA DEPOIS
    const fpsDiv = document.createElement('div');
    fpsDiv.style.cssText = 'position:fixed;top:10px;left:10px;color:#00ff00;font-family:monospace;font-size:16px;background:rgba(0,0,0,0.7);padding:4px 8px;border-radius:4px;z-index:9999;pointer-events:none;';
    document.body.appendChild(fpsDiv);
    
    let fpsFrames = 0;
    let fpsLastTime = performance.now();

    function handleAnimation() {

        fpsFrames++;
        const currentFpsTime = performance.now();
        if (currentFpsTime - fpsLastTime >= 1000) {
            fpsDiv.innerText = `FPS: ${fpsFrames}`;
            fpsFrames = 0;
            fpsLastTime = currentFpsTime;
        }
        
        const time = performance.now() / 1000;
        physics.updatePlanetPhysics(plane, state.app.topDownMode, state.physics);
        
        //RINGS
        ringManager.cleanup();
        for (let i = ringObjects.length - 1; i >= 0; i--) {
            const obj = ringObjects[i];
            if (obj.ringReference && obj.ringReference.collected) {
                const rendererIndex = renderer.objects.indexOf(obj);
                if (rendererIndex > -1) renderer.objects.splice(rendererIndex, 1);
                ringObjects.splice(i, 1);
            }
        }
        
        if (plane && plane.position) {
            ringManager.checkCollisions(plane.position, 0.05, physics.planetRotationMatrix);
        }

        //CAMERA
        let cameraPosition; 
        if (state.app.topDownMode) {
            cameraPosition = { x: 0, y: 5.0, z: 0.1 }; 
            plane.position = [0, 1.85, 0]; 
        } else {
            cameraPosition = {
                x: state.camera.radius * Math.sin(state.camera.phi) * Math.cos(state.camera.theta),
                y: state.camera.radius * Math.cos(state.camera.phi),
                z: state.camera.radius * Math.sin(state.camera.phi) * Math.sin(state.camera.theta)
            };
        }

        const rotationMatrixToUse = state.app.topDownMode ? physics.planetRotationMatrix : null;
        renderer.cameraPosition = cameraPosition;

        //VIRAR FUNCAO DEPOIS
        if (physics.animation.isAnimating) {
            const elapsed = performance.now() - physics.animation.startTime;
            const progress = Math.min(elapsed / physics.animation.duration, 1.0);
            const easedProgress = easing.easeOutElastic(progress);
            
            physics.animation.currentScale = physics.animation.startScale + (physics.animation.targetScale - physics.animation.startScale) * easedProgress;
            
            state.shaders.planetScale = physics.animation.currentScale;
            state.clouds.planetScale = physics.animation.currentScale;
            state.cloudShadowParams.planetScale = physics.animation.currentScale;
            
            if (progress >= 1.0) physics.animation.isAnimating = false;
        }

        state.shaders.lightAngle = time * state.shaders.lightSpeed;
        renderer.clearScreen();
        
        renderer.renderShadowPass(time, state.shaders, state.physics.AUTO_ROTATE, rotationMatrixToUse);
        
        renderer.render(
            time, cameraPosition, state.shaders, state.app.showWireframe, 
            state.app.showLambertianDiffuse, state.physics.AUTO_ROTATE, 1., rotationMatrixToUse
        );

        if (state.app.showClouds){
            renderer.render(
                time, cameraPosition, state.cloudShadowParams, state.app.showWireframe, 
                state.app.showLambertianDiffuse, state.physics.AUTO_ROTATE, 3., rotationMatrixToUse
            );
            
            for (let i = 0; i < state.app.numActiveCloudLayers; i++) {
                let layerOpacity = state.clouds.cloudOpacity / state.app.numActiveCloudLayers;
                const layerParams = {
                    ...state.clouds,
                    scale: state.clouds.cloudScale + (i * state.app.cloudLayerOffset),
                    opacity: layerOpacity,
                };
                renderer.render(
                    time, cameraPosition, layerParams, state.app.showWireframe, 
                    state.app.showLambertianDiffuse, state.physics.AUTO_ROTATE, 2., rotationMatrixToUse
                );
            }
        }
        
        renderer.objects.forEach(obj => {
            renderer.renderObject(obj, time, state.shaders, rotationMatrixToUse);
        });
        
        requestAnimationFrame(handleAnimation);
    }

    window.addEventListener('keydown', (e) => {
        if(physics.keys.hasOwnProperty(e.key.toLowerCase())) physics.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        if(physics.keys.hasOwnProperty(e.key.toLowerCase())) physics.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'c') {
            state.app.topDownMode = !state.app.topDownMode;
            const tooltip = document.getElementById('controls-tooltip');
            if (tooltip) tooltip.classList.toggle('hidden', state.app.topDownMode);
            
            physics.toggleTopDownMode(plane, state.app.topDownMode);
        }
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (state.app.isMouseOverUI) return;
        
        const cameraPos = {
            x: state.camera.radius * Math.sin(state.camera.phi) * Math.cos(state.camera.theta),
            y: state.camera.radius * Math.cos(state.camera.phi),
            z: state.camera.radius * Math.sin(state.camera.phi) * Math.sin(state.camera.theta)
        };
        
        const aspect = canvas.width / canvas.height;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, Math.PI / 4, aspect, 0.1, 100);
        
        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, [cameraPos.x, cameraPos.y, cameraPos.z], [0, 0, 0], [0, 1, 0]);
        
        const ray = raycaster.createRay(e.clientX, e.clientY, cameraPos, projectionMatrix, viewMatrix);        
        const planetRadius = 1.5 + (state.shaders.terrainDisplacement * 0.3);
        const result = raycaster.intersectSphere(ray, [0, 0, 0], planetRadius);
        
        if (result.hit) {
            const len = Math.sqrt(result.point[0]**2 + result.point[1]**2 + result.point[2]**2);
            const orbitRadius = 1.85;
            const ringPosition = [(result.point[0] / len) * orbitRadius,(result.point[1] / len) * orbitRadius,(result.point[2] / len) * orbitRadius];
            
            const ring = ringManager.addRing(ringPosition);
            const ringObj = addRingToScene(ring);

            const nx = ringPosition[0] / orbitRadius;
            const ny = ringPosition[1] / orbitRadius;
            const nz = ringPosition[2] / orbitRadius;

            const rotX = Math.asin(-ny);
            const rotY = Math.atan2(nx, nz);
            
            ringObj.rotation = [rotX, rotY, 0];
        }
    });

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleZoom);

    handleAnimation();
}
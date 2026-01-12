import { Renderer } from '../rendering/renderer.js';
import { Camera } from './camera.js';
import { InputManager } from './inputManager.js';
import { DEFAULT_SETTINGS } from '../config/defaults.js';
import { easing } from '../utils/math.js';
import { Planet } from '../world/planet.js';
import { Airplane } from '../world/objects.js';
import { initClouds } from '../world/clouds.js';

export class Engine {
    constructor() {
        this.canvas = document.querySelector("#glcanvas");
        if (!this.canvas) throw new Error("Canvas #glcanvas not found");

        this.settings = structuredClone(DEFAULT_SETTINGS);
        
        this.input = new InputManager();
        this.camera = new Camera(this.canvas, this.settings.camera);
        this.renderer = new Renderer(this.canvas, this.settings.noise);

        this.planet = new Planet();
        this.airplane = null;
        
        this.isRunning = true;
        this.lastTime = 0;
        
        this.animation = {
            isAnimating: true,
            startTime: performance.now(),
            duration: 3000,
            startScale: 0.005,
            targetScale: 1.0,
            currentScale: 0.005
        };

        this.loop = this.loop.bind(this);

        this.input.onKeyPress((key, isPressed) => {
            if (key === 'c' && isPressed) {
                this.settings.app.topDownMode = !this.settings.app.topDownMode;
            }
        });
    }

    async init() {
        await initClouds(this.renderer);
        this.airplane = new Airplane(this.renderer);
        requestAnimationFrame(this.loop);
    }

    update(time, deltaTime) {
        if (this.animation.isAnimating) {
            const elapsed = performance.now() - this.animation.startTime;
            const progress = Math.min(elapsed / this.animation.duration, 1.0);
            const easedProgress = easing.easeOutElastic(progress);
            
            this.animation.currentScale = this.animation.startScale + (this.animation.targetScale - this.animation.startScale) * easedProgress;
            
            this.settings.shaders.planetScale = this.animation.currentScale;
            this.settings.clouds.planetScale = this.animation.currentScale;
            this.settings.cloudShadows.planetScale = this.animation.currentScale;

            if (progress >= 1.0) this.animation.isAnimating = false;
        }

        const isTopDown = this.settings.app.topDownMode;
        
        this.planet.update(deltaTime, this.input, isTopDown);
        
        if (this.airplane) {
            this.airplane.update(deltaTime, this.input, isTopDown, this.planet.velocityY);
        }
    }

    render(time) {
        let cameraPos = this.camera.getPosition();
        
        if (this.settings.app.topDownMode) {
            cameraPos = { x: 0, y: 5.0, z: 0.1 };
        }
        const planetMatrix = this.planet.getMatrix();

        this.renderer.clearScreen();

        // Planeta
        this.renderer.render(
            time, 
            cameraPos, 
            this.settings.shaders, 
            1, 
            planetMatrix
        );

        // Nuvens
        if (this.settings.app.showClouds) {
            // Sombra
            this.renderer.render(
                time, 
                cameraPos, 
                this.settings.cloudShadows, 
                3, 
                planetMatrix
            );
            // Nuvens
            const numLayers = this.settings.app.numActiveCloudLayers;
            const offset = this.settings.app.cloudLayerOffset;
            const baseParams = this.settings.clouds;

            for (let i = 0; i < numLayers; i++) {
                const layerOpacity = baseParams.opacity / numLayers;
                const layerParams = {
                    ...baseParams,
                    scale: baseParams.scale + (i * offset),
                    opacity: layerOpacity
                };
                
                this.renderer.render(
                    time, 
                    cameraPos, 
                    layerParams, 
                    2, 
                    planetMatrix
                );
            }
        }
        // Avião
        if (this.airplane && this.airplane.mesh) {
            this.renderer.renderObject(this.airplane.mesh, time, this.settings.shaders);
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const time = timestamp / 1000;
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.update(time, deltaTime);
        this.render(time);

        requestAnimationFrame(this.loop);
    }
}
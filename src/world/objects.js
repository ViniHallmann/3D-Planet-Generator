import { loadOBJ } from '../utils/loaders.js';
import { mat4 } from '../utils/math.js';

export class Airplane {
    constructor(renderer) {
        this.renderer = renderer;
        this.mesh = null;
        this.isLoaded = false;
        
        this.position = [0, 1.85, 0];
        this.scale = [0.025, 0.025, 0.025];
        this.rotation = [0, 0, 0];
        this.baseRotationOffset = [-Math.PI/2, Math.PI/2, 0];
        this.rotationOffset = [...this.baseRotationOffset];
        
        this.color = [0.9, 0.4, 0.1];
        this.lookAtCenter = true;

        this.init();
    }

    async init() {
        try {
            const geometry = await loadOBJ('assets/models/airplane.obj');
            this.mesh = this.renderer.addObject(geometry, this.position, this.scale);
            
            this.mesh.color = this.color;
            this.mesh.rotationOffset = this.rotationOffset;
            this.mesh.lookAtCenter = this.lookAtCenter;
            
            this.isLoaded = true;
        } catch (e) {
            console.error("Falha ao carregar avião:", e);
        }
    }

    update(dt, inputManager, isTopDown, planetVelocityY = 0) {
        if (!this.isLoaded || !this.mesh) return;

        if (isTopDown) {
            this.mesh.position = [0, 1.85, 0];

            const rollIntensity = 15; 
            const currentRoll = planetVelocityY * rollIntensity;
            
            this.mesh.rotationOffset = [
                this.baseRotationOffset[0] + Math.abs(currentRoll),
                this.baseRotationOffset[1] + currentRoll,
                this.baseRotationOffset[2]
            ];
        } else {
            // Orbita, ainda preciso implementar.
        }
    }
}
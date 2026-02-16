import { CONSTANTS } from '../config/constants.js'
import { easing } from '../utils/utils.js';
import { lerp } from '../utils/noise.js';

export class Ring {
    constructor(position, options = {}) {
        this.position = [...position];
        this.color = options.color || [1.0, 0.8, 0.2];
        this.collected = false;

        this.scale = 1.0;
        this.isAnimating = false;
        this.animationPhase = 0;
        this.animationProgress = 0;
        this.animationSpeed = 0.05;
        this.maxScale = 1.3;

        const len = Math.sqrt(position[0]**2 + position[1]**2 + position[2]**2);
        this.baseDirection = [
            position[0] / len,
            position[1] / len,
            position[2] / len
        ];
    }

    updatePosition(radius) {
        this.position[0] = this.baseDirection[0] * radius;
        this.position[1] = this.baseDirection[1] * radius;
        this.position[2] = this.baseDirection[2] * radius;
    }

    updateIdleAnimation(deltaTime = 0.016) {
        if (this.collected) return;

        this.idleTime += deltaTime * this.idleSpeed;
        
        const breathe = Math.sin(this.idleTime) * 0.5 + 0.5;
        const idleScaleBonus = breathe * this.idleAmplitude;
        
        this.idleRotation += deltaTime * 0.5;
        
        return {
            scaleBonus: idleScaleBonus,
            rotation: this.idleRotation,
            bobOffset: Math.sin(this.idleTime * 1.5) * 0.02
        };
    }

    updateAnimation() {
        if (!this.isAnimating) return false;
        
        this.animationProgress += this.animationSpeed;
        
        if (this.animationPhase === 0) {
            this.scale = lerp(1.0, this.maxScale, easing.easeOutBack(this.animationProgress));
            
            if (this.animationProgress >= 1.0) {
                this.animationProgress = 0;
                this.animationPhase = 1;
            }
        } else {
            this.scale = lerp(this.maxScale, 0, easing.easeInCubic(this.animationProgress));
            
            if (this.animationProgress >= 1.0) {
                this.scale = 0;
                this.isAnimating = false;
                return true; // Animação completa
            }
        }
        
        return false; // Animação ainda em progresso
    }

    shouldRender() {
        return !this.collected || this.isAnimating;
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
            this.isAnimating = true;
            this.animationPhase = 0;
            this.animationProgress = 0;
            return true;
        }
        return false;
    }
}

export class RingManager {
    constructor() {
        this.rings = [];
        this.score = 0;
    }

    addRing(position, options = {}) {
        const ring = new Ring(position, options);
        this.rings.push(ring);
        return ring;
    }

    addRandomRing(orbitRadius = CONSTANTS.ORBIT_RADIUS) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const position = [
            Math.sin(phi) * Math.cos(theta) * orbitRadius,
            Math.cos(phi) * orbitRadius,
            Math.sin(phi) * Math.sin(theta) * orbitRadius
        ];
        
        return this.addRing(position);
    }

    updateRingPositions(orbitRadius) {
        this.rings.forEach(ring => {
            ring.updatePosition(orbitRadius);
        });
    }

    clearRings() {
        this.rings = [];
        this.score = 0;
    }

    checkCollisions(point, radius = 0.1, rotationMatrix = null) {
        this.rings.forEach(ring => {
            if (ring.collected) return;
            
            let ringPos = ring.position;
            if (rotationMatrix) {
                ringPos = this.transformPoint(ring.position, rotationMatrix);
            }
            
            const dx = point[0] - ringPos[0];
            const dy = point[1] - ringPos[1];
            const dz = point[2] - ringPos[2];
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (dist < radius) {
                if (ring.collect()) {
                    this.score++;
                    console.log('Ring coletado! Score:', this.score);
                }
            }
        });
    }

    transformPoint(point, matrix) {
        const x = point[0], y = point[1], z = point[2];
        return [
            matrix[0]*x + matrix[4]*y + matrix[8]*z + matrix[12],
            matrix[1]*x + matrix[5]*y + matrix[9]*z + matrix[13],
            matrix[2]*x + matrix[6]*y + matrix[10]*z + matrix[14]
        ];
    }

    cleanup() {
        this.rings = this.rings.filter(r => !r.collected || r.isAnimating);
    }

    getActiveCount() {
        return this.rings.filter(r => !r.collected).length;
    }
}

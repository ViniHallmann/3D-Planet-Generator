import { CONSTANTS } from '../config/constants.js'
export class Ring {
    constructor(position, options = {}) {
        this.position = [...position];
        this.color = options.color || [1.0, 0.8, 0.2];
        this.collected = false;

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
    
    // checkCollision(point, radius = 0.2) {
    //     if (this.collected) return false;
    //     const dx = point[0] - this.position[0];
    //     const dy = point[1] - this.position[1];
    //     const dz = point[2] - this.position[2];
    //     return Math.sqrt(dx*dx + dy*dy + dz*dz) < radius;
    // }

    checkCollisions(point, radius = 0.1, rotationMatrix = null) {
        this.rings.forEach(ring => {
            if (ring.collected) return;
            
            let ringPos = ring.position;
            if (rotationMatrix) {
                ringPos = this.transformPoint(ring.position, rotationMatrix);
            }
            
            // NOVA ABORDAGEM: Usar distância angular na superfície
            const angularDist = this.getAngularDistance(point, ringPos);
            
            // Converter raio de colisão para ângulo
            // Assumindo raio da esfera ~ 1.5, raio de colisão 0.15 = ~0.1 radianos
            const avgSphereRadius = 1.5;
            const angularRadius = radius / avgSphereRadius;
            
            if (angularDist < angularRadius) {
                // Verificação adicional: diferença de altura não pode ser muito grande
                const heightDiff = Math.abs(
                    Math.sqrt(point[0]**2 + point[1]**2 + point[2]**2) -
                    Math.sqrt(ringPos[0]**2 + ringPos[1]**2 + ringPos[2]**2)
                );
                
                // Permitir até 0.3 unidades de diferença de altura
                if (heightDiff < 0.3) {
                    if (ring.collect()) {
                        this.score++;
                        console.log('Ring coletado! Score:', this.score);
                    }
                }
            }
        });
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
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
        this.rings = this.rings.filter(r => !r.collected);
    }

    getActiveCount() {
        return this.rings.filter(r => !r.collected).length;
    }
}
export class Ring {
    constructor(position, options = {}) {
        this.position = [...position];
        this.color = options.color || [1.0, 0.8, 0.2];
        this.collected = false;
    }

    checkCollision(point, radius = 0.2) {
        if (this.collected) return false;
        const dx = point[0] - this.position[0];
        const dy = point[1] - this.position[1];
        const dz = point[2] - this.position[2];
        return Math.sqrt(dx*dx + dy*dy + dz*dz) < radius;
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

    addRandomRing(orbitRadius = 1.6) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const position = [
            Math.sin(phi) * Math.cos(theta) * orbitRadius,
            Math.cos(phi) * orbitRadius,
            Math.sin(phi) * Math.sin(theta) * orbitRadius
        ];
        
        return this.addRing(position);
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
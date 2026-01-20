import { mat4 } from '../utils/math.js'

export class Physics {
    constructor() {
        this.keys = { w: false, s: false, a: false, d: false };

        this.orbitConfig = {
            angle: 0,
            inclination: (Math.random() - 0.5) * 0.5,
            speed: 0.005 + Math.random() * 0.01,
            radius: 1.85,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            wobbleAmount: 0.1 + Math.random() * 0.1,  
        };

        this.planetRotationMatrix = mat4.create();
        mat4.identity(this.planetRotationMatrix);

        this.rotationVelocityX = 0;
        this.rotationVelocityY = 0;

        this.baseRotationOffset = [-Math.PI/2, Math.PI/2, 0];
        
        this.animation = {
            isAnimating: true,
            startTime: performance.now(),
            duration: 3000, 
            startScale: 0.005,
            targetScale: 1.0,
            currentScale: 0.005,
        };
    }

    updateOrbit(plane, topDownMode) {
        if (topDownMode) return;
        
        const cfg = this.orbitConfig;
        cfg.angle += cfg.speed;
        cfg.wobble += cfg.wobbleSpeed;
        
        const baseY = Math.sin(cfg.inclination) * cfg.radius;
        const horizontalRadius = Math.cos(cfg.inclination) * cfg.radius;
        const wobbleY = Math.sin(cfg.wobble) * cfg.wobbleAmount;
        
        plane.position[0] = Math.cos(cfg.angle) * horizontalRadius;
        plane.position[1] = baseY + wobbleY + cfg.radius * 0.1;
        plane.position[2] = Math.sin(cfg.angle) * horizontalRadius;

        const bankAngle = Math.sin(cfg.wobble * 2) * 0.1;
        plane.rotationOffset = [
            this.baseRotationOffset[0] + bankAngle,
            this.baseRotationOffset[1] + Math.PI/2,
            this.baseRotationOffset[2]
        ];
    }

    updatePlanetPhysics(plane, topDownMode, physicsParams) {
        if (!topDownMode) {
            this.updateOrbit(plane, topDownMode);
            return;
        }

        if (this.keys.w) this.rotationVelocityX += physicsParams.MOVE_ACCELERATION;
        if (this.keys.s) this.rotationVelocityX -= physicsParams.MOVE_ACCELERATION;
        if (this.keys.a) this.rotationVelocityY += physicsParams.TURN_ACCELERATION; 
        if (this.keys.d) this.rotationVelocityY -= physicsParams.TURN_ACCELERATION;

        this.rotationVelocityX *= physicsParams.FRICTION_MOVE;
        this.rotationVelocityY *= physicsParams.FRICTION_TURN;

        const rotationStep = mat4.create();
        mat4.identity(rotationStep);
        
        mat4.rotateX(rotationStep, rotationStep, this.rotationVelocityX);
        mat4.rotateY(rotationStep, rotationStep, this.rotationVelocityY);

        mat4.multiply(this.planetRotationMatrix, rotationStep, this.planetRotationMatrix);
        
        const rollIntensity = 15; 
        const currentRoll = this.rotationVelocityY * rollIntensity; 
        
        plane.rotationOffset = [
            this.baseRotationOffset[0] + Math.abs(currentRoll),
            this.baseRotationOffset[1] + currentRoll, 
            this.baseRotationOffset[2] 
        ];
    }

    toggleTopDownMode(plane, topDownMode) {
        if (topDownMode) {
            mat4.identity(this.planetRotationMatrix);
            const orbitDirection = this.orbitConfig.angle + Math.PI / 2;
            plane.rotationOffset = [
                this.baseRotationOffset[0],
                this.baseRotationOffset[1] + orbitDirection,
                this.baseRotationOffset[2]
            ];
        } else {
            this.orbitConfig.angle = Math.atan2(plane.position[2], plane.position[0]);
            plane.rotationOffset = [...this.baseRotationOffset];
        }
    }
}
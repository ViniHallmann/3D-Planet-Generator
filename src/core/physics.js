import { mat4 } from '../utils/math.js'
import { CONSTANTS } from '../config/constants.js'

export class Physics {
    constructor() {
        this.keys = { w: false, s: false, a: false, d: false };

        this.orbitConfig = {
            angle: 0,
            inclination: (Math.random() - 0.5) * 0.5,
            speed: 0.005 + Math.random() * 0.01,
            baseRadius: CONSTANTS.ORBIT_RADIUS,
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
            duration: 4500, 
            startScale: 0.005,
            targetScale: 1.0,
            currentScale: 0.005,
        };

        this.navigation = {
            isNavigating: false,
            targetAngle: 0,
            targetInclination: 0,
            lerpSpeed: 0.03,
            arrivalThreshold: 0.01,
        };

        this.getTerrainHeightFunc = null;
    }

    setTerrainHeightCalculator(heightFunc) {
        this.getTerrainHeightFunc = heightFunc;
    }

    navigateTo(targetDirection) {
        // Converter direção [x, y, z] para coordenadas esféricas
        this.navigation.targetAngle = Math.atan2(targetDirection[2], targetDirection[0]);
        this.navigation.targetInclination = Math.asin(Math.max(-1, Math.min(1, targetDirection[1])));
        this.navigation.isNavigating = true;

        this.orbitConfig.wobbleAmount = 0;
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    updateOrbit(plane, topDownMode, terrainDisplacement) {
        if (topDownMode) return;
        
        const cfg = this.orbitConfig;
        const nav = this.navigation;

        if (nav.isNavigating) {
            let angleDiff = this.normalizeAngle(nav.targetAngle - cfg.angle);
            let inclDiff = nav.targetInclination - cfg.inclination;
            
            
            // Interpolar
            cfg.angle += angleDiff * nav.lerpSpeed;
            cfg.inclination += inclDiff * nav.lerpSpeed;
            
            // Chegou ao destino?
            if (Math.abs(angleDiff) < nav.arrivalThreshold && 
                Math.abs(inclDiff) < nav.arrivalThreshold) {
                nav.isNavigating = false;
                cfg.wobbleAmount = 0.1 + Math.random() * 0.1;
            }
        } else {
            cfg.angle += cfg.speed;
            cfg.wobble += cfg.wobbleSpeed;
        }

        const baseY = Math.sin(cfg.inclination);
        const horizontalRadius = Math.cos(cfg.inclination);
        const wobbleY = nav.isNavigating ? 0 : Math.sin(cfg.wobble) * cfg.wobbleAmount;
        
        const direction = [
            Math.cos(cfg.angle) * horizontalRadius,
            baseY + wobbleY,
            Math.sin(cfg.angle) * horizontalRadius
        ];
        
        const len = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2);
        direction[0] /= len;
        direction[1] /= len;
        direction[2] /= len;
        
        const radius = cfg.baseRadius + (terrainDisplacement * 0.3);
        
        plane.position[0] = direction[0] * radius;
        plane.position[1] = direction[1] * radius;
        plane.position[2] = direction[2] * radius;

        // Rotação do avião
        if (nav.isNavigating) {
            // Durante navegação: apontar na direção do movimento
            const bankAngle = Math.sin(cfg.angle * 2) * 0.05;
            plane.rotationOffset = [
                this.baseRotationOffset[0] + bankAngle,
                this.baseRotationOffset[1] + Math.PI/2,
                this.baseRotationOffset[2]
            ];
        } else {
            // Órbita normal
            const bankAngle = Math.sin(cfg.wobble * 2) * 0.1;
            plane.rotationOffset = [
                this.baseRotationOffset[0] + bankAngle,
                this.baseRotationOffset[1] + Math.PI/2,
                this.baseRotationOffset[2]
            ];
        }
    }

    isNavigating() {
        return this.navigation.isNavigating;
    }

    resumeOrbit() {
        this.navigation.isNavigating = false;
        this.orbitConfig.wobbleAmount = 0.1 + Math.random() * 0.1;
    }


    updatePlanetPhysics(plane, topDownMode, physicsParams, terrainDisplacement=0) {
        if (!topDownMode) {
            this.updateOrbit(plane, topDownMode, terrainDisplacement);
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
import { mat4 } from '../utils/math.js'
import { CONSTANTS } from '../config/constants.js'

// export class Physics {
//     constructor() {
//         this.keys = { w: false, s: false, a: false, d: false };

//         this.orbitConfig = {
//             angle: 0,
//             inclination: (Math.random() - 0.5) * 0.5,
//             speed: 0.005 + Math.random() * 0.01,
//             radius: CONSTANTS.ORBIT_RADIUS,
//             wobble: Math.random() * Math.PI * 2,
//             wobbleSpeed: 0.02 + Math.random() * 0.02,
//             wobbleAmount: 0.1 + Math.random() * 0.1,  
//         };

//         this.planetRotationMatrix = mat4.create();
//         mat4.identity(this.planetRotationMatrix);

//         this.rotationVelocityX = 0;
//         this.rotationVelocityY = 0;

//         this.baseRotationOffset = [-Math.PI/2, Math.PI/2, 0];
        
//         this.animation = {
//             isAnimating: true,
//             startTime: performance.now(),
//             duration: 4500, 
//             startScale: 0.005,
//             targetScale: 1.0,
//             currentScale: 0.005,
//         };
//     }

//     updateOrbit(plane, topDownMode, terrainDisplacement, renderer) {
//         if (topDownMode) return;
        
//         const cfg = this.orbitConfig;
//         cfg.angle += cfg.speed;
//         cfg.wobble += cfg.wobbleSpeed;
        
//         const radius = cfg.radius + (terrainDisplacement * 0.3);

//         const baseY = Math.sin(cfg.inclination) * radius;
//         const horizontalRadius = Math.cos(cfg.inclination) * radius;
//         const wobbleY = Math.sin(cfg.wobble) * cfg.wobbleAmount;
        
//         const x = Math.cos(cfg.angle) * horizontalRadius;
//         const y = baseY + wobbleY;
//         const z = Math.sin(cfg.angle) * horizontalRadius;
        
//         const terrainHeight = renderer.getTerrainHeightAtPosition(x, y, z, terrainDisplacement);
        
//         const safetyMargin = 0.15;
//         const currentRadius = Math.sqrt(x*x + y*y + z*z);
//         const minRadius = terrainHeight + safetyMargin;
        
//         let finalRadius = currentRadius;
//         if (currentRadius < minRadius) {
//             finalRadius = minRadius;
//         }
        
//         const scale = finalRadius / currentRadius;
//         plane.position[0] = x * scale;
//         plane.position[1] = y * scale;
//         plane.position[2] = z * scale;

//         const bankAngle = Math.sin(cfg.wobble * 2) * 0.1;
//         plane.rotationOffset = [
//             this.baseRotationOffset[0] + bankAngle,
//             this.baseRotationOffset[1] + Math.PI/2,
//             this.baseRotationOffset[2]
//         ];
//     }

//     updatePlanetPhysics(plane, topDownMode, physicsParams, terrainDisplacement=0, renderer) {
//         if (!topDownMode) {
//             this.updateOrbit(plane, topDownMode, terrainDisplacement,renderer);
//             return;
//         }

//         if (this.keys.w) this.rotationVelocityX += physicsParams.MOVE_ACCELERATION;
//         if (this.keys.s) this.rotationVelocityX -= physicsParams.MOVE_ACCELERATION;
//         if (this.keys.a) this.rotationVelocityY += physicsParams.TURN_ACCELERATION; 
//         if (this.keys.d) this.rotationVelocityY -= physicsParams.TURN_ACCELERATION;

//         this.rotationVelocityX *= physicsParams.FRICTION_MOVE;
//         this.rotationVelocityY *= physicsParams.FRICTION_TURN;

//         const rotationStep = mat4.create();
//         mat4.identity(rotationStep);
        
//         mat4.rotateX(rotationStep, rotationStep, this.rotationVelocityX);
//         mat4.rotateY(rotationStep, rotationStep, this.rotationVelocityY);

//         mat4.multiply(this.planetRotationMatrix, rotationStep, this.planetRotationMatrix);
        
//         const rollIntensity = 15; 
//         const currentRoll = this.rotationVelocityY * rollIntensity; 
        
//         plane.rotationOffset = [
//             this.baseRotationOffset[0] + Math.abs(currentRoll),
//             this.baseRotationOffset[1] + currentRoll, 
//             this.baseRotationOffset[2] 
//         ];
//     }

//     toggleTopDownMode(plane, topDownMode) {
//         if (topDownMode) {
//             mat4.identity(this.planetRotationMatrix);
//             const orbitDirection = this.orbitConfig.angle + Math.PI / 2;
//             plane.rotationOffset = [
//                 this.baseRotationOffset[0],
//                 this.baseRotationOffset[1] + orbitDirection,
//                 this.baseRotationOffset[2]
//             ];
//         } else {
//             this.orbitConfig.angle = Math.atan2(plane.position[2], plane.position[0]);
//             plane.rotationOffset = [...this.baseRotationOffset];
//         }
//     }
// }

// MODIFICAÇÕES PARA physics.js

// A classe Physics precisa ser modificada para receber a função de cálculo de altura

export class Physics {
    constructor() {
        this.keys = { w: false, s: false, a: false, d: false };

        this.orbitConfig = {
            angle: 0,
            inclination: (Math.random() - 0.5) * 0.5,
            speed: 0.005 + Math.random() * 0.01,
            baseRadius: 1.85, // MODIFICADO: Renomeado para deixar claro que é o raio base
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

        this.getTerrainHeightFunc = null;
    }

    setTerrainHeightCalculator(heightFunc) {
        this.getTerrainHeightFunc = heightFunc;
    }

    updateOrbit(plane, topDownMode, terrainDisplacement) {
        if (topDownMode) return;
        
        const cfg = this.orbitConfig;
        cfg.angle += cfg.speed;
        cfg.wobble += cfg.wobbleSpeed;

        const baseY = Math.sin(cfg.inclination);
        const horizontalRadius = Math.cos(cfg.inclination);
        const wobbleY = Math.sin(cfg.wobble) * cfg.wobbleAmount;
        
        // Calcular direção normalizada da órbita
        const direction = [
            Math.cos(cfg.angle) * horizontalRadius,
            baseY + wobbleY,
            Math.sin(cfg.angle) * horizontalRadius
        ];
        
        // Normalizar
        const len = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2);
        direction[0] /= len;
        direction[1] /= len;
        direction[2] /= len;
        
        // NOVO: Se temos função de altura, usar ela; senão usar cálculo antigo
        let radius;
        if (this.getTerrainHeightFunc) {
            radius = this.getTerrainHeightFunc(direction, 0.3);
        } else {
            // Fallback para o método antigo
            radius = cfg.baseRadius + (terrainDisplacement * 0.3);
        }
        
        // Aplicar posição com altura correta do terreno
        plane.position[0] = direction[0] * radius;
        plane.position[1] = direction[1] * radius;
        plane.position[2] = direction[2] * radius;

        const bankAngle = Math.sin(cfg.wobble * 2) * 0.1;
        plane.rotationOffset = [
            this.baseRotationOffset[0] + bankAngle,
            this.baseRotationOffset[1] + Math.PI/2,
            this.baseRotationOffset[2]
        ];
    }

    // MODIFICADO: updatePlanetPhysics com altura do terreno
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
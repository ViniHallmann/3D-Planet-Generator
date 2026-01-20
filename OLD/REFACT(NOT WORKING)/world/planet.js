import { mat4 } from '../utils/math.js';
import { CONSTANTS } from '../config/constants.js';

export class Planet {
    constructor() {
        this.rotationMatrix = mat4.create();
        mat4.identity(this.rotationMatrix);
        
        this.velocityX = 0;
        this.velocityY = 0;
    }

    update(dt, inputManager, isTopDown) {
        if (!isTopDown) return;

        if (inputManager.isKeyDown('w')) this.velocityX += CONSTANTS.MOVE_ACCELERATION;
        if (inputManager.isKeyDown('s')) this.velocityX -= CONSTANTS.MOVE_ACCELERATION;
        
        if (inputManager.isKeyDown('a')) this.velocityY += CONSTANTS.TURN_ACCELERATION;
        if (inputManager.isKeyDown('d')) this.velocityY -= CONSTANTS.TURN_ACCELERATION;

        this.velocityX *= CONSTANTS.FRICTION_MOVE;
        this.velocityY *= CONSTANTS.FRICTION_TURN;

        const rotationStep = mat4.create();
        mat4.identity(rotationStep);
        
        mat4.rotateX(rotationStep, rotationStep, this.velocityX);
        mat4.rotateY(rotationStep, rotationStep, this.velocityY);

        mat4.multiply(this.rotationMatrix, rotationStep, this.rotationMatrix);
    }

    getMatrix() {
        return this.rotationMatrix;
    }
}
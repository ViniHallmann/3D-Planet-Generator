import { DEFAULTS } from '../config/defaults.js';
import { CONSTANTS } from '../config/constants.js';

export class State {
    constructor() {
        this.app = { ...DEFAULTS.app };

        this.physics = {
            MOUSE_ROTATION_SPEED: CONSTANTS.MOUSE_ROTATION_SPEED,
            MAX_LAYERS: CONSTANTS.MAX_LAYERS,
            MAX_CLOUD_LAYERS: CONSTANTS.MAX_CLOUD_LAYERS,
            MAX_CLOUD_OFFSET: CONSTANTS.MAX_CLOUD_OFFSET,
            MIN_PHI: CONSTANTS.MIN_PHI,
            MAX_PHI: CONSTANTS.MAX_PHI,
            AUTO_ROTATE: CONSTANTS.AUTO_ROTATE,
            LEFT_BUTTON_VALUE: CONSTANTS.LEFT_BUTTON_VALUE,
            PLANET_ROTATION_SPEED: CONSTANTS.PLANET_ROTATION_SPEED,
            MOVE_ACCELERATION: CONSTANTS.MOVE_ACCELERATION,
            TURN_ACCELERATION: CONSTANTS.TURN_ACCELERATION,
            FRICTION_MOVE: CONSTANTS.FRICTION_MOVE,
            FRICTION_TURN: CONSTANTS.FRICTION_TURN,
        };

        this.noise = { ...DEFAULTS.noise };
        this.camera = { ...DEFAULTS.camera };
        this.layerLevels = { ...DEFAULTS.layerLevels };
        this.layerColors = { ...DEFAULTS.layerColors };
        this.shaders = { ...DEFAULTS.shaders };
        this.clouds = { ...DEFAULTS.clouds };
        this.cloudShadowParams = { ...DEFAULTS.cloudShadowParams };
        this.water = { ...DEFAULTS.water };
    }
}
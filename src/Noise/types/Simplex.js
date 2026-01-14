import { createNoise4D } from 'https://cdn.skypack.dev/simplex-noise';

export class SimplexStrategy {
    constructor(randomFunc) {
        this.noise4D = createNoise4D(randomFunc);
    }

    get(x, y, z, w) {
        return this.noise4D(x, y, z, w);
    }
}
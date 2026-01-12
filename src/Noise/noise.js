import { SimplexStrategy } from './types/Simplex.js';
import { PerlinStrategy } from './types/Perlin.js';
import { ValueStrategy } from './types/Value.js';

function seededRandom(seed) {
    return function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class NoiseGenerator {
    constructor(width, height, seed = null, noiseType = 'simplex') {
        this.width = width;
        this.height = height;
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
        this.noiseType = noiseType;
        this.strategy = null;
        
        this.init();
    }

    init() {
        this.random = seededRandom(this.seed);
        this.initPermutationTable();
        this.setStrategy(this.noiseType);
    }

    initPermutationTable() {
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    setStrategy(type) {
        this.noiseType = type;
        switch(type) {
            case 'simplex':
                this.strategy = new SimplexStrategy(this.random);
                break;
            case 'perlin':
                this.strategy = new PerlinStrategy(this.perm);
                break;
            case 'value':
                this.strategy = new ValueStrategy(this.perm);
                break;
            default:
                this.strategy = new SimplexStrategy(this.random);
        }
    }

    setSeed(seed) {
        this.seed = seed;
        this.init();
    }

    setNoiseType(type) {
        if (this.noiseType !== type) {
            this.setStrategy(type);
        }
    }

    getSeed() {
        return this.seed;
    }

    generate(params) {
        const { octaves, persistence, lacunarity, noiseZoom } = params;
        const data = new Float32Array(this.width * this.height);
        const PI = 3.14159265359;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {

                let total = 0;
                let frequency = 1.0;
                let amplitude = 1.0;
                let maxValue = 0;

                for (let i = 0; i < octaves; i++) {
                    const nx = (x / this.width) * frequency;
                    const ny = (y / this.height) * frequency;

                    const angleX = 2 * PI * nx;
                    const angleY = 2 * PI * ny;

                    const x4d = Math.cos(angleX) * noiseZoom;
                    const y4d = Math.sin(angleX) * noiseZoom;
                    const z4d = Math.cos(angleY) * noiseZoom;
                    const w4d = Math.sin(angleY) * noiseZoom;

                    total += this.strategy.get(x4d, y4d, z4d, w4d) * amplitude;

                    maxValue += amplitude;
                    amplitude *= persistence;
                    frequency *= lacunarity;
                }

                data[y * this.width + x] = (total / maxValue + 1) / 2;
            }
        }
        return data;
    }

    get3DNoise(x, y, z, params) {
        const { octaves, persistence, lacunarity, noiseZoom } = params;
        
        let total = 0;
        let frequency = 1.0;
        let amplitude = 1.0;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            const nx = x * noiseZoom * frequency;
            const ny = y * noiseZoom * frequency;
            const nz = z * noiseZoom * frequency;
            const nw = 0.0; 

            total += this.strategy.get(nx, ny, nz, nw) * amplitude;

            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return (total / maxValue + 1) / 2;
    }
}
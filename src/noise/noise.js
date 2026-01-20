import { createNoise4D } from 'https://cdn.skypack.dev/simplex-noise';
import { seededRandom, fade, lerp } from '../utils/noise.js';

// //ALGORITMO Mulberry32
// function seededRandom(seed) {
//     return function() {
//         seed = (seed + 0x6D2B79F5) | 0;
//         let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
//         t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
//         return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
//     };
// }

// // Função de interpolação suave (smoothstep)
// function fade(t) {
//     return t * t * t * (t * (t * 6 - 15) + 10);
// }

// // Interpolação linear
// function lerp(a, b, t) {
//     return a + t * (b - a);
// }

export class NoiseGenerator {
    constructor(width, height, seed=null, noiseType='simplex') {
        this.width = width;
        this.height = height;
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
        this.noiseType = noiseType;
        this.noise4D = createNoise4D(seededRandom(this.seed));
        
        // Inicializa tabelas de permutação para Value e Perlin noise
        this.initPermutationTable();
        this.initGradients4D();
    }

    initPermutationTable() {
        const random = seededRandom(this.seed);
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        
        // Preenche com valores 0-255
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }
        
        // Embaralha usando Fisher-Yates
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Duplica para evitar overflow
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    initGradients4D() {
        // Gradientes 4D para Perlin noise (32 gradientes)
        this.gradients4D = [
            [0,1,1,1], [0,1,1,-1], [0,1,-1,1], [0,1,-1,-1],
            [0,-1,1,1], [0,-1,1,-1], [0,-1,-1,1], [0,-1,-1,-1],
            [1,0,1,1], [1,0,1,-1], [1,0,-1,1], [1,0,-1,-1],
            [-1,0,1,1], [-1,0,1,-1], [-1,0,-1,1], [-1,0,-1,-1],
            [1,1,0,1], [1,1,0,-1], [1,-1,0,1], [1,-1,0,-1],
            [-1,1,0,1], [-1,1,0,-1], [-1,-1,0,1], [-1,-1,0,-1],
            [1,1,1,0], [1,1,-1,0], [1,-1,1,0], [1,-1,-1,0],
            [-1,1,1,0], [-1,1,-1,0], [-1,-1,1,0], [-1,-1,-1,0]
        ];
    }

    setNoiseType(noiseType) {
        this.noiseType = noiseType;
    }

    getSeed() {
        return this.seed;
    }
    
    setSeed(seed) {
        this.seed = seed;
        this.noise4D = createNoise4D(seededRandom(this.seed));
        this.initPermutationTable();
        this.initGradients4D();
    }

    setWidth(width) {
        this.width = width;
    }

    setHeight(height) {
        this.height = height;
    }

    getNoiseValue(x, y, z, w) {
        switch(this.noiseType) {
            case 'simplex':
                return this.noise4D(x, y, z, w);
            case 'perlin':
                return this.perlinNoise4D(x, y, z, w);
            case 'value':
                return this.valueNoise4D(x, y, z, w);
            default:
                return this.noise4D(x, y, z, w);
        }
    }

    // ============================================
    // VALUE NOISE 4D
    // ============================================
    hash4D(x, y, z, w) {
        const n = this.perm[(x & 255) + this.perm[(y & 255) + this.perm[(z & 255) + this.perm[w & 255]]]];
        return (n / 255.0) * 2.0 - 1.0; // Retorna valor entre -1 e 1
    }

    valueNoise4D(x, y, z, w) {
        // Coordenadas inteiras
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const z0 = Math.floor(z);
        const w0 = Math.floor(w);
        
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const z1 = z0 + 1;
        const w1 = w0 + 1;
        
        // Frações suavizadas
        const sx = fade(x - x0);
        const sy = fade(y - y0);
        const sz = fade(z - z0);
        const sw = fade(w - w0);
        
        // Valores nos 16 cantos do hipercubo 4D
        const n0000 = this.hash4D(x0, y0, z0, w0);
        const n1000 = this.hash4D(x1, y0, z0, w0);
        const n0100 = this.hash4D(x0, y1, z0, w0);
        const n1100 = this.hash4D(x1, y1, z0, w0);
        const n0010 = this.hash4D(x0, y0, z1, w0);
        const n1010 = this.hash4D(x1, y0, z1, w0);
        const n0110 = this.hash4D(x0, y1, z1, w0);
        const n1110 = this.hash4D(x1, y1, z1, w0);
        const n0001 = this.hash4D(x0, y0, z0, w1);
        const n1001 = this.hash4D(x1, y0, z0, w1);
        const n0101 = this.hash4D(x0, y1, z0, w1);
        const n1101 = this.hash4D(x1, y1, z0, w1);
        const n0011 = this.hash4D(x0, y0, z1, w1);
        const n1011 = this.hash4D(x1, y0, z1, w1);
        const n0111 = this.hash4D(x0, y1, z1, w1);
        const n1111 = this.hash4D(x1, y1, z1, w1);
        
        // Interpolação trilinear em 4D
        const nx00 = lerp(lerp(n0000, n1000, sx), lerp(n0100, n1100, sx), sy);
        const nx10 = lerp(lerp(n0010, n1010, sx), lerp(n0110, n1110, sx), sy);
        const nx01 = lerp(lerp(n0001, n1001, sx), lerp(n0101, n1101, sx), sy);
        const nx11 = lerp(lerp(n0011, n1011, sx), lerp(n0111, n1111, sx), sy);
        
        const nxy0 = lerp(nx00, nx10, sz);
        const nxy1 = lerp(nx01, nx11, sz);
        
        return lerp(nxy0, nxy1, sw);
    }

    // ============================================
    // PERLIN NOISE 4D
    // ============================================
    dot4D(grad, x, y, z, w) {
        return grad[0] * x + grad[1] * y + grad[2] * z + grad[3] * w;
    }

    getGradient4D(x, y, z, w) {
        const hash = this.perm[(x & 255) + this.perm[(y & 255) + this.perm[(z & 255) + this.perm[w & 255]]]];
        return this.gradients4D[hash & 31];
    }

    perlinNoise4D(x, y, z, w) {
        // Coordenadas inteiras
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const z0 = Math.floor(z);
        const w0 = Math.floor(w);
        
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const z1 = z0 + 1;
        const w1 = w0 + 1;
        
        // Vetores de distância
        const dx0 = x - x0;
        const dy0 = y - y0;
        const dz0 = z - z0;
        const dw0 = w - w0;
        
        const dx1 = x - x1;
        const dy1 = y - y1;
        const dz1 = z - z1;
        const dw1 = w - w1;
        
        // Frações suavizadas
        const sx = fade(dx0);
        const sy = fade(dy0);
        const sz = fade(dz0);
        const sw = fade(dw0);
        
        // Produto escalar com gradientes nos 16 cantos
        const n0000 = this.dot4D(this.getGradient4D(x0, y0, z0, w0), dx0, dy0, dz0, dw0);
        const n1000 = this.dot4D(this.getGradient4D(x1, y0, z0, w0), dx1, dy0, dz0, dw0);
        const n0100 = this.dot4D(this.getGradient4D(x0, y1, z0, w0), dx0, dy1, dz0, dw0);
        const n1100 = this.dot4D(this.getGradient4D(x1, y1, z0, w0), dx1, dy1, dz0, dw0);
        const n0010 = this.dot4D(this.getGradient4D(x0, y0, z1, w0), dx0, dy0, dz1, dw0);
        const n1010 = this.dot4D(this.getGradient4D(x1, y0, z1, w0), dx1, dy0, dz1, dw0);
        const n0110 = this.dot4D(this.getGradient4D(x0, y1, z1, w0), dx0, dy1, dz1, dw0);
        const n1110 = this.dot4D(this.getGradient4D(x1, y1, z1, w0), dx1, dy1, dz1, dw0);
        const n0001 = this.dot4D(this.getGradient4D(x0, y0, z0, w1), dx0, dy0, dz0, dw1);
        const n1001 = this.dot4D(this.getGradient4D(x1, y0, z0, w1), dx1, dy0, dz0, dw1);
        const n0101 = this.dot4D(this.getGradient4D(x0, y1, z0, w1), dx0, dy1, dz0, dw1);
        const n1101 = this.dot4D(this.getGradient4D(x1, y1, z0, w1), dx1, dy1, dz0, dw1);
        const n0011 = this.dot4D(this.getGradient4D(x0, y0, z1, w1), dx0, dy0, dz1, dw1);
        const n1011 = this.dot4D(this.getGradient4D(x1, y0, z1, w1), dx1, dy0, dz1, dw1);
        const n0111 = this.dot4D(this.getGradient4D(x0, y1, z1, w1), dx0, dy1, dz1, dw1);
        const n1111 = this.dot4D(this.getGradient4D(x1, y1, z1, w1), dx1, dy1, dz1, dw1);
        
        // Interpolação
        const nx00 = lerp(lerp(n0000, n1000, sx), lerp(n0100, n1100, sx), sy);
        const nx10 = lerp(lerp(n0010, n1010, sx), lerp(n0110, n1110, sx), sy);
        const nx01 = lerp(lerp(n0001, n1001, sx), lerp(n0101, n1101, sx), sy);
        const nx11 = lerp(lerp(n0011, n1011, sx), lerp(n0111, n1111, sx), sy);
        
        const nxy0 = lerp(nx00, nx10, sz);
        const nxy1 = lerp(nx01, nx11, sz);
        
        return lerp(nxy0, nxy1, sw);
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

                    total += this.getNoiseValue(x4d, y4d, z4d, w4d) * amplitude;

                    maxValue += amplitude;
                    amplitude *= persistence;
                    frequency *= lacunarity;
                }

                let value = (total / maxValue + 1) / 2;
                data[y * this.width + x] = value;
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

            total += this.getNoiseValue(nx, ny, nz, nw) * amplitude;

            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return (total / maxValue + 1) / 2;
    }
    
}
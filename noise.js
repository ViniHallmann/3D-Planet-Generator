import { createNoise4D } from 'https://cdn.skypack.dev/simplex-noise';

//ALGORITMO Mulberry32
function seededRandom(seed) {
    return function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class NoiseGenerator {
    constructor(width, height, seed=null, noiseType='simplex') {
        this.width = width;
        this.height = height;
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
        this.noiseType = noiseType;
        this.noise4D = createNoise4D(seededRandom(this.seed));
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
    }

    setWidth(width) {
        this.width = width;
    }

    setHeight(height) {
        this.height = height;
    }

    simplexNoise(x, y, z, w) {
        return this.noise4D(x, y, z, w);
    }

    getNoiseValue(x, y, z, w) {
        switch(this.noiseType) {
            case 'simplex':
                return this.simplexNoise(x, y, z, w);
            default:
                return this.simplexNoise(x, y, z, w);
        }
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
        //FAZ com que o noise varie entre numeros mais baixo
        //Ele acaba sempre normalizando seu valor no meio [0.5], entao esse ajuste de contraste faz com que os valores fiquem mais proximos de 0 ou 1
        // let normalized = (total / maxValue + 1) / 2;
        // let contrast = 1.5; 
        // let val = (normalized - 0.5) * contrast + 0.5;

        // return Math.max(0.0, Math.min(1.0, val));
    }

    // modifyTerrain(data, brushX, brushY, brushSize, intensity, action) {
    //     const startX = Math.max(0, brushX - brushSize);
    //     const endX = Math.min(this.width - 1, brushX + brushSize);
    //     const startY = Math.max(0, brushY - brushSize);
    //     const endY = Math.min(this.height - 1, brushY + brushSize);

    //     for (let y = startY; y <= endY; y++) {
    //         for (let x = startX; x <= endX; x++) {
    //             const dx = x - brushX;
    //             const dy = y - brushY;
    //             const distance = Math.sqrt(dx * dx + dy * dy);

    //             if (distance < brushSize) {
    //                 const falloff = 1.0 - (distance / brushSize);
    //                 const noiseModulation = this.noise2D(x / 50, y / 50);
    //                 const modulatedIntensity = intensity + (intensity * noiseModulation * 0.5); 

    //                 const index = y * this.width + x;
    //                 if (action === 'add') {
    //                     data[index] += modulatedIntensity * falloff;
    //                 } else if (action === 'remove') {
    //                     data[index] -= modulatedIntensity * falloff;
    //                 }
                    
    //             }
    //         }
    //     }
    // }
    
}
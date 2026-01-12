import { lerp, fade } from '../../utils/math.js';

export class PerlinStrategy {
    constructor(permTable) {
        this.perm = permTable;
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

    dot4D(grad, x, y, z, w) {
        return grad[0] * x + grad[1] * y + grad[2] * z + grad[3] * w;
    }

    getGradient4D(x, y, z, w) {
        const hash = this.perm[(x & 255) + this.perm[(y & 255) + this.perm[(z & 255) + this.perm[w & 255]]]];
        return this.gradients4D[hash & 31];
    }

    get(x, y, z, w) {
        const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z), w0 = Math.floor(w);
        const x1 = x0 + 1, y1 = y0 + 1, z1 = z0 + 1, w1 = w0 + 1;
        
        const dx0 = x - x0, dy0 = y - y0, dz0 = z - z0, dw0 = w - w0;
        const dx1 = x - x1, dy1 = y - y1, dz1 = z - z1, dw1 = w - w1;
        
        const sx = fade(dx0), sy = fade(dy0), sz = fade(dz0), sw = fade(dw0);
        
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
        
        const nx00 = lerp(lerp(n0000, n1000, sx), lerp(n0100, n1100, sx), sy);
        const nx10 = lerp(lerp(n0010, n1010, sx), lerp(n0110, n1110, sx), sy);
        const nx01 = lerp(lerp(n0001, n1001, sx), lerp(n0101, n1101, sx), sy);
        const nx11 = lerp(lerp(n0011, n1011, sx), lerp(n0111, n1111, sx), sy);
        
        const nxy0 = lerp(nx00, nx10, sz);
        const nxy1 = lerp(nx01, nx11, sz);
        
        return lerp(nxy0, nxy1, sw);
    }
}
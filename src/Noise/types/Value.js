import { lerp, fade } from '../../utils/math.js';

export class ValueStrategy {
    constructor(permTable) {
        this.perm = permTable;
    }

    hash4D(x, y, z, w) {
        const n = this.perm[(x & 255) + this.perm[(y & 255) + this.perm[(z & 255) + this.perm[w & 255]]]];
        return (n / 255.0) * 2.0 - 1.0; 
    }

    get(x, y, z, w) {
        const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z), w0 = Math.floor(w);
        const x1 = x0 + 1, y1 = y0 + 1, z1 = z0 + 1, w1 = w0 + 1;
        
        const sx = fade(x - x0), sy = fade(y - y0), sz = fade(z - z0), sw = fade(w - w0);
        
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
        
        const nx00 = lerp(lerp(n0000, n1000, sx), lerp(n0100, n1100, sx), sy);
        const nx10 = lerp(lerp(n0010, n1010, sx), lerp(n0110, n1110, sx), sy);
        const nx01 = lerp(lerp(n0001, n1001, sx), lerp(n0101, n1101, sx), sy);
        const nx11 = lerp(lerp(n0011, n1011, sx), lerp(n0111, n1111, sx), sy);
        
        const nxy0 = lerp(nx00, nx10, sz);
        const nxy1 = lerp(nx01, nx11, sz);
        
        return lerp(nxy0, nxy1, sw);
    }
}
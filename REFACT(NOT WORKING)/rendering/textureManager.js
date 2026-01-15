import { loadTexture } from '../utils/loaders.js';

class TextureManager {
    constructor() {
        this.textures = new Map();
        this.gl = null;
    }

    init(gl) {
        this.gl = gl;
    }

    async load(name, url) {
        if (!this.gl) throw new Error("TextureManager not initialized with GL context");
        if (this.textures.has(name)) return this.textures.get(name);

        const texture = await loadTexture(this.gl, url);
        this.textures.set(name, texture);
        return texture;
    }

    get(name) {
        return this.textures.get(name);
    }

    createDataTexture(name, data, width, height) {
        if (!this.gl) return;
        
        const gl = this.gl;
        let texture = this.textures.get(name);
        
        if (!texture) {
            texture = gl.createTexture();
            this.textures.set(name, texture);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        const textureData = new Uint8Array(width * height * 4);
        for (let i = 0; i < data.length; i++) {
            const value = Math.floor(data[i] * 255);
            textureData[i * 4 + 0] = value; 
            textureData[i * 4 + 1] = value; 
            textureData[i * 4 + 2] = value; 
            textureData[i * 4 + 3] = 255;   
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        return texture;
    }
}

export const textureManager = new TextureManager();
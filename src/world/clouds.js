import { textureManager } from '../rendering/textureManager.js';

export async function initClouds(renderer) {
    await textureManager.load('cloud', 'assets/noises/cloud2.png');
    
    const texture = textureManager.get('cloud');
    if (texture) {
        renderer.setCloudTexture(texture);
    }
}
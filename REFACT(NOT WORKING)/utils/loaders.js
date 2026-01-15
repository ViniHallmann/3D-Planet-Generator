export async function loadOBJ(url) {
    const response = await fetch(url);
    const text = await response.text();
    
    const positions = [];
    const normals = [];
    const indices = [];
    const vertices = [[-1]];
    const normalsData = [[-1]];
    
    text.split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        
        if (parts[0] === 'v') {
            vertices.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);
        } else if (parts[0] === 'vn') {
            normalsData.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);
        } else if (parts[0] === 'f') {
            for (let i = 1; i <= 3; i++) {
                const vertexData = parts[i].split('/');
                const vIdx = parseInt(vertexData[0]);
                const nIdx = vertexData.length > 2 ? parseInt(vertexData[2]) : 0;
                
                if (vIdx > 0 && vertices[vIdx]) {
                    positions.push(...vertices[vIdx]);
                    
                    if (nIdx > 0 && normalsData[nIdx]) {
                        normals.push(...normalsData[nIdx]);
                    } else {
                        normals.push(0, 1, 0);
                    }
                    
                    indices.push(indices.length);
                }
            }
        }
    });
    
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Uint16Array(indices)
    };
}

export async function loadTexture(gl, url) {
    return new Promise((resolve) => {
        const texture = gl.createTexture();
        const image = new Image();
        
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            resolve(texture);
        };

        image.onerror = () => {
            console.warn(`Textura não encontrada ou erro ao carregar: ${url}. Usando fallback.`);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
            resolve(texture);
        };

        image.src = url;
    });
}
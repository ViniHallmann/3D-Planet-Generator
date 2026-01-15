async function loadOBJ(url) {
    const response = await fetch(url);
    const text = await response.text();
    
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    const vertices = [null];
    const normalsData = [null];
    const uvsData = [null];
    
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
        } else if (parts[0] === 'vt') {
            uvsData.push([
                parseFloat(parts[1]),
                1.0 - parseFloat(parts[2])
            ]);
        } else if (parts[0] === 'f') {
            for (let i = 1; i <= 3; i++) {
                const vertexData = parts[i].split('/');
                const vIdx = parseInt(vertexData[0]);
                const vtIdx = vertexData.length > 1 && vertexData[1] ? parseInt(vertexData[1]) : 0;
                const vnIdx = vertexData.length > 2 ? parseInt(vertexData[2]) : 0;
                
                if (vIdx > 0 && vertices[vIdx]) {
                    positions.push(...vertices[vIdx]);
                    
                    // Normais
                    if (vnIdx > 0 && normalsData[vnIdx]) {
                        normals.push(...normalsData[vnIdx]);
                    } else {
                        normals.push(0, 1, 0);
                    }
                    
                    // UVs
                    if (vtIdx > 0 && uvsData[vtIdx]) {
                        uvs.push(...uvsData[vtIdx]);
                    } else {
                        uvs.push(0, 0);
                    }
                    
                    indices.push(indices.length);
                }
            }
        }
    });
    
    console.log('OBJ carregado:');
    console.log('- Vértices:', positions.length / 3);
    console.log('- Normais:', normals.length / 3);
    console.log('- UVs:', uvs.length / 2);
    console.log('- Índices:', indices.length);
    
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        uvs: new Float32Array(uvs),
        indices: new Uint16Array(indices)
    };
}

export { loadOBJ };
async function loadOBJ(url) {
    const response = await fetch(url);
    const text = await response.text();
    
    const positions = [];
    const normals = [];
    const indices = [];
    const vertices = [[-1]]; // Index 0 vazio (OBJ começa em 1)
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
            // Suporta vários formatos: f v v v, f v/vt v/vt v/vt, f v/vt/vn v/vt/vn v/vt/vn, f v//vn v//vn v//vn
            for (let i = 1; i <= 3; i++) {
                const vertexData = parts[i].split('/');
                const vIdx = parseInt(vertexData[0]);
                const nIdx = vertexData.length > 2 ? parseInt(vertexData[2]) : 0;
                
                if (vIdx > 0 && vertices[vIdx]) {
                    positions.push(...vertices[vIdx]);
                    
                    if (nIdx > 0 && normalsData[nIdx]) {
                        normals.push(...normalsData[nIdx]);
                    } else {
                        // Normal padrão se não houver
                        normals.push(0, 1, 0);
                    }
                    
                    indices.push(indices.length);
                }
            }
        }
    });
    
    console.log('OBJ carregado:');
    console.log('- Vértices:', positions.length / 3);
    console.log('- Normais:', normals.length / 3);
    console.log('- Índices:', indices.length);
    
    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Uint16Array(indices)
    };
}

export { loadOBJ };
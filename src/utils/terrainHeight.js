export class TerrainHeight {
    constructor(noiseGenerator) {
        this.noiseGenerator = noiseGenerator;
    }

    /**
     * Calcula a altura do terreno em um ponto 3D específico
     * @param {Array} position - Posição [x, y, z] normalizada (na esfera unitária)
     * @param {Object} noiseParams - Parâmetros do noise (octaves, persistence, lacunarity, noiseZoom)
     * @param {Number} terrainDisplacement - Fator de deslocamento do terreno
     * @param {Number} heightOffset - Offset adicional acima da superfície (padrão 0.3)
     * @returns {Number} - Raio final do ponto (1.0 + noiseValue * terrainDisplacement + heightOffset)
     */
    getHeightAtPosition(position, noiseParams, terrainDisplacement, heightOffset = 0.3) {
        // Normalizar a posição para garantir que está na esfera unitária
        const len = Math.sqrt(position[0]**2 + position[1]**2 + position[2]**2);
        const normalizedPos = [
            position[0] / len,
            position[1] / len,
            position[2] / len
        ];

        // Calcular o noise neste ponto 3D
        const noiseValue = this.noiseGenerator.get3DNoise(
            normalizedPos[0],
            normalizedPos[1],
            normalizedPos[2],
            noiseParams
        );

        // Altura do terreno baseado no noise
        const terrainRadius = 1.0 + (noiseValue * terrainDisplacement);
        
        // Offset base: garante distância mínima mesmo com terrainDisplacement = 0
        const baseOffset = 0.5; // Distância base do planeta
        
        // Offset adicional proporcional ao terrainDisplacement
        const scaledOffset = terrainDisplacement * heightOffset;
        
        // Offset total = base + proporcional
        const totalOffset = baseOffset + scaledOffset;
        
        const radius = terrainRadius + totalOffset;

        return radius;
    }

    /**
     * Calcula a posição 3D final com a altura do terreno
     * @param {Array} normalizedDirection - Direção normalizada [x, y, z]
     * @param {Object} noiseParams - Parâmetros do noise
     * @param {Number} terrainDisplacement - Fator de deslocamento
     * @param {Number} heightOffset - Offset adicional
     * @returns {Array} - Posição [x, y, z] com altura do terreno aplicada
     */
    getPositionAtHeight(normalizedDirection, noiseParams, terrainDisplacement, heightOffset = 0.3) {
        const radius = this.getHeightAtPosition(
            normalizedDirection,
            noiseParams,
            terrainDisplacement,
            heightOffset
        );

        return [
            normalizedDirection[0] * radius,
            normalizedDirection[1] * radius,
            normalizedDirection[2] * radius
        ];
    }
}
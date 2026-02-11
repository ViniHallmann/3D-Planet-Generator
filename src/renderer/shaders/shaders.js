const glsl = x => x;

export const vertexShaderSource = glsl`#version 300 es
    in vec4 a_position;
    in vec3 a_normal;
    in vec2 a_texcoord;
    in float a_triangleHeight;
    
    uniform float u_time;
    uniform mat4 u_matrix;
    uniform mat4 u_modelMatrix;
    uniform sampler2D u_noiseTexture;
    uniform sampler2D u_cloudTexture;
    uniform float u_renderPass;

    uniform float u_terrainDisplacement;

    uniform float u_cloudScale;
    uniform float u_cloudDisplacementIntensity;
    uniform float u_cloudSpeed;

    out vec3 v_normal;
    out vec2 v_texcoord;
    out float v_height;
    out vec3 v_modelPosition;
    out vec3 v_worldPosition;

    mat2 rotate2D(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
    }

    float getCloudDisplacement(vec3 pos) {
        vec3 weights = abs(normalize(pos));
        weights = max(weights - 0.2, 0.0);
        weights /= dot(weights, vec3(1.0));

        vec3 p = pos;
        p.xz = rotate2D(u_time * u_cloudSpeed) * p.xz; 

        float x = texture(u_cloudTexture, p.yz).r;
        float y = texture(u_cloudTexture, p.zx).r;
        float z = texture(u_cloudTexture, p.xy).r;

        return x * weights.x + y * weights.y + z * weights.z;
    }

    void main() {
        vec3 pos;

        if (u_renderPass == 1.) {
            vec3 displacement = a_position.xyz * a_triangleHeight * u_terrainDisplacement;
            pos = a_position.xyz + displacement;
            v_height = a_triangleHeight;
        }

        if (u_renderPass == 2.) {
            float displacementValue = getCloudDisplacement(a_position.xyz);
            // float cloudBaseHeight = 0.8 + u_terrainDisplacement + (u_cloudScale - 1.0);
            // float cloudVariation = displacementValue * u_cloudDisplacementIntensity * a_triangleHeight;
            
            float terrainInfluence = 0.5;
            
            float cloudBaseHeight = 1.0 + (u_terrainDisplacement * terrainInfluence) + (u_cloudScale - 1.0);
            float cloudVariation = displacementValue * u_cloudDisplacementIntensity * a_triangleHeight;

            pos = a_position.xyz * (cloudBaseHeight + cloudVariation); 
            v_height = 0.0; 
            
            
        }

        if (u_renderPass == 3.) { //AQUI USA U_TERRAINDISPLACEMENT POIS A SOMBRA EH PROJETADA NA TERRA
            vec3 terrainDisplacement = a_position.xyz * a_triangleHeight * u_terrainDisplacement;
            
            vec3 shadowOffset = normalize(a_position.xyz) * 0.002;
            pos = a_position.xyz + terrainDisplacement + shadowOffset;
            v_height = 0.0;
        }

        if (u_renderPass == 4.) {
            pos = a_position.xyz;
            v_height = 0.0;
        }

        // if (u_renderPass == 5.) {
        //     float waterLevel = 0.45;
            
        //     float waterRadius = 1.0 + (waterLevel * u_terrainDisplacement);
        //     pos = a_position.xyz * waterRadius;
        //     v_height = 0.0;
        // }

        if (u_renderPass == 5.) {
            float waterHeightLevel = 0.35;
            float waterRadius = 1.0 + (waterHeightLevel * u_terrainDisplacement);
            
            vec3 weights = abs(normalize(a_position.xyz));
            weights = max(weights - 0.2, 0.0);
            weights /= dot(weights, vec3(1.0));
            
            float waveSpeed = 0.1;
            vec3 wavePos = a_position.xyz + vec3(u_time * waveSpeed, 0.0, u_time * waveSpeed * 0.7);
            
            float wave1 = texture(u_cloudTexture, wavePos.yz * 2.0).r;
            float wave2 = texture(u_cloudTexture, wavePos.xz * 3.0).r;
            float wave3 = texture(u_cloudTexture, wavePos.xy * 1.5).r;
            
            float waveHeight = (wave1 * weights.x + wave2 * weights.y + wave3 * weights.z) - 0.5;
            
            float waveAmplitude = 0.01; // Tamanho das ondas
            vec3 waveDisplacement = normalize(a_position.xyz) * waveHeight * waveAmplitude;
            
            pos = a_position.xyz * waterRadius + waveDisplacement;
            v_height = 0.0;
        }

        gl_Position = u_matrix * vec4(pos, 1.0);
        v_normal = mat3(u_modelMatrix) * a_normal;
        v_modelPosition = pos;
        v_worldPosition = (u_modelMatrix * vec4(pos, 1.0)).xyz;
        v_texcoord = a_texcoord;
        v_modelPosition = pos;
        //v_modelPosition = a_position.xyz;
    }
`;

export const fragmentShaderSource = glsl`#version 300 es
    precision highp float;

    in vec3 v_normal;
    in vec2 v_texcoord;
    in float v_height;
    in vec3 v_modelPosition;
    in vec3 v_worldPosition;

    uniform float u_renderPass;

    uniform float u_layer0Level;  
    uniform float u_layer1Level;  
    uniform float u_layer2Level; 
    uniform float u_layer3Level; 
    uniform float u_layer4Level;  
    uniform float u_layer5Level;  
    uniform float u_layer6Level; 
    uniform float u_layer7Level;
    uniform float u_layer8Level; 
    uniform float u_layer9Level; 

    uniform vec3 u_layer0Color;
    uniform vec3 u_layer1Color;
    uniform vec3 u_layer2Color;
    uniform vec3 u_layer3Color;
    uniform vec3 u_layer4Color;
    uniform vec3 u_layer5Color;
    uniform vec3 u_layer6Color;
    uniform vec3 u_layer7Color;
    uniform vec3 u_layer8Color;
    uniform vec3 u_layer9Color;

    uniform vec3 u_color;
    uniform bool u_useColor;

    uniform sampler2D u_noiseTexture;
    uniform sampler2D u_cloudTexture;
    uniform sampler2D u_objectTexture;

    uniform float u_time;
    uniform float u_lightSpeed;      
    uniform float u_lightAngle;      
    uniform float u_lightPitch;
    uniform bool u_lambertianDiffuse;
    uniform float u_lightBrightness;

    uniform float u_rimSize;
    uniform float u_rimIntensity;
    uniform vec3 u_rimColor;
    uniform bool u_showRim;

    uniform float u_cloudOpacity;
    uniform float u_cloudScale;
    uniform float u_cloudSpeed;
    uniform float u_cloudWarpIntensity;
    uniform float u_cloudWarpTime;
    uniform float u_cloudThreshold;
    uniform float u_cloudAlpha;
    uniform vec3 u_cloudColor;
    uniform float u_cloudTextureZoom;

    uniform float u_terrainDisplacement;

    uniform vec3 u_viewPosition;

    uniform float u_useShadows;
    uniform sampler2D u_shadowMap;
    uniform mat4 u_lightSpaceMatrix;
    
    uniform vec3 u_waterColor;
    uniform float u_waterOpacity;

    out vec4 outColor;

    vec4 getLayer0Color(float height) { return vec4(u_layer0Color, 1.0); }
    vec4 getLayer1Color(float height) { return vec4(u_layer1Color, 1.0); }
    vec4 getLayer2Color(float height) { return vec4(u_layer2Color, 1.0); }
    vec4 getLayer3Color(float height) { return vec4(u_layer3Color, 1.0); }
    vec4 getLayer4Color(float height) { return vec4(u_layer4Color, 1.0); }
    vec4 getLayer5Color(float height) { return vec4(u_layer5Color, 1.0); }
    vec4 getLayer6Color(float height) { return vec4(u_layer6Color, 1.0); }
    vec4 getLayer7Color(float height) { return vec4(u_layer7Color, 1.0); }
    vec4 getLayer8Color(float height) { return vec4(u_layer8Color, 1.0); }
    vec4 getLayer9Color(float height) { return vec4(u_layer9Color, 1.0); }

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    vec4 defineTerrainColor(float height) {

        //REFERENCIA DO CODIGO DO SLOPE: https://www.youtube.com/watch?v=6bnFfE82AJg&t=60s
        float flatness = dot(normalize(v_normal), normalize(v_modelPosition));

        //REFERENCIA CODIGO VARIACAO HEIGHT VALUE: https://www.youtube.com/watch?v=fZh2p0odPyQ&t=175s
        //height += (hash(v_modelPosition.xz * 50.) * 2.0 - 1.0) * 0.0025;

        // if (height < u_layer0Level)      return getLayer0Color(height);
        // else if (height < u_layer1Level) return getLayer1Color(height);
        // else if (height < u_layer2Level) return getLayer2Color(height);
        // else if (height < u_layer3Level) return getLayer3Color(height);
        // else if (height < u_layer4Level) return getLayer4Color(height);
        // else if (height < u_layer5Level) return getLayer5Color(height);
        // else if (height < u_layer6Level) return getLayer6Color(height);
        // else if (height < u_layer7Level) return getLayer7Color(height);
        // else if (height < u_layer8Level) return getLayer8Color(height);
        // else return getLayer9Color(height);

        if (height < u_layer0Level)      return mix(getLayer0Color(height), getLayer1Color(height), smoothstep(u_layer0Level - 0.05, u_layer0Level + 0.05, height));
        else if (height < u_layer1Level) return mix(getLayer1Color(height), getLayer2Color(height), smoothstep(u_layer1Level - 0.05, u_layer1Level + 0.05, height));
        else if (height < u_layer2Level) return mix(getLayer2Color(height), getLayer3Color(height), smoothstep(u_layer2Level - 0.05, u_layer2Level + 0.05, height));
        else if (height < u_layer3Level) return mix(getLayer3Color(height), getLayer4Color(height), smoothstep(u_layer3Level - 0.05, u_layer3Level + 0.05, height));
        else if (height < u_layer4Level) return mix(getLayer4Color(height), getLayer5Color(height), smoothstep(u_layer4Level - 0.05, u_layer4Level + 0.05, height));
        else if (height < u_layer5Level) return mix(getLayer5Color(height), getLayer6Color(height), smoothstep(u_layer5Level - 0.05, u_layer5Level + 0.05, height));
        else if (height < u_layer6Level) return mix(getLayer6Color(height), getLayer7Color(height), smoothstep(u_layer6Level - 0.05, u_layer6Level + 0.05, height));
        else if (height < u_layer7Level) return mix(getLayer7Color(height), getLayer8Color(height), smoothstep(u_layer7Level - 0.05, u_layer7Level + 0.05, height));
        else if (height < u_layer8Level) return mix(getLayer8Color(height), getLayer9Color(height), smoothstep(u_layer8Level - 0.05, u_layer8Level + 0.05, height));
        else return getLayer9Color(height);
    }

    vec3 lambertianDiffuse(vec3 normal, vec3 lightDir, float brightness) {
        float diff = max(dot(normal, lightDir), 0.0);
        return vec3(diff * brightness);
    }

    vec3 rimLight(vec3 normal, vec3 viewPos, vec3 worldPos){
        vec3 viewDir = normalize(viewPos - worldPos);
        float rim = 1.0 - max(dot(viewDir, normal), 0.0);

        float baseExponent = 4.5;
        float minExponent = 3.5;
        float maxDisplacement = 1.0;
        float dynamicExponent = mix(baseExponent, minExponent, clamp(u_terrainDisplacement / maxDisplacement, 0.0, 1.0));

        rim = pow(rim, dynamicExponent);
        return rim * u_rimColor * u_rimIntensity;
    }

    float triplanarSample(vec3 pos, vec3 normal, float scale) {
        vec3 weights = abs(normal);
        weights = max(weights - 0.2, 0.0);
        weights /= dot(weights, vec3(1.0));


        float warpTime = u_time * u_cloudWarpTime * 0.1;
        vec3 warpOffset = vec3(warpTime, warpTime * 0.5, -warpTime);
        vec3 warpPos = (pos * scale * 0.5) + warpOffset;

        float wx = texture(u_cloudTexture, warpPos.yz).r;
        float wy = texture(u_cloudTexture, warpPos.zx).r;
        float wz = texture(u_cloudTexture, warpPos.xy).r;
        float warpVal = wx * weights.x + wy * weights.y + wz * weights.z;

        float flowTime = u_time * 0.02;
        vec3 flowOffset = vec3(flowTime, 0.0, flowTime * 0.2);
        
        // float warpIntensity = 0.4;
        vec3 mainPos = (pos * scale) + flowOffset + (vec3(warpVal) * u_cloudWarpIntensity);

        float x = texture(u_cloudTexture, mainPos.yz).r;
        float y = texture(u_cloudTexture, mainPos.zx).r;
        float z = texture(u_cloudTexture, mainPos.xy).r;

        return x * weights.x + y * weights.y + z * weights.z;
    }

    float calculateShadow(vec3 worldPos) {
        if (u_useShadows < 0.5) return 1.0;
        
        vec4 lightSpacePos = u_lightSpaceMatrix * vec4(worldPos, 1.0);
        vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
        projCoords = projCoords * 0.5 + 0.5;
        
        // VERIFICAR SE TA FORA DO FRUSTRUM
        if (projCoords.x < 0.0 || projCoords.x > 1.0 ||
            projCoords.y < 0.0 || projCoords.y > 1.0 ||
            projCoords.z > 1.0) {
            return 1.0;
        }
        
        float closestDepth = texture(u_shadowMap, projCoords.xy).r;
        float currentDepth = projCoords.z;
        float bias = 0.005;
        float shadow = currentDepth - bias > closestDepth ? 0.3 : 1.0;
        
        return shadow;
    }


    vec3 getLightDirection(){
        return normalize(vec3(
            cos(u_lightAngle) * cos(u_lightPitch),
            sin(u_lightPitch),
            sin(u_lightAngle) * cos(u_lightPitch)
        ));
    }

    float calculateLight(vec3 normal, vec3 lightDir, float shadow) {
        if (u_lambertianDiffuse) {
            return lambertianDiffuse(normal, lightDir, u_lightBrightness).r * shadow;
        }
        return 1.0;
    }

    vec3 applyWaterTransparency(vec3 waterColor, float height, float light) {
        float distanceToSand = u_layer2Level - height;
        float maxTransparencyDepth = u_layer3Level - u_layer2Level;
        
        float normalizeDepth = clamp(distanceToSand / maxTransparencyDepth, 0.0, 1.0);
        float waterLerp = pow(1.0 - normalizeDepth, 2.0);
        
        vec3 sandColor = u_layer3Color * light;
        return mix(waterColor, sandColor, waterLerp);
    }

    vec3 applyShoreWaves(vec3 color, float height, float light) {
        float waveZone = 0.02;
        float distanceToSand = u_layer2Level - height;
        
        if (distanceToSand < waveZone) {
            float waveIntensity = 1.0 - (distanceToSand / waveZone);
            
            float wave1 = sin(u_time * 2.0 + distanceToSand * 150.0) * 0.5 + 0.5;
            float wave2 = sin(u_time * 1.5 + distanceToSand * 100.0 + 1.0) * 0.5 + 0.5;
            float wave = max(wave1, wave2 * 0.7);
            
            wave *= waveIntensity;
            return color + vec3(wave * 0.25 * light);
        }
        return color;
    }

    vec3 applyWaterEffects(vec3 baseColor, float height, float light) {
        if (height < u_layer1Level || height >= u_layer2Level) {
            return baseColor;
        }
        
        vec3 color = baseColor;
        
        color = applyWaterTransparency(color, height, light);
        color = applyShoreWaves(color, height, light);
        
        return color;
    }

    vec4 renderTerrain(vec3 normal, vec3 lightDir, float light, vec3 rim) {
        vec4 color;
        
        if (u_useColor) {
            color = vec4(u_color * light, 1.0);
        } else {
            vec3 terrainColor = defineTerrainColor(v_height).rgb;
            color = vec4(terrainColor * light, 1.0);
        }
        
        color.rgb = applyWaterEffects(color.rgb, v_height, light);
        color.rgb += rim;
        
        return color;
    }

    vec4 renderClouds(vec3 normal, vec3 lightDir, float light) {
        float cloudNoise = triplanarSample(v_modelPosition, normal, u_cloudTextureZoom); 
        if (cloudNoise < u_cloudThreshold) discard;
        
        float alpha = u_cloudOpacity * smoothstep(0.5, 0.8, cloudNoise);
        return vec4(u_cloudColor, alpha * light);
    }

    vec4 renderCloudShadow(vec3 normal, vec3 lightDir, float light) {
        float terrainHeight = length(v_modelPosition);
        float terrainInfluence = 0.5;
        float cloudHeight = 1.0 + (u_terrainDisplacement * terrainInfluence) + (u_cloudScale - 1.0);

        if (terrainHeight >= cloudHeight - 0.01) discard;

        float cloudNoise = triplanarSample(v_modelPosition, normal, u_cloudTextureZoom); 
        if (cloudNoise < u_cloudThreshold) discard;

        float alpha = 0.85; 
        return vec4(vec3(0.0), alpha * light);
    }

    vec4 renderObject(vec3 normal, vec3 lightDir, float light) {
        if (u_useColor) {
            return vec4(u_color * light, 1.0);
        } else {
            vec3 texColor = texture(u_objectTexture, v_texcoord).rgb;
            return vec4(texColor * light, 1.0);
        }
    }

    vec4 renderWater(vec3 normal, vec3 viewDir){
        float fresnel = dot(normalize(normal), normalize(viewDir));
        fresnel = abs(fresnel);
        
        float alpha = mix(0.95, u_waterOpacity, pow(fresnel, 2.0));
        
        return vec4(u_waterColor, alpha);
    }

    void main() {
        vec3 normal = normalize(v_normal);
        vec3 lightDir = getLightDirection();
        float shadow = calculateShadow(v_worldPosition);
        float light = calculateLight(normal, lightDir, shadow);
        
        vec3 rim = vec3(0.0);
        if (u_showRim) {
            rim = rimLight(normal, u_viewPosition, v_worldPosition);
        }

        if (u_renderPass == 1.0) {
            outColor = renderTerrain(normal, lightDir, light, rim);
        }
        else if (u_renderPass == 2.0) {
            float cloudLight = u_lambertianDiffuse ? lambertianDiffuse(normal, lightDir, u_lightBrightness).r : 1.0;
            outColor = renderClouds(normal, lightDir, cloudLight);
        } 
        else if (u_renderPass == 3.0) {
            float cloudLight = u_lambertianDiffuse ? lambertianDiffuse(normal, lightDir, u_lightBrightness).r : 1.0;
            outColor = renderCloudShadow(normal, lightDir, cloudLight);
        }
        else if (u_renderPass == 4.0) {
            float objLight = u_lambertianDiffuse ? lambertianDiffuse(normal, lightDir, u_lightBrightness).r : 1.0;
            outColor = renderObject(normal, lightDir, objLight);
        }
        else if (u_renderPass == 5.0) {
            vec3 viewDir = u_viewPosition - v_worldPosition;
            outColor = renderWater(normal, viewDir);
        }

    }

    // void main() {
    //     vec3 normal = normalize(v_normal);
    //     float angle = u_lightAngle;
    //     float pitch = u_lightPitch;
    //     vec3 lightDir = getLightDirection();
    //     float light;
    //     light = u_lightBrightness;

    //     float shadow = calculateShadow(v_worldPosition);
    //     vec3 rim = vec3(0.0);
    //     if (u_showRim == true) {
    //         rim = rimLight(normal, u_viewPosition, v_worldPosition);
    //     }

    //     //vec3 rim = rimLight(normal, u_viewPosition, v_worldPosition);

    //     if (u_renderPass == 1.) {
    //         if (u_lambertianDiffuse == true) {
    //             light = lambertianDiffuse(normal, lightDir, u_lightBrightness).r * shadow;
    //         } else {
    //             light = 1.0;
    //         }
    //         if (u_useColor) {
    //             outColor = vec4(u_color * light, 1.0);
    //         } else {
    //             vec3 color = defineTerrainColor(v_height).rgb;
    //             outColor = vec4(color * light, 1.0);
    //         }

    //         //REFERENCIA DESSA PARTE DO CODIGO https://www.youtube.com/watch?v=6bnFfE82AJg
    //         //DEPOIS TRANSFORMAR EM FUNCAO E ADICIONAR VARIAVEIS PARA CONTROLAR AS CORES E NIVEIS
    //         //ADICIONAR TAMBEM ONDE FICA A LINHA DA AGUA E AREIA

    //         // ISSO AQUI TEM QUE SAIR DAQUI E VIRAR UMA FUNCAO!!!!
    //         //WAVES DAS AGUAS
    //         if (v_height >= u_layer1Level && v_height < u_layer2Level) {
    //             float distanceToSand = u_layer2Level - v_height;
    //             float maxTransparencyDepth = u_layer3Level - u_layer2Level;
                
    //             float normalizeDepth = clamp(distanceToSand / maxTransparencyDepth, 0.0, 1.0);
    //             float waterLerp = pow(1.0 - normalizeDepth, 2.0);
                
    //             vec3 sandColor = u_layer3Color * light;
    //             outColor.rgb = mix(outColor.rgb, sandColor, waterLerp);
                
    //             float waveZone = 0.02;
    //             float distanceFromSand = v_height - u_layer2Level;
                
    //             if (distanceToSand < waveZone) {
    //                 float waveIntensity = 1.0 - (distanceToSand / waveZone);
    //                 float wave = sin(u_time * 2.0 + distanceToSand * 150.0) * 0.5 + 0.5;
    //                 wave *= waveIntensity;
    //                 outColor.rgb += wave / 4.0 * light;
    //             }
    //         }
    //         //SE DER TEMPO E LEMBRAR:
    //         //AMBOS EFEITOS VISUAIS SAO BASEADOS EM LAYERS. MAS E SE A PESSOA FIZER UM PLANETA ARIDO POR EXEMPLO?
    //         //TEM QUE TER A OPCAO DE DESATIVAR ESSES EFEITOS VISUAIS, OU PELO MENOS FAZER COM QUE ELAS CONSIGAM ESCOLHER EM QUE LAYER OCORRE O EFEITO
    //         //SE ALGUEM FIZER UM PLANETA COM VARIAS LAYERS DE "AGUA", O EFEITO DA ONDA OCORRE SO NOS PRIMEIROS LAYERS.

    //         //VIRIAR FUNCAO
    //         //NIGHT LIGHTS
    //         // float sunDot = dot(normalize(v_normal), lightDir); 
    //         // float nightFactor = smoothstep(0.15, -0.15, sunDot);

    //         // if (nightFactor > 0.0 && v_height > u_layer3Level && v_height < u_layer6Level) {
                
    //         //     float noise = texture(u_noiseTexture, v_modelPosition.xz * 75.0).r;
    //         //     float cityDensity = smoothstep(0.7, 0.9, noise);
                
    //         //     if (cityDensity > 0.01) {
    //         //         float microNoise = texture(u_noiseTexture, v_modelPosition.xz * 150.0).r;
    //         //         float twinkle = hash(v_modelPosition.xz * 100.0); 
                    
                    
    //         //         vec3 cityColorCore = vec3(1.0, 0.9, 0.8);     //Quase branco
    //         //         vec3 cityColorOutskirt = vec3(1.0, 0.6, 0.2); //Laranja forte
    //         //         vec3 finalCityColor = mix(cityColorOutskirt, cityColorCore, cityDensity);
    //         //         float intensity = 2.5; 
                    
    //         //         outColor.rgb += finalCityColor * nightFactor * intensity;
    //         //         outColor.rgb += (vec3(1.0, 0.5, 0.1) * 0.1) * cityDensity * nightFactor ;
    //         //     }
    //         // }
    //         outColor.rgb += rim;
    //     }

    //     if (u_renderPass == 2.) {
    //         if (u_lambertianDiffuse == true) {
    //             light = lambertianDiffuse(normal, lightDir, u_lightBrightness).r;
    //         } else {
    //             light = 1.0;
    //         }
    //         float cloudNoise = triplanarSample(v_modelPosition, normal, u_cloudTextureZoom); 
    //         if (cloudNoise < u_cloudThreshold) discard;
            
    //         float alpha = u_cloudOpacity * smoothstep(0.5, 0.8, cloudNoise);

    //         //DEPOIS COLOCAR INPUT DO ALPHA NO HTML PARA CONTROLAR INTENSIDADE DAS CORES
    //         outColor = vec4(u_cloudColor, alpha * light);
    //     } 
        
    //     if (u_renderPass == 3.) {
    //         if (u_lambertianDiffuse == true) {
    //             light = lambertianDiffuse(normal, lightDir, u_lightBrightness).r;
    //         } else {
    //             light = 1.0;
    //         }
    //         float terrainHeight = length(v_modelPosition);
    //         float terrainInfluence = 0.5;
    //         float cloudHeight = 1.0 + (u_terrainDisplacement * terrainInfluence) + (u_cloudScale - 1.0);

    //         if (terrainHeight >= cloudHeight - 0.01) discard;

    //         float cloudNoise = triplanarSample(v_modelPosition, normal, u_cloudTextureZoom); 
    //         if (cloudNoise < u_cloudThreshold) discard;

    //         float alpha = smoothstep(0.65, 0.8, cloudNoise);
            
    //         alpha = 0.85; 
    //         outColor = vec4(vec3(0.0), alpha * light);
    //     }

    //     if (u_renderPass == 4.) {
    //         float light = u_lightBrightness;
    //         if (u_lambertianDiffuse) {
    //             vec3 lightDir = normalize(vec3(
    //                 cos(u_lightAngle) * cos(u_lightPitch),
    //                 sin(u_lightPitch),
    //                 sin(u_lightAngle) * cos(u_lightPitch)
    //             ));
    //             light = max(dot(normalize(v_normal), lightDir), 0.0) * u_lightBrightness;
    //         }
            
    //         if (u_useColor) {
    //             outColor = vec4(u_color * light, 1.0);
    //         } else {
    //             vec3 texColor = texture(u_objectTexture, v_texcoord).rgb;
    //             outColor = vec4(texColor * light, 1.0);
    //         }
    //     }
    // }
`;

export const shadowVertexShaderSource = glsl`#version 300 es
    in vec4 a_position;
    in vec3 a_normal;
    
    uniform mat4 u_lightSpaceMatrix;
    uniform mat4 u_modelMatrix;
    
    void main() {
        gl_Position = u_lightSpaceMatrix * u_modelMatrix * a_position;
    }
`;

export const shadowFragmentShaderSource = glsl`#version 300 es
    precision highp float;
    
    out vec4 outColor;
    
    void main() {
        outColor = vec4(1.0);
    }
`;

export const starVertexShaderSource = glsl`#version 300 es
    in vec3 a_position;
    in float a_size;

    uniform mat4 u_viewProjectionMatrix;

    out float v_brightness;

    void main() {
        gl_Position = u_viewProjectionMatrix * vec4(a_position, 1.0);
        gl_PointSize = a_size;
        v_brightness = a_size / 3.0;
    }
`;

export const starFragmentShaderSource = glsl`#version 300 es
    precision highp float;

    in float v_brightness;
    out vec4 outColor;

    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;

        float brightness = (1.0 - dist * 2.0) * v_brightness;

        vec3 starColor = vec3(1.0);
        float colorVariation = fract(v_brightness * 123.456);
        if (colorVariation > 0.95) {
            starColor = vec3(1.0, 0.9, 0.95); // Rosa muito claro
        } else if (colorVariation > 0.90) {
            starColor = vec3(0.95, 0.95, 1.0); // Azul muito claro
        }

        outColor = vec4(starColor * brightness, 1.0);
    }
`;
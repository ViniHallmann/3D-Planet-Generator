const glsl = x => x;

export const vertexShaderSource = glsl`#version 300 es
    in vec4 a_position;
    in vec3 a_normal;
    in vec2 a_texcoord;
    in float a_triangleHeight;
    
    uniform float u_time;
    uniform mat4 u_matrix;
    uniform sampler2D u_noiseTexture;
    uniform sampler2D u_cloudTexture;
    uniform float u_renderPass;

    uniform float u_cloudScale;
    uniform float u_terrainDisplacement;      
    uniform float u_cloudDisplacementIntensity;
    uniform float u_cloudSpeed;

    out vec3 v_normal;
    out vec2 v_texcoord;
    out float v_height;
    out vec3 v_modelPosition;

    mat2 rotate2D(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
    }

    float getCloudDisplacement(vec3 pos) {
        vec3 weights = abs(normalize(pos));
        weights = max(weights - 0.2, 0.0);
        weights /= dot(weights, vec3(1.0));

        //float speed = 0.1; 
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
            float totalScale = u_cloudScale + (displacementValue * u_cloudDisplacementIntensity * a_triangleHeight);
            
            pos = a_position.xyz * totalScale; 
            v_height = 0.0; 
            
            // LEMBRAR: DEPOIS TENHO Q COLOCAR U_CLOUDINTENSITY AQUI. ACHO QUE POSSO COLOCAR UM RANDOM PARA QUE AS NUVENS SE DISSIPEM E VOLTEM
            // ALEM DISSO AINDA PRECISO PASSAR TODAS AS VARIAVEIS PELO HTML
        }

        if (u_renderPass == 3.) { //AQUI USA U_TERRAINDISPLACEMENT POIS A SOMBRA EH PROJETADA NA TERRA
            vec3 terrainDisplacement = a_position.xyz * a_triangleHeight * u_terrainDisplacement;
            
            vec3 shadowOffset = normalize(a_position.xyz) * 0.005; // ESSE VALOR AQUI PODE VIRAR UMA VARIAVEL DE CONTROLE MAS NAO VEJO MUITO SENTIDO AGORA
            
            pos = a_position.xyz + terrainDisplacement + shadowOffset;
            v_height = 0.0;
        }

        gl_Position = u_matrix * vec4(pos, 1.0);
        v_normal = a_normal;
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
    uniform float u_layer10Level; 

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

    uniform float u_time;
    uniform float u_lightSpeed;      
    uniform float u_lightAngle;      
    uniform float u_lightPitch;
    uniform bool u_lambertianDiffuse;
    uniform float u_lightBrightness;

    uniform float u_cloudOpacity;
    uniform float u_cloudScale;
    uniform float u_cloudSpeed;
    uniform float u_cloudWarpIntensity;
    uniform float u_cloudWarpTime;
    uniform float u_cloudThreshold;
    uniform float u_cloudAlpha;
    uniform vec3 u_cloudColor;
    uniform float u_cloudTextureZoom;

    uniform vec3 u_viewPosition;

    //uniform float u_shadowOpacity;
    
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

    vec4 defineTerrainColor(float height) {
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

    void main() {
        vec3 normal = normalize(v_normal);
        // float angle = u_time * u_lightSpeed;
        // float pitch = 0.5;
        float angle = u_lightAngle + (u_time * u_lightSpeed);
        float pitch = u_lightPitch;
        vec3 lightDir = normalize(vec3(
            cos(angle) * cos(pitch),
            sin(pitch),
            sin(angle) * cos(pitch)
        ));

        float light;

        if (u_lambertianDiffuse == true) {
            light = lambertianDiffuse(normal, lightDir, u_lightBrightness).r;
        } else {
            light = 1.0;
        }

        if (u_renderPass == 1.) {
            if (u_useColor) {
                outColor = vec4(u_color * light, 1.0);
            } else {
                vec3 color = defineTerrainColor(v_height).rgb;
                outColor = vec4(color * light, 1.0);
            }
            vec3 worldPos = v_modelPosition * 0.5;
            
            // 2. Calculate View Direction
            vec3 viewDir = normalize(u_viewPosition - worldPos);

            // 3. Calculate Fresnel (Rim) Factor
            // dot(viewDir, normal) is 1.0 when looking straight at surface, 0.0 at edges
            float rim = 1.0 - max(dot(viewDir, normal), 0.0);
            
            // 4. Sharpen the rim
            rim = pow(rim, 3.5);
            vec3 rimColor = vec3(0.0, 0.5, 1.0);

            // 5. Apply color and intensity
            vec3 rimLighting = rimColor * rim * 1.;

            // 6. Add to final color
            outColor.rgb += rimLighting;

        }

        if (u_renderPass == 2.) {

            float cloudNoise = triplanarSample(v_modelPosition, normal, u_cloudTextureZoom); 
            if (cloudNoise < u_cloudThreshold) discard;
            
            float alpha = u_cloudOpacity * smoothstep(0.5, 0.8, cloudNoise);

            //DEPOIS COLOCAR INPUT DO ALPHA NO HTML PARA CONTROLAR INTENSIDADE DAS CORES
            outColor = vec4(u_cloudColor, alpha * light);
        } 
        
        if (u_renderPass == 3.) {
            
            float cloudNoise = triplanarSample(v_modelPosition, normal, u_cloudTextureZoom); 
            if (cloudNoise < u_cloudThreshold) discard;

            float alpha = smoothstep(0.65, 0.8, cloudNoise);
            
            alpha = 0.85; 
            outColor = vec4(vec3(0.0), alpha * light);
        }
    }
`;
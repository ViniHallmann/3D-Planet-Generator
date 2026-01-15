export const vertexShaderSource = `#version 300 es
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

    uniform float u_cloudScale;
    uniform float u_terrainDisplacement;      
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
            float terrainInfluence = 0.5;
            float cloudBaseHeight = 1.0 + (u_terrainDisplacement * terrainInfluence) + (u_cloudScale - 1.0);
            float cloudVariation = displacementValue * u_cloudDisplacementIntensity * a_triangleHeight;

            pos = a_position.xyz * (cloudBaseHeight + cloudVariation); 
            v_height = 0.0; 
        }

        if (u_renderPass == 3.) { 
            vec3 terrainDisplacement = a_position.xyz * a_triangleHeight * u_terrainDisplacement;
            vec3 shadowOffset = normalize(a_position.xyz) * 0.002;
            pos = a_position.xyz + terrainDisplacement + shadowOffset;
            v_height = 0.0;
        }

        gl_Position = u_matrix * vec4(pos, 1.0);
        v_normal = mat3(u_modelMatrix) * a_normal;
        v_modelPosition = pos;
        v_worldPosition = (u_modelMatrix * vec4(pos, 1.0)).xyz;
        v_texcoord = a_texcoord;
    }
`;
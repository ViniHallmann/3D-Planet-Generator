import { vertexShaderSource, fragmentShaderSource, shadowVertexShaderSource, shadowFragmentShaderSource } from './shaders/shaders.js';
import { createShader, createProgram } from '../utils/wgl.js';
import { createIcosphere } from '../utils/geometry.js';
import { mat4 } from '../utils/math.js';
import { NoiseGenerator } from '../noise/noise.js';
import {checkGLSupport} from '../utils/utils.js';

export class Renderer {
    constructor(canvas, noiseParams) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        this.uniformLocations = {};
        this.objects = [];
        
        if (!checkGLSupport(this.gl)) return;

        this.initializeWebGL();
        this.createShaderProgram();
        this.getLocations();
        this.initializeGeometry(noiseParams.subdivisions);
        this.initializeNoise(noiseParams);
        this.createBuffers(this.geometry);
        this.createNoiseTexture(noiseParams);
        this.initShadowMap(1024);
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    initializeWebGL() {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clearColor(0.1, 0.1, 0.15, 1.0);
    }

    createShaderProgram() {
        this.program = createProgram(
            this.gl,
            createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource),
            createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource)
        );

        this.shadowProgram = createProgram(
            this.gl,
            createShader(this.gl, this.gl.VERTEX_SHADER, shadowVertexShaderSource),
            createShader(this.gl, this.gl.FRAGMENT_SHADER, shadowFragmentShaderSource)
        );
    }

    getLocations(params) {
        const gl = this.gl;
        this.positionLoc = gl.getAttribLocation(this.program, 'a_position');
        this.normalLoc   = gl.getAttribLocation(this.program, 'a_normal');
        this.uvLoc       = gl.getAttribLocation(this.program, 'a_texcoord');
        this.triangleHeightLoc = gl.getAttribLocation(this.program, 'a_triangleHeight');
        
        const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const activeUniform = gl.getActiveUniform(this.program, i);
            this.uniformLocations[activeUniform.name] = gl.getUniformLocation(this.program, activeUniform.name)
        }
    }
    updateUniforms(params) {
        const gl = this.gl;

        for (const [key, value] of Object.entries(params)) {
            
            //LEMBRAR AQUI QUE AGORA OS NOMES DAS VARIAVEIS PRECISAM SER IGUAIS AOS DOS SHADERS!
            const uniformName = `u_${key}`;
            const location = this.uniformLocations[uniformName];

            if (location) {
                if (typeof value === 'number') {
                    gl.uniform1f(location, value);
                } else if (typeof value === 'boolean') {
                    gl.uniform1i(location, value ? 1 : 0);
                } else if (Array.isArray(value) && value.length === 3) {
                    gl.uniform3fv(location, value);
                }
                else if (value instanceof Float32Array && value.length === 16) {
                    gl.uniformMatrix4fv(location, false, value);
                }
            } 
            else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.updateUniforms(value);
            }
        }
    }



    initializeGeometry(subdivisions) {
        this.geometry = createIcosphere(subdivisions);
        this.numElements = this.geometry.indices.length;
        this.numElementsLines = this.geometry.edgeIndices.length;
    }

    initializeNoise(noiseParams) {
        this.noiseGenerator = new NoiseGenerator(512, 512);
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, noiseParams);
    }

    initShadowMap(resolution = 2048) {
        const gl = this.gl;
        
        this.shadowMapSize = resolution;
        
        this.shadowFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer);
        
        this.shadowDepthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.shadowDepthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, resolution, resolution, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowDepthTexture, 0);
        
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Shadow framebuffer não está completo!');
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    createBuffers(geometry) {
        const gl = this.gl;
        
        this.positionBuffer       = this.createBuffer(gl.ARRAY_BUFFER, geometry.positions);
        this.normalBuffer         = this.createBuffer(gl.ARRAY_BUFFER, geometry.normals);
        this.uvBuffer             = this.createBuffer(gl.ARRAY_BUFFER, geometry.uvs);
        this.triangleHeightBuffer = this.createBuffer(gl.ARRAY_BUFFER, this.triangleHeights);
        this.indexBuffer          = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        this.edgeIndexBuffer      = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.edgeIndices);
        
        this.setupVAO();
        this.setupVAOLines();
    }

    createBuffer(target, data) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, gl.STATIC_DRAW);
        return buffer;
    }

    setupVAO() {
        const gl = this.gl;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        this.bindAttribute(this.positionBuffer, this.positionLoc, 3);
        this.bindAttribute(this.normalBuffer, this.normalLoc, 3);
        this.bindAttribute(this.uvBuffer, this.uvLoc, 2);
        this.bindAttribute(this.triangleHeightBuffer, this.triangleHeightLoc, 1);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bindVertexArray(null);
    }

    setupVAOLines() {
        const gl = this.gl;
        this.vaoLines = gl.createVertexArray();
        gl.bindVertexArray(this.vaoLines);
        
        this.bindAttribute(this.positionBuffer, this.positionLoc, 3);
        this.bindAttribute(this.normalBuffer, this.normalLoc, 3);
        this.bindAttribute(this.uvBuffer, this.uvLoc, 2);
        this.bindAttribute(this.triangleHeightBuffer, this.triangleHeightLoc, 1);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.bindVertexArray(null);
    }

    bindAttribute(buffer, location, size) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }

    updateBuffer(buffer, data) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    }

    updateTriangleHeightBuffer() {
        this.updateBuffer(this.triangleHeightBuffer, this.triangleHeights);
    }


    setSeed(seed) {
        this.noiseGenerator.setSeed(seed);
    }

    regenerateTerrain(params) {
        const { octaves, persistence, lacunarity, noiseZoom, noiseResolution } = params;

        this.triangleHeights = this.calculateTriangleHeights(this.geometry, params);
        
        this.updateTriangleHeightBuffer();
        this.createNoiseTexture(params);
    }

    regenerateIcosphere(subdivisions, noiseParams) {
        this.initializeGeometry(subdivisions);
        this.initializeNoise(noiseParams);
        this.createBuffers(this.geometry);
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, noiseParams);
        this.updateTriangleHeightBuffer();
    }

    calculateTriangleHeights(geometry, params) {
        const numVertices = geometry.positions.length / 3;
        const heights = new Float32Array(numVertices);
        
        
        for (let i = 0; i < numVertices; i++) {
            const x = geometry.positions[i * 3];
            const y = geometry.positions[i * 3 + 1];
            const z = geometry.positions[i * 3 + 2];
            
            heights[i] = this.noiseGenerator.get3DNoise(x, y, z, params);
        }
        
        return heights;
    }


    createNoiseTexture(params) {
        const { octaves, persistence, lacunarity, noiseZoom, noiseResolution } = params;

        const gl = this.gl;
        
        const noiseData = this.noiseGenerator.generate({octaves, persistence, lacunarity, noiseZoom, noiseResolution});

        const textureData = new Uint8Array(noiseResolution * noiseResolution * 4);
        for (let i = 0; i < noiseData.length; i++) {
            const value = Math.floor(noiseData[i] * 255);
            textureData[i * 4 + 0] = value; 
            textureData[i * 4 + 1] = value; 
            textureData[i * 4 + 2] = value; 
            textureData[i * 4 + 3] = 255;   
        }
        
        if (!this.noiseTexture) {
            this.noiseTexture = gl.createTexture();
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, noiseResolution, noiseResolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        //gl.bindTexture(gl.TEXTURE_2D, null);
    }

    setGeometry(subdivisions) {
        this.geometry = createIcosphere(subdivisions);
    }

    setLayerLevels(layers) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform1f(this.uniformLocations['u_layer0Level'], layers.layer0);
        gl.uniform1f(this.uniformLocations['u_layer1Level'], layers.layer1);
        gl.uniform1f(this.uniformLocations['u_layer2Level'], layers.layer2);
        gl.uniform1f(this.uniformLocations['u_layer3Level'], layers.layer3);
        gl.uniform1f(this.uniformLocations['u_layer4Level'], layers.layer4);
        gl.uniform1f(this.uniformLocations['u_layer5Level'], layers.layer5);
        gl.uniform1f(this.uniformLocations['u_layer6Level'], layers.layer6);
        gl.uniform1f(this.uniformLocations['u_layer7Level'], layers.layer7);
        gl.uniform1f(this.uniformLocations['u_layer8Level'], layers.layer8);
        gl.uniform1f(this.uniformLocations['u_layer9Level'], layers.layer9);
    }

    setLayerColors(colors) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform3fv(this.uniformLocations['u_layer0Color'], colors.layer0);
        gl.uniform3fv(this.uniformLocations['u_layer1Color'], colors.layer1);
        gl.uniform3fv(this.uniformLocations['u_layer2Color'], colors.layer2);
        gl.uniform3fv(this.uniformLocations['u_layer3Color'], colors.layer3);
        gl.uniform3fv(this.uniformLocations['u_layer4Color'], colors.layer4);
        gl.uniform3fv(this.uniformLocations['u_layer5Color'], colors.layer5);
        gl.uniform3fv(this.uniformLocations['u_layer6Color'], colors.layer6);
        gl.uniform3fv(this.uniformLocations['u_layer7Color'], colors.layer7);
        gl.uniform3fv(this.uniformLocations['u_layer8Color'], colors.layer8);
        gl.uniform3fv(this.uniformLocations['u_layer9Color'], colors.layer9);
    }

    setLightSpeed(speed) {
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_lightSpeed'], speed);
    }

    setLightBrightness(brightness) {
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_lightBrightness'], brightness);
    }

    setTime(time) {
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_time'], time);
    }

    setMatrix(mvpMatrix) {
        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.uniformLocations['u_matrix'], false, mvpMatrix);
    }

    setNoiseTexture() {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
        gl.uniform1i(this.uniformLocations['u_noiseTexture'], 0);
    }

    setCloudTexture(texture) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.uniformLocations['u_cloudTexture'], 1);

    }

    setUseColor(useColor) {
        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.uniformLocations['u_useColor'], useColor);
    }

    setColor(r, g, b) {
        this.gl.useProgram(this.program);
        this.gl.uniform3f(this.uniformLocations['u_color'], r, g, b);
    }

    setLambertianDiffuseUse(bool){
        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.uniformLocations['u_useLambertianDiffuse'], bool);
    }

    setTerrainDisplacement(displacement){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_terrainDisplacement'], displacement);
    }

    setRenderPass(pass){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_renderPass'], pass);
    }

    setCloudOpacity(opacity){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudOpacity'], opacity);
    }
    
    setCloudScale(scale){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudScale'], scale);
    }

    setCloudSpeed(speed){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudSpeed'], speed);
    }

    setCloudWarpIntensity(intensity){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudWarpIntensity'], intensity);
    }

    setCloudWarpTime(time){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudWarpTime'], time);
    }

    setCloudThreshold(threshold){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudThreshold'], threshold);
    }

    setCloudAlpha(alpha){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudAlpha'], alpha);
    }

    setCloudColor(color){
        this.gl.useProgram(this.program);
        this.gl.uniform3fv(this.uniformLocations['u_cloudColor'], color);
    }

    setCloudTextureZoom(zoom){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_cloudTextureZoom'], zoom);
    }

    setLambertianDiffuseUse(bool){
        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.uniformLocations['u_useLambertianDiffuse'], bool);
    }

    setViewPosition(position){
        this.gl.useProgram(this.program);
        this.gl.uniform3fv(this.uniformLocations['u_viewPosition'], position);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    clearScreen() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    addObject(geometry, position = [0, 0, 0], scale = [1, 1, 1]) {
        const gl = this.gl;
        
        const posBuffer = this.createBuffer(gl.ARRAY_BUFFER, geometry.positions);
        const normalBuffer = this.createBuffer(gl.ARRAY_BUFFER, geometry.normals);
        const indexBuffer = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        const uvBuffer = this.createBuffer(gl.ARRAY_BUFFER, geometry.uvs);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        this.bindAttribute(posBuffer, this.positionLoc, 3);
        this.bindAttribute(normalBuffer, this.normalLoc, 3);
        this.bindAttribute(uvBuffer, this.uvLoc, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindVertexArray(null);
        
        const obj = {
            vao,
            indexCount: geometry.indices.length,
            position,
            scale,
            rotation: [0, 0, 0],
            orbitAngle: 0,       
            orbitRadius: 0,
            orbitSpeed: 0,
            texture: null,
        };
        
        this.objects.push(obj);
        return obj;
    }

    renderObject(obj, time, params, planetRotationMatrix = null) {
        const gl = this.gl;
        
        if (obj.orbitRadius > 0) {
            obj.orbitAngle += obj.orbitSpeed;
            
            obj.position[0] = Math.cos(obj.orbitAngle) * obj.orbitRadius;
            obj.position[2] = Math.sin(obj.orbitAngle) * obj.orbitRadius;
            
            obj.position[1] = Math.sin(obj.orbitAngle * 2) * 0.3;
            
            obj.rotation[1] = obj.orbitAngle + Math.PI / 2;
            
            obj.rotation[0] = Math.sin(obj.orbitAngle) * 0.1;
            obj.rotation[2] = Math.cos(obj.orbitAngle * 3) * 0.05;
        }
        
        const modelMatrix = mat4.create();
        if (obj.rotateWithPlanet && planetRotationMatrix) {
            mat4.multiply(modelMatrix, modelMatrix, planetRotationMatrix);
        }
        mat4.translate(modelMatrix, modelMatrix, obj.position);
        
        if (obj.lookAtCenter) {
            const toCenter = [-obj.position[0],-obj.position[1],-obj.position[2]];

            const len = Math.sqrt(toCenter[0]**2 + toCenter[1]**2 + toCenter[2]**2);
            toCenter[0] /= len;
            toCenter[1] /= len;
            toCenter[2] /= len;
            
            const yaw = Math.atan2(toCenter[0], toCenter[2]);
            const pitch = Math.asin(-toCenter[1]);
            
            mat4.rotateY(modelMatrix, modelMatrix, yaw);
            mat4.rotateX(modelMatrix, modelMatrix, pitch);
            
            if (obj.rotationOffset) {
                mat4.rotateX(modelMatrix, modelMatrix, obj.rotationOffset[0]);
                mat4.rotateY(modelMatrix, modelMatrix, obj.rotationOffset[1]);
                mat4.rotateZ(modelMatrix, modelMatrix, obj.rotationOffset[2]);
            }
        } else {
            mat4.rotateY(modelMatrix, modelMatrix, obj.rotation[1]);
            mat4.rotateX(modelMatrix, modelMatrix, obj.rotation[0]);
            mat4.rotateZ(modelMatrix, modelMatrix, obj.rotation[2]);
        }
        
        mat4.scale(modelMatrix, modelMatrix, obj.scale);
        
        if (params.planetScale) {
            mat4.scale(modelMatrix, modelMatrix, [params.planetScale, params.planetScale, params.planetScale]);
        }
        
        const mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, this.currentViewProjection, modelMatrix);
        
        gl.bindVertexArray(obj.vao);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, obj.texture);
        gl.uniform1i(this.uniformLocations['u_objectTexture'], 3);
        
        const objectParams = {
            matrix: mvpMatrix,
            modelMatrix: modelMatrix,
            time: time,
            renderPass: 4.0,
            useColor: !obj.texture,
            color: obj.color || [0.8, 0.8, 0.8],
            lambertianDiffuse: params.lambertianDiffuse
        };
        
        this.updateUniforms(objectParams);
        
        gl.drawElements(gl.TRIANGLES, obj.indexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    getObjectModelMatrix(obj, time, params) {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, obj.position);
        
        if (obj.lookAtCenter) {
            const toCenter = [-obj.position[0], -obj.position[1], -obj.position[2]];
            const len = Math.sqrt(toCenter[0]**2 + toCenter[1]**2 + toCenter[2]**2);
            toCenter[0] /= len;
            toCenter[1] /= len;
            toCenter[2] /= len;
            
            const yaw = Math.atan2(toCenter[0], toCenter[2]);
            const pitch = Math.asin(-toCenter[1]);
            
            mat4.rotateY(modelMatrix, modelMatrix, yaw);
            mat4.rotateX(modelMatrix, modelMatrix, pitch);
            
            if (obj.rotationOffset) {
                mat4.rotateX(modelMatrix, modelMatrix, obj.rotationOffset[0]);
                mat4.rotateY(modelMatrix, modelMatrix, obj.rotationOffset[1]);
                mat4.rotateZ(modelMatrix, modelMatrix, obj.rotationOffset[2]);
            }
        } else {
            mat4.rotateY(modelMatrix, modelMatrix, obj.rotation[1]);
            mat4.rotateX(modelMatrix, modelMatrix, obj.rotation[0]);
            mat4.rotateZ(modelMatrix, modelMatrix, obj.rotation[2]);
        }
        
        mat4.scale(modelMatrix, modelMatrix, obj.scale);
        
        if (params.planetScale) {
            mat4.scale(modelMatrix, modelMatrix, [params.planetScale, params.planetScale, params.planetScale]);
        }
        
        return modelMatrix;
    }

    calculateLightSpaceMatrix(lightAngle, lightPitch, planetScale = 1.0, planetRotationMatrix = null) {
        const lightDir = [
            Math.cos(lightAngle) * Math.cos(lightPitch),
            Math.sin(lightPitch),
            Math.sin(lightAngle) * Math.cos(lightPitch)
        ];
        
        //DEPOIS COLOCAR VARIAVEL PARA DISTANCIA DA LUZ
        const lightDistance = 10.0;
        const lightPos = [
            lightDir[0] * lightDistance,
            lightDir[1] * lightDistance,
            lightDir[2] * lightDistance
        ];
        
        const lightViewMatrix = mat4.create();
        mat4.lookAt(lightViewMatrix, lightPos, [0, 0, 0], [0, 1, 0]);

        if (planetRotationMatrix) {
            mat4.multiply(lightViewMatrix, lightViewMatrix, planetRotationMatrix);
        }
        
        const orthoSize = 3.0 * planetScale;
        const lightProjectionMatrix = mat4.create();
        mat4.orthogonal(
            lightProjectionMatrix,
            -orthoSize, orthoSize,    // left, right
            -orthoSize, orthoSize,    // bottom, top
            0.1, 20.0                  // near, far
        );
        
        const lightSpaceMatrix = mat4.create();
        mat4.multiply(lightSpaceMatrix, lightProjectionMatrix, lightViewMatrix);
        
        return lightSpaceMatrix;
    }

    renderShadowPass(time, params, autoRotate, planetRotationMatrix) {
        const gl = this.gl;
        
        gl.useProgram(this.shadowProgram);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer);
        gl.viewport(0, 0, this.shadowMapSize, this.shadowMapSize);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        
        const lightSpaceMatrix = this.calculateLightSpaceMatrix(
            params.lightAngle || 0,
            params.lightPitch || 0.5,
            params.planetScale || 1.0,
            planetRotationMatrix
        );
        this.currentLightSpaceMatrix = lightSpaceMatrix;
        
        this.objects.forEach(obj => {
            const modelMatrix = this.getObjectModelMatrix(obj, time, params);

            if (obj.rotateWithPlanet && planetRotationMatrix) {
                const rotatedModel = mat4.create();
                mat4.multiply(rotatedModel, planetRotationMatrix, modelMatrix);
                gl.uniformMatrix4fv(
                    gl.getUniformLocation(this.shadowProgram, 'u_modelMatrix'),
                    false, rotatedModel
                );
            } else {
                gl.uniformMatrix4fv(
                    gl.getUniformLocation(this.shadowProgram, 'u_modelMatrix'),
                    false, modelMatrix
                );
            }
            
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.shadowProgram, 'u_lightSpaceMatrix'),
                false, lightSpaceMatrix
            );
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.shadowProgram, 'u_modelMatrix'),
                false, modelMatrix
            );
            
            gl.bindVertexArray(obj.vao);
            gl.drawElements(gl.TRIANGLES, obj.indexCount, gl.UNSIGNED_SHORT, 0);
        });
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPlanetPass(shadersParams, wireframe = true) {
        const gl = this.gl;

        this.setRenderPass(1);
        this.updateUniforms(shadersParams);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);

        if (wireframe) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(1, 1);
            this.setUseColor(true);
            this.setColor(0.0, 0.0, 0.0);

            gl.bindVertexArray(this.vaoLines);
            gl.drawElements(gl.LINES, this.numElementsLines, gl.UNSIGNED_SHORT, 0);

            gl.disable(gl.POLYGON_OFFSET_FILL);
            this.setUseColor(false);
        }
    }

    drawCloudsPass(cloudParams) {
        const gl = this.gl;

        //adicionei isso aqui para que eu possa ver a parte de tras das nuvens
        gl.disable(gl.CULL_FACE);

        this.setRenderPass(2);
        this.updateUniforms(cloudParams);

        if (cloudParams.texture) {
            this.setCloudTexture(cloudParams.texture);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);

        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
    }

    drawCloudShadowsPass(cloudParams) {
        const gl = this.gl;

        gl.disable(gl.CULL_FACE);

        this.setRenderPass(3);
        this.updateUniforms(cloudParams);

        if (cloudParams.texture) {
            this.setCloudTexture(cloudParams.texture);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);

        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
    }

    render(time, cameraPos, params, wireframe=true, lambertianDiffuse=true, autoRotate=false, renderPass, planetRotationMatrix=null) {
        const gl = this.gl;
        
        gl.useProgram(this.program);

        const modelMatrix       = mat4.create();
        const viewMatrix        = mat4.create();
        const projectionMatrix  = mat4.create();
        const mvpMatrix         = mat4.create();

        mat4.identity(modelMatrix);                                                             // Isso aqui faz com que a matriz modelo fique na origem do mundo 
        if (planetRotationMatrix) {
            mat4.multiply(modelMatrix, modelMatrix, planetRotationMatrix);
        }
        
        if (autoRotate) { mat4.rotateY(modelMatrix, modelMatrix, time * -0.1); } 
        mat4.scale(modelMatrix, modelMatrix, [params.planetScale, params.planetScale, params.planetScale]); // Escala o planeta de acordo com o valor passado
        mat4.lookAt(viewMatrix, [cameraPos.x, cameraPos.y, cameraPos.z], [0, 0, 0], [0, 1, 0]); // Isso aqui passa os valores da camera: pos, origem do mundo que ela vai olhar, up vector
        
        //if (autoRotate) { mat4.rotateY(viewMatrix, viewMatrix, time * -0.1); } 

        mat4.perspective(projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100.0); // Adiciona ilusao de profundidade, basicamente transforma de 3D para 2D para "caber" na tela
        const viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
        //mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);                                              // Combina tudo em uma so coisa. ViewMatrix vira relativo a projection aqui e depois a projection vira 2D com profundidade
        this.currentViewProjection = viewProjectionMatrix;
        //mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);                                                     // Agora a mvpMatrix tem tudo junto
        mat4.multiply(mvpMatrix, viewProjectionMatrix, modelMatrix);

        const frameParams = {
            time: time,
            matrix: mvpMatrix,              
            lambertianDiffuse: lambertianDiffuse,
            useColor: false,
            noiseTexture: 0,                
            cloudTexture: 1,
            viewPosition: [cameraPos.x, cameraPos.y, cameraPos.z],
            modelMatrix: modelMatrix,              
        };

        this.updateUniforms(frameParams);
        this.setNoiseTexture();

        if (this.currentLightSpaceMatrix) {
            gl.uniformMatrix4fv(this.uniformLocations['u_lightSpaceMatrix'], false, this.currentLightSpaceMatrix);
            gl.uniform1f(this.uniformLocations['u_useShadows'], 1.0);
            
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowDepthTexture);
            gl.uniform1i(this.uniformLocations['u_shadowMap'], 2);
        } else {
            gl.uniform1f(this.uniformLocations['u_useShadows'], 0.0);
        }

        if (renderPass === 1) {
            this.drawPlanetPass(params, wireframe);
            return;
        }

        if (renderPass === 2) {
            this.drawCloudsPass(params);
            return;
        }

        if (renderPass === 3) {
            this.drawCloudShadowsPass(params);
            return;
        }
        
    }
}
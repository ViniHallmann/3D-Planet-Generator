import { vertexShaderSource, fragmentShaderSource, shadowVertexShaderSource, shadowFragmentShaderSource, starVertexShaderSource, starFragmentShaderSource } from './shaders/shaders.js';
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

        this.matrixCache = {
            model: mat4.create(),
            view: mat4.create(),
            projection: mat4.create(),
            viewProjection: mat4.create(),
            mvp: mat4.create(),
            lightView: mat4.create(),
            lightProjection: mat4.create(),
            lightSpace: mat4.create()
        };

        if (!checkGLSupport(this.gl)) return;

        this.initializeWebGL();
        this.createShaderProgram();
        this.getLocations();
        this.initializeGeometry(noiseParams.subdivisions);
        this.initializeNoise(noiseParams);
        this.createBuffers(this.geometry);
        this.createNoiseTexture(noiseParams);
        this.initShadowMap(1024);
        this.initStarfield(5000, 50.0);
        
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
        this.starProgram = createProgram(
            this.gl,
            createShader(this.gl, this.gl.VERTEX_SHADER, starVertexShaderSource),
            createShader(this.gl, this.gl.FRAGMENT_SHADER, starFragmentShaderSource)
        );
    }

    getLocations(params) {
        const gl = this.gl;
        this.positionLoc = gl.getAttribLocation(this.program, 'a_position');
        this.normalLoc   = gl.getAttribLocation(this.program, 'a_normal');
        this.uvLoc       = gl.getAttribLocation(this.program, 'a_texcoord');
        this.triangleHeightLoc = gl.getAttribLocation(this.program, 'a_triangleHeight');
        this.terrainNormalLoc = gl.getAttribLocation(this.program, 'a_terrainNormal');
        
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
            if (params.layers) {
                for (let i = 0; i < 10; i++) {
                    const key = `layer${i}Level`;
                    gl.uniform1f(this.uniformLocations[`u_layer${i}Level`], params.layers[key]);
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
        this.noiseParams = noiseParams;
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, noiseParams);
        this.terrainNormals = this.calculateTerrainNormals(this.geometry, this.triangleHeights);
        this.manualOffsets = new Float32Array(this.geometry.positions.length / 3).fill(0);
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

    initStarfield(count = 5000, radius = 50.0) {
        const gl = this.gl;
        
        const positions = [];
        const sizes = [];
        
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            positions.push(x, y, z);
            
            const size = 1.0 + Math.random() * 2.0;
            sizes.push(size);
        }
        
        this.starPositionBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(positions));
        this.starSizeBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(sizes));
        
        this.starPositionLoc = gl.getAttribLocation(this.starProgram, 'a_position');
        this.starSizeLoc = gl.getAttribLocation(this.starProgram, 'a_size');
        
        this.starViewProjectionLoc = gl.getUniformLocation(this.starProgram, 'u_viewProjectionMatrix');
        
        this.starVAO = gl.createVertexArray();
        gl.bindVertexArray(this.starVAO);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.starPositionBuffer);
        gl.enableVertexAttribArray(this.starPositionLoc);
        gl.vertexAttribPointer(this.starPositionLoc, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.starSizeBuffer);
        gl.enableVertexAttribArray(this.starSizeLoc);
        gl.vertexAttribPointer(this.starSizeLoc, 1, gl.FLOAT, false, 0, 0);
        
        gl.bindVertexArray(null);
        
        this.starCount = count;
    }

    createBuffers(geometry) {
        const gl = this.gl;
        
        this.positionBuffer       = this.createBuffer(gl.ARRAY_BUFFER, geometry.positions);
        this.normalBuffer         = this.createBuffer(gl.ARRAY_BUFFER, geometry.normals);
        this.uvBuffer             = this.createBuffer(gl.ARRAY_BUFFER, geometry.uvs);
        this.triangleHeightBuffer = this.createBuffer(gl.ARRAY_BUFFER, this.triangleHeights);
        this.terrainNormalBuffer  = this.createBuffer(gl.ARRAY_BUFFER, this.terrainNormals);
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
        this.bindAttribute(this.terrainNormalBuffer, this.terrainNormalLoc, 3);
        
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
        this.bindAttribute(this.terrainNormalBuffer, this.terrainNormalLoc, 3);
        
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

    updateTerrainNormalBuffer() {
        this.updateBuffer(this.terrainNormalBuffer, this.terrainNormals);
    }


    setSeed(seed) {
        this.noiseGenerator.setSeed(seed);
    }

    regenerateTerrain(params) {
        const { octaves, persistence, lacunarity, noiseZoom, noiseResolution } = params;

        this.triangleHeights = this.calculateTriangleHeights(this.geometry, params);
        this.terrainNormals = this.calculateTerrainNormals(this.geometry, this.triangleHeights);
        
        this.updateTriangleHeightBuffer();
        this.updateTerrainNormalBuffer();
        this.createNoiseTexture(params);
    }

    regenerateIcosphere(subdivisions, noiseParams) {
        this.initializeGeometry(subdivisions);
        this.initializeNoise(noiseParams);
        this.createBuffers(this.geometry);
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, noiseParams);
        this.terrainNormals = this.calculateTerrainNormals(this.geometry, this.triangleHeights);
        this.updateTriangleHeightBuffer();
        this.updateTerrainNormalBuffer();
    }

    regenerateGeometry(subdivisions) {
        this.initializeGeometry(subdivisions);
        
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, this.noiseParams);
        this.terrainNormals = this.calculateTerrainNormals(this.geometry, this.triangleHeights);
        this.updateTriangleHeightBuffer();
        this.updateTerrainNormalBuffer();
        this.createBuffers(this.geometry);
    }

    calculateTriangleHeights(geometry, params) {
        const numVertices = geometry.positions.length / 3;
        const heights = new Float32Array(numVertices);
        
        
        for (let i = 0; i < numVertices; i++) {
            const x = geometry.positions[i * 3];
            const y = geometry.positions[i * 3 + 1];
            const z = geometry.positions[i * 3 + 2];
            
            const noiseVal = this.noiseGenerator.get3DNoise(x, y, z, params);
            heights[i] = noiseVal + (this.manualOffsets ? this.manualOffsets[i] : 0);
        }
        
        return heights;
    }

    calculateTerrainNormals(geometry, heights) {
        const numVertices = geometry.positions.length / 3;
        const normals = new Float32Array(numVertices * 3);
        const normalCounts = new Uint32Array(numVertices);
        
        // Para cada triângulo, calcular a normal da face e acumular nos vértices
        for (let i = 0; i < geometry.indices.length; i += 3) {
            const i0 = geometry.indices[i];
            const i1 = geometry.indices[i + 1];
            const i2 = geometry.indices[i + 2];
            
            // Posições deslocadas (posição + height * posição para deslocamento radial)
            const h0 = 1.0 + heights[i0];
            const h1 = 1.0 + heights[i1];
            const h2 = 1.0 + heights[i2];
            
            const v0x = geometry.positions[i0 * 3] * h0;
            const v0y = geometry.positions[i0 * 3 + 1] * h0;
            const v0z = geometry.positions[i0 * 3 + 2] * h0;
            
            const v1x = geometry.positions[i1 * 3] * h1;
            const v1y = geometry.positions[i1 * 3 + 1] * h1;
            const v1z = geometry.positions[i1 * 3 + 2] * h1;
            
            const v2x = geometry.positions[i2 * 3] * h2;
            const v2y = geometry.positions[i2 * 3 + 1] * h2;
            const v2z = geometry.positions[i2 * 3 + 2] * h2;
            
            // Vetores das arestas
            const e1x = v1x - v0x;
            const e1y = v1y - v0y;
            const e1z = v1z - v0z;
            
            const e2x = v2x - v0x;
            const e2y = v2y - v0y;
            const e2z = v2z - v0z;
            
            // Produto vetorial para normal da face
            const nx = e1y * e2z - e1z * e2y;
            const ny = e1z * e2x - e1x * e2z;
            const nz = e1x * e2y - e1y * e2x;
            
            // Acumular nos vértices
            normals[i0 * 3] += nx;
            normals[i0 * 3 + 1] += ny;
            normals[i0 * 3 + 2] += nz;
            normalCounts[i0]++;
            
            normals[i1 * 3] += nx;
            normals[i1 * 3 + 1] += ny;
            normals[i1 * 3 + 2] += nz;
            normalCounts[i1]++;
            
            normals[i2 * 3] += nx;
            normals[i2 * 3 + 1] += ny;
            normals[i2 * 3 + 2] += nz;
            normalCounts[i2]++;
        }
        
        // Normalizar
        for (let i = 0; i < numVertices; i++) {
            const x = normals[i * 3];
            const y = normals[i * 3 + 1];
            const z = normals[i * 3 + 2];
            const len = Math.sqrt(x * x + y * y + z * z);
            if (len > 0) {
                normals[i * 3] = x / len;
                normals[i * 3 + 1] = y / len;
                normals[i * 3 + 2] = z / len;
            }
        }
        
        return normals;
    }

    getTerrainHeightAtPosition(x, y, z, terrainDisplacement) {
        const len = Math.sqrt(x*x + y*y + z*z);
        if (len === 0) return 1.0;
        
        const nx = x / len;
        const ny = y / len;
        const nz = z / len;
        
        const noiseHeight = this.noiseGenerator.get3DNoise(nx, ny, nz, this.noiseParams);
        
        return 1.0 + (noiseHeight * terrainDisplacement);
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

    setNumActiveLayers(num) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform1i(this.uniformLocations['u_numActiveLayers'], num);
    }

    setLayerLevels(layers) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform1f(this.uniformLocations['u_layer0Level'], layers.layer0Level);
        gl.uniform1f(this.uniformLocations['u_layer1Level'], layers.layer1Level);
        gl.uniform1f(this.uniformLocations['u_layer2Level'], layers.layer2Level);
        gl.uniform1f(this.uniformLocations['u_layer3Level'], layers.layer3Level);
        gl.uniform1f(this.uniformLocations['u_layer4Level'], layers.layer4Level);
        gl.uniform1f(this.uniformLocations['u_layer5Level'], layers.layer5Level);
        gl.uniform1f(this.uniformLocations['u_layer6Level'], layers.layer6Level);
        gl.uniform1f(this.uniformLocations['u_layer7Level'], layers.layer7Level);
        gl.uniform1f(this.uniformLocations['u_layer8Level'], layers.layer8Level);
        gl.uniform1f(this.uniformLocations['u_layer9Level'], layers.layer9Level);
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

    // setCloudWarpIntensity(intensity){
    //     this.gl.useProgram(this.program);
    //     this.gl.uniform1f(this.uniformLocations['u_cloudWarpIntensity'], intensity);
    // }

    // setCloudWarpTime(time){
    //     this.gl.useProgram(this.program);
    //     this.gl.uniform1f(this.uniformLocations['u_cloudWarpTime'], time);
    // }

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

    setWaterColor(color){
        this.gl.useProgram(this.program);
        this.gl.uniform3fv(this.uniformLocations['u_waterColor'], color);
    }

    setWaterOpacity(opacity){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_waterOpacity'], opacity);
    }

    setShowWaves(show){
        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.uniformLocations['u_showWaves'], show);
    }

    setSlopeColor(color){
        this.gl.useProgram(this.program);
        this.gl.uniform3fv(this.uniformLocations['u_slopeColor'], color);
    }

    setSlopeThreshold(threshold){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_slopeThreshold'], threshold);
    }

    setSlopeBlend(blend){
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniformLocations['u_slopeBlend'], blend);
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

    renderStars(viewProjectionMatrix) {
        const gl = this.gl;
        
        if (!this.starVAO) return;
        
        gl.useProgram(this.starProgram);
        gl.bindVertexArray(this.starVAO);
        
        gl.depthMask(false);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        
        gl.uniformMatrix4fv(this.starViewProjectionLoc, false, viewProjectionMatrix);
        gl.drawArrays(gl.POINTS, 0, this.starCount);
        
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        
        gl.bindVertexArray(null);
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
        
        //const modelMatrix = mat4.create();
        const modelMatrix = this.matrixCache.model;
        mat4.identity(modelMatrix);
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
        
        //const mvpMatrix = mat4.create();
        const mvpMatrix = this.matrixCache.mvp;
        mat4.multiply(mvpMatrix, this.currentViewProjection, modelMatrix);
        
        gl.bindVertexArray(obj.vao);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, obj.texture);
        gl.uniform1i(this.uniformLocations['u_objectTexture'], 3);
        
        // const objectParams = {
        //     matrix: mvpMatrix,
        //     modelMatrix: modelMatrix,
        //     time: time,
        //     renderPass: 4.0,
        //     useColor: !obj.texture,
        //     color: obj.color || [0.8, 0.8, 0.8],
        //     lambertianDiffuse: params.lambertianDiffuse
        // };
        
        // this.updateUniforms(objectParams);

        gl.uniformMatrix4fv(this.uniformLocations['u_matrix'], false, mvpMatrix);
        gl.uniformMatrix4fv(this.uniformLocations['u_modelMatrix'], false, modelMatrix);
        
        gl.uniform1f(this.uniformLocations['u_time'], time);
        gl.uniform1f(this.uniformLocations['u_renderPass'], 4.0);

        gl.uniform1i(this.uniformLocations['u_useColor'], !obj.texture ? 1 : 0);
        gl.uniform1i(this.uniformLocations['u_useLambertianDiffuse'], params.lambertianDiffuse ? 1 : 0);
        
        const c = obj.color || [0.8, 0.8, 0.8];
        gl.uniform3f(this.uniformLocations['u_color'], c[0], c[1], c[2]);
        
        gl.drawElements(gl.TRIANGLES, obj.indexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    getObjectModelMatrix(obj, time, params) {
        //const modelMatrix = mat4.create();
        const modelMatrix = this.matrixCache.model;
        mat4.identity(modelMatrix);
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
        
        //const lightViewMatrix = mat4.create();
        const lightViewMatrix = this.matrixCache.lightView;
        mat4.identity(lightViewMatrix); 
        mat4.lookAt(lightViewMatrix, lightPos, [0, 0, 0], [0, 1, 0]);

        if (planetRotationMatrix) {
            mat4.multiply(lightViewMatrix, lightViewMatrix, planetRotationMatrix);
        }
        
        const orthoSize = 3.0 * planetScale;
        //const lightProjectionMatrix = mat4.create();
        const lightProjectionMatrix = this.matrixCache.lightProjection;
        mat4.identity(lightProjectionMatrix);
        mat4.orthogonal(
            lightProjectionMatrix,
            -orthoSize, orthoSize,    // left, right
            -orthoSize, orthoSize,    // bottom, top
            0.1, 20.0                  // near, far
        );
        
        //const lightSpaceMatrix = mat4.create();
        const lightSpaceMatrix = this.matrixCache.lightSpace;
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

        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.shadowProgram, 'u_lightSpaceMatrix'),
            false, lightSpaceMatrix
        );
        
        this.objects.forEach(obj => {
            const modelMatrix = this.getObjectModelMatrix(obj, time, params);

            if (obj.rotateWithPlanet && planetRotationMatrix) {
                const rotatedModel = mat4.create();
                //const rotatedModel = this.matrixCache.model;
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
            
            // gl.uniformMatrix4fv(
            //     gl.getUniformLocation(this.shadowProgram, 'u_lightSpaceMatrix'),
            //     false, lightSpaceMatrix
            // );
            // gl.uniformMatrix4fv(
            //     gl.getUniformLocation(this.shadowProgram, 'u_modelMatrix'),
            //     false, modelMatrix
            // );
            
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
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_INT, 0);

        if (wireframe) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(1, 1);
            this.setUseColor(true);
            this.setColor(0.0, 0.0, 0.0);

            gl.bindVertexArray(this.vaoLines);
            gl.drawElements(gl.LINES, this.numElementsLines, gl.UNSIGNED_INT, 0);

            gl.disable(gl.POLYGON_OFFSET_FILL);
            this.setUseColor(false);
        }
    }

    drawCloudsPass(cloudParams) {
        const gl = this.gl;

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
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_INT, 0);

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
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_INT, 0);

        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
    }

    drawWaterPass(waterParams) {
        const gl = this.gl;

        this.setRenderPass(5);
        this.updateUniforms(waterParams);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);

        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_INT, 0);

        gl.depthMask(true);
        gl.disable(gl.BLEND);
    }

    render(time, cameraPos, params, wireframe=true, lambertianDiffuse=true, autoRotate=false, renderPass, planetRotationMatrix=null, rimLight, showWaves, showStars) {
        const gl = this.gl;
        
        const modelMatrix       = this.matrixCache.model;
        const viewMatrix        = this.matrixCache.view;
        const projectionMatrix  = this.matrixCache.projection;
        const mvpMatrix         = this.matrixCache.mvp;
        const viewProjectionMatrix = this.matrixCache.viewProjection;

        mat4.identity(modelMatrix);// Isso aqui faz com que a matriz modelo fique na origem do mundo 

        if (planetRotationMatrix) { mat4.multiply(modelMatrix, modelMatrix, planetRotationMatrix); }
        if (autoRotate) { mat4.rotateY(modelMatrix, modelMatrix, time * -0.1); } // AUTO ROTACIONA

        mat4.scale(modelMatrix, modelMatrix, [params.planetScale, params.planetScale, params.planetScale]); // Escala o planeta de acordo com o valor passado
        mat4.lookAt(viewMatrix, [cameraPos.x, cameraPos.y, cameraPos.z], [0, 0, 0], [0, 1, 0]); // Isso aqui passa os valores da camera: pos, origem do mundo que ela vai olhar, up vector

        mat4.perspective(projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100.0); // Adiciona ilusao de profundidade, basicamente transforma de 3D para 2D para "caber" na tela
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix); // Combina tudo em uma so coisa. ViewMatrix vira relativo a projection aqui e depois a projection vira 2D com profundidade                                    
        this.currentViewProjection = viewProjectionMatrix;                                                   
        mat4.multiply(mvpMatrix, viewProjectionMatrix, modelMatrix); // Agora a mvpMatrix tem tudo junto

        if (showStars)
            this.renderStars(viewProjectionMatrix);

        gl.useProgram(this.program);

        const frameParams = {
            time: time,
            matrix: mvpMatrix,              
            lambertianDiffuse: lambertianDiffuse,
            showRim: rimLight,
            useColor: false,
            noiseTexture: 0,                
            cloudTexture: 1,
            viewPosition: [cameraPos.x, cameraPos.y, cameraPos.z],
            modelMatrix: modelMatrix,              
            showWaves: showWaves,
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
            this.drawPlanetPass(params, wireframe, showWaves);
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

        if (renderPass === 4) {
            return
        }

        if (renderPass === 5){
            this.drawWaterPass(params)
        }
        
    }

    applyBrush(point, radius, strength, mode = 'add') {
        // point: vetor [x, y, z] normalizado onde o raio bateu na esfera
        // radius: tamanho do pincel (em coordenadas normalizadas, ex: 0.1)
        // strength: força da deformação (ex: 0.05 para subir, -0.05 para descer)
        
        const positions = this.geometry.positions;
        const numVertices = positions.length / 3;
        let modified = false;

        // Loop simples (pode ser otimizado depois com Octree)
        for (let i = 0; i < numVertices; i++) {
            const px = positions[i * 3];
            const py = positions[i * 3 + 1];
            const pz = positions[i * 3 + 2];

            // Calcula a distância entre o vértice atual e o ponto do clique
            // Como estamos na esfera unitária, distância euclidiana funciona bem
            const dist = Math.sqrt(
                (px - point[0])**2 + 
                (py - point[1])**2 + 
                (pz - point[2])**2
            );

            if (dist < radius) {
                // Cálculo de Falloff (suavização)
                // O centro do pincel é forte, as bordas são fracas
                // Usando uma curva cosseno ou linear simples:
                const falloff = 0.5 * (1 + Math.cos(Math.PI * dist / radius)); 
                
                // Aplica a modificação
                this.manualOffsets[i] += strength * falloff;
                modified = true;
            }
        }

        if (modified) {
            this.updateTerrainGeometry();
        }
    }

    updateTerrainGeometry() {
        // 1. Recalcula alturas combinando Noise + ManualOffsets
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, this.noiseParams);
        
        // 2. Recalcula as normais baseadas na nova topologia
        // (Sua função calculateTerrainNormals já existe e parece correta para isso)
        this.terrainNormals = this.calculateTerrainNormals(this.geometry, this.triangleHeights);
        
        // 3. Envia os novos dados para a GPU
        this.updateTriangleHeightBuffer();
        this.updateTerrainNormalBuffer();
    }
}



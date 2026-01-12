import { vertexShaderSource } from './shaders/vertex.glsl.js';
import { fragmentShaderSource } from './shaders/fragment.glsl.js';
import { createIcosphere } from '../geometry/geometry.js';
import { mat4 } from '../utils/math.js';
import { NoiseGenerator } from '../Noise/noise.js';
import { textureManager } from './textures.js';
import { createShader, createProgram } from './webgl.js';

export class Renderer {
    constructor(canvas, noiseParams) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        this.uniformLocations = {};
        this.objects = [];
        this.currentViewProjection = mat4.create();
        
        if (!this.gl) {
            console.error('WebGL2 not supported.');
            return;
        }

        textureManager.init(this.gl);

        this.initializeWebGL();
        this.createShaderProgram();
        this.getLocations();
        this.initializeGeometry(noiseParams.subdivisions);
        this.initializeNoise(noiseParams);
        this.createBuffers(this.geometry);
        this.createNoiseTexture(noiseParams);
        
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
        const vs = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        const fs = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = createProgram(this.gl, vs, fs);
    }

    getLocations() {
        const gl = this.gl;
        this.positionLoc = gl.getAttribLocation(this.program, 'a_position');
        this.normalLoc   = gl.getAttribLocation(this.program, 'a_normal');
        this.uvLoc       = gl.getAttribLocation(this.program, 'a_texcoord');
        this.triangleHeightLoc = gl.getAttribLocation(this.program, 'a_triangleHeight');
        
        const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const activeUniform = gl.getActiveUniform(this.program, i);
            this.uniformLocations[activeUniform.name] = gl.getUniformLocation(this.program, activeUniform.name);
        }
    }

    updateUniforms(params) {
        const gl = this.gl;
        for (const [key, value] of Object.entries(params)) {
            const uniformName = `u_${key}`;
            const location = this.uniformLocations[uniformName];

            if (location) {
                if (typeof value === 'number') {
                    gl.uniform1f(location, value);
                } else if (typeof value === 'boolean') {
                    gl.uniform1i(location, value ? 1 : 0);
                } else if (Array.isArray(value) && value.length === 3) {
                    gl.uniform3fv(location, value);
                } else if (value instanceof Float32Array && value.length === 16) {
                    gl.uniformMatrix4fv(location, false, value);
                }
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
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
        this.noiseGenerator = new NoiseGenerator(512, 512, null, noiseParams.noiseType);
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, noiseParams);
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

    createNoiseTexture(params) {
        const { octaves, persistence, lacunarity, noiseZoom, noiseResolution } = params;
        
        if (this.noiseGenerator.width !== noiseResolution) {
             this.noiseGenerator.width = noiseResolution;
             this.noiseGenerator.height = noiseResolution;
        }

        const noiseData = this.noiseGenerator.generate({octaves, persistence, lacunarity, noiseZoom});
        
        this.noiseTexture = textureManager.createDataTexture('noise', noiseData, noiseResolution, noiseResolution);
    }

    regenerateTerrain(params) {
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, params);
        
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleHeightBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.triangleHeights);
        
        this.createNoiseTexture(params);
    }
    
    regenerateIcosphere(subdivisions, noiseParams) {
        this.initializeGeometry(subdivisions);
        this.triangleHeights = this.calculateTriangleHeights(this.geometry, noiseParams);
        this.createBuffers(this.geometry);
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
        
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        this.bindAttribute(posBuffer, this.positionLoc, 3);
        this.bindAttribute(normalBuffer, this.normalLoc, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindVertexArray(null);
        
        const obj = {
            vao,
            indexCount: geometry.indices.length,
            position,
            scale,
            rotation: [0, 0, 0],
            color: [1, 1, 1]
        };
        
        this.objects.push(obj);
        return obj;
    }

    renderObject(obj, time, params) {
        const gl = this.gl;
        const modelMatrix = mat4.create();
        
        mat4.translate(modelMatrix, modelMatrix, obj.position);
        mat4.rotateY(modelMatrix, modelMatrix, obj.rotation[1]);
        mat4.rotateX(modelMatrix, modelMatrix, obj.rotation[0]);
        mat4.rotateZ(modelMatrix, modelMatrix, obj.rotation[2]);
        mat4.scale(modelMatrix, modelMatrix, obj.scale);
        
        if (params.planetScale) {
            mat4.scale(modelMatrix, modelMatrix, [params.planetScale, params.planetScale, params.planetScale]);
        }
        
        const mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, this.currentViewProjection, modelMatrix);
        
        gl.bindVertexArray(obj.vao);
        
        const objectParams = {
            matrix: mvpMatrix,
            time: time,
            renderPass: 1.0,
            useColor: true,
            color: obj.color,
            lambertianDiffuse: params.showLambertianDiffuse
        };
        
        this.updateUniforms(objectParams);
        gl.drawElements(gl.TRIANGLES, obj.indexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    render(time, cameraPos, params, renderPass, planetRotationMatrix = null) {
        const gl = this.gl;
        gl.useProgram(this.program);

        const modelMatrix = mat4.create();
        const viewMatrix = mat4.create();
        const projectionMatrix = mat4.create();
        const mvpMatrix = mat4.create();

        mat4.identity(modelMatrix);
        if (planetRotationMatrix) {
            mat4.multiply(modelMatrix, modelMatrix, planetRotationMatrix);
        }
        
        if (params.autoRotate) { 
            mat4.rotateY(modelMatrix, modelMatrix, time * -0.1); 
        } 
        
        const pScale = params.planetScale || 1.0;
        mat4.scale(modelMatrix, modelMatrix, [pScale, pScale, pScale]);
        
        mat4.lookAt(viewMatrix, [cameraPos.x, cameraPos.y, cameraPos.z], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100.0);
        
        const viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
        this.currentViewProjection = viewProjectionMatrix;
        
        mat4.multiply(mvpMatrix, viewProjectionMatrix, modelMatrix);

        const frameParams = {
            time: time,
            matrix: mvpMatrix,
            modelMatrix: modelMatrix,
            viewPosition: [cameraPos.x, cameraPos.y, cameraPos.z],
            renderPass: renderPass,
            ...params
        };

        this.updateUniforms(frameParams);
        this.setNoiseTexture();

        if (renderPass === 2 || renderPass === 3) {
            gl.disable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);
            
            if (params.cloudTexture) { 
                this.setCloudTexture(params.cloudTexture); 
            } else {
                const tex = textureManager.get('cloud');
                if(tex) this.setCloudTexture(tex);
            }
        } else {
            gl.enable(gl.CULL_FACE);
            gl.disable(gl.BLEND);
            gl.depthMask(true);
        }

        // Icosfera
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.numElements, gl.UNSIGNED_SHORT, 0);

        // Wireframe
        if (renderPass === 1 && params.showWireframe) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(1, 1);
            
            this.updateUniforms({ useColor: true, color: [0,0,0] });
            
            gl.bindVertexArray(this.vaoLines);
            gl.drawElements(gl.LINES, this.numElementsLines, gl.UNSIGNED_SHORT, 0);
            
            gl.disable(gl.POLYGON_OFFSET_FILL);

            this.updateUniforms({ useColor: false });
        }
        
        if (renderPass === 2 || renderPass === 3) {
            gl.depthMask(true);
            gl.disable(gl.BLEND);
            gl.enable(gl.CULL_FACE);
        }
    }
}
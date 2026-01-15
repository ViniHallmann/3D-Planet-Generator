export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    
    // MOSTRA O ERRO DO SHADER
    const error = gl.getShaderInfoLog(shader);
    console.error("Shader compilation error:", error);
    console.error("Shader source:", source.substring(0, 200));
    gl.deleteShader(shader);
    return null;  // Retorna null explícito
}

export function createProgram(gl, vertexShader, fragmentShader) {
    // VERIFICA SE SHADERS SÃO VÁLIDOS
    if (!vertexShader || !fragmentShader) {
        console.error("Cannot create program: shader is null/undefined", 
                      {vertexShader, fragmentShader});
        return null;
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}
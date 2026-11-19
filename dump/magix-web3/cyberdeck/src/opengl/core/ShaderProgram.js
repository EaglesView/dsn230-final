/**
 * ShaderProgram - Handles shader compilation, linking, and uniform management
 */
export class ShaderProgram {
    constructor(gl, vertexSource, fragmentSource) {
        this.gl = gl;
        this.program = null;
        this.uniforms = {};
        this.attributes = {};

        this.compile(vertexSource, fragmentSource);
    }

    /**
     * Compile shader source code
     */
    compileShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        // Check compilation status
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader) || 'Unknown error';
            const shaderType = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
            console.error(`Error compiling ${shaderType} shader:`, info);
            console.error('Shader source:', source);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation failed: ${info}`);
        }

        return shader;
    }

    /**
     * Compile and link vertex and fragment shaders
     */
    compile(vertexSource, fragmentSource) {
        const gl = this.gl;

        // Compile shaders
        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        // Check link status
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(this.program);
            console.error('Error linking program:', info);
            throw new Error(`Program linking failed: ${info}`);
        }

        // Clean up shaders (no longer needed after linking)
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        // Cache uniform and attribute locations
        this.cacheLocations();
    }

    /**
     * Cache uniform and attribute locations for faster access
     */
    cacheLocations() {
        const gl = this.gl;

        // Get number of uniforms
        const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const info = gl.getActiveUniform(this.program, i);
            const location = gl.getUniformLocation(this.program, info.name);
            this.uniforms[info.name] = location;
        }

        // Get number of attributes
        const attributeCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < attributeCount; i++) {
            const info = gl.getActiveAttrib(this.program, i);
            const location = gl.getAttribLocation(this.program, info.name);
            this.attributes[info.name] = location;
        }
    }

    /**
     * Use this shader program
     */
    use() {
        this.gl.useProgram(this.program);
    }

    /**
     * Set uniform values
     */
    setUniform1f(name, value) {
        const location = this.uniforms[name];
        if (location !== undefined && location !== null) {
            this.gl.uniform1f(location, value);
        }
    }

    setUniform2f(name, x, y) {
        const location = this.uniforms[name];
        if (location !== undefined && location !== null) {
            this.gl.uniform2f(location, x, y);
        }
    }

    setUniform3f(name, x, y, z) {
        const location = this.uniforms[name];
        if (location !== undefined && location !== null) {
            this.gl.uniform3f(location, x, y, z);
        }
    }

    setUniform4f(name, x, y, z, w) {
        const location = this.uniforms[name];
        if (location !== undefined && location !== null) {
            this.gl.uniform4f(location, x, y, z, w);
        }
    }

    setUniform1i(name, value) {
        const location = this.uniforms[name];
        if (location !== undefined && location !== null) {
            this.gl.uniform1i(location, value);
        }
    }

    setUniformMatrix4fv(name, matrix) {
        const location = this.uniforms[name];
        if (location !== undefined && location !== null) {
            this.gl.uniformMatrix4fv(location, false, matrix);
        }
    }

    /**
     * Enable vertex attribute
     */
    enableAttribute(name, size, type, normalized, stride, offset) {
        const location = this.attributes[name];
        if (location !== undefined && location !== -1) {
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        }
    }

    /**
     * Get attribute location
     */
    getAttributeLocation(name) {
        return this.attributes[name];
    }

    /**
     * Get uniform location
     */
    getUniformLocation(name) {
        return this.uniforms[name];
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
    }
}

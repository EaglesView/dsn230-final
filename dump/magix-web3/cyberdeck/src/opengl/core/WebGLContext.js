/**
 * WebGLContext - Manages WebGL 2.0 context initialization and state
 */
export class WebGLContext {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.init();
    }

    init() {
        // Try to get WebGL 2.0 context
        this.gl = this.canvas.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
        });

        if (!this.gl) {
            throw new Error('WebGL 2.0 not supported');
        }

        // Enable blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Set clear color (transparent)
        this.gl.clearColor(0, 0, 0, 0);
    }

    resize(width, height, pixelRatio = window.devicePixelRatio || 1) {
        // Set canvas size accounting for device pixel ratio
        this.canvas.width = width * pixelRatio;
        this.canvas.height = height * pixelRatio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        // Update viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    getContext() {
        return this.gl;
    }

    /**
     * Create a buffer for vertex data
     */
    createBuffer(data, usage = this.gl.STATIC_DRAW) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), usage);
        return buffer;
    }

    /**
     * Create a texture
     */
    createTexture(width, height) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Allocate texture storage
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );

        return texture;
    }

    /**
     * Create a framebuffer with attached texture
     */
    createFramebuffer(width, height) {
        const gl = this.gl;
        const framebuffer = gl.createFramebuffer();
        const texture = this.createTexture(width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        );

        // Check framebuffer is complete
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer is not complete');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { framebuffer, texture };
    }

    /**
     * Cleanup resources
     */
    dispose() {
        // WebGL resources are automatically cleaned up by the browser
        // We just need to clear our reference
        this.gl = null;
    }
}

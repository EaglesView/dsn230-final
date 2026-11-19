import { WebGLContext } from './WebGLContext.js';
import { ShaderProgram } from './ShaderProgram.js';
import { EffectQueue } from './EffectQueue.js';
import { ChromaticAberration } from '../effects/ChromaticAberration.js';
import { NoiseStatic } from '../effects/NoiseStatic.js';
import { BlockGlitch } from '../effects/BlockGlitch.js';
import { Displacement } from '../effects/Displacement.js';
import { Pixelation } from '../effects/Pixelation.js';
import { RGBSplit } from '../effects/RGBSplit.js';
import { VHSTracking } from '../effects/VHSTracking.js';

// Import shaders
import {
    vertexShader,
    chromaticShader,
    noiseShader,
    blockShader,
    displacementShader,
    pixelationShader,
    rgbSplitShader,
    vhsTrackingShader
} from '../shaders/index.js';

/**
 * GlitchRenderer - Main rendering engine for glitch effects
 */
export class GlitchRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = new WebGLContext(canvas);
        this.gl = this.context.getContext();

        // Effect queue
        this.effectQueue = new EffectQueue();

        // Shader programs
        this.shaders = {};

        // Geometry (fullscreen quad)
        this.quadBuffer = null;
        this.texCoordBuffer = null;

        // Animation
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.animationFrameId = null;

        this.init();
    }

    /**
     * Initialize renderer
     */
    init() {
        // Create shader programs
        this.shaders.chromatic = new ShaderProgram(this.gl, vertexShader, chromaticShader);
        this.shaders.noise = new ShaderProgram(this.gl, vertexShader, noiseShader);
        this.shaders.block = new ShaderProgram(this.gl, vertexShader, blockShader);
        this.shaders.displacement = new ShaderProgram(this.gl, vertexShader, displacementShader);
        this.shaders.pixelation = new ShaderProgram(this.gl, vertexShader, pixelationShader);
        this.shaders.rgbsplit = new ShaderProgram(this.gl, vertexShader, rgbSplitShader);
        this.shaders.vhs = new ShaderProgram(this.gl, vertexShader, vhsTrackingShader);

        // Create fullscreen quad
        this.createQuad();

        // Start render loop
        this.startRenderLoop();
    }

    /**
     * Create fullscreen quad geometry
     */
    createQuad() {
        // Vertex positions (clip space: -1 to 1)
        const positions = new Float32Array([
            -1.0, -1.0, // Bottom-left
            1.0, -1.0,  // Bottom-right
            -1.0, 1.0,  // Top-left
            1.0, 1.0,   // Top-right
        ]);

        // Texture coordinates (0 to 1)
        const texCoords = new Float32Array([
            0.0, 0.0, // Bottom-left
            1.0, 0.0, // Bottom-right
            0.0, 1.0, // Top-left
            1.0, 1.0, // Top-right
        ]);

        this.quadBuffer = this.context.createBuffer(positions);
        this.texCoordBuffer = this.context.createBuffer(texCoords);
    }

    /**
     * Resize canvas
     */
    resize(width, height) {
        this.context.resize(width, height);
    }

    /**
     * Start render loop
     */
    startRenderLoop() {
        const render = (time) => {
            this.render(time);
            this.animationFrameId = requestAnimationFrame(render);
        };
        this.animationFrameId = requestAnimationFrame(render);
    }

    /**
     * Stop render loop
     */
    stopRenderLoop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main render function
     */
    render(time) {
        const currentTime = time / 1000; // Convert to seconds
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update all effects
        this.effectQueue.update(deltaTime, currentTime);

        // Clear canvas
        this.context.clear();

        // Only render if there are active effects
        if (!this.effectQueue.hasActiveEffects()) {
            return;
        }

        // Get resolution
        const resolution = [this.canvas.width, this.canvas.height];

        // Render each active effect
        const activeEffects = this.effectQueue.getActiveEffects();

        activeEffects.forEach((effect) => {
            this.renderEffect(effect, currentTime, resolution);
        });
    }

    /**
     * Render a single effect
     */
    renderEffect(effect, time, resolution) {
        let shader;

        // Select appropriate shader based on effect type
        switch (effect.type) {
            case 'chromatic':
                shader = this.shaders.chromatic;
                break;
            case 'noise':
                shader = this.shaders.noise;
                break;
            case 'block':
                shader = this.shaders.block;
                break;
            case 'displacement':
                shader = this.shaders.displacement;
                break;
            case 'pixelation':
                shader = this.shaders.pixelation;
                break;
            case 'rgbsplit':
                shader = this.shaders.rgbsplit;
                break;
            case 'vhs':
                shader = this.shaders.vhs;
                break;
            default:
                return;
        }

        // Use shader
        shader.use();

        // Set up vertex attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
        shader.enableAttribute('a_position', 2, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        shader.enableAttribute('a_texCoord', 2, this.gl.FLOAT, false, 0, 0);

        // Set uniforms
        const uniforms = effect.getUniforms(time);
        shader.setUniform2f('u_resolution', resolution[0], resolution[1]);

        // Set all uniforms dynamically
        Object.keys(uniforms).forEach((key) => {
            const value = uniforms[key];

            if (key === 'u_resolution') {
                // Already set above
                return;
            }

            if (Array.isArray(value)) {
                // Handle array uniforms (vec2, vec3, vec4)
                if (value.length === 2) {
                    shader.setUniform2f(key, value[0], value[1]);
                } else if (value.length === 3) {
                    shader.setUniform3f(key, value[0], value[1], value[2]);
                } else if (value.length === 4) {
                    shader.setUniform4f(key, value[0], value[1], value[2], value[3]);
                }
            } else if (typeof value === 'number') {
                // Handle float uniforms
                shader.setUniform1f(key, value);
            }
        });

        // Draw quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    /**
     * Trigger a glitch effect
     * @param {Object} options - Effect configuration
     */
    triggerGlitch(options) {
        const {
            type = 'chromatic',
            target,
            duration = 500,
            strength = 0.8,
            color = '#F75049',
            easing = 'easeInOut',
        } = options;

        // Calculate target bounds
        const targetBounds = this.calculateTargetBounds(target);

        // Handle multiple effect types
        const types = Array.isArray(type) ? type : [type];

        types.forEach((effectType) => {
            // Get strength for this effect type
            const effectStrength = typeof strength === 'object'
                ? (strength[effectType] || 0.8)
                : strength;

            // Create effect instance
            let effect;
            const effectOptions = {
                duration,
                strength: effectStrength,
                color,
                targetBounds,
                easing,
            };

            // Merge custom effect parameters from options
            const mergedOptions = { ...effectOptions, ...options };

            switch (effectType) {
                case 'chromatic':
                    effect = new ChromaticAberration(mergedOptions);
                    break;
                case 'noise':
                    effect = new NoiseStatic(mergedOptions);
                    break;
                case 'block':
                    effect = new BlockGlitch(mergedOptions);
                    break;
                case 'displacement':
                    effect = new Displacement(mergedOptions);
                    break;
                case 'pixelation':
                    effect = new Pixelation(mergedOptions);
                    break;
                case 'rgbsplit':
                    effect = new RGBSplit(mergedOptions);
                    break;
                case 'vhs':
                    effect = new VHSTracking(mergedOptions);
                    break;
                default:
                    console.warn(`Unknown effect type: ${effectType}`);
                    return;
            }

            // Add to queue
            this.effectQueue.add(effect);
        });
    }

    /**
     * Calculate normalized bounds for a target element
     */
    calculateTargetBounds(target) {
        if (!target || !target.current) {
            // Default to fullscreen
            return { x: 0, y: 0, width: 1, height: 1 };
        }

        const element = target.current;
        const rect = element.getBoundingClientRect();
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;

        // Convert to normalized coordinates (0-1)
        // Note: WebGL origin is bottom-left, but DOM is top-left
        return {
            x: rect.left / canvasWidth,
            y: 1 - (rect.bottom / canvasHeight), // Flip Y axis
            width: rect.width / canvasWidth,
            height: rect.height / canvasHeight,
        };
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stopRenderLoop();
        this.effectQueue.dispose();

        // Dispose shaders
        Object.values(this.shaders).forEach((shader) => shader.dispose());

        // Dispose buffers
        if (this.quadBuffer) {
            this.gl.deleteBuffer(this.quadBuffer);
        }
        if (this.texCoordBuffer) {
            this.gl.deleteBuffer(this.texCoordBuffer);
        }

        this.context.dispose();
    }
}

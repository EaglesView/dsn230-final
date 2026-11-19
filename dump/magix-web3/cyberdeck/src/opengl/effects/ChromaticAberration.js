/**
 * ChromaticAberration - CRT Phosphor Glow effect controller
 */
export class ChromaticAberration {
    constructor(options = {}) {
        this.type = 'chromatic';
        this.duration = options.duration || 500; // milliseconds
        this.strength = options.strength || 0.8; // 0-1
        this.color = options.color || '#F75049'; // Primary color
        this.targetBounds = options.targetBounds || { x: 0, y: 0, width: 1, height: 1 };
        this.easing = options.easing || 'easeInOut';

        // CRT Phosphor Glow parameters
        this.phosphorSize = options.phosphorSize !== undefined ? options.phosphorSize : 3.0;
        this.phosphorSpacing = options.phosphorSpacing !== undefined ? options.phosphorSpacing : 1.2;
        this.bloomIntensity = options.bloomIntensity !== undefined ? options.bloomIntensity : 0.6;
        this.scanlineInteraction = options.scanlineInteraction !== undefined ? options.scanlineInteraction : 0.8;
        this.colorBleeding = options.colorBleeding !== undefined ? options.colorBleeding : 0.3;

        // Animation state
        this.elapsed = 0;
        this.currentStrength = 0;

        // Parse color
        this.colorVec = this.hexToRgb(this.color);
    }

    /**
     * Convert hex color to RGB vector (0-1 range)
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16) / 255,
                  g: parseInt(result[2], 16) / 255,
                  b: parseInt(result[3], 16) / 255,
              }
            : { r: 1, g: 0, b: 0 };
    }

    /**
     * Easing functions
     */
    ease(t) {
        switch (this.easing) {
            case 'linear':
                return t;
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return t * (2 - t);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'elastic':
                return t === 0 || t === 1
                    ? t
                    : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
            default:
                return t;
        }
    }

    /**
     * Update effect state
     */
    update(deltaTime, time) {
        this.elapsed += deltaTime * 1000; // Convert to milliseconds

        // Calculate progress (0-1)
        let progress = Math.min(this.elapsed / this.duration, 1);

        // Apply fade in and fade out
        if (progress < 0.2) {
            // Fade in (first 20%)
            progress = (progress / 0.2) * this.ease(progress / 0.2);
        } else if (progress > 0.8) {
            // Fade out (last 20%)
            const fadeOut = (1 - progress) / 0.2;
            progress = this.ease(fadeOut);
        } else {
            progress = 1;
        }

        // Update current strength
        this.currentStrength = this.strength * progress;
    }

    /**
     * Get uniform values for shader
     */
    getUniforms(time) {
        return {
            u_time: time,
            u_strength: this.currentStrength,
            u_color: [this.colorVec.r, this.colorVec.g, this.colorVec.b],
            u_targetBounds: [
                this.targetBounds.x,
                this.targetBounds.y,
                this.targetBounds.width,
                this.targetBounds.height,
            ],
            u_phosphorSize: this.phosphorSize,
            u_phosphorSpacing: this.phosphorSpacing,
            u_bloomIntensity: this.bloomIntensity,
            u_scanlineInteraction: this.scanlineInteraction,
            u_colorBleeding: this.colorBleeding,
        };
    }

    /**
     * Check if effect is complete
     */
    isComplete() {
        return this.elapsed >= this.duration;
    }

    /**
     * Cleanup
     */
    dispose() {
        // Nothing to cleanup for this effect
    }
}

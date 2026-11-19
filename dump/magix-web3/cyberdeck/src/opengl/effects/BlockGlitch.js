/**
 * BlockGlitch - Rectangular chunk shifting effect controller
 */
export class BlockGlitch {
    constructor(options = {}) {
        this.type = 'block';
        this.duration = options.duration || 500;
        this.strength = options.strength || 0.8;
        this.color = options.color || '#F75049';
        this.targetBounds = options.targetBounds || { x: 0, y: 0, width: 1, height: 1 };
        this.easing = options.easing || 'easeInOut';

        // Block glitch parameters
        this.blockCount = options.blockCount !== undefined ? options.blockCount : 15.0;
        this.displacementRange = options.displacementRange !== undefined ? options.displacementRange : 0.3;
        this.colorBarIntensity = options.colorBarIntensity !== undefined ? options.colorBarIntensity : 0.7;
        this.glitchProbability = options.glitchProbability !== undefined ? options.glitchProbability : 0.5;
        this.verticalShift = options.verticalShift !== undefined ? options.verticalShift : 0.5;

        // Animation state
        this.elapsed = 0;
        this.currentStrength = 0;

        // Parse color
        this.colorVec = this.hexToRgb(this.color);
    }

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

    update(deltaTime, time) {
        this.elapsed += deltaTime * 1000;

        let progress = Math.min(this.elapsed / this.duration, 1);

        // Apply fade in and fade out with sharp transitions for blocky effect
        if (progress < 0.1) {
            progress = this.ease(progress / 0.1);
        } else if (progress > 0.9) {
            const fadeOut = (1 - progress) / 0.1;
            progress = this.ease(fadeOut);
        } else {
            progress = 1;
        }

        // Add random intensity spikes for block effect
        const spike = Math.random() > 0.7 ? 1.2 : 1.0;
        this.currentStrength = Math.min(this.strength * progress * spike, 1.0);
    }

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
            u_blockCount: this.blockCount,
            u_displacementRange: this.displacementRange,
            u_colorBarIntensity: this.colorBarIntensity,
            u_glitchProbability: this.glitchProbability,
            u_verticalShift: this.verticalShift,
        };
    }

    isComplete() {
        return this.elapsed >= this.duration;
    }

    dispose() {
        // Nothing to cleanup
    }
}

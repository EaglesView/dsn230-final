/**
 * VHSTracking - VHS tape tracking error effect controller
 */
export class VHSTracking {
    constructor(options = {}) {
        this.type = 'vhs';
        this.duration = options.duration || 500;
        this.strength = options.strength || 0.8;
        this.color = options.color || '#F75049';
        this.targetBounds = options.targetBounds || { x: 0, y: 0, width: 1, height: 1 };
        this.easing = options.easing || 'easeInOut';

        // VHS tracking parameters
        this.trackingOffset = options.trackingOffset !== undefined ? options.trackingOffset : 0.1;
        this.noiseIntensity = options.noiseIntensity !== undefined ? options.noiseIntensity : 0.5;
        this.chromaBleed = options.chromaBleed !== undefined ? options.chromaBleed : 0.7;

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

        // Apply fade in and fade out
        if (progress < 0.2) {
            progress = (progress / 0.2) * this.ease(progress / 0.2);
        } else if (progress > 0.8) {
            const fadeOut = (1 - progress) / 0.2;
            progress = this.ease(fadeOut);
        } else {
            progress = 1;
        }

        // Add subtle variation to simulate analog instability
        const wobble = Math.sin(time * 8.0) * 0.1 + 0.9; // 0.8 to 1.0
        this.currentStrength = this.strength * progress * wobble;
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
            u_trackingOffset: this.trackingOffset,
            u_noiseIntensity: this.noiseIntensity,
            u_chromaBleed: this.chromaBleed,
        };
    }

    isComplete() {
        return this.elapsed >= this.duration;
    }

    dispose() {
        // Nothing to cleanup
    }
}

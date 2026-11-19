/**
 * EffectQueue - Manages active glitch effects and their lifecycles
 */
export class EffectQueue {
    constructor() {
        this.effects = new Map(); // Map of effect ID to effect instance
        this.nextId = 0;
    }

    /**
     * Add an effect to the queue
     * @param {Object} effect - Effect instance with update() and isComplete() methods
     * @returns {number} - Effect ID
     */
    add(effect) {
        const id = this.nextId++;
        this.effects.set(id, effect);
        return id;
    }

    /**
     * Remove an effect from the queue
     * @param {number} id - Effect ID
     */
    remove(id) {
        const effect = this.effects.get(id);
        if (effect && effect.dispose) {
            effect.dispose();
        }
        this.effects.delete(id);
    }

    /**
     * Update all active effects
     * @param {number} deltaTime - Time elapsed since last frame (seconds)
     * @param {number} time - Total elapsed time (seconds)
     */
    update(deltaTime, time) {
        const completedEffects = [];

        // Update each effect
        this.effects.forEach((effect, id) => {
            if (effect.update) {
                effect.update(deltaTime, time);
            }

            // Check if effect is complete
            if (effect.isComplete && effect.isComplete()) {
                completedEffects.push(id);
            }
        });

        // Remove completed effects
        completedEffects.forEach((id) => this.remove(id));
    }

    /**
     * Get all active effects
     * @returns {Array} - Array of effect instances
     */
    getActiveEffects() {
        return Array.from(this.effects.values());
    }

    /**
     * Get effects by type
     * @param {string} type - Effect type ('chromatic', 'noise', 'block', 'displacement')
     * @returns {Array} - Array of matching effects
     */
    getEffectsByType(type) {
        return this.getActiveEffects().filter((effect) => effect.type === type);
    }

    /**
     * Check if there are any active effects
     * @returns {boolean}
     */
    hasActiveEffects() {
        return this.effects.size > 0;
    }

    /**
     * Get number of active effects
     * @returns {number}
     */
    getCount() {
        return this.effects.size;
    }

    /**
     * Clear all effects
     */
    clear() {
        this.effects.forEach((effect) => {
            if (effect.dispose) {
                effect.dispose();
            }
        });
        this.effects.clear();
    }

    /**
     * Cleanup
     */
    dispose() {
        this.clear();
    }
}

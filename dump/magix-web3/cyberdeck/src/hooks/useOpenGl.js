import { useContext } from 'react';
import { GlitchContext } from '../contexts/GlitchContext';

/**
 * useOpenGl - Hook to access WebGL glitch effects
 *
 * @returns {Object} Object containing:
 *   - triggerGlitch: Function to trigger glitch effects
 *   - isReady: Boolean indicating if WebGL is ready
 *   - renderer: GlitchRenderer instance
 *
 * @example
 * const { triggerGlitch } = useOpenGl();
 *
 * // Single effect
 * triggerGlitch({
 *   type: 'chromatic',
 *   target: elementRef,
 *   duration: 500,
 *   strength: 0.8,
 *   color: '#F75049'
 * });
 *
 * // Multiple effects
 * triggerGlitch({
 *   type: ['chromatic', 'noise', 'block'],
 *   target: elementRef,
 *   duration: 500,
 *   strength: { chromatic: 0.5, noise: 0.8, block: 0.6 }
 * });
 */
export const useOpenGl = () => {
    const context = useContext(GlitchContext);

    if (!context) {
        throw new Error('useOpenGl must be used within a GlitchProvider');
    }

    return context;
};

export default useOpenGl;

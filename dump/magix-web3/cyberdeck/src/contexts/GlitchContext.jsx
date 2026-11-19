import { createContext, useEffect, useRef, useState } from 'react';
import { GlitchRenderer } from '../opengl/core/GlitchRenderer';
import { useSettings } from '../hooks/useSetting';

export const GlitchContext = createContext(null);

/**
 * GlitchProvider - Provides WebGL glitch effects to the entire app
 */
export const GlitchProvider = ({ children }) => {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const { settings } = useSettings();
    useEffect(() => {
        if (!canvasRef.current) return;

        // Skip if already initialized (React Strict Mode causes double-mounting)
        if (rendererRef.current) return;

        let renderer = null;

        try {
            // Initialize renderer
            renderer = new GlitchRenderer(canvasRef.current);
            rendererRef.current = renderer;

            // Handle window resize
            const handleResize = () => {
                if (renderer) {
                    renderer.resize(window.innerWidth, window.innerHeight);
                }
            };

            // Initial resize
            handleResize();

            // Add resize listener
            window.addEventListener('resize', handleResize);

            setIsReady(true);

            // Cleanup
            return () => {
                window.removeEventListener('resize', handleResize);
                if (renderer) {
                    renderer.dispose();
                }
                rendererRef.current = null;
                setIsReady(false);
            };
        } catch (error) {
            console.error('Failed to initialize WebGL glitch effects:', error);
            if (renderer) {
                renderer.dispose();
            }
            rendererRef.current = null;
        }
    }, []);

    /**
     * Trigger a glitch effect
     */
    const triggerGlitch = (options) => {
        if (!rendererRef.current) {
            console.warn('GlitchRenderer not initialized');
            return;
        }

        rendererRef.current.triggerGlitch(options);
    };

    const value = {
        triggerGlitch,
        isReady,
        renderer: rendererRef.current,
    };

    return (
        <GlitchContext.Provider value={value}>
            {/* Fullscreen canvas overlay */}
            {settings.general.glitchEffects && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none', // Allow clicks to pass through
                        zIndex: 9999, // On top of everything
                    }}
                />
            )}

            {children}
        </GlitchContext.Provider>
    );
};

export default GlitchProvider;

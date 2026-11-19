# Glitch Effects Guide

Comprehensive guide to all WebGL glitch effects in the Cyberdeck project.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Effect Reference](#effect-reference)
   - [Chromatic (CRT Phosphor Glow)](#chromatic-crt-phosphor-glow)
   - [Noise Static](#noise-static)
   - [Block Glitch](#block-glitch)
   - [Displacement](#displacement)
   - [Pixelation](#pixelation)
   - [RGB Split](#rgb-split)
   - [VHS Tracking](#vhs-tracking)
4. [Advanced Usage](#advanced-usage)
5. [Performance Considerations](#performance-considerations)
6. [Best Practices](#best-practices)

---

## Overview

The glitch effects system provides 7 distinct WebGL-powered visual effects that can be triggered programmatically or in response to user interactions. All effects are:

- **GPU-accelerated** using WebGL 2.0
- **Highly customizable** with multiple parameters per effect
- **Target-aware** - can be applied to specific UI elements or fullscreen
- **Performance-optimized** with automatic cleanup and resource management

### Available Effects

| Effect | Type | Best For | Intensity |
|--------|------|----------|-----------|
| `chromatic` | CRT Phosphor Glow | Retro CRT displays, authenticity | Medium |
| `noise` | Digital Static | TV interference, corruption | High |
| `block` | Horizontal Glitches | Data corruption, system errors | High |
| `displacement` | Wave Distortion | Signal interference, instability | Medium |
| `pixelation` | Mosaic Effect | Resolution degradation, retro | Low |
| `rgbsplit` | Color Separation | Analog video artifacts | Medium |
| `vhs` | VHS Tape Tracking | Vintage video, analog nostalgia | High |

---

## Getting Started

### Basic Usage

```javascript
import { useOpenGl } from '@/hooks/useOpenGl';

function MyComponent() {
    const { triggerGlitch } = useOpenGl();

    const handleClick = () => {
        // Trigger a basic glitch effect
        triggerGlitch({
            type: 'chromatic',
            duration: 500,
            strength: 0.8
        });
    };

    return <button onClick={handleClick}>Glitch Me!</button>;
}
```

### Common Parameters

All effects share these base parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string \| string[] | `'chromatic'` | Effect type(s) to trigger |
| `target` | React.RefObject \| null | `null` | Target element (null = fullscreen) |
| `duration` | number | `500` | Effect duration in milliseconds |
| `strength` | number \| object | `0.8` | Effect intensity (0-1) |
| `color` | string | `'#F75049'` | Primary color (hex format) |
| `easing` | string | `'easeInOut'` | Animation easing function |

#### Easing Functions

- `linear` - Constant speed
- `easeIn` - Slow start, fast end
- `easeOut` - Fast start, slow end
- `easeInOut` - Slow start and end
- `elastic` - Bounce effect

---

## Effect Reference

### Chromatic (CRT Phosphor Glow)

**Type:** `'chromatic'`

Simulates a CRT monitor's phosphor dot display with RGB subpixels, scanlines, and bloom effects.

#### Visual Characteristics

- RGB phosphor dots in a grid pattern
- Animated scanlines
- Phosphor bloom/glow
- Subtle flicker for authenticity
- Color bleeding between pixels

#### Custom Parameters

```javascript
triggerGlitch({
    type: 'chromatic',
    phosphorSize: 3.0,           // Size of phosphor dots (1-10)
    phosphorSpacing: 1.2,        // Spacing between dots (0.5-2.0)
    bloomIntensity: 0.6,         // Glow around phosphors (0-1)
    scanlineInteraction: 0.8,    // Scanline brightness boost (0-1)
    colorBleeding: 0.3           // Color bleed between pixels (0-1)
});
```

#### Parameter Guide

**phosphorSize** (default: 3.0)
- Smaller (1-2): Fine, high-res CRT
- Medium (3-5): Standard CRT monitor
- Larger (6-10): Large vintage display

**phosphorSpacing** (default: 1.2)
- Tight (0.5-1.0): Dense pixel grid
- Normal (1.0-1.5): Realistic spacing
- Wide (1.5-2.0): Visible gaps

**bloomIntensity** (default: 0.6)
- Low (0-0.3): Sharp, modern CRT
- Medium (0.4-0.7): Classic glow
- High (0.8-1.0): Heavy bloom, vintage

**scanlineInteraction** (default: 0.8)
- None (0): No scanline effect
- Subtle (0.3-0.6): Modern display
- Strong (0.7-1.0): Prominent scanlines

**colorBleeding** (default: 0.3)
- Minimal (0-0.2): Sharp colors
- Moderate (0.3-0.5): Realistic bleed
- Heavy (0.6-1.0): Analog-style bleeding

#### Usage Examples

```javascript
// Subtle high-res CRT effect
triggerGlitch({
    type: 'chromatic',
    duration: 1000,
    strength: 0.6,
    phosphorSize: 2.0,
    bloomIntensity: 0.3,
    scanlineInteraction: 0.5
});

// Heavy vintage CRT with bloom
triggerGlitch({
    type: 'chromatic',
    duration: 800,
    strength: 0.9,
    phosphorSize: 5.0,
    bloomIntensity: 0.9,
    colorBleeding: 0.6
});
```

---

### Noise Static

**Type:** `'noise'`

Digital TV static with multi-layered procedural noise, random spikes, and scanline interference.

#### Visual Characteristics

- Multi-scale noise layers
- Digital block artifacts
- Random intensity spikes
- Animated scanline interference
- Flickering at 30fps

#### Custom Parameters

```javascript
triggerGlitch({
    type: 'noise',
    grainSize: 10.0,         // Noise grain scale (1-50)
    blockSize: 50.0,         // Digital block size in pixels (10-200)
    spikeFrequency: 0.05,    // Probability of intensity spikes (0-1)
    scanlineSpeed: 5.0,      // Speed of scanline movement (0-20)
    interference: 0.1        // Scanline interference intensity (0-1)
});
```

#### Parameter Guide

**grainSize** (default: 10.0)
- Fine (1-5): High-frequency noise
- Medium (6-15): Standard TV static
- Coarse (16-50): Large grain noise

**blockSize** (default: 50.0)
- Small (10-30): Digital pixelation
- Medium (40-80): Block artifacts
- Large (100-200): Chunky corruption

**spikeFrequency** (default: 0.05)
- Rare (0-0.03): Occasional flashes
- Normal (0.04-0.10): Regular spikes
- Frequent (0.11-0.30): Constant flashing

**scanlineSpeed** (default: 5.0)
- Slow (0-3): Gentle roll
- Medium (4-8): Standard speed
- Fast (9-20): Rapid interference

**interference** (default: 0.1)
- Subtle (0-0.15): Light scanlines
- Medium (0.16-0.30): Visible patterns
- Strong (0.31-1.0): Heavy interference

#### Usage Examples

```javascript
// Subtle static overlay
triggerGlitch({
    type: 'noise',
    duration: 600,
    strength: 0.5,
    grainSize: 8.0,
    spikeFrequency: 0.03,
    interference: 0.08
});

// Heavy corruption with spikes
triggerGlitch({
    type: 'noise',
    duration: 1000,
    strength: 0.95,
    grainSize: 15.0,
    blockSize: 80.0,
    spikeFrequency: 0.2
});
```

---

### Block Glitch

**Type:** `'block'`

Horizontal block displacement with color bars, simulating digital corruption and data errors.

#### Visual Characteristics

- Horizontal block divisions
- Random horizontal displacement
- RGB color bars in glitched blocks
- Vertical shifting
- Sharp, digital appearance

#### Custom Parameters

```javascript
triggerGlitch({
    type: 'block',
    blockCount: 15.0,           // Number of horizontal blocks (5-50)
    displacementRange: 0.3,     // Horizontal shift amount (0-1)
    colorBarIntensity: 0.7,     // Color bar brightness (0-1)
    glitchProbability: 0.5,     // Probability of block glitching (0-1)
    verticalShift: 0.5          // Vertical displacement amount (0-1)
});
```

#### Parameter Guide

**blockCount** (default: 15.0)
- Few (5-10): Large chunks
- Medium (11-20): Standard blocks
- Many (21-50): Fine slices

**displacementRange** (default: 0.3)
- Subtle (0-0.15): Minor shifts
- Medium (0.16-0.40): Noticeable offset
- Extreme (0.41-1.0): Large displacement

**colorBarIntensity** (default: 0.7)
- Dim (0-0.4): Subtle colors
- Medium (0.5-0.8): Clear bars
- Bright (0.9-1.0): Vivid colors

**glitchProbability** (default: 0.5)
- Sparse (0-0.3): Few blocks affected
- Medium (0.4-0.6): Half blocks
- Dense (0.7-1.0): Most blocks glitched

**verticalShift** (default: 0.5)
- None (0): No vertical movement
- Subtle (0.1-0.4): Minor shifts
- Strong (0.5-1.0): Significant displacement

#### Usage Examples

```javascript
// Subtle data corruption
triggerGlitch({
    type: 'block',
    duration: 400,
    strength: 0.6,
    blockCount: 20.0,
    displacementRange: 0.15,
    glitchProbability: 0.3
});

// Severe system error
triggerGlitch({
    type: 'block',
    duration: 800,
    strength: 1.0,
    blockCount: 12.0,
    displacementRange: 0.5,
    colorBarIntensity: 0.9,
    glitchProbability: 0.8
});
```

---

### Displacement

**Type:** `'displacement'`

Wave-based distortion with tears and RGB splitting, simulating signal interference.

#### Visual Characteristics

- Sine wave distortions
- Horizontal "tear" effects
- Random jitter
- RGB channel split on displacement
- Pulsing intensity

#### Custom Parameters

```javascript
triggerGlitch({
    type: 'displacement',
    waveCount: 3.0,             // Wave frequency multiplier (0.5-10)
    waveSpeed: 5.0,             // Wave animation speed (0-20)
    tearProbability: 0.15,      // Probability of tears (0-1)
    jitterAmount: 0.05,         // Random jitter intensity (0-0.3)
    rgbSplitThreshold: 0.01     // Threshold for RGB split (0-0.1)
});
```

#### Parameter Guide

**waveCount** (default: 3.0)
- Low (0.5-2): Slow, broad waves
- Medium (2.5-5): Standard distortion
- High (6-10): Rapid oscillation

**waveSpeed** (default: 5.0)
- Slow (0-3): Gentle movement
- Medium (4-8): Standard speed
- Fast (9-20): Rapid distortion

**tearProbability** (default: 0.15)
- Rare (0-0.10): Few tears
- Normal (0.11-0.25): Regular tears
- Frequent (0.26-0.50): Many tears

**jitterAmount** (default: 0.05)
- Minimal (0-0.03): Slight noise
- Medium (0.04-0.10): Visible jitter
- Strong (0.11-0.30): Heavy shake

**rgbSplitThreshold** (default: 0.01)
- Tight (0-0.005): Only on heavy displacement
- Medium (0.006-0.02): Moderate split
- Loose (0.021-0.10): Split on any displacement

#### Usage Examples

```javascript
// Subtle signal interference
triggerGlitch({
    type: 'displacement',
    duration: 700,
    strength: 0.6,
    waveCount: 2.0,
    tearProbability: 0.1,
    jitterAmount: 0.03
});

// Severe distortion
triggerGlitch({
    type: 'displacement',
    duration: 1000,
    strength: 0.9,
    waveCount: 6.0,
    waveSpeed: 12.0,
    tearProbability: 0.3
});
```

---

### Pixelation

**Type:** `'pixelation'`

Mosaic/retro pixelation effect with color depth reduction and dithering.

#### Visual Characteristics

- Dynamic pixel grid
- Color quantization
- Ordered dithering (Bayer matrix)
- Pixel grid outline
- Random noise pixels

#### Custom Parameters

```javascript
triggerGlitch({
    type: 'pixelation',
    pixelSize: 8.0,         // Size of pixels (2-50)
    colorDepth: 8.0,        // Color levels per channel (2-256)
    dithering: 0.3          // Dithering intensity (0-1)
});
```

#### Parameter Guide

**pixelSize** (default: 8.0)
- Small (2-5): Subtle pixelation
- Medium (6-15): Retro game style
- Large (16-50): Heavy mosaic

**colorDepth** (default: 8.0)
- Low (2-4): Extreme posterization
- Medium (5-16): Retro color palette
- High (17-256): Subtle quantization

**dithering** (default: 0.3)
- None (0): Clean pixels
- Subtle (0.1-0.4): Light dithering
- Heavy (0.5-1.0): Strong pattern

#### Usage Examples

```javascript
// Retro 8-bit effect
triggerGlitch({
    type: 'pixelation',
    duration: 600,
    strength: 0.8,
    pixelSize: 12.0,
    colorDepth: 8.0,
    dithering: 0.4
});

// Heavy mosaic censorship
triggerGlitch({
    type: 'pixelation',
    duration: 1000,
    strength: 1.0,
    pixelSize: 30.0,
    colorDepth: 4.0,
    dithering: 0.2
});
```

---

### RGB Split

**Type:** `'rgbsplit'`

Classic RGB channel separation with wave modulation and scanline artifacts.

#### Visual Characteristics

- Red/green/blue channel offsets
- Directional control
- Wave-based modulation
- Scanline distortion
- Glitch artifacts on random lines

#### Custom Parameters

```javascript
triggerGlitch({
    type: 'rgbsplit',
    splitDistance: 0.02,    // Channel separation amount (0-0.1)
    angle: 0.0,             // Split direction in radians (0-6.28)
    waviness: 0.5           // Wave modulation intensity (0-1)
});
```

#### Parameter Guide

**splitDistance** (default: 0.02)
- Subtle (0-0.01): Minor separation
- Medium (0.015-0.04): Clear split
- Extreme (0.05-0.1): Heavy offset

**angle** (default: 0.0)
- Horizontal: `0` or `3.14` (π)
- Vertical: `1.57` (π/2) or `4.71` (3π/2)
- Diagonal: `0.785` (π/4), `2.356` (3π/4), etc.

**waviness** (default: 0.5)
- Static (0-0.2): Clean split
- Moderate (0.3-0.6): Wave distortion
- Heavy (0.7-1.0): Strong modulation

#### Usage Examples

```javascript
// Horizontal RGB shift
triggerGlitch({
    type: 'rgbsplit',
    duration: 500,
    strength: 0.7,
    splitDistance: 0.025,
    angle: 0,
    waviness: 0.3
});

// Diagonal wavy split
triggerGlitch({
    type: 'rgbsplit',
    duration: 800,
    strength: 0.9,
    splitDistance: 0.04,
    angle: 0.785,  // 45 degrees
    waviness: 0.8
});
```

---

### VHS Tracking

**Type:** `'vhs'`

Authentic VHS tape tracking errors with chroma bleed, dropouts, and noise.

#### Visual Characteristics

- Vertical rolling bands
- Horizontal sync issues
- Chroma bleeding
- Tracking error stripes
- VHS noise/static
- Tape dropouts
- Analog scanlines

#### Custom Parameters

```javascript
triggerGlitch({
    type: 'vhs',
    trackingOffset: 0.1,      // Tracking error intensity (0-0.5)
    noiseIntensity: 0.5,      // VHS noise amount (0-1)
    chromaBleed: 0.7          // Color bleeding intensity (0-1)
});
```

#### Parameter Guide

**trackingOffset** (default: 0.1)
- Minimal (0-0.05): Slight errors
- Medium (0.06-0.15): Noticeable tracking
- Severe (0.16-0.5): Heavy misalignment

**noiseIntensity** (default: 0.5)
- Clean (0-0.3): Modern tape
- Medium (0.4-0.6): Used tape
- Heavy (0.7-1.0): Degraded tape

**chromaBleed** (default: 0.7)
- Minimal (0-0.4): Sharp colors
- Medium (0.5-0.8): Typical VHS
- Heavy (0.9-1.0): Poor quality tape

#### Usage Examples

```javascript
// Subtle VHS aesthetic
triggerGlitch({
    type: 'vhs',
    duration: 1000,
    strength: 0.6,
    trackingOffset: 0.08,
    noiseIntensity: 0.4,
    chromaBleed: 0.6
});

// Severe tape damage
triggerGlitch({
    type: 'vhs',
    duration: 1500,
    strength: 0.95,
    trackingOffset: 0.25,
    noiseIntensity: 0.85,
    chromaBleed: 0.9
});
```

---

## Advanced Usage

### Multiple Effects

Trigger multiple effects simultaneously:

```javascript
triggerGlitch({
    type: ['noise', 'displacement', 'chromatic'],
    duration: 800,
    strength: {
        noise: 0.6,
        displacement: 0.8,
        chromatic: 0.5
    }
});
```

### Targeted Effects

Apply effects to specific elements:

```javascript
function MyComponent() {
    const elementRef = useRef(null);
    const { triggerGlitch } = useOpenGl();

    const handleClick = () => {
        triggerGlitch({
            type: 'block',
            target: elementRef,  // Only affects this element
            duration: 600,
            strength: 0.9
        });
    };

    return <div ref={elementRef}>Glitch this element</div>;
}
```

### Custom Easing Sequences

```javascript
// Elastic bounce
triggerGlitch({
    type: 'chromatic',
    easing: 'elastic',
    duration: 1000,
    strength: 0.7
});

// Quick pop
triggerGlitch({
    type: 'pixelation',
    easing: 'easeOut',
    duration: 300,
    strength: 1.0
});
```

### Chaining Effects

```javascript
const glitchSequence = async () => {
    // Noise first
    triggerGlitch({ type: 'noise', duration: 400 });

    // Wait then displacement
    await new Promise(resolve => setTimeout(resolve, 450));
    triggerGlitch({ type: 'displacement', duration: 500 });

    // Wait then chromatic
    await new Promise(resolve => setTimeout(resolve, 550));
    triggerGlitch({ type: 'chromatic', duration: 600 });
};
```

---

## Performance Considerations

### Optimization Tips

1. **Effect Duration**
   - Shorter effects (200-500ms) are less taxing
   - Long effects (>2000ms) can impact frame rate
   - Recommended: 400-800ms for most cases

2. **Strength Values**
   - Lower strength (<0.7) = better performance
   - High strength (>0.9) = more GPU work
   - Use `strength: 0.6-0.8` for balance

3. **Multiple Effects**
   - Limit to 2-3 simultaneous effects
   - Combine similar types for efficiency
   - Avoid triggering during animations

4. **Target Bounds**
   - Small targets = better performance
   - Fullscreen effects are most expensive
   - Use targeted effects when possible

5. **Parameter Values**
   - Lower `pixelSize`, `blockSize` = more computation
   - Higher `waveCount`, `blockCount` = more GPU work
   - Find the minimum values that achieve your desired look

### Performance Metrics

| Effect | GPU Impact | Recommended Strength | Max Simultaneous |
|--------|------------|---------------------|------------------|
| chromatic | Medium | 0.6-0.8 | 1-2 |
| noise | High | 0.5-0.7 | 1 |
| block | Medium-High | 0.7-0.9 | 1-2 |
| displacement | Medium | 0.6-0.8 | 1-2 |
| pixelation | Low-Medium | 0.7-1.0 | 2-3 |
| rgbsplit | Medium | 0.6-0.8 | 1-2 |
| vhs | High | 0.6-0.8 | 1 |

---

## Best Practices

### When to Use Each Effect

**Chromatic (CRT)**
- ✅ Retro terminal interfaces
- ✅ Startup/shutdown sequences
- ✅ Hacker/cyberpunk themes
- ❌ Modern, clean UIs

**Noise Static**
- ✅ Error states
- ✅ Loading screens
- ✅ Interference simulation
- ❌ Subtle interactions

**Block Glitch**
- ✅ Data corruption
- ✅ System failures
- ✅ Error messages
- ❌ Smooth transitions

**Displacement**
- ✅ Signal loss
- ✅ Transitions
- ✅ Instability effects
- ❌ Static displays

**Pixelation**
- ✅ Resolution changes
- ✅ Retro gaming
- ✅ Privacy/censorship
- ❌ Professional interfaces

**RGB Split**
- ✅ Analog video vibes
- ✅ Transitions
- ✅ Action feedback
- ❌ Accessibility-critical UI

**VHS Tracking**
- ✅ Vintage aesthetics
- ✅ Memory/flashback scenes
- ✅ Nostalgic themes
- ❌ Modern applications

### Color Selection

```javascript
// Cyberpunk themes
color: '#00FF41'  // Matrix green
color: '#FF00FF'  // Neon magenta
color: '#00FFFF'  // Cyan

// Warning/error states
color: '#FF3333'  // Red
color: '#FFA500'  // Orange
color: '#FFFF00'  // Yellow

// Retro/vintage
color: '#FFD700'  // Gold
color: '#FF6B6B'  // Coral
color: '#4ECDC4'  // Turquoise
```

### Accessibility

- Provide option to disable effects
- Reduce strength for users with motion sensitivity
- Use shorter durations (200-400ms)
- Avoid rapid flashing (spikeFrequency < 0.1)
- Test with `prefers-reduced-motion` media query

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

triggerGlitch({
    type: 'chromatic',
    duration: prefersReducedMotion ? 200 : 600,
    strength: prefersReducedMotion ? 0.3 : 0.8
});
```

### Testing

```javascript
// Test all effects
const testEffects = () => {
    const effects = ['chromatic', 'noise', 'block', 'displacement', 'pixelation', 'rgbsplit', 'vhs'];

    effects.forEach((effect, index) => {
        setTimeout(() => {
            triggerGlitch({ type: effect, duration: 800 });
        }, index * 1000);
    });
};
```

---

## Troubleshooting

### Common Issues

**Effect not visible:**
- Check `strength` value (should be > 0.3)
- Verify WebGL support in browser
- Ensure canvas is not hidden by CSS
- Check console for WebGL errors

**Performance issues:**
- Reduce effect `strength`
- Decrease `duration`
- Limit simultaneous effects
- Use targeted effects instead of fullscreen

**Colors look wrong:**
- Verify color format is hex (`#RRGGBB`)
- Check color parameter spelling
- Ensure no CSS filters interfering

**Effect cut off:**
- Check target element bounds
- Verify element is visible
- Ensure proper z-index stacking

---

## Additional Resources

- **Main Documentation**: `/docs/GlitchDoc.md` (French)
- **Source Code**: `/cyberdeck/src/opengl/`
- **Shader Files**: `/cyberdeck/src/opengl/shaders/`
- **Effect Controllers**: `/cyberdeck/src/opengl/effects/`

---

**Last Updated**: 2025-11-19
**Version**: 2.0.0
**Effects**: 7 total (4 enhanced, 3 new)

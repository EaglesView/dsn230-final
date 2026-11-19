#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform float u_time;
uniform float u_strength;
uniform vec3 u_color;          // Primary color for tint
uniform vec4 u_targetBounds;   // x, y, width, height in normalized coords
uniform vec2 u_resolution;

// Custom parameters for CRT phosphor glow (with defaults)
uniform float u_phosphorSize;       // Default: 3.0
uniform float u_phosphorSpacing;    // Default: 1.2
uniform float u_bloomIntensity;     // Default: 0.6
uniform float u_scanlineInteraction; // Default: 0.8
uniform float u_colorBleeding;      // Default: 0.3

// Output
out vec4 fragColor;

// Pseudo-random function
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    // Check if current pixel is within target bounds
    vec2 pixelPos = gl_FragCoord.xy / u_resolution;

    if (pixelPos.x < u_targetBounds.x || pixelPos.x > u_targetBounds.x + u_targetBounds.z ||
        pixelPos.y < u_targetBounds.y || pixelPos.y > u_targetBounds.y + u_targetBounds.w) {
        discard; // Don't render outside target area
    }

    // Convert to pixel coordinates for phosphor grid
    vec2 pixelCoord = v_texCoord * u_resolution;

    // Create phosphor grid (RGB subpixel layout)
    vec2 phosphorGrid = mod(pixelCoord, u_phosphorSize * u_phosphorSpacing);
    vec2 phosphorCenter = vec2(u_phosphorSize * u_phosphorSpacing * 0.5);

    // Determine which subpixel (R, G, or B) based on horizontal position
    float subpixelIndex = mod(floor(pixelCoord.x / (u_phosphorSize * u_phosphorSpacing)), 3.0);

    // Calculate distance from phosphor center
    float phosphorDist = length(phosphorGrid - phosphorCenter) / (u_phosphorSize * 0.5);

    // Create circular phosphor dots (smooth falloff)
    float phosphorMask = smoothstep(1.0, 0.7, phosphorDist);

    // RGB phosphor colors based on subpixel position
    vec3 phosphorColor = vec3(0.0);
    if (subpixelIndex < 0.5) {
        // Red phosphor
        phosphorColor = vec3(1.0, u_colorBleeding, u_colorBleeding * 0.5);
    } else if (subpixelIndex < 1.5) {
        // Green phosphor
        phosphorColor = vec3(u_colorBleeding * 0.5, 1.0, u_colorBleeding);
    } else {
        // Blue phosphor
        phosphorColor = vec3(u_colorBleeding, u_colorBleeding * 0.5, 1.0);
    }

    // Apply user color tint to phosphors
    phosphorColor *= u_color;

    // Time-based pulsing
    float pulse = 0.8 + 0.2 * sin(u_time * 2.0);

    // Scanlines (horizontal dark lines)
    float scanlineFreq = 200.0;
    float scanline = sin((v_texCoord.y + u_time * 0.1) * scanlineFreq);
    scanline = smoothstep(-0.5, 0.5, scanline);
    scanline = mix(0.7, 1.0, scanline); // Darken scanlines

    // Scanline interaction with phosphors (makes phosphors brighter between scanlines)
    float scanlineBoost = mix(1.0, 1.0 + u_scanlineInteraction * 0.3, smoothstep(-0.3, 0.3, scanline - 0.85));

    // Add subtle noise/flicker for authenticity
    float flicker = 0.95 + 0.05 * noise(vec2(u_time * 10.0, v_texCoord.y * 100.0));

    // Calculate base phosphor intensity
    float baseIntensity = phosphorMask * pulse * scanlineBoost * flicker;

    // Bloom effect (glow around phosphors)
    float bloomDist = length(phosphorGrid - phosphorCenter) / (u_phosphorSize * 1.5);
    float bloom = exp(-bloomDist * 3.0) * u_bloomIntensity;
    bloom *= (1.0 - phosphorMask); // Only bloom outside the phosphor core

    // Combine phosphor core and bloom
    float totalIntensity = (baseIntensity + bloom) * u_strength;

    // Apply scanline darkening
    totalIntensity *= scanline;

    // Add slight vignette from center for depth
    vec2 center = vec2(0.5, 0.5);
    float vignette = 1.0 - length(v_texCoord - center) * 0.3;

    // Final color
    vec3 finalColor = phosphorColor * totalIntensity * vignette;

    // Alpha channel for blending
    float alpha = totalIntensity * 0.9; // Slightly transparent for better overlay effect

    fragColor = vec4(finalColor, alpha);
}

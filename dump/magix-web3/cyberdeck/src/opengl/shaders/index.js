/**
 * Shader sources as ES6 module exports
 */

export const vertexShader = `#version 300 es
precision highp float;

// Input vertex attributes
in vec2 a_position;
in vec2 a_texCoord;

// Output to fragment shader
out vec2 v_texCoord;

void main() {
    // Pass texture coordinates to fragment shader
    v_texCoord = a_texCoord;

    // Convert from clip space (-1 to 1) to screen space
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const chromaticShader = `#version 300 es
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
`;

export const noiseShader = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform float u_time;
uniform float u_strength;
uniform vec3 u_color;          // Primary color for tint
uniform vec4 u_targetBounds;   // x, y, width, height in normalized coords
uniform vec2 u_resolution;

// Custom parameters for noise static
uniform float u_grainSize;        // Default: 10.0
uniform float u_blockSize;        // Default: 50.0
uniform float u_spikeFrequency;   // Default: 0.05
uniform float u_scanlineSpeed;    // Default: 5.0
uniform float u_interference;     // Default: 0.1

// Output
out vec4 fragColor;

// Pseudo-random noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    // Check if current pixel is within target bounds
    vec2 pixelPos = gl_FragCoord.xy / u_resolution;

    if (pixelPos.x < u_targetBounds.x || pixelPos.x > u_targetBounds.x + u_targetBounds.z ||
        pixelPos.y < u_targetBounds.y || pixelPos.y > u_targetBounds.y + u_targetBounds.w) {
        discard;
    }

    // Generate different noise patterns
    vec2 uv = v_texCoord * u_grainSize;

    // Time-varying seed for flickering
    float timeSeed = floor(u_time * 30.0); // 30 fps flicker

    // Multi-scale noise (grain)
    float n1 = noise(uv * 1.0 + timeSeed);
    float n2 = noise(uv * 5.0 + timeSeed * 0.5);
    float n3 = noise(uv * 20.0 + timeSeed * 0.25);

    // Combine noise layers
    float noiseValue = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // Create digital blocks/pixels
    vec2 blockSizeVec = vec2(u_blockSize, u_blockSize);
    vec2 blockUV = floor(gl_FragCoord.xy / blockSizeVec) * blockSizeVec / u_resolution;
    float blockNoise = random(blockUV + timeSeed);

    // Mix different noise types
    float finalNoise = mix(noiseValue, blockNoise, 0.4);

    // Random intensity spikes (based on spike frequency)
    float spikeThreshold = 1.0 - u_spikeFrequency;
    float spike = step(spikeThreshold, random(vec2(timeSeed)));
    finalNoise += spike * 0.5;

    // Apply strength
    finalNoise *= u_strength;

    // Color tinting with primary color
    vec3 color = mix(vec3(1.0), u_color, 0.7) * finalNoise;

    // Add scanline interference (with controllable speed and intensity)
    float scanline = step(0.5, noise(vec2(v_texCoord.y * 100.0, u_time * u_scanlineSpeed)));
    color += vec3(scanline * u_interference * u_strength);

    fragColor = vec4(color, finalNoise * 0.8);
}
`;

export const blockShader = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform float u_time;
uniform float u_strength;
uniform vec3 u_color;          // Primary color for tint
uniform vec4 u_targetBounds;   // x, y, width, height in normalized coords
uniform vec2 u_resolution;

// Custom parameters for block glitch
uniform float u_blockCount;          // Default: 15.0
uniform float u_displacementRange;   // Default: 0.3
uniform float u_colorBarIntensity;   // Default: 0.7
uniform float u_glitchProbability;   // Default: 0.5
uniform float u_verticalShift;       // Default: 0.5

// Output
out vec4 fragColor;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Check if current pixel is within target bounds
    vec2 pixelPos = gl_FragCoord.xy / u_resolution;

    if (pixelPos.x < u_targetBounds.x || pixelPos.x > u_targetBounds.x + u_targetBounds.z ||
        pixelPos.y < u_targetBounds.y || pixelPos.y > u_targetBounds.y + u_targetBounds.w) {
        discard;
    }

    // Define block parameters
    float timeSeed = floor(u_time * 20.0); // Update rate

    // Calculate which block this pixel belongs to
    float blockY = floor(v_texCoord.y * u_blockCount);
    float blockHeight = 1.0 / u_blockCount;

    // Random value for this block
    float blockRand = random(vec2(blockY, timeSeed));

    // Determine if this block should glitch (based on probability)
    float glitchThreshold = 1.0 - (u_strength * u_glitchProbability);
    float shouldGlitch = step(glitchThreshold, blockRand);

    // Calculate horizontal offset for glitching blocks
    float offset = 0.0;
    if (shouldGlitch > 0.5) {
        float offsetAmount = (random(vec2(blockY + 0.5, timeSeed)) - 0.5) * u_strength * u_displacementRange;
        offset = offsetAmount;
    }

    // Apply offset to texture coordinates
    vec2 glitchedUV = v_texCoord;
    glitchedUV.x += offset;

    // Add vertical displacement to certain blocks
    float verticalShiftAmount = 0.0;
    if (shouldGlitch > 0.5) {
        verticalShiftAmount = (random(vec2(blockY + 1.5, timeSeed)) - 0.5) * blockHeight * u_verticalShift * u_strength;
        glitchedUV.y += verticalShiftAmount;
    }

    // Create color bars in glitched blocks
    vec3 color = vec3(0.0);

    if (shouldGlitch > 0.5) {
        // RGB separation for glitched blocks
        float separation = 0.005 * u_strength;

        float r = u_color.r;
        float g = step(0.3, random(vec2(blockY + 2.0, timeSeed)));
        float b = step(0.7, random(vec2(blockY + 3.0, timeSeed)));

        // Create color with primary color dominance
        color = vec3(r, g * 0.3, b * 0.3) * u_colorBarIntensity;

        // Add horizontal lines within blocks
        float linePattern = step(0.8, fract(glitchedUV.y * u_blockCount * 50.0));
        color += vec3(linePattern * 0.2 * u_colorBarIntensity);

        // Random color shifts
        if (random(vec2(blockY + 4.0, timeSeed)) > 0.7) {
            color = u_color * u_colorBarIntensity;
        }
    }

    // Intensity based on glitch state
    float intensity = shouldGlitch * u_strength;

    // Add some noise to glitched areas
    float noise = random(glitchedUV * 100.0 + timeSeed) * 0.2;
    color += vec3(noise * intensity);

    fragColor = vec4(color, intensity * 0.9);
}
`;

export const displacementShader = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform float u_time;
uniform float u_strength;
uniform vec3 u_color;          // Primary color for tint
uniform vec4 u_targetBounds;   // x, y, width, height in normalized coords
uniform vec2 u_resolution;

// Custom parameters for displacement
uniform float u_waveCount;         // Default: 3.0
uniform float u_waveSpeed;         // Default: 5.0
uniform float u_tearProbability;   // Default: 0.15
uniform float u_jitterAmount;      // Default: 0.05
uniform float u_rgbSplitThreshold; // Default: 0.01

// Output
out vec4 fragColor;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Check if current pixel is within target bounds
    vec2 pixelPos = gl_FragCoord.xy / u_resolution;

    if (pixelPos.x < u_targetBounds.x || pixelPos.x > u_targetBounds.x + u_targetBounds.z ||
        pixelPos.y < u_targetBounds.y || pixelPos.y > u_targetBounds.y + u_targetBounds.w) {
        discard;
    }

    vec2 uv = v_texCoord;

    // Multiple sine waves for complex distortion (configurable wave count and speed)
    float baseFreq = 20.0 * u_waveCount;
    float wave1 = sin(uv.y * baseFreq + u_time * u_waveSpeed) * u_strength * 0.02;
    float wave2 = sin(uv.y * (baseFreq * 2.0) - u_time * (u_waveSpeed * 0.6)) * u_strength * 0.015;
    float wave3 = sin(uv.x * (baseFreq * 1.5) + u_time * (u_waveSpeed * 0.8)) * u_strength * 0.01;

    // Combine waves
    float horizontalDisplacement = wave1 + wave2;
    float verticalDisplacement = wave3;

    // Add random jitter (configurable amount)
    float timeSeed = floor(u_time * 30.0);
    float jitter = (random(vec2(floor(uv.y * 20.0), timeSeed)) - 0.5) * u_strength * u_jitterAmount;

    // Create displaced coordinates
    vec2 displaced = uv;
    displaced.x += horizontalDisplacement + jitter;
    displaced.y += verticalDisplacement;

    // Create "tear" effect - random horizontal slices (configurable probability)
    float sliceY = floor(uv.y * 15.0);
    float tearThreshold = 1.0 - u_tearProbability;
    float shouldTear = step(tearThreshold, random(vec2(sliceY, timeSeed)));

    if (shouldTear > 0.5) {
        float tearOffset = (random(vec2(sliceY + 0.5, timeSeed)) - 0.5) * u_strength * 0.1;
        displaced.x += tearOffset;
    }

    // Calculate color based on displacement
    vec3 color = u_color;

    // Add intensity based on displacement amount
    float displacementAmount = abs(horizontalDisplacement) + abs(verticalDisplacement);
    float intensity = displacementAmount * 10.0 * u_strength;

    // Add some edge detection for torn areas
    if (shouldTear > 0.5) {
        intensity += 0.5;
        // Brighten torn edges
        float edgeDist = abs(fract(uv.y * 15.0) - 0.5);
        if (edgeDist < 0.1) {
            color = mix(color, vec3(1.0), 0.5);
            intensity += 0.3;
        }
    }

    // Add RGB split on heavily displaced areas (configurable threshold)
    if (displacementAmount > u_rgbSplitThreshold) {
        float r = u_color.r;
        float g = 0.3;
        float b = 0.3;
        color = vec3(r, g, b);
    }

    // Pulsing effect
    float pulse = sin(u_time * 8.0) * 0.5 + 0.5;
    intensity = mix(intensity, intensity * pulse, 0.3);

    fragColor = vec4(color * intensity, clamp(intensity, 0.0, 1.0));
}
`;

export const pixelationShader = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform float u_time;
uniform float u_strength;
uniform vec3 u_color;          // Primary color for tint
uniform vec4 u_targetBounds;   // x, y, width, height in normalized coords
uniform vec2 u_resolution;

// Custom parameters for pixelation
uniform float u_pixelSize;      // Default: 8.0
uniform float u_colorDepth;     // Default: 8.0
uniform float u_dithering;      // Default: 0.3

// Output
out vec4 fragColor;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Ordered dithering pattern (Bayer matrix 4x4)
float bayerDither4x4(vec2 position) {
    int x = int(mod(position.x, 4.0));
    int y = int(mod(position.y, 4.0));

    int index = x + y * 4;

    // 4x4 Bayer matrix
    float bayerMatrix[16];
    bayerMatrix[0] = 0.0/16.0;   bayerMatrix[1] = 8.0/16.0;   bayerMatrix[2] = 2.0/16.0;   bayerMatrix[3] = 10.0/16.0;
    bayerMatrix[4] = 12.0/16.0;  bayerMatrix[5] = 4.0/16.0;   bayerMatrix[6] = 14.0/16.0;  bayerMatrix[7] = 6.0/16.0;
    bayerMatrix[8] = 3.0/16.0;   bayerMatrix[9] = 11.0/16.0;  bayerMatrix[10] = 1.0/16.0;  bayerMatrix[11] = 9.0/16.0;
    bayerMatrix[12] = 15.0/16.0; bayerMatrix[13] = 7.0/16.0;  bayerMatrix[14] = 13.0/16.0; bayerMatrix[15] = 5.0/16.0;

    return bayerMatrix[index];
}

void main() {
    // Check if current pixel is within target bounds
    vec2 pixelPos = gl_FragCoord.xy / u_resolution;

    if (pixelPos.x < u_targetBounds.x || pixelPos.x > u_targetBounds.x + u_targetBounds.z ||
        pixelPos.y < u_targetBounds.y || pixelPos.y > u_targetBounds.y + u_targetBounds.w) {
        discard;
    }

    // Calculate effective pixel size based on strength
    float effectivePixelSize = mix(1.0, u_pixelSize, u_strength);

    // Calculate pixelated coordinates
    vec2 pixelCoord = floor(gl_FragCoord.xy / effectivePixelSize) * effectivePixelSize;
    vec2 pixelUV = pixelCoord / u_resolution;

    // Create a seed for this pixel block
    float pixelSeed = random(pixelUV + floor(u_time));

    // Generate base color with primary color influence
    vec3 blockColor = u_color * (0.7 + 0.3 * pixelSeed);

    // Add pulsing effect
    float pulse = sin(u_time * 4.0 + pixelSeed * 6.28318) * 0.5 + 0.5;
    blockColor *= (0.8 + 0.2 * pulse);

    // Reduce color depth (quantize colors)
    float levels = mix(256.0, u_colorDepth, u_strength);
    blockColor = floor(blockColor * levels) / levels;

    // Apply ordered dithering
    float ditherValue = bayerDither4x4(gl_FragCoord.xy);
    float ditherStrength = u_dithering * u_strength;
    blockColor += vec3((ditherValue - 0.5) * ditherStrength);

    // Add pixel grid outline
    vec2 pixelFract = fract(gl_FragCoord.xy / effectivePixelSize);
    float gridLine = step(0.95, max(pixelFract.x, pixelFract.y));
    blockColor = mix(blockColor, blockColor * 0.5, gridLine * u_strength * 0.3);

    // Add some random noise to certain pixels for glitchy effect
    float noiseChance = step(0.95, random(pixelUV + u_time * 0.1));
    blockColor += vec3(noiseChance * 0.5 * u_strength);

    // Calculate intensity
    float intensity = u_strength * 0.9;

    fragColor = vec4(blockColor * intensity, intensity);
}
`;

export const rgbSplitShader = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform float u_time;
uniform float u_strength;
uniform vec3 u_color;          // Primary color for tint
uniform vec4 u_targetBounds;   // x, y, width, height in normalized coords
uniform vec2 u_resolution;

// Custom parameters for RGB split
uniform float u_splitDistance;  // Default: 0.02
uniform float u_angle;          // Default: 0.0 (radians)
uniform float u_waviness;       // Default: 0.5

// Output
out vec4 fragColor;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Check if current pixel is within target bounds
    vec2 pixelPos = gl_FragCoord.xy / u_resolution;

    if (pixelPos.x < u_targetBounds.x || pixelPos.x > u_targetBounds.x + u_targetBounds.z ||
        pixelPos.y < u_targetBounds.y || pixelPos.y > u_targetBounds.y + u_targetBounds.w) {
        discard;
    }

    // Calculate split direction
    vec2 direction = vec2(cos(u_angle), sin(u_angle));

    // Add waviness to the split (makes it more dynamic)
    float wave = sin(v_texCoord.y * 10.0 + u_time * 3.0) * u_waviness * u_strength;
    float waveX = sin(v_texCoord.x * 8.0 + u_time * 2.5) * u_waviness * u_strength * 0.5;

    // Calculate effective split distance with wave modulation
    float effectiveSplit = u_splitDistance * u_strength * (1.0 + wave * 0.3);

    // Time-based pulsing
    float pulse = sin(u_time * 4.0) * 0.5 + 0.5;
    effectiveSplit *= (0.8 + 0.2 * pulse);

    // Create RGB channel offsets in opposite directions
    vec2 offsetR = direction * effectiveSplit * (1.0 + wave);
    vec2 offsetG = vec2(0.0); // Green stays centered (or minimal offset)
    vec2 offsetB = -direction * effectiveSplit * (1.0 + waveX);

    // Add perpendicular offset for more complex separation
    vec2 perpendicular = vec2(-direction.y, direction.x);
    offsetR += perpendicular * wave * 0.01;
    offsetB += perpendicular * waveX * 0.01;

    // Create color channels (we're generating procedural color, not sampling)
    // Red channel - shifted in positive direction
    float redIntensity = 1.0;
    vec2 redPos = v_texCoord + offsetR;
    // Add some variation based on position
    redIntensity *= (0.8 + 0.2 * random(floor(redPos * 50.0) + u_time * 0.1));

    // Green channel - minimal or no shift
    float greenIntensity = 0.6;
    vec2 greenPos = v_texCoord + offsetG;
    greenIntensity *= (0.8 + 0.2 * random(floor(greenPos * 50.0) + u_time * 0.1));

    // Blue channel - shifted in negative direction
    float blueIntensity = 0.6;
    vec2 bluePos = v_texCoord + offsetB;
    blueIntensity *= (0.8 + 0.2 * random(floor(bluePos * 50.0) + u_time * 0.1));

    // Combine channels with primary color influence
    vec3 splitColor = vec3(
        u_color.r * redIntensity,
        u_color.g * greenIntensity * 0.5 + 0.3 * blueIntensity,
        u_color.b * blueIntensity * 0.5 + 0.3 * greenIntensity
    );

    // Add some horizontal scanline distortion
    float scanline = sin((v_texCoord.y + u_time * 0.2) * 150.0 + wave * 50.0);
    scanline = smoothstep(-0.3, 0.3, scanline);
    splitColor *= mix(0.9, 1.0, scanline);

    // Add glitch artifacts on certain horizontal lines
    float lineY = floor(v_texCoord.y * 20.0);
    float shouldGlitch = step(0.9, random(vec2(lineY, floor(u_time * 5.0))));

    if (shouldGlitch > 0.5) {
        // Add color shift to glitched lines
        splitColor.rb = splitColor.br;
        splitColor *= 1.2;
    }

    // Edge glow effect where channels separate
    float separationAmount = length(offsetR) + length(offsetB);
    float edgeGlow = smoothstep(0.0, 0.05, separationAmount) * 0.3;

    splitColor += vec3(edgeGlow) * u_color;

    // Final intensity
    float intensity = u_strength * 0.9;

    fragColor = vec4(splitColor * intensity, intensity);
}
`;

export const vhsTrackingShader = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform float u_time;
uniform float u_strength;
uniform vec3 u_color;          // Primary color for tint
uniform vec4 u_targetBounds;   // x, y, width, height in normalized coords
uniform vec2 u_resolution;

// Custom parameters for VHS tracking
uniform float u_trackingOffset;   // Default: 0.1
uniform float u_noiseIntensity;   // Default: 0.5
uniform float u_chromaBleed;      // Default: 0.7

// Output
out vec4 fragColor;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    // Check if current pixel is within target bounds
    vec2 pixelPos = gl_FragCoord.xy / u_resolution;

    if (pixelPos.x < u_targetBounds.x || pixelPos.x > u_targetBounds.x + u_targetBounds.z ||
        pixelPos.y < u_targetBounds.y || pixelPos.y > u_targetBounds.y + u_targetBounds.w) {
        discard;
    }

    vec2 uv = v_texCoord;

    // VHS tracking errors - vertical rolling
    float trackingNoise = noise(vec2(u_time * 0.5, uv.y * 3.0));
    float trackingShift = (trackingNoise - 0.5) * u_trackingOffset * u_strength;

    // Add horizontal sync issues
    float syncNoise = noise(vec2(uv.y * 5.0, u_time * 2.0));
    float syncShift = (syncNoise - 0.5) * u_trackingOffset * 0.5 * u_strength;

    // Combine tracking errors
    uv.x += trackingShift + syncShift;

    // Create tracking error bands (horizontal stripes that roll vertically)
    float bandPosition = mod(uv.y + u_time * 0.3, 1.0);
    float trackingBand = smoothstep(0.2, 0.25, bandPosition) * smoothstep(0.35, 0.3, bandPosition);

    // Add noise to tracking bands
    float bandNoise = noise(vec2(uv.x * 50.0, bandPosition * 100.0 + u_time));
    trackingBand *= (0.5 + 0.5 * bandNoise);

    // VHS chroma bleed/ghosting
    vec2 chromaOffset = vec2(u_chromaBleed * 0.01 * u_strength, 0.0);

    // Chroma separation (simulating poor color encoding)
    float chromaWave = sin(uv.y * 100.0 + u_time * 5.0);
    chromaOffset.x += chromaWave * 0.005 * u_strength;

    // Create color with chroma bleed
    vec3 color = u_color;

    // Red/Magenta bleed
    vec2 redUV = uv + chromaOffset;
    float redNoise = noise(redUV * 20.0 + u_time * 0.1);
    vec3 redChannel = vec3(u_color.r * (0.9 + 0.1 * redNoise), 0.0, u_color.b * 0.3);

    // Blue/Cyan bleed
    vec2 blueUV = uv - chromaOffset;
    float blueNoise = noise(blueUV * 20.0 + u_time * 0.1);
    vec3 blueChannel = vec3(0.0, u_color.g * 0.3, u_color.b * (0.9 + 0.1 * blueNoise));

    // Combine chroma channels
    color = mix(u_color, redChannel + blueChannel, u_chromaBleed * u_strength * 0.5);

    // Add VHS noise/static
    float staticNoise = random(uv * 100.0 + u_time * 10.0);
    float noiseAmount = u_noiseIntensity * u_strength * 0.3;

    // More noise in tracking error bands
    noiseAmount += trackingBand * u_noiseIntensity * u_strength * 0.5;

    color += vec3(staticNoise * noiseAmount);

    // Add horizontal sync bars (white/colored bars that occasionally appear)
    float syncBar = step(0.98, random(vec2(floor(uv.y * 30.0), floor(u_time * 3.0))));
    if (syncBar > 0.5) {
        color = mix(color, vec3(1.0, 0.9, 0.8), 0.7 * u_strength);
    }

    // Add tape damage/dropout (black horizontal lines)
    float dropout = step(0.95, random(vec2(floor(uv.y * 50.0), floor(u_time * 2.0))));
    color *= (1.0 - dropout * 0.8 * u_strength);

    // Scanlines (typical of analog video)
    float scanline = sin(uv.y * u_resolution.y * 2.0);
    scanline = mix(1.0, 0.9, smoothstep(-1.0, 1.0, scanline));
    color *= scanline;

    // Add tape saturation/oversaturation effect
    float saturation = 1.0 + u_strength * 0.2;
    color *= saturation;

    // Vignette effect (typical of old cameras/VHS)
    vec2 vignetteUV = uv * 2.0 - 1.0;
    float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.2;
    color *= vignette;

    // Add tracking band overlay
    color += vec3(trackingBand * 0.5);

    // Final intensity
    float intensity = u_strength * 0.85;

    fragColor = vec4(color * intensity, intensity);
}
`;

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

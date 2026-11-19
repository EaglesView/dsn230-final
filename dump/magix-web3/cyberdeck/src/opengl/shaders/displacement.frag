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

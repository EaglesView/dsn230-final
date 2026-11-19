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

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

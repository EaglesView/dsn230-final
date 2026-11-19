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

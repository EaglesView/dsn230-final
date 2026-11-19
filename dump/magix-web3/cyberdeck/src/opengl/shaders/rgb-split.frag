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

#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_chromaticTexture;
uniform sampler2D u_noiseTexture;
uniform sampler2D u_blockTexture;
uniform sampler2D u_displacementTexture;

uniform bool u_usesChromatic;
uniform bool u_usesNoise;
uniform bool u_usesBlock;
uniform bool u_usesDisplacement;

uniform float u_time;
uniform vec2 u_resolution;

// Output
out vec4 fragColor;

void main() {
    vec4 finalColor = vec4(0.0);
    float totalAlpha = 0.0;

    // Sample each effect texture if enabled
    if (u_usesChromatic) {
        vec4 chromatic = texture(u_chromaticTexture, v_texCoord);
        finalColor += chromatic;
        totalAlpha += chromatic.a;
    }

    if (u_usesNoise) {
        vec4 noise = texture(u_noiseTexture, v_texCoord);
        finalColor += noise;
        totalAlpha += noise.a;
    }

    if (u_usesBlock) {
        vec4 block = texture(u_blockTexture, v_texCoord);
        finalColor += block;
        totalAlpha += block.a;
    }

    if (u_usesDisplacement) {
        vec4 displacement = texture(u_displacementTexture, v_texCoord);
        finalColor += displacement;
        totalAlpha += displacement.a;
    }

    // Normalize if multiple effects are active
    if (totalAlpha > 1.0) {
        finalColor.rgb /= totalAlpha;
        finalColor.a = min(totalAlpha, 1.0);
    } else {
        finalColor.a = totalAlpha;
    }

    fragColor = finalColor;
}

#version 300 es
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

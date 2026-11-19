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

export const chromaticShader = `VERTEX

# Add chromatic shader with #version on first line
echo -n "#version 300 es" >> index_final.js
tail -n +2 chromatic-aberration.frag >> index_final.js
echo '`;' >> index_final.js

echo "" >> index_final.js
echo -n "export const noiseShader = \`#version 300 es" >> index_final.js
tail -n +2 noise-static.frag >> index_final.js
echo '`;' >> index_final.js

echo "" >> index_final.js
echo -n "export const blockShader = \`#version 300 es" >> index_final.js
tail -n +2 block-glitch.frag >> index_final.js
echo '`;' >> index_final.js

echo "" >> index_final.js
echo -n "export const displacementShader = \`#version 300 es" >> index_final.js
tail -n +2 displacement.frag >> index_final.js
echo '`;' >> index_final.js

echo "" >> index_final.js
echo -n "export const pixelationShader = \`#version 300 es" >> index_final.js
tail -n +2 pixelation.frag >> index_final.js
echo '`;' >> index_final.js

echo "" >> index_final.js
echo -n "export const rgbSplitShader = \`#version 300 es" >> index_final.js
tail -n +2 rgb-split.frag >> index_final.js
echo '`;' >> index_final.js

echo "" >> index_final.js
echo -n "export const vhsTrackingShader = \`#version 300 es" >> index_final.js
tail -n +2 vhs-tracking.frag >> index_final.js
echo '`;' >> index_final.js

mv index_final.js index.js
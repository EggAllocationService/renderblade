#version 300 es
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uNoise;

in vec2 v_uv;

out vec4 color;


void main() {
    // tile uNoise across the screen
    vec2 ratio = vec2(textureSize(uColor, 0)) / vec2(textureSize(uNoise, 0));
    color = texture(uColor, v_uv);
    float noise = texture(uNoise, v_uv * ratio).x - 0.08;
    if (color.r < noise) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        color = vec4(1.0, 1.0, 1.0, 1.0);
    }

}